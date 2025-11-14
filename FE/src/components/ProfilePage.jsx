import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Avatar, Button, Form, Input, message, Tabs } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from "../context/app.context";
import { userAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address || ''
      });
    }
  }, [user, form]);

  const handleSave = async (values) => {
    try {
      setLoading(true);
      const response = await userAPI.updateUser(user._id, values);
      
      if (response) {
        // Update user in context
        login(response, user.token);
        message.success('Cập nhật thông tin thành công!');
        setEditing(false);
      }
    } catch (error) {
      console.error('Update error:', error);
      message.error('Cập nhật thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEditing(false);
  };

  const tabItems = [
    {
      key: 'profile',
      label: 'Thông tin cá nhân',
      children: (
        <Card
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Avatar
              size={120}
              icon={<UserOutlined />}
              style={{
                backgroundColor: '#ff4d4f',
                marginBottom: '16px'
              }}
            />
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              {user?.name || 'User'}
            </Title>
            <Text style={{ color: '#999' }}>
              {user?.email || 'user@example.com'}
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            disabled={!editing}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label={<Text style={{ color: '#fff' }}>Họ và tên</Text>}
                >
                  <Input
                    style={{
                      background: '#333',
                      border: '1px solid #666',
                      color: '#fff'
                    }}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label={<Text style={{ color: '#fff' }}>Email</Text>}
                >
                  <Input
                    disabled
                    style={{
                      background: '#333',
                      border: '1px solid #666',
                      color: '#999'
                    }}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label={<Text style={{ color: '#fff' }}>Số điện thoại</Text>}
                >
                  <Input
                    style={{
                      background: '#333',
                      border: '1px solid #666',
                      color: '#fff'
                    }}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  name="address"
                  label={<Text style={{ color: '#fff' }}>Địa chỉ</Text>}
                >
                  <Input
                    style={{
                      background: '#333',
                      border: '1px solid #666',
                      color: '#fff'
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              {editing ? (
                <Space size="middle">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="primary-button"
                    icon={<SaveOutlined />}
                  >
                    Lưu thay đổi
                  </Button>
                  <Button
                    onClick={handleCancel}
                    style={{
                      background: '#333',
                      border: '1px solid #666',
                      color: '#fff'
                    }}
                    icon={<CloseOutlined />}
                  >
                    Hủy
                  </Button>
                </Space>
              ) : (
                <Button
                  type="primary"
                  className="primary-button"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  Chỉnh sửa thông tin
                </Button>
              )}
            </div>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: 'Bảo mật',
      children: (
        <Card
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
            Thay đổi mật khẩu
          </Title>
          
          <Form layout="vertical">
            <Form.Item
              name="currentPassword"
              label={<Text style={{ color: '#fff' }}>Mật khẩu hiện tại</Text>}
            >
              <Input.Password
                style={{
                  background: '#333',
                  border: '1px solid #666',
                  color: '#fff'
                }}
              />
            </Form.Item>
            
            <Form.Item
              name="newPassword"
              label={<Text style={{ color: '#fff' }}>Mật khẩu mới</Text>}
            >
              <Input.Password
                style={{
                  background: '#333',
                  border: '1px solid #666',
                  color: '#fff'
                }}
              />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              label={<Text style={{ color: '#fff' }}>Xác nhận mật khẩu mới</Text>}
            >
              <Input.Password
                style={{
                  background: '#333',
                  border: '1px solid #666',
                  color: '#fff'
                }}
              />
            </Form.Item>
            
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button
                type="primary"
                className="primary-button"
                icon={<SaveOutlined />}
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          </Form>
        </Card>
      ),
    },
    {
      key: 'preferences',
      label: 'Tùy chọn',
      children: (
        <Card
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
            Cài đặt tài khoản
          </Title>
          
          <div style={{ marginBottom: '24px' }}>
            <Text style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
              Nhận thông báo email
            </Text>
            <Text style={{ color: '#999', fontSize: '14px' }}>
              Nhận thông báo về phim mới, suất chiếu và ưu đãi đặc biệt
            </Text>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <Text style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
              Chế độ tối
            </Text>
            <Text style={{ color: '#999', fontSize: '14px' }}>
              Sử dụng giao diện tối để bảo vệ mắt
            </Text>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <Text style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
              Ngôn ngữ
            </Text>
            <Text style={{ color: '#999', fontSize: '14px' }}>
              Tiếng Việt
            </Text>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              type="primary"
              className="primary-button"
            >
              Lưu cài đặt
            </Button>
          </div>
        </Card>
      ),
    },
  ];

  if (!user) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <Title level={3} style={{ color: '#fff' }}>
            Vui lòng đăng nhập để xem thông tin cá nhân
          </Title>
        </Content>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: '32px' }}>
            Thông tin cá nhân
          </Title>
          
          <Tabs
            defaultActiveKey="profile"
            items={tabItems}
            style={{ color: '#fff' }}
          />
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default ProfilePage;

