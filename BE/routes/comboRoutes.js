import express from 'express';
const router = express.Router();
import {
    getCombos,
    getAdminCombos,
    getComboById,
    createCombo,
    updateCombo,
    deleteCombo,
} from '../controllers/comboController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// Public route to get active combos
router.route('/').get(getCombos);

// Admin route to get all combos
router.route('/admin').get(protect, admin, getAdminCombos);

// Admin routes for creating combos
router.route('/').post(protect, admin, createCombo);

// Public route to get a single combo
router.route('/:id').get(getComboById);

// Admin routes for updating and deleting combos
router
    .route('/:id')
    .put(protect, admin, updateCombo)
    .delete(protect, admin, deleteCombo);

export default router;