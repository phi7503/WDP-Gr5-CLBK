import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import SeatStatus from "../models/seatStatusModel.js";

// Store active connections by showtime
const activeConnections = new Map();

export const initializeSocketHandlers = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User ${socket.user.name} connected: ${socket.id}`);

    // Join showtime room
    socket.on("join-showtime", (showtimeId) => {
      socket.join(`showtime-${showtimeId}`);
      socket.currentShowtime = showtimeId;

      // Track active connections
      if (!activeConnections.has(showtimeId)) {
        activeConnections.set(showtimeId, new Set());
      }
      activeConnections.get(showtimeId).add(socket.id);

      console.log(`👥 User ${socket.user.name} joined showtime ${showtimeId}`);

      // Notify others about new user
      socket.to(`showtime-${showtimeId}`).emit("user-joined", {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date(),
      });
    });

    // Leave showtime room
    socket.on("leave-showtime", (showtimeId) => {
      socket.leave(`showtime-${showtimeId}`);

      if (activeConnections.has(showtimeId)) {
        activeConnections.get(showtimeId).delete(socket.id);
        if (activeConnections.get(showtimeId).size === 0) {
          activeConnections.delete(showtimeId);
        }
      }

      console.log(`👋 User ${socket.user.name} left showtime ${showtimeId}`);

      // Notify others about user leaving
      socket.to(`showtime-${showtimeId}`).emit("user-left", {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date(),
      });
    });

    // Handle seat selection (temporary hold)
    socket.on("select-seats", async (data) => {
      const { showtimeId, seatIds } = data;
      console.log(`📍 Người dùng ${socket.userId} đang chọn ghế:`, data);
      try {
        // Khóa từng ghế nguyên tử
        const updatedSeats = [];
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
                reservedBy: socket.userId,
                reservedAt: new Date(),
                reservationExpires: new Date(Date.now() + 30 * 1000),
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
                reservedBy: socket.userId,
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
            socket.emit("seat-selection-failed", {
              message: `Ghế ${seatId} không còn trống`,
            });
            return;
          }
          updatedSeats.push(updated);
        }

        // Thông báo việc chọn ghế
        socket.to(`showtime-${showtimeId}`).emit("seats-being-selected", {
          seatIds,
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date(),
        });

        socket.emit("seat-selection-success", {
          seatIds,
          expiresAt: new Date(Date.now() + 30 * 1000),
        });

        // Tự động giải phóng sau 30 giây
        setTimeout(async () => {
          try {
            const result = await SeatStatus.updateMany(
              {
                showtime: showtimeId,
                seat: { $in: seatIds },
                status: "selecting",
                reservedBy: socket.userId,
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
        }, 30000);
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
      console.log(`🔒 User ${socket.userId} reserving seats for payment:`, seatIds);

      try {
        // Update seats to reserved status with 10-minute timeout
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
              reservationExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            },
          }
        );

        if (result.modifiedCount === 0) {
          socket.emit("seat-reservation-failed", {
            message: "Seats are no longer available for reservation",
          });
          return;
        }

        // Broadcast reservation
        socket.to(`showtime-${showtimeId}`).emit("seats-reserved", {
          seatIds,
          userId: socket.userId,
          userName: socket.user.name,
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
        socket.to(`showtime-${showtimeId}`).emit("seats-reserved-for-payment", {
          seatIds,
          userId: socket.userId,
          userName: socket.user.name,
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
        io.to(`showtime-${showtimeId}`).emit("seats-booked", {
          seatIds,
          userId: socket.userId,
          userName: socket.user.name,
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
        await SeatStatus.updateMany(
          {
            showtime: showtimeId,
            seat: { $in: seatIds },
            reservedBy: socket.userId,
            status: { $in: ["selecting", "reserved"] },
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

        // Broadcast seat release
        io.to(`showtime-${showtimeId}`).emit("seats-released", {
          seatIds,
          userId: socket.userId,
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
      console.log(`🔌 User ${socket.user.name} disconnected: ${socket.id}`);

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
          socket
            .to(`showtime-${socket.currentShowtime}`)
            .emit("user-disconnected", {
              userId: socket.userId,
              userName: socket.user.name,
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
