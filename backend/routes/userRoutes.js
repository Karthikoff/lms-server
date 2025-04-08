const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// ✅ Get Enrolled Courses for Logged-in User
router.get("/enrolled-courses", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("enrolledCourses");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success: true,
      enrolledCourses: user.enrolledCourses,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
