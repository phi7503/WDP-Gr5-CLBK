import React, { useEffect, useState } from 'react';
import { Layout, Result, Button, Spin, message } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { payOSAPI } from '../services/api';

const { Content } = Layout;

const PaymentCancelPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const status = searchParams.get('status'); // CANCELLED
  const orderCode = searchParams.get('orderCode');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCancel = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // ✅ Gọi API để cancel booking và release ghế
        if (status === 'CANCELLED' || searchParams.get('cancel') === 'true') {
          try {
            await payOSAPI.cancelPayment(bookingId, status, orderCode);
            console.log('✅ Booking cancelled and seats released');
            message.success('Đã hủy booking và giải phóng ghế thành công');
          } catch (error) {
            console.error('Error cancelling payment:', error);
            message.error('Không thể hủy booking. Vui lòng thử lại.');
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    handleCancel();
  }, [bookingId, status, orderCode, searchParams]);

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <Spin size="large" />
              <p style={{ color: '#fff', marginTop: '20px' }}>
                Đang xử lý hủy thanh toán...
              </p>
            </div>
          ) : (
            <Result
              icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '72px' }} />}
              title={
                <span style={{ color: '#fff', fontSize: '24px' }}>
                  Thanh toán đã bị hủy
                </span>
              }
              subTitle={
                <div style={{ color: '#ccc', marginTop: '20px' }}>
                  <p>Bạn đã hủy thanh toán.</p>
                  <p>Các ghế đã được giải phóng và có thể được đặt lại bởi người khác.</p>
                </div>
              }
              extra={[
                <Button
                  type="primary"
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

export default PaymentCancelPage;

