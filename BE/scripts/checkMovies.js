/**
 * Script to check all movies in database
 * Usage: node scripts/checkMovies.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';

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

const checkMovies = async () => {
  try {
    console.log('🔍 Đang kiểm tra phim trong database...\n');

    // Lấy tất cả phim
    const allMovies = await Movie.find({}).sort({ createdAt: -1 });

    if (allMovies.length === 0) {
      console.log('❌ KHÔNG TÌM THẤY PHIM NÀO TRONG DATABASE!');
      console.log('⚠️  Có vẻ như tất cả phim đã bị xóa.');
      return;
    }

    console.log(`📽️ Tìm thấy ${allMovies.length} phim trong database:\n`);

    // Phân loại theo status
    const nowShowing = allMovies.filter(m => m.status === 'now-showing');
    const comingSoon = allMovies.filter(m => m.status === 'coming-soon');
    const ended = allMovies.filter(m => m.status === 'ended');

    console.log('📊 PHÂN LOẠI:');
    console.log(`   🎬 Đang chiếu (now-showing): ${nowShowing.length}`);
    console.log(`   📅 Sắp chiếu (coming-soon): ${comingSoon.length}`);
    console.log(`   ❌ Đã kết thúc (ended): ${ended.length}\n`);

    console.log('📋 DANH SÁCH TẤT CẢ PHIM:\n');
    allMovies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title}`);
      console.log(`   - ID: ${movie._id}`);
      console.log(`   - Status: ${movie.status}`);
      console.log(`   - Thời lượng: ${movie.duration} phút`);
      console.log(`   - Thể loại: ${movie.genre.join(', ')}`);
      console.log(`   - Ngày khởi chiếu: ${movie.releaseDate.toLocaleDateString('vi-VN')}`);
      console.log(`   - Ngày kết thúc: ${movie.endDate.toLocaleDateString('vi-VN')}`);
      console.log(`   - Hotness: ${movie.hotness || 0}`);
      console.log(`   - Rating: ${movie.rating || 0}/10`);
      console.log(`   - Ngày tạo: ${movie.createdAt.toLocaleString('vi-VN')}`);
      console.log('');
    });

    // Thống kê theo thể loại
    const genres = {};
    allMovies.forEach(movie => {
      movie.genre.forEach(genre => {
        genres[genre] = (genres[genre] || 0) + 1;
      });
    });

    console.log('🎨 THỐNG KÊ THEO THỂ LOẠI:');
    Object.entries(genres).sort((a, b) => b[1] - a[1]).forEach(([genre, count]) => {
      console.log(`   ${genre}: ${count} phim`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra phim:', error);
  }
};

// Main execution
(async () => {
  await connectDB();
  await checkMovies();
  await mongoose.connection.close();
  process.exit(0);
})();

