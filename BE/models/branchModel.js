// src/models/branch.model.js
import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String },
  },
  theaters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
    },
  ],
  operatingHours: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "23:00" },
  },
  facilities: [String],
  image: { type: String },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;