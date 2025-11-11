import asyncHandler from "express-async-handler";
import Booking from "../models/bookingModel.js";
import SeatStatus from "../models/seatStatusModel.js";
import Showtime from "../models/showtimeModel.js";
import Movie from "../models/movieModel.js";
import Theater from "../models/theaterModel.js";
import Branch from "../models/branchModel.js";

import { broadcastSeatUpdate } from "../socket/socketHandlers.js";
import mongoose from "mongoose";
import Combo from "../models/comboModel.js";
import Voucher from "../models/voucherModel.js";
import QRCode from "qrcode";
import { sendEmail } from "../utils/emailService.js";

// Create a PENDING booking - POST /api/bookings - Private
const createBooking = asyncHandler(async (req, res) => {
  const {
    showtimeId,
    seatIds,
    combos = [],
    voucherId,
    employeeMode,
    customerInfo,
  } = req.body;
  let userId = req.user._id;
  let employeeId = undefined;
  let customerInfoData = undefined;
  if (employeeMode) {
    employeeId = req.user._id;
    userId = req.user._id; // Đặt vé cho khách, nhưng user là nhân viên
    if (customerInfo) customerInfoData = customerInfo;
  }

  try {
    const showtime = await Showtime.findById(showtimeId).populate("movie");
    if (!showtime) {
      res.status(404);
      throw new Error("Showtime not found");
    }

    // Prevent booking if showtime has started or ended
    const now = new Date();
    if (showtime.startTime <= now) {
      res.status(400);
      throw new Error("Suất chiếu đã bắt đầu. Không thể đặt vé.");
    }
    if (showtime.endTime && showtime.endTime <= now) {
      res.status(400);
      throw new Error("Suất chiếu đã kết thúc. Không thể đặt vé.");
    }

    let seatStatuses;
    if (employeeMode) {
      // Cho phép nhân viên đặt ghế 'available' hoặc 'reserved', không kiểm tra reservedBy
      seatStatuses = await SeatStatus.find({
        showtime: showtimeId,
        seat: { $in: seatIds },
        status: { $in: ["available", "reserved"] }
      }).populate("seat");
    } else {

      // Khách hàng có thể book ghế available hoặc reserved (nếu đã reserve trước)
      seatStatuses = await SeatStatus.find({
        showtime: showtimeId,
        seat: { $in: seatIds },
        $or: [
          { status: "available" },
          { 
            status: "reserved", 
            reservedBy: userId, 
            reservationExpires: { $gt: new Date() } 
          }
        ]
      }).populate("seat");
    }

    if (seatStatuses.length !== seatIds.length) {
      res.status(400);
      throw new Error("Some selected seats are no longer available. Please try again.");
    }

    // 1. Tính tổng giá vé
    const seatTotal = seatStatuses.reduce((sum, status) => sum + (status.price || 0), 0);

    // 2. Tính tổng giá combo
    let comboTotal = 0;
    let comboDetails = [];
    if (combos.length > 0) {

      console.log('📦 Received combos:', JSON.stringify(combos, null, 2)); // ✅ Debug
      // ✅ Sửa: Frontend gửi combos với structure { _id, name, price, quantity }
      // Cần map để lấy _id từ combo object
      const comboIds = combos.map(c => c._id || c.combo); // Hỗ trợ cả 2 format
      console.log('📦 Combo IDs:', comboIds); // ✅ Debug
      
      const comboDocs = await Combo.find({ _id: { $in: comboIds }, isActive: true });
      console.log('📦 Found combos in DB:', comboDocs.length, comboDocs.map(c => ({ id: c._id, name: c.name, price: c.price }))); // ✅ Debug
      
      for (const c of combos) {
        const comboId = c._id || c.combo; // ✅ Sửa: Lấy _id hoặc combo
        const comboDoc = comboDocs.find(cd => cd._id.toString() === comboId.toString());
        if (comboDoc) {
          const quantity = c.quantity || 1;
          const price = comboDoc.price * quantity;
          comboTotal += price;
          comboDetails.push({ combo: comboDoc._id, quantity, price: comboDoc.price });

          console.log(`✅ Added combo: ${comboDoc.name} x${quantity} = ${price.toLocaleString('vi-VN')} VND`); // ✅ Debug
        } else {
          console.warn(`⚠️ Combo not found: ${comboId}`);
        }
      }
      console.log(`💰 Total combo amount: ${comboTotal.toLocaleString('vi-VN')} VND`); // ✅ Debug
    }

    // 3. Kiểm tra và áp dụng voucher
    let discountAmount = 0;
    let appliedVoucher = null;
    if (voucherId) {
      const voucher = await Voucher.findById(voucherId);
      const now = new Date();
      if (!voucher || !voucher.isActive || now < voucher.startDate || now > voucher.endDate) {
        throw new Error("Voucher is not valid or expired");
      }
      // Kiểm tra minPurchase
      const subtotal = seatTotal + comboTotal;
      if (voucher.minPurchase && subtotal < voucher.minPurchase) {
        throw new Error(`Minimum purchase for this voucher is ${voucher.minPurchase}`);
      }
      // Kiểm tra applicableMovies/applicableBranches nếu có
      if (voucher.applicableMovies && voucher.applicableMovies.length > 0) {
        if (!voucher.applicableMovies.some(mId => mId.toString() === showtime.movie._id.toString())) {
          throw new Error("Voucher is not applicable for this movie");
        }
      }
      if (voucher.applicableBranches && voucher.applicableBranches.length > 0) {
        if (!voucher.applicableBranches.some(bId => bId.toString() === showtime.branch?.toString())) {
          throw new Error("Voucher is not applicable for this branch");
        }
      }
      // Tính discount
      if (voucher.discountType === "percentage") {
        discountAmount = Math.floor((seatTotal + comboTotal) * voucher.discountValue / 100);
        if (voucher.maxDiscount > 0) {
          discountAmount = Math.min(discountAmount, voucher.maxDiscount);
        }
      } else if (voucher.discountType === "fixed") {
        discountAmount = voucher.discountValue;
        if (voucher.maxDiscount > 0) {
          discountAmount = Math.min(discountAmount, voucher.maxDiscount);
        }
      }
      appliedVoucher = voucher._id;
    }

    // 4. Tính tổng tiền cuối cùng
    const totalAmount = Math.max(seatTotal + comboTotal - discountAmount, 0);

    
    console.log('💰 Payment Calculation:', { // ✅ Debug
      seatTotal: seatTotal.toLocaleString('vi-VN') + ' VND',
      comboTotal: comboTotal.toLocaleString('vi-VN') + ' VND',
      discountAmount: discountAmount.toLocaleString('vi-VN') + ' VND',
      totalAmount: totalAmount.toLocaleString('vi-VN') + ' VND'
    });

    // 5. Tạo booking với trạng thái pending (chờ thanh toán)
    const booking = await Booking.create({
      user: userId,
      employeeId,
      customerInfo: customerInfoData,
      showtime: showtimeId,
      seats: seatStatuses.map((status) => ({
        _id: status.seat._id,
        row: status.seat.row,
        number: status.seat.number,
        type: status.seat.type,
        price: status.price,
      })),
      totalAmount,
      combos: comboDetails,
      voucher: appliedVoucher,
      discountAmount,

      paymentStatus: "pending", // Chờ thanh toán qua PayOS
      bookingStatus: "pending", // Chờ thanh toán

    });

    if (!booking) {
      res.status(500);
      throw new Error("Failed to create booking record");
    }


    // Tạo mã QR cho booking (dùng booking._id làm nội dung QR)
    const qrData = booking._id.toString();
    const qrCodeBase64 = await QRCode.toDataURL(qrData);
    booking.qrCode = qrCodeBase64;
    await booking.save();

    // Link the seat statuses to this booking (vẫn giữ status "reserved" cho đến khi thanh toán thành công)
    await SeatStatus.updateMany(
        { _id: { $in: seatStatuses.map(s => s._id) } },
        { 
          $set: { 
            booking: booking._id,
            status: "reserved", // Giữ reserved cho đến khi thanh toán thành công
          } 
        }
    );

    const populatedBooking = await Booking.findById(booking._id)
        .populate("showtime")
        .populate("user", "name email");

    res.status(201).json({
      success: true,
      booking: populatedBooking,
      message: "Booking created and payment completed successfully!",
    });
  } catch (error) {
    console.error("Error creating booking:", {
      message: error.message,
      showtimeId,
      seatIds,
      userId,
    });
    res.status(400);
    throw error;
  }
});

