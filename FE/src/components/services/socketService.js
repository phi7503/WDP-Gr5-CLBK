import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    // Chỉ kết nối nếu chưa có socket nào hoặc socket đã bị ngắt kết nối.
    // Không ngắt một kết nối đang hoạt động.
    if (this.socket && this.socket.connected) {
      console.log("🔌 Already connected to WebSocket server.");
      return; // Dừng lại, không làm gì cả
    }

    if (this.socket) {
      this.disconnect();
    }

    this.socket = io("http://localhost:5000", {
      auth: {
        token: token,
      },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("🔌 Connected to WebSocket server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("🔌 Disconnected from WebSocket server");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔌 WebSocket connection error:", error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinShowtime(showtimeId) {
    if (this.socket) {
      this.socket.emit("join-showtime", showtimeId);
    }
  }

  leaveShowtime(showtimeId) {
    if (this.socket) {
      this.socket.emit("leave-showtime", showtimeId);
    }
  }

  selectSeats(showtimeId, seatIds) {
    if (this.socket) {
      this.socket.emit("select-seats", { showtimeId, seatIds });
    }
  }

  initiatePayment(showtimeId, seatIds) {
    if (this.socket) {
      this.socket.emit("initiate-payment", { showtimeId, seatIds });
    }
  }

  completePayment(showtimeId, seatIds, paymentData) {
    if (this.socket) {
      this.socket.emit("complete-payment", {
        showtimeId,
        seatIds,
        paymentData,
      });
    }
  }

  releaseSeats(showtimeId, seatIds) {
    if (this.socket) {
      this.socket.emit("release-seats", { showtimeId, seatIds });
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();