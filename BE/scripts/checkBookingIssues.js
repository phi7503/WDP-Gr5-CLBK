/**
 * Script to check booking issues
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Showtime from '../models/showtimeModel.js';
import SeatStatus from '../models/seatStatusModel.js';
import Seat from '../models/seatModel.js';
import Movie from '../models/movieModel.js';
import Theater from '../models/theaterModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const checkBookingIssues = async () => {
  try {
    console.log('\n🔍 Checking booking issues...\n');

    const now = new Date();
    console.log('📅 Current time:', now.toLocaleString('vi-VN'));

    // Check showtimes
    const showtimes = await Showtime.find({ startTime: { $gte: now } })
      .populate('movie', 'title')
      .populate('theater', 'name')
      .limit(10)
      .sort({ startTime: 1 });

    console.log(`\n📽️  Showtimes tương lai: ${showtimes.length}`);
    
    if (showtimes.length === 0) {
      console.log('❌ KHÔNG CÓ showtime nào trong tương lai!');
      console.log('💡 Chạy: npm run create-showtime để tạo showtime mới');
      return;
    }

    console.log('\n📋 Danh sách showtimes:');
    for (const st of showtimes.slice(0, 5)) {
      const availableSeats = await SeatStatus.countDocuments({
        showtime: st._id,
        status: 'available'
      });
      const totalSeats = await SeatStatus.countDocuments({ showtime: st._id });
      const bookedSeats = await SeatStatus.countDocuments({
        showtime: st._id,
        status: 'booked'
      });

      console.log(`\n  🎬 ${st.movie?.title || 'N/A'}`);
      console.log(`     ID: ${st._id}`);
      console.log(`     Theater: ${st.theater?.name || 'N/A'}`);
      console.log(`     Start: ${st.startTime.toLocaleString('vi-VN')}`);
      console.log(`     End: ${st.endTime.toLocaleString('vi-VN')}`);
      console.log(`     📊 Seats: ${availableSeats} available / ${totalSeats} total / ${bookedSeats} booked`);

      if (totalSeats === 0) {
        console.log(`     ⚠️  WARNING: Showtime không có ghế!`);
      }
      if (availableSeats === 0 && totalSeats > 0) {
        console.log(`     ⚠️  WARNING: Tất cả ghế đã được đặt!`);
      }
    }

    // Check seats
    const firstShowtime = showtimes[0];
    if (firstShowtime) {
      console.log(`\n🔍 Chi tiết showtime đầu tiên (${firstShowtime._id}):`);
      
      const seatsStatus = await SeatStatus.find({ showtime: firstShowtime._id })
        .populate('seat', 'row number type')
        .limit(10);

      if (seatsStatus.length === 0) {
        console.log('❌ Showtime không có SeatStatus nào!');
        console.log('💡 Có thể cần chạy script initializeSeatStatuses');
        
        // Check if theater has seats
        const theaterSeats = await Seat.find({
          theater: firstShowtime.theater,
          branch: firstShowtime.branch,
          isActive: true
        });
        console.log(`   Theater có ${theaterSeats.length} ghế`);
      } else {
        console.log(`\n📋 Sample seats (first 10):`);
        seatsStatus.forEach(ss => {
          const seat = ss.seat;
          if (seat) {
            console.log(`   ${seat.row}${seat.number} - ${ss.status} - ${ss.price?.toLocaleString('vi-VN')} VND`);
          }
        });
      }
    }

    console.log('\n✅ Check completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await checkBookingIssues();
  await mongoose.connection.close();
  process.exit(0);
})();