// Get user bookings - GET /api/bookings/my-bookings - Private
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: "showtime",
        populate: [
          {
            path: "movie",
            select: "title poster duration genre",
          },
          {
            path: "theater",
            select: "name",
          },
          {
            path: "branch",
            select: "name location",
          },
        ],
      })
      .sort({ createdAt: -1 });

  // Manual populate fallback for theater and branch if initial populate fails
  for (let booking of bookings) {
    if (booking.showtime && !booking.showtime.theater) {
      await booking.showtime.populate('theater', 'name');
    }
    if (booking.showtime && !booking.showtime.branch) {
      await booking.showtime.populate('branch', 'name location');
    }
  }
  res.json({
    success: true,
    bookings,
  });
});

// Get booking by ID - GET /api/bookings/:id - Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title poster duration" },
          { path: "theater", select: "name" },
          { path: "branch", select: "name location" },
        ],
      })
      .populate("user", "name email")
      .populate("voucher")
      .populate({
        path: "combos.combo",
        select: "name items"
      });

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to view this booking");
  }

  res.json({
    success: true,
    booking,
  });
});

// Update payment status - PUT /api/bookings/:id/payment - Private
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus, transactionId, paymentMethod } = req.body;
  const booking = await Booking.findById(req.params.id).populate({
    path: "showtime",
    populate: [
      { path: "movie", select: "title poster duration" },
      { path: "theater", select: "name" },
      { path: "branch", select: "name location" },
    ],
  }).populate("user", "name email");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (
    (booking.user && booking.user._id && booking.user._id.toString() === req.user._id.toString()) ||
    (booking.employeeId && booking.employeeId.toString() === req.user._id.toString())
  ) {
    // authorized
  } else {
    res.status(403);
    throw new Error("Not authorized to update this booking");
  }

  booking.paymentStatus = paymentStatus;
  if (transactionId) booking.transactionId = transactionId;
  if (paymentMethod) booking.paymentMethod = paymentMethod;

  if (paymentStatus === "completed") {
    booking.bookingStatus = "confirmed";

    const seatIds = booking.seats.map(s => s._id);
    await SeatStatus.updateMany(
        { showtime: booking.showtime._id, seat: { $in: seatIds } },
        { $set: { status: 'booked', reservedBy: null, reservationExpires: null } }
    );

    broadcastSeatUpdate(booking.showtime._id.toString(), {
      type: 'seats-booked',
      seatIds: seatIds,
      bookingId: booking._id,
    });

    // Gửi email xác nhận vé cho user (chỉ gửi nếu không phải nhân viên đặt)
    if (!booking.employeeId && booking.user && booking.user.email) {
      // Tạo QR code buffer để đính kèm

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const qrData = `${baseUrl}/booking-details/${booking._id}`;
      const qrCodeBuffer = await QRCode.toBuffer(qrData, { 
        type: 'png', 
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      const emailHtml = `
        <h2>Chúc mừng bạn đã đặt vé thành công!</h2>
        <p><b>Phim:</b> ${booking.showtime.movie.title}</p>
        <p><b>Suất chiếu:</b> ${new Date(booking.showtime.startTime).toLocaleString()}</p>
        <p><b>Rạp:</b> ${booking.showtime.branch?.name || ""} - ${booking.showtime.theater?.name || ""}</p>
        <p><b>Ghế:</b> ${booking.seats.map(s => s.row + s.number).join(", ")}</p>
        <p><b>Trạng thái:</b> Đã thanh toán</p>
        <p><b>Mã QR:</b> <i>(Vui lòng mở file đính kèm để check-in tại rạp)</i></p>
      `;
      try {
        await sendEmail({
          to: booking.user.email,
          subject: "Xác nhận đặt vé thành công",
          html: emailHtml,
          attachments: [
            {
              filename: 'qrcode.png',
              content: qrCodeBuffer,
              contentType: 'image/png',
            },
          ],
        });
      } catch (err) {
        console.error("Gửi email xác nhận vé thất bại:", err);
      }
    }
  } else if (paymentStatus === "failed") {
    booking.bookingStatus = "cancelled";

    const seatIds = booking.seats.map(s => s._id);
    await SeatStatus.updateMany(
        { showtime: booking.showtime, seat: { $in: seatIds } },
        { $set: { status: "available", booking: null, reservedBy: null, reservedAt: null, reservationExpires: null } }
    );

    broadcastSeatUpdate(booking.showtime.toString(), {
      type: "seats-released",
      seatIds,
      reason: "payment-failed",
    });
  }

  const updatedBooking = await booking.save();
  res.json({
    success: true,
    booking: updatedBooking,
    message: "Payment status updated successfully",
  });
});


