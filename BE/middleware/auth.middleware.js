import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import expressAsyncHandler from "express-async-handler";

function getAccessToken(req) {
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  const h = req.headers?.authorization || "";
  if (h.startsWith("Bearer ")) return h.split(" ")[1];
  return null;
}
const protectRoute = async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No access token provided" });
    }
    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
      }
      throw error;
    }
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid access token" });
  }
};

// Chỉ cho phép role === 'employee'
const isEmployee = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!(req.user.role === "employee" || req.user.role === "admin") ){
    return res.status(403).json({ message: "Access denied - Employee only" });
  }
  next();
};

// Chỉ cho phép role === 'admin'
const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
  next();
};
const protect = expressAsyncHandler(async (req, res, next) => {
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

      // Get user from the token
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
});
export {protect, protectRoute, isEmployee, isAdmin };
