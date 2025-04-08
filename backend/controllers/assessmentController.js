const Assessment = require("../models/Assessment");
const Course = require("../models/Course");
const AssessmentResult = require("../models/AssessmentResult");
const StudentAssessment = require('../models/StudentAssessment');
const User = require("../models/User"); // ✅ Ensure User model is imported
  

exports.createAssessment = async (req, res) => {
    const { courseId, instructions, timer, questions, isCertificateEnabled } = req.body;
  
    try {
      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(400).json({ message: "Course not found" });
      }
  
      // Check if the instructor is authorized
      if (course.instructorName !== req.user.name) {
        return res.status(403).json({ message: "You are not authorized to create assessments for this course" });
      }
  
      // Count existing assessments for this course
      const assessmentCount = await Assessment.countDocuments({ courseId });
      const assessmentNumber = assessmentCount + 1; // Next assessment number
  
      // Create new assessment
      const newAssessment = new Assessment({
        courseId,
        instructorId: req.user.id,
        instructions,
        timer,
        questions,
        isCertificateEnabled,
        assessmentNumber, // Store assessment number
      });
  
      await newAssessment.save();
      res.status(201).json({ success: true, assessment: newAssessment });
    } catch (err) {
      res.status(500).json({ message: "Error creating assessment", error: err });
    }
  };

  exports.getInstructorAssessments = async (req, res) => {
    try {
        // Fetch assessments created by the logged-in instructor
        const assessments = await Assessment.find({ instructorId: req.user.id });

        if (!assessments.length) {
            return res.status(404).json({ message: "No assessments found" });
        }

        res.status(200).json({ success: true, assessments });
    } catch (err) {
        res.status(500).json({ message: "Error fetching assessments", error: err });
    }
};

exports.getCourseAssessments = async (req, res) => {
    const { courseId } = req.params; // Get courseId from URL params

    try {
        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if the instructor is authorized to view assessments for this course
        if (course.instructorName !== req.user.name) {
            return res.status(403).json({ message: "You are not authorized to view assessments for this course" });
        }

        // Fetch assessments for the given course
        const assessments = await Assessment.find({ courseId });

        if (!assessments.length) {
            return res.status(404).json({ message: "No assessments found for this course" });
        }

        res.status(200).json({ success: true, assessments });
    } catch (err) {
        res.status(500).json({ message: "Error fetching assessments", error: err });
    }
};


exports.getStudentAssessments = async (req, res) => {
  try {
    console.log("🔹 Request received for student assessments");
    console.log("🔹 User from request:", req.user);

    if (!req.user) {
      console.log("❌ Access Denied: No user attached to request");
      return res.status(401).json({ message: "Access Denied: No user data" });
    }

    // Fetch user and populate enrolled courses
    const user = await User.findById(req.user.id).populate("enrolledCourses");

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.enrolledCourses || user.enrolledCourses.length === 0) {
      console.log("❌ No enrolled courses found for user");
      return res.status(404).json({ message: "No enrolled courses found" });
    }

    const enrolledCourseIds = user.enrolledCourses.map(course => course._id);
    console.log("🔹 Enrolled Course IDs:", enrolledCourseIds);

    // Check if assessments exist for the enrolled courses
    const assessments = await Assessment.find({ courseId: { $in: enrolledCourseIds } });
    console.log("🔹 Assessment Query Result:", assessments);

    if (!assessments || assessments.length === 0) {
      console.log("❌ No assessments found for enrolled courses");
      return res.status(404).json({ message: "No assessments found for your enrolled courses" });
    }

    console.log("✅ Assessments fetched successfully:", assessments.length);
    res.status(200).json({ success: true, assessments });

  } catch (err) {
    console.error("❌ Error fetching assessments:", err.message);
    res.status(500).json({ message: "Error fetching assessments", error: err.message });
  }
};


exports.getStudentCourseAssessments = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Fetch user and enrolled courses
    const user = await User.findById(req.user.id).populate("enrolledCourses");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the student is enrolled in the given course
    const isEnrolled = user.enrolledCourses.some(course => course._id.toString() === courseId);

    if (!isEnrolled) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Fetch assessments for the given course
    const assessments = await Assessment.find({ courseId });

    if (!assessments.length) {
      return res.status(404).json({ message: "No assessments found for this course" });
    }

    res.status(200).json({ success: true, assessments });

  } catch (err) {
    console.error("❌ Error fetching course assessments:", err.message);
    res.status(500).json({ message: "Error fetching course assessments", error: err.message });
  }
};


exports.getStudentExam = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    // Fetch assessment details
    const assessment = await Assessment.findById(assessmentId).populate('questions.options');

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Ensure the student is enrolled in the course for this assessment
    const user = await User.findById(req.user.id).populate("enrolledCourses");
    const isEnrolled = user.enrolledCourses.some(course => course._id.toString() === assessment.courseId.toString());

    if (!isEnrolled) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Return assessment details along with questions
    res.status(200).json({ success: true, assessment });

  } catch (err) {
    console.error("❌ Error fetching exam:", err.message);
    res.status(500).json({ message: "Error fetching exam", error: err.message });
  }
};
// exports.submitExam = async (req, res) => {
//   try {
//     console.log("Received Request Body:", req.body); // Debugging

//     const { assessmentId } = req.params;
//     const { answers } = req.body;

//     // ✅ Ensure `answers` is an array before using `.forEach()`
//     if (!Array.isArray(answers) || answers.length === 0) {
//       return res.status(400).json({ message: "Invalid answers format. Must be a non-empty array." });
//     }

//     const assessment = await Assessment.findById(assessmentId).populate('questions');
//     if (!assessment) {
//       return res.status(404).json({ message: "Assessment not found" });
//     }

