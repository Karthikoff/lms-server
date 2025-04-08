const Exam = require("../models/Exam");
const Course = require("../models/Course");
const Certificate = require("../models/Certificate");

const ExamResult = require("../models/ExamResult");
const User = require("../models/User"); // ✅ Ensure User model is imported

const cloudinary = require("cloudinary").v2;


// ✅ Cloudinary Configuration (already in your backend)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Exam
exports.createExam = async (req, res) => {
  const { courseId, instructions, timer, questions, isCertificateEnabled } = req.body;

  try {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Course not found" });
    }

    // Check if the instructor is authorized
    if (course.instructorName !== req.user.name) {
      return res.status(403).json({ message: "You are not authorized to create exams for this course" });
    }

    // Count existing exams for this course
    const examCount = await Exam.countDocuments({ courseId });
    const examNumber = examCount + 1; // Next exam number

    // Create new exam
    const newExam = new Exam({
      courseId,
      instructorId: req.user.id,
      instructions,
      timer,
      questions,
      isCertificateEnabled,
      examNumber, // Store exam number
    });

    await newExam.save();
    res.status(201).json({ success: true, exam: newExam });
  } catch (err) {
    res.status(500).json({ message: "Error creating exam", error: err });
  }
};

// Get exams created by instructor
exports.getInstructorExams = async (req, res) => {
  try {
    const exams = await Exam.find({ instructorId: req.user.id });

    if (!exams.length) {
      return res.status(404).json({ message: "No exams found" });
    }

    res.status(200).json({ success: true, exams });
  } catch (err) {
    res.status(500).json({ message: "Error fetching exams", error: err });
  }
};

