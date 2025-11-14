import express from "express";
import { isAdmin, protectRoute } from "../middleware/auth.middleware.js";
import {
  updateMe,
  changePassword,
  getUsers,
  createUser,
  getUserById,
} from "../controllers/user.controller.js";

const router = express.Router();

router.put("/users/me", protectRoute, updateMe);
router.put("/users/change-password", protectRoute, changePassword);

router.get("/users", protectRoute,  getUsers);
router.post("/users", protectRoute,  createUser);
router.get("/users/:id", protectRoute,  getUserById);

export default router;
