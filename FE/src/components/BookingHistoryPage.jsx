import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Card, Row, Col, Space, Tag, Empty, message } from 'antd';
import { EyeOutlined, DownloadOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { bookingAPI } from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const bookings = await bookingAPI.getUserBookings();
      setBookings(bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      message.error('Không thể tải lịch sử đặt vé');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'blue';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      case 'pending':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'pending':
        return 'Chờ xác nhận';
      default:
        return status;
    }
  };

  const handleViewDetails = (booking) => {
    navigate('/confirmation', { 
      state: { 
        booking, 
        movie: booking.movie, 
        showtime: booking.showtime 
      } 
    });
  };

  const handleDownloadTicket = (booking) => {
    message.success('Vé đã được tải xuống!');
  };

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: '32px' }}>
            Lịch sử đặt vé
          </Title>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Text style={{ color: '#999' }}>Đang tải...</Text>
            </div>
          ) : bookings.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: '#999' }}>
                  Bạn chưa có đặt vé nào
                </Text>
              }
              style={{ margin: '80px 0' }}
            >
              <Button type="primary" className="primary-button" onClick={() => navigate('/')}>
                Đặt vé ngay
              </Button>
            </Empty>
          ) : (
            <Row gutter={[24, 24]}>
              {bookings.map((booking) => (
                <Col xs={24} key={booking._id}>
                  <Card
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '12px'
                    }}
                    bodyStyle={{ padding: '24px' }}
                  >
                    <Row gutter={[24, 24]} align="middle">
                      {/* Movie Poster */}
                      <Col xs={24} sm={6} md={4}>
                        <img
                          src={booking.movie.poster}
                          alt={booking.movie.title}
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            maxWidth: '150px'
                          }}
                        />
                      </Col>

                      {/* Booking Info */}
                      <Col xs={24} sm={18} md={20}>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={12}>
                            <Space direction="vertical" size="small">
                              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                                {booking.movie.title}
                              </Title>
                              
                              <Text style={{ color: '#999' }}>
                                {booking.movie.genre.join(', ')}
                              </Text>
                              
                              <Space size="small">
                                <CalendarOutlined style={{ color: '#999' }} />
                                <Text style={{ color: '#fff' }}>
                                  {dayjs(booking.showtime.startTime).format('DD/MM/YYYY')}
                                </Text>
                              </Space>
                              
                              <Space size="small">
                                <ClockCircleOutlined style={{ color: '#999' }} />
                                <Text style={{ color: '#fff' }}>
                                  {dayjs(booking.showtime.startTime).format('HH:mm')} - {dayjs(booking.showtime.endTime).format('HH:mm')}
                                </Text>
                              </Space>
                              
                              <Text style={{ color: '#999' }}>
                                {booking.showtime.branch} - {booking.showtime.theater}
                              </Text>
                            </Space>
                          </Col>

                          <Col xs={24} md={12}>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <div>
                                <Text strong style={{ color: '#e0e0e0' }}>Mã đặt vé:</Text>
                                <br />
                                <Text style={{ color: '#fff', fontFamily: 'monospace' }}>
                                  {booking._id}
                                </Text>
                              </div>
                              
                              <div>
                                <Text strong style={{ color: '#e0e0e0' }}>Ghế:</Text>
                                <br />
                                <Text style={{ color: '#fff' }}>
                                  {booking.seats.join(', ')}
                                </Text>
                              </div>
                              
                              <div>
                                <Text strong style={{ color: '#e0e0e0' }}>Tổng tiền:</Text>
                                <br />
                                <Text style={{ color: '#ff4d4f', fontSize: '16px', fontWeight: 'bold' }}>
                                  {booking.totalAmount.toLocaleString('vi-VN')} VND
                                </Text>
                              </div>
                              
                              <div>
                                <Tag color={getStatusColor(booking.status)}>
                                  {getStatusText(booking.status)}
                                </Tag>
                              </div>
                            </Space>
                          </Col>
                        </Row>
                      </Col>

                      {/* Actions */}
                      <Col xs={24} sm={24} md={24}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end',
                          gap: '12px',
                          marginTop: '16px',
                          borderTop: '1px solid #333',
                          paddingTop: '16px'
                        }}>
                          <Button
                            icon={<EyeOutlined />}
                            style={{
                              background: '#333',
                              border: '1px solid #666',
                              color: '#fff'
                            }}
                            onClick={() => handleViewDetails(booking)}
                          >
                            Xem chi tiết
                          </Button>
                          
                          <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            className="primary-button"
                            onClick={() => handleDownloadTicket(booking)}
                          >
                            Tải vé
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default BookingHistoryPage;
