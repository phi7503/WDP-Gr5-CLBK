import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  logoutUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resettoken", resetPassword);
router.post("/logout", logoutUser);

// Protected routes
router.route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
