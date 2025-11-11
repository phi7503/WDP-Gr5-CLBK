import asyncHandler from "express-async-handler";
import Voucher from "../models/voucherModel.js";

// @desc    Create a new voucher
// @route   POST /api/vouchers
// @access  Private/Admin
const createVoucher = asyncHandler(async (req, res) => {
    const {
        code,
        description,
        discountType,
        discountValue,
        minPurchase,
        maxDiscount,
        startDate,
        endDate,
        usageLimit,
    } = req.body;

    const voucherExists = await Voucher.findOne({ code });
    if (voucherExists) {
        res.status(400);
        throw new Error("Voucher code already exists");
    }

    const voucher = await Voucher.create({
        code,
        description,
        discountType,
        discountValue,
        minPurchase,
        maxDiscount,
        startDate,
        endDate,
        usageLimit,
    });

    if (voucher) {
        res.status(201).json(voucher);
    } else {
        res.status(400);
        throw new Error("Invalid voucher data");
    }
});

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Private/Admin
const getVouchers = asyncHandler(async (req, res) => {
    const pageSize = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.search
        ? { code: { $regex: req.query.search, $options: "i" } }
        : {};

    const count = await Voucher.countDocuments({ ...keyword });
    const vouchers = await Voucher.find({ ...keyword })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({ vouchers, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get voucher by ID
// @route   GET /api/vouchers/:id
// @access  Private/Admin
const getVoucherById = asyncHandler(async (req, res) => {
    const voucher = await Voucher.findById(req.params.id);

    if (voucher) {
        res.json(voucher);
    } else {
        res.status(404);
        throw new Error("Voucher not found");
    }
});

// @desc    Update a voucher
// @route   PUT /api/vouchers/:id
// @access  Private/Admin
const updateVoucher = asyncHandler(async (req, res) => {
    const voucher = await Voucher.findById(req.params.id);

    if (voucher) {
        voucher.code = req.body.code || voucher.code;
        voucher.description = req.body.description || voucher.description;
        voucher.discountType = req.body.discountType || voucher.discountType;
        voucher.discountValue = req.body.discountValue || voucher.discountValue;
        voucher.minPurchase = req.body.minPurchase || voucher.minPurchase;
        voucher.maxDiscount = req.body.maxDiscount || voucher.maxDiscount;
        voucher.startDate = req.body.startDate || voucher.startDate;
        voucher.endDate = req.body.endDate || voucher.endDate;
        voucher.usageLimit = req.body.usageLimit || voucher.usageLimit;
        voucher.isActive = req.body.isActive !== undefined ? req.body.isActive : voucher.isActive;

        const updatedVoucher = await voucher.save();
        res.json(updatedVoucher);
    } else {
        res.status(404);
        throw new Error("Voucher not found");
    }
});

// @desc    Delete a voucher
// @route   DELETE /api/vouchers/:id
// @access  Private/Admin
const deleteVoucher = asyncHandler(async (req, res) => {
    const voucher = await Voucher.findById(req.params.id);
    if (voucher) {
        await voucher.deleteOne();
        res.json({ message: "Voucher removed" });
    } else {
        res.status(404);
        throw new Error("Voucher not found");
    }
});

// @desc    Get voucher by code
// @route   GET /api/vouchers/code/:code
// @access  Public
const getVoucherByCode = asyncHandler(async (req, res) => {
    const voucher = await Voucher.findOne({ code: req.params.code });
    if (voucher) {
        res.json(voucher);
    } else {
        res.status(404);
        throw new Error("Voucher not found");
    }
});


export {
    createVoucher,
    getVouchers,
    getVoucherById,
    updateVoucher,
    deleteVoucher,
    getVoucherByCode,
};