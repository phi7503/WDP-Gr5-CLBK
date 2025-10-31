/**
 * Script to create showtimes for all existing movies in database
 * Usage: node scripts/createShowtimesForExistingMovies.js
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
      return null;
    }

    const endTime = new Date(startTime.getTime() + movieDoc.duration * 60000);

    // Kiểm tra conflict - chỉ tạo nếu chưa có showtime nào trùng
    const conflictingShowtime = await Showtime.findOne({
      theater: theater,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (conflictingShowtime) {
      return null; // Bỏ qua nếu có conflict
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
    }

    return created;
  } catch (error) {
    console.error(`❌ Error creating showtime:`, error.message);
    return null;
  }
};

const createShowtimesForExistingMovies = async () => {
  try {
    // Lấy tất cả phim đang chiếu hoặc sắp chiếu
    // Loại bỏ filter endDate để lấy tất cả phim có status now-showing hoặc coming-soon
    const movies = await Movie.find({ 
      status: { $in: ['now-showing', 'coming-soon'] }
    }).select('_id title duration endDate');
    
    if (movies.length === 0) {
      console.log('❌ Không tìm thấy phim nào trong database.');
      console.log('💡 Tip: Hãy tạo phim trước khi chạy script này.');
      return;
    }

    console.log(`\n📽️ Tìm thấy ${movies.length} phim trong database:`);
    movies.forEach((movie, index) => {
      console.log(`   ${index + 1}. ${movie.title} (${movie.duration} phút)`);
    });

    // Lấy tất cả các branch active
    const branches = await Branch.find({ isActive: true }).select('_id name cinemaChain theaters');
    if (branches.length === 0) {
      console.log('\n❌ Không tìm thấy chi nhánh nào.');
      return;
    }

    console.log(`\n🏢 Tìm thấy ${branches.length} chi nhánh:`);
    branches.forEach((branch, index) => {
      console.log(`   ${index + 1}. ${branch.name}`);
    });

    // Lấy ngày hôm nay và tạo showtime cho 7 ngày tiếp theo
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Các khung giờ trong ngày (9h, 12h, 15h, 18h, 21h)
    const timeSlots = [9, 12, 15, 18, 21];
    
    let createdCount = 0;
    let skippedCount = 0;
    let totalProcessed = 0;

    // Tạo showtime cho 7 ngày tiếp theo
    const daysToCreate = 7;

    console.log(`\n🎬 Bắt đầu tạo showtime cho ${daysToCreate} ngày...\n`);

    for (const movie of movies) {
      console.log(`\n📽️  Phim: ${movie.title}`);
      
      for (let dayOffset = 0; dayOffset < daysToCreate; dayOffset++) {
        const showDate = new Date(today);
        showDate.setDate(showDate.getDate() + dayOffset);

        for (const branch of branches) {
          // Lấy các theater của branch này
          let theaters = [];
          
          if (branch.theaters && branch.theaters.length > 0) {
            // Nếu branch có theaters trong schema
            theaters = await Theater.find({ 
              _id: { $in: branch.theaters },
              branch: branch._id 
            }).select('_id name');
          } else {
            // Fallback: tìm theater theo branch
            theaters = await Theater.find({ branch: branch._id }).select('_id name');
          }
          
          if (theaters.length === 0) {
            continue; // Bỏ qua nếu không có theater
          }

          for (const theater of theaters) {
            // Kiểm tra theater có ghế không
            const seatCount = await Seat.countDocuments({
              theater: theater._id,
              branch: branch._id,
              isActive: true,
            });

            if (seatCount === 0) {
              continue; // Bỏ qua nếu không có ghế
            }

            for (const hour of timeSlots) {
              // Tạo startTime cho khung giờ này
              const startTime = new Date(showDate);
              startTime.setHours(hour, 0, 0, 0);

              // Chỉ tạo showtime trong tương lai (từ bây giờ trở đi)
              const now = new Date();
              if (startTime <= now) {
                continue; // Bỏ qua nếu khung giờ đã qua
              }

              // Giá vé mặc định
              const prices = {
                standard: 50000,
                vip: 75000,
                couple: 100000,
              };

              totalProcessed++;

              const showtime = await createShowtime(
                movie._id,
                branch._id,
                theater._id,
                startTime,
                prices
              );

              if (showtime) {
                createdCount++;
                if (createdCount % 10 === 0) {
                  process.stdout.write('.');
                }
              } else {
                skippedCount++;
              }
            }
          }
        }
      }
    }

    console.log(`\n\n🎉 Hoàn thành!`);
    console.log(`\n📊 TỔNG KẾT:`);
    console.log(`   ✅ Đã tạo: ${createdCount} showtime`);
    console.log(`   ⚠️  Đã bỏ qua (conflict): ${skippedCount} showtime`);
    console.log(`   📋 Tổng số đã xử lý: ${totalProcessed}`);
    console.log(`   📽️  Số phim: ${movies.length}`);
    console.log(`   🏢 Số chi nhánh: ${branches.length}`);
    console.log(`   📅 Số ngày: ${daysToCreate} ngày`);
    console.log(`   🕐 Số khung giờ/ngày: ${timeSlots.length} khung giờ\n`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Main execution
(async () => {
  await connectDB();
  await createShowtimesForExistingMovies();
  await mongoose.connection.close();
  process.exit(0);
})();

