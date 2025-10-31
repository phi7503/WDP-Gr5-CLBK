import React, { useEffect, useState } from 'react';
import { Layout, Typography, Card, Row, Col, Button, QRCode, message, Spin } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { PrinterOutlined, MailOutlined, ReloadOutlined } from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { bookingAPI, payOSAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;

// Cinema Theme Styles
const cinemaStyles = {
  layout: {
    background: 'linear-gradient(180deg, #1a1a1a 0%, #252525 50%, #1f1f1f 100%)',
    minHeight: '100vh',
    transition: 'background 0.3s ease',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 50% 0%, rgba(255, 77, 79, 0.03) 0%, transparent 50%)',
      pointerEvents: 'none'
    }
  },
  card: {
    background: 'linear-gradient(135deg, #1f1f1f 0%, #252525 100%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 8px 24px rgba(255, 77, 79, 0.15), 0 0 0 1px rgba(255, 77, 79, 0.2)',
      transform: 'translateY(-2px)'
    }
  },
  title: {
    color: '#f5f5f5',
    textShadow: '0 2px 8px rgba(255, 77, 79, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)',
    fontWeight: 700
  },
  text: {
    color: '#f0f0f0',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
  },
  textLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
  }
};

const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBookingById(bookingId);
      let bookingData = null;
      
      if (response && response.booking) {
        bookingData = response.booking;
      } else if (response) {
        // Handle case where response is booking directly
        bookingData = response;
      }

      // Nếu paymentStatus vẫn là "pending" và có transactionId, check lại từ PayOS
      if (bookingData && bookingData.paymentStatus === 'pending' && bookingData.transactionId) {
        console.log('📋 Payment status is pending, checking PayOS...');
        setCheckingPayment(true);
        try {
          const checkResponse = await payOSAPI.checkAndUpdatePayment(bookingId);
          console.log('✅ Payment status checked and updated:', checkResponse);
          
          // ✅ Sử dụng booking từ response của checkAndUpdatePayment nếu có
          if (checkResponse && checkResponse.booking) {
            setBooking(checkResponse.booking);
            setLoading(false);
            setCheckingPayment(false);
            
            // Hiển thị warning nếu không thể kết nối PayOS
            if (checkResponse.warning) {
              message.warning(checkResponse.warning);
            }
            
            return; // Return early để không reload lại
          }
          
          // Nếu không thể kết nối PayOS nhưng vẫn có booking trong response
          if (checkResponse && checkResponse.success === false && checkResponse.booking) {
            setBooking(checkResponse.booking);
            setLoading(false);
            setCheckingPayment(false);
            message.warning(checkResponse.warning || checkResponse.message);
            return;
          }
          
          // Reload booking details sau khi update
          setTimeout(async () => {
            try {
              const updatedResponse = await bookingAPI.getBookingById(bookingId);
              if (updatedResponse && updatedResponse.booking) {
                setBooking(updatedResponse.booking);
              } else if (updatedResponse) {
                setBooking(updatedResponse);
              }
            } catch (error) {
              console.error('Error reloading booking:', error);
            } finally {
              setLoading(false);
              setCheckingPayment(false);
            }
          }, 1000);
          return; // Return early để không set booking ngay
        } catch (error) {
          console.error('Error checking payment status:', error);
          
          // Hiển thị thông báo lỗi chi tiết hơn
          const errorMessage = error.message || error.error || 'Không thể kiểm tra trạng thái thanh toán';
          
          if (errorMessage.includes('không thể kết nối') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('không khả dụng')) {
            message.error('Không thể kết nối đến PayOS. Vui lòng kiểm tra kết nối mạng và thử lại sau.');
          } else {
            message.error(errorMessage);
          }
          
          setCheckingPayment(false);
          // Continue to show booking even if check fails
        }
      }

      setBooking(bookingData);
    } catch (error) {
      console.error('Error loading booking details:', error);
          message.error('Không thể tải thông tin đặt vé');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const handleCheckPayment = async () => {
    if (!booking || !booking.transactionId) {
      message.warning('Không có thông tin thanh toán để kiểm tra');
      return;
    }

    setCheckingPayment(true);
    try {
      const checkResponse = await payOSAPI.checkAndUpdatePayment(bookingId);
      console.log('✅ Payment status checked:', checkResponse);
      
      if (checkResponse && checkResponse.booking) {
        setBooking(checkResponse.booking);
        if (checkResponse.booking.paymentStatus === 'completed') {
          message.success('Thanh toán đã được xác nhận thành công!');
        } else if (checkResponse.warning) {
          // Nếu có warning từ backend (không thể kết nối PayOS)
          message.warning(checkResponse.warning);
        } else {
          message.info(`Trạng thái thanh toán: ${checkResponse.paymentStatus || 'Chưa xác định'}`);
        }
      } else if (checkResponse && checkResponse.success === false && checkResponse.booking) {
        // Nếu không thể kết nối PayOS nhưng vẫn có booking
        setBooking(checkResponse.booking);
        
        // ✅ Hiển thị cảnh báo và cho phép retry nếu có thể
        if (checkResponse.canRetry) {
          message.warning({
            content: checkResponse.warning || checkResponse.message,
            duration: 5,
            onClose: () => {
              // Có thể thêm logic khi message đóng
            }
          });
        } else {
          message.warning(checkResponse.warning || checkResponse.message);
        }
      } else {
        // Reload booking sau khi check
        setTimeout(async () => {
          try {
            const updatedResponse = await bookingAPI.getBookingById(bookingId);
            if (updatedResponse && updatedResponse.booking) {
              setBooking(updatedResponse.booking);
              if (updatedResponse.booking.paymentStatus === 'completed') {
                message.success('Thanh toán đã được xác nhận thành công!');
              }
            } else if (updatedResponse) {
              setBooking(updatedResponse);
            }
          } catch (error) {
            console.error('Error reloading booking:', error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = error.message || error.error || 'Không thể kiểm tra trạng thái thanh toán';
      
      if (errorMessage.includes('không thể kết nối') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('không khả dụng')) {
        message.error('Không thể kết nối đến PayOS. Vui lòng kiểm tra kết nối mạng và thử lại sau.');
      } else {
        message.error(errorMessage);
      }
      
      setCheckingPayment(false);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleSendEmail = async () => {
    if (!booking.qrCode) {
      message.warning('QR code chưa có sẵn. Vui lòng đợi thanh toán hoàn tất.');
      return;
    }

    try {
      const response = await bookingAPI.resendEmailQRCode(bookingId);
      if (response.success) {
        message.success('Email đã được gửi thành công!');
      } else {
        message.error(response.message || 'Không thể gửi email. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      message.error('Không thể gửi email. Vui lòng thử lại sau.');
    }
  };

  if (loading || checkingPayment) {
    return (
      <Layout style={{ 
        background: 'linear-gradient(180deg, #1a1a1a 0%, #252525 50%, #1f1f1f 100%)', 
        minHeight: '100vh',
        transition: 'background 0.3s ease'
      }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text style={{ 
              color: '#f5f5f5', 
              fontSize: '18px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              fontWeight: 500
            }}>
              {checkingPayment ? 'Đang kiểm tra trạng thái thanh toán...' : 'Đang tải thông tin đặt vé...'}
            </Text>
          </div>
        </Content>
        <Footer />
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout style={{ 
        background: 'linear-gradient(180deg, #1a1a1a 0%, #252525 50%, #1f1f1f 100%)', 
        minHeight: '100vh',
        transition: 'background 0.3s ease'
      }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <Text style={{ 
            color: '#f5f5f5', 
            fontSize: '18px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            fontWeight: 500
          }}>
            Không tìm thấy thông tin đặt vé
          </Text>
        </Content>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout style={{ 
      background: 'linear-gradient(180deg, #1a1a1a 0%, #252525 50%, #1f1f1f 100%)',
      minHeight: '100vh',
      transition: 'background 0.3s ease',
      position: 'relative'
    }}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .booking-content {
          animation: fadeInUp 0.6s ease-out;
        }
        .booking-card {
          transition: all 0.3s ease;
        }
        .booking-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(255, 77, 79, 0.2), 0 0 0 1px rgba(255, 77, 79, 0.3) !important;
        }
      `}</style>
      <Header />
      
      <Content style={{ padding: '80px 24px', position: 'relative' }}>
        <div 
          className="booking-content"
          style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Title level={2} style={{ 
            color: '#f5f5f5', 
            marginBottom: '32px', 
            textAlign: 'center', 
            fontSize: '36px', 
            fontWeight: 700, 
            letterSpacing: '0.5px',
            textShadow: '0 4px 12px rgba(255, 77, 79, 0.4), 0 0 30px rgba(255, 255, 255, 0.1)'
          }}>
            Xác Nhận Đặt Vé
          </Title>
          
          <Row gutter={[32, 32]}>
            {/* Booking Details */}
            <Col xs={24} lg={16}>
              <Card
                className="booking-card"
                style={{ 
                  background: 'linear-gradient(135deg, #1f1f1f 0%, #252525 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  marginBottom: '28px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s ease'
                }}
              >
                <Title level={3} style={{ 
                  color: '#f5f5f5', 
                  marginBottom: '24px', 
                  fontSize: '22px', 
                  fontWeight: 700,
                  textShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                }}>
                  Thông Tin Đặt Vé
                </Title>
                
                <Row gutter={[16, 20]}>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '6px' }}>
                      <Text strong style={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>Mã Đặt Vé:</Text>
                    </div>
                    <Text style={{ 
                      color: '#f0f0f0', 
                      fontSize: '17px', 
                      fontWeight: 600, 
                      letterSpacing: '0.3px',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                    }}>{booking._id}</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '6px' }}>
                      <Text strong style={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>Trạng Thái:</Text>
                    </div>
                    <Text style={{ 
                      color: booking.bookingStatus === 'confirmed' ? '#52c41a' : booking.bookingStatus === 'pending' ? '#faad14' : '#ff4d4f',
                      fontWeight: 'bold',
                      fontSize: '17px',
                      letterSpacing: '0.3px',
                      textShadow: booking.bookingStatus === 'confirmed' ? '0 2px 8px rgba(82, 196, 26, 0.4)' : booking.bookingStatus === 'pending' ? '0 2px 8px rgba(250, 173, 20, 0.4)' : '0 2px 8px rgba(255, 77, 79, 0.4)'
                    }}>
                      {booking.bookingStatus === 'confirmed' ? 'ĐÃ XÁC NHẬN' : booking.bookingStatus === 'pending' ? 'ĐANG CHỜ' : booking.bookingStatus?.toUpperCase()}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '6px' }}>
                      <Text strong style={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>Phim:</Text>
                    </div>
                    <Text style={{ 
                      color: '#f0f0f0', 
                      fontSize: '17px', 
                      fontWeight: 600, 
                      letterSpacing: '0.3px',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                    }}>{booking.showtime?.movie?.title}</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '6px' }}>
                      <Text strong style={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>Ngày & Giờ:</Text>
                    </div>
                    <Text style={{ 
                      color: '#f0f0f0', 
                      fontSize: '17px', 
                      fontWeight: 600, 
                      letterSpacing: '0.3px',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                    }}>
                      {booking.showtime?.startTime ? 
                        `${new Date(booking.showtime.startTime).toLocaleDateString('vi-VN')} lúc ${new Date(booking.showtime.startTime).toLocaleTimeString('vi-VN')}` :
                        'N/A'
                      }
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '6px' }}>
                      <Text strong style={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>Rạp:</Text>
                    </div>
                    <Text style={{ 
                      color: '#f0f0f0', 
                      fontSize: '17px', 
                      fontWeight: 600, 
                      letterSpacing: '0.3px',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                    }}>{booking.showtime?.theater?.name}</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '6px' }}>
                      <Text strong style={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>Chi Nhánh:</Text>
                    </div>
                    <Text style={{ 
                      color: '#f0f0f0', 
                      fontSize: '17px', 
                      fontWeight: 600, 
                      letterSpacing: '0.3px',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                    }}>{booking.showtime?.branch?.name}</Text>
                  </Col>
                </Row>
              </Card>

              {/* Seats */}
              <Card
                className="booking-card"
                style={{ 
                  background: 'linear-gradient(135deg, #1f1f1f 0%, #252525 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  marginBottom: '28px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s ease'
                }}
              >
                <Title level={3} style={{ 
                  color: '#f5f5f5', 
                  marginBottom: '24px', 
                  fontSize: '22px', 
                  fontWeight: 700,
                  textShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                }}>
                  Ghế Đã Chọn
                </Title>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {booking.seats?.map((seat, index) => (
                    <div key={index} style={{ 
                      padding: '12px 16px', 
                      background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)', 
                      color: 'white', 
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(255, 77, 79, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s ease'
                    }}>
                      {seat.row}{seat.number}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Combos */}
              {booking.combos && booking.combos.length > 0 && (
                <Card
                  className="booking-card"
                  style={{ 
                    background: 'linear-gradient(135deg, #1f1f1f 0%, #252525 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    marginBottom: '28px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Title level={3} style={{ 
                    color: '#f5f5f5', 
                    marginBottom: '24px', 
                    fontSize: '22px', 
                    fontWeight: 700,
                    textShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                  }}>
                    Combo & Đồ Uống
                  </Title>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {booking.combos.map((combo, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div>
                          <Text strong style={{ 
                            color: '#f0f0f0', 
                            fontSize: '17px', 
                            fontWeight: 600, 
                            letterSpacing: '0.3px',
                            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                          }}>{combo.name}</Text><br/>
                          <Text style={{ 
                            color: 'rgba(255, 255, 255, 0.8)', 
                            fontSize: '16px', 
                            fontWeight: 500, 
                            marginTop: '4px', 
                            display: 'block',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                          }}>Số lượng: {combo.quantity}</Text>
                        </div>
                        <Text style={{ 
                          color: '#ff4d4f', 
                          fontWeight: 'bold', 
                          fontSize: '18px', 
                          letterSpacing: '0.3px',
                          textShadow: '0 2px 6px rgba(255, 77, 79, 0.5)'
                        }}>
                          {(combo.price * combo.quantity).toLocaleString('vi-VN')} VND
                        </Text>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Payment Info */}
              <Card
                className="booking-card"
                style={{ 
                  background: 'linear-gradient(135deg, #1f1f1f 0%, #252525 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s ease'
                }}
              >
                <Title level={3} style={{ 
                  color: '#f5f5f5', 
                  marginBottom: '24px', 
                  fontSize: '22px', 
                  fontWeight: 700,
                  textShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                }}>
                  Thông Tin Thanh Toán
                </Title>
                
                <Row gutter={[16, 20]}>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '6px' }}>
                      <Text strong style={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>Tổng Tiền:</Text>
                    </div>
                    <Text style={{ 
                      color: '#ff4d4f', 
                      fontSize: '26px', 
                      fontWeight: 'bold', 
                      letterSpacing: '0.3px',
                      textShadow: '0 3px 10px rgba(255, 77, 79, 0.6), 0 0 20px rgba(255, 77, 79, 0.3)'
                    }}>
                      {booking.totalAmount?.toLocaleString('vi-VN')} VND
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text strong style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600, letterSpacing: '0.3px' }}>Phương Thức Thanh Toán:</Text>
                    </div>
                    <Text style={{ color: '#ffffff', fontSize: '17px', fontWeight: 600, letterSpacing: '0.3px' }}>
                      {booking.paymentMethod?.toUpperCase() || 'N/A'}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text strong style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600, letterSpacing: '0.3px' }}>Trạng Thái Thanh Toán:</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Text style={{ 
                        color: booking.paymentStatus === 'completed' ? '#52c41a' : booking.paymentStatus === 'pending' ? '#faad14' : '#ff4d4f',
                        fontWeight: 'bold',
                        fontSize: '17px',
                        letterSpacing: '0.3px',
                        textShadow: booking.paymentStatus === 'completed' ? '0 2px 8px rgba(82, 196, 26, 0.5)' : booking.paymentStatus === 'pending' ? '0 2px 8px rgba(250, 173, 20, 0.5)' : '0 2px 8px rgba(255, 77, 79, 0.5)'
                      }}>
                        {booking.paymentStatus === 'completed' ? 'ĐÃ THANH TOÁN' : booking.paymentStatus === 'pending' ? 'ĐANG CHỜ' : booking.paymentStatus?.toUpperCase() || 'ĐANG CHỜ'}
                      </Text>
                      {booking.paymentStatus === 'pending' && booking.transactionId && (
                        <Button
                          type="link"
                          size="small"
                          icon={<ReloadOutlined />}
                          onClick={handleCheckPayment}
                          loading={checkingPayment}
                          style={{ color: '#40a9ff', padding: 0, fontSize: '15px', fontWeight: 600 }}
                        >
                          Kiểm tra lại
                        </Button>
                      )}
                    </div>
                  </Col>
                  {booking.discountAmount > 0 && (
                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text strong style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600, letterSpacing: '0.3px' }}>Giảm Giá:</Text>
                      </div>
                      <Text style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.3px' }}>
                        -{booking.discountAmount?.toLocaleString('vi-VN')} VND
                      </Text>
                    </Col>
                  )}
                </Row>
              </Card>
            </Col>

            {/* User Info */}
            <Card
              className="booking-card"
              style={{ 
                background: 'linear-gradient(135deg, #1f1f1f 0%, #252525 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                marginBottom: '28px',
                marginTop: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease'
              }}
            >
              <Title level={3} style={{ 
                color: '#f5f5f5', 
                marginBottom: '20px', 
                fontSize: '20px', 
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
              }}>Thông Tin Người Đặt Vé</Title>
              <div style={{ color: '#ffffff' }}>
                <div style={{ marginBottom: '16px', fontSize: '16px', lineHeight: 1.8 }}>
                  <Text strong style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600, letterSpacing: '0.3px' }}>Họ tên:</Text>{' '}
                  <Text style={{ color: '#ffffff', fontWeight: 600, fontSize: '17px', letterSpacing: '0.3px' }}>{(booking.customerInfo?.name ?? booking.user?.name) || 'N/A'}</Text>
                </div>
                <div style={{ marginBottom: '16px', fontSize: '16px', lineHeight: 1.8 }}>
                  <Text strong style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600, letterSpacing: '0.3px' }}>Email:</Text>{' '}
                  <Text style={{ color: '#ffffff', fontWeight: 600, fontSize: '17px', letterSpacing: '0.3px' }}>{(booking.customerInfo?.email ?? booking.user?.email) || 'N/A'}</Text>
                </div>
                {booking.customerInfo?.phone && (
                  <div style={{ marginBottom: '16px', fontSize: '16px', lineHeight: 1.8 }}>
                    <Text strong style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600, letterSpacing: '0.3px' }}>Điện thoại:</Text>{' '}
                    <Text style={{ color: '#ffffff', fontWeight: 600, fontSize: '17px', letterSpacing: '0.3px' }}>{booking.customerInfo.phone}</Text>
                  </div>
                )}
                {booking.paymentStatus === 'completed' && (
                  <div style={{ color: '#52c41a', fontWeight: 'bold', marginTop: 20, fontSize: '16px', lineHeight: 1.8, letterSpacing: '0.3px', padding: '12px', background: 'rgba(82, 196, 26, 0.1)', borderRadius: '6px', border: '1px solid rgba(82, 196, 26, 0.3)' }}>
                    ✓ Mã QR đã được gửi qua email: {(booking.customerInfo?.email ?? booking.user?.email) || 'N/A'}<br/>
                    (Vui lòng kiểm tra cả hộp thư Spam)
                  </div>
                )}
              </div>
            </Card>

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
                <Title level={3} style={{ color: '#ffffff', marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>
                  Vé Của Bạn
                </Title>
                
                {booking.paymentStatus === 'completed' ? (
                  <>
                    {/* Hiển thị QR code từ backend (base64 image) nếu có */}
                    {booking.qrCode ? (
                      <div style={{ marginBottom: '24px' }}>
                        <img 
                          src={booking.qrCode} 
                          alt="QR Code" 
                          style={{ 
                            width: '200px', 
                            height: '200px',
                            display: 'block',
                            margin: '0 auto',
                            background: '#fff',
                            padding: '8px',
                            borderRadius: '8px'
                          }} 
                        />
                      </div>
                    ) : (
                      <div style={{ marginBottom: '24px' }}>
                        <QRCode 
                          value={`${window.location.origin}/booking-details/${booking._id}`}
                          size={200}
                          color="#000"
                          bgColor="#fff"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ marginBottom: '24px', padding: '40px', textAlign: 'center' }}>
                    <Text style={{ color: '#ffffff', fontSize: '17px', fontWeight: 600, letterSpacing: '0.3px' }}>
                      QR code sẽ được tạo sau khi thanh toán thành công
                    </Text>
                    {booking.paymentStatus === 'pending' && (
                      <div style={{ marginTop: '20px' }}>
                        <Text style={{ color: '#faad14', fontSize: '18px', fontWeight: 700, letterSpacing: '0.3px' }}>
                          ⏳ Đang chờ thanh toán...
                        </Text>
                      </div>
                    )}
                  </div>
                )}
                
                <Text style={{ color: '#ffffff', display: 'block', marginBottom: '24px', fontSize: '17px', fontWeight: 600, letterSpacing: '0.3px' }}>
                  Hiển thị mã QR này tại cửa vào rạp
                </Text>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {booking.paymentStatus === 'pending' && booking.transactionId && (
                    <Button 
                      type="primary" 
                      className="primary-button"
                      icon={<ReloadOutlined />}
                      onClick={handleCheckPayment}
                      loading={checkingPayment}
                      size="large"
                      style={{ background: '#1890ff', borderColor: '#1890ff' }}
                    >
                      {checkingPayment ? 'Đang kiểm tra...' : 'Kiểm Tra Trạng Thái Thanh Toán'}
                    </Button>
                  )}
                  
                  <Button 
                    type="primary" 
                    className="primary-button"
                    icon={<PrinterOutlined />}
                    onClick={handlePrintTicket}
                    size="large"
                    disabled={booking.paymentStatus !== 'completed'}
                  >
                    In Vé
                  </Button>
                  
                  <Button 
                    icon={<MailOutlined />}
                    onClick={handleSendEmail}
                    size="large"
                    style={{ background: '#333', borderColor: '#555', color: '#fff' }}
                    disabled={booking.paymentStatus !== 'completed'}
                  >
                    Gửi Email
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
                <Title level={4} style={{ color: '#ffffff', marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>
                  Lưu Ý Quan Trọng
                </Title>
                
                <ul style={{ color: '#ffffff', paddingLeft: '24px', fontSize: '16px', lineHeight: 2.0 }}>
                  <li style={{ marginBottom: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>Đến rạp ít nhất 15 phút trước giờ chiếu</li>
                  <li style={{ marginBottom: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>Mang theo CMND/CCCD để xác minh</li>
                  <li style={{ marginBottom: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>Không hoàn tiền khi không đến</li>
                  <li style={{ marginBottom: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>Liên hệ hỗ trợ nếu có vấn đề</li>
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
                Về Trang Chủ
              </Button>
            </Link>
            
            <Link to="/movies">
              <Button 
                size="large"
                style={{ background: '#333', borderColor: '#555', color: '#fff' }}
              >
                Xem Thêm Phim
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
