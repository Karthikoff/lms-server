const mongoose = require("mongoose");

const AssessmentResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  certificateEligible: { type: Boolean, default: true },
});

module.exports = mongoose.model("AssessmentResult", AssessmentResultSchema);
