import React from 'react';

const OrderSummary = ({ 
  selectedMovie, 
  selectedShowtime, 
  selectedSeats, 
  selectedCombos, 
  voucher, 
  seatTotal, 
  comboTotal, 
  discountAmount, 
  finalTotal 
}) => {
  return (
    <div className="bg-gray-900 border border-red-600 rounded-lg p-6 sticky top-4">
      <h3 className="text-lg font-bold text-white mb-4">Tóm tắt đơn hàng</h3>
      
      {selectedMovie && (
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">Phim</h4>
          <div className="flex items-center">
            <div
              className="w-12 h-16 bg-cover bg-center rounded mr-3"
              style={{
                backgroundImage: `url(${selectedMovie.poster?.startsWith('http') ? selectedMovie.poster : `http://localhost:5000/${selectedMovie.poster?.replace(/^\/+/, '')}`})`
              }}
            />
            <div>
              <p className="text-white text-sm font-medium">{selectedMovie.title}</p>
              <p className="text-gray-400 text-xs">Phim đã chọn</p>
            </div>
          </div>
        </div>
      )}

      {selectedShowtime && (
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">Suất chiếu</h4>
          <p className="text-gray-300 text-sm">
            {new Date(selectedShowtime.startTime).toLocaleString('vi-VN')}
          </p>
          <p className="text-gray-400 text-xs">
            {selectedShowtime.branch?.name} - {selectedShowtime.theater?.name}
          </p>
        </div>
      )}

      {selectedSeats.length > 0 && (
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">Ghế ngồi</h4>
          <div className="space-y-1">
            {selectedSeats.map((seat, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-300">{seat.name || `Ghế ${index + 1}`}</span>
                <span className="text-white">{(seat.price || 0).toLocaleString()} VNĐ</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCombos.length > 0 && (
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">Combo</h4>
          <div className="space-y-1">
            {selectedCombos.map((combo, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-300">{combo.name} x {combo.quantity}</span>
                <span className="text-white">{(combo.price * combo.quantity).toLocaleString()} VNĐ</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {voucher && (
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">Voucher</h4>
          <p className="text-gray-300 text-sm">{voucher.name}</p>
        </div>
      )}

      <div className="border-t border-gray-700 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Ghế ngồi:</span>
            <span className="text-white">{seatTotal.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Combo:</span>
            <span className="text-white">{comboTotal.toLocaleString()} VNĐ</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Giảm giá:</span>
              <span className="text-green-400">-{discountAmount.toLocaleString()} VNĐ</span>
            </div>
          )}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between">
              <span className="text-white font-bold">Tổng cộng:</span>
              <span className="text-white font-bold text-lg">{finalTotal.toLocaleString()} VNĐ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;