import mongoose from 'mongoose';
import Branch from '../models/branchModel.js';
import Theater from '../models/theaterModel.js';
import asyncHandler from 'express-async-handler';

const isValidObjectId = id => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all branches
// @route   GET /api/branches
// @access  Public
export const getAllBranches = asyncHandler(async (req, res) => {

    const { name, location_province, cinemaChain, groupByChain } = req.query;

    const filter = {};

    // Add name filter if provided
    if (name) {
        filter.name = { $regex: name, $options: 'i' };
    }
    // Add location province filter if provided
    if (location_province) {
        filter['location.province'] = location_province;
    }

    // Add cinema chain filter if provided
    if (cinemaChain) {
        filter.cinemaChain = cinemaChain;
    }

    const branches = await Branch.find(filter).sort({ cinemaChain: 1, name: 1 });
    
    // Group by chain if requested
    if (groupByChain === 'true') {
        const grouped = {};
        branches.forEach(branch => {
            const chain = branch.cinemaChain || 'Other';
            if (!grouped[chain]) {
                grouped[chain] = [];
            }
            grouped[chain].push(branch);
        });
        return res.json({ groupedByChain: grouped, total: branches.length });
    }
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

// @desc    Update a branch
// @route   PUT /api/branches/:id
// @access  Private/Admin
export const updateBranch = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        location,
        contact,
        theaters,
        operatingHours,
        facilities,
        image,
        isActive,
    } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid branch ID' });
    }

    try {
        const branch = await Branch.findById(id);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        // Update fields
        if (name) branch.name = name;

        if (location) {
            if (location.address) branch.location.address = location.address;
            if (location.city) branch.location.city = location.city;
            if (location.province) branch.location.province = location.province;
            if (location.coordinates) {
                if (typeof location.coordinates.latitude === 'number') branch.location.coordinates.latitude = location.coordinates.latitude;
                if (typeof location.coordinates.longitude === 'number') branch.location.coordinates.longitude = location.coordinates.longitude;
            }
        }

        if (contact) {
            if (contact.phone) branch.contact.phone = contact.phone;
            if (contact.email) branch.contact.email = contact.email;
        }

        if (Array.isArray(theaters)) {
            for (const tId of theaters) {
                if (!isValidObjectId(tId)) {
                    return res.status(400).json({ message: `Invalid theater ID: ${tId}` });
                }
            }
            const count = await Theater.countDocuments({ _id: { $in: theaters } });
            if (count !== theaters.length) {
                return res.status(404).json({ message: 'One or more theaters not found' });
            }
            branch.theaters = theaters;
        }

        if (operatingHours) {
            if (operatingHours.open) branch.operatingHours.open = operatingHours.open;
            if (operatingHours.close) branch.operatingHours.close = operatingHours.close;
        }

        if (Array.isArray(facilities)) branch.facilities = facilities;
        if (image) branch.image = image;
        if (typeof isActive === 'boolean') branch.isActive = isActive;

        const updatedBranch = await branch.save();
        const populated = await Branch.findById(updatedBranch._id)
            .populate('theaters', 'name seatLayout');

        return res.json(populated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a branch
// @route   DELETE /api/branches/:id
// @access  Private/Admin
export const deleteBranch = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid branch ID' });
    }

    try {
        const deleted = await Branch.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        return res.json({ message: 'Branch removed' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
};
