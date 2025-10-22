import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/app.context';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/BookingService';

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    todayRevenue: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const sidebarItems = [
    {
      text: 'Dashboard',
      icon: '🏠',
      path: '/employee/dashboard',
      active: true
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
      active: false
    }
  ];

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        let bookings = [];
        
        // Load recent bookings
        try {
          const bookingsResponse = await bookingService.getAllBookingsForEmployee();
          bookings = bookingsResponse.bookings || [];
          setRecentBookings(bookings);
        } catch (bookingError) {
          console.error('Error loading bookings:', bookingError);
          setRecentBookings([]);
        }
        
        // Calculate stats from real data
        const totalBookings = bookings.length;
        const todayBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt || booking.bookingDate);
          const today = new Date();
          return bookingDate.toDateString() === today.toDateString();
        }).length;
        
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
        const todayRevenue = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt || booking.bookingDate);
          const today = new Date();
          return bookingDate.toDateString() === today.toDateString();
        }).reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
        
        setStats({
          totalBookings,
          todayBookings,
          totalRevenue,
          todayRevenue
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set fallback data - all zeros if no data
        setStats({
          totalBookings: 0,
          todayBookings: 0,
          totalRevenue: 0,
          todayRevenue: 0
        });
        setRecentBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

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
          Employee Dashboard
        </h1>
        
        <p className="text-xl text-gray-400 font-normal">
          Quản lý hệ thống đặt vé chuyên nghiệp
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
            <div className="grid grid-cols-1 gap-6">
              {/* Welcome Card */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
          {user?.name?.charAt(0).toUpperCase() || 'E'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">
                        Chào mừng, {user?.name || 'Employee'}!
                      </h2>
                      <p className="text-gray-400 mb-1">
                        {user?.email}
                      </p>
                      <p className="text-gray-400">
                        Vai trò: {user?.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Hôm nay</p>
                    <p className="text-white font-bold text-lg">
                      {new Date().toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col h-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">🎫</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-sm mb-2">Tổng vé đã bán</p>
                    <p className="text-2xl font-bold text-white mb-2">{stats.totalBookings}</p>
                    <span className="text-green-400 text-sm">
                      {stats.todayBookings > 0 ? `+${stats.todayBookings} hôm nay` : 'Chưa có vé hôm nay'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col h-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">💰</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-sm mb-2">Doanh thu tổng</p>
                    <p className="text-2xl font-bold text-white mb-2">{stats.totalRevenue.toLocaleString()} VNĐ</p>
                    <span className="text-green-400 text-sm">
                      {stats.todayRevenue > 0 ? `+${stats.todayRevenue.toLocaleString()} VNĐ hôm nay` : 'Chưa có doanh thu hôm nay'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col h-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">📅</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-sm mb-2">Vé hôm nay</p>
                    <p className="text-2xl font-bold text-white mb-2">{stats.todayBookings}</p>
                    <span className="text-gray-400 text-sm">Đã bán trong ngày</span>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col h-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">📊</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-sm mb-2">Doanh thu hôm nay</p>
                    <p className="text-2xl font-bold text-white mb-2">{stats.todayRevenue.toLocaleString()} VNĐ</p>
                    <span className="text-gray-400 text-sm">Thu nhập trong ngày</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center flex flex-col h-full">
                  <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🎬</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Đặt vé cho khách
                  </h3>
                  <p className="text-gray-400 mb-6 text-sm flex-grow">
                    Hỗ trợ khách hàng đặt vé nhanh chóng
                  </p>
                  <button
                    onClick={() => navigate('/employee/book-ticket')}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium mt-auto"
                  >
                    Bắt đầu đặt vé
                  </button>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center flex flex-col h-full">
                  <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📱</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Quét QR vé
                  </h3>
                  <p className="text-gray-400 mb-6 text-sm flex-grow">
                    Kiểm tra và xác nhận vé của khách hàng
                  </p>
                  <button
                    onClick={() => navigate('/employee/qr-checkin')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-auto"
                  >
                    Quét mã QR
                  </button>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center flex flex-col h-full">
                  <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🎫</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Quản lý vé
                  </h3>
                  <p className="text-gray-400 mb-6 text-sm flex-grow">
                    Xem và quản lý tất cả vé đã bán
                  </p>
                  <button
                    onClick={() => navigate('/employee/bookings')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium mt-auto"
                  >
                    Quản lý vé
                  </button>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Vé gần đây</h3>
                  <button
                    onClick={() => navigate('/employee/bookings')}
                    className="text-red-600 hover:text-red-500 text-sm font-medium"
                  >
                    Xem tất cả →
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="text-gray-400 mt-2">Đang tải...</p>
                  </div>
                ) : recentBookings.length > 0 ? (
                  <div className="space-y-3">
                    {recentBookings.slice(0, 5).map((booking, index) => (
                      <div key={booking._id || index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">#{booking.bookingNumber || 'N/A'}</span>
                          </div>
                      <div>
                        <p className="text-white font-medium">{booking.showtime?.movie?.title || 'Phim không xác định'}</p>
                        <p className="text-gray-400 text-sm">
                          {booking.showtime?.startTime ? new Date(booking.showtime.startTime).toLocaleString('vi-VN') : 'N/A'}
                        </p>
                      </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{booking.totalAmount?.toLocaleString()} VNĐ</p>
                          <span className={`px-2 py-1 rounded text-xs ${
                            booking.paymentStatus === 'completed' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-yellow-600 text-white'
                          }`}>
                            {booking.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">🎫</span>
                    </div>
                    <p className="text-gray-400">Chưa có vé nào</p>
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

export default EmployeeDashboardPage; 