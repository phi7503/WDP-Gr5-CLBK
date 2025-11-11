import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Card, Row, Col, Space, Divider, QRCode, message } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [movie, setMovie] = useState(null);
  const [showtime, setShowtime] = useState(null);

  useEffect(() => {
    if (location.state?.booking && location.state?.movie && location.state?.showtime) {
      setBooking(location.state.booking);
      setMovie(location.state.movie);
      setShowtime(location.state.showtime);
    } else {
      // Redirect if no booking data
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleDownloadTicket = () => {
    // In a real app, this would generate a PDF ticket
    message.success('Vé đã được tải xuống!');
  };

  const handlePrintTicket = () => {
    // In a real app, this would print the ticket
    window.print();
  };

  if (!booking || !movie || !showtime) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '24px', textAlign: 'center', color: '#fff' }}>
          <Title level={3}>Không tìm thấy thông tin đặt vé</Title>
          <Button type="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </Content>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Success Message */}
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              marginBottom: '32px',
              textAlign: 'center'
            }}
            bodyStyle={{ padding: '32px' }}
          >
            <CheckCircleOutlined 
              style={{ 
                fontSize: '64px', 
                color: '#52c41a', 
                marginBottom: '16px' 
              }} 
            />
            <Title level={2} style={{ color: '#fff', marginBottom: '8px' }}>
              Đặt vé thành công!
            </Title>
            <Text style={{ color: '#999', fontSize: '16px' }}>
              Cảm ơn bạn đã sử dụng dịch vụ của QuickShow
            </Text>
          </Card>

          {/* Booking Details */}
          <Row gutter={[24, 24]}>
            {/* Movie Info */}
            <Col xs={24} lg={12}>
              <Card
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  height: '100%'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
                  Thông tin phim
                </Title>
                
                <div style={{ marginBottom: '16px' }}>
                  <img
                    src={movie.poster || 'https://via.placeholder.com/200x300/333/fff?text=Movie+Poster'}
                    alt={movie.title}
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}
                  />
                </div>

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Tên phim:</Text>
                    <br />
                    <Text style={{ color: '#fff', fontSize: '16px' }}>{movie.title}</Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Thể loại:</Text>
                    <br />
                    <Text style={{ color: '#fff' }}>{movie.genre?.join(', ')}</Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Thời lượng:</Text>
                    <br />
                    <Text style={{ color: '#fff' }}>{movie.duration}</Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Ngôn ngữ:</Text>
                    <br />
                    <Text style={{ color: '#fff' }}>{movie.language}</Text>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Booking Info */}
            <Col xs={24} lg={12}>
              <Card
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  height: '100%'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
                  Thông tin đặt vé
                </Title>

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Mã đặt vé:</Text>
                    <br />
                    <Text style={{ color: '#fff', fontSize: '16px', fontFamily: 'monospace' }}>
                      {booking._id}
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Ngày chiếu:</Text>
                    <br />
                    <Text style={{ color: '#fff' }}>
                      {dayjs(showtime.startTime).format('DD/MM/YYYY')}
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Giờ chiếu:</Text>
                    <br />
                    <Text style={{ color: '#fff' }}>
                      {dayjs(showtime.startTime).format('HH:mm')} - {dayjs(showtime.endTime).format('HH:mm')}
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Rạp:</Text>
                    <br />
                    <Text style={{ color: '#fff' }}>{showtime.branch} - {showtime.theater}</Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Ghế đã chọn:</Text>
                    <br />
                    <Text style={{ color: '#fff' }}>
                      {booking.seats && Array.isArray(booking.seats) 
                        ? booking.seats.map(seat => {
                            // ✅ Xử lý cả object và string
                            if (typeof seat === 'string') {
                              return seat;
                            } else if (seat && seat.row && seat.number) {
                              return `${seat.row}${seat.number}`;
                            } else if (seat && seat._id) {
                              return seat._id;
                            }
                            return seat;
                          }).join(', ')
                        : booking.seats || 'N/A'}
                    </Text>
                  </div>
                  
                  <Divider style={{ borderColor: '#333' }} />
                  
                  <div>
                    <Text strong style={{ color: '#e0e0e0' }}>Tổng tiền:</Text>
                    <br />
                    <Text style={{ color: '#ff4d4f', fontSize: '20px', fontWeight: 'bold' }}>
                      {booking.totalAmount?.toLocaleString('vi-VN')} VND
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* QR Code */}
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              marginTop: '32px',
              textAlign: 'center'
            }}
            bodyStyle={{ padding: '32px' }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              Mã QR vé điện tử
            </Title>
            
            <div style={{ 
              display: 'inline-block',
              padding: '16px',
              background: '#fff',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <QRCode
                value={booking._id}
                size={200}
                color="#000"
                bgColor="#fff"
              />
            </div>
            
            <Text style={{ color: '#999', display: 'block', marginBottom: '24px' }}>
              Quét mã QR này tại rạp để vào xem phim
            </Text>

            <Space size="middle">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                className="primary-button"
                onClick={handleDownloadTicket}
              >
                Tải vé
              </Button>
              
              <Button
                icon={<PrinterOutlined />}
                style={{
                  background: '#333',
                  border: '1px solid #666',
                  color: '#fff'
                }}
                onClick={handlePrintTicket}
              >
                In vé
              </Button>
            </Space>
          </Card>

          {/* Action Buttons */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                className="primary-button"
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </Button>
              
              <Button
                size="large"
                style={{
                  background: '#333',
                  border: '1px solid #666',
                  color: '#fff'
                }}
                onClick={() => navigate('/bookings')}
              >
                Xem lịch sử đặt vé
              </Button>
            </Space>
          </div>
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default ConfirmationPage;

