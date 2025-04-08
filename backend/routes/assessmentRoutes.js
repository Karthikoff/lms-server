const express = require("express");
const { 
  createAssessment, 
  getInstructorAssessments, 
  getCourseAssessments, 
  getStudentCourseAssessments,
  submitExam,
  getStudentExam,
  getCourseWiseStudentMarks
} = require("../controllers/assessmentController");

const { protect, verifyInstructor } = require("../middleware/authMiddleware");


const router = express.Router();

// 🔹 Instructor Routes
router.post("/", protect, verifyInstructor, createAssessment);  // Create assessment
router.get("/instructor", protect, verifyInstructor, getInstructorAssessments); // Instructor-specific assessments
router.get("/course/:courseId", protect, verifyInstructor, getCourseAssessments);

// 🔹 Student Route
router.get("/student/course/:courseId", protect, getStudentCourseAssessments);  // Students fetch assessments (No role check, just token)
// New route for students to start the exam
router.get("/student/exam/:assessmentId", protect, getStudentExam);  // Student fetches assessment questions for a specific exam
router.post("/student/exam/:assessmentId/submit", protect, submitExam);


// 🔹 Instructor fetches student marks by course
router.get("/instructor/course/:courseId/results", protect, getCourseWiseStudentMarks);




module.exports = router;
