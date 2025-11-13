import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { CheckCircle, Print, QrCode } from '@mui/icons-material';

const Confirmation = ({ 
  bookingResult, 
  selectedMovie, 
  selectedShowtime, 
  selectedSeats, 
  finalTotal 
}) => {
  const formatShowtime = (startTime) => {
    return new Date(startTime).toLocaleString("vi-VN", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const handlePrint = () => {
    window.print();
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
      {/* Success Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircle 
          sx={{ 
            fontSize: 80, 
            color: '#dc2626', 
            mb: 2 
          }} 
        />
        <Typography 
          variant="h4" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold', 
            mb: 1 
          }}
        >
          Đặt vé thành công!
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#9ca3af' 
          }}
        >
          Vé của bạn đã được xác nhận và sẵn sàng sử dụng
        </Typography>
      </Box>

      {/* Booking Details */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 3, 
          bgcolor: '#2a2a2a', 
          borderRadius: 2, 
          border: '1px solid #dc2626' 
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold', 
            mb: 2 
          }}
        >
          Chi tiết đặt vé
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#9ca3af' }}>Phim:</Typography>
            <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
              {selectedMovie?.title}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#9ca3af' }}>Suất chiếu:</Typography>
            <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
              {selectedShowtime && formatShowtime(selectedShowtime.startTime)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#9ca3af' }}>Ghế:</Typography>
            <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
              {selectedSeats.map(s => s.row + s.number).join(', ')}
            </Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              pt: 2,
              mt: 2,
              borderTop: '1px solid #dc2626'
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.3rem' }}>
              Tổng tiền:
            </Typography>
            <Typography 
              sx={{ 
                color: '#dc2626', 
                fontWeight: 'bold', 
                fontSize: '1.3rem' 
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

      {/* QR Check-in */}
      {(bookingResult?.qrCode || bookingResult?.booking?.qrCode) && (
        <Box 
          sx={{ 
            mb: 4, 
            p: 3, 
            bgcolor: '#2a2a2a', 
            borderRadius: 2, 
            border: '1px solid #dc2626',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold', 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <QrCode sx={{ color: '#dc2626' }} />
            Mã QR check-in
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2
            }}
          >
            <img 
              src={bookingResult.qrCode || bookingResult.booking?.qrCode} 
              alt="QR check-in" 
              style={{ 
                width: 200, 
                height: 200,
                border: '2px solid #dc2626',
                borderRadius: 8
              }} 
            />
          </Box>
          
          <Typography 
            variant="body2" 
            sx={{ color: '#9ca3af' }}
          >
            Quét mã QR này khi đến rạp để check-in
          </Typography>
        </Box>
      )}

      {/* Print Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Print />}
          onClick={handlePrint}
          sx={{
            bgcolor: '#dc2626',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            '&:hover': {
              bgcolor: '#ef4444',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          In vé
        </Button>
      </Box>

      {/* Booking ID */}
      {bookingResult?._id && (
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: '#065f46', 
            borderRadius: 1,
            border: '1px solid #10b981',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" sx={{ color: 'white' }}>
            Mã đặt vé: <strong>{bookingResult._id}</strong>
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Confirmation;