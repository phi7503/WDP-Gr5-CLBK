import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerBookingHistory = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [bookings, setBookings] = useState([]);

  // Fake data để test giao diện
  useEffect(() => {
    const fakeBookings = [
      {
        _id: 'booking1',
        movie: {
          title: 'The Dark Knight Rises',
          poster: 'https://via.placeholder.com/200x300?text=Dark+Knight',
          genre: 'Action, Crime, Drama'
        },
        showtime: {
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 ngày tới
          branch: { name: 'CGV Vincom Center Ba Đình' },
          theater: { name: 'Phòng 5 - IMAX' }
        },
        seats: [
          { row: 'A', number: 1 },
          { row: 'A', number: 2 }
        ],
        totalAmount: 250000,
        bookingStatus: 'confirmed',
        paymentStatus: 'completed',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 ngày trước
        checkedIn: false
      },
      {
        _id: 'booking2',
        movie: {
          title: 'Inception',
          poster: 'https://via.placeholder.com/200x300?text=Inception',
          genre: 'Action, Sci-Fi, Thriller'
        },
        showtime: {
          startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 ngày tới
          branch: { name: 'BHD Star Cineplex Royal City' },
          theater: { name: 'Phòng 3' }
        },
        seats: [
          { row: 'C', number: 5 },
          { row: 'C', number: 6 },
          { row: 'C', number: 7 }
        ],
        totalAmount: 375000,
        bookingStatus: 'confirmed',
        paymentStatus: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 ngày trước
        checkedIn: false
      },
      {
        _id: 'booking3',
        movie: {
          title: 'Interstellar',
          poster: 'https://via.placeholder.com/200x300?text=Interstellar',
          genre: 'Adventure, Drama, Sci-Fi'
        },
        showtime: {
          startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 ngày trước (đã xem)
          branch: { name: 'Lotte Cinema Đống Đa' },
          theater: { name: 'Phòng 2' }
        },
        seats: [
          { row: 'B', number: 3 },
          { row: 'B', number: 4 }
        ],
        totalAmount: 250000,
        bookingStatus: 'completed',
        paymentStatus: 'completed',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 ngày trước
        checkedIn: true
      },
      {
        _id: 'booking4',
        movie: {
          title: 'Avatar: The Way of Water',
          poster: 'https://via.placeholder.com/200x300?text=Avatar',
          genre: 'Action, Adventure, Fantasy'
        },
        showtime: {
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 ngày tới
          branch: { name: 'CGV Vincom Center Times City' },
          theater: { name: 'Phòng 1 - 4DX' }
        },
        seats: [
          { row: 'D', number: 8 },
          { row: 'D', number: 9 }
        ],
        totalAmount: 320000,
        bookingStatus: 'confirmed',
        paymentStatus: 'completed',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 ngày trước
        checkedIn: false
      },
      {
        _id: 'booking5',
        movie: {
          title: 'Top Gun: Maverick',
          poster: 'https://via.placeholder.com/200x300?text=Top+Gun',
          genre: 'Action, Drama'
        },
        showtime: {
          startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 ngày trước (đã xem)
          branch: { name: 'Galaxy Cinema Nguyễn Du' },
          theater: { name: 'Phòng 4' }
        },
        seats: [
          { row: 'E', number: 12 },
          { row: 'E', number: 13 },
          { row: 'E', number: 14 }
        ],
        totalAmount: 450000,
        bookingStatus: 'completed',
        paymentStatus: 'completed',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 ngày trước
        checkedIn: true
      }
    ];
    setBookings(fakeBookings);
  }, []);

  const filters = [
    { key: 'all', label: 'Tất Cả' },
    { key: 'upcoming', label: 'Sắp Tới' },
    { key: 'watched', label: 'Đã Xem' }
  ];

  const getBookingStatus = (booking) => {
    const now = new Date();
    const showtime = new Date(booking.showtime.startTime);
    
    if (booking.checkedIn) return 'watched';
    if (showtime > now) return 'upcoming';
    return 'watched';
  };

  const filteredBookings = bookings.filter(booking => {
    const status = getBookingStatus(booking);
    return activeFilter === 'all' || status === activeFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'watched': return 'bg-green-600';
      case 'upcoming': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'watched': return 'Đã xem';
      case 'upcoming': return 'Sắp tới';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="min-h-screen bg-black py-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-red-600 rounded mr-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Lịch Sử Đặt Vé</h1>
        </div>
        
        <p className="text-gray-400 text-lg">
          Quản lý và xem lại tất cả các vé phim của bạn
        </p>

        {/* Filter Buttons */}
        <div className="flex gap-4 mt-6">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const status = getBookingStatus(booking);
            const isUpcoming = status === 'upcoming';
            
            return (
              <div key={booking._id} className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
                <div className="flex items-start gap-6">
                  {/* Movie Poster */}
                  <div className="flex-shrink-0">
                    <img
                      src={booking.movie.poster}
                      alt={booking.movie.title}
                      className="w-24 h-36 object-cover rounded-lg"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {booking.movie.title}
                        </h3>
                        
                        <div className="flex items-center text-gray-400 mb-4">
                          <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span>{booking.showtime.branch.name}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-white">
                            <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {formatDate(booking.showtime.startTime)}
                          </div>
                          
                          <div className="flex items-center text-white">
                            <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {formatTime(booking.showtime.startTime)}
                          </div>
                          
                          <div className="text-white">
                            Ghế: {booking.seats.map(s => `${s.row}${s.number}`).join(', ')}
                          </div>
                          
                          <div className="text-red-600 font-bold">
                            {booking.totalAmount.toLocaleString()} ₫
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                        
                        <div className="flex gap-2">
                          {status === 'watched' && (
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              Tải Vé
                            </button>
                          )}
                          
                          {isUpcoming && (
                            <button 
                              onClick={() => navigate(`/customer/ticket-details/${booking._id}`)}
                              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              Xem Chi Tiết
                            </button>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => navigate(`/customer/ticket-details/${booking._id}`)}
                          className="text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          Chi Tiết &gt;
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">Không có vé nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerBookingHistory;
