import express from "express";
import {
  getAllShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  bulkDeleteShowtimes,
  deletePastShowtimes,
  updateShowtimeStatus,
  getShowtimeStats,
} from "../controllers/showtime.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllShowtimes);
router.get("/stats", getShowtimeStats);
router.get("/:id", getShowtimeById);

// Admin routes
router.post("/",protect,admin, createShowtime);
router.put("/:id",protect,admin, updateShowtime);
router.patch("/:id/status",protect,admin, updateShowtimeStatus);
router.delete("/:id",protect,admin, deleteShowtime);
router.delete("/bulk",protect,admin, bulkDeleteShowtimes);
router.delete("/past",protect,admin, deletePastShowtimes);

export default router;