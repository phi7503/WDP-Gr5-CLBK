import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import crypto from 'crypto';
import { sendNewUserCredentials } from '../utils/emailService.js';

// @desc    Get all users (with filters, search, pagination, sort)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const pageSize = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.search
        ? { $or: [{ name: { $regex: req.query.search, $options: 'i' } }, { email: { $regex: req.query.search, $options: 'i' } }] }
        : {};
    const roleFilter = req.query.role ? { role: req.query.role } : {};

    const { sortBy, sortOrder } = req.query;
    const sortOptions = {};
    if (sortBy && sortOrder) {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
        sortOptions.createdAt = -1;
    }

    const count = await User.countDocuments({ ...keyword, ...roleFilter });
    const users = await User.find({ ...keyword, ...roleFilter })
        .select('-password')
        .sort(sortOptions)
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({ users, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
    const { name, email, phone, role, gender, dob, province, city } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    const generatedPassword = crypto.randomBytes(8).toString('hex');

    const user = await User.create({
        name,
        email,
        phone,
        role,
        password: generatedPassword,
        gender,
        dob,
        province,
        city
    });

    if (user) {
        try {
            await sendNewUserCredentials(email, name, generatedPassword);
            console.log(`Welcome credentials sent successfully to ${email}`);
        } catch (emailError) {
            console.error(`Failed to send welcome email to ${email}:`, emailError);
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            gender: user.gender,
            dob: user.dob,
            province: user.province,
            city: user.city
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Update user by ID
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.role = req.body.role || user.role;
        user.gender = req.body.gender || user.gender;
        user.dob = req.body.dob || user.dob;
        user.province = req.body.province || user.province;
        user.city = req.body.city || user.city;
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            gender: updatedUser.gender,
            dob: updatedUser.dob,
            province: updatedUser.province,
            city: updatedUser.city
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export { getUsers, getUserById, createUser, updateUserById };