// Cancel booking - PUT /api/bookings/:id/cancel - Private
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this booking");
  }

  if (booking.bookingStatus === "cancelled") {
    res.status(400);
    throw new Error("Booking is already cancelled");
  }

  if (booking.bookingStatus === "completed") {
    res.status(400);
    throw new Error("Cannot cancel completed booking");
  }

  booking.bookingStatus = "cancelled";
  await booking.save();

  const seatIds = booking.seats.map((seat) => seat._id);
  await SeatStatus.updateMany(
      { booking: booking._id },
      {
        $set: {
          status: "available",
          booking: null,
          reservedBy: null,
          reservedAt: null,
          reservationExpires: null,
        },
      }
  );

  broadcastSeatUpdate(booking.showtime, {
    type: "seats-released",
    seatIds,
    userId: req.user._id,
    reason: "booking-cancelled",
    timestamp: new Date(),
  });

  res.json({
    success: true,
    message: "Booking cancelled successfully",
  });
});

// Xác thực vé từ mã QR
const verifyTicket = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;
  const booking = await Booking.findOne({ _id: qrCode })
    .populate({
      path: "showtime",
      populate: [
        { path: "movie", select: "title" },
        { path: "theater", select: "name" },
        { path: "branch", select: "name location" }
      ]
    });
  if (!booking) {
    return res.status(404).json({ valid: false, message: "Vé không tồn tại!" });
  }
  // Kiểm tra hết hạn mã QR dựa trên thời gian suất chiếu
  const now = new Date();
  const showtime = booking.showtime;
  let expired = false;
  if (showtime) {
    // Nếu có endTime thì dùng endTime, không thì dùng startTime
    const endTime = showtime.endTime ? new Date(showtime.endTime) : new Date(showtime.startTime);
    if (now > endTime) {
      expired = true;
    }
  }
  if (expired) {
    return res.status(400).json({
      valid: false,
      message: "Mã QR đã hết hạn (suất chiếu đã kết thúc)!",
      ticket: {
        bookingId: booking._id,
        movie: booking.showtime.movie.title,
        showtime: booking.showtime.startTime,
        theater: booking.showtime.theater.name,
        branch: booking.showtime.branch.name,
        seats: booking.seats.map(s => `${s.row}${s.number}`),
        checkedIn: booking.checkedIn,
      }
    });
  }
  res.json({
    valid: true,
    checkedIn: booking.checkedIn,
    ticket: {
      bookingId: booking._id,
      movie: booking.showtime.movie.title,
      showtime: booking.showtime.startTime,
      theater: booking.showtime.theater.name,
      branch: booking.showtime.branch.name,
      seats: booking.seats.map(s => `${s.row}${s.number}`),
      checkedIn: booking.checkedIn,
    }
  });
});

