const express = require("express");
const { createInstructor, getAdminDashboardStats, getAllUsers, updateInstructor, deleteInstructor } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-instructor", protect, createInstructor);
router.get("/dashboard-stats", protect, getAdminDashboardStats);
router.get("/all-users", protect, getAllUsers);

// Update Instructor (Only Admin)
router.put("/instructors", protect, updateInstructor);

// Delete Instructor (Only Admin)
router.delete("/instructors", protect, deleteInstructor);

module.exports = router;
