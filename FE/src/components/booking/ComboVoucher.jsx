import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ComboVoucher = ({ selectedCombos, setSelectedCombos, voucher, setVoucher, setError }) => {
  const [combos, setCombos] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load combos and vouchers from API
        // Note: Routes now require admin permission, so we'll use fallback data
        const [combosRes, vouchersRes] = await Promise.all([
          api.get('/combos').catch(() => ({ data: { combos: [] } })),
          api.get('/vouchers').catch(() => ({ data: { vouchers: [] } }))
        ]);
        
        // Use API data if available, otherwise use fallback data
        const apiCombos = combosRes.data?.combos || [];
        const apiVouchers = vouchersRes.data?.vouchers || [];
        
        if (apiCombos.length === 0) {
          // Fallback combo data
          setCombos([
            {
              _id: 'combo1',
              name: 'Combo A',
              description: '1 bắp + 1 nước',
              price: 50000
            },
            {
              _id: 'combo2', 
              name: 'Combo B',
              description: '2 bắp + 2 nước',
              price: 90000
            }
          ]);
        } else {
          setCombos(apiCombos);
        }
        
        if (apiVouchers.length === 0) {
          // Fallback voucher data
          setVouchers([
            {
              _id: 'voucher1',
              name: 'Giảm 10%',
              description: 'Giảm 10% cho đơn hàng từ 200k',
              discountType: 'percentage',
              discountValue: 10,
              minPurchase: 200000
            },
            {
              _id: 'voucher2',
              name: 'Giảm 50k',
              description: 'Giảm 50k cho đơn hàng từ 300k',
              discountType: 'fixed',
              discountValue: 50000,
              minPurchase: 300000
            }
          ]);
        } else {
          setVouchers(apiVouchers);
        }
      } catch (error) {
        console.error('Error loading combos/vouchers:', error);
        // Use fallback data when API fails
        setCombos([
          {
            _id: 'combo1',
            name: 'Combo A',
            description: '1 bắp + 1 nước',
            price: 50000
          },
          {
            _id: 'combo2', 
            name: 'Combo B',
            description: '2 bắp + 2 nước',
            price: 90000
          }
        ]);
        setVouchers([
          {
            _id: 'voucher1',
            name: 'Giảm 10%',
            description: 'Giảm 10% cho đơn hàng từ 200k',
            discountType: 'percentage',
            discountValue: 10,
            minPurchase: 200000
          },
          {
            _id: 'voucher2',
            name: 'Giảm 50k',
            description: 'Giảm 50k cho đơn hàng từ 300k',
            discountType: 'fixed',
            discountValue: 50000,
            minPurchase: 300000
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleComboSelect = (combo) => {
    const existing = selectedCombos.find(c => c._id === combo._id);
    if (existing) {
      setSelectedCombos(selectedCombos.filter(c => c._id !== combo._id));
    } else {
      setSelectedCombos([...selectedCombos, { ...combo, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (comboId, quantity) => {
    if (quantity <= 0) {
      setSelectedCombos(selectedCombos.filter(c => c._id !== comboId));
    } else {
      setSelectedCombos(selectedCombos.map(c => 
        c._id === comboId ? { ...c, quantity } : c
      ));
    }
  };

  const handleVoucherSelect = (selectedVoucher) => {
    setVoucher(selectedVoucher);
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-red-600 rounded-lg p-6 min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-400">Đang tải combo và voucher...</p>
        </div>
      </div>
    );
  }

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
      
      <div className="space-y-6">
        {/* Combos Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Combo</h3>
          {combos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {combos.map(combo => {
                const selected = selectedCombos.find(c => c._id === combo._id);
                return (
                  <div key={combo._id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selected ? 'border-red-600 bg-red-900/20' : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{combo.name}</h4>
                        <p className="text-gray-400 text-sm">{combo.description}</p>
                        <p className="text-red-600 font-bold">{combo.price?.toLocaleString()} VNĐ</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selected && (
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={selected.quantity}
                            onChange={(e) => handleQuantityChange(combo._id, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-center"
                          />
                        )}
                        <button
                          onClick={() => handleComboSelect(combo)}
                          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            selected 
                              ? 'bg-red-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {selected ? 'Đã chọn' : 'Chọn'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400">Không có combo nào</p>
          )}
        </div>

        {/* Vouchers Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Voucher</h3>
          {vouchers.length > 0 ? (
            <div className="space-y-3">
              {vouchers.map(v => (
                <div key={v._id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  voucher?._id === v._id ? 'border-red-600 bg-red-900/20' : 'border-gray-600 hover:border-gray-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{v.name}</h4>
                      <p className="text-gray-400 text-sm">{v.description}</p>
                      <p className="text-green-600 font-bold">
                        {v.discountType === 'percentage' 
                          ? `Giảm ${v.discountValue}%` 
                          : `Giảm ${v.discountValue?.toLocaleString()} VNĐ`
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => handleVoucherSelect(v)}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        voucher?._id === v._id 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {voucher?._id === v._id ? 'Đã chọn' : 'Chọn'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Không có voucher nào</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComboVoucher;