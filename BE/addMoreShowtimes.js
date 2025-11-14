#!/usr/bin/env node

/**
 * Script to add more showtimes to existing ones
 * Usage: node addMoreShowtimes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Movie from './models/movieModel.js';
import Showtime from './models/showtimeModel.js';
import Branch from './models/branchModel.js';
import Theater from './models/theaterModel.js';
import Seat from './models/seatModel.js';
import SeatStatus from './models/seatStatusModel.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

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

const formatDateTime = (date) => {
  return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString('vi-VN')}`;
};

const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};

const addMoreShowtimes = async () => {
  try {
    console.log('🎬 Adding more showtimes...\n');
    
    // Get all movies
    const movies = await Movie.find({ status: 'now-showing' });
    console.log(`📽️  Found ${movies.length} movies\n`);
    
    // Get all branches and theaters
    const branches = await Branch.find({});
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
          allTheaters.push({ theater, branch, seatCount });
        }
      }
    }
    
    console.log(`🎭 Found ${allTheaters.length} theaters with seats\n`);
    
    // Time slots
    const timeSlots = [
      { hour: 8, minute: 0 },
      { hour: 10, minute: 30 },
      { hour: 13, minute: 0 },
      { hour: 15, minute: 30 },
      { hour: 18, minute: 0 },
      { hour: 20, minute: 30 },
      { hour: 22, minute: 0 },
    ];
    
    let createdCount = 0;
    let attemptCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // For each movie, create 5-10 more showtimes
    for (const movie of movies) {
      const currentCount = await Showtime.countDocuments({ movie: movie._id });
      console.log(`\n🎬 ${movie.title} (${movie.duration} mins) - Current: ${currentCount} showtimes`);
      
      // Add 5-10 more showtimes per movie
      const showtimesToAdd = Math.floor(Math.random() * 6) + 5; // 5-10
      const selectedTheaters = getRandomItems(allTheaters, showtimesToAdd);
      
      for (const { theater, branch, seatCount } of selectedTheaters) {
        attemptCount++;
        
        // Random day (0-13 days from today for 2 weeks)
        const dayOffset = Math.floor(Math.random() * 14);
        const showDate = new Date(today);
        showDate.setDate(today.getDate() + dayOffset);
        
        // Random time slot
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        
        const startTime = new Date(showDate);
        startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + movie.duration + 15); // Add 15 min buffer
        
        // Check for conflicts
        const conflictingShowtime = await Showtime.findOne({
          theater: theater._id,
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        });
        
        if (conflictingShowtime) {
          console.log(`   ⚠️  Conflict at ${branch.name} - ${theater.name} on ${formatDateTime(startTime)}`);
          continue;
        }
        
        // Create showtime
        const showtime = new Showtime({
          movie: movie._id,
          branch: branch._id,
          theater: theater._id,
          startTime: startTime,
          endTime: new Date(startTime.getTime() + movie.duration * 60000),
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
        
        console.log(`   ✅ ${formatDateTime(startTime)} at ${branch.name} - ${theater.name}`);
        createdCount++;
      }
    }
    
    console.log('\n🎉 Adding showtimes completed!');
    console.log(`📊 Summary:`);
    console.log(`   - ${createdCount} new showtimes created`);
    console.log(`   - ${attemptCount} attempts made`);
    console.log(`   - ${((createdCount/attemptCount)*100).toFixed(1)}% success rate`);
    
    // Show final statistics
    console.log('\n📈 Final Statistics:');
    let totalShowtimes = 0;
    for (const movie of movies) {
      const showtimeCount = await Showtime.countDocuments({ movie: movie._id });
      totalShowtimes += showtimeCount;
      console.log(`   - ${movie.title}: ${showtimeCount} showtimes`);
    }
    console.log(`\n   📊 Total: ${totalShowtimes} showtimes across ${movies.length} movies`);
    console.log(`   📊 Average: ${(totalShowtimes/movies.length).toFixed(1)} showtimes per movie`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

connectDB().then(() => {
  addMoreShowtimes();
});
