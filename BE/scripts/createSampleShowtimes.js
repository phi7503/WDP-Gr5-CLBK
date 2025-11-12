/**
 * Script to create sample showtimes for today and tomorrow
 * Usage: node scripts/createSampleShowtimes.js
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
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
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
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ],
    });

    if (conflictingShowtime) {
      console.log(`   ⚠️ Conflict: Theater đã được đặt cho khung giờ này`);
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

const createSampleShowtimes = async () => {
  try {
    // Lấy 3-5 phim đang chiếu đầu tiên (bỏ qua filter endDate để lấy tất cả)
    let movies = await Movie.find({ 
      status: { $in: ['now-showing', 'coming-soon'] }
    })
    .select('_id title duration status endDate')
    .limit(5)
    .sort({ hotness: -1 });
    
    // Nếu không tìm thấy, lấy tất cả phim
    if (movies.length === 0) {
      console.log('⚠️ Không tìm thấy phim với status now-showing/coming-soon, đang lấy tất cả phim...');
      movies = await Movie.find({})
        .select('_id title duration status endDate')
        .limit(5)
        .sort({ createdAt: -1 });
    }
    
    if (movies.length === 0) {
      console.log('❌ Không tìm thấy phim nào. Vui lòng tạo phim trước.');
      return;
    }

    console.log(`\n📽️ Tìm thấy ${movies.length} phim:`);
    movies.forEach((movie, index) => {
      console.log(`   ${index + 1}. ${movie.title} (${movie.duration} phút) - ${movie.status}`);
    });

    // Lấy 2-3 branch đầu tiên
    const branches = await Branch.find({ isActive: true })
      .select('_id name cinemaChain')
      .limit(3);
      
    if (branches.length === 0) {
      console.log('❌ Không tìm thấy chi nhánh nào.');
      return;
    }

    console.log(`\n🏢 Tìm thấy ${branches.length} chi nhánh:`);
    branches.forEach((branch, index) => {
      console.log(`   ${index + 1}. ${branch.name}`);
    });

    // Tạo showtimes cho hôm nay và ngày mai
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Các khung giờ phổ biến: 10h, 13h, 16h, 19h, 22h
    const timeSlots = [10, 13, 16, 19, 22];
    
    let createdCount = 0;
    let skippedCount = 0;

    // Tạo showtime cho mỗi phim, mỗi branch, mỗi theater, mỗi khung giờ
    for (const movie of movies) {
      for (const branch of branches) {
        // Lấy theater đầu tiên của branch này
        const theaters = await Theater.find({ branch: branch._id })
          .select('_id name')
          .limit(2); // Chỉ lấy 2 theater đầu tiên
        
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

          // Tạo showtimes cho hôm nay và ngày mai
          const dates = [today, tomorrow];
          
          for (const date of dates) {
            // Chỉ tạo 2-3 khung giờ đầu tiên để không quá nhiều
            const selectedTimeSlots = date === today 
              ? timeSlots.filter(hour => {
                  const testTime = new Date(date);
                  testTime.setHours(hour, 0, 0, 0);
                  return testTime > new Date(); // Chỉ lấy giờ trong tương lai
                }).slice(0, 3) // Tối đa 3 suất cho hôm nay
              : timeSlots.slice(0, 3); // Tối đa 3 suất cho ngày mai

            for (const hour of selectedTimeSlots) {
              // Tạo startTime cho khung giờ này
              const startTime = new Date(date);
              startTime.setHours(hour, 0, 0, 0);

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
              console.log(`   Thời gian: ${startTime.toLocaleString('vi-VN', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}`);

              const showtime = await createShowtime(
                movie._id,
                branch._id,
                theater._id,
                startTime,
                prices
              );

              if (showtime) {
                createdCount++;
                console.log(`   ✅ Đã tạo thành công! (ID: ${showtime._id})`);
              } else {
                skippedCount++;
                console.log(`   ⚠️ Đã bỏ qua (có thể do conflict)`);
              }
            }
          }
        }
      }
    }

    console.log(`\n🎉 Hoàn thành!`);
    console.log(`   ✅ Đã tạo: ${createdCount} showtime`);
    console.log(`   ⚠️ Đã bỏ qua: ${skippedCount} showtime`);
    
    // Hiển thị tổng số showtime hiện có
    const totalShowtimes = await Showtime.countDocuments({ status: 'active' });
    console.log(`   📊 Tổng số showtime active: ${totalShowtimes}`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Main execution
(async () => {
  await connectDB();
  await createSampleShowtimes();
  await mongoose.connection.close();
  console.log('\n✅ Đã đóng kết nối database');
  process.exit(0);
})();

