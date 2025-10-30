const mongoose = require('mongoose');
const Showtime = require('../models/showtimeModel');
const SeatStatus = require('../models/seatStatusModel');
const Seat = require('../models/seatModel');

mongoose.connect('mongodb://localhost:27017/cinema_booking');

async function checkSeatPrices() {
  try {
    console.log('=== CHECKING SEAT PRICES ===\n');
    
    // Lấy một showtime để test
    const showtime = await Showtime.findOne({}).populate('movie');
    if (!showtime) {
      console.log('❌ No showtimes found');
      process.exit(1);
    }
    
    console.log(`Showtime: ${showtime.movie?.title}`);
    console.log(`Showtime price:`, showtime.price);
    
    // Kiểm tra seats cho showtime này
    const seats = await Seat.find({
      theater: showtime.theater,
      branch: showtime.branch,
      isActive: true
    }).limit(5);
    
    console.log(`\nFound ${seats.length} seats:`);
    seats.forEach(seat => {
      console.log(`- Seat ${seat.row}${seat.number} (${seat.type})`);
    });
    
    // Kiểm tra seat statuses
    const seatStatuses = await SeatStatus.find({
      showtime: showtime._id
    }).populate('seat').limit(5);
    
    console.log(`\nFound ${seatStatuses.length} seat statuses:`);
    seatStatuses.forEach(status => {
      if (status.seat) {
        console.log(`- Seat ${status.seat.row}${status.seat.number}: ${status.status}, Price: ${status.price} VND`);
      }
    });
    
    console.log('\n✅ Price check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSeatPrices();
