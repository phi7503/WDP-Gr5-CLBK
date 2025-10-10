import express from 'express';
import {
    getAllBranches,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch,
} from '../controllers/branch.controller.js'
import {admin, protect} from "../middleware/auth.middleware.js";


const router = express.Router();

// Public routes
router.get('/', getAllBranches);
router.get('/all', getAllBranches);
router.get('/:id', getBranchById);

// Protected routes (admin only)
router.post('/', protect,admin,createBranch);
router.put('/:id',protect,admin, updateBranch);
router.delete('/:id',protect,admin, deleteBranch);

export default router;