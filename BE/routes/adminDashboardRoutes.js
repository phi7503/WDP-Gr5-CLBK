import express from "express";
import { getDashboardStats } from "../controllers/adminDashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/admin-dashboard/stats
router.get("/stats", protect, getDashboardStats);

export default router; 