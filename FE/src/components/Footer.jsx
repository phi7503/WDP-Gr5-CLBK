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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button 
                style={{ 
                  background: '#333', 
                  border: '1px solid #666',
                  color: '#fff'
                }}
              >
                Get it on Google Play
              </Button>
              <Button 
                style={{ 
                  background: '#333', 
                  border: '1px solid #666',
                  color: '#fff'
                }}
              >
                Download on the App Store
              </Button>
            </div>
          </div>
        </Col>

        {/* Company Links */}
        <Col xs={24} md={8}>
          <div>
            <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
              Company
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/" style={{ color: '#999', textDecoration: 'none' }}>
                Home
              </Link>
              <Link to="/about" style={{ color: '#999', textDecoration: 'none' }}>
                About us
              </Link>
              <Link to="/contact" style={{ color: '#999', textDecoration: 'none' }}>
                Contact us
              </Link>
              <Link to="/privacy" style={{ color: '#999', textDecoration: 'none' }}>
                Privacy policy
              </Link>
            </div>
          </div>
        </Col>

        {/* Contact Info */}
        <Col xs={24} md={8}>
          <div>
            <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
              Get in touch
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text style={{ color: '#999' }}>+1-212-456-7890</Text>
              <Text style={{ color: '#999' }}>contact@example.com</Text>
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
          Copyright 2025 © GreatStack. All Right Reserved.
        </Text>
      </div>
    </AntFooter>
  );
};

export default Footer;
