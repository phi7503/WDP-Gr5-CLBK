#!/usr/bin/env node

/**
 * Script to create showtimes for remaining movies (Ván Cờ Vây – The Match, Mật Danh: Kế Toán 2)
 * Usage: node createShowtimesForRemainingMovies.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Movie from './models/movieModel.js';
import Showtime from './models/showtimeModel.js';
import Branch from './models/branchModel.js';
import Theater from './models/theaterModel.js';
import Seat from './models/seatModel.js';
import SeatStatus from './models/seatStatusModel.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to get price for seat type
const getPriceForSeatType = (seatType, prices) => {
  switch (seatType) {
    case 'vip':
      return prices.vip || prices.standard * 1.5;
    case 'couple':
      return prices.couple || prices.standard * 2;
    default:
      return prices.standard;
  }
};

// Create showtimes for remaining movies
const createShowtimesForRemainingMovies = async () => {
  try {
    console.log('🎬 Starting showtime creation for remaining movies...');
    
    // Get movies that have 0 showtimes
    const movies = await Movie.find({ 
      status: 'now-showing',
      title: { $in: ['Ván Cờ Vây – The Match', 'Mật Danh: Kế Toán 2'] }
    });
    
    console.log(`Found ${movies.length} remaining movies without showtimes`);
    
    if (movies.length === 0) {
      console.log('✅ All movies already have showtimes!');
      return;
    }
    
    // Get all branches
    const branches = await Branch.find({});
    console.log(`Found ${branches.length} branches`);
    
    // Get all theaters
    const theaters = await Theater.find({});
    console.log(`Found ${theaters.length} theaters`);
    
    let createdCount = 0;
    
    // Different time slots for different movies to avoid conflicts
    const timeSlots = [
      { hour: 7, minute: 0 },     // 7:00 AM
      { hour: 9, minute: 30 },    // 9:30 AM
      { hour: 12, minute: 0 },    // 12:00 PM
      { hour: 14, minute: 30 },   // 2:30 PM
      { hour: 17, minute: 0 },    // 5:00 PM
      { hour: 19, minute: 30 },   // 7:30 PM
      { hour: 22, minute: 0 },    // 10:00 PM
    ];
    
    for (let movieIndex = 0; movieIndex < movies.length; movieIndex++) {
      const movie = movies[movieIndex];
      console.log(`\n🎭 Processing movie ${movieIndex + 1}/${movies.length}: ${movie.title}`);
      
      // Create showtimes for this movie across different branches and theaters
      for (const branch of branches) {
        // Get theaters for this branch
        const branchTheaters = await Theater.find({ 
          _id: { $in: branch.theaters } 
        });
        
        if (branchTheaters.length === 0) {
          console.log(`⚠️  No theaters found for branch: ${branch.name}`);
          continue;
        }
        
        // Create showtimes for each theater in this branch
        for (const theater of branchTheaters) {
          // Check if seats exist for this theater
          const seatCount = await Seat.countDocuments({
            theater: theater._id,
            branch: branch._id,
            isActive: true,
          });
          
          if (seatCount === 0) {
            console.log(`⚠️  No seats found for theater: ${theater.name} in branch: ${branch.name}`);
            continue;
          }
          
          // Create showtimes starting from next month to avoid conflicts
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = new Date(today);
          startDate.setMonth(today.getMonth() + 1); // Start from next month
          
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const showDate = new Date(startDate);
            showDate.setDate(startDate.getDate() + dayOffset);
            
            // Use different time slots for different movies
            const movieTimeSlots = timeSlots.slice(0, 4); // Use first 4 time slots per movie
            
            for (let i = 0; i < movieTimeSlots.length; i++) {
              const { hour, minute } = movieTimeSlots[i];
              
              const startTime = new Date(showDate);
              startTime.setHours(hour, minute, 0, 0);
              
              const endTime = new Date(startTime);
              endTime.setMinutes(endTime.getMinutes() + movie.duration || 120); // Default 2 hours
              
              // Check for conflicts
              const conflictingShowtime = await Showtime.findOne({
                theater: theater._id,
                $or: [
                  { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
                ],
              });
              
              if (conflictingShowtime) {
                console.log(`⚠️  Time conflict for ${theater.name} at ${startTime.toLocaleString()}`);
                continue;
              }
              
              // Create showtime
              const showtime = new Showtime({
                movie: movie._id,
                branch: branch._id,
                theater: theater._id,
                startTime: startTime,
                endTime: endTime,
                price: {
                  standard: 120000, // 120,000 VND (equivalent to $5)
                  vip: 180000,      // 180,000 VND (equivalent to $7.5)
                  couple: 240000,   // 240,000 VND (equivalent to $10)
                },
                isFirstShow: i === 0 && dayOffset === 0,
                isLastShow: i === movieTimeSlots.length - 1 && dayOffset === 6,
                status: 'active',
              });
              
              const createdShowtime = await showtime.save();
              
              // Create seat statuses for this showtime
              const seats = await Seat.find({
                theater: theater._id,
                branch: branch._id,
                isActive: true,
              });
              
              const seatStatuses = seats.map((seat) => ({
                showtime: createdShowtime._id,
                seat: seat._id,
                status: 'available',
                price: getPriceForSeatType(seat.type, createdShowtime.price),
              }));
              
              await SeatStatus.insertMany(seatStatuses);
              
              console.log(`✅ Created showtime: ${movie.title} at ${branch.name} - ${theater.name} on ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString()}`);
              createdCount++;
            }
          }
        }
      }
    }
    
    console.log('\n🎉 Showtime creation for remaining movies completed!');
    console.log(`📊 Summary:`);
    console.log(`   - ${createdCount} showtimes created`);
    console.log(`   - ${movies.length} movies processed`);
    
    // Show final statistics
    console.log('\n📈 Final Statistics:');
    const allMovies = await Movie.find({ status: 'now-showing' });
    for (const movie of allMovies) {
      const showtimeCount = await Showtime.countDocuments({ movie: movie._id });
      console.log(`   - ${movie.title}: ${showtimeCount} showtimes`);
    }
    
  } catch (error) {
    console.error('❌ Error creating showtimes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
connectDB().then(() => {
  createShowtimesForRemainingMovies();
});
