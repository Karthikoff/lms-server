const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Message = require("../models/Message");
const User = require("../models/User");
const moment = require("moment-timezone");

// ✅ Instructor sends a message to students
router.post("/send", protect, async (req, res) => {
    try {
        const { courseId, content } = req.body;
        const instructorId = req.user.id;

        if (!courseId || !content) {
            return res.status(400).json({ success: false, message: "Missing courseId or content" });
        }

        const istTime = moment().tz("Asia/Kolkata").toDate();

        const newMessage = new Message({
            courseId,
            instructorId,
            content,
            sentAt: istTime,
        });

        await newMessage.save();

        res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ✅ Student fetches flat list of messages
router.get("/student", protect, async (req, res) => {
    try {
        const student = await User.findById(req.user._id).populate("enrolledCourses", "name");

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const messages = await Message.find({ courseId: { $in: student.enrolledCourses } })
            .populate("courseId", "name")
            .populate("instructorId", "name")
            .sort({ sentAt: -1 });

        const formattedMessages = messages.map((msg) => ({
            _id: msg._id,
            text: msg.content || "No message available",
            courseName: msg.courseId?.name || "Unknown Course",
            instructorName: msg.instructorId?.name || "Unknown Instructor",
            sentAt: moment(msg.sentAt).tz("Asia/Kolkata").format("YYYY-MM-DD hh:mm A"),
        }));

        res.json({ success: true, messages: formattedMessages });
    } catch (error) {
        console.error("Error fetching student messages:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ✅ Instructor fetches flat list of messages
router.get("/instructor", protect, async (req, res) => {
    try {
        const messages = await Message.find({ instructorId: req.user._id })
            .populate("courseId", "name")
            .sort({ sentAt: -1 });

        const formattedMessages = messages.map((msg) => ({
            _id: msg._id,
            text: msg.content || "No message available",
            courseName: msg.courseId?.name || "Unknown Course",
            sentAt: moment(msg.sentAt).tz("Asia/Kolkata").format("YYYY-MM-DD hh:mm A"),
        }));

        res.json({ success: true, messages: formattedMessages });
    } catch (error) {
        console.error("Error fetching instructor messages:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
