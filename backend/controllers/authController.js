const User = require("../models/User");
const OTP = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");


// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { 
    user: "brainboostofficial001@gmail.com", 
    pass: "rsab rjuz xuvf rcsa"
  }
});

// 1️⃣ Send OTP to Email
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Generate a 6-digit OTP
    const otpCode = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });

    // Save OTP in DB with a 5-minute expiry
    await OTP.findOneAndUpdate(
      { email }, 
      { otp: otpCode, expiresAt: Date.now() + 5 * 60 * 1000 }, 
      { upsert: true, new: true }
    );

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🚀 Welcome to Brain Boost! Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <div style="max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; color: #9f48f2;">🎉 Welcome to Brain Boost! 🚀</h2>
            <p style="font-size: 16px; color: #333;">You're just one step away from unlocking a world of learning and growth. To complete your signup, please verify your email by entering the OTP below:</p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #9f48f2; padding: 10px 20px; border: 2px dashed #9f48f2; border-radius: 5px;">
                ${otpCode}
              </span>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
            <hr style="border: none; height: 1px; background: #ddd; margin: 20px 0;">
            <p style="text-align: center; font-size: 14px; color: #888;">💡 If you didn’t request this, you can ignore this email.</p>
          </div>
        </div>
      `
    });
    

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error sending OTP", error });
  }
};

// 2️⃣ Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) return res.status(400).json({ message: "OTP not found. Request a new OTP." });

    // Check if OTP matches
    if (otpRecord.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    // Check if OTP is expired
    if (otpRecord.expiresAt < Date.now()) return res.status(400).json({ message: "OTP expired" });

    // OTP is verified, allow user to proceed with password setup
    res.json({ message: "OTP verified. Proceed with signup." });

  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP", error });
  }
};

// 3️⃣ Complete Signup (After OTP Verification)
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Ensure email was verified
    const otpVerified = await OTP.findOne({ email });
    if (!otpVerified) return res.status(400).json({ message: "Email not verified. Complete OTP verification first." });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const user = new User({ name, email, password: hashedPassword, role: "student" });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Cleanup OTP record
    await OTP.deleteOne({ email });

    res.status(201).json({ 
      message: "Signup successful", 
      token, 
      role: user.role, 
      username: user.name 
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// // User Signup (Only for Students)
// exports.signup = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
    
//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: "User already exists" });

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create student
//     const user = new User({ name, email, password: hashedPassword, role: "student" });
//     await user.save();

//     // Generate token
//     const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

//     res.status(201).json({ 
//       message: "Signup successful", 
//       token, 
//       role: user.role, 
//       username: user.name  // ✅ Sending username
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// User Login (For Admin, Instructor, Student)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // ✅ Include username in response
    res.status(200).json({ 
      message: "Login successful", 
      token, 
      role: user.role, 
      username: user.name, 
      _id: user._id,
      email: user.email // ✅ Sending username in response
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
