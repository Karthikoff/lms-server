const express = require("express");
const { signup, login, sendOtp, verifyOtp } = require("../controllers/authController");

const router = express.Router();

router.post("/send-otp", sendOtp);   // Step 1: Send OTP to email
router.post("/verify-otp", verifyOtp); // Step 2: Verify OTP

router.post("/signup", signup);  // Only students can signup
router.post("/login", login);     // Admin, Instructor, Student can login

module.exports = router;
