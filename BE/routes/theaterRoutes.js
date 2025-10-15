import express from "express";
import {
  createTheater,
  getTheatersByBranch,
  getTheaterById,
  updateTheater,
  deleteTheater,
  getAllTheaters,
  getTheatersByBranch1
} from "../controllers/theaterController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getAllTheaters);
router.route("/").post(protect, admin, createTheater);

router.route("/branch/:branchId").get(protect, admin, getTheatersByBranch);
router.route("/branch1/:branchId").get(protect, admin, getTheatersByBranch1);

router
    .route("/:id")
    .get(protect, admin, getTheaterById)
    .put(protect, admin, updateTheater)
    .delete(protect, admin, deleteTheater);

export default router;