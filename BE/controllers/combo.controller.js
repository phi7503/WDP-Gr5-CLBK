import asyncHandler from "express-async-handler";
import Combo from "../models/comboModel.js";

// Get all combos - GET /api/combos - Public
const getCombos = asyncHandler(async (req, res) => {
  const combos = await Combo.find({ isActive: true }).sort({ createdAt: -1 });
  
  res.json({
    success: true,
    combos,
  });
});

// Get combo by ID - GET /api/combos/:id - Public
const getComboById = asyncHandler(async (req, res) => {
  const combo = await Combo.findById(req.params.id);
  
  if (!combo) {
    res.status(404);
    throw new Error("Combo not found");
  }
  
  res.json({
    success: true,
    combo,
  });
});

// Get all combos for admin - GET /api/combos/admin - Admin
const getAdminCombos = asyncHandler(async (req, res) => {
  const combos = await Combo.find({}).sort({ createdAt: -1 });
  
  res.json({
    success: true,
    combos,
  });
});

// Create combo - POST /api/combos - Admin
const createCombo = asyncHandler(async (req, res) => {
  const { name, description, price, items, isActive } = req.body;
  
  const combo = await Combo.create({
    name,
    description,
    price,
    items: items || [],
    isActive: isActive !== undefined ? isActive : true,
  });
  
  res.status(201).json({
    success: true,
    combo,
  });
});

// Update combo - PUT /api/combos/:id - Admin
const updateCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.findById(req.params.id);
  
  if (!combo) {
    res.status(404);
    throw new Error("Combo not found");
  }
  
  combo.name = req.body.name || combo.name;
  combo.description = req.body.description || combo.description;
  combo.price = req.body.price || combo.price;
  combo.items = req.body.items || combo.items;
  combo.isActive = req.body.isActive !== undefined ? req.body.isActive : combo.isActive;
  
  const updatedCombo = await combo.save();
  
  res.json({
    success: true,
    combo: updatedCombo,
  });
});

// Delete combo - DELETE /api/combos/:id - Admin
const deleteCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.findById(req.params.id);
  
  if (!combo) {
    res.status(404);
    throw new Error("Combo not found");
  }
  
  await combo.deleteOne();
  
  res.json({
    success: true,
    message: "Combo deleted successfully",
  });
});

export { getCombos, getAdminCombos, getComboById, createCombo, updateCombo, deleteCombo };
