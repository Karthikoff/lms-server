const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [
    { text: String, isCorrect: { type: Boolean, required: true } },
  ],
  marks: { type: Number, required: true }, // Marks for each question
});

const assessmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  instructions: { type: String, required: true },
  timer: { type: Number, required: true }, // Duration of the exam in minutes
  questions: [questionSchema],
  isCertificateEnabled: { type: Boolean, default: true },
  assessmentNumber: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Assessment", assessmentSchema);
