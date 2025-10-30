import mongoose from 'mongoose';
import SeatStatus from '../models/seatStatusModel.js';
import Seat from '../models/seatModel.js';

async function testSeatLocking() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ Connected to MongoDB');

    const showtimeId = '68f70af5d7083344ef66c73d';
    const seatIds = ['6883a135245b2d10fd9e9884', '6883a135245b2d10fd9e9885'];
    const userId = '68fb42ee605488126ca4852d'; // test1 user

    console.log('🧪 Testing seat locking...');
    console.log('Showtime:', showtimeId);
    console.log('Seats:', seatIds);
    console.log('User:', userId);

    // Check current seat status
    console.log('\n📊 Current seat status:');
    for (const seatId of seatIds) {
      const seatStatus = await SeatStatus.findOne({
        showtime: showtimeId,
        seat: seatId
      }).populate('seat');
      
      console.log(`Seat ${seatStatus?.seat?.row}${seatStatus?.seat?.number}: ${seatStatus?.status} (reserved by: ${seatStatus?.reservedBy})`);
    }

    // Test locking seats
    console.log('\n🔒 Testing seat locking...');
    const updatedSeats = [];
    for (const seatId of seatIds) {
      const updated = await SeatStatus.findOneAndUpdate(
        {
          showtime: showtimeId,
          seat: seatId,
          status: "available",
        },
        {
          $set: {
            status: "selecting",
            reservedBy: userId,
            reservedAt: new Date(),
            reservationExpires: new Date(Date.now() + 15 * 60 * 1000),
          },
        },
        { new: true }
      );
      
      if (updated) {
        console.log(`✅ Seat ${seatId} locked successfully`);
        updatedSeats.push(updated);
      } else {
        console.log(`❌ Seat ${seatId} could not be locked`);
      }
    }

    // Check final status
    console.log('\n📊 Final seat status:');
    for (const seatId of seatIds) {
      const seatStatus = await SeatStatus.findOne({
        showtime: showtimeId,
        seat: seatId
      }).populate('seat');
      
      console.log(`Seat ${seatStatus?.seat?.row}${seatStatus?.seat?.number}: ${seatStatus?.status} (reserved by: ${seatStatus?.reservedBy})`);
    }

    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSeatLocking();