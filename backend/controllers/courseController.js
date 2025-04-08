const Course = require("../models/Course");
const User = require("../models/User"); // ✅ Import User Model

exports.getInstructorCourses = async (req, res) => {
    try {
      const instructorId = req.user.id; // Extract instructor ID from auth middleware
  
      console.log("Instructor ID from token:", instructorId); // Debugging log
  
      // Try querying by instructorId (if stored as an ObjectId)
      let courses = await Course.find({ instructorId });
  
      // If no courses found, try searching by instructorName
      if (!courses || courses.length === 0) {
        courses = await Course.find({ instructorName: req.user.name }); // If stored as name
      }
  
      if (!courses || courses.length === 0) {
        return res.status(404).json({ success: false, message: "No courses found for this instructor" });
      }
  
      res.status(200).json({ success: true, courses });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

// ✅ Get Students Enrolled in a Course
// ✅ Get Students Enrolled in a Course
exports.getCourseStudents = async (req, res) => {
    try {
      const { courseId } = req.params;
  
      // Find students who have enrolled in this course
      const students = await User.find(
        { enrolledCourses: courseId, role: "student" },
        "name email"
      );
  
      if (!students || students.length === 0) {
        return res.status(404).json({ success: false, message: "No students enrolled in this course" });
      }
  
      res.status(200).json({ success: true, students });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };