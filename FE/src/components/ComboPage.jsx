import React, { useEffect, useState } from 'react';
import { Layout, Typography, Row, Col, Card, Spin, Empty, Button } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { comboAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const ComboPage = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

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
                        src={combo.image ? `http://localhost:5000/${combo.image}` : 'https://via.placeholder.com/300x200/333/fff?text=Combo'}
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
                        icon={<ShoppingCartOutlined />}
                        style={{ width: '100%' }}
                      >
                        Add to Cart
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
                              ${combo.price}
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
