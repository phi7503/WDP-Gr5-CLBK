import asyncHandler from "express-async-handler";
import Movie from "../models/movieModel.js";

//  Create a new movie  POST /api/movies  Private/Admin
const createMovie = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    duration,
    genre,
    releaseDate,
    endDate,
    language,
    director,
    cast,
    poster,
    trailer,
    status,
  } = req.body;

  const movie = await Movie.create({
    title,
    description,
    duration,
    genre,
    releaseDate,
    endDate,
    language,
    director,
    cast,
    poster,
    trailer,
    status: status || "coming-soon",
    hotness: 0,
    rating: 0,
  });

  if (movie) {
    res.status(201).json(movie);
  } else {
    res.status(400);
    throw new Error("Invalid movie data");
  }
});

// Get all movies  GET /api/movies  Public
const getMovies = asyncHandler(async (req, res) => {
  const { status, genre, search, sortBy } = req.query;
  const page = Number.parseInt(req.query.page) || 1;
  const limit = Number.parseInt(req.query.limit) || 10;

  const filter = {};

  // Filter by status
  if (status) {
    const statusArray = status.split(',').map(s => s.trim());
    filter.status = { $in: statusArray };
  }

  // Filter by genre
  if (genre) {
    filter.genre = { $in: [genre] };
  }

  // Search by title, description, cast, director, or genre
  if (search) {
    // Escape special regex characters
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
      { director: { $regex: escapedSearch, $options: "i" } },
      { cast: { $regex: escapedSearch, $options: "i" } },
      { genre: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  // Sorting options
  let sort = {};
  if (sortBy === "hotness") {
    sort = { hotness: -1 };
  } else if (sortBy === "releaseDate") {
    sort = { releaseDate: -1 };
  } else if (sortBy === "title") {
    sort = { title: 1 };
  } else {
    // Default sort by hotness and then release date
    sort = { hotness: -1, releaseDate: -1 };
  }

  const count = await Movie.countDocuments(filter);
  const movies = await Movie.find(filter)
    .sort(sort)
    .limit(limit)
    .skip((page - 1) * limit);

  res.json({
    movies,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// Get movie by ID  GET /api/movies/:id  Public
const getMovieById = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (movie) {
    res.json(movie);
  } else {
    res.status(404);
    throw new Error("Movie not found");
  }
});

// Update movie  PUT /api/movies/:id   Private/Admin
const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (movie) {
    movie.title = req.body.title || movie.title;
    movie.description = req.body.description || movie.description;
    movie.duration = req.body.duration || movie.duration;
    movie.genre = req.body.genre || movie.genre;
    movie.releaseDate = req.body.releaseDate || movie.releaseDate;
    movie.endDate = req.body.endDate || movie.endDate;
    movie.language = req.body.language || movie.language;
    movie.director = req.body.director || movie.director;
    movie.cast = req.body.cast || movie.cast;
    movie.poster = req.body.poster || movie.poster;
    movie.trailer = req.body.trailer || movie.trailer;
    movie.status = req.body.status || movie.status;

    const updatedMovie = await movie.save();
    res.json(updatedMovie);
  } else {
    res.status(404);
    throw new Error("Movie not found");
  }
});

// Delete movie   DELETE /api/movies/:id  Private/Admin
const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (movie) {
    await movie.deleteOne();
    res.json({ message: "Movie removed" });
  } else {
    res.status(404);
    throw new Error("Movie not found");
  }
});

// Get recommended movies for user  GET /api/movies/recommended  Private
const getRecommendedMovies = asyncHandler(async (req, res) => {
  // If user is logged in, get recommendations based on preferences
  if (req.user) {
    const userPreferences = req.user.preferences || {};
    const favoriteGenres = userPreferences.genres || [];

    // Get movies that match user's favorite genres
    let recommendedMovies = [];

    if (favoriteGenres.length > 0) {
      recommendedMovies = await Movie.find({
        genre: { $in: favoriteGenres },
        status: "now-showing",
      })
        .sort({ hotness: -1 })
        .limit(8);
    }

    // If not enough recommendations, add popular movies
    if (recommendedMovies.length < 8) {
      const additionalMovies = await Movie.find({
        status: "now-showing",
        _id: { $nin: recommendedMovies.map((m) => m._id) },
      })
        .sort({ hotness: -1 })
        .limit(8 - recommendedMovies.length);

      recommendedMovies = [...recommendedMovies, ...additionalMovies];
    }

    res.json(recommendedMovies);
  } else {
    // For guests, just return popular movies
    const popularMovies = await Movie.find({ status: "now-showing" })
      .sort({ hotness: -1 })
      .limit(8);

    res.json(popularMovies);
  }
});

// Update movie hotness based on ticket sales  PUT /api/movies/update-hotness  Private/Admin
const updateMovieHotness = asyncHandler(async (req, res) => {
  // Calculate hotness for all movies based on recent ticket sales
  const timeWindow = new Date();
  timeWindow.setDate(timeWindow.getDate() - 7); // Last 7 days

  // Aggregate bookings by movie and count tickets sold
  const movieTicketCounts = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: timeWindow },
        bookingStatus: { $in: ["confirmed", "completed"] },
      },
    },
    {
      $lookup: {
        from: "showtimes",
        localField: "showtime",
        foreignField: "_id",
        as: "showtimeInfo",
      },
    },
    {
      $unwind: "$showtimeInfo",
    },
    {
      $group: {
        _id: "$showtimeInfo.movie",
        ticketCount: { $sum: { $size: "$seats" } },
      },
    },
  ]);

  // Find max ticket count for normalization
  let maxTickets = 0;
  for (const movie of movieTicketCounts) {
    if (movie.ticketCount > maxTickets) {
      maxTickets = movie.ticketCount;
    }
  }

  // Update hotness for each movie
  const updates = [];
  for (const movie of movieTicketCounts) {
    // Normalize to a 0-10 scale
    const hotness = maxTickets > 0 ? (movie.ticketCount / maxTickets) * 10 : 0;

    updates.push({
      updateOne: {
        filter: { _id: movie._id },
        update: { $set: { hotness: Math.round(hotness * 10) / 10 } }, // Round to 1 decimal place
      },
    });
  }

  // Set hotness to 0 for movies with no recent bookings
  const moviesWithNoBookings = await Movie.find({
    _id: { $nin: movieTicketCounts.map((m) => m._id) },
  });

  for (const movie of moviesWithNoBookings) {
    updates.push({
      updateOne: {
        filter: { _id: movie._id },
        update: { $set: { hotness: 0 } },
      },
    });
  }

  // Execute bulk update if there are updates
  if (updates.length > 0) {
    await Movie.bulkWrite(updates);
  }

  res.json({
    message: "Movie hotness updated successfully",
    updatedCount: updates.length,
  });
});

// Get trending movies (highest hotness)  GET /api/movies/trending  Public
const getTrendingMovies = asyncHandler(async (req, res) => {
  const limit = Number.parseInt(req.query.limit) || 5;

  const trendingMovies = await Movie.find({ status: "now-showing" })
    .sort({ hotness: -1 })
    .limit(limit);

  res.json(trendingMovies);
});

// Get all movies (simple list for dropdowns) GET /api/movies/all Public
const getAllMoviesSimple = asyncHandler(async (req, res) => {
    const movies = await Movie.find({}).select('title').sort({ title: 1 });
    res.json(movies);
});

export {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  getRecommendedMovies,
  updateMovieHotness,
  getTrendingMovies,
  getAllMoviesSimple
};
