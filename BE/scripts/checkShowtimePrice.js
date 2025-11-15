import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Showtime from "../models/showtimeModel.js";

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

const checkShowtimePrice = async () => {
  try {
    console.log("🔍 Checking for showtimes with price 50k (50000)...\n");

    // Tìm tất cả showtime có giá standard = 50000
    const showtimes50k = await Showtime.find({
      "price.standard": 50000
    })
      .populate("movie", "title")
      .populate("branch", "name")
      .populate("theater", "name")
      .limit(20)
      .lean();

    console.log(`📊 Found ${showtimes50k.length} showtimes with standard price = 50,000₫\n`);

    if (showtimes50k.length > 0) {
      console.log("✅ Showtimes with price 50k:");
      showtimes50k.forEach((st, index) => {
        console.log(`\n${index + 1}. Showtime ID: ${st._id}`);
        console.log(`   Movie: ${st.movie?.title || "N/A"}`);
        console.log(`   Branch: ${st.branch?.name || "N/A"}`);
        console.log(`   Theater: ${st.theater?.name || "N/A"}`);
        console.log(`   Start Time: ${new Date(st.startTime).toLocaleString("vi-VN")}`);
        console.log(`   Price:`);
        console.log(`     - Standard: ${st.price?.standard?.toLocaleString("vi-VN") || "N/A"}₫`);
        console.log(`     - VIP: ${st.price?.vip?.toLocaleString("vi-VN") || "N/A"}₫`);
        console.log(`     - Couple: ${st.price?.couple?.toLocaleString("vi-VN") || "N/A"}₫`);
        console.log(`   Status: ${st.status}`);
      });
    } else {
      console.log("❌ No showtimes found with standard price = 50,000₫");
    }

    // Tìm showtimes có giá trong khoảng 45k-55k
    console.log("\n\n🔍 Checking for showtimes with price between 45k-55k...\n");

    const showtimesNear50k = await Showtime.find({
      "price.standard": { $gte: 45000, $lte: 55000 }
    })
      .populate("movie", "title")
      .populate("branch", "name")
      .limit(10)
      .lean();

    console.log(`📊 Found ${showtimesNear50k.length} showtimes with standard price between 45k-55k\n`);

    if (showtimesNear50k.length > 0) {
      console.log("📋 Sample showtimes with price near 50k:");
      showtimesNear50k.slice(0, 5).forEach((st, index) => {
        console.log(`\n${index + 1}. Movie: ${st.movie?.title || "N/A"}`);
        console.log(`   Standard Price: ${st.price?.standard?.toLocaleString("vi-VN")}₫`);
        console.log(`   Start Time: ${new Date(st.startTime).toLocaleString("vi-VN")}`);
      });
    }

    // Thống kê giá showtime
    console.log("\n\n📊 Price Statistics:\n");

    const priceStats = await Showtime.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price.standard" },
          maxPrice: { $max: "$price.standard" },
          avgPrice: { $avg: "$price.standard" },
          count: { $sum: 1 },
          pricesAt50k: {
            $sum: { $cond: [{ $eq: ["$price.standard", 50000] }, 1, 0] }
          },
          pricesNear50k: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$price.standard", 45000] },
                    { $lte: ["$price.standard", 55000] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    if (priceStats.length > 0) {
      const stats = priceStats[0];
      console.log(`Total showtimes: ${stats.count}`);
      console.log(`Min price: ${stats.minPrice?.toLocaleString("vi-VN")}₫`);
      console.log(`Max price: ${stats.maxPrice?.toLocaleString("vi-VN")}₫`);
      console.log(`Average price: ${Math.round(stats.avgPrice || 0).toLocaleString("vi-VN")}₫`);
      console.log(`\nShowtimes with price = 50k: ${stats.pricesAt50k}`);
      console.log(`Showtimes with price 45k-55k: ${stats.pricesNear50k}`);
    }

    // Phân bố giá
    console.log("\n\n📊 Price Distribution:\n");

    const priceDistribution = await Showtime.aggregate([
      {
        $group: {
          _id: "$price.standard",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $limit: 20
      }
    ]);

    console.log("Price Range Distribution:");
    priceDistribution.forEach((item) => {
      const price = item._id?.toLocaleString("vi-VN") || "N/A";
      const bar = "█".repeat(Math.floor(item.count / 10));
      console.log(`${price.padEnd(12)}₫: ${item.count.toString().padStart(4)} ${bar}`);
    });

  } catch (error) {
    console.error("❌ Error checking showtime prices:", error);
  }
};

const main = async () => {
  await connectDB();
  await checkShowtimePrice();
  await mongoose.connection.close();
  console.log("\n✅ Database connection closed");
  process.exit(0);
};

main();