// Xác nhận vé đã sử dụng
const checkInTicket = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Vé không tồn tại!" });
  }
  if (booking.checkedIn) {
    return res.status(400).json({ success: false, message: "Vé đã được sử dụng!" });
  }
  booking.checkedIn = true;
  booking.checkedInAt = new Date();
  await booking.save();
  res.json({ success: true, message: "Xác nhận vé thành công!" });
});

// Lấy tất cả booking do employee tạo hoặc tất cả booking (cho admin)
const getAllBookingsForEmployee = asyncHandler(async (req, res) => {
  // Trả về tất cả booking cho employee và admin
  const bookings = await Booking.find({})
    .populate({
      path: 'showtime',
      populate: { path: 'movie', select: 'title' }
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, bookings });
});

// [ADMIN] Get all bookings for a specific user
const getBookingsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400);
    throw new Error("Missing userId parameter");
  }
  // Only allow admin to use this endpoint
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    throw new Error("Not authorized");
  }
  const bookings = await Booking.find({
    user: userId,
    bookingStatus: "confirmed"
  })
    .populate({
      path: "showtime",
      populate: [
        { path: "movie", select: "title" },
        { path: "theater", select: "name" },
        { path: "branch", select: "name" }
      ]
    })
    .sort({ createdAt: -1 });
  res.json({ bookings });
});

