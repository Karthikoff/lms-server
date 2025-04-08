const express = require("express");
const {
  createExam,
  getInstructorExams,
  getCourseExams,
  getStudentCourseExams,
  getStudentExam,
  submitExam,
  getCourseWiseStudentMarks,
  saveCertificate,
  uploadCertificate,
  getCourseWiseExamMarks
} = require("../controllers/examController");

const { protect, verifyInstructor } = require("../middleware/authMiddleware");

const router = express.Router();

// 🔹 Instructor Routes
router.post("/", protect, verifyInstructor, createExam);  // Create exam
router.get("/instructor", protect, verifyInstructor, getInstructorExams); // Instructor-specific exams
router.get("/course/:courseId", protect, verifyInstructor, getCourseExams); // Exams for a specific course

// 🔹 Student Routes
router.get("/student/course/:courseId", protect, getStudentCourseExams); // Student sees exams for a course
router.get("/student/exam/:examId", protect, getStudentExam); // Fetch specific exam questions for the student
router.post("/student/exam/:examId/submit", protect, submitExam); // Student submits answers
router.post("/student/exam/:examId/certificate", protect, saveCertificate);
router.post("/student/upload-certificate", protect, uploadCertificate);





// 🔹 Instructor fetches student marks by course
router.get("/instructor/course/:courseId/results", protect, getCourseWiseStudentMarks);

router.get("/instructor/course/:courseId/exam-results", protect, getCourseWiseExamMarks);



module.exports = router;
