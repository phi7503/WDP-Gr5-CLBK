/**
 * Script to create showtimes for all movies on day 15 and 16 of next month
 * Mỗi phim 1 suất chiếu vào ngày 15 và 16 sắp tới
 * Usage: node scripts/createShowtimesForDay15And16.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';
import Branch from '../models/branchModel.js';
import Theater from '../models/theaterModel.js';
import Showtime from '../models/showtimeModel.js';
import Seat from '../models/seatModel.js';
import SeatStatus from '../models/seatStatusModel.js';
import connectDB from '../config/db.js';

dotenv.config();

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
      status: { $ne: 'cancelled' }, // Bỏ qua các showtime đã hủy
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (conflictingShowtime) {
      // Log chi tiết conflict để debug
      console.log(`   ⚠️  Conflict: Theater ${theater} đã có showtime từ ${new Date(conflictingShowtime.startTime).toLocaleString('vi-VN')} đến ${new Date(conflictingShowtime.endTime).toLocaleString('vi-VN')}`);
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

const createShowtimesForDay15And16 = async () => {
  try {
    await connectDB();

    // Lấy tất cả phim đang chiếu hoặc sắp chiếu
    const movies = await Movie.find({ 
      status: { $in: ['now-showing', 'coming-soon'] }
    }).select('_id title duration endDate');
    
    if (movies.length === 0) {
      console.log('❌ Không tìm thấy phim nào trong database.');
      return;
    }

    console.log(`\n📽️ Tìm thấy ${movies.length} phim trong database:`);
    movies.forEach((movie, index) => {
      console.log(`   ${index + 1}. ${movie.title} (${movie.duration} phút)`);
    });

    // Lấy tất cả branches active
    const branches = await Branch.find({ isActive: true }).select('_id name cinemaChain theaters location');
    
    if (branches.length === 0) {
      console.log('\n❌ Không tìm thấy chi nhánh nào.');
      return;
    }

    console.log(`\n🏢 Tìm thấy ${branches.length} chi nhánh:`);
    branches.forEach((branch, index) => {
      const city = branch.location?.city || branch.location?.province || 'N/A';
      console.log(`   ${index + 1}. ${branch.name} (${city})`);
    });

    // Tính ngày 15 và 16 sắp tới
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Ngày 15 của tháng hiện tại hoặc tháng sau
    let day15 = new Date(currentYear, currentMonth, 15);
    if (day15 < today) {
      // Nếu ngày 15 đã qua, lấy ngày 15 tháng sau
      day15 = new Date(currentYear, currentMonth + 1, 15);
    }
    
    // Ngày 16 của tháng hiện tại hoặc tháng sau
    let day16 = new Date(currentYear, currentMonth, 16);
    if (day16 < today) {
      // Nếu ngày 16 đã qua, lấy ngày 16 tháng sau
      day16 = new Date(currentYear, currentMonth + 1, 16);
    }

    // Đảm bảo day16 sau day15
    if (day16 <= day15) {
      day16 = new Date(day15);
      day16.setDate(day16.getDate() + 1);
    }

    console.log(`\n📅 Tạo showtimes cho:`);
    console.log(`   - Ngày 15: ${day15.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log(`   - Ngày 16: ${day16.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);

    // Khung giờ chiếu - thử nhiều khung giờ khác nhau để tránh conflict
    const timeSlots = [
      { hour: 14, minute: 0 },  // 2:00 PM
      { hour: 16, minute: 30 }, // 4:30 PM
      { hour: 19, minute: 0 },  // 7:00 PM
      { hour: 21, minute: 30 }, // 9:30 PM
    ];

    let createdCount = 0;
    let skippedCount = 0;
    let totalProcessed = 0;

    console.log(`\n🎬 Bắt đầu tạo showtime...\n`);

    // Tạo showtime cho mỗi phim, mỗi phim 1 suất chiếu vào ngày 15 và 16
    for (const movie of movies) {
      console.log(`\n📽️  Phim: ${movie.title}`);
      
      // Tạo showtime cho ngày 15 và 16 với nhiều khung giờ khác nhau
      let showtimeCreated15 = false;
      let showtimeCreated16 = false;

      // Thử tạo showtime cho mỗi phim, tìm theater và khung giờ không bị conflict
      // Thử tất cả branches và theaters để tìm slot trống
      for (const branch of branches) {
        if (showtimeCreated15 && showtimeCreated16) break; // Đã tạo đủ cả 2
        
        // Lấy các theater của branch này
        let theaters = [];
        
        if (branch.theaters && branch.theaters.length > 0) {
          theaters = await Theater.find({ 
            _id: { $in: branch.theaters },
            branch: branch._id 
          }).select('_id name');
        } else {
          theaters = await Theater.find({ branch: branch._id }).select('_id name');
        }
        
        if (theaters.length === 0) {
          continue;
        }

        // Thử từng theater
        for (const theater of theaters) {
          if (showtimeCreated15 && showtimeCreated16) break; // Đã tạo đủ cả 2
          
          // Kiểm tra theater có ghế không
          const seatCount = await Seat.countDocuments({
            theater: theater._id,
            branch: branch._id,
            isActive: true,
          });

          if (seatCount === 0) {
            continue; // Bỏ qua nếu không có ghế
          }

          // Giá vé mặc định
          const prices = {
            standard: 50000,
            vip: 75000,
            couple: 100000,
          };

          // Tạo showtime cho ngày 15 (nếu chưa tạo) - thử nhiều khung giờ
          if (!showtimeCreated15) {
            // Reset timeSlotIndex khi chuyển theater mới
            let localTimeSlotIndex15 = 0;
            while (localTimeSlotIndex15 < timeSlots.length) {
              const timeSlot = timeSlots[localTimeSlotIndex15];
              const showDate15 = new Date(day15);
              showDate15.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
              
              console.log(`   📅 Ngày 15 (${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}): ${showDate15.toLocaleString('vi-VN')} - ${branch.name} - ${theater.name}`);
              totalProcessed++;
              
              const showtime15 = await createShowtime(
                movie._id,
                branch._id,
                theater._id,
                showDate15,
                prices
              );

              if (showtime15) {
                createdCount++;
                showtimeCreated15 = true;
                console.log(`   ✅ Đã tạo showtime cho ngày 15 lúc ${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}`);
                break; // Thành công, không cần thử khung giờ khác
              } else {
                skippedCount++;
                localTimeSlotIndex15++; // Thử khung giờ tiếp theo
              }
            }
          }

          // Tạo showtime cho ngày 16 (nếu chưa tạo) - thử nhiều khung giờ
          if (!showtimeCreated16) {
            // Reset timeSlotIndex khi chuyển theater mới
            let localTimeSlotIndex16 = 0;
            while (localTimeSlotIndex16 < timeSlots.length) {
              const timeSlot = timeSlots[localTimeSlotIndex16];
              const showDate16 = new Date(day16);
              showDate16.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
              
              console.log(`   📅 Ngày 16 (${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}): ${showDate16.toLocaleString('vi-VN')} - ${branch.name} - ${theater.name}`);
              totalProcessed++;
              
              const showtime16 = await createShowtime(
                movie._id,
                branch._id,
                theater._id,
                showDate16,
                prices
              );

              if (showtime16) {
                createdCount++;
                showtimeCreated16 = true;
                console.log(`   ✅ Đã tạo showtime cho ngày 16 lúc ${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}`);
                break; // Thành công, không cần thử khung giờ khác
              } else {
                skippedCount++;
                localTimeSlotIndex16++; // Thử khung giờ tiếp theo
              }
            }
          }
        }
      }
      
      if (!showtimeCreated15 && !showtimeCreated16) {
        console.log(`   ⚠️  Không thể tạo showtime cho phim này (tất cả đều conflict)`);
      } else if (!showtimeCreated15) {
        console.log(`   ⚠️  Chỉ tạo được showtime cho ngày 16`);
      } else if (!showtimeCreated16) {
        console.log(`   ⚠️  Chỉ tạo được showtime cho ngày 15`);
      }
    }

    console.log(`\n\n🎉 Hoàn thành!`);
    console.log(`\n📊 TỔNG KẾT:`);
    console.log(`   ✅ Đã tạo: ${createdCount} showtime`);
    console.log(`   ⚠️  Đã bỏ qua (conflict): ${skippedCount} showtime`);
    console.log(`   📋 Tổng số đã xử lý: ${totalProcessed}`);
    console.log(`   📽️  Số phim: ${movies.length}`);
    console.log(`   🏢 Số chi nhánh: ${branches.length}`);
    console.log(`   📅 Ngày tạo: ${day15.toLocaleDateString('vi-VN')} và ${day16.toLocaleDateString('vi-VN')}`);
    console.log(`   🕐 Khung giờ: ${timeSlots.map(ts => `${ts.hour}:${ts.minute.toString().padStart(2, '0')}`).join(', ')}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Main execution
(async () => {
  try {
    await createShowtimesForDay15And16();
    await mongoose.connection.close();
    console.log('✅ Đã đóng kết nối database');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
})();

