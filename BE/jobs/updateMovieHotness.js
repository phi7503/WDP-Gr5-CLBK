import cron from "node-cron";
import Movie from "../models/movieModel.js";
import Booking from "../models/bookingModel.js";

// Function to update movie hotness based on ticket sales
const updateMovieHotness = async () => {
  try {
    console.log("Running scheduled job: Update Movie Hotness");

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
      const hotness =
        maxTickets > 0 ? (movie.ticketCount / maxTickets) * 10 : 0;

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
      const result = await Movie.bulkWrite(updates);
      console.log(`Updated hotness for ${result.modifiedCount} movies`);
    } else {
      console.log("No movies to update");
    }
  } catch (error) {
    console.error("Error updating movie hotness:", error);
  }
};

// Schedule job to run every day at midnight
const scheduleHotnessUpdates = () => {
  cron.schedule("0 0 * * *", updateMovieHotness);
  console.log("Scheduled job: Update Movie Hotness - runs daily at midnight");
};

export { updateMovieHotness, scheduleHotnessUpdates };
