import express from "express";
import { createPayment, getPaymentStatus, handleWebhook, createPaymentFromBooking, checkAndUpdatePayment, handlePaymentCancel, updatePaymentFromRedirect } from "../controllers/payOSController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tạo link thanh toán
router.post("/create", createPayment);

// Tạo link thanh toán từ booking ID (cần authenticate)
router.post("/create-from-booking/:bookingId", protect, createPaymentFromBooking);

// Kiểm tra và cập nhật trạng thái thanh toán từ PayOS (cần authenticate)
router.post("/check-and-update/:bookingId", protect, checkAndUpdatePayment);

// Cập nhật payment status từ PayOS redirect URL (không cần authenticate vì được gọi từ PayOS redirect)
router.post("/update-from-redirect/:bookingId", updatePaymentFromRedirect);

// Xử lý hủy thanh toán (không cần authenticate vì được gọi từ PayOS redirect)
router.post("/cancel-booking/:bookingId", handlePaymentCancel);

// Kiểm tra trạng thái đơn hàng
router.get("/status/:orderCode", getPaymentStatus);

// Webhook callback từ PayOS (không cần authenticate)
router.post("/webhook", handleWebhook);

export default router;
