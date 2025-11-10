import asyncHandler from "express-async-handler";
import SeatStatus from "../models/seatStatusModel.js";
import Showtime from "../models/showtimeModel.js";
import { validateSeatSelection } from "../utils/seatUtils.js";
import Booking from "../models/bookingModel.js";
import mongoose from "mongoose";
import { broadcastSeatUpdate } from "../socket/socketHandlers.js";

// Reserve seats temporarily - POST /api/seat-status/reserve - Private
const reserveSeats = asyncHandler(async (req, res) => {
  const { showtimeId, seatIds, userId } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (
    !showtimeId ||
    !seatIds ||
    !Array.isArray(seatIds) ||
    seatIds.length === 0 ||
    !userId
  ) {
    console.error("Invalid request data:", { showtimeId, seatIds, userId });
    res.status(400);
    throw new Error("Invalid request data");
  }

  // Kiểm tra showtimeId và userId là ObjectId hợp lệ
  if (
    !mongoose.isValidObjectId(showtimeId) ||
    !mongoose.isValidObjectId(userId)
  ) {
    console.error("Invalid ObjectId:", { showtimeId, userId });
    res.status(400);
    throw new Error("Invalid showtimeId or userId");
  }

  // Kiểm tra seatIds
  if (seatIds.some((id) => !mongoose.isValidObjectId(id))) {
    console.error("Invalid seatIds:", { seatIds });
    res.status(400);
    throw new Error("One or more seatIds are invalid");
  }

  const showtime = await Showtime.findById(showtimeId);
  if (!showtime) {
    console.error("Showtime not found:", { showtimeId });
    res.status(404);
    throw new Error("Showtime not found");
  }

  const seatStatuses = await SeatStatus.find({
    showtime: showtimeId,
    seat: { $in: seatIds },
    status: "available",
  });

  console.log("Available seats:", {
    seatIds,
    foundSeats: seatStatuses.map((s) => s.seat.toString()),
  });

  if (seatStatuses.length !== seatIds.length) {
    console.error("Some seats not available:", {
      seatIds,
      foundSeats: seatStatuses,
    });
    res.status(400);
    throw new Error("Some seats are not available");
  }

  // Tạo reservationExpires
  const currentTime = Date.now();
  const reservationExpires = new Date(currentTime + 5 * 60 * 1000); // Hết hạn sau 5 phút
  if (isNaN(reservationExpires.getTime())) {
    console.error("Invalid reservationExpires:", {
      currentTime,
      reservationExpires,
    });
    res.status(500);
    throw new Error("Failed to create valid reservation expiration date");
  }

  const updateResult = await SeatStatus.updateMany(
    {
      showtime: showtimeId,
      seat: { $in: seatIds },
      status: "available",
    },
    {
      $set: {
        status: "reserved",
        reservedBy: userId,
        reservedAt: new Date(currentTime),
        reservationExpires,
      },
    }
  );
  console.log("Updated seats:", updateResult.modifiedCount);
  const updatedSeats = await SeatStatus.find({
    showtime: showtimeId,
    seat: { $in: seatIds },
  });
  console.log("Seat statuses after reserve:", updatedSeats);

  if (updateResult.modifiedCount !== seatIds.length) {
    console.error("Failed to reserve seats:", {
      showtimeId,
      seatIds,
      modifiedCount: updateResult.modifiedCount,
    });
    res.status(500);
    throw new Error("Failed to reserve seats");
  }

  broadcastSeatUpdate(showtimeId, {
    type: "seats-reserved",
    seatIds,
    userId,
    timestamp: new Date(),
  });

  res.status(200).json({
    success: true,
    message: "Seats reserved successfully",
  });
});

// Release reserved seats - POST /api/seat-status/release - Private
const releaseReservedSeats = asyncHandler(async (req, res) => {
  const { showtimeId, seatIds } = req.body;
  const userId = req.user._id;

  // Kiểm tra đầu vào
  if (
    !showtimeId ||
    !seatIds ||
    !Array.isArray(seatIds) ||
    seatIds.length === 0
  ) {
    res.status(400);
    throw new Error("Invalid showtimeId or seatIds");
  }

  // Kiểm tra showKarlime
  const showtime = await Showtime.findById(showtimeId);
  if (!showtime) {
    res.status(404);
    throw new Error("Showtime not found");
  }

  // Kiểm tra ghế tồn tại
  const existingSeats = await SeatStatus.find({
    showtime: showtimeId,
    seat: { $in: seatIds },
  });
  if (existingSeats.length !== seatIds.length) {
    res.status(400);
    throw new Error("Some seats are invalid or do not exist");
  }

  // Kiểm tra trạng thái và quyền sở hữu
  const invalidSeats = existingSeats.filter(
    (seat) =>
      seat.status !== "reserved" ||
      seat.reservedBy.toString() !== userId.toString()
  );
  if (invalidSeats.length > 0) {
    res.status(400);
    throw new Error(
      "Some seats are not reserved by you or not in reserved status"
    );
  }

  // Cập nhật trạng thái ghế
  const updateResult = await SeatStatus.updateMany(
    {
      showtime: showtimeId,
      seat: { $in: seatIds },
      status: "reserved",
      reservedBy: userId,
    },
    {
      $set: {
        status: "available",
        reservedAt: null,
        reservationExpires: null,
        reservedBy: null,
      },
    }
  );

  // Kiểm tra kết quả cập nhật
  if (updateResult.modifiedCount !== seatIds.length) {
    console.error("Failed to release seats:", {
      showtimeId,
      seatIds,
      modifiedCount: updateResult.modifiedCount,
    });
    res.status(500);
    throw new Error("Failed to release some seats");
  }

  // Gửi thông báo qua WebSocket
  broadcastSeatUpdate(showtimeId, {
    type: "seats-released",
    seatIds,
    userId,
    reason: "manual-release",
    timestamp: new Date(),
  });

  res.json({
    message: "Seats released successfully",
    releasedCount: updateResult.modifiedCount,
  });
});

