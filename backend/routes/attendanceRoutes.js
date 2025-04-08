const express = require("express");
const { protect } = require("../middleware/authMiddleware"); // ✅ Ensure this is correct
const {
  markAttendance,  // ✅ Make sure this function exists in attendanceController.js
  getAttendanceRecords,
  getStudentAttendance,
} = require("../controllers/attendanceController");
const { getAttendancePercentage } = require("../controllers/attendanceController"); // ✅ Import this function

const router = express.Router();

// ✅ Mark Attendance
router.post("/mark", protect, markAttendance);

// ✅ Get Attendance Records
router.get("/:courseId", protect, getAttendanceRecords);

// ✅ Get Student Attendance Percentage
router.get("/:courseId/student/:studentId", protect, getStudentAttendance);

router.get("/percentage/:courseId", protect, getAttendancePercentage);

module.exports = router;
