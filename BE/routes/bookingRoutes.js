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
  resendEmailQRCode,
} from "../controllers/bookingController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", optionalAuth, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.get("/employee-all", protect, getAllBookingsForEmployee);
router.get("/user/:userId", protect, getBookingsByUserId);
router.get("/:id", protect, getBookingById);
router.put("/:id/payment", protect, updatePaymentStatus);
router.put("/:id/cancel", protect, cancelBooking);
router.post("/:id/resend-email", protect, resendEmailQRCode);
router.post("/verify-ticket", verifyTicket);
router.post("/check-in", checkInTicket);

export default router;
