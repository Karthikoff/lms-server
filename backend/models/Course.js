const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  offerprice: { type: Number, required: true },
  description: { type: String, required: true },
  keyPoints: { type: [String], required: true },
  highlights: { type: [String], required: true },
  category: {
    type: String,
    enum: [
      "Web Development",
      "App Development",
      "Data Science",
      "Machine Learning",
      "Programming Language",
      "Artificial Intelligence"
    ],
    required: true,
  },
  instructorName: { type: String, required: true }, // ✅ Added Instructor Name
  imageUrl: { type: String, required: true },
  videoUrl: { type: String, required: false }, // ✅ Added Video Upload Support
});

module.exports = mongoose.model("Course", courseSchema);
