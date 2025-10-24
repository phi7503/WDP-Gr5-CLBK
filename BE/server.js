import express from "express";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { initializeSocketHandlers } from "./socket/socketHandlers.js";

// Load env
dotenv.config();

// Connect DB
connectDB();

const app = express();
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Import routes
import movieRoutes from "./routes/movieRoutes.js";
import showtimeRoutes from "./routes/showtimeRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import comboRoutes from "./routes/comboRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import theaterRoutes from "./routes/theaterRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import seatStatusRoutes from "./routes/seatStatusRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/combos", comboRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/theaters", theaterRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/seat-status", seatStatusRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminDashboardRoutes);

// Make io available globally
global.io = io;

// Initialize socket handlers
initializeSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
