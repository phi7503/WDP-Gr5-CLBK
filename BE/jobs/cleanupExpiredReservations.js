import cron from "node-cron";
import SeatStatus from "../models/seatStatusModel.js";
import { broadcastSeatUpdate } from "../socket/socketHandlers.js";

const cleanupTask = async () => {
  try {
    const now = new Date();

    const expiredReservations = await SeatStatus.find({
      status: "reserved",
      reservationExpires: { $lt: now },
    }).select("showtime seat");

    if (expiredReservations.length > 0) {
      const expiredSeatIds = expiredReservations.map((status) => status.seat);

      const updateResult = await SeatStatus.updateMany(
        { seat: { $in: expiredSeatIds }, status: "reserved" },
        {
          $set: {
            status: "available",
            reservedAt: null,
            reservationExpires: null,
            reservedBy: null,
          },
        }
      );

      // Thông báo cho các client WebSocket nếu có ghế được giải phóng
      if (updateResult.modifiedCount > 0) {
        const showtimeGroups = {};
        expiredReservations.forEach((status) => {
          const showtimeId = status.showtime.toString();
          if (!showtimeGroups[showtimeId]) {
            showtimeGroups[showtimeId] = [];
          }
          showtimeGroups[showtimeId].push(status.seat);
        });

        for (const showtimeId in showtimeGroups) {
          broadcastSeatUpdate(showtimeId, {
            type: "seats-released",
            seatIds: showtimeGroups[showtimeId],
            reason: "reservation-expired",
            timestamp: new Date(),
          });
        }
        console.log(`🧹 Đã dọn dẹp ${updateResult.modifiedCount} ghế hết hạn.`);
      }
    }
  } catch (error) {
    console.error("Lỗi khi dọn dẹp ghế hết hạn:", error);
  }
};

// Hàm để bắt đầu cron job
const startCleanupJob = () => {
  // Chạy tác vụ mỗi phút
  cron.schedule("* * * * *", cleanupTask);
  console.log("✅ Đã lên lịch dọn dẹp ghế hết hạn (chạy mỗi phút).");
};

export default startCleanupJob;
