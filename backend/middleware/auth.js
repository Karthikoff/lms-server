const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user and attach to request
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ success: false, message: "User not found" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
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

exports.isStudent = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied. Students only." });
  }
  next();
};

exports.verifyStudent = (req, res, next) => {
  if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Access Denied. Students only." });
  }
  next();
};
