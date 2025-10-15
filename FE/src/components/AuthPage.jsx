import React, { useState } from 'react';
import { Layout, Typography, Button, Form, Input, Card, Space, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;

const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onLogin = async (values) => {
    try {
      setLoading(true);
      const response = await authAPI.login(values);
      
      if (response.token) {
        login(response.user, response.token);
        message.success('Đăng nhập thành công!');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    try {
      setLoading(true);
      const response = await authAPI.register(values);
      
      if (response.message) {
        message.success('Đăng ký thành công! Vui lòng đăng nhập.');
        // Auto switch to login tab
        window.location.reload();
      }
    } catch (error) {
      console.error('Register error:', error);
      message.error('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loginItems = [
    {
      key: 'login',
      label: 'Đăng Nhập',
      children: (
        <Form
          name="login"
          onFinish={onLogin}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              style={{ background: '#333', border: '1px solid #666', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              style={{ background: '#333', border: '1px solid #666', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="primary-button"
              block
              style={{ height: '48px', fontSize: '16px' }}
            >
              Đăng Nhập
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: '#999' }}>
              Chưa có tài khoản? <Link to="/auth" style={{ color: '#ff4d4f' }}>Đăng ký ngay</Link>
            </Text>
          </div>
        </Form>
      ),
    },
    {
      key: 'register',
      label: 'Đăng Ký',
      children: (
        <Form
          name="register"
          onFinish={onRegister}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Họ và tên"
              style={{ background: '#333', border: '1px solid #666', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              style={{ background: '#333', border: '1px solid #666', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Số điện thoại"
              style={{ background: '#333', border: '1px solid #666', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              style={{ background: '#333', border: '1px solid #666', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Xác nhận mật khẩu"
              style={{ background: '#333', border: '1px solid #666', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="primary-button"
              block
              style={{ height: '48px', fontSize: '16px' }}
            >
              Đăng Ký
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: '#999' }}>
              Đã có tài khoản? <Link to="/auth" style={{ color: '#ff4d4f' }}>Đăng nhập ngay</Link>
            </Text>
          </div>
        </Form>
      ),
    },
  ];

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ 
        padding: '80px 24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh'
      }}>
        <Card
          style={{
            width: '100%',
            maxWidth: '400px',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              <span style={{ color: '#ff4d4f' }}>Quick</span>Show
            </Title>
            <Text style={{ color: '#999', fontSize: '16px' }}>
              Đăng nhập để đặt vé xem phim
            </Text>
          </div>

          <Tabs
            defaultActiveKey="login"
            items={loginItems}
            style={{ color: '#fff' }}
            tabBarStyle={{ 
              color: '#fff',
              borderBottom: '1px solid #333'
            }}
          />
        </Card>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default AuthPage;
