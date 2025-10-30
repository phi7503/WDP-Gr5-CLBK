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

    // ✅ Production API: https://api-merchant.payos.vn
    const PAYOS_API_BASE = process.env.PAYOS_API_BASE || 'https://api-merchant.payos.vn';

    const response = await axios.get(
      `${PAYOS_API_BASE}/v2/payment-requests/${orderCode}`,
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
      qrCode: data.qrCode, // ✅ Thêm QR code vào response
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
      expiredAt: Math.floor(Date.now() / 1000) + (15 * 60), // 15 phút từ bây giờ (Unix timestamp)
    };

    // Lưu orderCode vào booking để tra cứu sau này
    booking.transactionId = orderCode.toString();
    await booking.save();

    console.log("🔗 Creating PayOS payment link for booking:", bookingId);
    console.log("📋 Booking status BEFORE payment link:", {
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      transactionId: booking.transactionId
    }); // ✅ Debug
    
    const result = await payOS.paymentRequests.create(body);
    
    console.log("✅ Payment link created:", result.checkoutUrl);
    console.log("⚠️ IMPORTANT: Booking is still PENDING. Seats are RESERVED, not BOOKED yet.");
    console.log("⚠️ Seats will only be BOOKED after successful payment via webhook or checkAndUpdatePayment.");
    
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

