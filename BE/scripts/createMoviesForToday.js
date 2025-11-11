/**
 * Script to create movies for today (now-showing)
 * Usage: node scripts/createMoviesForToday.js
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

// Dữ liệu phim mẫu cho ngày hôm nay
const moviesForToday = [
  {
    title: "Dưới Đáy Hồ",
    description: "Một bộ phim kinh dị tâm lý Việt Nam kể về câu chuyện của một gia đình sống bên hồ nước bí ẩn. Khi những bí mật dần được hé lộ, họ phải đối mặt với quá khứ đen tối và những thực tại không thể nào quên. Phim khám phá sâu về tâm lý con người và những điều ẩn giấu dưới bề mặt tĩnh lặng.",
    duration: 98,
    genre: ["Horror", "Thriller", "Drama"],
    releaseDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày sau
    language: "Tiếng Việt",
    director: "Đỗ Thanh Hải",
    cast: ["Ngọc Quyên", "Trần Anh Khoa", "Minh Thư", "Hoàng Yến Chibi"],
    poster: "uploads/posters/duoi-day-ho.jpg",
    backdropImage: "uploads/backdrops/duoi-day-ho-backdrop.jpg",
    trailer: "https://www.youtube.com/watch?v=example1",
    status: "now-showing",
    hotness: 95,
    rating: 8.5
  },
  {
    title: "Mai",
    description: "Mai - một người phụ nữ 35 tuổi, sống một cuộc đời giản dị với công việc massage. Cuộc sống của cô bị đảo lộn khi cô gặp một khách hàng đặc biệt và những bí mật về quá khứ dần được tiết lộ. Phim tình cảm xúc động về tình yêu, hy vọng và khả năng vươn lên của con người.",
    duration: 125,
    genre: ["Drama", "Romance"],
    releaseDate: new Date(),
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 ngày sau
    language: "Tiếng Việt",
    director: "Trần Thanh Hòa",
    cast: ["Phương Anh Đào", "Tú Vi", "Hồng Đăng", "Mạnh Cường"],
    poster: "uploads/posters/mai.jpg",
    backdropImage: "uploads/backdrops/mai-backdrop.jpg",
    trailer: "https://www.youtube.com/watch?v=example2",
    status: "now-showing",
    hotness: 98,
    rating: 9.2
  },
  {
    title: "Bão Trời",
    description: "Một bộ phim hành động gay cấn về cuộc chiến chống lại một tổ chức tội phạm nguy hiểm. Khi một cơn bão lớn đổ bộ, các nhân vật phải đối mặt với cả thiên nhiên và kẻ thù. Phim kết hợp hành động mãnh liệt với những khoảnh khắc cảm động về tình đồng đội và lòng dũng cảm.",
    duration: 110,
    genre: ["Action", "Thriller", "Adventure"],
    releaseDate: new Date(),
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 ngày sau
    language: "Tiếng Việt",
    director: "Nguyễn Đức Việt",
    cast: ["Quang Tuấn", "Huy Khánh", "Lâm Vỹ Dạ", "Công Dương"],
    poster: "uploads/posters/bao-troi.jpg",
    backdropImage: "uploads/backdrops/bao-troi-backdrop.jpg",
    trailer: "https://www.youtube.com/watch?v=example3",
    status: "now-showing",
    hotness: 88,
    rating: 7.8
  },
  {
    title: "Đôi Mắt Âm Dương",
    description: "Một bộ phim siêu nhiên huyền bí về một cô gái có khả năng nhìn thấy thế giới âm. Khi cô được gọi để giúp đỡ một gia đình giải quyết những hiện tượng lạ, cô phát hiện ra sự thật đáng sợ về quá khứ. Phim kết hợp yếu tố kinh dị với câu chuyện về gia đình và lòng trắc ẩn.",
    duration: 95,
    genre: ["Horror", "Supernatural", "Mystery"],
    releaseDate: new Date(),
    endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), // 32 ngày sau
    language: "Tiếng Việt",
    director: "Võ Thanh Hòa",
    cast: ["Nhã Phương", "Việt Anh", "Ngọc Quỳnh", "Kiều Minh Tuấn"],
    poster: "uploads/posters/doi-mat-am-duong.jpg",
    backdropImage: "uploads/backdrops/doi-mat-am-duong-backdrop.jpg",
    trailer: "https://www.youtube.com/watch?v=example4",
    status: "now-showing",
    hotness: 85,
    rating: 7.5
  },
  {
    title: "Người Tình Không Chân Dung",
    description: "Một câu chuyện tình yêu đầy bí ẩn về một họa sĩ và người mẫu của anh. Khi bức tranh anh vẽ trở nên sống động, ranh giới giữa thực tại và ảo ảnh trở nên mờ nhạt. Phim khám phá chủ đề về nghệ thuật, tình yêu và sự mất mát.",
    duration: 105,
    genre: ["Romance", "Drama", "Mystery"],
    releaseDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày sau
    language: "Tiếng Việt",
    director: "Phan Gia Nhật Linh",
    cast: ["Hoàng Yến", "Mạnh Cường", "Lã Thanh Huyền", "Anh Tú"],
    poster: "uploads/posters/nguoi-tinh-khong-chan-dung.jpg",
    backdropImage: "uploads/backdrops/nguoi-tinh-khong-chan-dung-backdrop.jpg",
    trailer: "https://www.youtube.com/watch?v=example5",
    status: "now-showing",
    hotness: 82,
    rating: 8.0
  },
  {
    title: "Lật Mặt 7: Một Điều Ước",
    description: "Phần tiếp theo của series Lật Mặt nổi tiếng. Lần này, nhóm cảnh sát đặc nhiệm phải đối mặt với một tổ chức khủng bố quốc tế với kế hoạch tấn công thủ đô. Phim hành động mãnh liệt với những pha đấu võ nghệ thuật đỉnh cao và những tình tiết cảm động.",
    duration: 115,
    genre: ["Action", "Crime", "Thriller"],
    releaseDate: new Date(),
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 ngày sau
    language: "Tiếng Việt",
    director: "Lý Hải",
    cast: ["Lý Hải", "Quang Tuấn", "Huy Khánh", "Đỗ Duy Nam"],
    poster: "uploads/posters/lat-mat-7.jpg",
    backdropImage: "uploads/backdrops/lat-mat-7-backdrop.jpg",
    trailer: "https://www.youtube.com/watch?v=example6",
    status: "now-showing",
    hotness: 92,
    rating: 8.8
  },
  {
    title: "Gia Đình Số",
    description: "Một bộ phim hài cảm động về một gia đình có ba thế hệ sống chung dưới một mái nhà. Khi người ông được chẩn đoán mắc bệnh, cả gia đình phải học cách sống chung và yêu thương nhau. Phim mang lại nhiều tiếng cười và nước mắt.",
    duration: 100,
    genre: ["Comedy", "Family", "Drama"],
    releaseDate: new Date(),
    endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000), // 33 ngày sau
    language: "Tiếng Việt",
    director: "Nguyễn Đức Việt",
    cast: ["Trấn Thành", "Ngân Chi", "Tuấn Trần", "Bảo Anh"],
    poster: "uploads/posters/gia-dinh-so.jpg",
    backdropImage: "uploads/backdrops/gia-dinh-so-backdrop.jpg",
    trailer: "https://www.youtube.com/watch?v=example7",
    status: "now-showing",
    hotness: 90,
    rating: 8.6
  },
  {
    title: "Đêm Tối Vô Tận",
    description: "Một bộ phim kinh dị tâm lý về một nhóm bạn trẻ đi cắm trại và vô tình đặt chân đến một khu rừng bị ám. Khi màn đêm buông xuống, họ nhận ra mình không còn một mình. Phim tạo không khí căng thẳng và đầy bất ngờ.",
    duration: 92,
    genre: ["Horror", "Thriller", "Suspense"],
    releaseDate: new Date(),
    endDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000), // 29 ngày sau
    language: "Tiếng Việt",
    director: "Đỗ Thanh Hải",
    cast: ["Khánh Vân", "Thanh Duy", "Hà Việt Dũng", "Phương Anh"],
    poster: "uploads/posters/dem-toi-vo-tan.jpg",
    backdropImage: "uploads/backdrops/dem-toi-vo-tan-backdrop.jpg",
    trailer: "https://www.youtube.com/watch?v=example8",
    status: "now-showing",
    hotness: 86,
    rating: 7.7
  }
];

const createMoviesForToday = async () => {
  try {
    console.log('🎬 Đang tạo phim cho ngày hôm nay...\n');

    // Kiểm tra xem có phim nào trùng tên không
    const existingTitles = await Movie.find({
      title: { $in: moviesForToday.map(m => m.title) }
    }).select('title');

    if (existingTitles.length > 0) {
      console.log('⚠️ Có một số phim đã tồn tại:');
      existingTitles.forEach(movie => {
        console.log(`   - ${movie.title}`);
      });
      console.log('\n💡 Tip: Nếu muốn tạo lại, hãy xóa các phim cũ trước hoặc đổi tên phim mới.\n');
    }

    // Tạo các phim mới (chỉ tạo những phim chưa tồn tại)
    let createdCount = 0;
    let skippedCount = 0;

    for (const movieData of moviesForToday) {
      // Kiểm tra xem phim đã tồn tại chưa
      const existing = await Movie.findOne({ title: movieData.title });
      
      if (existing) {
        console.log(`⏭️  Đã bỏ qua: "${movieData.title}" (đã tồn tại)`);
        skippedCount++;
        continue;
      }

      // Tạo phim mới
      try {
        const newMovie = new Movie(movieData);
        await newMovie.save();
        console.log(`✅ Đã tạo: "${movieData.title}"`);
        console.log(`   - Thể loại: ${movieData.genre.join(', ')}`);
        console.log(`   - Thời lượng: ${movieData.duration} phút`);
        console.log(`   - Hotness: ${movieData.hotness}`);
        console.log(`   - Rating: ${movieData.rating}/10`);
        console.log(`   - Ngày khởi chiếu: ${movieData.releaseDate.toLocaleDateString('vi-VN')}`);
        console.log(`   - Ngày kết thúc: ${movieData.endDate.toLocaleDateString('vi-VN')}\n`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Lỗi khi tạo "${movieData.title}":`, error.message);
        skippedCount++;
      }
    }

    // Tổng kết
    console.log('\n📊 TỔNG KẾT:');
    console.log(`   ✅ Đã tạo: ${createdCount} phim`);
    console.log(`   ⏭️  Đã bỏ qua: ${skippedCount} phim`);
    console.log(`   📽️  Tổng cộng: ${moviesForToday.length} phim\n`);

    // Hiển thị danh sách tất cả phim đang chiếu
    const allNowShowing = await Movie.find({ status: 'now-showing' })
      .select('title duration genre hotness rating')
      .sort({ hotness: -1 });

    if (allNowShowing.length > 0) {
      console.log('🎭 DANH SÁCH PHIM ĐANG CHIẾU:');
      allNowShowing.forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title}`);
        console.log(`      - Thời lượng: ${movie.duration} phút`);
        console.log(`      - Thể loại: ${movie.genre.join(', ')}`);
        console.log(`      - Hotness: ${movie.hotness} | Rating: ${movie.rating}/10\n`);
      });
    }

    console.log('🎉 Hoàn thành!');
  } catch (error) {
    console.error('❌ Lỗi khi tạo phim:', error);
  }
};

// Main execution
(async () => {
  await connectDB();
  await createMoviesForToday();
  await mongoose.connection.close();
  process.exit(0);
})();

