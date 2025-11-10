import asyncHandler from 'express-async-handler';
import Combo from '../models/comboModel.js';

// @desc    Fetch all combos (for customers) with filter & search
// @route   GET /api/combos
// @access  Public
const getCombos = asyncHandler(async (req, res) => {
    const { category, search } = req.query;
    let filter = { isActive: true };

    if (category) {
        filter.category = category;
    }
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    const combos = await Combo.find(filter);
    res.json(combos);
});

// @desc    Fetch all combos (for admin panel)
// @route   GET /api/combos/admin
// @access  Private/Admin
const getAdminCombos = asyncHandler(async (req, res) => {
    // Admin sees all combos
    const combos = await Combo.find({}).sort({ createdAt: -1 });
    res.json(combos);
});

// @desc    Fetch a single combo by ID
// @route   GET /api/combos/:id
// @access  Private/Admin
const getComboById = asyncHandler(async (req, res) => {
    const combo = await Combo.findById(req.params.id);
    if (combo) {
        res.json(combo);
    } else {
        res.status(404);
        throw new Error('Combo not found');
    }
});

// @desc    Create a combo
// @route   POST /api/combos
// @access  Private/Admin
const createCombo = asyncHandler(async (req, res) => {
    const { name, description, price, image, items, category, isActive } = req.body;

    const combo = new Combo({
        name,
        description,
        price,
        image,
        items,
        category,
        isActive,
    });

    const createdCombo = await combo.save();
    res.status(201).json(createdCombo);
});

// @desc    Update a combo
// @route   PUT /api/combos/:id
// @access  Private/Admin
const updateCombo = asyncHandler(async (req, res) => {
    const { name, description, price, image, items, category, isActive } = req.body;

    const combo = await Combo.findById(req.params.id);

    if (combo) {
        combo.name = name ?? combo.name;
        combo.description = description ?? combo.description;
        combo.price = price ?? combo.price;
        combo.image = image ?? combo.image;
        combo.items = items ?? combo.items;
        combo.category = category ?? combo.category;
        combo.isActive = isActive ?? combo.isActive;

        const updatedCombo = await combo.save();
        res.json(updatedCombo);
    } else {
        res.status(404);
        throw new Error('Combo not found');
    }
});

// @desc    Delete a combo
// @route   DELETE /api/combos/:id
// @access  Private/Admin
const deleteCombo = asyncHandler(async (req, res) => {
    const combo = await Combo.findById(req.params.id);

    if (combo) {
        await combo.deleteOne();
        res.json({ message: 'Combo removed' });
    } else {
        res.status(404);
        throw new Error('Combo not found');
    }
});

export {
    getCombos,
    getAdminCombos,
    getComboById,
    createCombo,
    updateCombo,
    deleteCombo,
};