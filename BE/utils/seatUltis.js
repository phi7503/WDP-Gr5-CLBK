import Seat from "../models/seatModel.js";
import SeatStatus from "../models/seatStatusModel.js";

// Generate row labels (A, B, C, ...)
export const generateRowLabels = (rows) => {
  const labels = [];
  for (let i = 0; i < rows; i++) {
    if (i < 26) {
      labels.push(String.fromCharCode(65 + i)); // A-Z
    } else {
      // For more than 26 rows: AA, AB, AC, ...
      const firstChar = String.fromCharCode(65 + Math.floor((i - 26) / 26));
      const secondChar = String.fromCharCode(65 + ((i - 26) % 26));
      labels.push(firstChar + secondChar);
    }
  }
  return labels;
};

// Calculate seat price based on type
export const calculateSeatPrice = (seatType, basePrices) => {
  const multipliers = {
    standard: 1,
    vip: 1.5,
    couple: 2,
  };

  const multiplier = multipliers[seatType] || 1;

  switch (seatType) {
    case "vip":
      return basePrices.vip || basePrices.standard * multiplier;
    case "couple":
      return basePrices.couple || basePrices.standard * multiplier;
    default:
      return basePrices.standard;
  }
};

// Check if seats are adjacent
export const areSeatsAdjacent = (seat1, seat2) => {
  if (seat1.row !== seat2.row) return false;
  return Math.abs(seat1.number - seat2.number) === 1;
};

// Validate seat selection rules
export const validateSeatSelection = async (seatIds, showtimeId, userId) => {
  const seats = await Seat.find({ _id: { $in: seatIds } }).sort({
    row: 1,
    number: 1,
  });
  if (seats.length !== seatIds.length) {
    throw new Error("Some seats not found");
  }

  // Lock seats atomically
  for (const seatId of seatIds) {
    const updated = await SeatStatus.findOneAndUpdate(
      {
        showtime: showtimeId,
        seat: seatId,
        status: "available",
      },
      {
        $set: {
          status: "selecting",
          reservedBy: userId,
          reservedAt: new Date(),
          reservationExpires: new Date(Date.now() + 30 * 1000),
        },
      },
      { new: true }
    );
    if (!updated) {
      // Roll back any locked seats
      await SeatStatus.updateMany(
        { showtime: showtimeId, seat: { $in: seatIds }, reservedBy: userId },
        {
          $set: {
            status: "available",
            reservedBy: null,
            reservedAt: null,
            reservationExpires: null,
          },
        }
      );
      throw new Error(`Seat ${seatId} is not available`);
    }
  }

  // Check gap rule
  const seatsByRow = {};
  seats.forEach((seat) => {
    if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
    seatsByRow[seat.row].push(seat);
  });

  for (const row in seatsByRow) {
    const rowSeats = seatsByRow[row].sort((a, b) => a.number - b.number);
    for (let i = 1; i < rowSeats.length; i++) {
      const gap = rowSeats[i].number - rowSeats[i - 1].number;
      if (gap === 2) {
        // Roll back locked seats
        await SeatStatus.updateMany(
          { showtime: showtimeId, seat: { $in: seatIds }, reservedBy: userId },
          {
            $set: {
              status: "available",
              reservedBy: null,
              reservedAt: null,
              reservationExpires: null,
            },
          }
        );
        throw new Error(
          `Cannot leave single seat gap between seats ${rowSeats[i - 1].row}${
            rowSeats[i - 1].number
          } and ${rowSeats[i].row}${rowSeats[i].number}`
        );
      }
    }
  }

  return true;
};

// Get seat map for theater
export const getSeatMap = async (theaterId, branchId) => {
  const seats = await Seat.find({
    theater: theaterId,
    branch: branchId,
    isActive: true,
  }).sort({ row: 1, number: 1 });

  // Group by row
  const seatMap = {};
  seats.forEach((seat) => {
    if (!seatMap[seat.row]) {
      seatMap[seat.row] = [];
    }
    seatMap[seat.row].push(seat);
  });

  return seatMap;
};