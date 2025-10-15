import mongoose from "mongoose";
import Branch from "../models/branchModel.js";
import Showtime from "../models/showtimeModel.js";

// Validate seat layout data
export const validateSeatLayout = (req, res, next) => {
  const { name, branch, theater, rows, seatsPerRow } = req.body;

  if (!name || !branch || !theater || !rows || !seatsPerRow) {
    return res.status(400).json({
      message: "Name, branch, theater, rows, and seatsPerRow are required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(branch)) {
    return res.status(400).json({ message: "Invalid branch ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(theater)) {
    return res.status(400).json({ message: "Invalid theater ID" });
  }

  if (rows < 1 || rows > 26) {
    return res.status(400).json({ message: "Rows must be between 1 and 26" });
  }

  if (seatsPerRow < 1 || seatsPerRow > 50) {
    return res
      .status(400)
      .json({ message: "Seats per row must be between 1 and 50" });
  }

  next();
};

// Validate seat reservation data
export const validateSeatReservation = (req, res, next) => {
  const { showtimeId, seatIds, reservationMinutes } = req.body;

  if (!showtimeId || !seatIds || !Array.isArray(seatIds)) {
    return res.status(400).json({
      message: "Showtime ID and seat IDs array are required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
    return res.status(400).json({ message: "Invalid showtime ID" });
  }

  if (seatIds.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one seat must be selected" });
  }

  if (seatIds.length > 10) {
    return res
      .status(400)
      .json({ message: "Cannot reserve more than 10 seats at once" });
  }

  for (const seatId of seatIds) {
    if (!mongoose.Types.ObjectId.isValid(seatId)) {
      return res.status(400).json({ message: `Invalid seat ID: ${seatId}` });
    }
  }

  if (
    reservationMinutes &&
    (reservationMinutes < 1 || reservationMinutes > 30)
  ) {
    return res
      .status(400)
      .json({ message: "Reservation minutes must be between 1 and 30" });
  }

  next();
};

// Validate theater-branch relationship
export const validateTheaterBranch = async (req, res, next) => {
  try {
    const { branch, theater } = req.body;

    if (!branch || !theater) {
      return next();
    }

    const branchDoc = await Branch.findById(branch);
    if (!branchDoc) {
      return res.status(404).json({ message: "Branch not found" });
    }

    if (!branchDoc.theaters.includes(theater)) {
      return res
        .status(400)
        .json({ message: "Theater does not belong to this branch" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error during validation" });
  }
};

// Validate showtime timing
export const validateShowtimeTiming = async (req, res, next) => {
  try {
    const { startTime, endTime, theater } = req.body;
    const showtimeId = req.params.id;

    if (!startTime || !endTime || !theater) {
      return next();
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    // Check for conflicts with existing showtimes
    const conflictQuery = {
      theater: theater,
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    };

    // Exclude current showtime if updating
    if (showtimeId) {
      conflictQuery._id = { $ne: showtimeId };
    }

    const conflictingShowtime = await Showtime.findOne(conflictQuery);

    if (conflictingShowtime) {
      return res.status(400).json({
        message: "Theater is already booked for this time slot",
        conflictingShowtime: {
          id: conflictingShowtime._id,
          startTime: conflictingShowtime.startTime,
          endTime: conflictingShowtime.endTime,
        },
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error during timing validation" });
  }
};
