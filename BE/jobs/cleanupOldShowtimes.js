/**
 * Job to automatically delete showtimes that ended more than 1 day ago
 * This job runs daily at 2 AM to clean up old showtime data
 */

import cron from "node-cron";
import Showtime from "../models/showtimeModel.js";
import SeatStatus from "../models/seatStatusModel.js";

const cleanupOldShowtimes = async () => {
  console.log("🧹 Đang chạy job: Xóa các showtime đã qua ngày...");
  try {
    const now = new Date();
    
    // Tính thời gian 1 ngày trước
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0);

    // Tìm tất cả showtime đã kết thúc hơn 1 ngày trước
    // Chỉ xóa những showtime có endTime < (hôm nay - 1 ngày)
    const oldShowtimes = await Showtime.find({
      endTime: { $lt: oneDayAgo },
      status: { $in: ["completed", "cancelled"] }, // Chỉ xóa những showtime đã completed hoặc cancelled
    });

    if (oldShowtimes.length === 0) {
      console.log("✅ Không có showtime nào cần xóa.");
      return;
    }

    console.log(`📋 Tìm thấy ${oldShowtimes.length} showtime cần xóa.`);

    const showtimeIds = oldShowtimes.map((s) => s._id);

    // Xóa các SeatStatus liên quan trước (để tránh foreign key constraint)
    const seatStatusResult = await SeatStatus.deleteMany({
      showtime: { $in: showtimeIds },
    });
    console.log(`   ✅ Đã xóa ${seatStatusResult.deletedCount} seat status liên quan.`);

    // Xóa các showtime
    const showtimeResult = await Showtime.deleteMany({
      _id: { $in: showtimeIds },
    });

    console.log(
      `✅ Đã xóa thành công ${showtimeResult.deletedCount} showtime đã qua ngày.`
    );
  } catch (error) {
    console.error("❌ Lỗi khi xóa showtime đã qua ngày:", error);
  }
};

// Lên lịch chạy tác vụ hàng ngày lúc 2:00 AM
const scheduleCleanupOldShowtimes = () => {
  // Cron: '0 2 * * *' = Chạy lúc 2:00 AM mỗi ngày
  cron.schedule("0 2 * * *", cleanupOldShowtimes);
  console.log("✅ Đã lên lịch job: CleanupOldShowtimes - chạy hàng ngày lúc 2:00 AM.");
};

// Export để có thể chạy thủ công nếu cần
export { cleanupOldShowtimes, scheduleCleanupOldShowtimes };

