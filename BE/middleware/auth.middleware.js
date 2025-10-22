import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const protect = async (req, res, next) => {
  try {
    // Tạm thời tắt auth để test - tạo user mặc định
    if (process.env.NODE_ENV === 'development') {
      // Tạo user mặc định cho testing
      req.user = {
        _id: '507f1f77bcf86cd799439011', // ObjectId mặc định
        name: 'Test Employee',
        email: 'employee@cinema.com',
        role: 'employee'
      };
      return next();
    }

    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id).select("-password");

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
  } catch (error) {
    console.error(error);
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
};

const admin = (req, res, next) => {
  // Tạm thời tắt admin check để test
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
};

const employee = (req, res, next) => {
  // Tạm thời tắt employee check để test
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (req.user && (req.user.role === "admin" || req.user.role === "employee")) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an employee");
  }
};

export { protect, admin, employee };
