import asyncHandler from "express-async-handler";
import Booking from "../models/bookingModel.js";
import mongoose from "mongoose";

// Helper để lấy ngày bắt đầu/kết thúc của tuần/tháng
const getPeriodDates = (period, date) => {
  const now = date ? new Date(date) : new Date();
  let startDate, endDate;

  if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    // Mặc định là tuần, tuần bắt đầu từ Chủ Nhật
    const dayOfWeek = now.getDay();
    startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  }
  return { startDate, endDate };
};

// @desc    Get detailed stats for admin dashboard
// @route   GET /api/admin-dashboard/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const { period = "week", date, from, to, movieId, branchId } = req.query;

  let startDate, endDate;

  if (from && to) {
    startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
  } else {
    const dates = getPeriodDates(period, date);
    startDate = dates.startDate;
    endDate = dates.endDate;
  }

  // --- Aggregation Pipeline ---
  const aggregationPipeline = [
    // 1. Lọc booking theo khoảng thời gian và trạng thái
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: "completed",
        bookingStatus: { $in: ["confirmed", "completed"] },
      },
    },
    // 2. Join với showtimes để lấy thông tin phim và chi nhánh
    {
      $lookup: {
        from: "showtimes",
        localField: "showtime",
        foreignField: "_id",
        as: "showtimeInfo",
      },
    },
    { $unwind: "$showtimeInfo" },
    // 3. Lọc theo phim và chi nhánh (nếu có)
    {
      $match: {
        ...(movieId && mongoose.Types.ObjectId.isValid(movieId)
          ? { "showtimeInfo.movie": new mongoose.Types.ObjectId(movieId) }
          : {}),
        ...(branchId && mongoose.Types.ObjectId.isValid(branchId)
          ? { "showtimeInfo.branch": new mongoose.Types.ObjectId(branchId) }
          : {}),
      },
    },
    // 4. Gom nhóm theo ngày để tính thống kê hàng ngày
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        dailyRevenue: { $sum: "$totalAmount" },
        dailyTickets: { $sum: { $size: "$seats" } },
        dailyBookings: { $sum: 1 },
      },
    },
    // 5. Sắp xếp kết quả theo ngày
    { $sort: { _id: 1 } },
    // 6. Định dạng lại output
    {
      $project: {
        _id: 0,
        date: "$_id",
        revenue: "$dailyRevenue",
        tickets: "$dailyTickets",
        bookings: "$dailyBookings",
      },
    },
  ];

  const dailyStats = await Booking.aggregate(aggregationPipeline);

  // --- Xử lý kết quả ---

  // Tạo map để tra cứu nhanh
  const statsMap = new Map(dailyStats.map((item) => [item.date, item]));
  const fullDateRangeStats = [];
  
  // Lấp đầy những ngày không có dữ liệu bằng số 0
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const stat = statsMap.get(dateStr);
    fullDateRangeStats.push({
      date: dateStr,
      revenue: stat?.revenue || 0,
      tickets: stat?.tickets || 0,
      bookings: stat?.bookings || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Tính tổng
  const totals = fullDateRangeStats.reduce(
    (acc, day) => {
      acc.totalRevenue += day.revenue;
      acc.totalTickets += day.tickets;
      acc.totalBookings += day.bookings;
      return acc;
    },
    { totalRevenue: 0, totalTickets: 0, totalBookings: 0 }
  );

  res.json({
    ...totals,
    dailyStats: fullDateRangeStats,
    query: {
      period,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      movieId,
      branchId,
    },
  });
});

export { getDashboardStats }; 