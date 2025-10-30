import express from "express";
import { createPayment, getPaymentStatus, handleWebhook, createPaymentFromBooking } from "../controllers/payOSController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tạo link thanh toán
router.post("/create", createPayment);

// Tạo link thanh toán từ booking ID (cần authenticate)
router.post("/create-from-booking/:bookingId", protect, createPaymentFromBooking);

// Kiểm tra trạng thái đơn hàng
router.get("/status/:orderCode", getPaymentStatus);

// Webhook callback từ PayOS (không cần authenticate)
router.post("/webhook", handleWebhook);

export default router;
