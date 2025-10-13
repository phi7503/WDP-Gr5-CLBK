import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    seatLayout: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SeatLayout",
        default: null,
    },
}, {
    timestamps: true,
});

const Theater = mongoose.model("Theater", theaterSchema);

export default Theater;