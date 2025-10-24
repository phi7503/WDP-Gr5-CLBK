import asyncHandler from "express-async-handler";
import Voucher from "../models/voucherModel.js";

// Get all vouchers - GET /api/vouchers - Public
const getVouchers = asyncHandler(async (req, res) => {
  const now = new Date();
  const vouchers = await Voucher.find({ 
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ createdAt: -1 });
  
  res.json({
    success: true,
    vouchers,
  });
});

// Get voucher by ID - GET /api/vouchers/:id - Public
const getVoucherById = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  
  if (!voucher) {
    res.status(404);
    throw new Error("Voucher not found");
  }
  
  res.json({
    success: true,
    voucher,
  });
});

// Create voucher - POST /api/vouchers - Admin
const createVoucher = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    code, 
    discountType, 
    discountValue, 
    maxDiscount, 
    minPurchase, 
    startDate, 
    endDate, 
    applicableMovies, 
    applicableBranches, 
    isActive 
  } = req.body;
  
  const voucher = await Voucher.create({
    name,
    description,
    code,
    discountType,
    discountValue,
    maxDiscount,
    minPurchase,
    startDate,
    endDate,
    applicableMovies: applicableMovies || [],
    applicableBranches: applicableBranches || [],
    isActive: isActive !== undefined ? isActive : true,
  });
  
  res.status(201).json({
    success: true,
    voucher,
  });
});

// Update voucher - PUT /api/vouchers/:id - Admin
const updateVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  
  if (!voucher) {
    res.status(404);
    throw new Error("Voucher not found");
  }
  
  voucher.name = req.body.name || voucher.name;
  voucher.description = req.body.description || voucher.description;
  voucher.code = req.body.code || voucher.code;
  voucher.discountType = req.body.discountType || voucher.discountType;
  voucher.discountValue = req.body.discountValue || voucher.discountValue;
  voucher.maxDiscount = req.body.maxDiscount || voucher.maxDiscount;
  voucher.minPurchase = req.body.minPurchase || voucher.minPurchase;
  voucher.startDate = req.body.startDate || voucher.startDate;
  voucher.endDate = req.body.endDate || voucher.endDate;
  voucher.applicableMovies = req.body.applicableMovies || voucher.applicableMovies;
  voucher.applicableBranches = req.body.applicableBranches || voucher.applicableBranches;
  voucher.isActive = req.body.isActive !== undefined ? req.body.isActive : voucher.isActive;
  
  const updatedVoucher = await voucher.save();
  
  res.json({
    success: true,
    voucher: updatedVoucher,
  });
});

// Delete voucher - DELETE /api/vouchers/:id - Admin
const deleteVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  
  if (!voucher) {
    res.status(404);
    throw new Error("Voucher not found");
  }
  
  await voucher.deleteOne();
  
  res.json({
    success: true,
    message: "Voucher deleted successfully",
  });
});

// Get voucher by code - GET /api/vouchers/code/:code - Public
const getVoucherByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const now = new Date();
  
  const voucher = await Voucher.findOne({
    code,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
  
  if (!voucher) {
    res.status(404);
    throw new Error("Voucher not found or expired");
  }
  
  res.json({
    success: true,
    voucher,
  });
});

export { createVoucher, getVouchers, getVoucherById, updateVoucher, deleteVoucher, getVoucherByCode };
