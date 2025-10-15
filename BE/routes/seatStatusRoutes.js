import express from "express";
import {
  reserveSeats,
  releaseReservedSeats,
  bookSeats,
  toggleSeatBlock,
  getSeatStatusByShowtime,
} from "../controllers/seatStatusController.js";
import cleanupExpiredReservations from "../jobs/cleanupExpiredReservations.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/reserve", protect, reserveSeats);
router.post("/release", protect, releaseReservedSeats);
router.post("/book", protect, bookSeats);
router.post("/cleanup", protect, admin, cleanupExpiredReservations);
router.put("/block", protect, admin, toggleSeatBlock);
router.get("/:showtimeId", protect, getSeatStatusByShowtime);

export default router;
