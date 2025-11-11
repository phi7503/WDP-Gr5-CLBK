import mongoose from 'mongoose';
import SeatStatus from '../models/seatStatusModel.js';
import Seat from '../models/seatModel.js';
import User from '../models/userModel.js';

async function testSeatStatusAPI() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ Connected to MongoDB');
    
    const showtimeId = '68edec8659a062803f83a19e';
    
    // Test the same query that the API uses
    const seatStatuses = await SeatStatus.find({ showtime: showtimeId })
      .populate("seat")
      .populate("reservedBy", "name email _id");
    
    console.log(`\n🎫 Found ${seatStatuses.length} seat statuses for showtime ${showtimeId}`);
    
    if (seatStatuses.length > 0) {
      console.log('Sample seat status:');
      const sample = seatStatuses[0];
      console.log(`- Seat: ${sample.seat?.row}${sample.seat?.number}`);
      console.log(`- Status: ${sample.status}`);
      console.log(`- Reserved by: ${sample.reservedBy?.name || 'None'}`);
      console.log(`- Price: ${sample.price} VND`);
    }
    
    // Test API response format
    const apiResponse = {
      success: true,
      seatStatuses: seatStatuses
    };
    
    console.log('\n📡 API Response format:');
    console.log(`- success: ${apiResponse.success}`);
    console.log(`- seatStatuses count: ${apiResponse.seatStatuses.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSeatStatusAPI();
