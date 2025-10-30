import { PayOS } from "@payos/node";
import axios from "axios";
import dotenv from "dotenv";
import Booking from "../models/bookingModel.js";
import SeatStatus from "../models/seatStatusModel.js";
import QRCode from "qrcode";
import { sendEmail } from "../utils/emailService.js";
import { broadcastSeatUpdate } from "../socket/socketHandlers.js";

dotenv.config();

// Khởi tạo PayOS SDK (chỉ khi có đủ credentials)
let payOS;
if (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) {
  try {
    payOS = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID,
      apiKey: process.env.PAYOS_API_KEY,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    });
    console.log("✅ PayOS initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing PayOS:", error.message);
  }
} else {
  console.warn("⚠️ PayOS credentials not found. PayOS features will be disabled.");
}

// [POST] /api/payos/create
export const createPayment = async (req, res) => {
  try {
    const { orderCode, amount, description } = req.body;

    // Validate input
    if (!orderCode || !amount || !description) {
      return res.status(400).json({ 
        message: "Thiếu thông tin: orderCode, amount, description là bắt buộc" 
      });
    }

    // Validate PayOS credentials
    if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
      console.error("❌ PayOS credentials missing in environment variables");
      return res.status(500).json({ 
        message: "Cấu hình PayOS chưa đầy đủ. Vui lòng kiểm tra biến môi trường." 
      });
    }

    if (!payOS) {
      return res.status(500).json({ 
        message: "PayOS SDK chưa được khởi tạo. Vui lòng kiểm tra lại cấu hình." 
      });
    }

    // PayOS description chỉ được tối đa 25 ký tự
    const truncatedDescription = description.length > 25 
      ? description.substring(0, 22) + '...' 
      : description;

    const body = {
      orderCode: Number(orderCode),
      amount: Number(amount),
      description: truncatedDescription,
      returnUrl: process.env.PAYOS_RETURN_URL || "http://localhost:3000/payment-success",
      cancelUrl: process.env.PAYOS_CANCEL_URL || "http://localhost:3000/payment-cancel",
    };

    console.log("🔗 Creating PayOS payment link:", body);
    const result = await payOS.paymentRequests.create(body);
    
    console.log("✅ Payment link created:", result.checkoutUrl);
    res.json({ checkoutUrl: result.checkoutUrl });
  } catch (error) {
    console.error("❌ Error creating PayOS link:", error.response?.data || error.message);
    res.status(500).json({ 
      message: error.response?.data?.desc || "Lỗi tạo link thanh toán",
      error: error.message 
    });
  }
};

// [GET] /api/payos/status/:orderCode
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderCode } = req.params;

    const response = await axios.get(
      `https://api.payos.vn/v2/payment-requests/${orderCode}`,
      {
        headers: {
          "x-client-id": process.env.PAYOS_CLIENT_ID,
          "x-api-key": process.env.PAYOS_API_KEY,
        },
      }
    );

    const data = response.data.data;
    res.json({
      orderCode: data.orderCode,
      amount: data.amount,
      status: data.status,
      transactionDateTime: data.transactionDateTime,
    });
  } catch (error) {
    console.error("❌ Error checking payment:", error.response?.data || error);
    res.status(500).json({ message: "Lỗi kiểm tra trạng thái thanh toán" });
  }
};

