/**
 * Script to restore movies from seedMovies.js data
 * This will recreate movies that might have been deleted
 * Usage: node scripts/restoreMoviesFromSeed.js
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

// Import data from seedMovies (we'll read the file and extract movies)
const restoreMovies = async () => {
  try {
    console.log('🔄 Đang khôi phục phim từ seed data...\n');

    // Import seed data
    const { default: seedData } = await import('../scripts/seedMovies.js');
    
    // Since seedMovies.js exports a function, we need to get the data differently
    // Let's read the file directly or use a simpler approach
    console.log('⚠️  Script này cần được cập nhật với dữ liệu phim cụ thể.');
    console.log('💡 Bạn có thể:');
    console.log('   1. Chạy script seedMovies.js để tạo lại phim');
    console.log('   2. Hoặc cung cấp danh sách phim cũ để tôi tạo script khôi phục cụ thể\n');

    // Kiểm tra xem có phim nào trong database không
    const existingMovies = await Movie.find({});
    console.log(`📊 Hiện tại có ${existingMovies.length} phim trong database.\n`);

    if (existingMovies.length === 0) {
      console.log('💡 Gợi ý: Chạy script seedMovies.js để tạo lại phim mẫu:');
      console.log('   node scripts/seedMovies.js\n');
    }

  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
};

// Main execution
(async () => {
  await connectDB();
  await restoreMovies();
  await mongoose.connection.close();
  process.exit(0);
})();

