import React, { useEffect, useState } from 'react';
import { Layout, Typography, Row, Col, Card, Spin, Empty, Button, message } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { comboAPI, payOSAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const ComboPage = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadCombos();
  }, []);

  const loadCombos = async () => {
    try {
      setLoading(true);
      const response = await comboAPI.getCombos();
      if (response) {
        setCombos(response);
      }
    } catch (error) {
      console.error('Error loading combos:', error);
      setCombos([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (combo) => {
    try {
      setProcessingPayment(true);
      
      // Tạo orderCode duy nhất: timestamp (seconds) * 1000 + random 3 digits + hash từ combo ID
      // Đảm bảo orderCode là số nguyên duy nhất
      const timestamp = Math.floor(Date.now() / 1000);
      const random = Math.floor(Math.random() * 1000);
      const comboHash = combo._id ? parseInt(combo._id.slice(-6), 16) % 1000 : 0;
      const orderCode = timestamp * 10000 + random * 10 + comboHash;
      
      // Lưu thông tin combo vào localStorage để hiển thị sau khi thanh toán thành công
      const paymentInfo = {
        orderCode: orderCode,
        combo: {
          _id: combo._id,
          name: combo.name,
          description: combo.description,
          price: combo.price,
          image: combo.image,
          category: combo.category,
          items: combo.items
        },
        type: 'combo', // Đánh dấu đây là thanh toán combo
        timestamp: Date.now()
      };
      localStorage.setItem(`payment_combo_${orderCode}`, JSON.stringify(paymentInfo));
      
      // Tạo description từ tên combo (tối đa 25 ký tự cho PayOS)
      const description = combo.name.length > 22 
        ? combo.name.substring(0, 22) + '...' 
        : combo.name;

      // Gọi API PayOS để tạo payment link
      const paymentData = {
        orderCode: orderCode,
        amount: combo.price,
        description: description,
      };

      console.log('🔄 Creating PayOS payment for combo:', combo.name);
      const response = await payOSAPI.createPayment(paymentData);
      
      if (response && response.checkoutUrl) {
        console.log('✅ Payment link created, redirecting to PayOS');
        message.success('Đang chuyển đến trang thanh toán...');
        
        // Redirect đến PayOS payment page
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error('Không nhận được link thanh toán từ PayOS');
      }
    } catch (error) {
      console.error('❌ Error creating payment:', error);
      const errorMessage = error?.message || error?.data?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.';
      message.error(errorMessage);
      setProcessingPayment(false);
    }
  };

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>
            Combos & Concessions
          </Title>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text style={{ color: '#999' }}>Loading combos...</Text>
              </div>
            </div>
          ) : combos.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: '#999' }}>
                  No combos available
                </Text>
              }
              style={{ margin: '80px 0' }}
            />
          ) : (
            <Row gutter={[24, 24]}>
              {combos.map(combo => (
                <Col xs={24} sm={12} md={8} lg={6} key={combo._id}>
                  <Card
                    style={{ 
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      height: '100%'
                    }}
                    cover={
                      <img
                        alt={combo.name}
                        src={combo.image ? (combo.image.startsWith('http://') || combo.image.startsWith('https://') ? combo.image : `http://localhost:5000/${combo.image}`) : 'https://via.placeholder.com/300x200/333/fff?text=Combo'}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                      />
                    }
                    actions={[
                      <Button 
                        type="primary" 
                        className="primary-button"
                        icon={<CreditCardOutlined />}
                        style={{ width: '100%' }}
                        loading={processingPayment}
                        onClick={() => handlePayment(combo)}
                      >
                        Thanh toán
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Title level={5} style={{ color: '#fff', margin: 0 }}>
                          {combo.name}
                        </Title>
                      }
                      description={
                        <div>
                          <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                            {combo.description}
                          </Text>
                          <div style={{ marginBottom: '8px' }}>
                            <Text style={{ color: '#fff', fontSize: '14px' }}>
                              Items:
                            </Text>
                            <ul style={{ color: '#999', fontSize: '12px', margin: '4px 0', paddingLeft: '16px' }}>
                              {combo.items?.map((item, index) => (
                                <li key={index}>{item.name} x{item.quantity}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: '#ff4d4f', fontSize: '18px', fontWeight: 'bold' }}>
                              {combo.price.toLocaleString('vi-VN')}₫
                            </Text>
                            <Text style={{ color: '#999', fontSize: '12px' }}>
                              {combo.category}
                            </Text>
                          </div>
                        </div>
                      }
                    />
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

export default ComboPage;
