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
    endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
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
  let { period = "week", date, from, to, movieId, branchId } = req.query;

  let startDate, endDate;

  // 1) Nếu FE truyền from/to → dùng range custom
  if (from && to) {
    startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
  } 
  // 2) Nếu FE truyền date → dùng getPeriodDates
  else if (date) {
    ({ startDate, endDate } = getPeriodDates(period, date));
  } 
  // 3) Không truyền gì → mặc định: THÁNG CÓ BOOKING MỚI NHẤT
  else {
    const lastBooking = await Booking.findOne().sort({ createdAt: -1 }).lean();
    if (lastBooking) {
      ({ startDate, endDate } = getPeriodDates(
        "month",
        lastBooking.createdAt
      ));
      period = "month";
    } else {
      // không có booking nào trong DB
      ({ startDate, endDate } = getPeriodDates("week", new Date()));
    }
  }

  console.log(
    "ADMIN DASHBOARD RANGE:",
    startDate.toISOString(),
    "->",
    endDate.toISOString()
  );

  // ✅ DEBUG: Kiểm tra số lượng booking trong DB
  const totalBookings = await Booking.countDocuments({});
  const completedBookingsAll = await Booking.countDocuments({
    paymentStatus: "completed",
  });
  const confirmedBookingsAll = await Booking.countDocuments({
    paymentStatus: "completed",
    bookingStatus: { $in: ["confirmed", "completed"] },
  });
  const bookingsInRange = await Booking.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
    paymentStatus: "completed",
    bookingStatus: { $in: ["confirmed", "completed"] },
  });

  console.log("🔍 DEBUG STATS:");
  console.log("  - Total bookings in DB:", totalBookings);
  console.log("  - Completed bookings (all time):", completedBookingsAll);
  console.log("  - Confirmed/Completed bookings (all time):", confirmedBookingsAll);
  console.log("  - Confirmed bookings in date range:", bookingsInRange);

  // ✅ DEBUG: Lấy một vài booking mẫu để xem dates
  const sampleBookings = await Booking.find({
    paymentStatus: "completed",
  })
    .limit(5)
    .select("_id createdAt paymentStatus bookingStatus totalAmount seats")
    .sort({ createdAt: -1 })
    .lean();

  if (sampleBookings.length > 0) {
    console.log("📋 Sample completed bookings:");
    sampleBookings.forEach((b) => {
      console.log(`  - ID: ${b._id}, createdAt: ${b.createdAt}, paymentStatus: ${b.paymentStatus}, bookingStatus: ${b.bookingStatus}, totalAmount: ${b.totalAmount}, seats: ${b.seats?.length || 0}`);
    });
  }

  // ✅ DEBUG: Kiểm tra collection name (Mongoose pluralize)
  // Mongoose tự động pluralize "Showtime" → "showtimes"
  const showtimeCollectionName = Showtime.collection?.collectionName || "showtimes";
  console.log("📦 Showtime collection name:", showtimeCollectionName);
  
  // ✅ DEBUG: Kiểm tra có showtime nào trong collection không
  try {
    const showtimeCount = await Showtime.countDocuments();
    console.log("📦 Total showtimes in collection:", showtimeCount);
  } catch (error) {
    console.error("⚠️ Error counting showtimes:", error.message);
  }

  const matchStage = {
    createdAt: { $gte: startDate, $lte: endDate },
    paymentStatus: "completed",
    bookingStatus: { $in: ["confirmed", "completed"] },
  };

  // Áp dụng lọc movie / branch nếu FE gửi lên và id hợp lệ
  if (movieId && mongoose.Types.ObjectId.isValid(movieId)) {
    matchStage["showtimeInfo.movie"] = new mongoose.Types.ObjectId(movieId);
  }
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    matchStage["showtimeInfo.branch"] = new mongoose.Types.ObjectId(branchId);
  }

  const pipeline = [
    {
      $match: {
        createdAt: matchStage.createdAt,
        paymentStatus: matchStage.paymentStatus,
        bookingStatus: matchStage.bookingStatus,
      },
    },
    // ✅ DEBUG: Đếm số booking sau match stage đầu tiên
    {
      $count: "afterFirstMatch"
    }
  ];

  const countAfterMatch = await Booking.aggregate(pipeline);
  console.log("🔍 Bookings after first $match:", countAfterMatch);

  // Pipeline thực tế
  const pipeline2 = [
    {
      $match: {
        createdAt: matchStage.createdAt,
        paymentStatus: matchStage.paymentStatus,
        bookingStatus: matchStage.bookingStatus,
      },
    },
    {
      $lookup: {
        from: showtimeCollectionName, // ✅ Sử dụng collection name từ model
        localField: "showtime",
        foreignField: "_id",
        as: "showtimeInfo",
      },
    },
    // ✅ DEBUG: Kiểm tra bookings không có showtime match
    {
      $addFields: {
        hasShowtime: { $gt: [{ $size: "$showtimeInfo" }, 0] }
      }
    },
    // ✅ DEBUG: Đếm bookings có/không có showtime
    {
      $group: {
        _id: "$hasShowtime",
        count: { $sum: 1 },
        sampleIds: { $push: "$_id" }
      }
    }
  ];

  const countAfterLookup = await Booking.aggregate(pipeline2);
  console.log("🔍 Bookings after $lookup (grouped by hasShowtime):", countAfterLookup);

  // ✅ DEBUG: Kiểm tra chi tiết bookings không có showtime match
  if (countAfterLookup.some(item => item._id === false)) {
    const bookingIds = countAfterLookup.find(item => item._id === false)?.sampleIds || [];
    console.log("⚠️ Bookings without showtime match:", bookingIds.length);
    
    // Lấy chi tiết các bookings này
    const bookingsWithoutShowtime = await Booking.find({
      _id: { $in: bookingIds }
    })
      .select("_id showtime createdAt paymentStatus bookingStatus")
      .lean();
    
    console.log("📋 Details of bookings without showtime:");
    for (const booking of bookingsWithoutShowtime) {
      console.log(`  - Booking ID: ${booking._id}`);
      console.log(`    Showtime ID: ${booking.showtime} (type: ${typeof booking.showtime})`);
      console.log(`    Showtime ObjectId: ${booking.showtime?.toString()}`);
      
      // Kiểm tra xem showtime có tồn tại không
      if (booking.showtime) {
        const showtimeExists = await Showtime.findById(booking.showtime).lean();
        console.log(`    Showtime exists in DB: ${showtimeExists ? 'YES' : 'NO'}`);
        if (!showtimeExists) {
          console.log(`    ⚠️ Showtime ${booking.showtime} NOT FOUND in collection!`);
        }
      } else {
        console.log(`    ⚠️ Booking has no showtime field!`);
      }
    }
  }

  // Pipeline thực tế để tính stats
  // ✅ Nếu cần filter theo movieId hoặc branchId, phải có showtime
  // ✅ Nếu không cần filter, có thể tính stats ngay cả khi showtime không tồn tại
  const needsShowtimeFilter = (movieId && mongoose.Types.ObjectId.isValid(movieId)) || 
                               (branchId && mongoose.Types.ObjectId.isValid(branchId));

  const pipeline3 = [
    {
      $match: {
        createdAt: matchStage.createdAt,
        paymentStatus: matchStage.paymentStatus,
        bookingStatus: matchStage.bookingStatus,
      },
    },
    {
      $lookup: {
        from: showtimeCollectionName, // ✅ Sử dụng collection name từ model
        localField: "showtime",
        foreignField: "_id",
        as: "showtimeInfo",
      },
    },
    // ✅ Chỉ unwind nếu cần filter theo movie/branch
    // ✅ Nếu không cần filter, giữ lại booking ngay cả khi không có showtime
    ...(needsShowtimeFilter ? [
      { $unwind: "$showtimeInfo" },
      {
        $match: {
          ...(movieId && mongoose.Types.ObjectId.isValid(movieId)
            ? { "showtimeInfo.movie": new mongoose.Types.ObjectId(movieId) }
            : {}),
          ...(branchId && mongoose.Types.ObjectId.isValid(branchId)
            ? { "showtimeInfo.branch": new mongoose.Types.ObjectId(branchId) }
            : {}),
        },
      }
    ] : [
      // ✅ Nếu không cần filter theo movie/branch, vẫn tính stats
      // ✅ Bao gồm cả booking có showtime bị xóa (showtimeInfo rỗng)
      // ✅ Để đảm bảo stats chính xác, chỉ tính booking có showtime hợp lệ
      // ✅ Nhưng nếu showtime bị xóa, booking vẫn nên được tính (booking đã completed)
      // ✅ Vì vậy, chỉ filter booking có showtime nếu showtime thực sự cần thiết
      // ✅ Ở đây, ta vẫn cần showtime để đảm bảo booking hợp lệ, nhưng sẽ log warning nếu không có
      { $unwind: { path: "$showtimeInfo", preserveNullAndEmptyArrays: true } },
      // ✅ Chỉ filter ra booking không có showtime nếu chúng ta chắc chắn cần showtime
      // ✅ Nhưng với stats dashboard, ta muốn tính cả booking có showtime bị xóa
      // ✅ Vì vậy, KHÔNG filter out booking không có showtime
    ]),
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        dailyRevenue: { $sum: "$totalAmount" },
        dailyTickets: { $sum: { $size: "$seats" } },
        dailyBookings: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
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

  const dailyStats = await Booking.aggregate(pipeline3);
  console.log("📊 Daily stats result:", dailyStats.length, "days with data");
  if (dailyStats.length > 0) {
    console.log("📊 Daily stats details:", JSON.stringify(dailyStats, null, 2));
  } else {
    console.log("⚠️ No daily stats found - all bookings may have been filtered out");
  }

  // Lấp ngày trống
  const map = new Map(dailyStats.map((i) => [i.date, i]));
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

  const totals = full.reduce(
    (acc, i) => ({
      totalRevenue: acc.totalRevenue + i.revenue,
      totalTickets: acc.totalTickets + i.tickets,
      totalBookings: acc.totalBookings + i.bookings,
    }),
    { totalRevenue: 0, totalTickets: 0, totalBookings: 0 }
  );

  console.log("📊 Final totals:", {
    totalRevenue: totals.totalRevenue,
    totalTickets: totals.totalTickets,
    totalBookings: totals.totalBookings,
  });

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

  // Nếu FE truyền from–to thì ưu tiên dùng khoảng này
  if (from && to) {
    startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
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
        // LỌC THEO employeeId
        employeeId: new mongoose.Types.ObjectId(employeeId),
      },
    },
    // join showtime để lấy movie
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

        // Vé = số ghế
        ticketsSold: { $size: "$seats" },

        // Tạm coi totalAmount là doanh thu vé
        ticketRevenue: "$totalAmount",

        // combosSold & comboRevenue từ mảng combos
        combosSold: {
          $cond: [
            { $and: [{ $ne: ["$combos", null] }, { $isArray: "$combos" }] },
            {
              $sum: {
                $map: { input: "$combos", as: "c", in: "$$c.quantity" },
              },
            },
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
