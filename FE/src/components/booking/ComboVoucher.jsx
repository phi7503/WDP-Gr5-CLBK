import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Card, CardContent, IconButton } from '@mui/material';
import { CardGiftcard, Add, Remove } from '@mui/icons-material';

const ComboVoucher = ({ selectedCombos, setSelectedCombos, voucher, setVoucher, setError }) => {
  const [combos] = useState([
    {
      _id: 'combo1',
      name: 'Combo Couple',
      description: '2 bắp rang bơ lớn + 2 nước ngọt lớn',
      price: 150000,
      image: '/api/placeholder/200/150'
    },
    {
      _id: 'combo2',
      name: 'Combo Solo',
      description: '1 bắp rang bơ vừa + 1 nước ngọt vừa',
      price: 80000,
      image: '/api/placeholder/200/150'
    },
    {
      _id: 'combo3',
      name: 'Combo Family',
      description: '3 bắp rang bơ lớn + 3 nước ngọt lớn + 1 snack',
      price: 250000,
      image: '/api/placeholder/200/150'
    }
  ]);

  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComboQuantityChange = (combo, change) => {
    setSelectedCombos(prev => {
      const existing = prev.find(c => c._id === combo._id);
      
      if (existing) {
        const newQuantity = existing.quantity + change;
        if (newQuantity <= 0) {
          return prev.filter(c => c._id !== combo._id);
        }
        return prev.map(c => 
          c._id === combo._id ? { ...c, quantity: newQuantity } : c
        );
      } else if (change > 0) {
        return [...prev, { ...combo, quantity: 1 }];
      }
      
      return prev;
    });
  };

  const getComboQuantity = (combo) => {
    const existing = selectedCombos.find(c => c._id === combo._id);
    return existing ? existing.quantity : 0;
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Mock voucher validation
      const mockVouchers = {
        'DISCOUNT10': { 
          _id: 'v1', 
          code: 'DISCOUNT10', 
          discountType: 'percentage', 
          discountValue: 10, 
          maxDiscount: 50000 
        },
        'SAVE20K': { 
          _id: 'v2', 
          code: 'SAVE20K', 
          discountType: 'fixed', 
          discountValue: 20000, 
          maxDiscount: 20000 
        }
      };
      
      if (mockVouchers[voucherCode.toUpperCase()]) {
        setVoucher(mockVouchers[voucherCode.toUpperCase()]);
        setError('');
      } else {
        setError('Mã voucher không hợp lệ hoặc đã hết hạn');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi áp dụng voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        bgcolor: '#1a1a1a', 
        border: '1px solid #dc2626', 
        borderRadius: 2, 
        p: 3,
        minHeight: '500px'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CardGiftcard sx={{ color: '#dc2626', mr: 1, fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
          Combo & Voucher
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
        Thêm combo và ưu đãi
      </Typography>

      {/* Combo Selection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Chọn combo
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {combos.map((combo) => {
            const quantity = getComboQuantity(combo);
            
            return (
              <Card
                key={combo._id}
                sx={{
                  bgcolor: '#2a2a2a',
                  border: quantity > 0 ? '2px solid #dc2626' : '1px solid #dc2626',
                  borderRadius: 2,
                  transition: 'all 0.3s ease'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                        {combo.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>
                        {combo.description}
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 'bold' }}>
                        {new Intl.NumberFormat("vi-VN", { 
                          style: "currency", 
                          currency: "VND" 
                        }).format(combo.price)}
                      </Typography>
                    </Box>
                    
                    {/* Quantity Selector */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        onClick={() => handleComboQuantityChange(combo, -1)}
                        disabled={quantity === 0}
                        sx={{ 
                          color: quantity > 0 ? '#dc2626' : '#6b7280',
                          border: `1px solid ${quantity > 0 ? '#dc2626' : '#6b7280'}`,
                          width: 32,
                          height: 32
                        }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      
                      <Typography 
                        sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          minWidth: 24,
                          textAlign: 'center'
                        }}
                      >
                        {quantity}
                      </Typography>
                      
                      <IconButton
                        onClick={() => handleComboQuantityChange(combo, 1)}
                        sx={{ 
                          color: '#dc2626',
                          border: '1px solid #dc2626',
                          width: 32,
                          height: 32
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* Voucher Section */}
      <Box>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Áp dụng voucher
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Nhập mã voucher"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#2a2a2a',
                color: 'white',
                '& fieldset': {
                  borderColor: '#dc2626',
                },
                '&:hover fieldset': {
                  borderColor: '#ef4444',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#dc2626',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#9ca3af',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#9ca3af',
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleApplyVoucher();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleApplyVoucher}
            disabled={!voucherCode.trim() || loading}
            sx={{
              bgcolor: '#dc2626',
              '&:hover': {
                bgcolor: '#ef4444',
              },
              minWidth: 100
            }}
          >
            Áp dụng
          </Button>
        </Box>
        
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Thử: DISCOUNT10 (giảm 10%) hoặc SAVE20K (giảm 20.000₫)
        </Typography>
        
        {voucher && (
          <Box 
            sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: '#065f46', 
              borderRadius: 1,
              border: '1px solid #10b981'
            }}
          >
            <Typography variant="body2" sx={{ color: 'white' }}>
              ✅ Voucher "{voucher.code}" đã được áp dụng
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ComboVoucher;