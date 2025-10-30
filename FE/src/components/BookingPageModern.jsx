import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Space, message, Modal, Input, Select, Steps, Badge } from 'antd';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, CreditCardOutlined, CheckOutlined } from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { showtimeAPI, seatAPI, seatStatusAPI, bookingAPI, comboAPI, voucherAPI } from '../services/api';
import '../booking-animations.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const BookingPageModern = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState([]);
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

  useEffect(() => {
    if (showtimeId) {
      loadShowtimeData();
      loadCombos();
    }
  }, [showtimeId]);

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
            // Update seat availability based on status
            const updatedSeats = transformedSeats.map(seat => {
              const seatStatus = statusResponse.seatStatuses.find(ss => ss.seat._id === seat._id);
              if (seatStatus) {
                return {
                  ...seat,
                  occupied: seatStatus.status === 'booked' || seatStatus.status === 'reserved',
                  availability: {
                    status: seatStatus.status,
                    price: seatStatus.price || seat.availability.price
                  }
                };
              }
              return seat;
            });
            
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
    
    if (!seat || seat.occupied || seat.availability?.status !== 'available') {
      console.log('Seat not available');
      return;
    }
    
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
      console.log('Seat deselected:', seatId);
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
      console.log('Seat selected:', seatId);
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
      message.error('Failed to create booking. Please try again.');
    }
  };

  const getSeatStyle = (seat) => {
    console.log('Getting style for seat:', seat._id, 'occupied:', seat.occupied, 'status:', seat.availability?.status);
    
    const status = seat.availability?.status || (seat.occupied ? 'booked' : 'available');
    
    if (status === 'booked' || status === 'reserved') {
      return {
        background: '#4B5563',
        border: '1px solid #6B7280',
        cursor: 'not-allowed',
        opacity: 0.6,
        pointerEvents: 'none'
      };
    }
    
    if (selectedSeats.includes(seat._id)) {
      return {
        background: '#DC2626',
        border: '1px solid #DC2626',
        color: '#fff',
        cursor: 'pointer',
        pointerEvents: 'auto',
        transform: 'scale(1.05)',
        boxShadow: '0 4px 16px rgba(220, 38, 38, 0.6)'
      };
    }
    
    // Available seat - should be clickable
    return {
      background: '#F5DEB3',
      border: '1px solid #D4A574',
      color: '#8B4513',
      cursor: 'pointer',
      pointerEvents: 'auto',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'scale(1.1)',
        boxShadow: '0 4px 12px rgba(245, 222, 179, 0.4)',
        borderColor: '#DC2626'
      }
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
                  gap: '32px',
                  marginBottom: '32px',
                  flexWrap: 'wrap'
                }}>
                  <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#F5DEB3',
                      border: '1px solid #D4A574',
                      borderRadius: '4px 4px 1px 1px'
                    }} />
                    <Text style={{ color: '#999', fontSize: '14px' }}>Ghế trống</Text>
                  </div>
                  
                  <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#DC2626',
                      border: '1px solid #DC2626',
                      borderRadius: '4px 4px 1px 1px'
                    }} />
                    <Text style={{ color: '#999', fontSize: '14px' }}>Ghế đang chọn</Text>
                  </div>
                  
                  <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#4B5563',
                      border: '1px solid #6B7280',
                      borderRadius: '4px 4px 1px 1px',
                      opacity: 0.6
                    }} />
                    <Text style={{ color: '#999', fontSize: '14px' }}>Ghế đã đặt</Text>
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
                      {(combo.price * 24000).toLocaleString('vi-VN')} VND
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
