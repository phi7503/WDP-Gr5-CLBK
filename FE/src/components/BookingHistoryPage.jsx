import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Card, Row, Col, Space, Tag, Empty, message, Modal } from 'antd';
import { EyeOutlined, DownloadOutlined, CalendarOutlined, ClockCircleOutlined, QrcodeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { bookingAPI, getImageUrl } from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getUserBookings();
      
      // Handle different response formats
      const bookingsData = Array.isArray(response) ? response : (response.bookings || []);
      
      if (Array.isArray(bookingsData)) {
        setBookings(bookingsData);
      } else {
        console.error('Invalid bookings data format:', bookingsData);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      // ✅ Lỗi sẽ tự động được hiển thị bởi api.js
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
    // ✅ Navigate đến BookingDetailsPage thay vì ConfirmationPage
    // ConfirmationPage là trang confirmation sau khi đặt vé
    // BookingDetailsPage là trang xem chi tiết booking từ lịch sử
    navigate(`/booking-details/${booking._id}`);
  };

  const handleViewQRCode = (booking) => {
    if (booking.qrCode) {
      setSelectedQRCode(booking.qrCode);
      setQrModalVisible(true);
      
      // Force refresh QR image to bypass browser caching
      setTimeout(() => {
        setQrModalVisible(false);
        setTimeout(() => {
          setQrModalVisible(true);
        }, 100);
      }, 100);
    } else {
      message.warning('QR code không có sẵn cho booking này');
    }
  };

  const handleDownloadTicket = (booking) => {
    if (booking.qrCode) {
      const link = document.createElement('a');
      link.href = booking.qrCode;
      link.download = `ticket-${booking._id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Vé đã được tải xuống!');
    } else {
      message.warning('QR code không có sẵn để tải xuống');
    }
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
                    styles={{ body: { padding: '24px' } }}
                  >
                    <Row gutter={[24, 24]} align="middle">
                      {/* Movie Poster */}
                      <Col xs={24} sm={6} md={4}>
                        <img
                          src={getImageUrl(booking.showtime?.movie?.poster || booking.movie?.poster) || 'https://via.placeholder.com/150x225/333/fff?text=No+Poster'}
                          alt={booking.showtime?.movie?.title || booking.movie?.title || 'Movie Poster'}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x225/333/fff?text=No+Poster';
                          }}
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            maxWidth: '150px',
                            objectFit: 'cover',
                            aspectRatio: '2/3',
                            background: '#1a1a1a'
                          }}
                        />
                      </Col>

                      {/* Booking Info */}
                      <Col xs={24} sm={18} md={20}>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={12}>
                            <Space direction="vertical" size="small">
                              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                                {booking.showtime?.movie?.title || booking.movie?.title}
                              </Title>
                              
                              <Text style={{ color: '#999' }}>
                                {Array.isArray(booking.showtime?.movie?.genre) 
                                  ? booking.showtime.movie.genre.join(', ')
                                  : booking.showtime?.movie?.genre || booking.movie?.genre
                                }
                              </Text>
                              
                              <Space size="small">
                                <CalendarOutlined style={{ color: '#999' }} />
                                <Text style={{ color: '#fff' }}>
                                  {dayjs(booking.showtime?.startTime).format('DD/MM/YYYY')}
                                </Text>
                              </Space>
                              
                              <Space size="small">
                                <ClockCircleOutlined style={{ color: '#999' }} />
                                <Text style={{ color: '#fff' }}>
                                  {dayjs(booking.showtime?.startTime).format('HH:mm')} - {dayjs(booking.showtime?.endTime).format('HH:mm')}
                                </Text>
                              </Space>
                              
                              <Text style={{ color: '#999' }}>
                                {booking.showtime?.branch?.name || booking.showtime?.branch} - {booking.showtime?.theater?.name || booking.showtime?.theater}
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
                                  {booking.seats && Array.isArray(booking.seats) 
                                    ? booking.seats.map(seat => {
                                        // ✅ Xử lý cả object và string
                                        if (typeof seat === 'string') {
                                          return seat;
                                        } else if (seat && seat.row && seat.number) {
                                          return `${seat.row}${seat.number}`;
                                        } else if (seat && seat._id) {
                                          // Nếu là object chỉ có _id, cần lấy thông tin từ seat
                                          return seat._id;
                                        }
                                        return seat;
                                      }).join(', ')
                                    : booking.seats || 'N/A'}
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
                            icon={<QrcodeOutlined />}
                            style={{
                              background: '#1890ff',
                              border: '1px solid #1890ff',
                              color: '#fff'
                            }}
                            onClick={() => handleViewQRCode(booking)}
                          >
                            QR Code
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
      
      {/* QR Code Modal */}
      <Modal
        title="QR Code Vé"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            Đóng
          </Button>
        ]}
        centered
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {selectedQRCode && (
            <img
              src={selectedQRCode}
              alt="QR Code"
              style={{
                maxWidth: '100%',
                height: 'auto',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
          )}
          <div style={{ marginTop: '16px', color: '#666' }}>
            Quét mã QR để xem thông tin vé
          </div>
        </div>
      </Modal>
      
      <Footer />
    </Layout>
  );
};

export default BookingHistoryPage;
