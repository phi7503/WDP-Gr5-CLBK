/**
 * Script to create multiple showtimes for today
 * Usage: node scripts/createShowtimesForToday.js
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

// Tạo showtime cho một thời điểm cụ thể
const createShowtime = async (movie, branch, theater, startTime, prices) => {
  try {
    const movieDoc = await Movie.findById(movie);
    if (!movieDoc) {
      console.log(`❌ Movie not found: ${movie}`);
      return null;
    }

    const endTime = new Date(startTime.getTime() + movieDoc.duration * 60000);

    // Kiểm tra conflict
    const conflictingShowtime = await Showtime.findOne({
      theater: theater,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (conflictingShowtime) {
      console.log(`⚠️ Conflict: Theater đã được đặt cho khung giờ này`);
      return null;
    }

    // Tạo showtime
    const newShowtime = new Showtime({
      movie: movie,
      branch: branch,
      theater: theater,
      startTime: startTime,
      endTime: endTime,
      price: prices,
      isFirstShow: false,
      isLastShow: false,
      status: 'active',
    });

    const created = await newShowtime.save();

    // Khởi tạo seat statuses
    const seats = await Seat.find({
      theater: theater,
      branch: branch,
      isActive: true,
    });

    if (seats.length > 0) {
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
      console.log(`   ✅ Đã khởi tạo ${seatStatuses.length} ghế`);
    }

    return created;
  } catch (error) {
    console.error(`❌ Error creating showtime:`, error);
    return null;
  }
};

const createShowtimesForToday = async () => {
  try {
    // Lấy các phim đang chiếu
    const movies = await Movie.find({ 
      status: { $in: ['now-showing', 'coming-soon'] },
      endDate: { $gte: new Date() } // Chỉ lấy phim chưa kết thúc
    }).select('_id title duration');
    
    if (movies.length === 0) {
      console.log('❌ Không tìm thấy phim nào. Vui lòng tạo phim trước.');
      return;
    }

    console.log(`\n📽️ Tìm thấy ${movies.length} phim:`);
    movies.forEach((movie, index) => {
      console.log(`   ${index + 1}. ${movie.title} (${movie.duration} phút)`);
    });

    // Lấy tất cả các branch active
    const branches = await Branch.find({ isActive: true }).select('_id name cinemaChain');
    if (branches.length === 0) {
      console.log('❌ Không tìm thấy chi nhánh nào.');
      return;
    }

    console.log(`\n🏢 Tìm thấy ${branches.length} chi nhánh:`);
    branches.forEach((branch, index) => {
      console.log(`   ${index + 1}. ${branch.name}`);
    });

    // Lấy ngày hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Các khung giờ trong ngày (9h, 12h, 15h, 18h, 21h)
    const timeSlots = [9, 12, 15, 18, 21];
    
    let createdCount = 0;
    let skippedCount = 0;

    // Tạo showtime cho mỗi phim, mỗi branch, mỗi theater, mỗi khung giờ
    for (const movie of movies) {
      for (const branch of branches) {
        // Lấy các theater của branch này
        const theaters = await Theater.find({ branch: branch._id }).select('_id name');
        
        if (theaters.length === 0) {
          console.log(`⚠️ Branch ${branch.name} không có theater nào.`);
          continue;
        }

        for (const theater of theaters) {
          // Kiểm tra theater có ghế không
          const seatCount = await Seat.countDocuments({
            theater: theater._id,
            branch: branch._id,
            isActive: true,
          });

          if (seatCount === 0) {
            console.log(`⚠️ Theater ${theater.name} không có ghế. Bỏ qua.`);
            continue;
          }

          for (const hour of timeSlots) {
            // Tạo startTime cho khung giờ này
            const startTime = new Date(today);
            startTime.setHours(hour, 0, 0, 0);

            // Chỉ tạo showtime trong tương lai (từ bây giờ trở đi)
            const now = new Date();
            if (startTime <= now) {
              // Nếu khung giờ đã qua, tạo cho ngày mai
              startTime.setDate(startTime.getDate() + 1);
            }

            // Giá vé mặc định
            const prices = {
              standard: 50000,
              vip: 75000,
              couple: 100000,
            };

            console.log(`\n🎬 Đang tạo showtime:`);
            console.log(`   Phim: ${movie.title}`);
            console.log(`   Chi nhánh: ${branch.name}`);
            console.log(`   Theater: ${theater.name}`);
            console.log(`   Thời gian: ${startTime.toLocaleString('vi-VN')}`);

            const showtime = await createShowtime(
              movie._id,
              branch._id,
              theater._id,
              startTime,
              prices
            );

            if (showtime) {
              createdCount++;
              console.log(`   ✅ Đã tạo thành công!`);
            } else {
              skippedCount++;
              console.log(`   ⚠️ Đã bỏ qua (có thể do conflict)`);
            }
          }
        }
      }
    }

    console.log(`\n🎉 Hoàn thành!`);
    console.log(`   ✅ Đã tạo: ${createdCount} showtime`);
    console.log(`   ⚠️ Đã bỏ qua: ${skippedCount} showtime`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Main execution
(async () => {
  await connectDB();
  await createShowtimesForToday();
  await mongoose.connection.close();
  process.exit(0);
})();

