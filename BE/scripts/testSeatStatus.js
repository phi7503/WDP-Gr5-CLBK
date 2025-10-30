import mongoose from 'mongoose';
import SeatStatus from '../models/seatStatusModel.js';
import Seat from '../models/seatModel.js';

async function testSeatStatus() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ Connected to MongoDB');
    
    // Get a showtime ID from the previous check
    const showtimeId = '68edec8659a062803f83a19e';
    
    // Check seat statuses for this showtime
    const seatStatuses = await SeatStatus.find({ showtime: showtimeId })
      .populate('seat')
      .limit(10);
    
    console.log(`\n🎫 Seat statuses for showtime ${showtimeId}:`);
    
    if (seatStatuses.length === 0) {
      console.log('❌ No seat statuses found!');
    } else {
      seatStatuses.forEach((status, i) => {
        console.log(`${i+1}. Seat: ${status.seat?.row}${status.seat?.number}`);
        console.log(`   Status: ${status.status}`);
        console.log(`   Reserved by: ${status.reservedBy || 'None'}`);
        console.log(`   Reserved at: ${status.reservedAt || 'None'}`);
        console.log(`   Expires at: ${status.reservationExpires || 'None'}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSeatStatus();

