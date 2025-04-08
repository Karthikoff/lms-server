const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 }, // Wallet balance
  transactions: {
    type: [
      {
        amount: Number,
        type: { type: String, enum: ["credit", "debit"] }, // credit = add money, debit = spent money
        timestamp: { type: Date, default: Date.now }
      }
    ],
    default: [] // ✅ Ensures transactions array is never undefined
  }
});

module.exports = mongoose.model("Wallet", WalletSchema);
