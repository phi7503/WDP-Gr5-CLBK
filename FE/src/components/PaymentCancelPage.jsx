import React from 'react';
import { Layout, Result, Button } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const { Content } = Layout;

const PaymentCancelPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                <p>Booking của bạn vẫn được giữ trong 15 phút. Bạn có thể thanh toán lại sau.</p>
              </div>
            }
            extra={[
              <Button
                type="primary"
                key="retry"
                size="large"
                onClick={() => bookingId && navigate(`/booking-details/${bookingId}`)}
                style={{ marginRight: '10px' }}
              >
                Thanh toán lại
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
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default PaymentCancelPage;