// [POST] /api/payos/check-and-update/:bookingId
export const checkAndUpdatePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!payOS) {
      return res.status(500).json({
        message: "PayOS SDK chưa được khởi tạo"
      });
    }

    // Lấy booking từ database
    const booking = await Booking.findById(bookingId)
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
      return res.status(404).json({
        message: "Không tìm thấy booking"
      });
    }

    // Kiểm tra đã có transactionId chưa
    if (!booking.transactionId) {
      return res.status(400).json({
        message: "Booking chưa có transaction ID"
      });
    }

    // Kiểm tra đã thanh toán chưa
    if (booking.paymentStatus === "completed") {
      return res.json({
        success: true,
        message: "Booking đã được thanh toán",
        booking: booking
      });
    }

    // Gọi PayOS API để kiểm tra trạng thái thanh toán (dùng axios vì SDK không có method này)
    const orderCode = parseInt(booking.transactionId);
    
    console.log("🔍 Checking payment status from PayOS for orderCode:", orderCode);
    console.log("📋 Current booking status:", {
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
    }); // ✅ Debug
    
    // ✅ Sử dụng axios thay vì PayOS SDK vì SDK không có getPaymentLinkInformation
    // ✅ Production API: https://api-merchant.payos.vn
    const PAYOS_API_BASE = process.env.PAYOS_API_BASE || 'https://api-merchant.payos.vn';
    
    let paymentStatusResponse;
    try {
      // ✅ Thử kết nối với retry và dns lookup tốt hơn
      const response = await axios.get(
        `${PAYOS_API_BASE}/v2/payment-requests/${orderCode}`,
        {
          headers: {
            "x-client-id": process.env.PAYOS_CLIENT_ID,
            "x-api-key": process.env.PAYOS_API_KEY,
          },
          timeout: 15000, // Tăng timeout lên 15 giây
          // ✅ Cấu hình DNS lookup tốt hơn
          family: 4, // Force IPv4
          validateStatus: function (status) {
            return status >= 200 && status < 500; // Không throw error cho 4xx
          },
        }
      );
      
      // Kiểm tra response code
      if (response.status === 200 && response.data && response.data.data) {
        paymentStatusResponse = response.data.data;
        
        // ✅ Log QR code nếu có trong response
        if (paymentStatusResponse.qrCode) {
          console.log("✅ QR Code received from PayOS API");
        }
      } else {
        throw new Error(`PayOS API returned status ${response.status}: ${JSON.stringify(response.data)}`);
      }
    } catch (axiosError) {
      console.error("❌ Error calling PayOS API:", axiosError.message);
      console.error("❌ API URL:", `${PAYOS_API_BASE}/v2/payment-requests/${orderCode}`);
      console.error("❌ Error details:", {
        code: axiosError.code,
        hostname: axiosError.hostname,
        config: axiosError.config?.url,
        response: axiosError.response?.data,
      });
      
      // Nếu là lỗi network, có thể là DNS hoặc connection issue
      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
        console.warn("⚠️ Cannot connect to PayOS API. DNS/Network issue detected.");
        console.warn("⚠️ PayOS Production API:", PAYOS_API_BASE);
        console.warn("⚠️ Suggestions:");
        console.warn("   1. Check internet connection");
        console.warn("   2. Try changing DNS server (e.g., 8.8.8.8)");
        console.warn("   3. Check firewall settings");
        console.warn(`   4. Verify PayOS API is accessible: ${PAYOS_API_BASE}`);
        
        // ✅ Fallback: Vẫn trả về booking hiện tại nhưng có cảnh báo
        return res.json({
          success: false,
          message: "Không thể kết nối đến PayOS. Vui lòng thử lại sau.",
          error: "PayOS API không khả dụng. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau vài phút.",
          code: axiosError.code,
          booking: booking, // ✅ Vẫn trả về booking để frontend có thể hiển thị
          warning: "Không thể kiểm tra trạng thái thanh toán từ PayOS. Vui lòng kiểm tra lại sau hoặc liên hệ hỗ trợ.",
          canRetry: true // ✅ Flag để frontend biết có thể retry
        });
      }
      
      // Nếu là lỗi từ PayOS API (404, 400, etc)
      if (axiosError.response) {
        console.error("❌ PayOS API error response:", axiosError.response.data);
        return res.status(axiosError.response.status).json({
          success: false,
          message: "Lỗi từ PayOS API",
          error: axiosError.response.data?.desc || axiosError.message,
          code: axiosError.response.status
        });
      }
      
      throw axiosError; // Re-throw nếu là lỗi khác
    }
    
    console.log("📋 PayOS payment status response:", {
      status: paymentStatusResponse.status,
      amount: paymentStatusResponse.amount,
      qrCode: paymentStatusResponse.qrCode ? "Present" : "Not present", // ✅ Log QR code status
    }); // ✅ Debug

    // ✅ CHỈ cập nhật nếu status thực sự là "PAID" và booking chưa được thanh toán
    if (paymentStatusResponse.status === "PAID" && booking.paymentStatus !== "completed") {
      console.log("✅ Payment verified as PAID. Updating booking...");
      
      // Cập nhật booking status
      booking.paymentStatus = "completed";
      booking.bookingStatus = "confirmed";
      booking.paymentMethod = "payos";

      // ✅ Ưu tiên sử dụng QR code từ PayOS API nếu có
      if (paymentStatusResponse.qrCode && !booking.qrCode) {
        console.log("✅ Using QR code from PayOS API response");
        booking.qrCode = paymentStatusResponse.qrCode;
      } else if (!booking.qrCode) {
        // Tạo QR code tự động nếu PayOS không có
        console.log("📱 Generating QR code locally");
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
      }

      await booking.save();
      
      // ✅ Reload booking từ database để đảm bảo có đầy đủ thông tin mới nhất
      const updatedBooking = await Booking.findById(bookingId)
        .populate({
          path: "showtime",
          populate: [
            { path: "movie", select: "title" },
            { path: "theater", select: "name" },
            { path: "branch", select: "name location" }
          ]
        })
        .populate("user", "name email");

      // Cập nhật seat statuses thành "booked"
      const seatIds = updatedBooking.seats.map(s => s._id);
      console.log("🔒 Updating seats to BOOKED status:", seatIds); // ✅ Debug
      console.log("📋 Booking ID:", updatedBooking._id); // ✅ Debug
      
      // ✅ Sửa: Thêm điều kiện booking để chỉ update đúng ghế của booking này
      const updateResult = await SeatStatus.updateMany(
        { 
          showtime: updatedBooking.showtime._id, 
          seat: { $in: seatIds },
          booking: updatedBooking._id // ✅ Đảm bảo chỉ update ghế của booking này
        },
        {
          $set: {
            status: 'booked',
            bookedAt: new Date(),
            reservedBy: null,
            reservationExpires: null
          }
        }
      );

      console.log("✅ Seats updated to BOOKED status. Modified count:", updateResult.modifiedCount); // ✅ Debug

      // Broadcast socket event
      broadcastSeatUpdate(updatedBooking.showtime._id.toString(), {
        type: 'seats-booked',
        seatIds: seatIds,
        bookingId: updatedBooking._id,
      });

      // Gửi email với QR code nếu chưa gửi
      const customerEmail = updatedBooking.customerInfo?.email || updatedBooking.user?.email;
      if (customerEmail) {
        try {
          const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const qrData = `${baseUrl}/booking-details/${updatedBooking._id}`;
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
              <p><b>Phim:</b> ${updatedBooking.showtime.movie.title}</p>
              <p><b>Suất chiếu:</b> ${new Date(updatedBooking.showtime.startTime).toLocaleString('vi-VN')}</p>
              <p><b>Rạp:</b> ${updatedBooking.showtime.branch?.name || ""} - ${updatedBooking.showtime.theater?.name || ""}</p>
              <p><b>Ghế:</b> ${updatedBooking.seats.map(s => s.row + s.number).join(", ")}</p>
              <p><b>Tổng tiền:</b> ${updatedBooking.totalAmount.toLocaleString('vi-VN')} VND</p>
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

      console.log("✅ Payment verified and booking updated:", bookingId);
      
      // ✅ Trả về updatedBooking thay vì booking cũ
      return res.json({
        success: true,
        paymentStatus: paymentStatusResponse.status,
        booking: updatedBooking,
        message: "Thanh toán đã được xác nhận thành công"
      });
    } else {
      console.log("⚠️ Payment status is NOT PAID yet:", paymentStatusResponse.status);
      console.log("⚠️ Booking remains PENDING. Seats remain RESERVED.");
    }

    res.json({
      success: true,
      paymentStatus: paymentStatusResponse.status,
      booking: booking
    });
  } catch (error) {
    console.error("❌ Error checking payment status:", error);
    res.status(500).json({
      message: error.response?.data?.desc || "Lỗi kiểm tra trạng thái thanh toán",
      error: error.message
    });
  }
};

