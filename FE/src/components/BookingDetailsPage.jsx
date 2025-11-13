import React, { useEffect, useState, useRef } from 'react';
import { Layout, Typography, Card, Row, Col, Button, QRCode, message, Spin, Tag, Divider, Modal } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { 
  PrinterOutlined, 
  MailOutlined, 
  ReloadOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  StarFilled,
  HomeOutlined
} from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { bookingAPI, payOSAPI, branchAPI } from '../services/api';

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
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const mapModalRef = useRef(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapModalMap, setMapModalMap] = useState(null);

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
      
      // Load branch details if branch ID exists
      if (bookingData?.showtime?.branch?._id) {
        try {
          const branchResponse = await branchAPI.getBranchById(bookingData.showtime.branch._id);
          setBranch(branchResponse);
        } catch (error) {
          console.error('Error loading branch details:', error);
        }
      }
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

  // Helper function to get status badge config
  const getStatusConfig = (status) => {
    const statusMap = {
      confirmed: {
        color: '#52c41a',
        icon: <CheckCircleOutlined />,
        text: 'ĐÃ XÁC NHẬN',
        glowColor: 'rgba(82, 196, 26, 0.5)',
        pulse: false
      },
      pending: {
        color: '#faad14',
        icon: <ClockCircleOutlined />,
        text: 'ĐANG CHỜ',
        glowColor: 'rgba(250, 173, 20, 0.5)',
        pulse: true
      },
      cancelled: {
        color: '#ff4d4f',
        icon: <CloseCircleOutlined />,
        text: 'ĐÃ HỦY',
        glowColor: 'rgba(255, 77, 79, 0.5)',
        pulse: false
      }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Load Leaflet (OpenStreetMap)
  useEffect(() => {
    if (window.L) {
      setMapLoaded(true);
    } else {
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          setMapLoaded(true);
          clearInterval(checkLeaflet);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkLeaflet);
        if (!window.L) {
          console.warn('Leaflet chưa được load');
        }
      }, 5000);
    }
  }, []);

  // Initialize Leaflet Map (Preview)
  useEffect(() => {
    if (!mapLoaded || !window.L || !branch?.location?.coordinates || map || !mapRef.current) return;

    const lat = branch.location.coordinates.latitude;
    const lng = branch.location.coordinates.longitude;

    if (!lat || !lng) return;

    try {
      const leafletMap = window.L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(leafletMap);

      // Add marker
      window.L.marker([lat, lng])
        .addTo(leafletMap)
        .bindPopup(`<strong>${branch.name}</strong><br/>${branch.location?.address || ''}`)
        .openPopup();

      setMap(leafletMap);

      // Invalidate size to ensure proper rendering
      setTimeout(() => {
        if (leafletMap) {
          leafletMap.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [mapLoaded, branch, map]);

  // Initialize Leaflet Map in Modal
  useEffect(() => {
    if (!mapModalVisible || !mapLoaded || !window.L || !branch?.location?.coordinates || mapModalMap || !mapModalRef.current) return;

    const lat = branch.location.coordinates.latitude;
    const lng = branch.location.coordinates.longitude;

    if (!lat || !lng) return;

    try {
      const modalMap = window.L.map(mapModalRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        attributionControl: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(modalMap);

      // Add marker
      window.L.marker([lat, lng])
        .addTo(modalMap)
        .bindPopup(`<strong>${branch.name}</strong><br/>${branch.location?.address || ''}`)
        .openPopup();

      setMapModalMap(modalMap);

      // Invalidate size to ensure proper rendering
      setTimeout(() => {
        if (modalMap) {
          modalMap.invalidateSize();
        }
      }, 300);
    } catch (error) {
      console.error('Error initializing modal map:', error);
    }

    return () => {
      if (mapModalMap) {
        mapModalMap.remove();
        setMapModalMap(null);
      }
    };
  }, [mapModalVisible, mapLoaded, branch, mapModalMap]);

  // Get OpenStreetMap directions URL
  const getDirectionsUrl = () => {
    if (!branch?.location?.coordinates?.latitude || !branch?.location?.coordinates?.longitude) {
      return null;
    }
    const lat = branch.location.coordinates.latitude;
    const lng = branch.location.coordinates.longitude;
    return `https://www.openstreetmap.org/directions?to=${lat},${lng}`;
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
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 25px var(--glow-color, rgba(250, 173, 20, 0.6));
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 40px var(--glow-color, rgba(250, 173, 20, 0.9));
            transform: scale(1.02);
          }
        }
        @keyframes steadyGlow {
          0%, 100% {
            box-shadow: 0 0 25px var(--glow-color, rgba(82, 196, 26, 0.6));
          }
        }
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes qrGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 77, 79, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 77, 79, 0.6);
          }
        }
        .booking-content {
          animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.320, 1);
        }
        .booking-card {
          background: rgba(30, 30, 40, 0.7) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 77, 79, 0.1) !important;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1);
        }
        .booking-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 30px 80px rgba(255, 77, 79, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 77, 79, 0.3) !important;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 28px;
          border-radius: 28px;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.5px;
          border: none !important;
        }
        .status-badge.pulse {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .status-badge.steady {
          animation: steadyGlow 2s ease-in-out infinite;
        }
        .gradient-text {
          background: linear-gradient(135deg, #ffd700 0%, #ff4d4f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        .gradient-amount {
          background: linear-gradient(135deg, #ffd700 0%, #ff4d4f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .qr-container {
          position: relative;
          padding: 20px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }
        .qr-container::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(255, 77, 79, 0.3), rgba(255, 215, 0, 0.3));
          z-index: -1;
          animation: qrGlow 3s ease-in-out infinite;
        }
        .section-title {
          position: relative;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        .section-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #ff4d4f, transparent);
          border-radius: 2px;
        }
        .soft-button {
          background: linear-gradient(135deg, rgba(255, 77, 79, 0.2), rgba(255, 77, 79, 0.1)) !important;
          border: 1px solid rgba(255, 77, 79, 0.3) !important;
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
        }
        .soft-button:hover {
          background: linear-gradient(135deg, rgba(255, 77, 79, 0.4), rgba(255, 77, 79, 0.2)) !important;
          border-color: rgba(255, 77, 79, 0.5) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 77, 79, 0.3);
        }
      `}</style>
      <Header />
      
      <Content style={{ padding: '60px 24px', position: 'relative' }}>
        <div 
          className="booking-content"
          style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Header with Status Badge */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <Title level={1} className="gradient-text" style={{ 
              marginBottom: 0, 
              fontSize: '42px', 
              fontWeight: 700, 
              letterSpacing: '0.5px',
              textShadow: '0 4px 12px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.3)'
            }}>
              Xác Nhận Đặt Vé
            </Title>
            {booking && (() => {
              const statusConfig = getStatusConfig(booking.bookingStatus || booking.paymentStatus);
              return (
                <div
                  className={`status-badge ${statusConfig.pulse ? 'pulse' : 'steady'}`}
                  style={{
                    background: statusConfig.color,
                    color: '#fff',
                    border: `2px solid ${statusConfig.color}`,
                    '--glow-color': statusConfig.glowColor
                  }}
                >
                  {statusConfig.icon}
                  {statusConfig.text}
                </div>
              );
            })()}
          </div>
          
          {/* Main Content - 3 Column Layout */}
          <Row gutter={[32, 32]}>
            {/* Column 1: Booking Summary (40%) */}
            <Col xs={24} lg={10}>
              <Card
                className="booking-card"
                styles={{
                  body: { padding: '28px' }
                }}
              >
                <Title level={3} className="section-title" style={{ 
                  color: '#f5f5f5', 
                  marginBottom: 0, 
                  fontSize: '24px', 
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
                styles={{
                  body: { padding: '28px' }
                }}
              >
                <Title level={3} className="section-title" style={{ 
                  color: '#f5f5f5', 
                  marginBottom: 0, 
                  fontSize: '24px', 
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
                      borderRadius: '16px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(255, 77, 79, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                  styles={{
                    body: { padding: '28px' }
                  }}
                >
                  <Title level={3} className="section-title" style={{ 
                    color: '#f5f5f5', 
                    marginBottom: 0, 
                    fontSize: '24px', 
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
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                styles={{
                  body: { padding: '28px' }
                }}
              >
                <Title level={3} className="section-title" style={{ 
                  color: '#f5f5f5', 
                  marginBottom: 0, 
                  fontSize: '24px', 
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
                    <Text className="gradient-amount" style={{ 
                      fontSize: '32px', 
                      fontWeight: 'bold', 
                      letterSpacing: '0.5px',
                      display: 'block'
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

              {/* User Info */}
              <Card
                className="booking-card"
                styles={{
                  body: { padding: '28px' }
                }}
              >
                <Title level={3} className="section-title" style={{ 
                  color: '#f5f5f5', 
                  marginBottom: 0, 
                  fontSize: '24px', 
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
                    <div style={{ color: '#52c41a', fontWeight: 'bold', marginTop: 20, fontSize: '16px', lineHeight: 1.8, letterSpacing: '0.3px', padding: '12px', background: 'rgba(82, 196, 26, 0.1)', borderRadius: '16px', border: '1px solid rgba(82, 196, 26, 0.3)' }}>
                      ✓ Mã QR đã được gửi qua email: {(booking.customerInfo?.email ?? booking.user?.email) || 'N/A'}<br/>
                      (Vui lòng kiểm tra cả hộp thư Spam)
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* Column 2: Theater Details + Map (35%) */}
            <Col xs={24} lg={8}>
              <Card
                className="booking-card"
                styles={{
                  body: { padding: '28px' }
                }}
              >
                <Title level={3} className="section-title" style={{ 
                  color: '#f5f5f5', 
                  marginBottom: 0, 
                  fontSize: '24px', 
                  fontWeight: 700,
                  textShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                }}>
                  Chi Tiết Rạp
                </Title>
                
                {branch ? (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <HomeOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                        <Text strong style={{ color: '#f0f0f0', fontSize: '18px', fontWeight: 700 }}>
                          {branch.name}
                        </Text>
                      </div>
                      
                      {branch.rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <StarFilled style={{ color: '#ffd700', fontSize: '16px' }} />
                          <Text style={{ color: '#ffd700', fontSize: '16px', fontWeight: 600 }}>
                            {branch.rating} ({branch.reviewCount || 0} đánh giá)
                          </Text>
                        </div>
                      )}
                      
                      {branch.location?.address && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                          <EnvironmentOutlined style={{ color: '#40a9ff', fontSize: '16px', marginTop: '2px' }} />
                          <Text style={{ color: '#f0f0f0', fontSize: '16px' }}>
                            {branch.location.address}, {branch.location.city}, {branch.location.province}
                          </Text>
                        </div>
                      )}
                      
                      {branch.contact?.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <PhoneOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                          <Text style={{ color: '#f0f0f0', fontSize: '16px' }}>
                            {branch.contact.phone}
                          </Text>
                        </div>
                      )}
                      
                      {branch.operatingHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <ClockCircleOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                          <Text style={{ color: '#f0f0f0', fontSize: '16px' }}>
                            {branch.operatingHours.open} - {branch.operatingHours.close}
                          </Text>
                        </div>
                      )}
                      
                      {branch.facilities && branch.facilities.length > 0 && (
                        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {branch.facilities.map((facility, index) => (
                              <Tag key={index} color="red" style={{ margin: 0 }}>
                                {facility}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Leaflet Map Preview */}
                    {branch.location?.coordinates?.latitude && branch.location?.coordinates?.longitude ? (
                      <div style={{ marginTop: '24px', marginBottom: '16px' }}>
                        <div
                          ref={mapRef}
                          style={{
                            width: '100%',
                            height: '250px',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 77, 79, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.23, 1, 0.320, 1)'
                          }}
                          onClick={() => setMapModalVisible(true)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 77, 79, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
                          }}
                        />
                        {!mapLoaded && (
                          <div style={{ 
                            padding: '40px', 
                            textAlign: 'center', 
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '20px',
                            marginTop: '24px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <Spin />
                            <div style={{ marginTop: '12px' }}>
                              <Text style={{ color: '#999', fontSize: '14px' }}>
                                Đang tải bản đồ...
                              </Text>
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                          <Button
                            className="soft-button"
                            icon={<EnvironmentOutlined />}
                            onClick={() => setMapModalVisible(true)}
                            style={{ 
                              flex: 1,
                              height: '44px',
                              borderRadius: '16px',
                              fontWeight: 600
                            }}
                          >
                            Xem Bản Đồ Lớn
                          </Button>
                          {getDirectionsUrl() && (
                            <Button
                              type="link"
                              icon={<EnvironmentOutlined />}
                              href={getDirectionsUrl()}
                              target="_blank"
                              className="soft-button"
                              style={{ 
                                flex: 1,
                                height: '44px',
                                borderRadius: '16px',
                                fontWeight: 600
                              }}
                            >
                              Chỉ Đường
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '40px', 
                        textAlign: 'center', 
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '20px',
                        marginTop: '24px',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <Text style={{ color: '#999', fontSize: '14px' }}>
                          Bản đồ không khả dụng
                        </Text>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin />
                    <div style={{ marginTop: '16px' }}>
                      <Text style={{ color: '#999' }}>Đang tải thông tin rạp...</Text>
                    </div>
                  </div>
                )}
              </Card>
            </Col>

            {/* Column 3: QR Code & Actions (25%) */}
            <Col xs={24} lg={6}>
              <Card
                className="booking-card"
                styles={{
                  body: { padding: '28px', textAlign: 'center' }
                }}
              >
                <Title level={3} className="section-title" style={{ 
                  color: '#f5f5f5', 
                  marginBottom: 0, 
                  fontSize: '24px', 
                  fontWeight: 700,
                  textShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                }}>
                  Mã Vé Tử (QR Code)
                </Title>
                
                {booking.paymentStatus === 'completed' ? (
                  <>
                    {/* Hiển thị QR code từ backend (base64 image) nếu có */}
                    {booking.qrCode ? (
                      <div className="qr-container" style={{ marginBottom: '24px', display: 'inline-block' }}>
                        <img 
                          src={booking.qrCode} 
                          alt="QR Code" 
                          style={{ 
                            width: '200px', 
                            height: '200px',
                            display: 'block',
                            margin: '0 auto',
                            background: '#fff',
                            padding: '12px',
                            borderRadius: '16px'
                          }} 
                        />
                      </div>
                    ) : (
                      <div className="qr-container" style={{ marginBottom: '24px', display: 'inline-block' }}>
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
                    className="soft-button"
                    icon={<PrinterOutlined />}
                    onClick={handlePrintTicket}
                    size="large"
                    disabled={booking.paymentStatus !== 'completed'}
                    style={{ 
                      width: '100%',
                      height: '48px',
                      borderRadius: '16px',
                      fontWeight: 600,
                      marginBottom: '12px'
                    }}
                  >
                    In Vé
                  </Button>
                  
                  <Button 
                    className="soft-button"
                    icon={<MailOutlined />}
                    onClick={handleSendEmail}
                    size="large"
                    disabled={booking.paymentStatus !== 'completed'}
                    style={{ 
                      width: '100%',
                      height: '48px',
                      borderRadius: '16px',
                      fontWeight: 600
                    }}
                  >
                    Gửi Email
                  </Button>
                </div>
              </Card>

              {/* Important Notes */}
              <Card
                className="booking-card"
                styles={{
                  body: { padding: '28px' }
                }}
              >
                <Title level={4} className="section-title" style={{ 
                  color: '#ffffff', 
                  marginBottom: 0, 
                  fontSize: '20px', 
                  fontWeight: 700 
                }}>
                  ⚠️ Lưu Ý Quan Trọng
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
          <div style={{ textAlign: 'center', marginTop: '48px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/">
              <Button 
                className="soft-button"
                size="large"
                style={{ 
                  height: '48px',
                  padding: '0 32px',
                  borderRadius: '16px',
                  fontWeight: 600
                }}
              >
                Về Trang Chủ
              </Button>
            </Link>
            
            <Link to="/movies">
              <Button 
                className="soft-button"
                size="large"
                style={{ 
                  height: '48px',
                  padding: '0 32px',
                  borderRadius: '16px',
                  fontWeight: 600
                }}
              >
                Xem Thêm Phim
              </Button>
            </Link>
          </div>
        </div>
      </Content>
      
      <Footer />

      {/* Map Modal */}
      <Modal
        title={null}
        open={mapModalVisible}
        onCancel={() => setMapModalVisible(false)}
        footer={null}
        width="90vw"
        styles={{
          body: {
            padding: 0,
            height: '80vh',
            borderRadius: '20px',
            overflow: 'hidden'
          }
        }}
        style={{ top: 20 }}
        closeIcon={<CloseCircleOutlined style={{ color: '#fff', fontSize: '24px' }} />}
      >
        {branch && branch.location?.coordinates && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div
              ref={mapModalRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '600px'
              }}
            />
            {!mapLoaded && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                zIndex: 1000
              }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text style={{ color: '#fff' }}>Đang tải bản đồ...</Text>
                </div>
              </div>
            )}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'rgba(30, 30, 40, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '16px 24px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 77, 79, 0.3)',
              zIndex: 1000
            }}>
              <Text strong style={{ color: '#fff', fontSize: '18px', display: 'block', marginBottom: '8px' }}>
                {branch.name}
              </Text>
              <Text style={{ color: '#a8a8a8', fontSize: '14px' }}>
                {branch.location?.address}, {branch.location?.city}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default BookingDetailsPage;
