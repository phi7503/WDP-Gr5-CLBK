import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";
import Movie from "../models/movieModel.js";
import Showtime from "../models/showtimeModel.js";
import Branch from "../models/branchModel.js";
import Theater from "../models/theaterModel.js";
import Combo from "../models/comboModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env từ thư mục BE
dotenv.config({ path: join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const importSampleBookings = async () => {
  try {
    console.log("🔄 Starting to import sample bookings...");

    // Lấy dữ liệu hiện có từ DB
    const users = await User.find({ role: { $in: ["customer", "guest"] } }).limit(20);
    const movies = await Movie.find({ status: "now-showing" }).limit(10);
    const branches = await Branch.find({ isActive: true }).limit(5);
    const combos = await Combo.find().limit(5);

    if (users.length === 0) {
      console.log("⚠️ No users found. Please create users first.");
      return;
    }
    if (movies.length === 0) {
      console.log("⚠️ No movies found. Please create movies first.");
      return;
    }
    if (branches.length === 0) {
      console.log("⚠️ No branches found. Please create branches first.");
      return;
    }

    console.log(`📊 Found ${users.length} users, ${movies.length} movies, ${branches.length} branches`);

    // Lấy theaters và showtimes cho mỗi branch
    const showtimes = [];
    for (const branch of branches) {
      const theaters = await Theater.find({ branch: branch._id }).limit(3);
      for (const theater of theaters) {
        const branchShowtimes = await Showtime.find({
          branch: branch._id,
          theater: theater._id,
          status: { $in: ["active", "completed"] },
          startTime: {
            $gte: new Date("2025-10-01"),
            $lte: new Date("2025-11-30"),
          },
        }).limit(10);
        showtimes.push(...branchShowtimes);
      }
    }

    if (showtimes.length === 0) {
      console.log("⚠️ No showtimes found. Please create showtimes first.");
      return;
    }

    console.log(`📊 Found ${showtimes.length} showtimes`);

    // Tạo bookings mẫu
    const bookings = [];
    const now = new Date();
    
    // Tạo bookings cho mỗi ngày từ 1/11 đến 30/11/2025
    for (let day = 1; day <= 30; day++) {
      const date = new Date(2025, 10, day); // Month 10 = November (0-indexed)
      const bookingsPerDay = Math.floor(Math.random() * 15) + 5; // 5-20 bookings mỗi ngày

      for (let i = 0; i < bookingsPerDay; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const showtime = showtimes[Math.floor(Math.random() * showtimes.length)];

        // Random hour trong ngày (từ 8h đến 23h)
        const hour = Math.floor(Math.random() * 16) + 8;
        const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
        const createdAt = new Date(date);
        createdAt.setHours(hour, minute, Math.floor(Math.random() * 60), Math.floor(Math.random() * 1000));

        // Random số ghế (1-4)
        const numSeats = Math.floor(Math.random() * 4) + 1;
        const seatRows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        const seats = [];
        
        for (let j = 0; j < numSeats; j++) {
          const row = seatRows[Math.floor(Math.random() * seatRows.length)];
          const number = Math.floor(Math.random() * 20) + 1;
          const type = ["standard", "vip", "couple"][Math.floor(Math.random() * 3)];
          const price = type === "vip" 
            ? (showtime.price?.vip || 150000) 
            : type === "couple"
            ? (showtime.price?.couple || 200000)
            : (showtime.price?.standard || 75000);
          
          seats.push({
            row,
            number,
            type,
            price,
          });
        }

        // Tính tổng tiền vé
        const ticketTotal = seats.reduce((sum, seat) => sum + seat.price, 0);

        // Random có combo không (70% có combo)
        let comboTotal = 0;
        const bookingCombos = [];
        if (Math.random() > 0.3 && combos.length > 0) {
          const numCombos = Math.floor(Math.random() * 3) + 1; // 1-3 combos
          const selectedCombos = [];
          for (let k = 0; k < numCombos; k++) {
            const combo = combos[Math.floor(Math.random() * combos.length)];
            if (!selectedCombos.find(c => c.combo.toString() === combo._id.toString())) {
              const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 items
              const comboPrice = combo.price || 80000;
              comboTotal += comboPrice * quantity;
              selectedCombos.push({
                combo: combo._id,
                quantity,
                price: comboPrice,
              });
            }
          }
          bookingCombos.push(...selectedCombos);
        }

        const totalAmount = ticketTotal + comboTotal;

        // Random payment method
        const paymentMethods = ["payos", "cash", "e_wallet", "credit_card", "bank_transfer"];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        // Random transaction ID (for completed payments)
        const transactionId = Math.floor(Math.random() * 1000000000000).toString();

        // Tạo booking với paymentStatus: "completed" và bookingStatus: "confirmed"
        const booking = {
          user: user._id,
          showtime: showtime._id,
          seats,
          totalAmount,
          combos: bookingCombos.length > 0 ? bookingCombos : undefined,
          paymentMethod,
          paymentStatus: "completed",
          bookingStatus: "confirmed",
          transactionId,
          paidAt: createdAt, // Đặt thời gian thanh toán bằng thời gian tạo
          createdAt,
          updatedAt: createdAt,
        };

        bookings.push(booking);
      }
    }

    console.log(`📝 Created ${bookings.length} sample bookings`);

    // Insert bookings vào DB (sử dụng insertMany với ordered: false để bỏ qua lỗi)
    const result = await Booking.insertMany(bookings, { ordered: false });
    console.log(`✅ Successfully imported ${result.length} bookings`);

    // Thống kê
    const stats = {
      totalBookings: result.length,
      totalRevenue: result.reduce((sum, b) => sum + b.totalAmount, 0),
      totalTickets: result.reduce((sum, b) => sum + b.seats.length, 0),
    };

    console.log("\n📊 Import Statistics:");
    console.log(`  - Total bookings: ${stats.totalBookings}`);
    console.log(`  - Total revenue: ${stats.totalRevenue.toLocaleString("vi-VN")}₫`);
    console.log(`  - Total tickets: ${stats.totalTickets}`);
    console.log(`  - Average revenue per booking: ${Math.round(stats.totalRevenue / stats.totalBookings).toLocaleString("vi-VN")}₫`);

  } catch (error) {
    console.error("❌ Error importing bookings:", error);
    if (error.writeErrors) {
      console.error(`⚠️ ${error.writeErrors.length} errors occurred during import`);
      error.writeErrors.forEach((err, index) => {
        console.error(`  Error ${index + 1}:`, err.errmsg);
      });
    }
  }
};

const main = async () => {
  await connectDB();
  await importSampleBookings();
  await mongoose.connection.close();
  console.log("✅ Database connection closed");
  process.exit(0);
};

main();

