// Socket handlers for real-time updates
export const broadcastSeatUpdate = (showtimeId, data) => {
  if (global.io) {
    global.io.to(showtimeId).emit('seat-update', data);
  }
};

export const broadcastBookingUpdate = (bookingId, data) => {
  if (global.io) {
    global.io.emit('booking-update', { bookingId, ...data });
  }
};