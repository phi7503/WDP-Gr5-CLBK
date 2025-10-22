import React from 'react';

const Payment = ({ 
  paymentMethod, 
  setPaymentMethod, 
  selectedSeats, 
  selectedCombos, 
  voucher, 
  seatTotal, 
  comboTotal, 
  discountAmount, 
  finalTotal 
}) => {
  return (
    <div className="bg-gray-900 border border-red-600 rounded-lg p-6 min-h-[500px]">
      <div className="flex items-center mb-6">
        <div className="w-7 h-7 bg-red-600 rounded mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">
          Thanh toán
        </h2>
      </div>
      
      <p className="text-gray-400 mb-6">
        Chọn phương thức thanh toán
      </p>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <input
            type="radio"
            id="cash"
            name="payment"
            value="cash"
            checked={paymentMethod === 'cash'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="text-red-600"
          />
          <label htmlFor="cash" className="text-white">Tiền mặt</label>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="radio"
            id="qr"
            name="payment"
            value="qr"
            checked={paymentMethod === 'qr'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="text-red-600"
          />
          <label htmlFor="qr" className="text-white">Chuyển khoản QR</label>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-4">Tổng thanh toán</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-300">
            <span>Ghế ngồi:</span>
            <span>{seatTotal.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Combo:</span>
            <span>{comboTotal.toLocaleString()} VNĐ</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Giảm giá:</span>
              <span>-{discountAmount.toLocaleString()} VNĐ</span>
            </div>
          )}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between text-white font-bold text-lg">
              <span>Tổng cộng:</span>
              <span>{finalTotal.toLocaleString()} VNĐ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;