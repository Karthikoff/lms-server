const express = require("express");
const { addMoney, getWalletBalance, getTransactions } = require("../controllers/walletController");
const { protect } = require("../middleware/authMiddleware");
const { enrollCourse } = require("../controllers/walletController");

const router = express.Router();

router.post("/add-money", protect, addMoney); // Add money to wallet
router.get("/balance", protect, getWalletBalance); // Get wallet balance
router.get("/transactions", protect, getTransactions); // Get wallet transactions
router.post("/enroll", protect, enrollCourse); // Enroll course using wallet

module.exports = router;
