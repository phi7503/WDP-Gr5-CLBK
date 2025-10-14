import React, { useEffect, useState } from 'react';
import { Layout, Typography, Row, Col, Card, Spin, Empty, Button, Tag, Input } from 'antd';
import { SearchOutlined, GiftOutlined } from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { voucherAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const VoucherPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');
  const [searchedVoucher, setSearchedVoucher] = useState(null);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      // Note: getVouchers requires admin auth, so we'll use search by code instead
      // For public access, we'll show a search interface
      setVouchers([]);
    } catch (error) {
      console.error('Error loading vouchers:', error);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchVoucher = async () => {
    if (!searchCode.trim()) return;
    
    try {
      const voucher = await voucherAPI.getVoucherByCode(searchCode);
      setSearchedVoucher(voucher);
    } catch (error) {
      console.error('Error searching voucher:', error);
      setSearchedVoucher(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isVoucherValid = (voucher) => {
    if (!voucher) return false;
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);
    return voucher.isActive && now >= startDate && now <= endDate;
  };

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>
            Vouchers & Promotions
          </Title>
          
          {/* Search Voucher Section */}
          <Card
            style={{ 
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              marginBottom: '32px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ textAlign: 'center' }}>
              <GiftOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
              <Title level={3} style={{ color: '#fff', marginBottom: '16px' }}>
                Check Your Voucher
              </Title>
              <Text style={{ color: '#999', display: 'block', marginBottom: '24px' }}>
                Enter your voucher code to check validity and details
              </Text>
              
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <Search
                  placeholder="Enter voucher code..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onSearch={handleSearchVoucher}
                  enterButton="Check"
                  size="large"
                  prefix={<SearchOutlined style={{ color: '#666' }} />}
                />
              </div>
            </div>
          </Card>

          {/* Search Results */}
          {searchedVoucher && (
            <Card
              style={{ 
                background: '#1a1a1a',
                border: `1px solid ${isVoucherValid(searchedVoucher) ? '#52c41a' : '#ff4d4f'}`,
                borderRadius: '8px',
                marginBottom: '32px'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <Row gutter={[24, 24]} align="middle">
                <Col xs={24} md={16}>
                  <div>
                    <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>
                      {searchedVoucher.code}
                    </Title>
                    <Text style={{ color: '#999', display: 'block', marginBottom: '16px' }}>
                      {searchedVoucher.description}
                    </Text>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ color: '#fff', marginRight: '8px' }}>Discount:</Text>
                      <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                        {searchedVoucher.discountType === 'percentage' 
                          ? `${searchedVoucher.discountValue}%` 
                          : `${(searchedVoucher.discountValue * 24000).toLocaleString('vi-VN')} VND`}
                      </Text>
                    </div>
                    
                    {searchedVoucher.minPurchase > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ color: '#fff', marginRight: '8px' }}>Min Purchase:</Text>
                        <Text style={{ color: '#999' }}>{(searchedVoucher.minPurchase * 24000).toLocaleString('vi-VN')} VND</Text>
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ color: '#fff', marginRight: '8px' }}>Valid:</Text>
                      <Text style={{ color: '#999' }}>
                        {formatDate(searchedVoucher.startDate)} - {formatDate(searchedVoucher.endDate)}
                      </Text>
                    </div>
                  </div>
                </Col>
                
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag 
                      color={isVoucherValid(searchedVoucher) ? 'green' : 'red'}
                      style={{ fontSize: '16px', padding: '8px 16px', marginBottom: '16px' }}
                    >
                      {isVoucherValid(searchedVoucher) ? 'Valid' : 'Invalid/Expired'}
                    </Tag>
                    
                    {isVoucherValid(searchedVoucher) && (
                      <Button 
                        type="primary" 
                        className="primary-button"
                        size="large"
                        style={{ width: '100%' }}
                      >
                        Use This Voucher
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Available Vouchers Section */}
          <Card
            style={{ 
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>
              Available Promotions
            </Title>
            
            <Empty
              description={
                <Text style={{ color: '#999' }}>
                  No public vouchers available. Please contact support for voucher codes.
                </Text>
              }
              style={{ margin: '40px 0' }}
            />
          </Card>
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default VoucherPage;
