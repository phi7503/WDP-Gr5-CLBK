#!/usr/bin/env node

/**
 * Script to reset all showtimes and create minimal showtimes (1-2 per movie)
 * Usage: node resetAndCreateMinimalShowtimes.js
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

// Helper function to format date/time
const formatDateTime = (date) => {
  return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString('vi-VN')}`;
};

// Helper function to get random items from array
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Main function
const resetAndCreateMinimalShowtimes = async () => {
  try {
    console.log('🎬 Starting showtime reset and minimal creation...\n');
    
    // Step 1: Delete all existing showtimes and seat statuses
    console.log('🗑️  Deleting all existing showtimes and seat statuses...');
    const deletedSeatStatuses = await SeatStatus.deleteMany({});
    const deletedShowtimes = await Showtime.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSeatStatuses.deletedCount} seat statuses`);
    console.log(`   ✅ Deleted ${deletedShowtimes.deletedCount} showtimes\n`);
    
    // Step 2: Get all movies
    const movies = await Movie.find({ status: 'now-showing' });
    console.log(`📽️  Found ${movies.length} movies with status 'now-showing'\n`);
    
    // Step 3: Get all branches and theaters
    const branches = await Branch.find({});
    console.log(`🏢 Found ${branches.length} branches\n`);
    
    // Get all theaters with seats
    const allTheaters = [];
    for (const branch of branches) {
      const branchTheaters = await Theater.find({ 
        _id: { $in: branch.theaters } 
      });
      
      for (const theater of branchTheaters) {
        const seatCount = await Seat.countDocuments({
          theater: theater._id,
          branch: branch._id,
          isActive: true,
        });
        
        if (seatCount > 0) {
          allTheaters.push({
            theater,
            branch,
            seatCount
          });
        }
      }
    }
    
    console.log(`🎭 Found ${allTheaters.length} theaters with seats\n`);
    
    if (allTheaters.length === 0) {
      console.log('❌ No theaters with seats found!');
      return;
    }
    
    // Step 4: Create 1-2 showtimes per movie at random theaters
    let createdCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Time slots to choose from
    const timeSlots = [
      { hour: 10, minute: 0 },
      { hour: 14, minute: 0 },
      { hour: 16, minute: 30 },
      { hour: 19, minute: 0 },
      { hour: 21, minute: 30 },
    ];
    
    for (const movie of movies) {
      console.log(`\n🎬 Creating showtimes for: ${movie.title} (${movie.duration} mins)`);
      
      // Randomly select 1-2 theaters for this movie
      const showtimesPerMovie = Math.random() > 0.5 ? 2 : 1;
      const selectedTheaters = getRandomItems(allTheaters, showtimesPerMovie);
      
      for (let i = 0; i < selectedTheaters.length; i++) {
        const { theater, branch, seatCount } = selectedTheaters[i];
        
        // Random day (0-6 days from today)
        const dayOffset = Math.floor(Math.random() * 7);
        const showDate = new Date(today);
        showDate.setDate(today.getDate() + dayOffset);
        
        // Random time slot
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        
        const startTime = new Date(showDate);
        startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + movie.duration);
        
        // Check for conflicts
        const conflictingShowtime = await Showtime.findOne({
          theater: theater._id,
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        });
        
        if (conflictingShowtime) {
          console.log(`   ⚠️  Conflict at ${branch.name} - ${theater.name} on ${formatDateTime(startTime)}`);
          // Try another time slot
          const alternateSlot = timeSlots[(timeSlots.indexOf(timeSlot) + 1) % timeSlots.length];
          startTime.setHours(alternateSlot.hour, alternateSlot.minute, 0, 0);
          endTime.setTime(startTime.getTime() + movie.duration * 60000);
          
          const stillConflict = await Showtime.findOne({
            theater: theater._id,
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          });
          
          if (stillConflict) {
            console.log(`   ⚠️  Still conflict, skipping this theater`);
            continue;
          }
        }
        
        // Create showtime
        const showtime = new Showtime({
          movie: movie._id,
          branch: branch._id,
          theater: theater._id,
          startTime: startTime,
          endTime: endTime,
          price: {
            standard: 120000,
            vip: 180000,
            couple: 240000,
          },
          status: 'active',
        });
        
        const createdShowtime = await showtime.save();
        
        // Create seat statuses
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
        
        console.log(`   ✅ Created at ${branch.name} - ${theater.name}`);
        console.log(`      📅 ${formatDateTime(startTime)} (${seatCount} seats)`);
        createdCount++;
      }
    }
    
    console.log('\n🎉 Showtime reset and creation completed!');
    console.log(`📊 Summary:`);
    console.log(`   - ${createdCount} showtimes created`);
    console.log(`   - Average ${(createdCount / movies.length).toFixed(1)} showtimes per movie`);
    
    // Show final statistics
    console.log('\n📈 Final Statistics:');
    for (const movie of movies) {
      const showtimeCount = await Showtime.countDocuments({ movie: movie._id });
      const showtimes = await Showtime.find({ movie: movie._id })
        .populate('branch', 'name')
        .populate('theater', 'name');
      
      console.log(`\n   ${movie.title}: ${showtimeCount} showtime(s)`);
      for (const st of showtimes) {
        console.log(`      - ${formatDateTime(st.startTime)} at ${st.branch.name} - ${st.theater.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
connectDB().then(() => {
  resetAndCreateMinimalShowtimes();
});
