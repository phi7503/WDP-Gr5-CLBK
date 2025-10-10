import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Stepper, Step, StepLabel, Grid } from "@mui/material";
import { movieService } from "@/services/movieService";
import { showtimeService } from "@/services/showtimeService";
import { bookingService } from "@/services/bookingService";
import CheckPayment from "../components/booking/CheckPayment";
import { Modal } from "antd";

// Import các component mới theo template
import MovieSelection from "../booking/MovieSelection";
import ShowtimeSelection from "../booking/ShowtimeSelection";
import SeatSelection from "../booking/SeatSelection";
import ComboVoucher from "../booking/ComboVoucher";
import Payment from "../booking/Payment";
import Confirmation from "../booking/Confirmation";
import OrderSummary from "../booking/OrderSummary";

const steps = [
  "Chọn phim",
  "Chọn suất chiếu", 
  "Chọn ghế",
  "Combo & Voucher",
  "Thanh toán",
  "Xác nhận"
];

const EmployeeBookTicket = () => {
  const [activeStep, setActiveStep] = useState(0);
  // Phim
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  // Suất chiếu
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  // Ghế
  const [selectedSeats, setSelectedSeats] = useState([]);
  // Combo
  const [selectedCombos, setSelectedCombos] = useState([]);
  // Voucher
  const [voucher, setVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  // Thanh toán
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'qr'
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  // Tổng tiền
  const seatTotal = selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
  const comboTotal = selectedCombos.reduce((sum, c) => sum + (c.price * c.quantity), 0);
  let discountAmount = 0;
  if (voucher) {
    const subtotal = seatTotal + comboTotal;
    if (voucher.discountType === "percentage") {
      discountAmount = Math.floor(subtotal * voucher.discountValue / 100);
      if (voucher.maxDiscount > 0) discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    } else if (voucher.discountType === "fixed") {
      discountAmount = voucher.discountValue;
      if (voucher.maxDiscount > 0) discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  }
  const finalTotal = Math.max(seatTotal + comboTotal - discountAmount, 0);

  // Lấy danh sách phim
  useEffect(() => {
    movieService.getMovies().then(data => setMovies(data.movies || [])).catch(() => setMovies([]));
  }, []);

  // Lấy danh sách suất chiếu khi chọn phim
  useEffect(() => {
    if (selectedMovie) {
      showtimeService.getShowtimes({ movie: selectedMovie._id, limit: 50 })
        .then(res => setShowtimes(res.showtimes || []))
        .catch(() => setShowtimes([]));
    }
  }, [selectedMovie]);

  // Đặt vé
  const [bookingResult, setBookingResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [paymentCheckText, setPaymentCheckText] = useState("");

  const generateQRCodeUrl = (amount, message) => {
    return `https://img.vietqr.io/image/ICB-105883688517-compact2.png?amount=${amount}&addInfo=${message}`;
  };
  const generateRandomText = (length) => {
    const allowedCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += allowedCharacters.charAt(
        Math.floor(Math.random() * allowedCharacters.length)
      );
    }
    return result;
  };

  // Thêm vào useEffect để mở modal QR khi chọn phương thức 'qr'
  useEffect(() => {
    if (paymentMethod === 'qr' && !bookingResult && activeStep === 4) {
      const randomText = generateRandomText(10);
      setPaymentCheckText(randomText);
      setQrCodeValue(generateQRCodeUrl(finalTotal, randomText));
      setShowQRCode(true);
    } else {
      setShowQRCode(false);
    }
    // eslint-disable-next-line
  }, [paymentMethod, finalTotal, bookingResult, activeStep]);

  const handleBooking = async () => {
    setLoading(true);
    setError("");
    setBookingResult(null);
    try {
      const bookingData = {
        showtimeId: selectedShowtime._id,
        seatIds: selectedSeats.map(s => s._id),
        combos: selectedCombos.map(c => ({ combo: c._id, quantity: c.quantity })),
        voucherId: voucher?._id,
        employeeMode: true,
      };
      const res = await bookingService.createBooking(bookingData);
      let booking = res.booking || res;
      if (res && (res.success || res.booking)) {
        if (paymentMethod === 'qr') {
          // Tạo mã chuyển khoản động và hiển thị modal QR
          const randomText = generateRandomText(10);
          setPaymentCheckText(randomText);
          setQrCodeValue(generateQRCodeUrl(finalTotal, randomText));
          setBookingResult(booking);
          setShowQRCode(true);
          setActiveStep(4); // Giữ ở bước thanh toán
          setLoading(false);
          return;
        } else if (paymentMethod === 'cash') {
          try {
            await bookingService.updatePaymentStatus(booking._id, {
              paymentStatus: 'completed',
              paymentMethod: 'cash',
            });
            // Lấy lại thông tin booking đã cập nhật
            const updated = await bookingService.getBookingById(booking._id);
            setBookingResult(updated.booking || updated);
          } catch (err) {
            setError('Cập nhật trạng thái thanh toán thất bại.');
            return;
          }
        } else {
          setBookingResult(booking);
        }
        setActiveStep(5);
      } else {
        setError(res.message || "Đặt vé thất bại");
      }
    } catch (err) {
      setError(err.message || "Đặt vé thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Thay thế hàm chọn suất chiếu:
  const handleSelectShowtime = async (showtime) => {
    try {
      const detail = await showtimeService.getShowtimeById(showtime._id);
      setSelectedShowtime(detail);
      setActiveStep(2);
    } catch (err) {
      // Có thể show thông báo lỗi nếu cần
    }
  };

  // Đảm bảo khi chọn ghế, mỗi seat đều có price đúng
  const handleSeatSelectionChange = (seats) => {
    setSelectedSeats(
      seats.map(s => ({
        ...s,
        price: s.price !== undefined ? s.price : (s.availability?.price || 0)
      }))
    );
  };

  // Sửa lại handlePaymentSuccess để tạo booking và cập nhật trạng thái khi thanh toán QR thành công
  const handlePaymentSuccess = async () => {
    setLoading(true);
    setError(null);
    try {
      // Tạo booking trước
      const bookingData = {
        showtimeId: selectedShowtime._id,
        seatIds: selectedSeats.map(s => s._id),
        combos: selectedCombos.map(c => ({ combo: c._id, quantity: c.quantity })),
        voucherId: voucher?._id,
        employeeMode: true,
      };
      const res = await bookingService.createBooking(bookingData);
      let booking = res.booking || res;
      // Cập nhật trạng thái thanh toán
      await bookingService.updatePaymentStatus(booking._id, {
        paymentStatus: "completed",
        transactionId: paymentCheckText,
        paymentMethod: "bank_transfer",
      });
      // Lấy lại thông tin booking đã cập nhật
      const updated = await bookingService.getBookingById(booking._id);
      setBookingResult(updated.booking || updated);
      setShowQRCode(false);
      setPaymentMethod('cash'); // reset về mặc định để tránh lặp
      setActiveStep(5);
    } catch (err) {
      setError("Đặt vé hoặc cập nhật trạng thái thanh toán thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#000000',
      py: 4
    }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <Box sx={{ 
            bgcolor: '#dc2626', 
            px: 2, 
            py: 0.5, 
            borderRadius: 1,
            mr: 2
          }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
              Cinema Booking System
            </Typography>
          </Box>
        </Box>
        
        <Typography 
          variant="h3" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold', 
            mb: 1,
            textShadow: '0 0 20px rgba(220, 38, 38, 0.5)'
          }}
        >
          Đặt vé cho khách
        </Typography>
        
        <Typography variant="h6" sx={{ color: '#9ca3af', fontWeight: 400 }}>
          Trải nghiệm đặt vé nhanh chóng và chuyên nghiệp
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', mb: 4 }}>
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel 
          sx={{ 
            '& .MuiStepLabel-root': {
              '& .MuiStepLabel-label': {
                color: activeStep >= 0 ? '#dc2626' : '#9ca3af',
                fontWeight: activeStep >= 0 ? 'bold' : 'normal'
              }
            },
            '& .MuiStepConnector-line': {
              borderColor: activeStep >= 1 ? '#dc2626' : '#374151'
            }
          }}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                sx={{
                  '& .MuiStepLabel-iconContainer': {
                    '& .MuiStepIcon-root': {
                      color: activeStep > index ? '#dc2626' : activeStep === index ? '#dc2626' : '#374151',
                      '& .MuiStepIcon-text': {
                        fill: 'white',
                        fontWeight: 'bold'
                      }
                    }
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      {/* Main Content */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
        <Grid container spacing={3}>
          {/* Left Panel - Main Content */}
          <Grid item xs={12} lg={8}>
            {/* Bước 1: Chọn phim */}
            {activeStep === 0 && (
              <MovieSelection 
                movies={movies}
                selectedMovie={selectedMovie}
                onSelectMovie={(movie) => {
                  setSelectedMovie(movie);
                  setActiveStep(1);
                }}
              />
            )}
            {/* Bước 2: Chọn suất chiếu */}
            {activeStep === 1 && selectedMovie && (
              <ShowtimeSelection 
                showtimes={showtimes}
                selectedShowtime={selectedShowtime}
                onSelectShowtime={handleSelectShowtime}
                selectedMovie={selectedMovie}
              />
            )}
            {/* Bước 3: Chọn ghế */}
            {activeStep === 2 && selectedShowtime && (
              <Box>
                <SeatSelection
                  showtimeId={selectedShowtime._id}
                  onSeatSelectionChange={handleSeatSelectionChange}
                  maxSeats={8}
                />
                <Box mt={3} display="flex" justifyContent="space-between">
                  <Button 
                    variant="outlined" 
                    onClick={() => setActiveStep(1)}
                    sx={{
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      '&:hover': {
                        borderColor: '#ef4444',
                        bgcolor: 'rgba(220, 38, 38, 0.1)'
                      }
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button 
                    variant="contained" 
                    disabled={selectedSeats.length === 0} 
                    onClick={() => setActiveStep(3)}
                    sx={{
                      bgcolor: '#dc2626',
                      '&:hover': {
                        bgcolor: '#ef4444'
                      },
                      '&:disabled': {
                        bgcolor: '#6b7280'
                      }
                    }}
                  >
                    Tiếp tục
                  </Button>
                </Box>
              </Box>
            )}
            {/* Bước 4: Combo & Voucher */}
            {activeStep === 3 && (
              <Box>
                <ComboVoucher 
                  selectedCombos={selectedCombos}
                  setSelectedCombos={setSelectedCombos}
                  voucher={voucher}
                  setVoucher={setVoucher}
                  setError={setVoucherError}
                />
                {voucherError && <Typography color="error" sx={{ mt: 2 }}>{voucherError}</Typography>}
                <Box mt={3} display="flex" justifyContent="space-between">
                  <Button 
                    variant="outlined" 
                    onClick={() => setActiveStep(2)}
                    sx={{
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      '&:hover': {
                        borderColor: '#ef4444',
                        bgcolor: 'rgba(220, 38, 38, 0.1)'
                      }
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={() => setActiveStep(4)}
                    sx={{
                      bgcolor: '#dc2626',
                      '&:hover': {
                        bgcolor: '#ef4444'
                      }
                    }}
                  >
                    Tiếp tục
                  </Button>
                </Box>
              </Box>
            )}
            {/* Bước 5: Thanh toán */}
            {activeStep === 4 && (
              <Box>
                <Payment
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  selectedSeats={selectedSeats}
                  selectedCombos={selectedCombos}
                  voucher={voucher}
                  seatTotal={seatTotal}
                  comboTotal={comboTotal}
                  discountAmount={discountAmount}
                  finalTotal={finalTotal}
                />
                
                {paymentMethod === 'qr' && (
                  <Modal
                    open={showQRCode}
                    onCancel={() => setShowQRCode(false)}
                    footer={null}
                    maskClosable={false}
                    closable={true}
                    title="Quét mã QR để thanh toán"
                  >
                    <div className="text-center">
                      <p className="mb-2">
                        Vui lòng chuyển khoản đúng số tiền và nội dung.
                      </p>
                      <p className="mb-2">
                        Nội dung: <strong className="text-red-600">{paymentCheckText}</strong>
                      </p>
                      <img
                        src={qrCodeValue}
                        alt="QR Code"
                        style={{ maxWidth: "100%", margin: "auto", display: "block" }}
                      />
                      <CheckPayment
                        totalMoney={finalTotal}
                        txt={paymentCheckText}
                        onPaymentSuccess={handlePaymentSuccess}
                      />
                    </div>
                  </Modal>
                )}
                
                <Box mt={3} display="flex" justifyContent="space-between">
                  <Button 
                    variant="outlined" 
                    onClick={() => setActiveStep(3)}
                    sx={{
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      '&:hover': {
                        borderColor: '#ef4444',
                        bgcolor: 'rgba(220, 38, 38, 0.1)'
                      }
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button
                    variant="contained"
                    disabled={paymentMethod === 'cash' && selectedSeats.length === 0}
                    onClick={handleBooking}
                    sx={{
                      bgcolor: '#dc2626',
                      '&:hover': {
                        bgcolor: '#ef4444'
                      },
                      '&:disabled': {
                        bgcolor: '#6b7280'
                      }
                    }}
                  >
                    Xác nhận đặt vé
                  </Button>
                </Box>
                {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
              </Box>
            )}
            {/* Bước 6: Xác nhận */}
            {activeStep === 5 && (
              bookingResult ? (
                <Confirmation
                  bookingResult={bookingResult}
                  selectedMovie={selectedMovie}
                  selectedShowtime={selectedShowtime}
                  selectedSeats={selectedSeats}
                  finalTotal={finalTotal}
                />
              ) : (
                <Box sx={{ 
                  maxWidth: 600, 
                  mx: 'auto', 
                  p: 4, 
                  bgcolor: '#1a1a1a', 
                  borderRadius: 2, 
                  border: '1px solid #dc2626',
                  textAlign: 'center' 
                }}>
                  <Typography variant="h6" sx={{ color: '#dc2626', mb: 2 }}>
                    Không tìm thấy thông tin vé!
                  </Typography>
                  <Typography sx={{ color: '#9ca3af' }}>
                    Vui lòng thao tác lại hoặc liên hệ quản trị viên.
                  </Typography>
                </Box>
              )
            )}
          </Grid>
          
          {/* Right Panel - Order Summary */}
          <Grid item xs={12} lg={4}>
            <OrderSummary
              selectedMovie={selectedMovie}
              selectedShowtime={selectedShowtime}
              selectedSeats={selectedSeats}
              selectedCombos={selectedCombos}
              voucher={voucher}
              seatTotal={seatTotal}
              comboTotal={comboTotal}
              discountAmount={discountAmount}
              finalTotal={finalTotal}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default EmployeeBookTicket;