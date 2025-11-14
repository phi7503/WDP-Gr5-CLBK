import express from "express";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import startCleanupJob from "./jobs/cleanupExpiredReservations.js";
import { initializeSocketHandlers } from "./socket/socketHandlers.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import { scheduleCleanupOldShowtimes } from "./jobs/cleanupOldShowtimes.js";
import payosRoutes from "./routes/payOSRoutes.js";

// Load env
dotenv.config();

// Connect DB
connectDB();

// Import routes
import showtimeRoutes from "./routes/showtimeRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/auth.route.js";
import seatRoutes from "./routes/seatRoutes.js";
import seatStatusRoutes from "./routes/seatStatusRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import userRoutes from "./routes/user.route.js";
import theaterRoutes from "./routes/theaterRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import comboRoutes from "./routes/comboRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import userManaRoutes from "./routes/userRoutes.js";

//import debugRoutes from "./routes/debugRoutes.js";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Cấu hình Helmet để cho phép static files
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": [
          "'self'",
          "data:",
          "https://via.placeholder.com",
          "http://localhost:5000",
        ],
      },
    },
  })
);

app.use(morgan("dev"));

app.use("/api", userRoutes);
app.use("/api", dashboardRoutes);

// API Routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/seat-status", seatStatusRoutes);
app.use("/api/admin/users", userManaRoutes);
app.use("/api/theaters", theaterRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/combos", comboRoutes);

app.use("/api/chat", chatRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/payos", payosRoutes);

//app.use("/api/debug", debugRoutes);

// Make io available globally
global.io = io;
// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// ✅ Start cleanup job
startCleanupJob();

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// ✅ Start cleanup jobs
startCleanupJob(); // Cleanup expired seat reservations
scheduleCleanupOldShowtimes(); // Cleanup old showtimes (runs daily at 2 AM)

// Start server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
server.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});
