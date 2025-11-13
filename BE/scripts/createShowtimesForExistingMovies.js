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

    // Lấy một vài branch đại diện ở mỗi miền (Bắc, Trung, Nam)
    const allBranches = await Branch.find({ isActive: true }).select('_id name cinemaChain theaters location');
    
    // Chọn rạp đại diện: 2-3 rạp ở mỗi miền
    const selectedBranches = [];
    
    // Miền Bắc (Hà Nội, Hải Phòng, Quảng Ninh)
    const northBranches = allBranches.filter(b => {
      const city = b.location?.city || '';
      const province = b.location?.province || '';
      return city === 'Hà Nội' || province === 'Hà Nội' || 
             city === 'Hải Phòng' || province === 'Hải Phòng' ||
             city === 'Hạ Long' || province === 'Quảng Ninh';
    }).slice(0, 3);
    selectedBranches.push(...northBranches);
    
    // Miền Trung (Đà Nẵng, Huế, Nha Trang)
    const centralBranches = allBranches.filter(b => {
      const city = b.location?.city || '';
      const province = b.location?.province || '';
      return city === 'Đà Nẵng' || province === 'Đà Nẵng' ||
             city === 'Huế' || province === 'Thừa Thiên Huế' ||
             city === 'Nha Trang' || province === 'Khánh Hòa';
    }).slice(0, 3);
    selectedBranches.push(...centralBranches);
    
    // Miền Nam (TP.HCM, Cần Thơ)
    const southBranches = allBranches.filter(b => {
      const city = b.location?.city || '';
      const province = b.location?.province || '';
      return city === 'Ho Chi Minh' || province === 'Ho Chi Minh' ||
             city === 'TP.HCM' || province === 'TP.HCM' ||
             city === 'Cần Thơ' || province === 'Cần Thơ';
    }).slice(0, 3);
    selectedBranches.push(...southBranches);
    
    const branches = selectedBranches;
    
    if (branches.length === 0) {
      console.log('\n❌ Không tìm thấy chi nhánh nào.');
      // Fallback: lấy 9 rạp đầu tiên
      const fallbackBranches = await Branch.find({ isActive: true }).select('_id name cinemaChain theaters').limit(9);
      if (fallbackBranches.length > 0) {
        console.log(`\n⚠️  Sử dụng ${fallbackBranches.length} rạp đầu tiên thay thế:`);
        fallbackBranches.forEach((b, i) => console.log(`   ${i + 1}. ${b.name}`));
        branches.push(...fallbackBranches);
      } else {
        return;
      }
    } else {
      console.log(`\n🏢 Đã chọn ${branches.length} chi nhánh đại diện (mỗi miền 2-3 rạp):`);
      branches.forEach((branch, index) => {
        const city = branch.location?.city || '';
        const province = branch.location?.province || '';
        const region = city === 'Hà Nội' || province === 'Hà Nội' || city === 'Hải Phòng' || province === 'Hải Phòng' || city === 'Hạ Long' || province === 'Quảng Ninh'
          ? 'Miền Bắc'
          : city === 'Đà Nẵng' || province === 'Đà Nẵng' || city === 'Huế' || province === 'Thừa Thiên Huế' || city === 'Nha Trang' || province === 'Khánh Hòa'
          ? 'Miền Trung'
          : 'Miền Nam';
        console.log(`   ${index + 1}. ${branch.name} (${region})`);
      });
    }

    // Lấy ngày 7 ngày sau và tạo showtime cho 5 ngày tiếp theo (tránh conflict với showtime hiện có)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 7); // Bắt đầu từ 7 ngày sau

    // Các khung giờ trong ngày (9h, 12h, 15h, 18h, 21h)
    const timeSlots = [9, 12, 15, 18, 21];
    
    let createdCount = 0;
    let skippedCount = 0;
    let totalProcessed = 0;

    // Tạo showtime cho 5 ngày bắt đầu từ ngày mai
    const daysToCreate = 5;

    console.log(`\n🎬 Bắt đầu tạo showtime cho ${daysToCreate} ngày (từ ${startDate.toLocaleDateString('vi-VN')})...\n`);

    for (const movie of movies) {
      console.log(`\n📽️  Phim: ${movie.title}`);
      
      for (let dayOffset = 0; dayOffset < daysToCreate; dayOffset++) {
        const showDate = new Date(startDate);
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

              // Đảm bảo startTime trong tương lai
              const now = new Date();
              if (startTime <= now) {
                // Nếu khung giờ đã qua, bỏ qua
                continue;
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

