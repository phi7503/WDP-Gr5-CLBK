import express from 'express';
const router = express.Router();
import {
    getUsers,
    getUserById,
    createUser,
    updateUserById,
    deleteUserById
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { isAdmin, protectRoute } from '../middleware/auth.middleware.js';

router.route('/')
    .get(protectRoute, isAdmin, getUsers)
    .post(protectRoute, isAdmin, createUser);

router.route('/:id')
    .get(protectRoute, isAdmin, getUserById)
    .put(protectRoute, isAdmin, updateUserById);
router.delete("/:id", protectRoute, isAdmin, deleteUserById);
export default router;
