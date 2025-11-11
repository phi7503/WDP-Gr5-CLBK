/**
 * Script to delete specific movies by title
 * Usage: node scripts/deleteSpecificMovies.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';
import Showtime from '../models/showtimeModel.js';
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

const deleteSpecificMovies = async () => {
  try {
    // Danh sách phim cần xóa
    const moviesToDelete = [
      "Dưới Đáy Hồ",
      "Mai",
      "Bão Trời",
      "Đôi Mắt Âm Dương",
      "Người Tình Không Chân Dung",
      "Lật Mặt 7: Một Điều Ước",
      "Gia Đình Số",
      "Đêm Tối Vô Tận"
    ];

    console.log('⚠️  CẢNH BÁO: Script này sẽ xóa các phim sau:\n');
    moviesToDelete.forEach((title, index) => {
      console.log(`   ${index + 1}. ${title}`);
    });

    // Kiểm tra xem có phim nào tồn tại không
    const existingMovies = await Movie.find({
      title: { $in: moviesToDelete }
    }).select('title');

    if (existingMovies.length === 0) {
      console.log('\n✅ Không tìm thấy phim nào trong danh sách để xóa.');
      console.log('💡 Các phim này có thể không tồn tại trong database.\n');
      return;
    }

    console.log(`\n📋 Tìm thấy ${existingMovies.length} phim sẽ bị xóa:`);
    existingMovies.forEach(movie => {
      console.log(`   - ${movie.title}`);
    });

    console.log('\n🗑️  Đang xóa các phim...\n');

    let deletedCount = 0;
    let notFoundCount = 0;

    for (const movieTitle of moviesToDelete) {
      const movie = await Movie.findOne({ title: movieTitle });
      
      if (!movie) {
        console.log(`⏭️  Không tìm thấy: "${movieTitle}"`);
        notFoundCount++;
        continue;
      }

      console.log(`📽️  Đang xóa: "${movieTitle}"`);
      
      // Lấy tất cả showtime của phim này
      const showtimes = await Showtime.find({ movie: movie._id }).select('_id');
      const showtimeIds = showtimes.map(s => s._id);

      // Xóa SeatStatus liên quan trước
      if (showtimeIds.length > 0) {
        const seatStatusResult = await SeatStatus.deleteMany({
          showtime: { $in: showtimeIds }
        });
        console.log(`   ✅ Đã xóa ${seatStatusResult.deletedCount} seat status`);
      }

      // Xóa Showtime liên quan
      if (showtimeIds.length > 0) {
        const showtimeResult = await Showtime.deleteMany({
          movie: movie._id
        });
        console.log(`   ✅ Đã xóa ${showtimeResult.deletedCount} showtime`);
      }

      // Xóa phim
      await Movie.findByIdAndDelete(movie._id);
      console.log(`   ✅ Đã xóa phim: "${movieTitle}"\n`);
      deletedCount++;
    }

    console.log('\n📊 TỔNG KẾT:');
    console.log(`   ✅ Đã xóa: ${deletedCount} phim`);
    console.log(`   ⏭️  Không tìm thấy: ${notFoundCount} phim`);
    console.log(`   📋 Tổng số: ${moviesToDelete.length} phim\n`);

    console.log('🎉 Hoàn thành!');
  } catch (error) {
    console.error('❌ Lỗi khi xóa phim:', error);
  }
};

// Main execution
(async () => {
  await connectDB();
  await deleteSpecificMovies();
  await mongoose.connection.close();
  process.exit(0);
})();

