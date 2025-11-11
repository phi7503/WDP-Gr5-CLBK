import express from "express";
import { isAdmin, protectRoute } from "../middleware/auth.middleware.js";
import {
  updateMe,
  changePassword,
  getUsers,
  createUser,
  getUserById,
  updateUserById,
  deleteUserById,
} from "../controllers/user.controller.js";

const router = express.Router();

router.put("/me", protectRoute, updateMe);
router.put("/change-password", protectRoute, changePassword);

router.get("/users", protectRoute,  getUsers);
router.post("/users", protectRoute,  createUser);
router.get("/users/:id", protectRoute,  getUserById);
router.put("/users/:id", protectRoute,  updateUserById);
router.delete("/users/:id", protectRoute, deleteUserById);

export default router;