//     let totalMarks = 0;
//     let obtainedMarks = 0;

//     answers.forEach((answer) => {
//       const question = assessment.questions.find(q => q._id.toString() === answer.questionId);
//       console.log("Processing Question:", question);

//       if (question) {
//         const correctOption = question.options.find(opt => opt.isCorrect && opt._id.toString() === answer.optionId);
//         console.log("Submitted Option ID:", answer.optionId);
//         console.log("Correct Option IDs:", question.options.filter(opt => opt.isCorrect).map(opt => opt._id.toString()));

//         if (correctOption) {
//           obtainedMarks += question.marks;
//         }
//         totalMarks += question.marks;
//       }
//     });

//     const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

//     res.status(200).json({
//       success: true,
//       message: `Exam submitted. You scored ${obtainedMarks}/${totalMarks} (${percentage.toFixed(2)}%)`,
//     });

//   } catch (err) {
//     console.error("❌ Error submitting exam:", err.message);
//     res.status(500).json({ message: "Error submitting exam", error: err.message });
//   }
// };

exports.submitExam = async (req, res) => {
  try {
    console.log("Received Request Body:", req.body);

    const { assessmentId } = req.params;
    const { answers } = req.body;
    const studentId = req.user.id; // Ensure req.user is set via authentication

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Invalid answers format. Must be a non-empty array." });
    }

    // Check if the student has already submitted the exam
    const existingResult = await AssessmentResult.findOne({ studentId, assessmentId });
    if (existingResult) {
      return res.status(400).json({ message: "You have already submitted this exam." });
    }

    const assessment = await Assessment.findById(assessmentId).populate("questions");
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    let totalMarks = 0;
    let obtainedMarks = 0;

    answers.forEach((answer) => {
      const question = assessment.questions.find(q => q._id.toString() === answer.questionId);
      if (question) {
        const correctOption = question.options.find(opt => opt.isCorrect && opt._id.toString() === answer.optionId);
        if (correctOption) {
          obtainedMarks += question.marks;
        }
        totalMarks += question.marks;
      }
    });

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    const certificateEligible = percentage >= 60; // Certificate if score is 60% or above

    // Store result in DB
    const examResult = new AssessmentResult({
      studentId,
      assessmentId,
      courseId: assessment.courseId,
      score: obtainedMarks,
      totalMarks,
      certificateEligible,
    });

    await examResult.save();

    res.status(200).json({
      success: true,
      message: `Exam submitted successfully! You scored ${obtainedMarks}/${totalMarks} (${percentage.toFixed(2)}%)`,
      result: examResult,
    });

  } catch (err) {
    console.error("❌ Error submitting exam:", err.message);
    res.status(500).json({ message: "Error submitting exam", error: err.message });
  }
};

// // ✅ Fetch student results
// exports.getStudentResults = async (req, res) => {
//   try {
//     const studentId = req.user.id;

//     const results = await AssessmentResult.find({ studentId })
//       .populate("assessmentId", "title")
//       .populate("courseId", "name");

//     res.status(200).json({ success: true, results });
//   } catch (error) {
//     console.error("Error fetching student results:", error.message);
//     res.status(500).json({ message: "Error fetching results", error: error.message });
//   }
// };

// exports.getStudentEnrolledResults = async (req, res) => {
//   try {
//     const studentId = req.user.id;
//     const student = await User.findById(studentId).select("enrolledCourses");

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     const results = await AssessmentResult.find({
//       studentId,
//       courseId: { $in: student.enrolledCourses },
//     })
//       .populate("assessmentId", "title")
//       .populate("courseId", "name");

//     res.status(200).json({ success: true, results });
//   } catch (error) {
//     console.error("Error fetching student enrolled results:", error.message);
//     res.status(500).json({ message: "Error fetching results", error: error.message });
//   }
// };

// ✅ Fetch student marks course-wise
// exports.getCourseWiseStudentMarks = async (req, res) => {
//   try {
//     const instructorId = req.user.id; // Logged-in instructor
//     const courseId = req.params.courseId; // Course ID from request

//     // 🔹 Check if instructor is authorized
//     const course = await Course.findById(courseId);
//     if (!course) {
//       return res.status(404).json({ message: "Course not found" });
//     }
//     if (course.instructorName !== req.user.name) {
//       return res.status(403).json({ message: "Not authorized to view results for this course" });
//     }

//     // 🔹 Fetch student assessment results for this course
//     const results = await AssessmentResult.find({ courseId })
//       .populate("studentId", "name") // Fetch student names
//       .populate("assessmentId", "title assessmentNumber") // Fetch assessment title & number

//     res.status(200).json({ success: true, courseId, results });
//   } catch (error) {
//     console.error("Error fetching student marks:", error.message);
//     res.status(500).json({ message: "Error fetching student marks", error: error.message });
//   }
// };

exports.getCourseWiseStudentMarks = async (req, res) => {
  try {
      const { courseId } = req.params;

      // Check if course exists
      const course = await Course.findById(courseId);
      console.log("🔹 Course Data:", course);  // Debugging

      if (!course) {
          return res.status(404).json({ message: "Course not found" });
      }

      // Check if instructor is authorized
      if (course.instructorId && course.instructorId.toString() !== req.user.id) {
          return res.status(403).json({ message: "Not authorized to view this course results" });
      }

      // Fetch student results for this course
      const results = await AssessmentResult.find({ courseId })
          .populate("studentId", "name")
          .populate("assessmentId", "title assessmentNumber");

      res.status(200).json({ success: true, results });
  } catch (error) {
      console.error("❌ Error fetching course-wise student marks:", error);
      res.status(500).json({ message: "Error fetching results", error: error.message });
  }
};
