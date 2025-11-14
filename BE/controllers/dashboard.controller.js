import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Booking from "../models/bookingModel.js";
import Showtime from "../models/showtimeModel.js";
import Movie from "../models/movieModel.js";
import Branch from "../models/branchModel.js";
import Theater from "../models/theaterModel.js";
import Seat from "../models/seatModel.js";
import SeatStatus from "../models/seatStatusModel.js";
import User from "../models/userModel.js";
/** Helper: lấy đầu-cuối tuần/tháng */
const getPeriodDates = (period, date) => {
  const now = date ? new Date(date) : new Date();
  let startDate, endDate;

  if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    const dayOfWeek = now.getDay(); // 0: CN
    startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  }
  return { startDate, endDate };
};

/** =========================
 *  ADMIN DASHBOARD (giữ nguyên)
 *  GET /api/admin-dashboard/stats
 *  Private/Admin
 *  ========================= */
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const { period = "week", date, from, to, movieId, branchId } = req.query;

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from); startDate.setHours(0, 0, 0, 0);
    endDate = new Date(to);     endDate.setHours(23, 59, 59, 999);
  } else {
    ({ startDate, endDate } = getPeriodDates(period, date));
  }

  const pipeline = [
    { $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: "completed",
        bookingStatus: { $in: ["confirmed", "completed"] },
      }
    },
    { $lookup: {
        from: "showtimes",
        localField: "showtime",
        foreignField: "_id",
        as: "showtimeInfo",
      }
    },
    { $unwind: "$showtimeInfo" },
    { $match: {
        ...(movieId && mongoose.Types.ObjectId.isValid(movieId)
          ? { "showtimeInfo.movie": new mongoose.Types.ObjectId(movieId) }
          : {}),
        ...(branchId && mongoose.Types.ObjectId.isValid(branchId)
          ? { "showtimeInfo.branch": new mongoose.Types.ObjectId(branchId) }
          : {}),
      }
    },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        dailyRevenue: { $sum: "$totalAmount" },
        dailyTickets: { $sum: { $size: "$seats" } },
        dailyBookings: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } },
    { $project: {
        _id: 0,
        date: "$_id",
        revenue: "$dailyRevenue",
        tickets: "$dailyTickets",
        bookings: "$dailyBookings",
      }
    },
  ];
  const dailyStats = await Booking.aggregate(pipeline);

  // Lấp ngày trống
  const map = new Map(dailyStats.map(i => [i.date, i]));
  const full = [];
  let d = new Date(startDate);
  while (d <= endDate) {
    const key = d.toISOString().split("T")[0];
    const stat = map.get(key);
    full.push({
      date: key,
      revenue: stat?.revenue || 0,
      tickets: stat?.tickets || 0,
      bookings: stat?.bookings || 0,
    });
    d.setDate(d.getDate() + 1);
  }

  const totals = full.reduce((acc, i) => ({
    totalRevenue: acc.totalRevenue + i.revenue,
    totalTickets: acc.totalTickets + i.tickets,
    totalBookings: acc.totalBookings + i.bookings,
  }), { totalRevenue: 0, totalTickets: 0, totalBookings: 0 });

  res.json({
    ...totals,
    dailyStats: full,
    query: {
      period,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      movieId: movieId || null,
      branchId: branchId || null,
    },
  });
});

/** =========================
 *  EMPLOYEE DASHBOARD
 *  GET /api/employee-dashboard/stats
 *  Private/Employee
 *  Trả về salesData[] đúng shape FE đang render
 *  ========================= */
export const getEmployeeDashboardStats = asyncHandler(async (req, res) => {
  const { period = "week", date, from, to } = req.query;

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from); startDate.setHours(0, 0, 0, 0);
    endDate = new Date(to);     endDate.setHours(23, 59, 59, 999);
  } else {
    ({ startDate, endDate } = getPeriodDates(period, date));
  }

  const employeeId = req.user._id;

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: "completed",
        bookingStatus: { $in: ["confirmed", "completed"] },
        /** ĐỔI TRƯỜNG NÀY nếu DB của bạn đặt tên khác:
         *  ví dụ: "soldBy", "cashier", "employee"
         */
        createdBy: new mongoose.Types.ObjectId(employeeId),
      },
    },
    // showtime -> lấy movieId để join movie title
    {
      $lookup: {
        from: "showtimes",
        localField: "showtime",
        foreignField: "_id",
        as: "showtimeInfo",
      },
    },
    { $unwind: "$showtimeInfo" },
    {
      $lookup: {
        from: "movies",
        localField: "showtimeInfo.movie",
        foreignField: "_id",
        as: "movieInfo",
      },
    },
    { $unwind: { path: "$movieInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        id: "$_id",
        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        movieTitle: { $ifNull: ["$movieInfo.title", "N/A"] },
        // Vé bán = số ghế
        ticketsSold: { $size: "$seats" },
        // Nếu hệ thống tách ticket/food, bạn có thể thay bằng trường tương ứng
        // Ở đây tạm coi totalAmount là doanh thu vé (combo = 0) để không gãy UI
        ticketRevenue: "$totalAmount",

        // combosSold & comboRevenue: tính từ mảng combos nếu có
        combosSold: {
          $cond: [
            { $and: [{ $ne: ["$combos", null] }, { $isArray: "$combos" }] },
            { $sum: { $map: { input: "$combos", as: "c", in: "$$c.quantity" } } },
            0,
          ],
        },
        comboRevenue: {
          $cond: [
            { $and: [{ $ne: ["$combos", null] }, { $isArray: "$combos" }] },
            {
              $sum: {
                $map: {
                  input: "$combos",
                  as: "c",
                  in: { $multiply: ["$$c.quantity", "$$c.price"] },
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        totalRevenue: { $add: ["$ticketRevenue", "$comboRevenue"] },
      },
    },
    { $sort: { date: 1 } },
  ];

  const salesData = await Booking.aggregate(pipeline);

  res.json({
    salesData,
    query: {
      period,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    },
  });
});