exports.getCourseExams = async (req, res) => {
    const { courseId } = req.params;
  
    try {
      // Check if the course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      // Check instructor authorization
      if (course.instructorName !== req.user.name) {
        return res.status(403).json({ message: "You are not authorized to view exams for this course" });
      }
  
      // Fetch exams for the course
      const exams = await Exam.find({ courseId });
  
      if (!exams.length) {
        return res.status(404).json({ message: "No exams found for this course" });
      }
  
      res.status(200).json({ success: true, exams });
    } catch (err) {
      res.status(500).json({ message: "Error fetching exams", error: err });
    }
  };

  exports.getStudentExams = async (req, res) => {
    try {
      console.log("🔹 Request received for student exams");
      console.log("🔹 User from request:", req.user);
  
      if (!req.user) {
        console.log("❌ Access Denied: No user attached to request");
        return res.status(401).json({ message: "Access Denied: No user data" });
      }
  
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
  
      const exams = await Exam.find({ courseId: { $in: enrolledCourseIds } });
      console.log("🔹 Exam Query Result:", exams);
  
      if (!exams || exams.length === 0) {
        console.log("❌ No exams found for enrolled courses");
        return res.status(404).json({ message: "No exams found for your enrolled courses" });
      }
  
      console.log("✅ Exams fetched successfully:", exams.length);
      res.status(200).json({ success: true, exams });
  
    } catch (err) {
      console.error("❌ Error fetching exams:", err.message);
      res.status(500).json({ message: "Error fetching exams", error: err.message });
    }
  };
  
  exports.getStudentCourseExams = async (req, res) => {
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
  
      // Fetch exams for the given course
      const exams = await Exam.find({ courseId });
  
      if (!exams.length) {
        return res.status(404).json({ message: "No exams found for this course" });
      }
  
      res.status(200).json({ success: true, exams });
  
    } catch (err) {
      console.error("❌ Error fetching course exams:", err.message);
      res.status(500).json({ message: "Error fetching course exams", error: err.message });
    }
  };

  exports.getStudentExam = async (req, res) => {
    try {
      const { examId } = req.params;
  
      // Fetch exam details
      const exam = await Exam.findById(examId);
  
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
  
      // Ensure the student is enrolled in the course for this exam
      const user = await User.findById(req.user.id).populate("enrolledCourses");
      const isEnrolled = user.enrolledCourses.some(course => course._id.toString() === exam.courseId.toString());
  
      if (!isEnrolled) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }
  
      // Return exam details along with questions
      res.status(200).json({ success: true, exam });
  
    } catch (err) {
      console.error("❌ Error fetching exam:", err.message);
      res.status(500).json({ message: "Error fetching exam", error: err.message });
    }
  };
  
  exports.submitExam = async (req, res) => {
    try {
      const { examId } = req.params;
      const { answers } = req.body;
      const studentId = req.user.id;
  
      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: "Invalid answers format." });
      }
  
      const exam = await Exam.findById(examId).populate("questions");
      if (!exam) return res.status(404).json({ message: "Exam not found" });
  
      const previousAttempts = await ExamResult.find({ studentId, examId });
  
      if (previousAttempts.length >= 3) {
        return res.status(400).json({ message: "You have exceeded the maximum number of attempts (3)" });
      }
  
      let totalMarks = 0;
      let obtainedMarks = 0;
  
      answers.forEach((answer) => {
        const question = exam.questions.find(q => q._id.toString() === answer.questionId);
        if (!question) return;
  
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption && correctOption._id.toString() === answer.optionId) {
          obtainedMarks += question.marks;
        }
        totalMarks += question.marks;
      });
  
      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
      const certificateEligible = percentage >= 60 && exam.isCertificateEnabled;
  
      // Save exam result
      const result = new ExamResult({
        studentId,
        examId,
        courseId: exam.courseId,
        score: obtainedMarks,
        totalMarks,
        certificateEligible,
      });
      await result.save();
  
      // Send certificate data instead of generating it
      const student = await User.findById(studentId);
      const course = await Course.findById(exam.courseId);
  
      const certificateData = certificateEligible
        ? {
            studentName: student.name,
            courseName: course.title,
            score: obtainedMarks,
            percentage: percentage.toFixed(2),
            eligible: true,
          }
        : { eligible: false };
  
      res.status(200).json({
        success: true,
        message: `Submitted! You scored ${obtainedMarks}/${totalMarks} (${percentage.toFixed(2)}%)`,
        attemptsUsed: previousAttempts.length + 1,
        certificateData,
      });
  
    } catch (err) {
      console.error("❌ Error submitting exam:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  };
  
  

  exports.getCourseWiseStudentMarks = async (req, res) => {
    try {
      const { courseId } = req.params;
  
      // Check if course exists
      const course = await Course.findById(courseId);
      console.log("🔹 Course Data:", course); // Debugging
  
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      // Check if instructor is authorized
      if (course.instructorId && course.instructorId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this course results" });
      }
  
      // Fetch student results for this course
      const results = await ExamResult.find({ courseId })
        .populate("studentId", "name")
        .populate("examId", "title examNumber");
  
      res.status(200).json({ success: true, results });
  
    } catch (error) {
      console.error("❌ Error fetching course-wise student marks:", error);
      res.status(500).json({ message: "Error fetching results", error: error.message });
    }
  };

  exports.saveCertificate = async (req, res) => {
    try {
      const { examId } = req.params;
      const { certificateUrl } = req.body;
      const studentId = req.user.id;
  
      if (!certificateUrl) {
        return res.status(400).json({ message: "Certificate URL is required." });
      }
  
      // Check if the student has already passed and is eligible for a certificate
      const result = await ExamResult.findOne({ studentId, examId });
  
      if (!result || !result.certificateEligible) {
        return res.status(403).json({ message: "You are not eligible for a certificate." });
      }
  
      // Check if a certificate already exists
      let certificate = await Certificate.findOne({ studentId, examId });
  
      if (!certificate) {
        certificate = new Certificate({
          studentId,
          courseId: result.courseId,
          examId,
          cloudinaryUrl: certificateUrl,
        });
  
        await certificate.save();
      } else {
        certificate.cloudinaryUrl = certificateUrl;
        await certificate.save();
      }
  
      res.status(200).json({ success: true, message: "Certificate saved successfully!" });
  
    } catch (err) {
      console.error("❌ Error saving certificate:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  };
  

  // 🎯 Upload Certificate API
exports.uploadCertificate = async (req, res) => {
  try {
    const { studentId, examId, certificateImage } = req.body;

    if (!certificateImage) {
      return res.status(400).json({ success: false, message: "No certificate image provided." });
    }

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(certificateImage, {
      folder: "certificates",
      resource_type: "image",
    });

    // ✅ Save the certificate URL in the database
    await ExamResult.findOneAndUpdate(
      { studentId, examId },
      { certificateUrl: result.secure_url },
      { new: true }
    );

    res.json({ success: true, certificateUrl: result.secure_url });

  } catch (error) {
    console.error("Error uploading certificate:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// exports.getCourseWiseExamMarks = async (req, res) => {
//   try {
//     const { courseId } = req.params;
//     console.log("🔍 Fetching course by ID:", courseId);

//     const course = await Course.findById(courseId);
//     console.log("📘 Course Data:", course);

//     if (!course) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     if (course.instructorId && course.instructorId.toString() !== req.user.id) {
//       return res.status(403).json({ message: "Not authorized to view this course results" });
//     }

//     console.log("✅ Authorization passed. Fetching results...");

//     const results = await ExamResult.find({ courseId })
//       .populate("studentId", "name email")
//       .populate("examId", "title examNumber");

//     console.log("✅ Results fetched. Sending response.");
//     res.status(200).json({ success: true, results });
//   } catch (error) {
//     console.error("❌ Error fetching course-wise exam marks:", error);
//     res.status(500).json({ message: "Error fetching exam results", error: error.message });
//   }
// };


exports.getCourseWiseExamMarks = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate the course
    const course = await Course.findById(courseId);
    console.log("📘 Course Data:", course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Authorization check
    if (course.instructorId && course.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this course results" });
    }

    // Fetch all exam results for this course
    const results = await ExamResult.find({ courseId })
      .populate("studentId", "name email") // Include student info
      .populate("examId", "title examNumber"); // Include exam info

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("❌ Error fetching course-wise exam marks:", error);
    res.status(500).json({ message: "Error fetching exam results", error: error.message });
  }
};
