const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ["admin", "instructor", "student"], 
    default: "student" 
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // ✅ Ensure this exists


  // Fields specific to instructors
  fathername: { type: String },
  qualification: { type: String },
  gender: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
