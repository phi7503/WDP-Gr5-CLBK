import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

// Protect routes - verify token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token - support both decoded.id and decoded.userId
      const userId = decoded.id || decoded.userId;
      if (!userId) {
        res.status(401);
        throw new Error("Invalid token format");
      }

      req.user = await User.findById(userId).select("-password");
      
      if (!req.user) {
        res.status(401);
        throw new Error("User not found");
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as an admin");
  }
};

// Employee middleware
const employee = (req, res, next) => {
  if (req.user && (req.user.role === "employee" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as an employee");
  }
};

// Optional auth middleware - không bắt buộc nhưng sẽ set req.user nếu có token
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Support both decoded.id and decoded.userId (có 2 cách tạo token)
      const userId = decoded.id || decoded.userId;
      if (userId) {
        req.user = await User.findById(userId).select("-password");
        if (req.user) {
          console.log('✅ Optional auth successful, user:', req.user.name);
        } else {
          console.log('⚠️ User not found in database, continuing as guest');
        }
      } else {
        console.log('⚠️ Invalid token format (no id/userId), continuing as guest');
      }
    } catch (error) {
      // Nếu token không hợp lệ, bỏ qua (không set req.user)
      console.log('⚠️ Optional auth failed, continuing as guest:', error.message);
    }
  }
  next();
});

export { protect, admin, employee, optionalAuth };
