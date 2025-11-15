import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Space, message, notification, Modal, Input, Select, Steps, Badge } from 'antd';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, CreditCardOutlined, CheckOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import Header from './Header';
import Footer from './Footer';
import { showtimeAPI, seatAPI, seatStatusAPI, bookingAPI, comboAPI, voucherAPI, BACKEND_URL } from '../services/api';
import { useAuth } from '../context/app.context';
import '../booking-animations.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const BookingPageModern = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef = useRef(null);
  const selectedSeatsRef = useRef([]);
  const hasSyncedSeatsRef = useRef(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Keep ref in sync with state
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);
  const [seats, setSeats] = useState([]);
  const [showtime, setShowtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [combos, setCombos] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // ✅ Hệ thống phân hạng ghế theo giá VNĐ
  const getSeatCategory = (price) => {
    if (price >= 200000) {
      return {
        name: 'DIAMOND VIP',
        icon: '💎',
        color: '#9333ea',
        bgColor: 'linear-gradient(135deg, #9333ea, #7c3aed)',
        description: 'Ghế massage, recliner cao cấp'
      };
    } else if (price >= 150000) {
      return {
        name: 'PLATINUM',
        icon: '👑',
        color: '#6b7280',
        bgColor: 'linear-gradient(135deg, #6b7280, #4b5563)',
        description: 'Ghế da cao cấp, tựa lưng điện'
      };
    } else if (price >= 100000) {
      return {
        name: 'GOLD VIP',
        icon: '🥇',
        color: '#f59e0b',
        bgColor: 'linear-gradient(135deg, #f59e0b, #d97706)',
        description: 'Ghế VIP rộng rãi, thoải mái'
      };
    } else if (price >= 70000) {
      return {
        name: 'SILVER',
        icon: '🥈',
        color: '#10b981',
        bgColor: 'linear-gradient(135deg, #10b981, #059669)',
        description: 'Ghế thoải mái, vị trí tốt'
      };
    } else {
      return {
        name: 'STANDARD',
        icon: '🎬',
        color: '#3b82f6',
        bgColor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        description: 'Ghế tiêu chuẩn'
      };
    }
  };

  // Initialize socket connection
  useEffect(() => {
    if (showtimeId) {
      const initTimer = setTimeout(() => {
        initializeSocket();
      }, 100);
      
      return () => {
        clearTimeout(initTimer);
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [showtimeId, user]);

  // Load showtime data when component mounts
  useEffect(() => {
    if (showtimeId) {
      loadShowtimeData();
      loadCombos();
    }
  }, [showtimeId]);

  // Sync selected seats with backend after socket connects (only once after restore)
  useEffect(() => {
    if (socketConnected && selectedSeats.length > 0 && showtimeId && !hasSyncedSeatsRef.current) {
      // Chỉ sync một lần sau khi restore từ backend
      const syncTimer = setTimeout(() => {
        console.log('🔄 Syncing', selectedSeats.length, 'restored seats with backend');
        if (socketRef.current) {
          socketRef.current.emit('select-seats', {
            showtimeId,
            seatIds: selectedSeats
          });
          hasSyncedSeatsRef.current = true;
        }
      }, 1000);
      
      return () => clearTimeout(syncTimer);
    }
  }, [socketConnected, selectedSeats.length, showtimeId]); // Chỉ sync khi socket connect và có ghế được restore
  
  // Reset sync flag when showtime changes
  useEffect(() => {
    hasSyncedSeatsRef.current = false;
  }, [showtimeId]);

  // Update customer info when user loads
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const initializeSocket = () => {
    // Disconnect existing socket if any
    if (socketRef.current) {
      console.log('🔄 Disconnecting existing socket before reconnecting');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socketOptions = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    };
    
    const token = localStorage.getItem('token');
    const currentUser = user;
    
    if (token) {
      socketOptions.auth = { token };
      console.log('🔑 Initializing socket with token for user:', currentUser?.name || 'Unknown');
    } else {
      console.log('👤 Initializing socket as guest (no token)');
    }
    
    socketRef.current = io(BACKEND_URL, socketOptions);

    socketRef.current.on('connect', () => {
      console.log('🔌 Connected to server', token ? `(Authenticated as: ${currentUser?.name || 'Unknown'})` : '(Guest)');
      setSocketConnected(true);
      
      // Join showtime room
      console.log('🚪 Joining showtime room:', showtimeId);
      socketRef.current.emit('join-showtime', showtimeId);
      
      // Re-sync selected seats with backend after reconnection
      const currentSelectedSeats = selectedSeatsRef.current;
      if (currentSelectedSeats.length > 0) {
        console.log('🔄 Re-syncing', currentSelectedSeats.length, 'selected seats after reconnection');
        socketRef.current.emit('select-seats', {
          showtimeId,
          seatIds: currentSelectedSeats
        });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setSocketConnected(false);
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      setSocketConnected(true);
      
      // Rejoin room and re-sync seats after reconnect
      if (showtimeId) {
        socketRef.current.emit('join-showtime', showtimeId);
        
        const currentSelectedSeats = selectedSeatsRef.current;
        if (currentSelectedSeats.length > 0) {
          console.log('🔄 Re-syncing', currentSelectedSeats.length, 'selected seats after reconnect');
          socketRef.current.emit('select-seats', {
            showtimeId,
            seatIds: currentSelectedSeats
          });
        }
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setSocketConnected(false);
    });

    // Listen for active users list when joining
    socketRef.current.on('active-users-list', (data) => {
      console.log('📋 Received active users list:', data);
      if (data.users && Array.isArray(data.users)) {
        setActiveUsers(data.users);
        console.log(`✅ Loaded ${data.users.length} active users`);
      }
    });

    // Listen for user join events
    socketRef.current.on('user-joined', (data) => {
      console.log('👥 User joined:', data);
      // Add new user to active users list
      setActiveUsers(prev => {
        // Check if user already exists (by userId)
        const exists = prev.some(u => u.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
      
      const userTypeText = data.isGuest ? 'Guest' : 'User';
      message.info({
        content: `${userTypeText} "${data.userName}" đã vào phòng`,
        duration: 2,
      });
    });

    socketRef.current.on('user-left', (data) => {
      console.log('👋 User left:', data);
      // Remove user from active users list
      setActiveUsers(prev => prev.filter(u => u.userId !== data.userId));
      
      const userTypeText = data.isGuest ? 'Guest' : 'User';
      message.info({
        content: `${userTypeText} "${data.userName}" đã rời phòng`,
        duration: 2,
      });
    });

    // Listen for seat selection events
    socketRef.current.on('seats-being-selected', (data) => {
      console.log('📍 Seats being selected by another user:', data);
      const currentUserId = currentUser?._id?.toString();
      const selectingUserId = data.userId?.toString() || data.userId;
      
      // Only update if selected by another user
      if (selectingUserId !== currentUserId && selectingUserId !== 'anonymous') {
        setSeats(prevSeats => {
          const currentSelected = selectedSeatsRef.current;
          return prevSeats.map(seat => {
            // Only update if not already selected by current user
            if (data.seatIds.includes(seat._id) && !currentSelected.includes(seat._id)) {
              return {
                ...seat,
                availability: {
                  ...seat.availability,
                  status: 'selecting'
                }
              };
            }
            return seat;
          });
        });
      }
    });

    socketRef.current.on('seats-released', (data) => {
      console.log('🔄 Seats released:', data);
      const currentUserId = currentUser?._id?.toString();
      const releasingUserId = data.userId?.toString() || data.userId;
      
      // Only update if released by another user or if it's our own release
      if (releasingUserId !== currentUserId || !currentUserId) {
        setSeats(prevSeats => {
          const currentSelected = selectedSeatsRef.current;
          return prevSeats.map(seat => {
            if (data.seatIds.includes(seat._id)) {
              // Only update to available if it's not our selected seat
              if (!currentSelected.includes(seat._id)) {
                return {
                  ...seat,
                  availability: {
                    ...seat.availability,
                    status: 'available'
                  }
                };
              }
            }
            return seat;
          });
        });
      } else {
        // Our own release - update both seats and selectedSeats
        setSeats(prevSeats => {
          return prevSeats.map(seat => {
            if (data.seatIds.includes(seat._id)) {
              return {
                ...seat,
                availability: {
                  ...seat.availability,
                  status: 'available'
                }
              };
            }
            return seat;
          });
        });
        // Remove from selected seats
        setSelectedSeats(prev => prev.filter(id => !data.seatIds.includes(id)));
      }
    });

    socketRef.current.on('seats-booked', (data) => {
      console.log('✅ Seats booked:', data);
      // Update seat status to 'booked'
      setSeats(prevSeats => {
        return prevSeats.map(seat => {
          if (data.seatIds.includes(seat._id)) {
            return {
              ...seat,
              occupied: true,
              availability: {
                ...seat.availability,
                status: 'booked'
              }
            };
          }
          return seat;
        });
      });
    });

    socketRef.current.on('seat-selection-success', (data) => {
      console.log('✅ Seat selection successful:', data);
    });

    socketRef.current.on('seat-selection-failed', (data) => {
      console.log('❌ Seat selection failed:', data);
      message.error(data.message || 'Không thể chọn ghế này');
      // Remove from selected seats
      setSelectedSeats(prev => prev.filter(id => !data.seatIds?.includes(id)));
    });
  };

  const loadShowtimeData = async () => {
    try {
      setLoading(true);
      console.log('Loading showtime data for ID:', showtimeId);
      
      // Load showtime details
      const showtimeResponse = await showtimeAPI.getShowtimeById(showtimeId);
      console.log('Showtime response:', showtimeResponse);
      
      if (showtimeResponse) {
        setShowtime(showtimeResponse);
      }
      
      // Load seat availability from real API
      const seatResponse = await seatAPI.getSeatAvailability(showtimeId);
      console.log('Seat response:', seatResponse);
      
      if (seatResponse && seatResponse.seats) {
        // Transform API response to match our component structure
        const transformedSeats = seatResponse.seats.map(seat => ({
          _id: seat._id,
          row: seat.row,
          number: seat.number,
          type: seat.type,
          occupied: false, // Will be determined by seat status
          availability: {
            status: 'available', // Default, will be updated by seat status
            price: seat.price || 0
          }
        }));
        
        console.log('Transformed seats:', transformedSeats);
        setSeats(transformedSeats);
        
        // Load seat status to get real availability
        try {
          const statusResponse = await seatStatusAPI.getSeatStatusByShowtime(showtimeId);
          console.log('Seat status response:', statusResponse);
          
          if (statusResponse && statusResponse.seatStatuses) {
            const currentUserId = user?._id?.toString();
            
            // Update seat availability based on status and restore user's selected seats
            const mySelectedSeats = [];
            const updatedSeats = transformedSeats.map(seat => {
              const seatStatus = statusResponse.seatStatuses.find(ss => 
                ss.seat?._id?.toString() === seat._id || 
                ss.seat?._id === seat._id
              );
              if (seatStatus) {
                // Check if this seat is selected by current user
                const isMySelection = (seatStatus.status === 'selecting' || seatStatus.status === 'reserved') &&
                                      seatStatus.reservedBy &&
                                      (seatStatus.reservedBy._id?.toString() === currentUserId || 
                                       seatStatus.reservedBy.toString() === currentUserId);
                
                if (isMySelection) {
                  mySelectedSeats.push(seat._id);
                  console.log('🔄 Restoring user selected seat:', seat._id);
                }
                
                return {
                  ...seat,
                  occupied: seatStatus.status === 'booked' || (seatStatus.status === 'reserved' && !isMySelection),
                  availability: {
                    status: seatStatus.status,
                    price: seatStatus.price || seat.availability.price
                  }
                };
              }
              return seat;
            });
            
            // Restore selected seats for current user
            if (mySelectedSeats.length > 0) {
              console.log('✅ Restoring', mySelectedSeats.length, 'selected seats for user');
              setSelectedSeats(mySelectedSeats);
            }
            
            console.log('Updated seats with status:', updatedSeats);
            setSeats(updatedSeats);
          }
        } catch (statusError) {
          console.error('Error loading seat status:', statusError);
          // Continue with basic seat data
        }
      } else {
        console.log('No seat data from API, using fallback');
        // Only use mock data as last resort
        const mockSeats = generateMockSeats();
        console.log('Generated mock seats:', mockSeats);
        setSeats(mockSeats);
      }
    } catch (error) {
      console.error('Error loading showtime data:', error);
      message.error('Failed to load showtime data. Please try again.');
      
      // Fallback to mock data
      setSeats(generateMockSeats());
    } finally {
      setLoading(false);
    }
  };

  const loadCombos = async () => {
    try {
      const combosResponse = await comboAPI.getCombos();
      if (combosResponse) {
        setCombos(combosResponse);
      }
    } catch (error) {
      console.error('Error loading combos:', error);
    }
  };

  const generateMockSeats = () => {
    const seats = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    
    rows.forEach((row, rowIndex) => {
      const seatsInRow = rowIndex < 2 ? 9 : 18;
      
      for (let i = 1; i <= seatsInRow; i++) {
        const seatId = `${row}${i}`;
        // Make most seats available (only 10% occupied)
        const isOccupied = Math.random() < 0.1;
        
        seats.push({
          _id: `seat-${row}-${i}`,
          row: row,
          number: i,
          occupied: isOccupied,
          availability: {
            status: isOccupied ? 'booked' : 'available',
            price: rowIndex < 2 ? 15 : 12
          }
        });
      }
    });
    
    console.log('Mock seats generated:', seats.length, 'total seats');
    console.log('Available seats:', seats.filter(s => !s.occupied).length);
    console.log('Occupied seats:', seats.filter(s => s.occupied).length);
    
    return seats;
  };

  const handleSeatClick = (seatId) => {
    console.log('Seat clicked:', seatId);
    const seat = seats.find(s => s._id === seatId);
    console.log('Found seat:', seat);
    
    // Check if seat is available (not booked, not reserved, not selecting)
    if (!seat || seat.occupied || 
        seat.availability?.status === 'booked' || 
        seat.availability?.status === 'reserved' ||
        (seat.availability?.status === 'selecting' && !selectedSeats.includes(seatId))) {
      if (seat?.availability?.status === 'selecting') {
        message.warning('Ghế này đang được người dùng khác chọn');
      } else if (seat?.availability?.status === 'reserved') {
        message.warning('Ghế này đã được giữ chỗ');
      } else if (seat?.occupied || seat?.availability?.status === 'booked') {
        message.warning('Ghế này đã được đặt');
      }
      return;
    }
    
    if (selectedSeats.includes(seatId)) {
      // Remove seat from selection
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
      console.log('Seat deselected:', seatId);
      
      // Release seat via socket
      if (socketRef.current && socketConnected) {
        socketRef.current.emit('release-seats', {
          showtimeId,
          seatIds: [seatId]
        });
      }
    } else {
      // Add seat to selection
      setSelectedSeats([...selectedSeats, seatId]);
      console.log('Seat selected:', seatId);
      
      // Lock seat via socket
      if (socketRef.current && socketConnected) {
        console.log('🔒 Emitting select-seats for:', seatId);
        socketRef.current.emit('select-seats', {
          showtimeId,
          seatIds: [seatId]
        });
        
        // Optimistically update seat status
        setSeats(prevSeats => {
          return prevSeats.map(s => {
            if (s._id === seatId) {
              return {
                ...s,
                availability: {
                  ...s.availability,
                  status: 'selecting'
                }
              };
            }
            return s;
          });
        });
      } else {
        console.log('❌ Socket not connected or not available');
      }
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) {
      message.warning('Please select at least one seat');
      return;
    }
    setBookingModalVisible(true);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      message.warning('Please enter a voucher code');
      return;
    }
    
    try {
      const voucher = await voucherAPI.getVoucherByCode(voucherCode);
      setAppliedVoucher(voucher);
      message.success('Voucher applied successfully!');
    } catch (error) {
      message.error('Invalid voucher code');
      setAppliedVoucher(null);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Calculate seat prices
    selectedSeats.forEach(seatId => {
      const seat = seats.find(s => s._id === seatId);
      if (seat && seat.availability) {
        total += seat.availability.price || 0;
      }
    });
    
    // Add combo prices
    selectedCombos.forEach(combo => {
      total += combo.price * combo.quantity;
    });
    
    // Apply voucher discount
    if (appliedVoucher) {
      if (appliedVoucher.discountType === 'percentage') {
        total = total * (1 - appliedVoucher.discountValue / 100);
      } else {
        total = Math.max(0, total - appliedVoucher.discountValue);
      }
    }
    
    return total;
  };

  const handleCreateBooking = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      message.error('Please fill in customer information');
      return;
    }
    
    try {
      const bookingData = {
        showtimeId: showtimeId,
        seatIds: selectedSeats,
        combos: selectedCombos,
        voucherId: appliedVoucher?._id,
        customerInfo: customerInfo
      };
      
      const response = await bookingAPI.createBooking(bookingData);
      
      if (response.success) {
        message.success('Booking created successfully!');
        setBookingModalVisible(false);
        // Navigate to payment page or show booking details
        navigate(`/booking-details/${response.booking._id}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      
      // Hiển thị message lỗi cụ thể từ server
      const errorMessage = error.message || 'Failed to create booking. Please try again.';
      
      // Kiểm tra các loại lỗi cụ thể - sử dụng notification thay vì message
      if (errorMessage.includes('đã bắt đầu') || errorMessage.includes('đã kết thúc') || errorMessage.includes('has started') || errorMessage.includes('has ended')) {
        // Chỉ reload khi suất chiếu đã bắt đầu/kết thúc - cho người dùng thời gian đọc
        notification.error({
          message: 'Lỗi',
          description: errorMessage,
          placement: 'topRight',
          duration: 6,
          onClose: () => {
            // Reload sau khi notification đóng
            window.location.reload();
          }
        });
        setBookingModalVisible(false);
      } else if (errorMessage.includes('no longer available') || errorMessage.includes('không còn khả dụng')) {
        notification.warning({
          message: 'Cảnh báo',
          description: 'Một số ghế đã được đặt bởi người khác. Vui lòng chọn ghế khác.',
          placement: 'topRight',
          duration: 5,
        });
      } else {
        notification.error({
          message: 'Lỗi',
          description: errorMessage,
          placement: 'topRight',
          duration: 5,
        });
      }
    }
  };

  // Helper function to get seat category color based on price
  const getSeatCategoryColor = (price) => {
    if (price >= 200000) {
      return {
        bg: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
        border: '#c084fc',
        color: '#fff',
        glow: 'rgba(147, 51, 234, 0.5)'
      };
    } else if (price >= 150000) {
      return {
        bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        border: '#9ca3af',
        color: '#fff',
        glow: 'rgba(107, 114, 128, 0.5)'
      };
    } else if (price >= 100000) {
      return {
        bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        border: '#fcd34d',
        color: '#fff',
        glow: 'rgba(245, 158, 11, 0.5)'
      };
    } else if (price >= 70000) {
      return {
        bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        border: '#6ee7b7',
        color: '#fff',
        glow: 'rgba(16, 185, 129, 0.5)'
      };
    } else {
      return {
        bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        border: '#93c5fd',
        color: '#fff',
        glow: 'rgba(59, 130, 246, 0.5)'
      };
    }
  };

  const getSeatStyle = (seat) => {
    console.log('Getting style for seat:', seat._id, 'occupied:', seat.occupied, 'status:', seat.availability?.status);
    
    const status = seat.availability?.status || (seat.occupied ? 'booked' : 'available');
    const seatPrice = seat.availability?.price || seat.price || 50000;
    const categoryColors = getSeatCategoryColor(seatPrice);
    
    if (status === 'booked' || status === 'reserved') {
      return {
        background: '#4B5563',
        border: '1px solid #6B7280',
        cursor: 'not-allowed',
        opacity: 0.6,
        pointerEvents: 'none'
      };
    }
    
    // Seat is being selected by another user
    if (status === 'selecting' && !selectedSeats.includes(seat._id)) {
      return {
        background: '#F59E0B',
        border: '2px solid #D97706',
        color: '#fff',
        cursor: 'not-allowed',
        opacity: 0.8,
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.5)'
      };
    }
    
    if (selectedSeats.includes(seat._id)) {
      return {
        background: '#DC2626',
        border: '2px solid #DC2626',
        color: '#fff',
        cursor: 'pointer',
        pointerEvents: 'auto',
        transform: 'scale(1.05)',
        boxShadow: '0 4px 16px rgba(220, 38, 38, 0.6)',
        fontWeight: 'bold'
      };
    }
    
    // Available seat - color based on seat category (price)
    return {
      background: categoryColors.bg,
      border: `2px solid ${categoryColors.border}`,
      color: categoryColors.color,
      cursor: 'pointer',
      pointerEvents: 'auto',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: `0 2px 8px ${categoryColors.glow}`,
      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
    };
  };

  const resetSeatSelection = () => {
    setSelectedSeats([]);
    message.info('Seat selection reset');
  };

  // Show loading state
  if (loading) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: '18px' }}>
            Loading booking information...
          </div>
        </Content>
        <Footer />
      </Layout>
    );
  }

  // Show error state if no showtime data
  if (!showtime && !seats.length) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: '18px' }}>
            Showtime not found or failed to load
          </div>
          <Link to="/movies" style={{ color: '#ff4d4f', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>
            ← Back to Movies
          </Link>
        </Content>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Progress Steps - Enhanced */}
          <Card
            style={{ 
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              border: '2px solid #DC2626',
              borderRadius: '16px',
              marginBottom: '32px',
              boxShadow: '0 8px 32px rgba(220, 38, 38, 0.2)'
            }}
            bodyStyle={{ padding: '32px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={3} style={{ 
                color: '#fff', 
                marginBottom: '8px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                🎬 Booking Progress
              </Title>
              <Text style={{ color: '#ccc', fontSize: '16px' }}>
                Follow these steps to complete your booking
              </Text>
            </div>
            
            <Steps
              current={2}
              size="default"
              style={{ marginBottom: '0' }}
              className="enhanced-steps"
            >
              <Step 
                title={
                  <span style={{ 
                    color: '#DC2626', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    Chọn rạp
                  </span>
                }
                icon={
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #DC2626, #991B1B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                    border: '2px solid #fff'
                  }}>
                    <CheckCircleOutlined style={{ color: '#fff', fontSize: '16px' }} />
                  </div>
                }
                status="finish"
              />
              <Step 
                title={
                  <span style={{ 
                    color: '#DC2626', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    Chọn suất
                  </span>
                }
                icon={
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #DC2626, #991B1B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                    border: '2px solid #fff'
                  }}>
                    <CheckCircleOutlined style={{ color: '#fff', fontSize: '16px' }} />
                  </div>
                }
                status="finish"
              />
              <Step 
                title={
                  <span style={{ 
                    color: '#DC2626', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    Chọn ghế
                  </span>
                }
                icon={
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #DC2626, #991B1B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(220, 38, 38, 0.6)',
                    border: '3px solid #fff',
                    animation: 'pulse 2s infinite'
                  }}>
                    <UserOutlined style={{ color: '#fff', fontSize: '18px' }} />
                  </div>
                }
                status="process"
              />
              <Step 
                title={
                  <span style={{ 
                    color: '#999', 
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    Combo & Voucher
                  </span>
                }
                icon={
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #666'
                  }}>
                    <ClockCircleOutlined style={{ color: '#999', fontSize: '16px' }} />
                  </div>
                }
                status="wait"
              />
              <Step 
                title={
                  <span style={{ 
                    color: '#999', 
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    Thanh toán
                  </span>
                }
                icon={
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #666'
                  }}>
                    <CreditCardOutlined style={{ color: '#999', fontSize: '16px' }} />
                  </div>
                }
                status="wait"
              />
              <Step 
                title={
                  <span style={{ 
                    color: '#999', 
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    Xác nhận
                  </span>
                }
                icon={
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #666'
                  }}>
                    <CheckOutlined style={{ color: '#999', fontSize: '16px' }} />
                  </div>
                }
                status="wait"
              />
            </Steps>
          </Card>

          <Row gutter={[32, 32]}>
            {/* Seat Selection - Left Column (70%) */}
            <Col xs={24} lg={17}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  minHeight: '600px'
                }}
                bodyStyle={{ padding: '32px' }}
              >
                <Title level={3} style={{ color: '#fff', marginBottom: '32px', textAlign: 'center' }}>
                  🎬 Select Your Seat
                </Title>
                
                {/* 3D Screen */}
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '40px',
                  position: 'relative'
                }}>
                  <div className="screen-3d" style={{
                    width: '80%',
                    height: '60px',
                    background: 'linear-gradient(to bottom, #DC2626, #991B1B)',
                    clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(220, 38, 38, 0.4)',
                    borderRadius: '4px'
                  }}>
                    <Text style={{ 
                      color: '#fff', 
                      fontSize: '18px', 
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      MÀN HÌNH
                    </Text>
                  </div>
                </div>
                
                {/* Seat Layout */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '40px'
                }}>
                  {seats.length > 0 ? (
                    // Group seats by row
                    Object.entries(
                      seats.reduce((acc, seat) => {
                        if (!acc[seat.row]) acc[seat.row] = [];
                        acc[seat.row].push(seat);
                        return acc;
                      }, {})
                    ).map(([row, rowSeats]) => (
                      <div key={row} className="seat-row" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        {/* Row Label */}
                        <div style={{ 
                          width: '32px', 
                          textAlign: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          {row}
                        </div>
                        
                        {/* Seats */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {rowSeats
                            .sort((a, b) => a.number - b.number)
                            .map((seat, index) => (
                              <div
                                key={seat._id}
                                className={`${!seat.occupied && seat.availability?.status === 'available' && !selectedSeats.includes(seat._id) ? 'seat-available' : ''} ${selectedSeats.includes(seat._id) ? 'seat-selected' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSeatClick(seat._id);
                                }}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '6px 6px 2px 2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  position: 'relative',
                                  zIndex: 1,
                                  userSelect: 'none',
                                  ...getSeatStyle(seat)
                                }}
                                onMouseEnter={(e) => {
                                  const status = seat.availability?.status || (seat.occupied ? 'booked' : 'available');
                                  if (status === 'available' && !selectedSeats.includes(seat._id)) {
                                    const seatPrice = seat.availability?.price || seat.price || 50000;
                                    const categoryColors = getSeatCategoryColor(seatPrice);
                                    e.currentTarget.style.transform = 'scale(1.15) translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 6px 20px ${categoryColors.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`;
                                    e.currentTarget.style.borderWidth = '3px';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  const status = seat.availability?.status || (seat.occupied ? 'booked' : 'available');
                                  if (status === 'available' && !selectedSeats.includes(seat._id)) {
                                    const seatPrice = seat.availability?.price || seat.price || 50000;
                                    const categoryColors = getSeatCategoryColor(seatPrice);
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = `0 2px 8px ${categoryColors.glow}`;
                                    e.currentTarget.style.borderWidth = '2px';
                                  }
                                }}
                                aria-label={`Ghế ${seat.row}${seat.number}, ${seat.occupied ? 'đã đặt' : 'còn trống'}, giá ${((seat.availability?.price || 0) * 24000).toLocaleString('vi-VN')}đ`}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSeatClick(seat._id);
                                  }
                                }}
                              >
                                {seat.number}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      No seats available for this showtime
                    </div>
                  )}
                </div>
                
                {/* Legend */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '24px',
                  marginBottom: '32px',
                  flexWrap: 'wrap',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  border: '1px solid #333'
                }}>
                  <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: '2px solid #93c5fd',
                      borderRadius: '4px 4px 1px 1px',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.4)'
                    }} />
                    <Text style={{ color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Ghế trống (theo hạng)</Text>
                  </div>
                  
                  <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      background: '#DC2626',
                      border: '2px solid #DC2626',
                      borderRadius: '4px 4px 1px 1px',
                      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.6)',
                      transform: 'scale(1.1)'
                    }} />
                    <Text style={{ color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Ghế đang chọn</Text>
                  </div>
                  
                  <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      background: '#4B5563',
                      border: '1px solid #6B7280',
                      borderRadius: '4px 4px 1px 1px',
                      opacity: 0.6
                    }} />
                    <Text style={{ color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Ghế đã đặt</Text>
                  </div>
                </div>

                {/* Seat Categories Legend */}
                <div style={{ 
                  marginBottom: '32px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  border: '1px solid #333'
                }}>
                  <Text style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'block', textAlign: 'center' }}>
                    📋 Hạng ghế theo giá
                  </Text>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                    gap: '12px' 
                  }}>
                    {[
                      { 
                        price: 250000, 
                        name: 'DIAMOND', 
                        icon: '💎', 
                        color: '#9333ea',
                        bgGradient: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                        borderColor: '#c084fc',
                        glowColor: 'rgba(147, 51, 234, 0.5)'
                      },
                      { 
                        price: 180000, 
                        name: 'PLATINUM', 
                        icon: '👑', 
                        color: '#e5e7eb',
                        bgGradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                        borderColor: '#9ca3af',
                        glowColor: 'rgba(107, 114, 128, 0.5)'
                      },
                      { 
                        price: 120000, 
                        name: 'GOLD VIP', 
                        icon: '🥇', 
                        color: '#fbbf24',
                        bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        borderColor: '#fcd34d',
                        glowColor: 'rgba(245, 158, 11, 0.5)'
                      },
                      { 
                        price: 80000, 
                        name: 'SILVER', 
                        icon: '🥈', 
                        color: '#34d399',
                        bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderColor: '#6ee7b7',
                        glowColor: 'rgba(16, 185, 129, 0.5)'
                      },
                      { 
                        price: 50000, 
                        name: 'STANDARD', 
                        icon: '🎬', 
                        color: '#60a5fa',
                        bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        borderColor: '#93c5fd',
                        glowColor: 'rgba(59, 130, 246, 0.5)'
                      }
                    ].map((category, index) => (
                      <div 
                        key={index} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 16px',
                          background: category.bgGradient,
                          borderRadius: '8px',
                          border: `2px solid ${category.borderColor}`,
                          boxShadow: `0 4px 12px ${category.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                          transition: 'all 0.3s ease',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 6px 20px ${category.glowColor}, inset 0 1px 0 rgba(255,255,255,0.3)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${category.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`;
                        }}
                      >
                        <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                          {category.icon}
                        </span>
                        <div>
                          <div style={{ 
                            color: '#fff', 
                            fontWeight: 'bold', 
                            fontSize: '12px',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            letterSpacing: '0.5px'
                          }}>
                            {category.name}
                          </div>
                          <div style={{ 
                            color: '#fff', 
                            fontSize: '11px',
                            fontWeight: '600',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            opacity: 0.95
                          }}>
                            {category.price.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                  <Button 
                    onClick={resetSeatSelection}
                    size="large"
                    style={{ 
                      background: 'transparent',
                      border: '2px solid #fff',
                      color: '#fff',
                      height: '48px',
                      padding: '0 32px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Chọn lại
                  </Button>
                  <Button 
                    type="primary" 
                    size="large"
                    className="btn-primary-modern"
                    disabled={selectedSeats.length === 0}
                    onClick={handleProceedToCheckout}
                    style={{ 
                      height: '48px', 
                      padding: '0 48px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #DC2626, #991B1B)',
                      border: 'none',
                      boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)'
                    }}
                  >
                    Tiếp tục →
                  </Button>
                </div>
              </Card>
            </Col>

            {/* Summary Panel - Right Column (30%) */}
            <Col xs={24} lg={7}>
              <div className="summary-panel summary-panel-sticky" style={{
                position: 'sticky',
                top: '100px',
                background: '#1A1A1A',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <Title level={4} style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
                  📋 Tóm tắt đơn hàng
                </Title>
                
                {/* Movie Info */}
                {showtime && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      {showtime.movie?.poster && (
                        <img 
                          src={showtime.movie.poster} 
                          alt={showtime.movie.title}
                          style={{ 
                            width: '60px', 
                            height: '80px', 
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      )}
                      <div>
                        <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block' }}>
                          {showtime.movie?.title}
                        </Text>
                        <Text style={{ color: '#999', fontSize: '14px' }}>
                          {showtime.theater?.name} - {showtime.branch?.name}
                        </Text>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ color: '#ccc' }}>
                        <strong style={{ color: '#fff' }}>Suất chiếu:</strong> {new Date(showtime.startTime).toLocaleString('vi-VN')}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ color: '#ccc' }}>
                        <strong style={{ color: '#fff' }}>Phòng chiếu:</strong> {showtime.theater?.name}
                      </Text>
                    </div>
                  </div>
                )}
                
                {/* Selected Seats */}
                <div style={{ marginBottom: '24px' }}>
                  <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block', marginBottom: '12px' }}>
                    Ghế đã chọn:
                  </Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedSeats.length > 0 ? (
                      selectedSeats.map(seatId => {
                        const seat = seats.find(s => s._id === seatId);
                        return (
                          <Badge 
                            key={seatId}
                            className="seat-badge"
                            count={seat?.number}
                            style={{ 
                              background: '#DC2626',
                              color: '#fff',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            <span style={{ color: '#fff', fontSize: '12px' }}>{seat?.row}</span>
                          </Badge>
                        );
                      })
                    ) : (
                      <Text style={{ color: '#666', fontSize: '14px' }}>Chưa chọn ghế nào</Text>
                    )}
                  </div>
                </div>
                
                {/* Pricing */}
                <div style={{ 
                  borderTop: '1px solid #333', 
                  paddingTop: '16px',
                  marginTop: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text style={{ color: '#ccc' }}>Tạm tính:</Text>
                    <Text style={{ color: '#fff' }}>
                      {(calculateTotal() * 24000).toLocaleString('vi-VN')} đ
                    </Text>
                  </div>
                  
                  {appliedVoucher && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text style={{ color: '#52c41a' }}>Giảm giá:</Text>
                      <Text style={{ color: '#52c41a' }}>
                        -{appliedVoucher.discountType === 'percentage' 
                          ? `${appliedVoucher.discountValue}%` 
                          : `${(appliedVoucher.discountValue * 24000).toLocaleString('vi-VN')} đ`}
                      </Text>
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    borderTop: '1px solid #333',
                    paddingTop: '12px',
                    marginTop: '12px'
                  }}>
                    <Text strong style={{ color: '#fff', fontSize: '18px' }}>Tổng cộng:</Text>
                    <Text strong style={{ 
                      color: '#DC2626', 
                      fontSize: '20px',
                      textShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                    }}>
                      {(calculateTotal() * 24000).toLocaleString('vi-VN')} đ
                    </Text>
                  </div>
                </div>

                {/* Active Users */}
                <div style={{ 
                  borderTop: '1px solid #333', 
                  paddingTop: '16px',
                  marginTop: '16px'
                }}>
                  <Title level={5} style={{ color: '#fff', marginBottom: '12px' }}>
                    👥 Người Dùng Đang Hoạt Động ({activeUsers.length})
                  </Title>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {activeUsers.length > 0 ? (
                      activeUsers.map((activeUser) => (
                        <div 
                          key={activeUser.userId} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            background: activeUser.isGuest ? 'rgba(107, 114, 128, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            borderRadius: '6px',
                            border: `1px solid ${activeUser.isGuest ? '#6b7280' : '#3b82f6'}`,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <UserOutlined style={{ 
                            color: activeUser.isGuest ? '#9ca3af' : '#60a5fa',
                            fontSize: '16px'
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              color: '#fff', 
                              fontSize: '13px', 
                              fontWeight: '600'
                            }}>
                              {activeUser.userName}
                            </div>
                            <div style={{ 
                              color: '#999', 
                              fontSize: '11px'
                            }}>
                              {activeUser.isGuest ? '👤 Guest' : '✅ User'} • {new Date(activeUser.timestamp).toLocaleTimeString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Text style={{ color: '#666', fontSize: '13px', textAlign: 'center', padding: '12px' }}>
                        Hiện không có người dùng nào khác đang xem
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Content>
      
      {/* Booking Modal - Enhanced */}
      <Modal
        title={
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#fff',
            textAlign: 'center',
            padding: '24px 0',
            background: 'linear-gradient(135deg, #DC2626, #991B1B)',
            margin: '-24px -24px 24px -24px',
            borderRadius: '12px 12px 0 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            🎬 Complete Your Booking
          </div>
        }
        open={bookingModalVisible}
        onCancel={() => setBookingModalVisible(false)}
        width={1000}
        style={{ top: 20 }}
        bodyStyle={{ 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', 
          padding: '0',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: '2px solid #DC2626',
          borderRadius: '12px'
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => setBookingModalVisible(false)}
            size="large"
            style={{ 
              background: '#333', 
              borderColor: '#555', 
              color: '#fff',
              height: '48px',
              padding: '0 32px'
            }}
          >
            Cancel
          </Button>,
          <Button 
            key="book" 
            type="primary" 
            className="primary-button" 
            onClick={handleCreateBooking}
            size="large"
            style={{ 
              height: '48px',
              padding: '0 32px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Create Booking
          </Button>
        ]}
      >
        <div style={{ padding: '0' }}>
          {/* Showtime Info */}
          {showtime && (
            <Card 
              style={{ 
                margin: '0 0 24px 0', 
                background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
                border: '2px solid #DC2626',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)'
              }}
              bodyStyle={{ padding: '28px' }}
            >
              <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
                🎬 Showtime Details
              </Title>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <div style={{ 
                    background: '#1a1a1a', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    border: '1px solid #444'
                  }}>
                    <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: '14px' }}>🎬 Movie:</Text>
                    <Text style={{ color: '#fff', fontSize: '16px', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                      {showtime.movie?.title}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ 
                    background: '#1a1a1a', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    border: '1px solid #444'
                  }}>
                    <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: '14px' }}>📅 Date:</Text>
                    <Text style={{ color: '#fff', fontSize: '16px', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                      {new Date(showtime.startTime).toLocaleDateString('vi-VN')}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ 
                    background: '#1a1a1a', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    border: '1px solid #444'
                  }}>
                    <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: '14px' }}>🕐 Time:</Text>
                    <Text style={{ color: '#fff', fontSize: '16px', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                      {new Date(showtime.startTime).toLocaleTimeString('vi-VN')}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ 
                    background: '#1a1a1a', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    border: '1px solid #444'
                  }}>
                    <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: '14px' }}>🎭 Theater:</Text>
                    <Text style={{ color: '#fff', fontSize: '16px', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                      {showtime.theater?.name}
                    </Text>
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ 
                    background: '#1a1a1a', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    border: '1px solid #444'
                  }}>
                    <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: '14px' }}>🏢 Branch:</Text>
                    <Text style={{ color: '#fff', fontSize: '16px', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                      {showtime.branch?.name}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Selected Seats */}
          <Card 
            style={{ 
              margin: '0 0 24px 0', 
              background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
              border: '2px solid #DC2626',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)'
            }}
            bodyStyle={{ padding: '28px' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              🎫 Selected Seats
            </Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {selectedSeats.map(seatId => {
                const seat = seats.find(s => s._id === seatId);
                return (
                  <div key={seatId} style={{ 
                    padding: '16px 20px', 
                    background: 'linear-gradient(135deg, #DC2626, #991B1B)', 
                    color: 'white', 
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
                    border: '2px solid #fff',
                    minWidth: '200px'
                  }}>
                    <span style={{ fontSize: '20px' }}>🎯</span>
                    <span style={{ fontSize: '18px' }}>{seat?.row}{seat?.number}</span>
                    <span style={{ opacity: 0.8 }}>-</span>
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>
                      {((seat?.availability?.price || 0) * 24000).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Combos */}
          <Card 
            style={{ 
              margin: '0 0 24px 0', 
              background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
              border: '2px solid #DC2626',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)'
            }}
            bodyStyle={{ padding: '28px' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              🍿 Add Combos & Concessions
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {combos.map(combo => (
                <div key={combo._id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                  border: '2px solid #444',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                      {combo.name}
                    </Text>
                    <Text style={{ color: '#ccc', fontSize: '15px', display: 'block', marginBottom: '12px' }}>
                      {combo.description}
                    </Text>
                    <Text style={{ 
                      color: '#DC2626', 
                      fontSize: '18px', 
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}>
                      {combo.price.toLocaleString('vi-VN')}₫
                    </Text>
                  </div>
                  <Select
                    value={selectedCombos.find(sc => sc._id === combo._id)?.quantity || 0}
                    onChange={(value) => {
                      if (value === 0) {
                        setSelectedCombos(selectedCombos.filter(sc => sc._id !== combo._id));
                      } else {
                        const existing = selectedCombos.find(sc => sc._id === combo._id);
                        if (existing) {
                          setSelectedCombos(selectedCombos.map(sc => 
                            sc._id === combo._id ? { ...sc, quantity: value } : sc
                          ));
                        } else {
                          setSelectedCombos([...selectedCombos, { ...combo, quantity: value }]);
                        }
                      }
                    }}
                    style={{ 
                      width: '120px',
                      background: '#1a1a1a',
                      border: '2px solid #DC2626',
                      borderRadius: '8px'
                    }}
                    size="large"
                  >
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <Option key={num} value={num}>{num}</Option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </Card>

          {/* Voucher */}
          <Card 
            style={{ 
              margin: '0 0 24px 0', 
              background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
              border: '2px solid #DC2626',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)'
            }}
            bodyStyle={{ padding: '28px' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              🎟️ Voucher & Discounts
            </Title>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <Input
                placeholder="Enter voucher code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                style={{ 
                  flex: 1,
                  background: '#1a1a1a',
                  border: '2px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  height: '48px'
                }}
                size="large"
              />
              <Button 
                onClick={handleApplyVoucher}
                size="large"
                style={{ 
                  background: 'linear-gradient(135deg, #DC2626, #991B1B)', 
                  border: 'none',
                  color: '#fff',
                  fontWeight: 'bold',
                  height: '48px',
                  padding: '0 32px',
                  fontSize: '16px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                }}
              >
                Apply
              </Button>
            </div>
            {appliedVoucher && (
              <div style={{ 
                padding: '16px', 
                background: '#1a4d1a', 
                border: '1px solid #52c41a',
                borderRadius: '8px'
              }}>
                <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                  ✅ Voucher Applied: {appliedVoucher.code}
                </Text><br/>
                <Text style={{ color: '#fff', fontSize: '14px' }}>
                  Discount: {appliedVoucher.discountType === 'percentage' 
                    ? `${appliedVoucher.discountValue}%` 
                    : `${(appliedVoucher.discountValue * 24000).toLocaleString('vi-VN')} VND`}
                </Text>
              </div>
            )}
          </Card>

          {/* Customer Info */}
          <Card 
            style={{ 
              margin: '0 0 24px 0', 
              background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
              border: '2px solid #DC2626',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)'
            }}
            bodyStyle={{ padding: '28px' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              👤 Customer Information
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                placeholder="Full Name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                size="large"
                style={{ 
                  background: '#1a1a1a', 
                  border: '2px solid #444', 
                  color: '#fff',
                  fontSize: '16px',
                  height: '48px',
                  borderRadius: '8px'
                }}
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                size="large"
                style={{ 
                  background: '#1a1a1a', 
                  border: '2px solid #444', 
                  color: '#fff',
                  fontSize: '16px',
                  height: '48px',
                  borderRadius: '8px'
                }}
              />
              <Input
                placeholder="Phone Number"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                size="large"
                style={{ 
                  background: '#1a1a1a', 
                  border: '2px solid #444', 
                  color: '#fff',
                  fontSize: '16px',
                  height: '48px',
                  borderRadius: '8px'
                }}
              />
            </div>
          </Card>

          {/* Total */}
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
              border: '3px solid #DC2626',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(220, 38, 38, 0.3)'
            }}
            bodyStyle={{ padding: '32px' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              💰 Total Amount
            </Title>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#ff4d4f',
                textShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
              }}>
                {(calculateTotal() * 24000).toLocaleString('vi-VN')} VND
              </Text>
            </div>
          </Card>
        </div>
      </Modal>
      
      <Footer />
    </Layout>
  );
};

export default BookingPageModern;
