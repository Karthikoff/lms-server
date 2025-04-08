const mongoose = require("mongoose");

const examResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  certificateEligible: { type: Boolean, default: true },
  certificateUrl: { type: String },  // ✅ Certificate URL stored here!
});


module.exports = mongoose.model("ExamResult", examResultSchema);
