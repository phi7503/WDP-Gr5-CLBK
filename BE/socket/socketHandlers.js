import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import SeatStatus from "../models/seatStatusModel.js";
import mongoose from "mongoose";

// Store active connections by showtime
const activeConnections = new Map();

// Store guest seat selections by socket.id (for tracking guest selections)
const guestSeatSelections = new Map(); // Map<socketId, Set<seatId>>

export const initializeSocketHandlers = (io) => {
  // Authentication middleware for socket (optional - allow guest users)
  io.use(async (socket, next) => {
    try {
      console.log('🔐 Socket authentication attempt:', socket.handshake.auth);
      const token = socket.handshake.auth?.token;
      
      // ✅ Cho phép kết nối không có token (guest users)
      if (!token) {
        console.log('👤 Guest user connecting (no token)');
        socket.userId = null;
        socket.user = null;
        return next(); // Cho phép kết nối
      }

      console.log('🔑 Token received:', token.substring(0, 50) + '...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_123456');
      console.log('✅ Token decoded:', decoded);
      
      const user = await User.findById(decoded.id || decoded.userId).select("-password");
      console.log('👤 User found:', user?.name);

      if (user) {
        socket.userId = user._id.toString();
        socket.user = user;
        console.log('✅ Socket authenticated for user:', user.name);
      } else {
        console.log('⚠️ User not found, allowing as guest');
        socket.userId = null;
        socket.user = null;
      }
      
      next();
    } catch (error) {
      // ✅ Nếu token không hợp lệ, vẫn cho phép kết nối như guest
      console.log('⚠️ Socket authentication failed, allowing as guest:', error.message);
      socket.userId = null;
      socket.user = null;
      next(); // Cho phép kết nối như guest
    }
  });

  io.on("connection", (socket) => {
    const userName = socket.user?.name || 'Guest';
    const userId = socket.userId || 'anonymous';
    console.log(`🔌 User ${userName} (${userId}) connected: ${socket.id}`);

    // Join showtime room
    socket.on("join-showtime", (showtimeId) => {
      const userName = socket.user?.name || 'Guest';
      console.log(`🚪 User ${userName} joining showtime room: showtime-${showtimeId}`);
      socket.join(`showtime-${showtimeId}`);
      socket.currentShowtime = showtimeId;

      // Track active connections
      if (!activeConnections.has(showtimeId)) {
        activeConnections.set(showtimeId, new Set());
      }
      activeConnections.get(showtimeId).add(socket.id);

      console.log(`👥 User ${userName} joined showtime ${showtimeId}`);

      // Notify others about new user
      socket.to(`showtime-${showtimeId}`).emit("user-joined", {
        userId: socket.userId || 'anonymous',
        userName: userName,
        isGuest: !socket.userId,
        userType: socket.userId ? 'user' : 'guest',
        timestamp: new Date(),
      });
    });

    // Leave showtime room
    socket.on("leave-showtime", (showtimeId) => {
      const userName = socket.user?.name || 'Guest';
      socket.leave(`showtime-${showtimeId}`);

      if (activeConnections.has(showtimeId)) {
        activeConnections.get(showtimeId).delete(socket.id);
        if (activeConnections.get(showtimeId).size === 0) {
          activeConnections.delete(showtimeId);
        }
      }

      console.log(`👋 User ${userName} left showtime ${showtimeId}`);

      // Notify others about user leaving
      socket.to(`showtime-${showtimeId}`).emit("user-left", {
        userId: socket.userId || 'anonymous',
        userName: userName,
        isGuest: !socket.userId,
        userType: socket.userId ? 'user' : 'guest',
        timestamp: new Date(),
      });
    });

    // Handle seat selection (temporary hold)
    socket.on("select-seats", async (data) => {

      console.log(`🎯 Received select-seats event from ${socket.userId || 'Guest'}:`, data);
      const { showtimeId, seatIds } = data;
      const userName = socket.user?.name || 'Guest';
      console.log(`📍 User ${socket.userId || 'anonymous'} (${userName}) selecting seats:`, data);
      try {
        // Khóa từng ghế nguyên tử
        const updatedSeats = [];
        // Convert socket.userId to ObjectId để lưu đúng format
        const userIdObj = socket.userId && mongoose.Types.ObjectId.isValid(socket.userId) 
          ? new mongoose.Types.ObjectId(socket.userId) 
          : socket.userId;
        
        // ✅ Track guest selections by socket.id
        if (!socket.userId) {
          if (!guestSeatSelections.has(socket.id)) {
            guestSeatSelections.set(socket.id, new Set());
          }
        }
        
        for (const seatId of seatIds) {
          const updated = await SeatStatus.findOneAndUpdate(
            {
              showtime: showtimeId,
              seat: seatId,
              status: "available",
            },
            {
              $set: {
                status: "selecting",
                reservedBy: userIdObj,
                reservedAt: new Date(),
                reservationExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
              },
            },
            { new: true }
          );
          if (!updated) {
            // Hoàn tác các ghế đã khóa
            await SeatStatus.updateMany(
              {
                showtime: showtimeId,
                seat: { $in: updatedSeats.map((s) => s.seat) },
                reservedBy: userIdObj,
              },
              {
                $set: {
                  status: "available",
                  reservedBy: null,
                  reservedAt: null,
                  reservationExpires: null,
                },
              }
            );
            // ✅ Clean up guest selections
            if (!socket.userId && guestSeatSelections.has(socket.id)) {
              seatIds.forEach(id => guestSeatSelections.get(socket.id).delete(id));
            }
            socket.emit("seat-selection-failed", {
              message: `Ghế ${seatId} không còn trống`,
            });
            return;
          }
          updatedSeats.push(updated);
          
          // ✅ Track guest seat selection - lưu cả string và ObjectId để dễ so sánh
          if (!socket.userId) {
            // Lưu dưới dạng string để dễ so sánh
            const seatIdStr = seatId.toString();
            guestSeatSelections.get(socket.id).add(seatIdStr);
            console.log('✅ Tracked guest seat selection:', {
              socketId: socket.id,
              seatId: seatIdStr,
              allSelections: Array.from(guestSeatSelections.get(socket.id))
            });
          }
        }
        // Thông báo việc chọn ghế
        console.log(`📢 Broadcasting seat selection to showtime-${showtimeId}`);
        socket.to(`showtime-${showtimeId}`).emit("seats-being-selected", {
          seatIds,
          userId: socket.userId || 'anonymous',
          userName: userName,
          timestamp: new Date(),
        });
        console.log(`✅ Sending success to user ${socket.userId}`);
        socket.emit("seat-selection-success", {
          seatIds,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        });
        setTimeout(async () => {
          try {
            const result = await SeatStatus.updateMany(
              {
                showtime: showtimeId,
                seat: { $in: seatIds },
                status: "selecting",
                reservedBy: userIdObj,
              },
              {
                $set: {
                  status: "available",
                  reservedBy: null,
                  reservedAt: null,
                  reservationExpires: null,
                },
              }
            );
            if (result.modifiedCount > 0) {
              io.to(`showtime-${showtimeId}`).emit("seats-released", {
                seatIds,
                userId: socket.userId,
                reason: "selection-timeout",
                timestamp: new Date(),
              });
            }
          } catch (error) {
            console.error("Lỗi khi tự động giải phóng ghế:", error);
          }
        }, 15 * 60 * 1000); // 15 minutes
      } catch (error) {
        console.error("Lỗi khi chọn ghế:", error);
        socket.emit("seat-selection-failed", {
          message: "Không thể chọn ghế",
        });
      }
    });


    // Handle seat reservation (10-minute hold for payment)
    socket.on("reserve-seats", async (data) => {
      const { showtimeId, seatIds } = data;
      console.log(`🔒 User ${socket.userId || 'Guest'} reserving seats for payment:`, seatIds);

      try {
        // ✅ Convert seatIds to ObjectId for proper query
        const seatIdsObj = seatIds.map(id => 
          mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
        );
        
        // Update seats to reserved status with 15-minute timeout
        // Cho phép reserve từ "available" hoặc "selecting" (nếu đã được user này select)
        const seatQuery = {
          showtime: showtimeId,
          seat: { $in: seatIdsObj },
        };
        
        if (socket.userId) {
          // User đã đăng nhập: có thể reserve từ available, selecting (nếu đã select), hoặc reserved (nếu đã reserve)
          // Convert socket.userId to ObjectId để so sánh đúng
          const userIdObj = mongoose.Types.ObjectId.isValid(socket.userId) 
            ? new mongoose.Types.ObjectId(socket.userId) 
            : socket.userId;
          
          seatQuery.$or = [
            { status: "available" },
            { 
              status: "selecting", 
              reservedBy: userIdObj 
            },
            { 
              status: "reserved", 
              reservedBy: userIdObj,
              reservationExpires: { $gt: new Date() } // Chỉ cho phép nếu chưa hết hạn
            }
          ];
        } else {
          // ✅ Guest: có thể reserve từ available hoặc selecting (nếu đã được guest này select)
          // Kiểm tra xem ghế có được select bởi socket này không
          const guestSelectedSeats = guestSeatSelections.get(socket.id) || new Set();
          console.log('👤 Guest selections:', {
            socketId: socket.id,
            guestSelectedSeats: Array.from(guestSelectedSeats),
            requestedSeats: seatIds.map(id => id.toString())
          });
          
          const selectedSeatIds = seatIds.map(id => id.toString()).filter(id => guestSelectedSeats.has(id));
          
          if (selectedSeatIds.length > 0) {
            // Guest đã select một số ghế: có thể reserve từ selecting với reservedBy = null
            // ✅ Convert selectedSeatIds to ObjectId
            const selectedSeatIdsObj = selectedSeatIds.map(id => 
              mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
            );
            
            seatQuery.$or = [
              { status: "available" },
              { 
                status: "selecting", 
                reservedBy: null,
                seat: { $in: selectedSeatIdsObj }
              }
            ];
            
            console.log('✅ Guest reserve query (with selected seats):', JSON.stringify(seatQuery, null, 2));
          } else {
            // Guest chưa select: chỉ có thể reserve từ available
            seatQuery.status = "available";
            console.log('⚠️ Guest reserve query (no selected seats, only available):', JSON.stringify(seatQuery, null, 2));
          }
        }
        
        // ✅ Check current seat statuses before update
        const currentSeats = await SeatStatus.find({
          showtime: showtimeId,
          seat: { $in: seatIdsObj }
        });
        
        console.log('📊 Current seat statuses:', currentSeats.map(s => ({
          seatId: s.seat?.toString(),
          status: s.status,
          reservedBy: s.reservedBy?.toString() || 'null',
          reservationExpires: s.reservationExpires
        })));
        
        // ✅ Kiểm tra xem có ghế nào đã được reserve bởi user này chưa
        const userIdObj = socket.userId ? (mongoose.Types.ObjectId.isValid(socket.userId) ? new mongoose.Types.ObjectId(socket.userId) : socket.userId) : null;
        const now = new Date();
        const alreadyReservedSeats = currentSeats.filter(s => {
          if (socket.userId) {
            return s.status === "reserved" && 
                   s.reservedBy && 
                   s.reservedBy.toString() === userIdObj.toString() &&
                   s.reservationExpires && 
                   new Date(s.reservationExpires) > now;
          } else {
            return s.status === "reserved" && 
                   s.reservedBy === null &&
                   s.reservationExpires && 
                   new Date(s.reservationExpires) > now;
          }
        });
        
        console.log('✅ Already reserved seats:', alreadyReservedSeats.map(s => s.seat?.toString()));
        
        // ✅ Chỉ update những ghế chưa được reserve
        const seatsToUpdate = seatIdsObj.filter(seatId => {
          const seat = currentSeats.find(s => s.seat.toString() === seatId.toString());
          if (!seat) return true; // Nếu không tìm thấy, cần update
          
          // Nếu đã được reserve bởi user này và chưa hết hạn, không cần update
          if (socket.userId && seat.status === "reserved" && 
              seat.reservedBy && seat.reservedBy.toString() === userIdObj.toString() &&
              seat.reservationExpires && new Date(seat.reservationExpires) > now) {
            return false;
          }
          
          if (!socket.userId && seat.status === "reserved" && 
              seat.reservedBy === null &&
              seat.reservationExpires && new Date(seat.reservationExpires) > now) {
            return false;
          }
          
          return true;
        });
        
        let result = { matchedCount: 0, modifiedCount: alreadyReservedSeats.length };
        
        // ✅ Chỉ update những ghế cần update
        if (seatsToUpdate.length > 0) {
          const updateQuery = {
            ...seatQuery,
            seat: { $in: seatsToUpdate }
          };
          
          console.log('🔒 Updating seats to reserved:', {
            seatsToUpdate: seatsToUpdate.length,
            userIdObj: userIdObj,
            isGuest: !socket.userId,
            updateQuery: JSON.stringify(updateQuery, null, 2)
          });
          
          result = await SeatStatus.updateMany(
            updateQuery,
            {
              $set: {
                status: "reserved",
                reservedAt: new Date(),
                reservedBy: userIdObj, // null cho guest, userId cho user
                reservationExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
              },
            }
          );
          
          // ✅ Verify sau khi update
          const updatedSeats = await SeatStatus.find({
            showtime: showtimeId,
            seat: { $in: seatsToUpdate }
          });
          
          console.log('✅ After update - seat statuses:', updatedSeats.map(s => ({
            seatId: s.seat?.toString(),
            status: s.status,
            reservedBy: s.reservedBy,
            reservedByType: typeof s.reservedBy,
            reservedByIsNull: s.reservedBy === null,
            reservationExpires: s.reservationExpires
          })));
          
          result.modifiedCount += alreadyReservedSeats.length; // Cộng thêm những ghế đã reserve
        }

        console.log('📝 Update result:', {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          requestedSeats: seatIds.length,
          alreadyReserved: alreadyReservedSeats.length,
          seatsToUpdate: seatsToUpdate.length
        });

        // ✅ Nếu tất cả ghế đã được reserve bởi user này, vẫn coi như thành công (chỉ cần update lại thời gian hết hạn)
        // Chỉ update lại thời gian hết hạn nếu không có ghế nào được update (tất cả đã reserve)
        if (alreadyReservedSeats.length > 0 && seatsToUpdate.length === 0) {
          // Update lại thời gian hết hạn cho những ghế đã reserve
          const alreadyReservedSeatIds = alreadyReservedSeats.map(s => s.seat);
          await SeatStatus.updateMany(
            {
              showtime: showtimeId,
              seat: { $in: alreadyReservedSeatIds },
              status: "reserved"
            },
            {
              $set: {
                reservationExpires: new Date(Date.now() + 15 * 60 * 1000), // Gia hạn thêm 15 phút
              },
            }
          );
          console.log('✅ Extended reservation time for already reserved seats');
        } else if (alreadyReservedSeats.length > 0 && seatsToUpdate.length > 0) {
          // Một số ghế đã reserve, một số chưa - chỉ cần update lại thời gian cho những ghế đã reserve
          const alreadyReservedSeatIds = alreadyReservedSeats.map(s => s.seat);
          await SeatStatus.updateMany(
            {
              showtime: showtimeId,
              seat: { $in: alreadyReservedSeatIds },
              status: "reserved"
            },
            {
              $set: {
                reservationExpires: new Date(Date.now() + 15 * 60 * 1000), // Gia hạn thêm 15 phút
              },
            }
          );
          console.log('✅ Extended reservation time for already reserved seats (partial)');
        }
        
        // ✅ Chỉ fail nếu không có ghế nào được reserve và không có ghế nào được update
        if (result.modifiedCount === 0 && alreadyReservedSeats.length === 0) {
          console.log('❌ Reservation failed - no seats updated. Query:', JSON.stringify(seatQuery, null, 2));
          socket.emit("seat-reservation-failed", {
            message: "Seats are no longer available for reservation",
          });
          return;
        }

        // ✅ Clean up guest selections after successful reservation
        if (!socket.userId && guestSeatSelections.has(socket.id)) {
          seatIds.forEach(id => guestSeatSelections.get(socket.id).delete(id.toString()));
          if (guestSeatSelections.get(socket.id).size === 0) {
            guestSeatSelections.delete(socket.id);
          }
        }

        // Broadcast reservation
        const userName = socket.user?.name || 'Guest';
        socket.to(`showtime-${showtimeId}`).emit("seats-reserved", {
          seatIds,
          userId: socket.userId || 'anonymous',
          userName: userName,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          timestamp: new Date(),
        });

        socket.emit("seat-reservation-success", {
          seatIds,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        // Auto-release after 15 minutes if payment not completed
        setTimeout(async () => {
          try {
            const expiredResult = await SeatStatus.updateMany(
              {
                showtime: showtimeId,
                seat: { $in: seatIds },
                status: "reserved",
                reservedBy: socket.userId,
                reservationExpires: { $lte: new Date() },
              },
              {
                $set: {
                  status: "available",
                  reservedBy: null,
                  reservedAt: null,
                  reservationExpires: null,
                },
              }
            );

            if (expiredResult.modifiedCount > 0) {
              io.to(`showtime-${showtimeId}`).emit("seats-released", {
                seatIds,
                userId: socket.userId,
                reason: "reservation-timeout",
                timestamp: new Date(),
              });
            }
          } catch (error) {
            console.error("Error handling reservation expiry:", error);
          }
        }, 15 * 60 * 1000);
      } catch (error) {
        console.error("Error reserving seats:", error);
        socket.emit("seat-reservation-failed", {
          message: "Failed to reserve seats",
        });
      }
    });

    // Handle payment initiation (7-minute reservation)
    socket.on("initiate-payment", async (data) => {
      const { showtimeId, seatIds } = data;

      try {
        // Update seats to reserved status with 7-minute timeout
        const result = await SeatStatus.updateMany(
          {
            showtime: showtimeId,
            seat: { $in: seatIds },
            status: "selecting",
            reservedBy: socket.userId,
          },
          {
            $set: {
              status: "reserved",
              reservedAt: new Date(),
              reservationExpires: new Date(Date.now() + 7 * 60 * 1000), // 7 minutes

            },
          }
        );

        if (result.modifiedCount === 0) {
          socket.emit("payment-initiation-failed", {
            message: "Seats are no longer available for payment",
          });
          return;
        }

        // Broadcast payment initiation
        const userName = socket.user?.name || 'Guest';
        socket.to(`showtime-${showtimeId}`).emit("seats-reserved-for-payment", {
          seatIds,
          userId: socket.userId || 'anonymous',
          userName: userName,
          expiresAt: new Date(Date.now() + 7 * 60 * 1000),
          timestamp: new Date(),
        });

        socket.emit("payment-initiated", {
          seatIds,
          expiresAt: new Date(Date.now() + 7 * 60 * 1000),
          reservationId: `res_${socket.userId}_${Date.now()}`,
        });

        // Auto-release after 7 minutes if payment not completed
        setTimeout(async () => {
          try {
            const expiredResult = await SeatStatus.updateMany(
              {
                showtime: showtimeId,
                seat: { $in: seatIds },
                status: "reserved",
                reservedBy: socket.userId,
                reservationExpires: { $lte: new Date() },
              },
              {
                $set: {
                  status: "available",
                  reservedBy: null,
                  reservedAt: null,
                  reservationExpires: null,
                },
              }
            );

            if (expiredResult.modifiedCount > 0) {
              // Broadcast reservation expiry
              io.to(`showtime-${showtimeId}`).emit("reservation-expired", {
                seatIds,
                userId: socket.userId,
                timestamp: new Date(),
              });
            }
          } catch (error) {
            console.error("Error handling reservation expiry:", error);
          }
        }, 7 * 60 * 1000);
      } catch (error) {
        console.error("Error initiating payment:", error);
        socket.emit("payment-initiation-failed", {
          message: "Failed to initiate payment",
        });
      }
    });

    // Handle payment completion
    socket.on("complete-payment", async (data) => {
      const { showtimeId, seatIds, paymentData } = data;

      try {
        // Update seats to booked status
        const result = await SeatStatus.updateMany(
          {
            showtime: showtimeId,
            seat: { $in: seatIds },
            status: "reserved",
            reservedBy: socket.userId,
          },
          {
            $set: {
              status: "booked",
              bookedAt: new Date(),
              booking: paymentData.bookingId,
              reservationExpires: null,
            },
          }
        );

        if (result.modifiedCount === 0) {
          socket.emit("payment-failed", {
            message: "Reservation expired or seats no longer available",
          });
          return;
        }

        // Broadcast successful booking
        const userName = socket.user?.name || 'Guest';
        io.to(`showtime-${showtimeId}`).emit("seats-booked", {
          seatIds,
          userId: socket.userId || 'anonymous',
          userName: userName,
          bookingId: paymentData.bookingId,
          timestamp: new Date(),
        });

        socket.emit("payment-completed", {
          seatIds,
          bookingId: paymentData.bookingId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error completing payment:", error);
        socket.emit("payment-failed", {
          message: "Failed to complete payment",
        });
      }
    });

    // Handle manual seat release
    socket.on("release-seats", async (data) => {
      const { showtimeId, seatIds } = data;

      try {
        // ✅ Build query based on user type
        const releaseQuery = {
          showtime: showtimeId,
          seat: { $in: seatIds },
          status: { $in: ["selecting", "reserved"] },
        };
        
        if (socket.userId) {
          // User đã đăng nhập: chỉ release ghế của mình
          const userIdObj = mongoose.Types.ObjectId.isValid(socket.userId) 
            ? new mongoose.Types.ObjectId(socket.userId) 
            : socket.userId;
          releaseQuery.reservedBy = userIdObj;
        } else {
          // ✅ Guest: chỉ release ghế đã được select bởi socket này
          const guestSelectedSeats = guestSeatSelections.get(socket.id) || new Set();
          const selectedSeatIds = seatIds.map(id => id.toString()).filter(id => guestSelectedSeats.has(id));
          
          if (selectedSeatIds.length === 0) {
            // Guest không có quyền release ghế này
            socket.emit("seat-release-failed", {
              message: "You can only release seats you have selected",
            });
            return;
          }
          
          releaseQuery.seat = { $in: selectedSeatIds.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id) };
          releaseQuery.reservedBy = null; // Guest seats have reservedBy = null
        }
        
        await SeatStatus.updateMany(
          releaseQuery,
          {
            $set: {
              status: "available",
              reservedBy: null,
              reservedAt: null,
              reservationExpires: null,
            },
          }
        );

        // ✅ Clean up guest selections
        if (!socket.userId && guestSeatSelections.has(socket.id)) {
          seatIds.forEach(id => guestSeatSelections.get(socket.id).delete(id.toString()));
          if (guestSeatSelections.get(socket.id).size === 0) {
            guestSeatSelections.delete(socket.id);
          }
        }

        // Broadcast seat release
        io.to(`showtime-${showtimeId}`).emit("seats-released", {
          seatIds,
          userId: socket.userId || 'anonymous',
          reason: "manual-release",
          timestamp: new Date(),
        });

        socket.emit("seats-released-success", { seatIds });
      } catch (error) {
        console.error("Error releasing seats:", error);
        socket.emit("seat-release-failed", {
          message: "Failed to release seats",
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      const userName = socket.user?.name || 'Guest';
      console.log(`🔌 User ${userName} disconnected: ${socket.id}`);

      // ✅ Clean up guest selections on disconnect
      if (!socket.userId && guestSeatSelections.has(socket.id)) {
        const selectedSeats = Array.from(guestSeatSelections.get(socket.id));
        if (socket.currentShowtime && selectedSeats.length > 0) {
          try {
            await SeatStatus.updateMany(
              {
                showtime: socket.currentShowtime,
                seat: { $in: selectedSeats.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id) },
                status: "selecting",
                reservedBy: null,
              },
              {
                $set: {
                  status: "available",
                  reservedBy: null,
                  reservedAt: null,
                  reservationExpires: null,
                },
              }
            );
          } catch (error) {
            console.error("Error releasing guest seats on disconnect:", error);
          }
        }
        guestSeatSelections.delete(socket.id);
      }

      if (socket.currentShowtime) {
        // Release any selecting seats
        try {
          await SeatStatus.updateMany(
            {
              showtime: socket.currentShowtime,
              reservedBy: socket.userId,
              status: "selecting",
            },
            {
              $set: {
                status: "available",
                reservedBy: null,
                reservedAt: null,
                reservationExpires: null,
              },
            }
          );

          // Clean up active connections
          if (activeConnections.has(socket.currentShowtime)) {
            activeConnections.get(socket.currentShowtime).delete(socket.id);
            if (activeConnections.get(socket.currentShowtime).size === 0) {
              activeConnections.delete(socket.currentShowtime);
            }
          }

          // Notify others
          const userName = socket.user?.name || 'Guest';
          socket
            .to(`showtime-${socket.currentShowtime}`)
            .emit("user-disconnected", {
              userId: socket.userId || 'anonymous',
              userName: userName,
              timestamp: new Date(),
            });
        } catch (error) {
          console.error("Error cleaning up on disconnect:", error);
        }
      }
    });
  });
};

// Export function to broadcast seat updates
export const broadcastSeatUpdate = (showtimeId, updateData) => {
  if (global.io) {
    global.io
      .to(`showtime-${showtimeId}`)
      .emit("seat-status-updated", updateData);
  }
};