// Book seats - POST /api/seat-status/book - Private
const bookSeats = asyncHandler(async (req, res) => {
  const { showtimeId, seatIds, bookingId } = req.body;

  // Kiểm tra đầu vào
  if (
    !showtimeId ||
    !seatIds ||
    !Array.isArray(seatIds) ||
    seatIds.length === 0 ||
    !bookingId
  ) {
    res.status(400);
    throw new Error("Invalid showtimeId, seatIds, or bookingId");
  }

  // Kiểm tra showtime
  const showtime = await Showtime.findById(showtimeId);
  if (!showtime) {
    res.status(404);
    throw new Error("Showtime not found");
  }

  // Kiểm tra booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Kiểm tra trạng thái ghế
  const existingSeats = await SeatStatus.find({
    showtime: showtimeId,
    seat: { $in: seatIds },
  });
  if (existingSeats.length !== seatIds.length) {
    res.status(400);
    throw new Error("Some seats are invalid or do not exist");
  }

  const invalidSeats = existingSeats.filter(
    (seat) => !["available", "reserved"].includes(seat.status)
  );
  if (invalidSeats.length > 0) {
    res.status(400);
    throw new Error("Some seats are not available or reserved");
  }

  const updateResult = await SeatStatus.updateMany(
    {
      showtime: showtimeId,
      seat: { $in: seatIds },
      status: { $in: ["available", "reserved"] },
    },
    {
      $set: {
        status: "booked",
        booking: bookingId,
        reservedAt: null,
        reservationExpires: null,
      },
    }
  );

  if (updateResult.modifiedCount !== seatIds.length) {
    console.error("Failed to book seats:", {
      showtimeId,
      seatIds,
      bookingId,
      modifiedCount: updateResult.modifiedCount,
    });
    res.status(400);
    throw new Error("Failed to book all seats");
  }

  // Gửi thông báo qua WebSocket
  broadcastSeatUpdate(showtimeId, {
    type: "seats-booked",
    seatIds,
    bookingId,
    timestamp: new Date(),
  });

  res.json({
    message: "Seats booked successfully",
    bookedCount: updateResult.modifiedCount,
  });
});

// Clean up expired reservations - POST /api/seat-status/cleanup - Private/Admin
const cleanupExpiredReservations = asyncHandler(async (req, res) => {
  const now = new Date();

  const updateResult = await SeatStatus.updateMany(
    {
      status: "reserved",
      reservationExpires: { $lt: now },
    },
    {
      $set: {
        status: "available",
        reservedAt: null,
        reservationExpires: null,
      },
    }
  );

  res.json({
    message: "Expired reservations cleaned up",
    cleanedCount: updateResult.modifiedCount,
  });
});

// Block/unblock seats - PUT /api/seat-status/block - Private/Admin
const toggleSeatBlock = asyncHandler(async (req, res) => {
  const { showtimeId, seatIds, block = true } = req.body;

  const newStatus = block ? "blocked" : "available";

  const updateResult = await SeatStatus.updateMany(
    {
      showtime: showtimeId,
      seat: { $in: seatIds },
    },
    {
      $set: {
        status: newStatus,
        reservedAt: null,
        reservationExpires: null,
        booking: null,
      },
    }
  );

  res.json({
    message: `Seats ${block ? "blocked" : "unblocked"} successfully`,
    updatedCount: updateResult.modifiedCount,
  });
});

// Get seat statuses by showtime - GET /api/seat-status/:showtimeId - Private
const getSeatStatusByShowtime = asyncHandler(async (req, res) => {
  const { showtimeId } = req.params;

  if (!mongoose.isValidObjectId(showtimeId)) {
    res.status(400);
    throw new Error("Invalid showtimeId");
  }

  const showtime = await Showtime.findById(showtimeId);
  if (!showtime) {
    res.status(404);
    throw new Error("Showtime not found");
  }

  const seatStatuses = await SeatStatus.find({ showtime: showtimeId })
    .populate("seat")
    .populate("reservedBy", "name email _id");

  res.json({
    success: true,
    seatStatuses,
  });
});

export {
  reserveSeats,
  releaseReservedSeats,
  bookSeats,
  cleanupExpiredReservations,
  toggleSeatBlock,
  getSeatStatusByShowtime,
};
