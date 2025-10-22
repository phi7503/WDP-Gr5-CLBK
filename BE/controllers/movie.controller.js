import asyncHandler from "express-async-handler";
import Movie from "../models/movieModel.js";

// GET /api/movies
const getMovies = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [movies, total] = await Promise.all([
    Movie.find({ isActive: true }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Movie.countDocuments({ isActive: true }),
  ]);
  res.json({ success: true, movies, total, page: Number(page) });
});

// GET /api/movies/:id
const getMovieById = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    res.status(404);
    throw new Error("Movie not found");
  }
  res.json({ success: true, movie });
});

export { getMovies, getMovieById };


