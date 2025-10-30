import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Space, message, Modal, Input, Select, Badge, Alert, Spin } from 'antd';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import Header from './Header';
import Footer from './Footer';
import PaymentModal from './PaymentModal';
import { showtimeAPI, seatAPI, seatStatusAPI, bookingAPI, comboAPI, voucherAPI, payOSAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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

  // Initialize socket connection
  useEffect(() => {
    if (token && showtimeId) {
      initializeSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, showtimeId]);

  // Load showtime data
  useEffect(() => {
    if (showtimeId) {
      loadShowtimeData();
      loadCombos();
    }
  }, [showtimeId]);

  const initializeSocket = () => {
    socketRef.current = io('http://localhost:9999', {
      auth: {
        token: token
      }
    });

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
      message.success(`Seats reserved! You have ${Math.floor((new Date(data.expiresAt) - new Date()) / 60)} minutes to complete payment.`);
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
      message.success(`Payment initiated! You have ${Math.floor((new Date(data.expiresAt) - new Date()) / 60)} minutes to complete payment.`);
    });

    socketRef.current.on('payment-completed', (data) => {
      console.log('✅ Payment completed:', data);
      message.success('Booking completed successfully!');
      navigate(`/booking-details/${data.bookingId}`);
    });

    socketRef.current.on('payment-failed', (data) => {
      console.log('❌ Payment failed:', data);
      message.error(data.message);
    });

    socketRef.current.on('reservation-expired', (data) => {
      console.log('⏰ Reservation expired:', data);
      message.warning('Your reservation has expired. Please select seats again.');
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
          message.warning('Payment time expired! Please select seats again.');
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
            timestamp: status.reservedAt
          });
        });
        setSeatStatuses(statusMap);
      }
      
    } catch (error) {
      console.error('Error loading showtime data:', error);
      message.error('Failed to load showtime data');
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
        message.warning('This seat is being selected by another user');
      } else if (seatStatus.status === 'reserved') {
        message.warning('This seat is reserved');
      } else if (seatStatus.status === 'booked') {
        message.warning('This seat is already booked');
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
      message.warning('Please select at least one seat');
      return;
    }
    
    if (socketRef.current && socketConnected) {
      socketRef.current.emit('reserve-seats', {
        showtimeId,
        seatIds: selectedSeats
      });
    }
    
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
      const bookingData = {
        showtimeId: showtimeId,
        seatIds: selectedSeats,
        combos: selectedCombos,
        voucherId: appliedVoucher?._id,
        customerInfo: customerInfo
      };
      
      // Tạo booking với trạng thái pending
      const response = await bookingAPI.createBooking(bookingData);
      
      if (response.success && response.booking) {
        const bookingId = response.booking._id;
        
        // Tạo PayOS payment link
        try {
          const paymentResponse = await payOSAPI.createPaymentFromBooking(bookingId);
          
          if (paymentResponse.checkoutUrl) {
            message.success('Đang chuyển đến trang thanh toán...');
            setBookingModalVisible(false);
            
            // Redirect đến PayOS payment page
            window.location.href = paymentResponse.checkoutUrl;
          } else {
            throw new Error('Không thể tạo link thanh toán');
          }
        } catch (paymentError) {
          console.error('Error creating payment link:', paymentError);
          message.error('Không thể tạo link thanh toán. Vui lòng thử lại.');
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      message.error('Không thể tạo booking. Vui lòng thử lại.');
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
      if (seat) {
        total += seat.price || 0; // Price already in VND
      }
    });
    
    selectedCombos.forEach(combo => {
      total += combo.price * combo.quantity; // Price already in VND
    });
    
    if (appliedVoucher) {
      if (appliedVoucher.discountType === 'percentage') {
        total = total * (1 - appliedVoucher.discountValue / 100);
      } else {
        total = Math.max(0, total - appliedVoucher.discountValue);
      }
    }
    
    return total;
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

  if (loading) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ color: '#fff', fontSize: '18px', marginTop: '16px' }}>
            Loading booking information...
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
            Showtime not found
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
          {/* Connection Status */}
          <Card style={{ marginBottom: '24px', background: '#1a1a1a', border: '1px solid #333' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Badge 
                    status={socketConnected ? 'success' : 'error'} 
                    text={socketConnected ? 'Connected' : 'Disconnected'}
                  />
                  <Text style={{ color: '#999' }}>
                    {activeUsers.length} user(s) currently viewing
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
                          ⏰ Payment expires in: {Math.floor(paymentCountdown / 60)}:{(paymentCountdown % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    }
                    description="Complete your payment to secure these seats"
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
                          ⏰ Seat selection expires in: {Math.floor(reservationTimer / 60)}:{(reservationTimer % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    }
                    description="Complete your booking to secure these seats"
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
                  🎬 Showtime Details
                </Title>
                
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Text style={{ color: '#999', fontSize: '14px' }}>Movie</Text>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                      {showtime.movie?.title}
                    </div>
                  </div>
                  
                  <div>
                    <Text style={{ color: '#999', fontSize: '14px' }}>Date & Time</Text>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                      {new Date(showtime.startTime).toLocaleDateString()}
                    </div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                      {new Date(showtime.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div>
                    <Text style={{ color: '#999', fontSize: '14px' }}>Theater</Text>
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
                  Select Your Seat
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
                    🎭 SCREEN
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
                      No seats available for this showtime
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
                    <Text style={{ color: '#999', fontSize: '12px' }}>Available</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#ff4d4f',
                      border: '1px solid #ff4d4f',
                      borderRadius: '4px'
                    }} />
                    <Text style={{ color: '#999', fontSize: '12px' }}>Selected</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#1890ff',
                      border: '1px solid #1890ff',
                      borderRadius: '4px'
                    }} />
                    <Text style={{ color: '#999', fontSize: '12px' }}>Selecting</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#faad14',
                      border: '1px solid #faad14',
                      borderRadius: '4px'
                    }} />
                    <Text style={{ color: '#999', fontSize: '12px' }}>Reserved</Text>
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
                    <Text style={{ color: '#999', fontSize: '12px' }}>Booked</Text>
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
                      disabled={selectedSeats.length === 0 || !socketConnected}
                      style={{ 
                        height: '48px', 
                        padding: '0 32px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                    >
                      💳 Proceed to Payment (15 min)
                    </Button>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        color: '#ff4d4f', 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        marginBottom: '16px'
                      }}>
                        ⏰ Payment in Progress
                      </div>
                      <div style={{ 
                        color: '#999', 
                        fontSize: '14px',
                        marginBottom: '16px'
                      }}>
                        Complete your payment to secure these seats
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
                        💳 Complete Payment
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
                    👥 Active Users
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
                        No other users currently viewing
                      </div>
                    )}
                  </Space>
                </Card>

                {/* Pricing Summary */}
                {(selectedSeats.length > 0 || selectedCombos.length > 0) && (
                  <Card
                    style={{ 
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '12px',
                      height: 'fit-content'
                    }}
                  >
                    <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
                      💰 Order Summary
                    </Title>
                    
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {/* Selected Seats */}
                      {selectedSeats.length > 0 && (
                        <div>
                          <Text style={{ color: '#999', fontSize: '14px' }}>Selected Seats:</Text>
                          {selectedSeats.map(seatId => {
                            const seat = seats.find(s => s._id === seatId);
                            return (
                              <div key={seatId} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                marginTop: '4px'
                              }}>
                                <Text style={{ color: '#fff', fontSize: '14px' }}>
                                  {seat?.row}{seat?.number} - {seat?.seatType || 'Standard'}
                                </Text>
                                <Text style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                                  {seat?.price?.toLocaleString('vi-VN')} VND
                                </Text>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Selected Combos */}
                      {selectedCombos.length > 0 && (
                        <div>
                          <Text style={{ color: '#999', fontSize: '14px' }}>Selected Combos:</Text>
                          {selectedCombos.map((combo, index) => (
                            <div key={index} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              marginTop: '4px'
                            }}>
                              <Text style={{ color: '#fff', fontSize: '14px' }}>
                                {combo.name} x{combo.quantity}
                              </Text>
                              <Text style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                                {(combo.price * combo.quantity).toLocaleString('vi-VN')} VND
                              </Text>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Voucher Discount */}
                      {appliedVoucher && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#2a2a2a',
                          borderRadius: '6px',
                          border: '1px solid #52c41a'
                        }}>
                          <Text style={{ color: '#52c41a', fontSize: '14px' }}>
                            Voucher: {appliedVoucher.code}
                          </Text>
                          <Text style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold' }}>
                            -{appliedVoucher.discountType === 'percentage' 
                              ? `${appliedVoucher.discountValue}%`
                              : `${appliedVoucher.discountValue.toLocaleString('vi-VN')} VND`
                            }
                          </Text>
                        </div>
                      )}

                      {/* Total */}
                      <div style={{ 
                        borderTop: '1px solid #333',
                        paddingTop: '12px',
                        marginTop: '12px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Text style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                            Total:
                          </Text>
                          <Text style={{ 
                            color: '#ff4d4f', 
                            fontSize: '18px', 
                            fontWeight: 'bold' 
                          }}>
                            {calculateTotal().toLocaleString('vi-VN')} VND
                          </Text>
                        </div>
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
      />
      
      
      <Footer />
    </Layout>
  );
};

export default RealTimeBookingPage;
