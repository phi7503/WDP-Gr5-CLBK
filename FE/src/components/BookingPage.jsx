import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Radio, Space, message, Modal, Input, Select } from 'antd';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { showtimeAPI, seatAPI, seatStatusAPI, bookingAPI, comboAPI, voucherAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const BookingPage = () => {
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
  const [selectedTime, setSelectedTime] = useState('06:30');
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

  const timeSlots = [
    { time: '06:30', available: true },
    { time: '09:30', available: true },
    { time: '12:00', available: true },
    { time: '04:30', available: true },
    { time: '08:00', available: true }
  ];

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
        background: '#666',
        border: '1px solid #999',
        cursor: 'not-allowed',
        opacity: 0.5,
        pointerEvents: 'none'
      };
    }
    
    if (selectedSeats.includes(seat._id)) {
      return {
        background: '#ff4d4f',
        border: '1px solid #ff4d4f',
        color: '#fff',
        cursor: 'pointer',
        pointerEvents: 'auto'
      };
    }
    
    // Available seat - should be clickable
    return {
      background: '#333',
      border: '1px solid #666',
      color: '#fff',
      cursor: 'pointer',
      pointerEvents: 'auto',
      transition: 'all 0.2s ease'
    };
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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[48, 48]}>
            {/* Available Timings */}
            <Col xs={24} lg={8}>
              <Card
                style={{ 
                  background: '#ff4d4f',
                  border: 'none',
                  borderRadius: '8px',
                  height: 'fit-content'
                }}
              >
                <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>
                  Available Timings
                </Title>
                
                <Radio.Group 
                  value={selectedTime} 
                  onChange={(e) => setSelectedTime(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {timeSlots.map((slot, index) => (
                      <Radio 
                        key={index}
                        value={slot.time}
                        style={{ 
                          color: '#fff',
                          fontSize: '16px',
                          padding: '8px 0'
                        }}
                      >
                        {slot.time}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Card>
            </Col>

            {/* Seat Selection */}
            <Col xs={24} lg={16}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
              >
                <Title level={3} style={{ color: '#fff', marginBottom: '32px', textAlign: 'center' }}>
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
                    height: '4px',
                    background: '#ff4d4f',
                    borderRadius: '2px',
                    marginBottom: '8px'
                  }} />
                  <Text style={{ color: '#ff4d4f', fontSize: '14px', fontWeight: 'bold' }}>
                    SCREEN SIDE
                  </Text>
                </div>
                
                {/* Seat Layout */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '32px'
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
                      <div key={row} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        {/* Row Label */}
                        <div style={{ 
                          width: '24px', 
                          textAlign: 'center',
                          color: '#fff',
                          fontWeight: 'bold'
                        }}>
                          {row}
                        </div>
                        
                        {/* Seats */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {rowSeats
                            .sort((a, b) => a.number - b.number)
                            .map((seat) => (
                              <div
                                key={seat._id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSeatClick(seat._id);
                                }}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  position: 'relative',
                                  zIndex: 1,
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
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      background: '#333',
                      border: '1px solid #666',
                      borderRadius: '2px'
                    }} />
                    <Text style={{ color: '#999' }}>Available</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      background: '#ff4d4f',
                      border: '1px solid #ff4d4f',
                      borderRadius: '2px'
                    }} />
                    <Text style={{ color: '#999' }}>Selected</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      background: '#666',
                      border: '1px solid #999',
                      borderRadius: '2px',
                      opacity: 0.5
                    }} />
                    <Text style={{ color: '#999' }}>Occupied</Text>
                  </div>
                </div>
                
                {/* Proceed Button */}
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    size="large"
                    className="primary-button"
                    disabled={selectedSeats.length === 0}
                    onClick={handleProceedToCheckout}
                    style={{ 
                      height: '56px', 
                      padding: '0 48px',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    Proceed to checkout →
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
      
      {/* Booking Modal */}
      <Modal
        title={
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#fff',
            textAlign: 'center',
            padding: '20px 0'
          }}>
            Complete Your Booking
          </div>
        }
        open={bookingModalVisible}
        onCancel={() => setBookingModalVisible(false)}
        width={900}
        style={{ top: 20 }}
        bodyStyle={{ 
          background: '#1a1a1a', 
          padding: '0',
          maxHeight: '80vh',
          overflowY: 'auto'
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
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '12px'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
                🎬 Showtime Details
              </Title>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Movie:</strong> {showtime.movie?.title}</Text>
                </Col>
                <Col span={12}>
                  <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Date:</strong> {new Date(showtime.startTime).toLocaleDateString()}</Text>
                </Col>
                <Col span={12}>
                  <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Time:</strong> {new Date(showtime.startTime).toLocaleTimeString()}</Text>
                </Col>
                <Col span={12}>
                  <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Theater:</strong> {showtime.theater?.name}</Text>
                </Col>
                <Col span={24}>
                  <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Branch:</strong> {showtime.branch?.name}</Text>
                </Col>
              </Row>
            </Card>
          )}

          {/* Selected Seats */}
          <Card 
            style={{ 
              margin: '0 0 24px 0', 
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              🎫 Selected Seats
            </Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {selectedSeats.map(seatId => {
                const seat = seats.find(s => s._id === seatId);
                return (
                  <div key={seatId} style={{ 
                    padding: '12px 16px', 
                    background: '#ff4d4f', 
                    color: 'white', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                  }}>
                    <span>🎯</span>
                    <span>{seat?.row}{seat?.number}</span>
                    <span>-</span>
                    <span>${seat?.availability?.price || 0}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Combos */}
          <Card 
            style={{ 
              margin: '0 0 24px 0', 
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '24px' }}
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
                  padding: '16px',
                  background: '#333',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                      {combo.name}
                    </Text>
                    <Text style={{ color: '#999', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                      {combo.description}
                    </Text>
                    <Text style={{ color: '#ff4d4f', fontSize: '16px', fontWeight: 'bold' }}>
                      ${combo.price}
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
                    style={{ width: '100px' }}
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
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              🎟️ Voucher & Discounts
            </Title>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <Input
                placeholder="Enter voucher code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                style={{ flex: 1 }}
                size="large"
              />
              <Button 
                onClick={handleApplyVoucher}
                size="large"
                style={{ 
                  background: '#ff4d4f', 
                  borderColor: '#ff4d4f',
                  color: '#fff',
                  fontWeight: 'bold'
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
                    : `$${appliedVoucher.discountValue}`}
                </Text>
              </div>
            )}
          </Card>

          {/* Customer Info */}
          <Card 
            style={{ 
              margin: '0 0 24px 0', 
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              👤 Customer Information
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                placeholder="Full Name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                size="large"
                style={{ background: '#333', borderColor: '#555', color: '#fff' }}
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                size="large"
                style={{ background: '#333', borderColor: '#555', color: '#fff' }}
              />
              <Input
                placeholder="Phone Number"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                size="large"
                style={{ background: '#333', borderColor: '#555', color: '#fff' }}
              />
            </div>
          </Card>

          {/* Total */}
          <Card 
            style={{ 
              background: '#2a2a2a',
              border: '2px solid #ff4d4f',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '24px' }}
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
                ${calculateTotal().toFixed(2)}
              </Text>
            </div>
          </Card>
        </div>
      </Modal>
      
      <Footer />
    </Layout>
  );
};

export default BookingPage;
