import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    seatLayout: {
        rows: { type: Number, required: true },
        seatsPerRow: { type: Number, required: true },
        vipRows: [Number],
        coupleSeats: [
            {
                row: Number,
                startSeat: Number,
                endSeat: Number,
            },
        ],
    },
}, {
    timestamps: true,
});

const Theater = mongoose.model("Theater", theaterSchema);

export default Theater;