// [POST] /api/payos/create-from-booking/:bookingId
export const createPaymentFromBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?._id;

    if (!bookingId) {
      return res.status(400).json({ 
        message: "Booking ID là bắt buộc" 
      });
    }

    // Lấy booking từ database
    const booking = await Booking.findById(bookingId)
      .populate("showtime")
      .populate("user", "name email");

    if (!booking) {
      return res.status(404).json({ 
        message: "Không tìm thấy booking" 
      });
    }

    // Kiểm tra quyền truy cập
    if (userId && booking.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "Không có quyền truy cập booking này" 
      });
    }

    // Kiểm tra trạng thái thanh toán
    if (booking.paymentStatus === "completed") {
      return res.status(400).json({ 
        message: "Booking đã được thanh toán" 
      });
    }

    if (!payOS) {
      return res.status(500).json({ 
        message: "PayOS SDK chưa được khởi tạo" 
      });
    }

    // Tạo orderCode từ booking ID (PayOS yêu cầu số nguyên)
    // Sử dụng timestamp + booking ID hash để tạo số duy nhất
    const orderCode = parseInt(booking._id.toString().slice(-8), 16) || Date.now();

    // Tạo description từ thông tin booking
    const movieTitle = booking.showtime?.movie?.title || "Vé phim";
    const description = movieTitle.length > 22 
      ? movieTitle.substring(0, 22) + '...' 
      : movieTitle;

    const body = {
      orderCode: orderCode,
      amount: booking.totalAmount,
      description: description,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?bookingId=${bookingId}`,
      cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel?bookingId=${bookingId}`,
    };

    // Lưu orderCode vào booking để tra cứu sau này
    booking.transactionId = orderCode.toString();
    await booking.save();

    console.log("🔗 Creating PayOS payment link for booking:", bookingId);
    const result = await payOS.paymentRequests.create(body);
    
    console.log("✅ Payment link created:", result.checkoutUrl);
    res.json({ 
      checkoutUrl: result.checkoutUrl,
      orderCode: orderCode,
      bookingId: bookingId
    });
  } catch (error) {
    console.error("❌ Error creating PayOS link from booking:", error);
    res.status(500).json({ 
      message: error.response?.data?.desc || "Lỗi tạo link thanh toán",
      error: error.message 
    });
  }
};

// [POST] /api/payos/webhook
export const handleWebhook = async (req, res) => {
  try {
    const { data, code, desc } = req.body;

    if (!payOS) {
      return res.json({
        error: -1,
        message: "PayOS SDK chưa được khởi tạo",
        data: null
      });
    }

    // Verify webhook data with PayOS
    const webhookHelper = await payOS.webhooks.verifyPaymentWebhookData(req.body);
    
    if (webhookHelper.error !== 0) {
      console.log("❌ Webhook verification failed:", webhookHelper);
      return res.json({ 
        error: webhookHelper.error,
        message: webhookHelper.message,
        data: null
      });
    }

    console.log("✅ Payment webhook verified:", {
      orderCode: data.orderCode,
      amount: data.amount,
      description: data.description,
      status: data.status,
    });

    // Tìm booking theo orderCode (đã lưu trong transactionId)
    const orderCodeStr = data.orderCode.toString();
    const booking = await Booking.findOne({ transactionId: orderCodeStr })
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
      console.error("❌ Booking not found for orderCode:", orderCodeStr);
      return res.json({
        error: -1,
        message: "Không tìm thấy booking",
        data: null
      });
    }

    // Chỉ xử lý nếu thanh toán thành công và booking chưa được thanh toán
    if (data.status === "PAID" && booking.paymentStatus !== "completed") {
      // Cập nhật booking status
      booking.paymentStatus = "completed";
      booking.bookingStatus = "confirmed";
      booking.paymentMethod = "payos";

      // Tạo QR code
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

      // Cập nhật seat statuses thành "booked"
      const seatIds = booking.seats.map(s => s._id);
      await SeatStatus.updateMany(
        { showtime: booking.showtime._id, seat: { $in: seatIds } },
        { 
          $set: { 
            status: 'booked',
            bookedAt: new Date(),
            reservedBy: null,
            reservationExpires: null
          } 
        }
      );

      // Broadcast socket event
      broadcastSeatUpdate(booking.showtime._id.toString(), {
        type: 'seats-booked',
        seatIds: seatIds,
        bookingId: booking._id,
      });

      // Gửi email với QR code
      const customerEmail = booking.customerInfo?.email || booking.user?.email;
      if (customerEmail) {
        try {
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
              <h2 style="color: #D32F2F;">🎉 Chúc mừng bạn đã đặt vé thành công!</h2>
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

          console.log("✅ Email sent successfully to:", customerEmail);
        } catch (emailError) {
          console.error("❌ Error sending email:", emailError);
        }
      }

      console.log("✅ Booking updated and email sent:", booking._id);
    }

    res.json({ 
      error: 0,
      message: "Success",
      data: null
    });
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    res.json({
      error: -1,
      message: error.message || "Lỗi xử lý webhook",
      data: null
    });
  }
};