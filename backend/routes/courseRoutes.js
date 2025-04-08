const express = require("express");
const { uploadImageToCloudinary, uploadVideoToCloudinary } = require("../utils/cloudinary"); // ✅ Helper functions for Cloudinary
const Course = require("../models/Course");
const { getInstructorCourses, getCourseStudents } = require("../controllers/courseController");
const { protect } = require("../middleware/authMiddleware"); // ✅ Import 'protect' middleware
const Enrollment = require("../models/User"); // Ensure this exists
const Assessment = require("../models/Assessment"); // Ensure this exists

const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // ✅ Store files in memory for processing

// ✅ Create Course
// ✅ Create Course with Image & Video
router.post("/create", upload.fields([{ name: "image" }, { name: "video" }]), async (req, res) => {
  try {
    const { name, price, offerprice, description, keyPoints, highlights, category, instructorName } = req.body;

    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, message: "Image file is required" });
    }

    // ✅ Upload Image to Cloudinary
    const b64Image = Buffer.from(req.files.image[0].buffer).toString("base64");
    const imageUrl = await uploadImageToCloudinary("data:" + req.files.image[0].mimetype + ";base64," + b64Image);

    let videoUrl = null;
    if (req.files.video) {
      // ✅ Upload Video to Cloudinary (Chunked for large files)
      videoUrl = await uploadVideoToCloudinary(req.files.video[0].buffer);
    }

    // ✅ Save course with Image & Video URL
    const course = new Course({
      name,
      price,
      offerprice,
      description,
      keyPoints: keyPoints.split(","),
      highlights: highlights.split(","),
      category,
      instructorName,
      imageUrl,
      videoUrl,
    });

    await course.save();
    res.status(201).json({ success: true, message: "Course created successfully!", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get All Courses
router.get("/", async (req, res) => {
  try {
    const { instructorName } = req.query;
    let query = {};

    if (instructorName) {
      query.instructorName = instructorName; // Filter by instructor name if provided
    }

    const courses = await Course.find(query);
    res.status(200).json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get Instructor's Courses (Moved Above `/:id` to Fix "Cast to ObjectId" Error)
router.get("/instructor", protect, getInstructorCourses); // Ensure the instructor is authenticated

// ✅ Get Students Enrolled in a Course
router.get("/:courseId/students", protect, getCourseStudents); // Ensure the instructor is authenticated

// ✅ Get Single Course by ID
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    res.status(200).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update Course
router.put("/update/:id", async (req, res) => {
  try {
    const { name, price, offerprice, description, category, keyPoints, courseImage } = req.body;
    let imageUrl;

    if (courseImage) {
      // ✅ Upload new image to Cloudinary
      const result = await uploadImageToCloudinary(courseImage);
      imageUrl = result.secure_url;
    }

    // ✅ Update Course
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { name, price, offerprice, description, category, keyPoints, imageUrl },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, message: "Course updated!", updatedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Delete Course & Related Data
router.delete("/delete/:id", async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Delete related enrollments (if applicable)
    await Enrollment.deleteMany({ courseId });

    // Delete related assessments (if applicable)
    await Assessment.deleteMany({ courseId });

    // Delete course
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({ success: true, message: "Course deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;
