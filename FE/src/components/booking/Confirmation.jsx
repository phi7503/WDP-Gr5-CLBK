import React from 'react';

const Confirmation = ({ bookingResult, selectedMovie, selectedShowtime, selectedSeats, finalTotal }) => {
  return (
    <div className="bg-gray-900 border border-red-600 rounded-lg p-6 min-h-[500px]">
      <div className="flex items-center mb-6">
        <div className="w-7 h-7 bg-green-600 rounded mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">
          Xác nhận đặt vé
        </h2>
      </div>
      
      <p className="text-gray-400 mb-6">
        Đặt vé thành công!
      </p>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Thông tin vé</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Mã vé:</span>
            <span className="text-white font-bold">{bookingResult?._id || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Phim:</span>
            <span className="text-white">{selectedMovie?.title || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Suất chiếu:</span>
            <span className="text-white">
              {selectedShowtime?.startTime ? new Date(selectedShowtime.startTime).toLocaleString('vi-VN') : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Ghế:</span>
            <span className="text-white">
              {selectedSeats.map(seat => seat.name || seat._id).join(', ') || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tổng tiền:</span>
            <span className="text-white font-bold">{finalTotal.toLocaleString()} VNĐ</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Đặt vé mới
        </button>
      </div>
    </div>
  );
};

export default Confirmation;