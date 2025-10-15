import React, { useEffect, useState } from 'react';
import { Layout, Typography, Card, Row, Col, Button, QRCode, message } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { PrinterOutlined, MailOutlined } from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { bookingAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBookingById(bookingId);
      if (response) {
        setBooking(response);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      message.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const handleSendEmail = () => {
    message.success('Confirmation email sent!');
  };

  if (loading) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <Text style={{ color: '#fff' }}>Loading booking details...</Text>
        </Content>
        <Footer />
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <Text style={{ color: '#fff' }}>Booking not found</Text>
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
          <Title level={2} style={{ color: '#fff', marginBottom: '32px', textAlign: 'center' }}>
            Booking Confirmation
          </Title>
          
          <Row gutter={[32, 32]}>
            {/* Booking Details */}
            <Col xs={24} lg={16}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}
              >
                <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>
                  Booking Information
                </Title>
                
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#fff' }}>Booking ID:</Text><br/>
                    <Text style={{ color: '#999' }}>{booking._id}</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#fff' }}>Status:</Text><br/>
                    <Text style={{ 
                      color: booking.bookingStatus === 'confirmed' ? '#52c41a' : '#ff4d4f',
                      fontWeight: 'bold'
                    }}>
                      {booking.bookingStatus?.toUpperCase()}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#fff' }}>Movie:</Text><br/>
                    <Text style={{ color: '#999' }}>{booking.showtime?.movie?.title}</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#fff' }}>Date & Time:</Text><br/>
                    <Text style={{ color: '#999' }}>
                      {new Date(booking.showtime?.startTime).toLocaleDateString()} at{' '}
                      {new Date(booking.showtime?.startTime).toLocaleTimeString()}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#fff' }}>Theater:</Text><br/>
                    <Text style={{ color: '#999' }}>{booking.showtime?.theater?.name}</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#fff' }}>Branch:</Text><br/>
                    <Text style={{ color: '#999' }}>{booking.showtime?.branch?.name}</Text>
                  </Col>
                </Row>
              </Card>

              {/* Seats */}
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}
              >
                <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>
                  Selected Seats
                </Title>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {booking.seats?.map((seat, index) => (
                    <div key={index} style={{ 
                      padding: '12px 16px', 
                      background: '#ff4d4f', 
                      color: 'white', 
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      {seat.row}{seat.number}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Combos */}
              {booking.combos && booking.combos.length > 0 && (
                <Card
                  style={{ 
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    marginBottom: '24px'
                  }}
                >
                  <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>
                    Combos & Concessions
                  </Title>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {booking.combos.map((combo, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '12px',
                        border: '1px solid #333',
                        borderRadius: '4px'
                      }}>
                        <div>
                          <Text strong style={{ color: '#fff' }}>{combo.name}</Text><br/>
                          <Text style={{ color: '#999' }}>Quantity: {combo.quantity}</Text>
                        </div>
                        <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                          {(combo.price * combo.quantity * 24000).toLocaleString('vi-VN')} VND
                        </Text>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Payment Info */}
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
              >
                <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>
                  Payment Information
                </Title>
                
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#fff' }}>Total Amount:</Text><br/>
                    <Text style={{ color: '#ff4d4f', fontSize: '20px', fontWeight: 'bold' }}>
                      {(booking.totalAmount * 24000).toLocaleString('vi-VN')} VND
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#fff' }}>Payment Method:</Text><br/>
                    <Text style={{ color: '#999' }}>
                      {booking.paymentMethod?.toUpperCase() || 'N/A'}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#fff' }}>Payment Status:</Text><br/>
                    <Text style={{ 
                      color: booking.paymentStatus === 'paid' ? '#52c41a' : '#ff4d4f',
                      fontWeight: 'bold'
                    }}>
                      {booking.paymentStatus?.toUpperCase() || 'PENDING'}
                    </Text>
                  </Col>
                  {booking.discountAmount > 0 && (
                    <Col xs={24} sm={12}>
                      <Text strong style={{ color: '#fff' }}>Discount Applied:</Text><br/>
                      <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        -{(booking.discountAmount * 24000).toLocaleString('vi-VN')} VND
                      </Text>
                    </Col>
                  )}
                </Row>
              </Card>
            </Col>

            {/* QR Code & Actions */}
            <Col xs={24} lg={8}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginBottom: '24px'
                }}
              >
                <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>
                  Your Ticket
                </Title>
                
                <div style={{ marginBottom: '24px' }}>
                  <QRCode 
                    value={booking.qrCode || booking._id}
                    size={200}
                    color="#fff"
                    bgColor="#1a1a1a"
                  />
                </div>
                
                <Text style={{ color: '#999', display: 'block', marginBottom: '24px' }}>
                  Show this QR code at the theater entrance
                </Text>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Button 
                    type="primary" 
                    className="primary-button"
                    icon={<PrinterOutlined />}
                    onClick={handlePrintTicket}
                    size="large"
                  >
                    Print Ticket
                  </Button>
                  
                  <Button 
                    icon={<MailOutlined />}
                    onClick={handleSendEmail}
                    size="large"
                    style={{ background: '#333', borderColor: '#555', color: '#fff' }}
                  >
                    Send Email
                  </Button>
                </div>
              </Card>

              {/* Important Notes */}
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
                  Important Notes
                </Title>
                
                <ul style={{ color: '#999', paddingLeft: '20px' }}>
                  <li>Arrive at least 15 minutes before showtime</li>
                  <li>Bring a valid ID for verification</li>
                  <li>No refunds for no-shows</li>
                  <li>Contact support for any issues</li>
                </ul>
              </Card>
            </Col>
          </Row>

          {/* Action Buttons */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/">
              <Button 
                type="primary" 
                className="primary-button"
                size="large"
                style={{ marginRight: '16px' }}
              >
                Back to Home
              </Button>
            </Link>
            
            <Link to="/movies">
              <Button 
                size="large"
                style={{ background: '#333', borderColor: '#555', color: '#fff' }}
              >
                Browse More Movies
              </Button>
            </Link>
          </div>
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default BookingDetailsPage;
