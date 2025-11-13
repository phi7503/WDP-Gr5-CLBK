import express from "express";
import { protectRoute, isAdmin, isEmployee } from "../middleware/auth.middleware.js";
import { getAdminDashboardStats, getEmployeeDashboardStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

// Admin
router.get("/admin-dashboard/stats", protectRoute, isAdmin, getAdminDashboardStats);

// Employee
router.get("/employee-dashboard/stats", protectRoute, isEmployee, getEmployeeDashboardStats);

export default router;
