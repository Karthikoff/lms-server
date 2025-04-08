const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token Received:", token); // Debugging

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token:", decoded); // Debugging

      // Fetch user and attach to request
      req.user = await User.findById(decoded.id).select("-password");
      console.log("Authenticated User:", req.user); // Debugging

      if (!req.user) {
        return res.status(401).json({ success: false, message: "User not found" });
      }

      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ success: false, message: "Not authorized, token invalid" });
    }
  } else {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
  }
};


exports.verifyInstructor = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Unauthorized" });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || user.role !== "instructor") return res.status(403).json({ message: "Access Denied" });
  
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid Token" });
    }
  };



  
  
  exports.isInstructor = (req, res, next) => {
      if (req.user.role !== 'instructor') {
          return res.status(403).json({ error: 'Access denied. Instructors only.' });
      }
      next();
  };
  
  exports.isStudent = (req, res, next) => {
      if (req.user.role !== 'student') {
          return res.status(403).json({ error: 'Access denied. Students only.' });
      }
      next();
  };