import React from 'react';

const ComboVoucher = ({ selectedCombos, setSelectedCombos, voucher, setVoucher, setError }) => {
  return (
    <div className="bg-gray-900 border border-red-600 rounded-lg p-6 min-h-[500px]">
      <div className="flex items-center mb-6">
        <div className="w-7 h-7 bg-red-600 rounded mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">
          Combo & Voucher
        </h2>
      </div>
      
      <p className="text-gray-400 mb-6">
        Chọn combo và voucher (nếu có)
      </p>

      <div className="text-center text-gray-400">
        <p>Component ComboVoucher đang được phát triển...</p>
      </div>
    </div>
  );
};

export default ComboVoucher;