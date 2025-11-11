import React from 'react';
import { Layout, Row, Col, Typography, Button } from 'antd';
import { Link } from 'react-router-dom';

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

const Footer = () => {
  return (
    <AntFooter style={{ 
      background: '#0a0a0a', 
      borderTop: '1px solid #333',
      padding: '48px 24px 24px'
    }}>
      <Row gutter={[32, 32]}>
        {/* QuickShow Info */}
        <Col xs={24} md={8}>
          <div>
            <Title level={3} style={{ color: '#ffffff', marginBottom: '16px' }}>
              <span style={{ color: '#ff4d4f' }}>Quick</span>Show
            </Title>
            <Text style={{ color: '#999', display: 'block', marginBottom: '16px' }}>
              QuickShow - Hệ thống đặt vé xem phim trực tuyến hàng đầu Việt Nam. 
              Trải nghiệm điện ảnh tuyệt vời với công nghệ hiện đại và dịch vụ chuyên nghiệp.
            </Text>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button 
                style={{ 
                  background: '#333', 
                  border: '1px solid #666',
                  color: '#fff'
                }}
              >
                Tải trên Google Play
              </Button>
              <Button 
                style={{ 
                  background: '#333', 
                  border: '1px solid #666',
                  color: '#fff'
                }}
              >
                Tải trên App Store
              </Button>
            </div>
          </div>
        </Col>

        {/* Company Links */}
        <Col xs={24} md={8}>
          <div>
            <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
              Công ty
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/" style={{ color: '#999', textDecoration: 'none' }}>
                Trang chủ
              </Link>
              <Link to="/about" style={{ color: '#999', textDecoration: 'none' }}>
                Về chúng tôi
              </Link>
              <Link to="/contact" style={{ color: '#999', textDecoration: 'none' }}>
                Liên hệ
              </Link>
              <Link to="/privacy" style={{ color: '#999', textDecoration: 'none' }}>
                Chính sách bảo mật
              </Link>
            </div>
          </div>
        </Col>

        {/* Contact Info */}
        <Col xs={24} md={8}>
          <div>
            <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
              Liên hệ
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text style={{ color: '#999' }}>+84-123-456-7890</Text>
              <Text style={{ color: '#999' }}>contact@quickshow.vn</Text>
            </div>
          </div>
        </Col>
      </Row>

      {/* Copyright */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '32px', 
        paddingTop: '24px',
        borderTop: '1px solid #333'
      }}>
        <Text style={{ color: '#666' }}>
          Bản quyền © 2025 QuickShow. Tất cả quyền được bảo lưu.
        </Text>
      </div>
    </AntFooter>
  );
};

export default Footer;
