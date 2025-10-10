import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Payment } from '@mui/icons-material';

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
        <Payment sx={{ color: '#dc2626', mr: 1, fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
          Thanh toán
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
        Chọn phương thức thanh toán
      </Typography>

      {/* Price Details */}
      <Box 
        sx={{ 
          mb: 3, 
          p: 2, 
          bgcolor: '#2a2a2a', 
          borderRadius: 2, 
          border: '1px solid #dc2626' 
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
          Chi tiết giá
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#9ca3af' }}>
              Ghế đã chọn: {selectedSeats.map(s => s.row + s.number).join(", ") || "-"}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#9ca3af' }}>Tiền ghế:</Typography>
            <Typography sx={{ color: 'white' }}>
              {new Intl.NumberFormat("vi-VN", { 
                style: "currency", 
                currency: "VND" 
              }).format(seatTotal)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#9ca3af' }}>Tiền combo:</Typography>
            <Typography sx={{ color: 'white' }}>
              {new Intl.NumberFormat("vi-VN", { 
                style: "currency", 
                currency: "VND" 
              }).format(comboTotal)}
            </Typography>
          </Box>
          
          {voucher && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: '#9ca3af' }}>
                Giảm giá voucher ({voucher.code}):
              </Typography>
              <Typography sx={{ color: '#10b981' }}>
                -{new Intl.NumberFormat("vi-VN", { 
                  style: "currency", 
                  currency: "VND" 
                }).format(discountAmount)}
              </Typography>
            </Box>
          )}
          
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              pt: 2,
              mt: 2,
              borderTop: '1px solid #dc2626'
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              Tổng cộng:
            </Typography>
            <Typography 
              sx={{ 
                color: '#dc2626', 
                fontWeight: 'bold', 
                fontSize: '1.2rem' 
              }}
            >
              {new Intl.NumberFormat("vi-VN", { 
                style: "currency", 
                currency: "VND" 
              }).format(finalTotal)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Payment Methods */}
      <Box>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Phương thức thanh toán
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Cash Payment */}
          <Card
            onClick={() => setPaymentMethod('cash')}
            sx={{
              bgcolor: paymentMethod === 'cash' ? '#2a2a2a' : '#1a1a1a',
              border: paymentMethod === 'cash' ? '2px solid #dc2626' : '1px solid #dc2626',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#ef4444',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: paymentMethod === 'cash' ? '#dc2626' : '#2a2a2a',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  <Payment sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Tiền mặt
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    Thanh toán trực tiếp
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* QR Payment */}
          <Card
            onClick={() => setPaymentMethod('qr')}
            sx={{
              bgcolor: paymentMethod === 'qr' ? '#2a2a2a' : '#1a1a1a',
              border: paymentMethod === 'qr' ? '2px solid #dc2626' : '1px solid #dc2626',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#ef4444',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: paymentMethod === 'qr' ? '#dc2626' : '#2a2a2a',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    position: 'relative'
                  }}
                >
                  {/* QR Code Icon */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Box 
                        key={i}
                        sx={{ 
                          width: 3, 
                          height: 3, 
                          bgcolor: 'white',
                          borderRadius: 0.5
                        }} 
                      />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Quét mã QR
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    Chuyển khoản ngân hàng
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Payment;
