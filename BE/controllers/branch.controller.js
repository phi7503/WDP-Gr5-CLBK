import mongoose from 'mongoose';
import Branch from '../models/branchModel.js';
import Theater from '../models/theaterModel.js';
import asyncHandler from 'express-async-handler';

const isValidObjectId = id => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all branches
// @route   GET /api/branches
// @access  Public
export const getAllBranches = asyncHandler(async (req, res) => {
    const { name, location_province } = req.query;
    const filter = {};

    // Add name filter if provided
    if (name) {
        filter.name = { $regex: name, $options: 'i' };
    }
    // Add location province filter if provided
    if (location_province) {
        filter['location.province'] = location_province;
    }

    const branches = await Branch.find(filter).sort({ name: 1 });
    res.json(branches);
});

// @desc    Get single branch by ID
// @route   GET /api/branches/:id
// @access  Public
export const getBranchById = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid branch ID' });
    }

    try {
        const branch = await Branch.findById(id)
            .populate('theaters', 'name seatLayout');
        if (!branch || !branch.isActive) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        return res.json(branch);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new branch
// @route   POST /api/branches
// @access  Private/Admin
export const createBranch = async (req, res) => {
    const {
        name,
        location,
        contact,
        theaters = [],
        operatingHours = {},
        facilities = [],
        image,
        isActive = true,
    } = req.body;

    // Basic validation
    if (!name || !location?.address || !location?.city || !location?.province || !contact?.phone) {
        return res.status(400).json({ message: 'Missing required branch fields' });
    }

    // Validate theater IDs
    if (!Array.isArray(theaters)) {
        return res.status(400).json({ message: 'Theaters must be an array of IDs' });
    }
    for (const tId of theaters) {
        if (!isValidObjectId(tId)) {
            return res.status(400).json({ message: `Invalid theater ID: ${tId}` });
        }
    }

    try {
        // Verify theaters exist
        if (theaters.length > 0) {
            const count = await Theater.countDocuments({ _id: { $in: theaters } });
            if (count !== theaters.length) {
                return res.status(404).json({ message: 'One or more theaters not found' });
            }
        }

        const branch = new Branch({
            name,
            location: {
                address: location.address,
                city: location.city,
                province: location.province,
                coordinates: {
                    latitude: location.coordinates?.latitude,
                    longitude: location.coordinates?.longitude,
                },
            },
            contact: {
                phone: contact.phone,
                email: contact.email,
            },
            theaters,
            operatingHours: {
                open: operatingHours.open || '09:00',
                close: operatingHours.close || '23:00',
            },
            facilities,
            image,
            isActive,
        });

        const createdBranch = await branch.save();
        const populated = await Branch.findById(createdBranch._id)
            .populate('theaters', 'name seatLayout');

        return res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
};


