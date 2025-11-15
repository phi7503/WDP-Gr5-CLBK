import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Booking from "../models/bookingModel.js";

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

const deleteExcessBookings = async () => {
  try {
    console.log("🔄 Starting to delete excess bookings...");

    // Đếm tổng số bookings hiện tại
    const totalBookings = await Booking.countDocuments({
      paymentStatus: "completed",
      bookingStatus: { $in: ["confirmed", "completed"] },
    });

    console.log(`📊 Current completed bookings: ${totalBookings}`);

    // Target: giữ lại khoảng 134 vé (không phải 134 bookings)
    const targetTickets = 134;

    // Lấy thống kê hiện tại
    const currentStats = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          bookingStatus: { $in: ["confirmed", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: { $size: "$seats" } },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    if (currentStats.length === 0 || currentStats[0].totalTickets <= targetTickets) {
      console.log("ℹ️ No bookings to delete. Current ticket count is already at or below target.");
      if (currentStats.length > 0) {
        console.log(`  Current: ${currentStats[0].totalTickets} tickets`);
      }
      return;
    }

    const currentTickets = currentStats[0].totalTickets;
    const ticketsToDelete = currentTickets - targetTickets;

    console.log(`🎯 Target tickets: ${targetTickets}`);
    console.log(`📊 Current tickets: ${currentTickets}`);
    console.log(`🗑️ Will delete bookings to remove: ${ticketsToDelete} tickets`);

    // Lấy tất cả bookings, sắp xếp theo số ghế giảm dần (bookings có nhiều ghế trước)
    // Ưu tiên xóa bookings có nhiều ghế để giữ lại bookings có ít ghế
    const allBookings = await Booking.find({
      paymentStatus: "completed",
      bookingStatus: { $in: ["confirmed", "completed"] },
    })
      .select("_id createdAt totalAmount seats")
      .lean();

    // Sắp xếp theo số ghế giảm dần, sau đó theo ngày giảm dần
    allBookings.sort((a, b) => {
      const aSeats = a.seats?.length || 0;
      const bSeats = b.seats?.length || 0;
      if (bSeats !== aSeats) {
        return bSeats - aSeats; // Nhiều ghế trước
      }
      // Nếu số ghế bằng nhau, sắp xếp theo ngày (mới nhất trước)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Chọn bookings để xóa cho đến khi đạt target
    const bookingsToDelete = [];
    let ticketsDeleted = 0;

    for (const booking of allBookings) {
      if (ticketsDeleted >= ticketsToDelete) {
        break;
      }
      const seatsCount = booking.seats?.length || 0;
      bookingsToDelete.push(booking);
      ticketsDeleted += seatsCount;
    }

    if (bookingsToDelete.length === 0) {
      console.log("ℹ️ No bookings found to delete.");
      return;
    }

    // Tính tổng vé và doanh thu sẽ bị xóa
    const deletedStats = {
      bookings: bookingsToDelete.length,
      tickets: bookingsToDelete.reduce((sum, b) => sum + (b.seats?.length || 0), 0),
      revenue: bookingsToDelete.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    };

    console.log("\n📋 Bookings to delete:");
    console.log(`  - Bookings: ${deletedStats.bookings}`);
    console.log(`  - Tickets: ${deletedStats.tickets}`);
    console.log(`  - Revenue: ${deletedStats.revenue.toLocaleString("vi-VN")}₫`);

    // Xóa bookings
    const bookingIds = bookingsToDelete.map((b) => b._id);
    const deleteResult = await Booking.deleteMany({
      _id: { $in: bookingIds },
    });

    console.log(`\n✅ Deleted ${deleteResult.deletedCount} bookings`);

    // Kiểm tra lại số lượng sau khi xóa
    const remainingCount = await Booking.countDocuments({
      paymentStatus: "completed",
      bookingStatus: { $in: ["confirmed", "completed"] },
    });

    const remainingStats = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          bookingStatus: { $in: ["confirmed", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalTickets: { $sum: { $size: "$seats" } },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    console.log("\n📊 Remaining statistics:");
    if (remainingStats.length > 0) {
      const stats = remainingStats[0];
      console.log(`  - Bookings: ${stats.totalBookings}`);
      console.log(`  - Tickets: ${stats.totalTickets}`);
      console.log(`  - Revenue: ${stats.totalRevenue.toLocaleString("vi-VN")}₫`);
    } else {
      console.log(`  - Bookings: ${remainingCount}`);
      console.log("  - No additional stats available");
    }

  } catch (error) {
    console.error("❌ Error deleting bookings:", error);
  }
};

const main = async () => {
  await connectDB();
  await deleteExcessBookings();
  await mongoose.connection.close();
  console.log("\n✅ Database connection closed");
  process.exit(0);
};

main();

