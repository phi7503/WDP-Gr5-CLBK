import React, { useEffect, useState } from 'react';
import { Layout, Typography, Row, Col, Card, Spin, Empty, Button, message, Tag } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { comboAPI, payOSAPI, getImageUrl } from '../services/api';

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

  // Get category color based on category type
  const getCategoryColor = (category) => {
    const categoryColors = {
      'combo': { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', text: '#ef4444' },
      'popcorn': { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' },
      'drinks': { bg: 'rgba(220, 38, 38, 0.15)', border: '#dc2626', text: '#dc2626' },
    };
    return categoryColors[category?.toLowerCase()] || { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' };
  };

  return (
    <Layout style={{ 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0000 50%, #0a0a0a 100%)', 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow Effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '500px',
        background: 'radial-gradient(ellipse at top, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '500px',
        background: 'radial-gradient(ellipse at bottom, rgba(220, 38, 38, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      <Header />
      
      <Content style={{ 
        padding: '100px 24px', 
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header Section */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '60px',
            position: 'relative'
          }}>
            <Title 
              level={1} 
              style={{ 
                color: '#fff', 
                marginBottom: '16px',
                fontSize: '48px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff 0%, #ef4444 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
              }}
            >
              Combos & Concessions
            </Title>
            <Text style={{ 
              color: '#999', 
              fontSize: '18px',
              display: 'block'
            }}>
              Lựa chọn combo hoàn hảo cho trải nghiệm xem phim của bạn
            </Text>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '120px 0' }}>
              <Spin size="large" style={{ color: '#ef4444' }} />
              <div style={{ marginTop: '24px' }}>
                <Text style={{ color: '#999', fontSize: '16px' }}>Đang tải combos...</Text>
              </div>
            </div>
          ) : combos.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: '#999', fontSize: '16px' }}>
                  Không có combo nào khả dụng
                </Text>
              }
              style={{ margin: '120px 0' }}
            />
          ) : (
            <Row gutter={[32, 32]}>
              {combos.map((combo, index) => {
                const categoryColor = getCategoryColor(combo.category);
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={combo._id}>
                    <div
                      style={{
                        position: 'relative',
                        height: '100%',
                        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                      }}
                      onMouseEnter={(e) => {
                        const card = e.currentTarget;
                        card.style.transform = 'translateY(-8px)';
                        card.style.boxShadow = '0 20px 40px rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        const card = e.currentTarget;
                        card.style.transform = 'translateY(0)';
                        card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
                      }}
                    >
                      {/* Glass-morphism Card */}
                      <Card
                        style={{ 
                          background: 'rgba(26, 26, 26, 0.8)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: `2px solid rgba(239, 68, 68, 0.2)`,
                          borderRadius: '24px',
                          overflow: 'hidden',
                          height: '100%',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                          cursor: 'pointer'
                        }}
                        bodyStyle={{ padding: 0 }}
                      >
                        {/* Image Container with Gradient Overlay */}
                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                          <img
                            alt={combo.name}
                            src={combo.image ? getImageUrl(combo.image) : 'https://via.placeholder.com/400x300/1a1a1a/ef4444?text=Combo'}
                            style={{
                              width: '100%',
                              height: '240px',
                              objectFit: 'cover',
                              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              display: 'block'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          />
                          {/* Gradient Overlay */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '60%',
                            background: 'linear-gradient(to top, rgba(10, 10, 10, 0.95) 0%, transparent 100%)'
                          }} />
                          
                          {/* Category Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            padding: '6px 14px',
                            background: categoryColor.bg,
                            border: `1px solid ${categoryColor.border}`,
                            borderRadius: '20px',
                            backdropFilter: 'blur(10px)',
                            zIndex: 2
                          }}>
                            <Text style={{ 
                              color: categoryColor.text, 
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {combo.category}
                            </Text>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div style={{ padding: '24px' }}>
                          {/* Title */}
                          <Title 
                            level={4} 
                            style={{ 
                              color: '#fff', 
                              marginBottom: '12px',
                              fontSize: '20px',
                              fontWeight: '700',
                              lineHeight: '1.4'
                            }}
                          >
                            {combo.name}
                          </Title>

                          {/* Description */}
                          <Text 
                            style={{ 
                              color: '#999', 
                              fontSize: '14px', 
                              display: 'block', 
                              marginBottom: '16px',
                              lineHeight: '1.6'
                            }}
                          >
                            {combo.description}
                          </Text>

                          {/* Items List */}
                          {combo.items && combo.items.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                              <Text style={{ 
                                color: '#ef4444', 
                                fontSize: '13px',
                                fontWeight: '600',
                                display: 'block',
                                marginBottom: '8px'
                              }}>
                                Items:
                              </Text>
                              <ul style={{ 
                                color: '#ccc', 
                                fontSize: '13px', 
                                margin: 0, 
                                paddingLeft: '20px',
                                lineHeight: '1.8'
                              }}>
                                {combo.items.map((item, itemIndex) => (
                                  <li key={itemIndex}>
                                    <span style={{ color: '#fff', fontWeight: '500' }}>
                                      {item.name}
                                    </span>
                                    <span style={{ color: '#999', marginLeft: '8px' }}>
                                      x{item.quantity}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Price and Action */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            paddingTop: '16px',
                            borderTop: '1px solid rgba(239, 68, 68, 0.2)'
                          }}>
                            <div>
                              <Text style={{ 
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: '24px', 
                                fontWeight: '800',
                                display: 'block'
                              }}>
                                {combo.price.toLocaleString('vi-VN')}₫
                              </Text>
                            </div>
                            <Button 
                              type="primary" 
                              icon={<CreditCardOutlined />}
                              loading={processingPayment}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayment(combo);
                              }}
                              style={{ 
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                height: '44px',
                                padding: '0 24px',
                                fontWeight: '600',
                                fontSize: '15px',
                                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.4)';
                              }}
                            >
                              Thanh toán
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      </Content>
      
      {/* Add CSS animations */}
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
      `}</style>
      
      <Footer />
    </Layout>
  );
};

export default ComboPage;
