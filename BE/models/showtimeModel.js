import mongoose from "mongoose";

const showtimeSchema = mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
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
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    price: {
      standard: {
        type: Number,
        required: true,
      },
      vip: {
        type: Number,
        default: 0,
      },
      couple: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    isLastShow: {
      type: Boolean,
      default: false,
    },
    isFirstShow: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Showtime = mongoose.model("Showtime", showtimeSchema);

export default Showtime;
