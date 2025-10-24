import mongoose from 'mongoose';
import SeatStatus from '../models/seatStatusModel.js';
import Showtime from '../models/showtimeModel.js';
import Seat from '../models/seatModel.js';
import Theater from '../models/theaterModel.js';

async function initializeSeatStatuses() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ Connected to MongoDB');
    
    // Get all showtimes
    const showtimes = await Showtime.find().limit(5);
    console.log(`📅 Found ${showtimes.length} showtimes`);
    
    for (const showtime of showtimes) {
      console.log(`\n🎬 Processing showtime: ${showtime._id}`);
      
      // Get theater for this showtime
      const theater = await Theater.findById(showtime.theater);
      if (!theater) {
        console.log('❌ Theater not found, skipping...');
        continue;
      }
      
      // Get all seats for this theater
      const seats = await Seat.find({ theater: theater._id });
      console.log(`🎫 Found ${seats.length} seats in theater ${theater.name}`);
      
      // Create seat statuses for each seat
      let createdCount = 0;
      for (const seat of seats) {
        // Check if seat status already exists
        const existingStatus = await SeatStatus.findOne({
          showtime: showtime._id,
          seat: seat._id
        });
        
        if (!existingStatus) {
          await SeatStatus.create({
            showtime: showtime._id,
            seat: seat._id,
            status: 'available',
            reservedBy: null,
            reservedAt: null,
            reservationExpires: null,
            booking: null,
            price: seat.price || 50000 // Default price if not set
          });
          createdCount++;
        }
      }
      
      console.log(`✅ Created ${createdCount} seat statuses for showtime ${showtime._id}`);
    }
    
    console.log('\n🎉 Seat statuses initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initializeSeatStatuses();
