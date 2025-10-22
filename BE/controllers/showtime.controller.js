import asyncHandler from "express-async-handler";
import Showtime from "../models/showtimeModel.js";

// GET /api/showtimes
const getShowtimes = asyncHandler(async (req, res) => {
  const { movie, limit = 50, page = 1 } = req.query;
  const filter = {};
  if (movie) filter.movie = movie;
  const skip = (Number(page) - 1) * Number(limit);
  const query = Showtime.find(filter)
    .populate("movie", "title poster duration")
    .populate("theater", "name")
    .populate("branch", "name location")
    .sort({ startTime: 1 })
    .skip(skip)
    .limit(Number(limit));
  const [showtimes, total] = await Promise.all([
    query,
    Showtime.countDocuments(filter),
  ]);
  res.json({ success: true, showtimes, total, page: Number(page) });
});

// GET /api/showtimes/:id
const getShowtimeById = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id)
    .populate("movie", "title poster duration")
    .populate("theater", "name")
    .populate("branch", "name location");
  if (!showtime) {
    res.status(404);
    throw new Error("Showtime not found");
  }
  res.json(showtime);
});

export { getShowtimes, getShowtimeById };