// [POST] /api/payos/update-from-redirect/:bookingId
// Cập nhật payment status từ PayOS redirect URL (khi không thể kết nối PayOS API)
export const updatePaymentFromRedirect = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, orderCode } = req.body;

    if (!status || status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: "Status không hợp lệ"
      });
    }

    // Lấy booking từ database
    const booking = await Booking.findById(bookingId)
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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking"
      });
    }

    // Kiểm tra orderCode có khớp không
    if (orderCode && booking.transactionId !== orderCode.toString()) {
      return res.status(400).json({
        success: false,
        message: "OrderCode không khớp với booking"
      });
    }

    // Chỉ cập nhật nếu chưa được thanh toán
    if (booking.paymentStatus === "completed") {
      return res.json({
        success: true,
        message: "Booking đã được thanh toán",
        booking: booking
      });
    }

    console.log("✅ Updating booking from PayOS redirect URL. Status: PAID");
    
    // Cập nhật booking status
    booking.paymentStatus = "completed";
    booking.bookingStatus = "confirmed";
    booking.paymentMethod = "payos";

    // Tạo QR code nếu chưa có
    if (!booking.qrCode) {
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
    }

    await booking.save();
    
    // Reload booking từ database
    const updatedBooking = await Booking.findById(bookingId)
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title" },
          { path: "theater", select: "name" },
          { path: "branch", select: "name location" }
        ]
      })
      .populate("user", "name email");

    // Cập nhật seat statuses thành "booked"
    const seatIds = updatedBooking.seats.map(s => s._id);
    console.log("🔒 Updating seats to BOOKED status:", seatIds);
    
    const updateResult = await SeatStatus.updateMany(
      { 
        showtime: updatedBooking.showtime._id, 
        seat: { $in: seatIds },
        booking: updatedBooking._id
      },
      {
        $set: {
          status: 'booked',
          bookedAt: new Date(),
          reservedBy: null,
          reservationExpires: null
        }
      }
    );

    console.log("✅ Seats updated to BOOKED status. Modified count:", updateResult.modifiedCount);

    // Broadcast socket event
    broadcastSeatUpdate(updatedBooking.showtime._id.toString(), {
      type: 'seats-booked',
      seatIds: seatIds,
      bookingId: updatedBooking._id,
    });

    // Gửi email với QR code
    const customerEmail = updatedBooking.customerInfo?.email || updatedBooking.user?.email;
    if (customerEmail) {
      try {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const qrData = `${baseUrl}/booking-details/${updatedBooking._id}`;
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
            <p><b>Phim:</b> ${updatedBooking.showtime.movie.title}</p>
            <p><b>Suất chiếu:</b> ${new Date(updatedBooking.showtime.startTime).toLocaleString('vi-VN')}</p>
            <p><b>Rạp:</b> ${updatedBooking.showtime.branch?.name || ""} - ${updatedBooking.showtime.theater?.name || ""}</p>
            <p><b>Ghế:</b> ${updatedBooking.seats.map(s => s.row + s.number).join(", ")}</p>
            <p><b>Tổng tiền:</b> ${updatedBooking.totalAmount.toLocaleString('vi-VN')} VND</p>
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

    console.log("✅ Payment updated from redirect URL:", bookingId);

    res.json({
      success: true,
      message: "Thanh toán đã được xác nhận từ PayOS redirect",
      booking: updatedBooking
    });
  } catch (error) {
    console.error("❌ Error updating payment from redirect:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật trạng thái thanh toán",
      error: error.message
    });
  }
};

