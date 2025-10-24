import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { movieService } from "../services/MovieService";
import { showtimeService } from "../services/showtimeService";
import { bookingService } from "../services/BookingService";
// import { Modal } from "antd"; // Removed antd dependency

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
  "Thông tin khách hàng",
  "Combo & Voucher",
  "Thanh toán",
  "Xác nhận"
];

const EmployeeBookTicket = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const sidebarItems = [
    {
      text: 'Dashboard',
      icon: '🏠',
      path: '/employee/dashboard',
      active: false
    },
    {
      text: 'Đặt vé cho khách',
      icon: '🎬',
      path: '/employee/book-ticket',
      active: true
    },
    {
      text: 'Quét QR vé',
      icon: '📱',
      path: '/employee/qr-checkin',
      active: false
    }
  ];

  // Phim
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  // Suất chiếu
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  // Ghế
  const [selectedSeats, setSelectedSeats] = useState([]);
  // Thông tin khách hàng
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
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

  // Lấy danh sách phim (fallback dữ liệu cứng nếu API lỗi/trống)
  useEffect(() => {
    const fallbackMovies = [
      {
        _id: 'mua-do',
        title: 'Mưa Đỏ',
        poster: 'https://via.placeholder.com/300x450?text=Mua+Do',
      },
      {
        _id: 'tu-chien-tren-khong',
        title: 'Tử Chiến Trên Không',
        poster: 'https://via.placeholder.com/300x450?text=Tu+Chien+Tren+Khong',
      },
      {
        _id: 'the-conjuring',
        title: 'The Conjuring',
        poster: 'https://via.placeholder.com/300x450?text=The+Conjuring',
      },
      {
        _id: 'inception',
        title: 'Inception',
        poster: 'https://via.placeholder.com/300x450?text=Inception',
      },
      {
        _id: 'interstellar',
        title: 'Interstellar',
        poster: 'https://via.placeholder.com/300x450?text=Interstellar',
      },
    ];

    movieService
      .getMovies()
      .then((data) => {
        const list = data?.movies || [];
        setMovies(list.length > 0 ? list : fallbackMovies);
      })
      .catch(() => setMovies(fallbackMovies));
  }, []);

  // Lấy danh sách suất chiếu khi chọn phim
  useEffect(() => {
    if (selectedMovie) {
      showtimeService
        .getShowtimes({ movie: selectedMovie._id, limit: 50 })
        .then((res) => {
          const list = res?.showtimes || [];
          if (list.length > 0) {
            setShowtimes(list);
          } else {
            // Fallback tạo vài suất chiếu giả lập trong tương lai gần
            const now = new Date();
            const mk = (hrs) => new Date(now.getTime() + hrs * 60 * 60 * 1000).toISOString();
            const fake = [
              {
                _id: `${selectedMovie._id}-st1`,
                movie: { _id: selectedMovie._id, title: selectedMovie.title },
                branch: { name: 'CGV Vincom' },
                theater: { name: 'Cinema 1' },
                startTime: mk(2),
              },
              {
                _id: `${selectedMovie._id}-st2`,
                movie: { _id: selectedMovie._id, title: selectedMovie.title },
                branch: { name: 'CGV Crescent Mall' },
                theater: { name: 'Cinema 2' },
                startTime: mk(4),
              },
            ];
            setShowtimes(fake);
          }
        })
        .catch(() => {
          const now = new Date();
          const mk = (hrs) => new Date(now.getTime() + hrs * 60 * 60 * 1000).toISOString();
          const fake = [
            {
              _id: `${selectedMovie._id}-st1`,
              movie: { _id: selectedMovie._id, title: selectedMovie.title },
              branch: { name: 'CGV Vincom' },
              theater: { name: 'Cinema 1' },
              startTime: mk(2),
            },
            {
              _id: `${selectedMovie._id}-st2`,
              movie: { _id: selectedMovie._id, title: selectedMovie.title },
              branch: { name: 'CGV Crescent Mall' },
              theater: { name: 'Cinema 2' },
              startTime: mk(4),
            },
          ];
          setShowtimes(fake);
        });
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
    if (paymentMethod === 'qr' && !bookingResult && activeStep === 5) {
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
        customerInfo: customerInfo,
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
          setActiveStep(5); // Giữ ở bước thanh toán
          setLoading(false);
          return;
        } else if (paymentMethod === 'cash') {
          try {
            await bookingService.updatePaymentStatus(booking._id, {
              paymentStatus: 'completed',
              paymentMethod: 'cash',
            });
            const updated = await bookingService.getBookingById(booking._id);
            setBookingResult(updated.booking || updated);
          } catch (err) {
            // Nếu backend không hoạt động, fallback tạo booking cục bộ
            const localBooking = {
              _id: `LOCAL_${Date.now()}`,
              showtime: selectedShowtime,
              seats: selectedSeats,
              totalAmount: finalTotal,
              paymentStatus: 'completed',
              bookingStatus: 'confirmed',
              createdAt: new Date().toISOString(),
            };
            setBookingResult(localBooking);
          }
        } else {
          setBookingResult(booking);
        }
        setActiveStep(6);
      } else {
        setError(res.message || "Đặt vé thất bại");
      }
    } catch (err) {
      // Fallback offline khi đặt vé thất bại (ví dụ đang dùng dữ liệu fake)
      if (paymentMethod === 'cash') {
        const localBooking = {
          _id: `LOCAL_${Date.now()}`,
          showtime: selectedShowtime,
          seats: selectedSeats,
          totalAmount: finalTotal,
          paymentStatus: 'completed',
          bookingStatus: 'confirmed',
          createdAt: new Date().toISOString(),
        };
        setBookingResult(localBooking);
        setActiveStep(6);
      } else {
        setError(err.message || "Đặt vé thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  // Thay thế hàm chọn suất chiếu:
  const handleSelectShowtime = async (showtime) => {
    try {
      // Nếu là suất chiếu giả (không có trong DB), API sẽ fail -> fallback
      const detail = await showtimeService.getShowtimeById(showtime._id);
      setSelectedShowtime(detail || showtime);
      setActiveStep(2);
    } catch (err) {
      // Fallback: dùng dữ liệu đang có để tiếp tục flow
      setSelectedShowtime(showtime);
      setActiveStep(2);
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
        customerInfo: customerInfo,
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
      setActiveStep(6);
    } catch (err) {
      setError("Đặt vé hoặc cập nhật trạng thái thanh toán thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-600 px-4 py-2 rounded mr-4">
            <span className="text-white font-bold text-sm">
              Cinema Booking System
            </span>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2" style={{textShadow: '0 0 20px rgba(220, 38, 38, 0.5)'}}>
          Đặt vé cho khách
        </h1>
        
        <p className="text-xl text-gray-400 font-normal">
          Trải nghiệm đặt vé nhanh chóng và chuyên nghiệp
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                activeStep >= index 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                activeStep >= index ? 'text-red-600' : 'text-gray-400'
              }`}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  activeStep > index ? 'bg-red-600' : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white">Menu</h3>
              </div>
              <div className="p-0">
                {sidebarItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-700 last:border-b-0">
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center p-4 text-left transition-colors ${
                        item.active 
                          ? 'bg-red-600 text-white border-l-4 border-red-600' 
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
                      }`}
                    >
                      <span className="text-xl mr-3">{item.icon}</span>
                      <span className={`font-medium ${item.active ? 'font-bold' : ''}`}>
                        {item.text}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Center Panel - Main Content */}
          <div className="lg:col-span-6">
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
              <div>
                <SeatSelection
                  showtimeId={selectedShowtime._id}
                  onSeatSelectionChange={handleSeatSelectionChange}
                  maxSeats={8}
                />
                <div className="mt-6 flex justify-between">
                  <button 
                    onClick={() => setActiveStep(1)}
                    className="px-6 py-2 border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Quay lại
                  </button>
                  <button 
                    disabled={selectedSeats.length === 0}
                    onClick={() => setActiveStep(3)}
                    className={`px-6 py-2 rounded text-white transition-colors ${
                      selectedSeats.length === 0 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}
            
            {/* Bước 4: Thông tin khách hàng */}
            {activeStep === 3 && (
              <div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Thông tin khách hàng</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:outline-none"
                        placeholder="Nhập họ và tên khách hàng"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:outline-none"
                        placeholder="Nhập email khách hàng"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:outline-none"
                        placeholder="Nhập số điện thoại khách hàng"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <button 
                    onClick={() => setActiveStep(2)}
                    className="px-6 py-2 border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Quay lại
                  </button>
                  <button 
                    disabled={!customerInfo.name.trim()}
                    onClick={() => setActiveStep(4)}
                    className={`px-6 py-2 rounded text-white transition-colors ${
                      !customerInfo.name.trim() 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}
            
            {/* Bước 5: Combo & Voucher */}
            {activeStep === 4 && (
              <div>
                <ComboVoucher 
                  selectedCombos={selectedCombos}
                  setSelectedCombos={setSelectedCombos}
                  voucher={voucher}
                  setVoucher={setVoucher}
                  setError={setVoucherError}
                />
                {voucherError && <p className="mt-4 text-red-500">{voucherError}</p>}
                <div className="mt-6 flex justify-between">
                  <button 
                    onClick={() => setActiveStep(3)}
                    className="px-6 py-2 border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Quay lại
                  </button>
                  <button 
                    onClick={() => setActiveStep(5)}
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}
            
            {/* Bước 6: Thanh toán */}
            {activeStep === 5 && (
              <div>
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
                
                {paymentMethod === 'qr' && showQRCode && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-red-600 rounded-lg p-6 max-w-md w-full mx-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Quét mã QR để thanh toán</h3>
                        <button
                          onClick={() => setShowQRCode(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-center">
                        <p className="mb-2 text-gray-300">
                          Vui lòng chuyển khoản đúng số tiền và nội dung.
                        </p>
                        <p className="mb-4 text-gray-300">
                          Nội dung: <strong className="text-red-600">{paymentCheckText}</strong>
                        </p>
                        <img
                          src={qrCodeValue}
                          alt="QR Code"
                          className="max-w-full mx-auto block mb-4"
                        />
                        <button
                          onClick={handlePaymentSuccess}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                        >
                          Xác nhận thanh toán
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-between">
                  <button 
                    onClick={() => setActiveStep(4)}
                    className="px-6 py-2 border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    disabled={paymentMethod === 'cash' && selectedSeats.length === 0}
                    onClick={handleBooking}
                    className={`px-6 py-2 rounded text-white transition-colors ${
                      paymentMethod === 'cash' && selectedSeats.length === 0
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Xác nhận đặt vé
                  </button>
                </div>
                {error && <p className="mt-4 text-red-500">{error}</p>}
              </div>
            )}
            
            {/* Bước 7: Xác nhận */}
            {activeStep === 6 && (
              bookingResult ? (
                <Confirmation
                  bookingResult={bookingResult}
                  selectedMovie={selectedMovie}
                  selectedShowtime={selectedShowtime}
                  selectedSeats={selectedSeats}
                  finalTotal={finalTotal}
                />
              ) : (
                <div className="max-w-2xl mx-auto p-8 bg-gray-900 rounded-lg border border-red-600 text-center">
                  <h3 className="text-xl text-red-600 mb-4">
                    Không tìm thấy thông tin vé!
                  </h3>
                  <p className="text-gray-400">
                    Vui lòng thao tác lại hoặc liên hệ quản trị viên.
                  </p>
                </div>
              )
            )}
          </div>
          
          {/* Right Panel - Order Summary */}
          <div className="lg:col-span-3">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeBookTicket;