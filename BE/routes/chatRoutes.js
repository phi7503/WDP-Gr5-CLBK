import express from "express";
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
} from "../controllers/chatController.js";
// import { protect } from "../middleware/authMiddleware.js"; // Optional: protect routes

const router = express.Router();

// Public routes (cho phép cả guest và logged-in users)
router.post("/message", sendMessage);
router.get("/history/:sessionId", getChatHistory);
router.delete("/history/:sessionId", clearChatHistory);

// Optional: Protected routes (nếu muốn chỉ logged-in users mới dùng được)
// router.post("/message", protect, sendMessage);
// router.get("/history/:sessionId", protect, getChatHistory);
// router.delete("/history/:sessionId", protect, clearChatHistory);

export default router;


