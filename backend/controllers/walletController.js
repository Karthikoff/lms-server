const Wallet = require("../models/Wallet");
const User = require("../models/User");
const Course = require("../models/Course");

// 1️⃣ Add Money to Wallet
exports.addMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    let wallet = await Wallet.findOne({ user: userId });

    const transaction = {
      amount,
      type: "credit",
      timestamp: new Date(), // Store timestamp
    };

    if (!wallet) {
      wallet = new Wallet({ user: userId, balance: amount, transactions: [transaction] });
    } else {
      wallet.balance += amount;
      wallet.transactions.push(transaction);
    }

    await wallet.save();

    res.status(200).json({ message: "Money added successfully", balance: wallet.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 2️⃣ Get Wallet Balance
exports.getWalletBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    res.status(200).json({ balance: wallet.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 3️⃣ Get Transaction History
exports.getTransactions = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    res.status(200).json({ transactions: wallet.transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Course Enrollment with Wallet Payment (Fixed)
exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id; // Logged-in student

    // ✅ Find the student and admin
    const student = await User.findById(studentId);
    const admin = await User.findOne({ role: "admin" });

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    if (!admin) return res.status(500).json({ success: false, message: "Admin account not found" });

    // ✅ Check if course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // ✅ Prevent re-enrollment if the student is already enrolled
    if (student.enrolledCourses && student.enrolledCourses.includes(courseId)) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course.",
      });
    }

    // ✅ Fetch or create student wallet
    let studentWallet = await Wallet.findOne({ user: studentId });
    if (!studentWallet) {
      studentWallet = new Wallet({ user: studentId, balance: 0, transactions: [] });
    }

    // ✅ Check balance
    if (studentWallet.balance < course.offerprice) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Your current balance is ₹${studentWallet.balance}`,
      });
    }

    // ✅ Deduct money from student wallet
    studentWallet.balance -= course.offerprice;

    // ✅ Fetch or create admin wallet
    let adminWallet = await Wallet.findOne({ user: admin._id });
    if (!adminWallet) {
      adminWallet = new Wallet({ user: admin._id, balance: 0, transactions: [] });
    }

    // ✅ Ensure transactions arrays exist
    if (!studentWallet.transactions) studentWallet.transactions = [];
    if (!adminWallet.transactions) adminWallet.transactions = [];

    // ✅ Store the transaction in both wallets
    studentWallet.transactions.push({ amount: course.offerprice, type: "debit" });
    adminWallet.transactions.push({ amount: course.offerprice, type: "credit" });

    // ✅ Add money to admin wallet
    adminWallet.balance += course.offerprice;

    // ✅ Add the course to the student's enrolledCourses list
    if (!student.enrolledCourses) student.enrolledCourses = [];
    student.enrolledCourses.push(courseId);

    // ✅ Save updates
    await studentWallet.save();
    await adminWallet.save();
    await student.save();

    res.status(200).json({
      success: true,
      message: `Course enrolled successfully. ₹${course.offerprice} deducted.`,
      walletBalance: studentWallet.balance,
      enrolledCourses: student.enrolledCourses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
