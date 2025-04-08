const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Course = require("../models/Course");

// ✅ Mark Attendance (Instructor Only)
exports.markAttendance = async (req, res) => {
  try {
    console.log("Received Data:", req.body); // 🚀 Debugging Line

    const { courseId, studentAttendances } = req.body;
    const instructorId = req.user.id;

    if (!courseId || !studentAttendances || !Array.isArray(studentAttendances)) {
      console.log("❌ Invalid Data: ", { courseId, studentAttendances });
      return res.status(400).json({ success: false, message: "Invalid data provided" });
    }

    // ✅ Ensure instructor is teaching this course
    const course = await Course.findById(courseId);
    if (!course || course.instructorName !== req.user.name) {
      return res.status(403).json({ success: false, message: "You are not the instructor for this course" });
    }

    // ✅ Prepare attendance records
    const attendance = new Attendance({
      courseId,
      instructorId,
      students: studentAttendances.map((s) => ({
        studentId: s.studentId,
        status: s.status.toLowerCase(),
      })),
    });

    await attendance.save();

    res.status(201).json({ success: true, message: "Attendance marked successfully!" });
  } catch (error) {
    console.log("❌ Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getAttendanceRecords = async (req, res) => {
  try {
    const { courseId } = req.params;

    // ✅ Validate Course ID
    if (!courseId) {
      return res.status(400).json({ success: false, message: "Course ID is required" });
    }

    // ✅ Fetch attendance records
    const attendanceRecords = await Attendance.find({ courseId })
      .populate("students.studentId", "name email")
      .sort({ date: -1 }); // Sort by latest date first

    if (!attendanceRecords.length) {
      return res.status(404).json({ success: false, message: "No attendance records found" });
    }

    res.status(200).json({ success: true, attendanceRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getStudentAttendance = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // ✅ Validate Inputs
    if (!courseId || !studentId) {
      return res.status(400).json({ success: false, message: "Course ID and Student ID are required" });
    }

    // ✅ Fetch attendance records for this student
    const attendanceRecords = await Attendance.find({ courseId, "students.studentId": studentId });

    if (!attendanceRecords.length) {
      return res.status(404).json({ success: false, message: "No attendance records found for this student" });
    }

    // ✅ Calculate attendance percentage
    let totalSessions = attendanceRecords.length;
    let presentCount = attendanceRecords.reduce((count, record) => {
      return count + record.students.filter(s => s.studentId.toString() === studentId && s.status === "present").length;
    }, 0);

    let attendancePercentage = ((presentCount / totalSessions) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      studentId,
      courseId,
      totalSessions,
      presentCount,
      attendancePercentage: `${attendancePercentage}%`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAttendancePercentage = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id; // ✅ Get student ID from token

    // ✅ Get all attendance records for the student in this course
    const attendanceRecords = await Attendance.find({ courseId, "students.studentId": studentId });

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({ success: false, message: "No attendance records found" });
    }

    let totalClasses = attendanceRecords.length;
    let attendedClasses = attendanceRecords.filter(record =>
      record.students.some(s => s.studentId.toString() === studentId && s.status === "present")
    ).length;

    let absentDates = attendanceRecords
      .filter(record => record.students.some(s => s.studentId.toString() === studentId && s.status === "absent"))
      .map(record => record.date);

    let percentage = (attendedClasses / totalClasses) * 100;

    res.status(200).json({
      success: true,
      percentage: percentage.toFixed(2),
      totalClasses,
      attendedClasses,
      absentDates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};