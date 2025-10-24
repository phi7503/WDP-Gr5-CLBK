import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const CustomerTicketDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fake data để test giao diện
    const fakeBooking = {
      _id: id || 'booking1',
      bookingNumber: 'TKT-2024-001234',
      movie: {
        title: 'The Dark Knight Rises',
        poster: 'https://via.placeholder.com/200x300?text=Dark+Knight',
        genre: 'Action, Crime, Drama',
        rating: 'PG-13',
        duration: 165
      },
      showtime: {
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 ngày tới
        branch: { name: 'CGV Vincom Center Ba Đình' },
        theater: { name: 'Phòng 5 - IMAX' }
      },
      seats: [
        { row: 'A', number: 1, type: 'standard', price: 125000 },
        { row: 'A', number: 2, type: 'standard', price: 125000 }
      ],
      totalAmount: 250000,
      serviceFee: 0,
      finalTotal: 250000,
      bookingStatus: 'confirmed',
      paymentStatus: 'completed',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 ngày trước
      checkedIn: false,
      qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiMwMDAiLz48L3N2Zz4='
    };
    
    setTimeout(() => {
      setBooking(fakeBooking);
      setLoading(false);
    }, 1000);
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDayOfWeek = (dateString) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[new Date(dateString).getDay()];
  };

  const getStatusColor = (status) => {
    return status === 'completed' ? 'bg-green-600' : 'bg-red-600';
  };

  const getStatusText = (status) => {
    return status === 'completed' ? 'Đã xem' : 'Sắp tới';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Không tìm thấy vé</p>
          <button 
            onClick={() => navigate('/customer/booking-history')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate('/customer/booking-history')}
            className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-white">Chi Tiết Vé</h1>
        </div>
        
        <p className="text-gray-400 text-lg">
          Mã vé: {booking.bookingNumber}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Movie Information */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="flex items-start gap-6">
                <img
                  src={booking.movie.poster}
                  alt={booking.movie.title}
                  className="w-32 h-48 object-cover rounded-lg"
                />
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {booking.movie.title}
                  </h2>
                  <p className="text-gray-400 mb-4">{booking.movie.genre}</p>
                  
                  <div className="flex gap-3 mb-4">
                    <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium">
                      {booking.movie.rating}
                    </span>
                    <span className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm font-medium">
                      {booking.movie.duration} phút
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <span className="text-gray-400 mr-2">Trạng thái:</span>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(booking.bookingStatus)}`}></div>
                      <span className="text-white">{getStatusText(booking.bookingStatus)}</span>
                    </div>
                  </div>
                  
                  <div className="text-gray-400">
                    <span className="mr-2">Ngày đặt:</span>
                    <span className="text-white">{formatDate(booking.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Information */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6">Thông Tin Vé</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Rạp Chiếu</p>
                    <p className="text-white font-medium">{booking.showtime.branch.name}</p>
                    <p className="text-gray-400 text-sm">72 Lê Duẩn, Ba Đình, Hà Nội</p>
                    <p className="text-gray-400 text-sm">{booking.showtime.theater.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ngày Chiếu</p>
                    <p className="text-white font-medium">{formatDate(booking.showtime.startTime)}</p>
                    <p className="text-gray-400 text-sm">{getDayOfWeek(booking.showtime.startTime)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Giờ Chiếu</p>
                    <p className="text-white font-medium">{formatTime(booking.showtime.startTime)}</p>
                    <p className="text-gray-400 text-sm">Vào cửa 15 phút trước</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ghế Ngồi</p>
                    <p className="text-white font-medium">
                      {booking.seats.map(s => `${s.row}${s.number}`).join(', ')}
                    </p>
                    <p className="text-gray-400 text-sm">{booking.seats.length} vé</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Details */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6">Chi Tiết Giá</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Giá vé ({booking.seats.length} vé)</span>
                  <span className="text-white">
                    {booking.seats[0].price.toLocaleString()} ₫ x {booking.seats.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phí dịch vụ</span>
                  <span className="text-white">{booking.serviceFee.toLocaleString()} ₫</span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-bold text-lg">Tổng cộng</span>
                    <span className="text-red-600 font-bold text-lg">
                      {booking.finalTotal.toLocaleString()} ₫
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6">Thông Tin Liên Hệ</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Hỗ trợ khách hàng</p>
                    <p className="text-white font-medium">1900 1234</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white font-medium">support@cinemahanoi.vn</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Địa chỉ</p>
                    <p className="text-white font-medium">72 Lê Duẩn, Ba Đình, Hà Nội</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - QR Code & Notes */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-gray-900 border border-red-600 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-bold text-white">Mã QR</h3>
              </div>
              
              <div className="text-center">
                <div className="w-48 h-48 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src={booking.qrCode} 
                    alt="QR Code" 
                    className="w-44 h-44"
                  />
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Quét mã QR tại cửa rạp
                </p>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Tải QR Code
                </button>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Lưu Ý Quan Trọng</h3>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-400 text-sm">
                    Vui lòng đến rạp 15 phút trước giờ chiếu
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-400 text-sm">
                    Mang theo vé hoặc mã QR để vào cửa
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-400 text-sm">
                    Vé không thể hoàn trả sau khi mua
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-400 text-sm">
                    Tuân thủ quy định của rạp chiếu
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTicketDetails;
