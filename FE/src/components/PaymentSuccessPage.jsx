import React, { useEffect, useState } from 'react';
import { Layout, Result, Button, Card, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { bookingAPI } from '../services/api';

const { Content } = Layout;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        // Kiểm tra booking status sau vài giây để đảm bảo webhook đã xử lý
        setTimeout(async () => {
          try {
            const response = await bookingAPI.getBookingById(bookingId);
            if (response.success && response.booking) {
              setBooking(response.booking);
            }
          } catch (error) {
            console.error('Error fetching booking:', error);
          } finally {
            setLoading(false);
          }
        }, 2000);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    checkBookingStatus();
  }, [bookingId]);

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <Spin size="large" />
              <p style={{ color: '#fff', marginTop: '20px' }}>Đang xử lý thanh toán...</p>
            </div>
          ) : (
            <Result
              icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '72px' }} />}
              title={
                <span style={{ color: '#fff', fontSize: '24px' }}>
                  Thanh toán thành công!
                </span>
              }
              subTitle={
                <div style={{ color: '#ccc', marginTop: '20px' }}>
                  <p>Cảm ơn bạn đã thanh toán!</p>
                  {booking ? (
                    <>
                      <p>Mã QR code đã được gửi đến email của bạn.</p>
                      <p>Vui lòng kiểm tra email để nhận mã QR code và check-in tại rạp.</p>
                    </>
                  ) : (
                    <p>Vui lòng kiểm tra email để nhận mã QR code.</p>
                  )}
                </div>
              }
              extra={[
                <Button
                  type="primary"
                  key="booking-details"
                  size="large"
                  onClick={() => bookingId && navigate(`/booking-details/${bookingId}`)}
                  style={{ marginRight: '10px' }}
                >
                  Xem chi tiết booking
                </Button>,
                <Button
                  key="home"
                  size="large"
                  onClick={() => navigate('/')}
                >
                  Về trang chủ
                </Button>,
              ]}
            />
          )}
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default PaymentSuccessPage;

