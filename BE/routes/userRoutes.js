import express from 'express';
const router = express.Router();
import {
    getUsers,
    getUserById,
    createUser,
    updateUserById
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .get(protect, admin, getUsers)
    .post(protect, admin, createUser);

router.route('/:id')
    .get(protect, admin, getUserById)
    .put(protect, admin, updateUserById);

export default router;
