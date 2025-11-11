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
    let isMounted = true; // Flag để tránh duplicate calls
    
    const handleCancel = async () => {
      if (!bookingId) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
        }
        
        // ✅ Gọi API để cancel booking và release ghế
        if (status === 'CANCELLED' || searchParams.get('cancel') === 'true') {
          try {
            await payOSAPI.cancelPayment(bookingId, status, orderCode);
            console.log('✅ Booking cancelled and seats released');
            // ✅ Lỗi sẽ tự động được hiển thị bởi api.js nếu có
            // Chỉ hiển thị success message nếu thành công
            if (isMounted) {
              message.success('Đã hủy booking và giải phóng ghế thành công');
            }
          } catch (error) {
            console.error('Error cancelling payment:', error);
            // ✅ Lỗi sẽ tự động được hiển thị bởi api.js
            // Không cần hiển thị lại ở đây để tránh duplicate
          }
        }
      } catch (error) {
        console.error('Error:', error);
        // ✅ Lỗi sẽ tự động được hiển thị bởi api.js
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    handleCancel();

    // Cleanup function để tránh duplicate calls
    return () => {
      isMounted = false;
    };
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

