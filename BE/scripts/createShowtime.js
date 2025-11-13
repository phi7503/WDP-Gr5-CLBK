/**
 * Script to create a new showtime with automatic seat initialization
 * Usage: node scripts/createShowtime.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';
import Branch from '../models/branchModel.js';
import Theater from '../models/theaterModel.js';
import Showtime from '../models/showtimeModel.js';
import Seat from '../models/seatModel.js';
import SeatStatus from '../models/seatStatusModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Helper function to get price for seat type
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

const createShowtime = async () => {
  try {
    // Get all movies
    const movies = await Movie.find({ status: { $in: ['now-showing', 'coming-soon'] } }).select('_id title duration');
    if (movies.length === 0) {
      console.log('❌ No movies found. Please create movies first.');
      return;
    }

    console.log('\n📽️ Available Movies:');
    movies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title} (${movie.duration} min) - ID: ${movie._id}`);
    });

    // Get all branches
    const branches = await Branch.find({ isActive: true }).select('_id name cinemaChain');
    if (branches.length === 0) {
      console.log('❌ No branches found. Please create branches first.');
      return;
    }

    console.log('\n🏢 Available Branches:');
    branches.forEach((branch, index) => {
      console.log(`${index + 1}. ${branch.name} (${branch.cinemaChain}) - ID: ${branch._id}`);
    });

    // Example: Create showtime for first movie, first branch
    // In production, you can modify this to accept command line arguments or use prompt
    const selectedMovie = movies[0];
    const selectedBranch = branches[0];

    // Get theaters for this branch
    const theaters = await Theater.find({ branch: selectedBranch._id }).select('_id name');
    if (theaters.length === 0) {
      console.log(`❌ No theaters found for branch ${selectedBranch.name}.`);
      return;
    }

    console.log(`\n🎭 Available Theaters for ${selectedBranch.name}:`);
    theaters.forEach((theater, index) => {
      console.log(`${index + 1}. ${theater.name} - ID: ${theater._id}`);
    });

    const selectedTheater = theaters[0];

    // Check if theater has seats
    const seatCount = await Seat.countDocuments({
      theater: selectedTheater._id,
      branch: selectedBranch._id,
      isActive: true,
    });

    if (seatCount === 0) {
      console.log(`⚠️ Warning: Theater ${selectedTheater.name} has no seats. Seats will not be initialized.`);
    }

    // Create showtime for tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const startTime = tomorrow;
    const endTime = new Date(startTime.getTime() + selectedMovie.duration * 60000);

    // Check for conflicts
    const conflictingShowtime = await Showtime.findOne({
      theater: selectedTheater._id,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (conflictingShowtime) {
      console.log(`❌ Conflict: Theater is already booked for this time slot.`);
      console.log(`Existing showtime: ${conflictingShowtime.startTime} - ${conflictingShowtime.endTime}`);
      return;
    }

    // Default prices
    const price = {
      standard: 50000,
      vip: 75000,
      couple: 100000,
    };

    // Create showtime
    const newShowtime = new Showtime({
      movie: selectedMovie._id,
      branch: selectedBranch._id,
      theater: selectedTheater._id,
      startTime: startTime,
      endTime: endTime,
      price: price,
      isFirstShow: false,
      isLastShow: false,
      status: 'active',
    });

    const created = await newShowtime.save();
    console.log(`\n✅ Showtime created successfully!`);
    console.log(`   ID: ${created._id}`);
    console.log(`   Movie: ${selectedMovie.title}`);
    console.log(`   Branch: ${selectedBranch.name}`);
    console.log(`   Theater: ${selectedTheater.name}`);
    console.log(`   Start: ${startTime.toLocaleString('vi-VN')}`);
    console.log(`   End: ${endTime.toLocaleString('vi-VN')}`);

    // Initialize seat statuses
    if (seatCount > 0) {
      const seats = await Seat.find({
        theater: selectedTheater._id,
        branch: selectedBranch._id,
        isActive: true,
      });

      const seatStatuses = seats.map((seat) => ({
        showtime: created._id,
        seat: seat._id,
        status: "available",
        price: getPriceForSeatType(seat.type, created.price),
        reservedBy: null,
        reservedAt: null,
        reservationExpires: null,
        booking: null,
      }));

      await SeatStatus.insertMany(seatStatuses);
      console.log(`\n✅ Initialized ${seatStatuses.length} seats for this showtime.`);
    } else {
      console.log(`\n⚠️ No seats were initialized (theater has no seats).`);
    }

    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error creating showtime:', error);
  }
};

// Main execution
(async () => {
  await connectDB();
  await createShowtime();
  await mongoose.connection.close();
  process.exit(0);
})();

