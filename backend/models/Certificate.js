const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  cloudinaryUrl: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Certificate", certificateSchema);
