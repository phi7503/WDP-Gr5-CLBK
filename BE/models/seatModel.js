import mongoose from "mongoose";

const seatSchema = mongoose.Schema(
  {
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    row: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["standard", "vip", "couple"],
      default: "standard",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    position: {
      x: {
        type: Number,
        required: true,
      },
      y: {
        type: Number,
        required: true,
      },
    },
    adjacentSeats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seat",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique seats within a theater
seatSchema.index({ theater: 1, row: 1, number: 1 }, { unique: true });

const Seat = mongoose.model("Seat", seatSchema);

export default Seat;