// [POST] /api/bookings/:id/resend-email
export const resendEmailQRCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const booking = await Booking.findById(id)
    .populate({
      path: "showtime",
      populate: [
        { path: "movie", select: "title" },
        { path: "theater", select: "name" },
        { path: "branch", select: "name location" }
      ]
    })
    .populate("user", "name email");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Kiểm tra quyền truy cập
  if (booking.user._id.toString() !== userId.toString() && req.user.role !== 'admin' && req.user.role !== 'employee') {
    res.status(403);
    throw new Error("Không có quyền truy cập booking này");
  }

  // Kiểm tra booking đã được thanh toán chưa
  if (booking.paymentStatus !== "completed") {
    res.status(400);
    throw new Error("Booking chưa được thanh toán. QR code chỉ được gửi sau khi thanh toán thành công.");
  }

  // Kiểm tra có QR code chưa
  if (!booking.qrCode) {
    // Tạo QR code nếu chưa có
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrData = `${baseUrl}/booking-details/${booking._id}`;
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    booking.qrCode = qrCodeBase64;
    await booking.save();
  }

  // Gửi email với QR code
  const customerEmail = booking.customerInfo?.email || booking.user?.email;
  if (!customerEmail) {
    res.status(400);
    throw new Error("Không tìm thấy email khách hàng");
  }

  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrData = `${baseUrl}/booking-details/${booking._id}`;
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #D32F2F;">🎉 Xác nhận đặt vé thành công!</h2>
        <p><b>Phim:</b> ${booking.showtime.movie.title}</p>
        <p><b>Suất chiếu:</b> ${new Date(booking.showtime.startTime).toLocaleString('vi-VN')}</p>
        <p><b>Rạp:</b> ${booking.showtime.branch?.name || ""} - ${booking.showtime.theater?.name || ""}</p>
        <p><b>Ghế:</b> ${booking.seats.map(s => s.row + s.number).join(", ")}</p>
        <p><b>Tổng tiền:</b> ${booking.totalAmount.toLocaleString('vi-VN')} VND</p>
        <p><b>Trạng thái:</b> Đã thanh toán</p>
        <p><b>Mã QR:</b> <i>(Vui lòng mở file đính kèm để check-in tại rạp)</i></p>
        <p style="margin-top: 20px;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      </div>
    `;

    await sendEmail({
      to: customerEmail,
      subject: "Xác nhận đặt vé thành công - QR Code",
      html: emailHtml,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCodeBuffer,
          contentType: 'image/png',
        },
      ],
    });

    res.json({
      success: true,
      message: "Email đã được gửi thành công",
    });
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    res.status(500);
    throw new Error("Không thể gửi email. Vui lòng thử lại sau.");
  }
});
export {
  createBooking,
  getMyBookings,
  getBookingById,
  updatePaymentStatus,
  cancelBooking,
  verifyTicket,
  checkInTicket,
  getAllBookingsForEmployee,
  getBookingsByUserId,
};
