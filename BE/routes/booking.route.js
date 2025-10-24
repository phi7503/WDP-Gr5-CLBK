import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updatePaymentStatus,
  cancelBooking,
  verifyTicket,
  checkInTicket,
  getAllBookingsForEmployee,
  getBookingsByUserId,
} from "../controllers/booking.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.get("/employee-all", protect, getAllBookingsForEmployee);
router.get("/user/:userId", protect, getBookingsByUserId);
router.get("/:id", protect, getBookingById);
router.put("/:id/payment", protect, updatePaymentStatus);
router.put("/:id/cancel", protect, cancelBooking);
router.post("/verify-ticket", verifyTicket);
router.post("/check-in", checkInTicket);

export default router;