import React, { useState } from 'react';
import { Layout, Typography, Card, Row, Col, Button, Radio, Space, Divider, message, Steps } from 'antd';
import { CreditCardOutlined, BankOutlined, WalletOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from "../context/app.context";
import { bookingAPI } from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const { booking, movie, showtime } = location.state || {};

  const steps = [
    {
      title: 'Xác nhận đơn hàng',
      description: 'Kiểm tra thông tin đặt vé'
    },
    {
      title: 'Thanh toán',
      description: 'Chọn phương thức thanh toán'
    },
    {
      title: 'Hoàn thành',
      description: 'Nhận vé điện tử'
    }
  ];

  const paymentMethods = [
    {
      value: 'credit_card',
      label: 'Thẻ tín dụng/ghi nợ',
      icon: <CreditCardOutlined />,
      description: 'Visa, Mastercard, JCB'
    },
    {
      value: 'bank_transfer',
      label: 'Chuyển khoản ngân hàng',
      icon: <BankOutlined />,
      description: 'Vietcombank, Techcombank, BIDV'
    },
    {
      value: 'e_wallet',
      label: 'Ví điện tử',
      icon: <WalletOutlined />,
      description: 'MoMo, ZaloPay, VNPay'
    }
  ];

  const handlePayment = async () => {
    if (!isAuthenticated()) {
      message.warning('Vui lòng đăng nhập để thanh toán!');
      navigate('/auth');
      return;
    }

    if (!booking || !movie || !showtime) {
      message.error('Thông tin đặt vé không hợp lệ!');
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update booking status to confirmed
      const updatedBooking = {
        ...booking,
        status: 'confirmed',
        paymentMethod: paymentMethod,
        paidAt: new Date().toISOString()
      };

      message.success('Thanh toán thành công!');
      
      // Navigate to confirmation page
      navigate('/confirmation', {
        state: {
          booking: updatedBooking,
          movie: movie,
          showtime: showtime
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      // ✅ Lỗi sẽ tự động được hiển thị bởi api.js
    } finally {
      setLoading(false);
    }
  };

  if (!booking || !movie || !showtime) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <Title level={3} style={{ color: '#fff' }}>
            Không tìm thấy thông tin đặt vé
          </Title>
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
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Steps */}
          <div style={{ marginBottom: '48px' }}>
            <Steps
              current={currentStep}
              items={steps}
              style={{ color: '#fff' }}
            />
          </div>

          <Row gutter={[32, 32]}>
            {/* Order Summary */}
            <Col xs={24} lg={12}>
              <Card
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
                  Thông tin đặt vé
                </Title>

                <div style={{ marginBottom: '24px' }}>
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
                    <Text strong style={{ color: '#e0e0e0' }}>Phim:</Text>
                    <br />
                    <Text style={{ color: '#fff', fontSize: '16px' }}>{movie.title}</Text>
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
                    <Text style={{ color: '#ff4d4f', fontSize: '24px', fontWeight: 'bold' }}>
                      {booking.totalAmount?.toLocaleString('vi-VN')} VND
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Payment Method */}
            <Col xs={24} lg={12}>
              <Card
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
                  Phương thức thanh toán
                </Title>

                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {paymentMethods.map((method) => (
                      <Radio
                        key={method.value}
                        value={method.value}
                        style={{
                          width: '100%',
                          padding: '16px',
                          background: '#333',
                          borderRadius: '8px',
                          border: '1px solid #666',
                          color: '#fff'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ fontSize: '20px', color: '#ff4d4f' }}>
                            {method.icon}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 'bold' }}>
                              {method.label}
                            </div>
                            <div style={{ color: '#999', fontSize: '14px' }}>
                              {method.description}
                            </div>
                          </div>
                        </div>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>

                <div style={{ marginTop: '32px' }}>
                  <Button
                    type="primary"
                    size="large"
                    className="primary-button"
                    loading={loading}
                    onClick={handlePayment}
                    block
                    style={{ height: '56px', fontSize: '18px', fontWeight: 'bold' }}
                  >
                    {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
                  </Button>
                </div>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Text style={{ color: '#999', fontSize: '12px' }}>
                    Bằng cách thanh toán, bạn đồng ý với{' '}
                    <a href="#" style={{ color: '#ff4d4f' }}>Điều khoản sử dụng</a>
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Security Notice */}
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              marginTop: '32px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
              <div>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  Thanh toán an toàn
                </Text>
                <br />
                <Text style={{ color: '#999', fontSize: '14px' }}>
                  Thông tin thanh toán của bạn được mã hóa và bảo mật tuyệt đối
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default PaymentPage;

