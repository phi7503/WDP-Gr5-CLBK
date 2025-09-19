import mongoose from "mongoose";

const seatLayoutSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
    },
    rows: {
      type: Number,
      required: true,
    },
    seatsPerRow: {
      type: Number,
      required: true,
    },
    rowLabels: [String],
    vipRows: [String],
    coupleSeats: [
      {
        row: String,
        startSeat: Number,
        endSeat: Number,
      },
    ],
    aisleAfterColumns: [Number],
    disabledSeats: [
      {
        row: String,
        number: Number,
      },
    ],
    screenPosition: {
      x: {
        type: Number,
        default: 0,
      },
      y: {
        type: Number,
        default: 0,
      },
      width: {
        type: Number,
        default: 100,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const SeatLayout = mongoose.model("SeatLayout", seatLayoutSchema);

export default SeatLayout;
