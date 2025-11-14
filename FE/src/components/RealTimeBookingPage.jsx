import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Space, message, notification, Modal, Input, Select, Badge, Alert, Spin } from 'antd';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import Header from './Header';
import Footer from './Footer';
import PaymentModal from './PaymentModal';
import { showtimeAPI, seatAPI, seatStatusAPI, bookingAPI, comboAPI, voucherAPI, payOSAPI, BACKEND_URL } from '../services/api';
import { useAuth } from "../context/app.context";
import '../booking-animations.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const RealTimeBookingPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  // Socket and state management
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [reservationTimer, setReservationTimer] = useState(null);
  const [paymentCountdown, setPaymentCountdown] = useState(null);
  const [paymentExpiresAt, setPaymentExpiresAt] = useState(null);
  const [isInPaymentMode, setIsInPaymentMode] = useState(false);
  
  // Seat and booking state
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seats, setSeats] = useState([]);
  const [showtime, setShowtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seatStatuses, setSeatStatuses] = useState(new Map());
  
  // UI state
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

  // Initialize socket connection (không bắt buộc phải có token)
  useEffect(() => {
    if (showtimeId) {
      initializeSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [showtimeId]);

  // Load showtime data
  useEffect(() => {
    if (showtimeId) {
      loadShowtimeData();
      loadCombos();
    }
  }, [showtimeId]);

  const initializeSocket = () => {
    const socketOptions = {};
    if (token) {
      socketOptions.auth = { token: token };
    }
    
    socketRef.current = io(BACKEND_URL, socketOptions);

    socketRef.current.on('connect', () => {
      console.log('🔌 Connected to server');
      setSocketConnected(true);
      
      // Join showtime room
      console.log('🚪 Joining showtime room:', showtimeId);
      socketRef.current.emit('join-showtime', showtimeId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setSocketConnected(false);
    });

    socketRef.current.on('user-joined', (data) => {
      console.log('👥 User joined:', data);
      setActiveUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
    });

    socketRef.current.on('user-left', (data) => {
      console.log('👋 User left:', data);
      setActiveUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    socketRef.current.on('seats-being-selected', (data) => {
      console.log('📍 Seats being selected:', data);
      updateSeatStatuses(data.seatIds, 'selecting', data.userId);
    });

    socketRef.current.on('seats-reserved-for-payment', (data) => {
      console.log('💳 Seats reserved for payment:', data);
      updateSeatStatuses(data.seatIds, 'reserved', data.userId);
    });

    socketRef.current.on('seats-booked', (data) => {
      console.log('✅ Seats booked:', data);
      updateSeatStatuses(data.seatIds, 'booked', data.userId);
    });

    socketRef.current.on('seats-released', (data) => {
      console.log('🔄 Seats released:', data);
      updateSeatStatuses(data.seatIds, 'available', null);
    });

    socketRef.current.on('seat-selection-success', (data) => {
      console.log('✅ Seat selection successful:', data);
      startReservationTimer(data.expiresAt);
    });

    socketRef.current.on('seat-selection-failed', (data) => {
      console.log('❌ Seat selection failed:', data);
      message.error(data.message);
    });

    socketRef.current.on('seat-reservation-success', (data) => {
      console.log('✅ Seat reservation successful:', data);
      startReservationTimer(data.expiresAt, true);
      message.success(`Ghế đã được giữ chỗ! Bạn có ${Math.floor((new Date(data.expiresAt) - new Date()) / 60)} phút để hoàn tất thanh toán.`);
    });

    socketRef.current.on('seat-reservation-failed', (data) => {
      console.log('❌ Seat reservation failed:', data);
      message.error(data.message);
    });

    socketRef.current.on('seats-reserved', (data) => {
      console.log('🔒 Seats reserved:', data);
      updateSeatStatuses(data.seatIds, 'reserved', data.userId);
    });

    socketRef.current.on('payment-initiated', (data) => {
      console.log('💳 Payment initiated:', data);
      startReservationTimer(data.expiresAt, true);
      message.success(`Thanh toán đã được khởi tạo! Bạn có ${Math.floor((new Date(data.expiresAt) - new Date()) / 60)} phút để hoàn tất thanh toán.`);
    });

    socketRef.current.on('payment-completed', (data) => {
      console.log('✅ Payment completed:', data);
      message.success('Đặt vé đã hoàn tất thành công!');
      navigate(`/booking-details/${data.bookingId}`);
    });

    socketRef.current.on('payment-failed', (data) => {
      console.log('❌ Payment failed:', data);
      message.error(data.message);
    });

    socketRef.current.on('reservation-expired', (data) => {
      console.log('⏰ Reservation expired:', data);
      message.warning('Giữ chỗ của bạn đã hết hạn. Vui lòng chọn ghế lại.');
      setSelectedSeats([]);
      setReservationTimer(null);
    });
  };

  const updateSeatStatuses = (seatIds, status, userId) => {
    setSeatStatuses(prev => {
      const newStatuses = new Map(prev);
      seatIds.forEach(seatId => {
        newStatuses.set(seatId, { status, userId, timestamp: new Date() });
      });
      return newStatuses;
    });
  };

  const startReservationTimer = (expiresAt, isPayment = false) => {
    const timer = setInterval(() => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const timeLeft = Math.max(0, Math.floor((expires - now) / 1000));
      
      if (isPayment) {
        setPaymentCountdown(timeLeft);
        setPaymentExpiresAt(expiresAt);
        setIsInPaymentMode(true);
      } else {
        setReservationTimer(timeLeft);
      }
      
      if (timeLeft === 0) {
        clearInterval(timer);
        if (isPayment) {
          setPaymentCountdown(null);
          setPaymentExpiresAt(null);
          setIsInPaymentMode(false);
          message.warning('Thời gian thanh toán đã hết hạn! Vui lòng chọn ghế lại.');
          setSelectedSeats([]);
        } else {
          setReservationTimer(null);
        }
      }
    }, 1000);
    
    if (isPayment) {
      setPaymentCountdown(Math.floor((new Date(expiresAt) - new Date()) / 1000));
    } else {
      setReservationTimer(Math.floor((new Date(expiresAt) - new Date()) / 1000));
    }
  };

  const loadShowtimeData = async () => {
    try {
      setLoading(true);
      
      // Load showtime details
      const showtimeResponse = await showtimeAPI.getShowtimeById(showtimeId);
      if (showtimeResponse) {
        setShowtime(showtimeResponse);
      }
      
      // Load seat layout
      const seatResponse = await seatAPI.getSeatAvailability(showtimeId);
      if (seatResponse && seatResponse.seats) {
        setSeats(seatResponse.seats);
      }
      
      // Load seat statuses
      const statusResponse = await seatStatusAPI.getSeatStatusByShowtime(showtimeId);
      if (statusResponse && statusResponse.seatStatuses) {
        const statusMap = new Map();
        statusResponse.seatStatuses.forEach(status => {
          statusMap.set(status.seat._id, {
            status: status.status,
            userId: status.reservedBy,
            timestamp: status.reservedAt,
            price: status.price // ✅ Lưu giá từ seatStatus
          });
        });
        setSeatStatuses(statusMap);
      }
      
    } catch (error) {
      console.error('Error loading showtime data:', error);
      // Hiển thị error message cụ thể từ API
      const errorMessage = error.message || 'Không thể tải dữ liệu suất chiếu';
      message.error(errorMessage, 5);
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

  const handleSeatClick = (seatId) => {
    const seatStatus = seatStatuses.get(seatId);
    
    // Check if seat is available
    if (seatStatus && seatStatus.status !== 'available') {
      if (seatStatus.status === 'selecting' && seatStatus.userId !== user._id) {
        message.warning('Ghế này đang được người dùng khác chọn');
      } else if (seatStatus.status === 'reserved') {
        message.warning('Ghế này đã được giữ chỗ');
      } else if (seatStatus.status === 'booked') {
        message.warning('Ghế này đã được đặt');
      }
      return;
    }
    
    // Toggle seat selection
    if (selectedSeats.includes(seatId)) {
      // Remove seat from selection
      const newSelectedSeats = selectedSeats.filter(id => id !== seatId);
      setSelectedSeats(newSelectedSeats);
      
      // Release seat via socket
      if (socketRef.current && socketConnected) {
        socketRef.current.emit('release-seats', {
          showtimeId,
          seatIds: [seatId]
        });
      }
    } else {
      // Add seat to selection
      const newSelectedSeats = [...selectedSeats, seatId];
      setSelectedSeats(newSelectedSeats);
      
      // Lock only the newly selected seat via socket
      if (socketRef.current && socketConnected) {
        console.log('🔒 Emitting select-seats for:', seatId);
        socketRef.current.emit('select-seats', {
          showtimeId,
          seatIds: [seatId] // Only emit the newly selected seat
        });
      } else {
        console.log('❌ Socket not connected or not available');
      }
    }
  };


  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      message.warning('Vui lòng chọn ít nhất một ghế');
      return;
    }
    
    // ✅ Không reserve ngay khi mở modal - chỉ mở modal để chọn combos
    // Reserve sẽ được gọi khi user click "Complete Payment" trong modal
    setIsInPaymentMode(true);
    setBookingModalVisible(true);
  };

  const handleCompletePayment = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      message.error('Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }
    
    try {
      setLoading(true);
      
      // ✅ Reserve ghế TRƯỚC KHI tạo booking - đợi confirm từ socket
      if (socketRef.current && socketConnected) {
        console.log('🔒 Reserving seats before booking...');
        
        // Tạo promise để đợi response từ socket
        const reservePromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            // Timeout sau 3 giây
            reject(new Error('Reservation timeout. Vui lòng thử lại.'));
          }, 3000);
          
          const successHandler = (data) => {
            clearTimeout(timeout);
            socketRef.current?.off('seat-reservation-success', successHandler);
            socketRef.current?.off('seat-reservation-failed', failHandler);
            console.log('✅ Reservation confirmed:', data);
            resolve(data);
          };
          
          const failHandler = (data) => {
            clearTimeout(timeout);
            socketRef.current?.off('seat-reservation-success', successHandler);
            socketRef.current?.off('seat-reservation-failed', failHandler);
            console.log('❌ Reservation failed:', data);
            reject(new Error(data.message || 'Không thể giữ chỗ ghế. Vui lòng thử lại.'));
          };
          
          socketRef.current.on('seat-reservation-success', successHandler);
          socketRef.current.on('seat-reservation-failed', failHandler);
          
          // Emit reserve request
          socketRef.current.emit('reserve-seats', {
            showtimeId,
            seatIds: selectedSeats
          });
        });
        
        try {
          await reservePromise;
          console.log('✅ Seats reserved successfully, proceeding with booking...');
        } catch (reserveError) {
          console.error('❌ Reservation failed:', reserveError);
          message.error(reserveError.message || 'Không thể giữ chỗ ghế. Vui lòng thử lại.');
          setLoading(false);
          return;
        }
      } else {
        console.log('⚠️ Socket not connected, proceeding without reservation...');
      }
      
      const bookingData = {
        showtimeId: showtimeId,
        seatIds: selectedSeats,
        combos: selectedCombos,
        voucherId: appliedVoucher?._id,
        customerInfo: customerInfo
      };
      
      console.log('Creating booking with data:', bookingData);
      
      // Tạo booking với trạng thái pending
      const response = await bookingAPI.createBooking(bookingData);
      
      if (!response) {
        throw new Error('Không nhận được phản hồi từ server');
      }
      
      if (response.success && response.booking) {
        const bookingId = response.booking._id;
        
        if (!bookingId) {
          throw new Error('Không nhận được ID booking từ server');
        }
        
        // Tạo PayOS payment link
        try {
          console.log('🔄 Creating PayOS payment link for booking:', bookingId);
          const paymentResponse = await payOSAPI.createPaymentFromBooking(bookingId);
          
          console.log('📦 PayOS response:', paymentResponse);
          
          if (!paymentResponse) {
            throw new Error('Không nhận được phản hồi từ PayOS');
          }
          
          // Kiểm tra checkoutUrl trong response
          const checkoutUrl = paymentResponse.checkoutUrl || paymentResponse.data?.checkoutUrl;
          
          if (checkoutUrl) {
            console.log('✅ Redirecting to PayOS:', checkoutUrl);
            message.success('Đang chuyển đến trang thanh toán...');
            setBookingModalVisible(false);
            
            // Redirect đến PayOS payment page
            window.location.href = checkoutUrl;
          } else {
            console.error('❌ No checkoutUrl in response:', paymentResponse);
            throw new Error(paymentResponse?.message || paymentResponse?.error || 'Không thể tạo link thanh toán. Vui lòng kiểm tra cấu hình PayOS.');
          }
        } catch (paymentError) {
          console.error('❌ Error creating payment link:', paymentError);
          const paymentErrorMsg = paymentError?.message || paymentError?.data?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.';
          message.error(paymentErrorMsg);
          setLoading(false);
          // Không throw error để user có thể thử lại
        }
      } else {
        // Nếu response không có success hoặc booking
        const errorMsg = response?.message || response?.error || 'Không thể tạo booking. Vui lòng thử lại.';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      
      // Hiển thị message lỗi cụ thể từ server
      let errorMessage = 'Không thể tạo booking. Vui lòng thử lại.';
      
      // Lấy message từ nhiều nguồn
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.data && error.data.error) {
        errorMessage = error.data.error;
      }
      
      console.log('Displaying error message:', errorMessage);
      
      // Đảm bảo modal đóng trước khi hiển thị message
      if (setBookingModalVisible) {
        setBookingModalVisible(false);
      }
      
      // Đợi một chút để modal đóng hoàn toàn
      setTimeout(() => {
        // Kiểm tra các loại lỗi cụ thể
        if (errorMessage.includes('đã bắt đầu') || errorMessage.includes('đã kết thúc')) {
          // Chỉ reload khi suất chiếu đã bắt đầu/kết thúc - nhưng cho người dùng 6 giây để đọc notification
          notification.error({
            message: 'Lỗi',
            description: errorMessage,
            placement: 'topRight',
            duration: 6,
            onClose: () => {
              // Reload sau khi notification đóng (sau 6 giây)
              window.location.reload();
            }
          });
        } else if (errorMessage.includes('no longer available') || errorMessage.includes('không còn khả dụng') || errorMessage.includes('are no longer available')) {
          notification.warning({
            message: 'Cảnh báo',
            description: 'Một số ghế đã được đặt bởi người khác. Vui lòng chọn ghế khác.',
            placement: 'topRight',
            duration: 6,
          });
          // Refresh seat statuses - KHÔNG reload trang
          if (typeof loadSeatStatuses === 'function') {
            loadSeatStatuses();
          }
        } else {
          // ✅ Các lỗi khác - CHỈ hiển thị notification, KHÔNG reload trang
          notification.error({
            message: 'Lỗi',
            description: errorMessage,
            placement: 'topRight',
            duration: 6,
          });
          // KHÔNG reload - người dùng có thể thử lại hoặc chọn ghế khác
        }
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const getSeatStyle = (seat) => {
    const seatStatus = seatStatuses.get(seat._id);
    const status = seatStatus?.status || 'available';
    
    if (status === 'booked') {
      return {
        background: '#666',
        border: '1px solid #999',
        cursor: 'not-allowed',
        opacity: 0.5
      };
    }
    
    if (status === 'reserved') {
      return {
        background: '#faad14',
        border: '1px solid #faad14',
        cursor: 'not-allowed',
        opacity: 0.7
      };
    }
    
    if (status === 'selecting') {
      if (seatStatus.userId === user._id) {
        return {
          background: '#ff4d4f',
          border: '1px solid #ff4d4f',
          color: '#fff',
          cursor: 'pointer'
        };
      } else {
        return {
          background: '#1890ff',
          border: '1px solid #1890ff',
          cursor: 'not-allowed',
          opacity: 0.7
        };
      }
    }
    
    if (selectedSeats.includes(seat._id)) {
      return {
        background: '#ff4d4f',
        border: '1px solid #ff4d4f',
        color: '#fff',
        cursor: 'pointer'
      };
    }
    
    return {
      background: '#333',
      border: '1px solid #666',
      color: '#fff',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };
  };

  const calculateTotal = () => {
    let total = 0;
    
    selectedSeats.forEach(seatId => {
      const seat = seats.find(s => s._id === seatId);
      const seatStatus = seatStatuses.get(seatId);
      
      // ✅ Lấy giá từ seatStatus trước, nếu không có thì từ seat, nếu không có thì từ showtime price
      let seatPrice = 0;
      if (seatStatus?.price) {
        seatPrice = seatStatus.price;
      } else if (seat?.price) {
        seatPrice = seat.price;
      } else if (showtime?.price?.standard) {
        seatPrice = showtime.price.standard;
      } else if (showtime?.price) {
        seatPrice = typeof showtime.price === 'number' ? showtime.price : 50000;
      } else {
        seatPrice = 50000; // Default fallback
      }
      
      total += seatPrice;
    });
    
    selectedCombos.forEach(combo => {
      total += combo.price * combo.quantity;
    });
    
    if (appliedVoucher) {
      if (appliedVoucher.discountType === 'percentage') {
        total = total * (1 - appliedVoucher.discountValue / 100);
      } else {
        total = Math.max(0, total - appliedVoucher.discountValue);
      }
    }
    
    return Math.round(total);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      message.warning('Vui lòng nhập mã voucher');
      return;
    }
    
    try {
      const voucher = await voucherAPI.getVoucherByCode(voucherCode);
      setAppliedVoucher(voucher);
      message.success('Áp dụng voucher thành công!');
    } catch (error) {
      message.error('Mã voucher không hợp lệ');
      setAppliedVoucher(null);
    }
  };

  if (loading) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ color: '#fff', fontSize: '18px', marginTop: '16px' }}>
            Đang tải thông tin đặt vé...
          </div>
        </Content>
        <Footer />
      </Layout>
    );
  }

  if (!showtime) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: '18px' }}>
            Không tìm thấy suất chiếu
          </div>
          <Link to="/movies" style={{ color: '#ff4d4f', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>
            ← Quay lại Danh sách Phim
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
          {/* Connection Status */}
          <Card style={{ marginBottom: '24px', background: '#1a1a1a', border: '1px solid #333' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Badge 
                    status={socketConnected ? 'success' : 'error'} 
                    text={socketConnected ? 'Đã kết nối' : 'Mất kết nối'}
                  />
                  <Text style={{ color: '#999' }}>
                    {activeUsers.length} người đang xem
                  </Text>
                </Space>
              </Col>
              <Col>
                {paymentCountdown && isInPaymentMode && (
                  <Alert
                    message={
                      <div 
                        className={`timer-${paymentCountdown <= 60 ? 'critical' : paymentCountdown <= 300 ? 'warning' : 'normal'}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold' }}
                      >
                        <ClockCircleOutlined style={{ fontSize: '18px', color: '#ff4d4f' }} />
                        <span style={{ color: '#ff4d4f' }}>
                          ⏰ Thanh toán hết hạn sau: {Math.floor(paymentCountdown / 60)}:{(paymentCountdown % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    }
                    description="Hoàn tất thanh toán để giữ chỗ các ghế này"
                    type="error"
                    showIcon={false}
                    style={{ 
                      background: '#2a1a1a', 
                      border: '2px solid #ff4d4f',
                      borderRadius: '12px',
                      marginBottom: '16px',
                      animation: paymentCountdown <= 60 ? 'paymentPulse 0.5s ease-in-out infinite alternate' : 'paymentPulse 1s ease-in-out infinite alternate'
                    }}
                  />
                )}
                {reservationTimer && !isInPaymentMode && (
                  <Alert
                    message={
                      <div 
                        className={`timer-${reservationTimer <= 30 ? 'critical' : reservationTimer <= 120 ? 'warning' : 'normal'}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold' }}
                      >
                        <ClockCircleOutlined style={{ fontSize: '18px', color: '#faad14' }} />
                        <span style={{ color: '#faad14' }}>
                          ⏰ Lựa chọn ghế hết hạn sau: {Math.floor(reservationTimer / 60)}:{(reservationTimer % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    }
                    description="Hoàn tất đặt vé để giữ chỗ các ghế này"
                    type="warning"
                    showIcon={false}
                    style={{ 
                      background: '#2a1a1a', 
                      border: '2px solid #faad14',
                      borderRadius: '12px',
                      marginBottom: '16px'
                    }}
                  />
                )}
              </Col>
            </Row>
          </Card>

          <Row gutter={[32, 32]}>
            {/* Showtime Info */}
            <Col xs={24} lg={6}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  height: 'fit-content'
                }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
                  🎬 Chi Tiết Suất Chiếu
                </Title>
                
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Text style={{ color: '#999', fontSize: '14px' }}>Phim</Text>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                      {showtime.movie?.title}
                    </div>
                  </div>
                  
                  <div>
                    <Text style={{ color: '#999', fontSize: '14px' }}>Ngày & Giờ</Text>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                      {new Date(showtime.startTime).toLocaleDateString('vi-VN')}
                    </div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                      {new Date(showtime.startTime).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                  
                  <div>
                    <Text style={{ color: '#999', fontSize: '14px' }}>Rạp</Text>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                      {showtime.theater?.name}
                    </div>
                    <div style={{ color: '#999', fontSize: '14px' }}>
                      {showtime.branch?.name}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Seat Selection */}
            <Col xs={24} lg={12}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px'
                }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '32px', textAlign: 'center' }}>
                  Chọn Ghế Của Bạn
                </Title>
                
                {/* Screen */}
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '32px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'linear-gradient(90deg, #ff4d4f, #ff7875, #ff4d4f)',
                    borderRadius: '3px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                  }} />
                  <Text style={{ color: '#ff4d4f', fontSize: '16px', fontWeight: 'bold' }}>
                    🎭 MÀN HÌNH
                  </Text>
                </div>
                
                {/* Seat Layout */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '32px'
                }}>
                  {seats.length > 0 ? (
                    Object.entries(
                      seats.reduce((acc, seat) => {
                        if (!acc[seat.row]) acc[seat.row] = [];
                        acc[seat.row].push(seat);
                        return acc;
                      }, {})
                    ).map(([row, rowSeats]) => (
                      <div key={row} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '8px'
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
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {rowSeats
                            .sort((a, b) => a.number - b.number)
                            .map((seat) => (
                              <div
                                key={seat._id}
                                onClick={() => handleSeatClick(seat._id)}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  position: 'relative',
                                  userSelect: 'none',
                                  ...getSeatStyle(seat)
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
                      Không có ghế nào cho suất chiếu này
                    </div>
                  )}
                </div>
                
                {/* Legend */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '20px',
                  marginBottom: '32px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#333',
                      border: '1px solid #666',
                      borderRadius: '4px'
                    }} />
                    <Text style={{ color: '#999', fontSize: '12px' }}>Trống</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#ff4d4f',
                      border: '1px solid #ff4d4f',
                      borderRadius: '4px'
                    }} />
                    <Text style={{ color: '#999', fontSize: '12px' }}>Đã chọn</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#1890ff',
                      border: '1px solid #1890ff',
                      borderRadius: '4px'
                    }} />
                    <Text style={{ color: '#999', fontSize: '12px' }}>Đang chọn</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#faad14',
                      border: '1px solid #faad14',
                      borderRadius: '4px'
                    }} />
                    <Text style={{ color: '#999', fontSize: '12px' }}>Đã giữ</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#666',
                      border: '1px solid #999',
                      borderRadius: '4px',
                      opacity: 0.5
                    }} />
                    <Text style={{ color: '#999', fontSize: '12px' }}>Đã đặt</Text>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{ textAlign: 'center' }}>
                  {!isInPaymentMode ? (
                    <Button 
                      type="primary" 
                      size="large"
                      className="primary-button"
                      onClick={handleProceedToPayment}
                      disabled={selectedSeats.length === 0}
                      style={{ 
                        height: '48px', 
                        padding: '0 32px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                    >
                      💳 Tiến Hành Thanh Toán (15 phút)
                    </Button>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        color: '#ff4d4f', 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        marginBottom: '16px'
                      }}>
                        ⏰ Đang Thanh Toán
                      </div>
                      <div style={{ 
                        color: '#999', 
                        fontSize: '14px',
                        marginBottom: '16px'
                      }}>
                        Hoàn tất thanh toán để giữ chỗ các ghế này
                      </div>
                      <Button 
                        type="primary" 
                        size="large"
                        className="primary-button"
                        onClick={() => setBookingModalVisible(true)}
                        style={{ 
                          height: '48px', 
                          padding: '0 32px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          width: '100%'
                        }}
                      >
                        💳 Hoàn Tất Thanh Toán
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* Active Users & Summary */}
            <Col xs={24} lg={6}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Active Users */}
                <Card
                  style={{ 
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    height: 'fit-content'
                  }}
                >
                  <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
                    👥 Người Dùng Đang Hoạt Động
                  </Title>
                  
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {activeUsers.map(user => (
                      <div key={user.userId} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        background: '#2a2a2a',
                        borderRadius: '8px',
                        border: '1px solid #444'
                      }}>
                        <UserOutlined style={{ color: '#1890ff' }} />
                        <div>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                            {user.userName}
                          </div>
                          <div style={{ color: '#999', fontSize: '12px' }}>
                            {new Date(user.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {activeUsers.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        Hiện không có người dùng nào khác đang xem
                      </div>
                    )}
                  </Space>
                </Card>

                {/* Pricing Summary */}
                {selectedSeats.length > 0 && (
                  <Card
                    style={{ 
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                      border: '2px solid #ff4d4f',
                      borderRadius: '16px',
                      height: 'fit-content',
                      boxShadow: '0 8px 24px rgba(255, 77, 79, 0.2)'
                    }}
                  >
                    <Title level={4} style={{ 
                      color: '#fff', 
                      marginBottom: '24px',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      borderBottom: '2px solid #ff4d4f',
                      paddingBottom: '12px'
                    }}>
                      💰 TÓM TẮT ĐẶT VÉ
                    </Title>
                    
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      {/* Movie Info */}
                      {showtime?.movie && (
                        <div style={{
                          padding: '12px',
                          background: 'rgba(255, 77, 79, 0.1)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 77, 79, 0.3)'
                        }}>
                          <Text style={{ color: '#ff4d4f', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                            🎬 PHIM
                          </Text>
                          <Text style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                            {showtime.movie.title || showtime.movie.name}
                          </Text>
                          <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <Text style={{ color: '#ccc', fontSize: '12px' }}>
                              🕐 {showtime.startTime ? new Date(showtime.startTime).toLocaleString('vi-VN', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </Text>
                            <Text style={{ color: '#ccc', fontSize: '12px' }}>
                              🎭 {showtime.theater?.name || 'N/A'}
                            </Text>
                          </div>
                        </div>
                      )}

                      {/* Selected Seats */}
                      {selectedSeats.length > 0 && (
                        <div>
                          <Text style={{ 
                            color: '#fff', 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            display: 'block',
                            marginBottom: '12px'
                          }}>
                            🪑 GHẾ ĐÃ CHỌN ({selectedSeats.length})
                          </Text>
                          <div style={{ 
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '12px'
                          }}>
                            {selectedSeats.map(seatId => {
                              const seat = seats.find(s => s._id === seatId);
                              const seatStatus = seatStatuses.get(seatId);
                              
                              // ✅ Lấy giá từ seatStatus trước, nếu không có thì từ seat, nếu không có thì từ showtime price
                              let seatPrice = 0;
                              if (seatStatus?.price) {
                                seatPrice = seatStatus.price;
                              } else if (seat?.price) {
                                seatPrice = seat.price;
                              } else if (showtime?.price?.standard) {
                                seatPrice = showtime.price.standard;
                              } else if (showtime?.price) {
                                seatPrice = typeof showtime.price === 'number' ? showtime.price : 50000;
                              } else {
                                seatPrice = 50000; // Default fallback
                              }
                              
                              const seatType = seat?.type || seat?.seatType || 'Standard';
                              const seatTypeLabel = seatType === 'vip' ? 'VIP' : seatType === 'couple' ? 'Đôi' : 'Thường';
                              
                              return (
                                <div key={seatId} style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 0',
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                  <div>
                                    <Text style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                                      {seat?.row}{seat?.number}
                                    </Text>
                                    <Text style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                                      {seatTypeLabel}
                                    </Text>
                                  </div>
                                  <Text style={{ color: '#52c41a', fontSize: '15px', fontWeight: 'bold' }}>
                                    {seatPrice.toLocaleString('vi-VN')} ₫
                                  </Text>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}


                      {/* Subtotal */}
                      {selectedSeats.length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px'
                        }}>
                          <Text style={{ color: '#ccc', fontSize: '14px', fontWeight: '600' }}>
                            Tạm tính:
                          </Text>
                          <Text style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>
                            {(selectedSeats.reduce((sum, seatId) => {
                              const seat = seats.find(s => s._id === seatId);
                              const seatStatus = seatStatuses.get(seatId);
                              let seatPrice = seatStatus?.price || seat?.price || showtime?.price?.standard || showtime?.price || 50000;
                              return sum + seatPrice;
                            }, 0) + selectedCombos.reduce((sum, c) => sum + (c.price * c.quantity), 0)).toLocaleString('vi-VN')} ₫
                          </Text>
                        </div>
                      )}

                      {/* Voucher Discount */}
                      {appliedVoucher && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: 'rgba(82, 196, 26, 0.15)',
                          borderRadius: '8px',
                          border: '2px solid #52c41a'
                        }}>
                          <div>
                            <Text style={{ color: '#52c41a', fontSize: '13px', fontWeight: 'bold', display: 'block' }}>
                              ✅ VOUCHER ĐÃ ÁP DỤNG
                            </Text>
                            <Text style={{ color: '#fff', fontSize: '12px', marginTop: '4px' }}>
                              Mã: {appliedVoucher.code}
                            </Text>
                          </div>
                          <Text style={{ color: '#52c41a', fontSize: '16px', fontWeight: 'bold' }}>
                            -{appliedVoucher.discountType === 'percentage' 
                              ? `${appliedVoucher.discountValue}%`
                              : `${appliedVoucher.discountValue.toLocaleString('vi-VN')} ₫`
                            }
                          </Text>
                        </div>
                      )}

                      {/* Total */}
                      <div style={{ 
                        borderTop: '2px solid #ff4d4f',
                        paddingTop: '16px',
                        marginTop: '8px',
                        background: 'rgba(255, 77, 79, 0.1)',
                        borderRadius: '8px',
                        padding: '16px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Text style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                            TỔNG CỘNG:
                          </Text>
                          <Text style={{ 
                            color: '#ff4d4f', 
                            fontSize: '24px', 
                            fontWeight: 'bold',
                            textShadow: '0 0 10px rgba(255, 77, 79, 0.5)'
                          }}>
                            {calculateTotal().toLocaleString('vi-VN')} ₫
                          </Text>
                        </div>
                        <Text style={{ 
                          color: '#999', 
                          fontSize: '11px', 
                          marginTop: '8px',
                          textAlign: 'right'
                        }}>
                          (Đã bao gồm VAT)
                        </Text>
                      </div>
                    </Space>
                  </Card>
                )}
              </Space>
            </Col>
          </Row>
        </div>
      </Content>
      
      {/* Payment Modal */}
      <PaymentModal
        visible={bookingModalVisible}
        onCancel={() => setBookingModalVisible(false)}
        onComplete={handleCompletePayment}
        selectedSeats={selectedSeats}
        seats={seats}
        showtime={showtime}
        combos={combos}
        selectedCombos={selectedCombos}
        setSelectedCombos={setSelectedCombos}
        appliedVoucher={appliedVoucher}
        setAppliedVoucher={setAppliedVoucher}
        voucherCode={voucherCode}
        setVoucherCode={setVoucherCode}
        customerInfo={customerInfo}
        setCustomerInfo={setCustomerInfo}
        paymentCountdown={paymentCountdown}
        calculateTotal={calculateTotal}
        seatStatuses={seatStatuses} // ✅ Truyền seatStatuses vào PaymentModal
      />
      
      
      <Footer />
    </Layout>
  );
};

export default RealTimeBookingPage;
