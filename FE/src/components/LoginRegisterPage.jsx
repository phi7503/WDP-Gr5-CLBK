import React, { useState, useEffect } from 'react';
import { Layout, Card, Form, Input, Button, Tabs, message, Divider, Space, Select } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import Header from './Header';
import Footer from './Footer';
import '../style.css';

const { Content } = Layout;

const LoginRegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Xử lý route và responsive
  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('register');
    } else {
      setActiveTab('login');
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname]);

  // Xử lý Google login redirect
  useEffect(() => {
    const fromGoogle = sessionStorage.getItem('googleLoginPending') === '1';
    const hash = window.location.hash || '';

    if (hash.startsWith('#token=')) {
      const token = decodeURIComponent(hash.slice(7));
      if (token) {
        localStorage.setItem('token', token);
        window.history.replaceState(null, '', window.location.pathname);
        
        // Fetch user info
        fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              login(data.user, token);
              message.success('Đăng nhập Google thành công!');
              navigate('/');
            }
          })
          .catch(err => {
            console.error('Error fetching user:', err);
            message.error('Không thể lấy thông tin người dùng');
          });
      }
      sessionStorage.removeItem('googleLoginPending');
    }
  }, []);

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const response = await authAPI.login(values);

      if (response.token) {
        localStorage.setItem('token', response.token);
        const userData = response.user || response;
        login(userData, response.token);
        message.success('Đăng nhập thành công!');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Error đã được xử lý bởi api.js
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    try {
      setLoading(true);
      
      // Format dob to ISO string if it's a date
      let dobValue = values.dob;
      if (dobValue && typeof dobValue === 'string') {
        // If it's already a date string, convert to Date object first
        const dobDate = new Date(dobValue);
        if (!isNaN(dobDate.getTime())) {
          dobValue = dobDate.toISOString();
        }
      } else if (dobValue instanceof Date) {
        dobValue = dobValue.toISOString();
      }
      
      await authAPI.register({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        province: values.province,
        city: values.city,
        gender: values.gender,
        dob: dobValue,
      });

      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      setActiveTab('login');
      loginForm.setFieldsValue({ email: values.email });
    } catch (error) {
      console.error('Register error:', error);
      // Error đã được xử lý bởi api.js
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    sessionStorage.setItem('googleLoginPending', '1');
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Header />
      <Content style={{ 
        paddingTop: '64px',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Effects */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          width: '100%',
          maxWidth: '1200px',
          padding: '40px 20px',
          position: 'relative',
          zIndex: 1
        }}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{
              display: 'flex',
              minHeight: isMobile ? 'auto' : '600px',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              {/* Left Side - Form */}
              <div style={{
                flex: 1,
                padding: isMobile ? '40px 30px' : '60px 50px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '40px'
                }}>
                  <h1 style={{
                    fontSize: '42px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '8px',
                    letterSpacing: '-1px'
                  }}>
                    CLBK
                  </h1>
                  <p style={{
                    color: '#999',
                    fontSize: '16px',
                    margin: 0
                  }}>
                    Chào mừng bạn đến với CLBK Cinema
                  </p>
                </div>

                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  centered
                  style={{
                    marginBottom: '30px'
                  }}
                  items={[
                    {
                      key: 'login',
                      label: <span style={{ fontSize: '18px', fontWeight: '600', padding: '0 20px' }}>Đăng Nhập</span>,
                    },
                    {
                      key: 'register',
                      label: <span style={{ fontSize: '18px', fontWeight: '600', padding: '0 20px' }}>Đăng Ký</span>,
                    },
                  ]}
                />

                {/* Login Form */}
                {activeTab === 'login' && (
                  <Form
                    form={loginForm}
                    onFinish={handleLogin}
                    layout="vertical"
                    size="large"
                    style={{ maxWidth: '450px', margin: '0 auto', width: '100%' }}
                  >
                    <Button
                      type="default"
                      block
                      icon={<MailOutlined />}
                      onClick={handleGoogleLogin}
                      style={{
                        height: '50px',
                        fontSize: '16px',
                        fontWeight: '600',
                        background: '#fff',
                        border: '1px solid #ddd',
                        color: '#333',
                        marginBottom: '24px'
                      }}
                    >
                      Đăng nhập bằng Google
                    </Button>

                    <Divider style={{ borderColor: '#333', color: '#666' }}>Hoặc</Divider>

                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: 'Vui lòng nhập email!' },
                        { type: 'email', message: 'Email không hợp lệ!' }
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color: '#999' }} />}
                        placeholder="Email"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#999' }} />}
                        placeholder="Mật khẩu"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        style={{
                          height: '50px',
                          fontSize: '18px',
                          fontWeight: '700',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                          marginTop: '10px'
                        }}
                      >
                        Đăng Nhập
                      </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <a
                        href="/forgot-password"
                        style={{
                          color: '#999',
                          fontSize: '14px',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.target.style.color = '#999'}
                      >
                        Quên mật khẩu?
                      </a>
                    </div>
                  </Form>
                )}

                {/* Register Form */}
                {activeTab === 'register' && (
                  <Form
                    form={registerForm}
                    onFinish={handleRegister}
                    layout="vertical"
                    size="large"
                    style={{ maxWidth: '450px', margin: '0 auto', width: '100%' }}
                  >
                    <Button
                      type="default"
                      block
                      icon={<MailOutlined />}
                      onClick={handleGoogleLogin}
                      style={{
                        height: '50px',
                        fontSize: '16px',
                        fontWeight: '600',
                        background: '#fff',
                        border: '1px solid #ddd',
                        color: '#333',
                        marginBottom: '24px'
                      }}
                    >
                      Đăng ký bằng Google
                    </Button>

                    <Divider style={{ borderColor: '#333', color: '#666' }}>Hoặc</Divider>

                    <Form.Item
                      name="name"
                      rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: '#999' }} />}
                        placeholder="Họ và tên"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
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
                        prefix={<MailOutlined style={{ color: '#999' }} />}
                        placeholder="Email"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="phone"
                      rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại!' },
                        { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' }
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined style={{ color: '#999' }} />}
                        placeholder="Số điện thoại"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
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
                        prefix={<LockOutlined style={{ color: '#999' }} />}
                        placeholder="Mật khẩu"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
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
                            return Promise.reject(new Error('Mật khẩu không khớp!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#999' }} />}
                        placeholder="Xác nhận mật khẩu"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="dob"
                      rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
                    >
                      <Input
                        type="date"
                        prefix={<CalendarOutlined style={{ color: '#999' }} />}
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="gender"
                      rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                    >
                      <Select
                        placeholder="Giới tính"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      >
                        <Select.Option value="male">Nam</Select.Option>
                        <Select.Option value="female">Nữ</Select.Option>
                        <Select.Option value="other">Khác</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="province"
                      rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố!' }]}
                    >
                      <Input
                        prefix={<EnvironmentOutlined style={{ color: '#999' }} />}
                        placeholder="Tỉnh/Thành phố"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="city"
                      rules={[{ required: true, message: 'Vui lòng nhập quận/huyện!' }]}
                    >
                      <Input
                        prefix={<EnvironmentOutlined style={{ color: '#999' }} />}
                        placeholder="Quận/Huyện"
                        style={{
                          height: '50px',
                          background: '#0a0a0a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        style={{
                          height: '50px',
                          fontSize: '18px',
                          fontWeight: '700',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                          marginTop: '10px'
                        }}
                      >
                        Đăng Ký
                      </Button>
                    </Form.Item>
                  </Form>
                )}
              </div>

              {/* Right Side - Image/Visual */}
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                display: isMobile ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                minHeight: isMobile ? '300px' : 'auto'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
                  animation: 'pulse 4s ease-in-out infinite'
                }} />
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    fontSize: '120px',
                    marginBottom: '20px',
                    filter: 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.5))'
                  }}>
                    🎬
                  </div>
                  <h2 style={{
                    color: '#fff',
                    fontSize: '32px',
                    fontWeight: '700',
                    marginBottom: '16px'
                  }}>
                    Trải nghiệm điện ảnh
                  </h2>
                  <p style={{
                    color: '#999',
                    fontSize: '18px',
                    lineHeight: '1.6',
                    maxWidth: '400px',
                    margin: '0 auto'
                  }}>
                    Đặt vé nhanh chóng, tiện lợi và an toàn. Hãy tham gia cùng chúng tôi!
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default LoginRegisterPage;

