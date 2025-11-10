import asyncHandler from "express-async-handler";
import Theater from "../models/theaterModel.js";
import Branch from "../models/branchModel.js";
import SeatLayout from "../models/seatLayoutModel.js";

/**
 * @desc    Create a new theater and associate it with a branch
 * @route   POST /api/theaters
 * @access  Private/Admin
 */
const createTheater = asyncHandler(async (req, res) => {
  const { name, branchId } = req.body;

  // 1. Validate input data
  if (!name || !branchId) {
    res.status(400);
    throw new Error("Please provide a theater name and a branch ID.");
  }

  // 2. Check if the branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    res.status(404);
    throw new Error("Branch not found.");
  }

  // 3. Create the new theater with a link to the branch
  const theater = await Theater.create({
    name,
    branch: branchId,
  });

  // 4. Add the newly created theater to the branch's list of theaters
  branch.theaters.push(theater._id);
  await branch.save();

  res.status(201).json(theater);
});

/**
 * @desc    Get all theaters belonging to a specific branch
 * @route   GET /api/theaters/branch/:branchId
 * @access  Private/Admin
 */
const getTheatersByBranch = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  // Find theaters where branch matches and seatLayout exists
  const theaters = await Theater.find({
    branch: branchId,
    //seatLayout: { $ne: null }
  });

  res.json(theaters || []);
});
const getTheatersByBranch1 = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  // Find theaters where branch matches and seatLayout exists
  const theaters = await Theater.find({
    branch: branchId,
    seatLayout: { $ne: null }
  });

  res.json(theaters || []);
});

/**
 * @desc    Get a single theater by its ID
 * @route   GET /api/theaters/:id
 * @access  Private/Admin
 */
const getTheaterById = asyncHandler(async (req, res) => {
  const theater = await Theater.findById(req.params.id);

  if (theater) {
    res.json(theater);
  } else {
    res.status(404);
    throw new Error("Theater not found.");
  }
});

/**
 * @desc    Update a theater's information (name only)
 * @route   PUT /api/theaters/:id
 * @access  Private/Admin
 */
const updateTheater = asyncHandler(async (req, res) => {
  const theater = await Theater.findById(req.params.id);

  if (theater) {
    theater.name = req.body.name || theater.name;
    const updatedTheater = await theater.save();
    res.json(updatedTheater);
  } else {
    res.status(404);
    throw new Error("Theater not found.");
  }
});

/**
 * @desc    Delete a theater
 * @route   DELETE /api/theaters/:id
 * @access  Private/Admin
 */
const deleteTheater = asyncHandler(async (req, res) => {
  const theater = await Theater.findById(req.params.id);

  if (theater) {
    // 1. If this theater has an associated SeatLayout, remove the link from the layout
    if (theater.seatLayout) {
      await SeatLayout.findByIdAndUpdate(theater.seatLayout, {
        // Use $unset to completely remove the 'theater' field from the SeatLayout document
        $unset: { theater: "" },
      });
    }

    // 2. Remove this theater from the 'theaters' array in the Branch model
    await Branch.findByIdAndUpdate(theater.branch, {
      $pull: { theaters: theater._id },
    });

    // 3. Delete the theater document itself
    await theater.deleteOne();

    res.json({ message: "Theater removed successfully." });
  } else {
    res.status(404);
    throw new Error("Theater not found.");
  }
});
/**
 * @desc    Get all theaters in the system
 * @route   GET /api/theaters
 * @access  Private/Admin
 */
const getAllTheaters = asyncHandler(async (req, res) => {
  // Lấy tất cả theaters, populate tên branch để dễ đọc
  const theaters = await Theater.find({})
      .populate({ path: 'branch', select: 'name' })
      .lean();

  // Trả mảng (có thể rỗng)
  res.status(200).json(theaters);
});
export {
  createTheater,
  getAllTheaters,
  getTheatersByBranch,
  getTheaterById,
  updateTheater,
  deleteTheater,
    getTheatersByBranch1
};