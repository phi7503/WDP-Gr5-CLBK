import mongoose from "mongoose";

const seatStatusSchema = mongoose.Schema(
  {
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "reserved", "booked", "blocked", "maintenance"],
      default: "available",
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    reservedAt: {
      type: Date,
    },
    reservationExpires: {
      type: Date,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique seat status for each showtime
seatStatusSchema.index({ showtime: 1, seat: 1 }, { unique: true });

const SeatStatus = mongoose.model("SeatStatus", seatStatusSchema);

export default SeatStatus;
