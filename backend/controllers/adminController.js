const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Create Instructor (Only Admin Can Do This)
exports.createInstructor = async (req, res) => {
  try {
    // Only Admin can create an Instructor
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied! Only Admin can create an instructor." });
    }

    const { name, fathername, qualification, gender, address, city, state, country, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Instructor already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create instructor
    const instructor = new User({
      name,
      fathername,
      qualification,
      gender,
      address,
      city,
      state,
      country,
      email,
      password: hashedPassword,
      role: "instructor"
    });
    await instructor.save();

    res.status(201).json({ message: "Instructor created successfully", instructor });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get Total Counts of Instructors & Students
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const totalInstructors = await User.countDocuments({ role: "instructor" });
    const totalStudents = await User.countDocuments({ role: "student" });

    res.status(200).json({
      totalInstructors,
      totalStudents,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get List of All Instructors & Students
exports.getAllUsers = async (req, res) => {
  try {
    // Check if the user is an admin or instructor
    if (req.user.role !== "admin" && req.user.role !== "instructor") {
      return res.status(403).json({ message: "Access Denied! Only Admins and Instructors can view users." });
    }

    // Fetch instructors and students separately
    const instructors = await User.find({ role: "instructor" }).select("name email");
    const students = await User.find({ role: "student" }).select("name email");

    res.status(200).json({
      instructors,
      students,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update Instructor (Only Admin Can Do This)
exports.updateInstructor = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied! Only Admin can update an instructor." });
    }

    const { email, newEmail, password } = req.body;

    // Find instructor by email
    const instructor = await User.findOne({ email, role: "instructor" });
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });

    // Update email if provided
    if (newEmail && newEmail !== instructor.email) {
      const emailExists = await User.findOne({ email: newEmail });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      instructor.email = newEmail;
    }

    // Update password if provided
    if (password) {
      instructor.password = await bcrypt.hash(password, 10);
    }

    await instructor.save();
    res.status(200).json({ message: "Instructor updated successfully", instructor });

  } catch (error) {
    console.error("Update Instructor Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Delete Instructor (Only Admin Can Do This)
exports.deleteInstructor = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied! Only Admin can delete an instructor." });
    }

    const { email } = req.body;

    // Find and delete instructor
    const instructor = await User.findOneAndDelete({ email, role: "instructor" });
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });

    res.status(200).json({ message: "Instructor deleted successfully" });

  } catch (error) {
    console.error("Delete Instructor Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
