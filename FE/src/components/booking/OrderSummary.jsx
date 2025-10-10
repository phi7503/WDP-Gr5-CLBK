import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { FiberManualRecord } from '@mui/icons-material';

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
  const formatShowtime = (startTime) => {
    if (!startTime) return '';
    return new Date(startTime).toLocaleString("vi-VN", { 
      day: "2-digit", 
      month: "2-digit", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <Card 
      sx={{ 
        bgcolor: '#1a1a1a', 
        border: '1px solid #dc2626', 
        borderRadius: 2, 
        p: 3,
        height: 'fit-content',
        position: 'sticky',
        top: 20
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FiberManualRecord sx={{ color: '#dc2626', mr: 1, fontSize: 20 }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Tóm tắt đơn hàng
        </Typography>
      </Box>

      {/* Movie Info */}
      {selectedMovie && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>
            PHIM
          </Typography>
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: '#2a2a2a', 
              borderRadius: 1,
              border: '1px solid #374151'
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
              {selectedMovie.title}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Showtime Info */}
      {selectedShowtime && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>
            SUẤT CHIẾU
          </Typography>
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: '#2a2a2a', 
              borderRadius: 1,
              border: '1px solid #374151'
            }}
          >
            <Typography sx={{ color: '#dc2626', fontWeight: 'bold' }}>
              {formatShowtime(selectedShowtime.startTime)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Selected Seats */}
      {selectedSeats.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>
            GHẾ ĐÃ CHỌN
          </Typography>
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: '#2a2a2a', 
              borderRadius: 1,
              border: '1px solid #374151'
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
              {selectedSeats.map(s => s.row + s.number).join(', ')}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Price Breakdown */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>
          CHI TIẾT GIÁ
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Tiền ghế:
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              {new Intl.NumberFormat("vi-VN", { 
                style: "currency", 
                currency: "VND" 
              }).format(seatTotal)}
            </Typography>
          </Box>
          
          {comboTotal > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                Tiền combo:
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {new Intl.NumberFormat("vi-VN", { 
                  style: "currency", 
                  currency: "VND" 
                }).format(comboTotal)}
              </Typography>
            </Box>
          )}
          
          {voucher && discountAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                Giảm giá:
              </Typography>
              <Typography variant="body2" sx={{ color: '#10b981' }}>
                -{new Intl.NumberFormat("vi-VN", { 
                  style: "currency", 
                  currency: "VND" 
                }).format(discountAmount)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Total */}
      <Box 
        sx={{ 
          p: 3, 
          bgcolor: '#dc2626', 
          borderRadius: 2,
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold', 
            mb: 1 
          }}
        >
          Tổng cộng
        </Typography>
        <Typography 
          variant="h4" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold' 
          }}
        >
          {new Intl.NumberFormat("vi-VN", { 
            style: "currency", 
            currency: "VND" 
          }).format(finalTotal)}
        </Typography>
      </Box>
    </Card>
  );
};

export default OrderSummary;
