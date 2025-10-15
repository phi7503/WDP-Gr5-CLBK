import cron from "node-cron";
import Showtime from "../models/showtimeModel.js";

const updateCompletedShowtimes = async () => {
  console.log("Running scheduled job: Update completed showtime statuses.");
  try {
    const now = new Date();

    // Tìm tất cả suất chiếu đã kết thúc (endTime trong quá khứ)
    // và có trạng thái chưa phải là 'completed' hoặc 'cancelled'
    const showtimesToUpdate = await Showtime.find({
      endTime: { $lt: now },
      status: { $nin: ["completed", "cancelled"] },
    });

    if (showtimesToUpdate.length === 0) {
      console.log("No showtimes to update.");
      return;
    }

    const showtimeIds = showtimesToUpdate.map((s) => s._id);

    // Cập nhật trạng thái của các suất chiếu tìm được thành 'completed'
    const result = await Showtime.updateMany(
      { _id: { $in: showtimeIds } },
      { $set: { status: "completed" } }
    );

    console.log(
      `Successfully updated ${result.modifiedCount} showtimes to 'completed'.`
    );
  } catch (error) {
    console.error("Error updating completed showtime statuses:", error);
  }
};

// Lên lịch chạy tác vụ mỗi 5 phút
const scheduleShowtimeStatusUpdate = () => {
  // Chạy mỗi 5 phút: '*/5 * * * *'
  cron.schedule("*/5 * * * *", updateCompletedShowtimes);
  console.log("Scheduled job: UpdateShowtimeStatus - runs every 5 minutes.");
};

export { scheduleShowtimeStatusUpdate };
