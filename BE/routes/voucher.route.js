import express from "express";
import {
    createVoucher,
    getVouchers,
    getVoucherById,
    updateVoucher,
    deleteVoucher,
    getVoucherByCode,
} from "../controllers/voucher.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .post(protect, admin, createVoucher)
    .get(protect, admin, getVouchers);

router.route("/:id")
    .get(protect, admin, getVoucherById)
    .put(protect, admin, updateVoucher)
    .delete(protect, admin, deleteVoucher);

router.get("/code/:code", getVoucherByCode);

export default router;