import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample movies data
const moviesData = [
  // PHIM VIỆT NAM
  {
    title: "Nàng Bạch Tuyết",
    description: "Phiên bản live-action của Disney, kể lại câu chuyện cổ tích với nhiều tình tiết sáng tạo và hiện đại hơn. Bạch Tuyết đối đầu với Hoàng hậu độc ác, khám phá sức mạnh tiềm ẩn và tìm ra con đường riêng trong thế giới cổ tích.",
    duration: 125,
    genre: ["Fantasy", "Adventure", "Family"],
    releaseDate: new Date("2025-03-21"),
    endDate: new Date("2025-05-21"),
    language: "English",
    director: "Marc Webb",
    cast: ["Rachel Zegler", "Gal Gadot", "Andrew Burnap"],
    poster: "uploads/posters/snow-white-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Nhà Ga Ma Chó",
    description: "Bộ phim kinh dị bí ẩn lấy bối cảnh tại ga tàu Rocafort u ám ở Barcelona, nơi gắn liền với hàng loạt cái chết kỳ bí. Laura – nhân viên mới – nhận ra những điều bất thường và quyết tâm tìm hiểu sự thật.",
    duration: 110,
    genre: ["Horror", "Mystery", "Thriller"],
    releaseDate: new Date("2025-03-21"),
    endDate: new Date("2025-05-21"),
    language: "Spanish",
    director: "Jaume Balagueró",
    cast: ["Marta Nieto", "Álex Monner", "Pep Tosar"],
    poster: "uploads/posters/station-ghost-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Âm Dương Lộ",
    description: "Lấy cảm hứng từ những truyền thuyết đô thị rùng rợn, phim kể về một con đường ma quái gắn liền với nhiều vụ mất tích bí ẩn. Nhóm phóng viên quyết định điều tra và phát hiện sự thật rùng mình liên quan đến thế giới tâm linh.",
    duration: 95,
    genre: ["Horror", "Mystery", "Supernatural"],
    releaseDate: new Date("2025-03-28"),
    endDate: new Date("2025-05-28"),
    language: "Vietnamese",
    director: "Nguyễn Quang Dũng",
    cast: ["Trấn Thành", "Hari Won", "Ngô Kiến Huy"],
    poster: "uploads/posters/yin-yang-road-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Na Tra 2: Ma Đồng Náo Hải",
    description: "Phần tiếp theo của siêu phẩm hoạt hình Trung Quốc, tiếp tục cuộc chiến chống lại định mệnh, lần này là mối đe dọa từ một thế lực bóng tối cổ xưa. Với đồ họa mãn nhãn và kịch bản gay cấn.",
    duration: 120,
    genre: ["Animation", "Action", "Adventure"],
    releaseDate: new Date("2025-03-28"),
    endDate: new Date("2025-05-28"),
    language: "Chinese",
    director: "Yang Yu",
    cast: ["Lü Yan", "Han Mo", "Chen Hao"],
    poster: "uploads/posters/nezha-2-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },

  // PHIM HOLLYWOOD
  {
    title: "Ván Cờ Vây – The Match",
    description: "Phim hành động, tội phạm lấy bối cảnh thập niên 1980–1990, xoay quanh kỳ thủ cờ vây huyền thoại Cho Hun Hyeon và học trò Lee Chang Ho. Mối quan hệ thầy – trò dần rạn nứt khi Chang Ho khẳng định bản thân.",
    duration: 130,
    genre: ["Action", "Crime", "Drama"],
    releaseDate: new Date("2025-02-14"),
    endDate: new Date("2025-04-14"),
    language: "Korean",
    director: "Kim Hyung-joo",
    cast: ["Lee Byung-hun", "Yoo Ah-in", "Park Jung-min"],
    poster: "uploads/posters/the-match-2025.jpg",
    trailer: "",
    status: "now-showing",
    hotness: 0,
    rating: 0
  },
  {
    title: "Rhino King",
    description: "Phim hài, lãng mạn Mỹ kể về James, người chồng nội trợ ngoài 30 tuổi, vật lộn với cuộc hôn nhân rạn nứt và cảm giác tội lỗi vì thất nghiệp. Được bạn thân khuyến khích, James thử sức với nghề vũ công thoát y nam.",
    duration: 105,
    genre: ["Comedy", "Romance", "Drama"],
    releaseDate: new Date("2025-02-21"),
    endDate: new Date("2025-04-21"),
    language: "English",
    director: "Brandon Dunlap",
    cast: ["Brandon Dunlap", "Sarah Jessica Parker", "Matthew Broderick"],
    poster: "uploads/posters/rhino-king-2025.jpg",
    trailer: "",
    status: "now-showing",
    hotness: 0,
    rating: 0
  },
  {
    title: "The Bad Guys 2",
    description: "Phần tiếp theo của phim hoạt hình The Bad Guys (2022), kể về nhóm bất hảo hóa thiện lành gồm Sói, Rắn, Cá Mập, Cá Hổ và Nhện. Cuộc sống của họ bị đảo lộn khi xuất hiện nhóm tội phạm toàn nữ.",
    duration: 100,
    genre: ["Animation", "Comedy", "Adventure"],
    releaseDate: new Date("2025-03-07"),
    endDate: new Date("2025-05-07"),
    language: "English",
    director: "Pierre Perifel",
    cast: ["Sam Rockwell", "Marc Maron", "Awkwafina"],
    poster: "uploads/posters/bad-guys-2-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Freakier Friday",
    description: "22 năm sau bộ phim hài Freaky Friday, Jamie Lee Curtis và Lindsay Lohan trở lại vai cặp mẹ con Tess và Anna, đối diện với những tình huống hài hước khi hoán đổi cơ thể. Phim khai thác các tình tiết xuyên suốt 3 thế hệ phụ nữ.",
    duration: 115,
    genre: ["Comedy", "Fantasy", "Family"],
    releaseDate: new Date("2025-03-14"),
    endDate: new Date("2025-05-14"),
    language: "English",
    director: "Nisha Ganatra",
    cast: ["Jamie Lee Curtis", "Lindsay Lohan", "Chad Michael Murray"],
    poster: "uploads/posters/freakier-friday-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Wicked: For Good",
    description: "Phần tiếp theo của Wicked, tiếp nối mối quan hệ giữa Elphaba và Galinda trong những nhân dạng mới. Phim đánh dấu sự chuyển dịch hoàn toàn của Elphaba thành Phù Thủy Xấu Xa Miền Tây và Galinda thành Glinda Thiện Lành.",
    duration: 140,
    genre: ["Musical", "Fantasy", "Drama"],
    releaseDate: new Date("2025-03-21"),
    endDate: new Date("2025-05-21"),
    language: "English",
    director: "Jon M. Chu",
    cast: ["Cynthia Erivo", "Ariana Grande", "Jeff Goldblum"],
    poster: "uploads/posters/wicked-for-good-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },

  // PHIM KINH DỊ & HÀNH ĐỘNG
  {
    title: "Mật Danh: Kế Toán 2",
    description: "Khi một người quen cũ bị sát hại, Wolff buộc phải giải quyết vụ án. Nhận ra các biện pháp cực đoan hơn là cần thiết, Wolff tuyển dụng người anh trai ghẻ lạnh và rất nguy hiểm của mình, Brax, để cùng điều tra.",
    duration: 125,
    genre: ["Action", "Crime", "Thriller"],
    releaseDate: new Date("2025-02-28"),
    endDate: new Date("2025-04-28"),
    language: "English",
    director: "Gavin O'Connor",
    cast: ["Ben Affleck", "Jon Bernthal", "J.K. Simmons"],
    poster: "uploads/posters/accountant-2-2025.jpg",
    trailer: "",
    status: "now-showing",
    hotness: 0,
    rating: 0
  },
  {
    title: "Lưỡi Hái Tử Thần: Huyết Thống",
    description: "Bị ám ảnh bởi cơn ác mộng dữ dội liên tục, nữ sinh viên Stefanie trở về nhà để tìm kiếm người có thể phá vỡ vòng luẩn quẩn này và cứu gia đình cô khỏi cái chết đang rình rập.",
    duration: 95,
    genre: ["Horror", "Thriller", "Mystery"],
    releaseDate: new Date("2025-03-07"),
    endDate: new Date("2025-05-07"),
    language: "English",
    director: "David Bruckner",
    cast: ["Isabela Merced", "Jacob Batalon", "Kate Siegel"],
    poster: "uploads/posters/scythe-bloodline-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Quái Vật Đầm Lầy",
    description: "Kyle, một sinh viên sinh học vừa tốt nghiệp, cùng nhóm bạn thực hiện chuyến đi đến Florida để rải tro cốt của người anh trai quá cố. Tuy nhiên, chuyến đi trở thành thảm họa khi chiếc máy bay của họ rơi xuống một đầm lầy bí ẩn.",
    duration: 110,
    genre: ["Horror", "Thriller", "Adventure"],
    releaseDate: new Date("2025-03-14"),
    endDate: new Date("2025-05-14"),
    language: "English",
    director: "Jordan Peele",
    cast: ["Daniel Kaluuya", "Keke Palmer", "Brandon Perea"],
    poster: "uploads/posters/swamp-monster-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Biệt Đội Sấm Sét",
    description: "Sau khi thấy mình bị mắc kẹt trong một cái bẫy chết người, bảy người bị bỏ rơi vỡ mộng phải bắt tay vào một nhiệm vụ nguy hiểm sẽ buộc họ phải đối mặt với những góc đen tối nhất trong quá khứ của mình.",
    duration: 135,
    genre: ["Action", "Thriller", "Crime"],
    releaseDate: new Date("2025-03-21"),
    endDate: new Date("2025-05-21"),
    language: "English",
    director: "David Ayer",
    cast: ["Will Smith", "Margot Robbie", "Jared Leto"],
    poster: "uploads/posters/thunder-squad-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },

  // PHIM HÀN QUỐC
  {
    title: "Trượt Dốc",
    description: "Ok Ja và con trai Do Hyun giả đăng ký hộ khẩu tại phường Daechi (Seoul) để mong con được học trường tốt, dù hoàn cảnh tài chính eo hẹp. Tại trường, Do Hyun ghen tị với bạn học Sang Su – người được gia đình giàu có hỗ trợ.",
    duration: 120,
    genre: ["Drama", "Comedy", "Family"],
    releaseDate: new Date("2025-02-21"),
    endDate: new Date("2025-04-21"),
    language: "Korean",
    director: "Kim Yong-hwa",
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Choi Woo-shik"],
    poster: "uploads/posters/sliding-down-2025.jpg",
    trailer: "",
    status: "now-showing",
    hotness: 0,
    rating: 0
  },
  {
    title: "Melo Movie - Tình Yêu Của Mu Bi",
    description: "Bộ phim tình cảm lãng mạn kể về câu chuyện tình yêu đầy day dứt giữa Ko Gyeom và Kim Mu Bee. Một câu chuyện tình yêu đầy cảm động và lãng mạn.",
    duration: 110,
    genre: ["Romance", "Drama", "Comedy"],
    releaseDate: new Date("2025-02-14"),
    endDate: new Date("2025-04-14"),
    language: "Korean",
    director: "Park Chan-wook",
    cast: ["Park Bo-gum", "Kim Tae-ri", "Yoo Ah-in"],
    poster: "uploads/posters/melo-movie-2025.jpg",
    trailer: "",
    status: "now-showing",
    hotness: 0,
    rating: 0
  },

  // THÊM MỘT SỐ PHIM VIỆT NAM KHÁC
  {
    title: "Bố Già 3",
    description: "Phần tiếp theo của series phim hài nổi tiếng Bố Già, tiếp tục những câu chuyện hài hước và cảm động về gia đình với sự tham gia của dàn diễn viên quen thuộc.",
    duration: 120,
    genre: ["Comedy", "Family", "Drama"],
    releaseDate: new Date("2025-04-15"),
    endDate: new Date("2025-06-15"),
    language: "Vietnamese",
    director: "Trấn Thành",
    cast: ["Trấn Thành", "Ngô Kiến Huy", "Hari Won"],
    poster: "uploads/posters/bo-gia-3-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Cô Gái Đến Từ Hôm Qua",
    description: "Phim tình cảm lãng mạn dựa trên tiểu thuyết nổi tiếng của Nguyễn Nhật Ánh, kể về mối tình đầu trong sáng và ngây thơ của tuổi học trò.",
    duration: 105,
    genre: ["Romance", "Drama", "Coming-of-age"],
    releaseDate: new Date("2025-05-20"),
    endDate: new Date("2025-07-20"),
    language: "Vietnamese",
    director: "Phan Gia Nhật Linh",
    cast: ["Ngô Kiến Huy", "Hari Won", "Trấn Thành"],
    poster: "uploads/posters/co-gai-den-tu-hom-qua-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Siêu Sao Siêu Ngốc",
    description: "Phim hài về cuộc sống của một ngôi sao giải trí và những tình huống dở khóc dở cười trong nghề nghiệp của anh ta.",
    duration: 95,
    genre: ["Comedy", "Drama"],
    releaseDate: new Date("2025-03-10"),
    endDate: new Date("2025-05-10"),
    language: "Vietnamese",
    director: "Nguyễn Quang Dũng",
    cast: ["Trấn Thành", "Ngô Kiến Huy", "Hari Won"],
    poster: "uploads/posters/sieu-sao-sieu-ngoc-2025.jpg",
    trailer: "",
    status: "now-showing",
    hotness: 0,
    rating: 0
  },

  // THÊM MỘT SỐ PHIM HOLLYWOOD KHÁC
  {
    title: "Fast & Furious 11",
    description: "Phần tiếp theo của series phim hành động nổi tiếng Fast & Furious, với những pha hành động mãn nhãn và những chiếc xe siêu tốc.",
    duration: 140,
    genre: ["Action", "Crime", "Thriller"],
    releaseDate: new Date("2025-04-04"),
    endDate: new Date("2025-06-04"),
    language: "English",
    director: "Louis Leterrier",
    cast: ["Vin Diesel", "Jason Momoa", "Michelle Rodriguez"],
    poster: "uploads/posters/fast-furious-11-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Spider-Man: Beyond the Spider-Verse",
    description: "Phần tiếp theo của Spider-Man: Across the Spider-Verse, tiếp tục cuộc phiêu lưu của Miles Morales trong đa vũ trụ.",
    duration: 120,
    genre: ["Animation", "Action", "Adventure"],
    releaseDate: new Date("2025-06-06"),
    endDate: new Date("2025-08-06"),
    language: "English",
    director: "Joaquim Dos Santos",
    cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac"],
    poster: "uploads/posters/spiderman-beyond-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  },
  {
    title: "Mission: Impossible 8",
    description: "Phần tiếp theo của series Mission: Impossible, với Tom Cruise trở lại vai Ethan Hunt trong một nhiệm vụ mới đầy nguy hiểm.",
    duration: 150,
    genre: ["Action", "Adventure", "Thriller"],
    releaseDate: new Date("2025-05-23"),
    endDate: new Date("2025-07-23"),
    language: "English",
    director: "Christopher McQuarrie",
    cast: ["Tom Cruise", "Hayley Atwell", "Simon Pegg"],
    poster: "uploads/posters/mission-impossible-8-2025.jpg",
    trailer: "",
    status: "coming-soon",
    hotness: 0,
    rating: 0
  }
];

// Function to seed movies
const seedMovies = async () => {
  try {
    console.log('🌱 Starting to seed movies...');
    
    // Clear existing movies (optional - comment out if you want to keep existing movies)
    // await Movie.deleteMany({});
    // console.log('🗑️ Cleared existing movies');
    
    // Insert new movies
    const insertedMovies = await Movie.insertMany(moviesData);
    console.log(`✅ Successfully inserted ${insertedMovies.length} movies`);
    
    // Display summary
    const nowShowing = insertedMovies.filter(movie => movie.status === 'now-showing').length;
    const comingSoon = insertedMovies.filter(movie => movie.status === 'coming-soon').length;
    
    console.log('\n📊 Summary:');
    console.log(`🎬 Total movies: ${insertedMovies.length}`);
    console.log(`🎭 Now showing: ${nowShowing}`);
    console.log(`📅 Coming soon: ${comingSoon}`);
    
    // Display genres summary
    const allGenres = [...new Set(insertedMovies.flatMap(movie => movie.genre))];
    console.log(`🎨 Genres: ${allGenres.join(', ')}`);
    
    console.log('\n🎉 Movie seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding movies:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await seedMovies();
};

// Run the script
main().catch(console.error);