// [POST] /api/payos/cancel-booking/:bookingId
// Xử lý khi user hủy thanh toán - release ghế và cập nhật booking status
export const handlePaymentCancel = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, orderCode } = req.body; // Nhận status từ PayOS redirect

    console.log("❌ Payment cancelled for booking:", bookingId, "Status:", status);

    // Lấy booking từ database
    const booking = await Booking.findById(bookingId)
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
      return res.status(404).json({
        message: "Không tìm thấy booking"
      });
    }

    // Chỉ xử lý nếu booking chưa được thanh toán
    if (booking.paymentStatus === "completed") {
      return res.json({
        success: true,
        message: "Booking đã được thanh toán, không thể hủy",
        booking: booking
      });
    }

    // Cập nhật booking status thành cancelled
    booking.paymentStatus = "cancelled";
    booking.bookingStatus = "cancelled";
    await booking.save();

    // Release ghế - chuyển từ reserved về available
    const seatIds = booking.seats.map(s => s._id);
    console.log("🔓 Releasing seats:", seatIds);

    await SeatStatus.updateMany(
      { showtime: booking.showtime._id, seat: { $in: seatIds } },
      {
        $set: {
          status: 'available',
          booking: null,
          reservedBy: null,
          reservedAt: null,
          reservationExpires: null,
          bookedAt: null
        }
      }
    );

    // Broadcast socket event để các client khác biết ghế đã được release
    broadcastSeatUpdate(booking.showtime._id.toString(), {
      type: 'seats-released',
      seatIds: seatIds,
      bookingId: booking._id,
    });

    console.log("✅ Seats released and booking cancelled:", bookingId);

    res.json({
      success: true,
      message: "Đã hủy booking và release ghế thành công",
      booking: booking
    });
  } catch (error) {
    console.error("❌ Error cancelling payment:", error);
    res.status(500).json({
      message: "Lỗi hủy booking",
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
    
    // ✅ Debug: Log tất cả các status có thể từ PayOS
    if (data.status !== "PAID") {
      console.log("⚠️ Payment webhook received but status is NOT PAID:", data.status);
      console.log("⚠️ Booking will remain PENDING. Seats remain RESERVED.");
    }

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
      console.log("✅ Webhook received: Payment SUCCESS for booking:", booking._id);
      console.log("📋 Booking status BEFORE update:", {
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
      }); // ✅ Debug
      
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
      console.log("🔒 Updating seats to BOOKED status:", seatIds); // ✅ Debug
      console.log("📋 Booking ID:", booking._id); // ✅ Debug
      
      // ✅ Sửa: Thêm điều kiện booking để chỉ update đúng ghế của booking này
      const updateResult = await SeatStatus.updateMany(
        { 
          showtime: booking.showtime._id, 
          seat: { $in: seatIds },
          booking: booking._id // ✅ Đảm bảo chỉ update ghế của booking này
        },
        { 
          $set: { 
            status: 'booked',
            bookedAt: new Date(),
            reservedBy: null,
            reservationExpires: null
          } 
        }
      );

      console.log("✅ Seats updated to BOOKED status. Modified count:", updateResult.modifiedCount); // ✅ Debug

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