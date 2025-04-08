const mongoose = require("mongoose");

const studentAssessmentSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment.questions", required: true },
      selectedOption: { type: String, required: true },
    }
  ],
  score: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("StudentAssessment", studentAssessmentSchema);
