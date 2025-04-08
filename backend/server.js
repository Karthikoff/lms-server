const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const walletRoutes = require("./routes/walletRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const userRoutes = require("./routes/userRoutes"); // ✅ Import User Routes
const messageRoutes = require("./routes/messageRoutes"); // Import message routes
const assessmentRoutes = require("./routes/assessmentRoutes");
const examRoutes = require("./routes/examRoutes");

const cors = require("cors");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(express.json({ limit: "1000mb" }));

app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Update this with your frontend URL
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Not Loaded");



// Routes

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);  // 👈 Added Admin Routes
app.use("/api/courses", courseRoutes);
app.use("/api/wallet", walletRoutes); // Register wallet routes
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", userRoutes); // ✅ Register User Routes
app.use("/api/messages", messageRoutes); // Register routes
app.use("/api/assessments", assessmentRoutes);
app.use("/api/exams", examRoutes);



app.use((req, res, next) => {
    console.log("⚠️ Request Path:", req.path);
    next();
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
