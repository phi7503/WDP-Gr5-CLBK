import mongoose from "mongoose";
import Showtime from "../models/showtimeModel.js";
import Movie from "../models/movieModel.js";
import Branch from "../models/branchModel.js";
import Theater from "../models/theaterModel.js";
import Seat from "../models/seatModel.js";
import SeatStatus from "../models/seatStatusModel.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all showtimes
// @route   GET /api/showtimes
// @access  Public
// @desc    Get all showtimes
// @route   GET /api/showtimes
// @access  Public
export const getAllShowtimes = async (req, res) => {
  try {
    const { movie, branch, theater, date, status } = req.query;
    const page = Number.parseInt(req.query.page) || 1;

    const limit = Number.parseInt(req.query.limit) || 100; // Increased default from 10 to 100


    // Build filter
    const filter = {};
    if (movie && isValidObjectId(movie)) filter.movie = movie;
    if (branch && isValidObjectId(branch)) filter.branch = branch;
    if (theater && isValidObjectId(theater)) filter.theater = theater;

    if (status) filter.status = status;


    // Filter by date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: startOfDay, $lte: endOfDay };

    } else {
      // Filter out past showtimes by default (unless explicitly requested)
      if (!req.query.includePast) {
        filter.startTime = { $gte: new Date() };
      }
    }

    const count = await Showtime.countDocuments(filter);
    const showtimes = await Showtime.find(filter)

        .populate("movie", "title duration poster hotness backdropImage")
        .populate("branch", "name location cinemaChain")
        .populate("theater", "name")
        .sort({ createdAt: -1 }) // Explicitly sort by creation time, newest first
        .limit(limit)
        .skip((page - 1) * limit);

    // Tính totalSeats và bookedSeats cho từng showtime
    const showtimesWithSeats = await Promise.all(showtimes.map(async (s) => {
      // Tổng số ghế active của rạp này
      const totalSeats = await Seat.countDocuments({ theater: s.theater._id, branch: s.branch._id, isActive: true });

      // Số ghế đã đặt (chỉ đếm ghế có status "booked") HOẶC đã reserve (status "reserved")
      const bookedSeats = await SeatStatus.countDocuments({ 
        showtime: s._id, 
        status: { $in: ["booked", "reserved"] } // ✅ Đếm cả booked và reserved
      });
      return {
        ...s.toObject(),
        totalSeats,
        bookedSeats,
      };
    }));

    res.json({
      showtimes: showtimesWithSeats,
      page,
      pages: Math.ceil(count / limit),
      total: count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get a single showtime by ID
// @route   GET /api/showtimes/:id
// @access  Public
export const getShowtimeById = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return res.status(400).json({ message: "Invalid showtime ID" });

  try {
    const showtime = await Showtime.findById(id)

      .populate("movie", "title duration poster description genre backdropImage")
      .populate("branch", "name location contact cinemaChain")
      .populate("theater", "name seatLayout");

    if (!showtime)
      return res.status(404).json({ message: "Showtime not found" });

    // Get seat availability summary
    const seatStatusCounts = await SeatStatus.aggregate([
      { $match: { showtime: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const seatSummary = {
      available: 0,
      reserved: 0,
      booked: 0,
      blocked: 0,
      maintenance: 0,
    };

    seatStatusCounts.forEach((item) => {
      seatSummary[item._id] = item.count;
    });

    res.json({
      ...showtime.toObject(),
      seatSummary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Create a new showtime
// @route   POST /api/showtimes
// @access  Private/Admin
export const createShowtime = async (req, res) => {
  const {
    movie,
    branch,
    theater,
    startTime,
    endTime,
    price,
    isFirstShow = false,
    isLastShow = false,
    autoInitializeSeats = true, // ✅ New option to auto-create seat statuses
  } = req.body;

  if (
    ![movie, branch, theater].every(isValidObjectId) ||
    !startTime ||
    !endTime ||
    !price ||
    !price.standard
  ) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    const [mv, br, th] = await Promise.all([
      Movie.findById(movie),
      Branch.findById(branch),
      Theater.findById(theater),
    ]);

    if (!mv) return res.status(404).json({ message: "Movie not found" });
    if (!br) return res.status(404).json({ message: "Branch not found" });
    if (!th) return res.status(404).json({ message: "Theater not found" });

    // ✅ Verify theater belongs to branch
    if (!br.theaters.includes(theater)) {
      return res
        .status(400)
        .json({ message: "Theater does not belong to this branch" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start)
      return res
        .status(400)
        .json({ message: "endTime must be after startTime" });

    // ✅ Prevent creating showtime in the past
    const now = new Date();
    if (start < now) {
      return res
        .status(400)
        .json({ message: "Cannot create showtime in the past. startTime must be in the future." });
    }

    // ✅ Check for scheduling conflicts
    const conflictingShowtime = await Showtime.findOne({
      theater: theater,
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    });

    if (conflictingShowtime) {
      return res
        .status(400)
        .json({ message: "Theater is already booked for this time slot" });
    }

    // ✅ Get seat count from theater
    const seatCount = await Seat.countDocuments({
      theater: theater,
      branch: branch,
      isActive: true,
    });

    const newShowtime = new Showtime({
      movie,
      branch,
      theater,
      startTime: start,
      endTime: end,
      price: {
        standard: price.standard,
        vip: price.vip || price.standard * 1.5,
        couple: price.couple || price.standard * 2,
      },
      isFirstShow,
      isLastShow,
    });

    const created = await newShowtime.save();

    // ✅ Auto-initialize seat statuses if requested
    if (autoInitializeSeats && seatCount > 0) {
      const seats = await Seat.find({
        theater: theater,
        branch: branch,
        isActive: true,
      });

      const seatStatuses = seats.map((seat) => ({
        showtime: created._id,
        seat: seat._id,
        status: "available",
        price: getPriceForSeatType(seat.type, created.price),
      }));

      await SeatStatus.insertMany(seatStatuses);
    } else if (seatCount > 0) {
      // Nếu không auto-initialize, vẫn cần tạo seat statuses để seat layout hiển thị được
      const seats = await Seat.find({
        theater: theater,
        branch: branch,
        isActive: true,
      });

      const seatStatuses = seats.map((seat) => ({
        showtime: created._id,
        seat: seat._id,
        status: "available",
        price: getPriceForSeatType(seat.type, created.price),
      }));

      await SeatStatus.insertMany(seatStatuses);
    }

    const populated = await Showtime.findById(created._id)
      .populate("movie", "title duration poster backdropImage")
      .populate("branch", "name location cinemaChain")
      .populate("theater", "name");

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update a showtime
// @route   PUT /api/showtimes/:id
// @access  Private/Admin
export const updateShowtime = async (req, res) => {
  const { id } = req.params;
  const {
    movie,
    branch,
    theater,
    startTime,
    endTime,
    price,
    isFirstShow,
    isLastShow,
  } = req.body;

  if (!isValidObjectId(id))
    return res.status(400).json({ message: "Invalid showtime ID" });

  try {
    const showtime = await Showtime.findById(id);
    if (!showtime)
      return res.status(404).json({ message: "Showtime not found" });

    // ✅ Check if there are existing bookings before allowing major changes
    const hasBookings = await SeatStatus.countDocuments({
      showtime: id,
      status: { $in: ["booked", "reserved"] },
    });

    if (hasBookings > 0 && (theater || startTime || endTime)) {
      return res.status(400).json({
        message:
          "Cannot change theater or time for showtime with existing bookings",
      });
    }

    if (movie && !isValidObjectId(movie))
      return res.status(400).json({ message: "Invalid movie ID" });
    if (branch && !isValidObjectId(branch))
      return res.status(400).json({ message: "Invalid branch ID" });
    if (theater && !isValidObjectId(theater))
      return res.status(400).json({ message: "Invalid theater ID" });

    let start, end;
    if (startTime) {
      start = new Date(startTime);
      showtime.startTime = start;
    }
    if (endTime) {
      end = new Date(endTime);
      showtime.endTime = end;
    }
    if (startTime && endTime && end <= start) {
      return res
        .status(400)
        .json({ message: "endTime must be after startTime" });
    }

    if (movie) showtime.movie = movie;
    if (branch) showtime.branch = branch;
    if (theater) showtime.theater = theater;
    if (typeof isFirstShow === "boolean") showtime.isFirstShow = isFirstShow;
    if (typeof isLastShow === "boolean") showtime.isLastShow = isLastShow;

    if (price) {
      const { standard, vip, couple } = price;
      if (standard == null || typeof standard !== "number") {
        return res
          .status(400)
          .json({ message: "price.standard is required and must be a number" });
      }
      showtime.price.standard = standard;
      if (vip != null) showtime.price.vip = vip;
      if (couple != null) showtime.price.couple = couple;

      // ✅ Update seat prices if price changed
      await SeatStatus.updateMany({ showtime: id }, [
        {
          $lookup: {
            from: "seats",
            localField: "seat",
            foreignField: "_id",
            as: "seatInfo",
          },
        },
        {
          $set: {
            price: {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: [{ $arrayElemAt: ["$seatInfo.type", 0] }, "vip"],
                    },
                    then: vip || standard * 1.5,
                  },
                  {
                    case: {
                      $eq: [{ $arrayElemAt: ["$seatInfo.type", 0] }, "couple"],
                    },
                    then: couple || standard * 2,
                  },
                ],
                default: standard,
              },
            },
          },
        },
      ]);
    }

    await showtime.save();
    const populated = await Showtime.findById(id)
      .populate("movie", "title duration poster backdropImage")
      .populate("branch", "name location cinemaChain")
      .populate("theater", "name");

    return res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a showtime
// @route   DELETE /api/showtimes/:id
// @access  Private/Admin
export const deleteShowtime = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return res.status(400).json({ message: "Invalid showtime ID" });

  try {
    const showtime = await Showtime.findById(id);
    if (!showtime)
      return res.status(404).json({ message: "Showtime not found" });

    // ✅ Check for existing bookings
    const hasBookings = await SeatStatus.countDocuments({
      showtime: id,
      status: { $in: ["booked", "reserved"] },
    });

    if (hasBookings > 0) {
      return res.status(400).json({
        message: "Cannot delete showtime with existing bookings",
      });
    }

    // ✅ Delete associated seat statuses
    await SeatStatus.deleteMany({ showtime: id });

    await Showtime.findByIdAndDelete(id);
    res.json({ message: "Showtime and associated seat statuses removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Bulk delete showtimes
// @route   DELETE /api/showtimes/bulk
// @access  Private/Admin
export const bulkDeleteShowtimes = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.every(isValidObjectId)) {
    return res.status(400).json({ message: "Invalid IDs array" });
  }

  try {
    // ✅ Check for bookings in any of the showtimes
    const hasBookings = await SeatStatus.countDocuments({
      showtime: { $in: ids },
      status: { $in: ["booked", "reserved"] },
    });

    if (hasBookings > 0) {
      return res.status(400).json({
        message: "Cannot delete showtimes with existing bookings",
      });
    }

    // ✅ Delete seat statuses first
    await SeatStatus.deleteMany({ showtime: { $in: ids } });

    const result = await Showtime.deleteMany({ _id: { $in: ids } });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete past showtimes
// @route   DELETE /api/showtimes/past
// @access  Private/Admin
export const deletePastShowtimes = async (req, res) => {
  const { beforeDate } = req.body;
  const date = new Date(beforeDate);
  if (isNaN(date)) {
    return res.status(400).json({ message: "Invalid beforeDate" });
  }

  try {
    // ✅ Get past showtimes without bookings
    const pastShowtimes = await Showtime.find({
      startTime: { $lt: date },
    }).select("_id");

    const showtimeIds = pastShowtimes.map((s) => s._id);

    // ✅ Check for bookings
    const showtimesWithBookings = await SeatStatus.distinct("showtime", {
      showtime: { $in: showtimeIds },
      status: { $in: ["booked", "reserved"] },
    });

    const showtimesToDelete = showtimeIds.filter(
      (id) =>
        !showtimesWithBookings.some(
          (bookingId) => bookingId.toString() === id.toString()
        )
    );

    // ✅ Delete seat statuses first
    await SeatStatus.deleteMany({ showtime: { $in: showtimesToDelete } });

    const result = await Showtime.deleteMany({
      _id: { $in: showtimesToDelete },
    });
    res.json({
      deletedCount: result.deletedCount,
      skippedWithBookings: showtimesWithBookings.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update showtime status
// @route   PATCH /api/showtimes/:id/status
// @access  Private/Admin
export const updateShowtimeStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!isValidObjectId(id))
    return res.status(400).json({ message: "Invalid showtime ID" });
  if (typeof status !== "string")
    return res.status(400).json({ message: "Invalid status" });

  try {
    const showtime = await Showtime.findById(id);
    if (!showtime)
      return res.status(404).json({ message: "Showtime not found" });
    showtime.status = status;
    await showtime.save();
    const populated = await Showtime.findById(id)

      .populate("movie", "title duration backdropImage")
      .populate("branch", "name location cinemaChain")
      .populate("theater", "name");
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get showtime statistics
// @route   GET /api/showtimes/stats
// @access  Private/Admin
export const getShowtimeStats = async (req, res) => {
  try {
    const total = await Showtime.countDocuments();
    const upcoming = await Showtime.countDocuments({
      startTime: { $gte: new Date() },
    });
    const past = await Showtime.countDocuments({
      startTime: { $lt: new Date() },
    });

    // Group by movie
    const byMovie = await Showtime.aggregate([
      { $group: { _id: "$movie", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movie",
        },
      },
      { $unwind: "$movie" },
      {
        $project: {
          _id: 0,
          movieId: "$movie._id",
          title: "$movie.title",
          count: 1,
        },
      },
    ]);

    // ✅ Seat occupancy stats
    const occupancyStats = await SeatStatus.aggregate([
      {
        $group: {
          _id: "$showtime",
          totalSeats: { $sum: 1 },
          bookedSeats: {
            $sum: { $cond: [{ $eq: ["$status", "booked"] }, 1, 0] },
          },
        },
      },
      {
        $group: {
          _id: null,
          avgOccupancy: {
            $avg: {
              $cond: [
                { $gt: ["$totalSeats", 0] },
                { $divide: ["$bookedSeats", "$totalSeats"] },
                0,
              ],
            },
          },
          totalShowtimes: { $sum: 1 },
        },
      },
    ]);

    res.json({
      total,
      upcoming,
      past,
      byMovie,
      occupancy: occupancyStats[0] || { avgOccupancy: 0, totalShowtimes: 0 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Helper function
const getPriceForSeatType = (seatType, showtimePrices) => {
  switch (seatType) {
    case "vip":
      return showtimePrices.vip || showtimePrices.standard * 1.5;
    case "couple":
      return showtimePrices.couple || showtimePrices.standard * 2;
    default:
      return showtimePrices.standard;
  }
};
