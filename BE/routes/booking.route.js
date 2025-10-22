import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updatePaymentStatus,
  verifyTicket,
  checkInTicket,
  getAllBookingsForEmployee,
  getBookingsByEmployeeId,
  getBookingsByUserId,
} from "../controllers/booking.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/verify-ticket", verifyTicket);
router.post("/check-in", checkInTicket);

// Protected routes
router.use(protect); // Apply auth middleware to all routes below

// Booking CRUD
router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.get("/employee-all", getAllBookingsForEmployee);
router.get("/employee/:employeeId", getBookingsByEmployeeId);
router.get("/user/:userId", getBookingsByUserId);
router.get("/:id", getBookingById);
router.put("/:id/payment", updatePaymentStatus);

export default router;
