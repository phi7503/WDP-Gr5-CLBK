import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/app.context';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';

const EmployeeBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, pending, completed
  const [searchTerm, setSearchTerm] = useState('');

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
      active: false
    },
    {
      text: 'Quét QR vé',
      icon: '📱',
      path: '/employee/qr-checkin',
      active: false
    },
    {
      text: 'Quản lý vé',
      icon: '🎫',
      path: '/employee/bookings',
      active: true
    }
  ];

  // Load bookings data
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        // Nếu chưa có user id (đã tắt auth), fallback gọi tất cả bookings
        let response;
        if (user?.id || user?._id) {
          const employeeId = user?.id || user?._id;
          response = await bookingService.getBookingsByEmployee(employeeId, { limit: 50 });
        } else {
          response = await bookingService.getAllBookingsForEmployee();
        }
        setBookings(response.bookings || []);
      } catch (error) {
        console.error('Error loading bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user?.id]);

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    // Search filter
    const matchesSearch = !searchTerm || 
      booking.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesFilter = true;
    switch (filter) {
      case 'today':
        const today = new Date().toDateString();
        const bookingDate = new Date(booking.createdAt || booking.bookingDate).toDateString();
        matchesFilter = bookingDate === today;
        break;
      case 'pending':
        matchesFilter = booking.paymentStatus !== 'completed';
        break;
      case 'completed':
        matchesFilter = booking.paymentStatus === 'completed';
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600 text-white';
      case 'pending':
        return 'bg-yellow-600 text-white';
      case 'cancelled':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Đã thanh toán';
      case 'pending':
        return 'Chờ thanh toán';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
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
          Quản lý vé
        </h1>
        
        <p className="text-xl text-gray-400 font-normal">
          Danh sách vé do nhân viên {user?.name || 'Employee'} xử lý
        </p>
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
          
          {/* Right Panel - Main Content */}
          <div className="lg:col-span-9">
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo mã vé, tên phim, khách hàng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  
                  {/* Filter */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'all' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilter('today')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'today' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Hôm nay
                    </button>
                    <button
                      onClick={() => setFilter('pending')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'pending' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Chờ thanh toán
                    </button>
                    <button
                      onClick={() => setFilter('completed')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'completed' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Đã thanh toán
                    </button>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Danh sách vé ({filteredBookings.length})
                  </h3>
                  <div className="text-sm text-gray-400">
                    Nhân viên: {user?.name || 'Employee'}
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="text-gray-400 mt-2">Đang tải...</p>
                  </div>
                ) : filteredBookings.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBookings.map((booking, index) => (
                      <div key={booking._id || index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                #{booking.bookingNumber || 'N/A'}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">
                                {booking.showtime?.movie?.title || 'Phim không xác định'}
                              </h4>
                              <p className="text-gray-400 text-sm">
                                {booking.showtime?.startTime ? new Date(booking.showtime.startTime).toLocaleString('vi-VN') : 'N/A'}
                              </p>
                              <p className="text-gray-400 text-sm">
                                Khách hàng: {booking.customerName || 'Không xác định'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-white font-bold text-lg">
                              {booking.totalAmount?.toLocaleString()} VNĐ
                            </p>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              getStatusBadge(booking.paymentStatus)
                            }`}>
                              {getStatusText(booking.paymentStatus)}
                            </span>
                            <p className="text-gray-400 text-xs mt-1">
                              {booking.createdAt ? new Date(booking.createdAt).toLocaleString('vi-VN') : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Booking Details */}
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Rạp:</span>
                              <span className="text-white ml-2">{booking.showtime?.branch?.name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Phòng:</span>
                              <span className="text-white ml-2">{booking.showtime?.theater?.name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Ghế:</span>
                              <span className="text-white ml-2">
                                {booking.seats?.map(seat => seat.name || seat.seatNumber).join(', ') || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">🎫</span>
                    </div>
                    <p className="text-gray-400">Không có vé nào</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {searchTerm ? 'Không tìm thấy vé phù hợp' : 'Chưa có vé nào được tạo'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeBookingsPage;