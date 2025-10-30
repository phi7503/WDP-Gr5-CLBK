import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Button, Card, Space, message, Input, List, Badge, Alert } from 'antd';
import { UserOutlined, SendOutlined, DisconnectOutlined, CheckCircleOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;

const SocketTestPage = () => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  
  const [socketConnected, setSocketConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [testShowtimeId] = useState('507f1f77bcf86cd799439011'); // Mock showtime ID
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (token) {
      initializeSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  const initializeSocket = () => {
    socketRef.current = io('http://localhost:9999', {
      auth: {
        token: token
      }
    });

    socketRef.current.on('connect', () => {
      console.log('🔌 Connected to server');
      setSocketConnected(true);
      addMessage('Connected to server', 'success');
      
      // Join test showtime room
      socketRef.current.emit('join-showtime', testShowtimeId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setSocketConnected(false);
      addMessage('Disconnected from server', 'error');
    });

    socketRef.current.on('user-joined', (data) => {
      console.log('👥 User joined:', data);
      setActiveUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
      addMessage(`${data.userName} joined the room`, 'info');
    });

    socketRef.current.on('user-left', (data) => {
      console.log('👋 User left:', data);
      setActiveUsers(prev => prev.filter(u => u.userId !== data.userId));
      addMessage(`${data.userName} left the room`, 'info');
    });

    socketRef.current.on('seats-being-selected', (data) => {
      console.log('📍 Seats being selected:', data);
      addMessage(`${data.userName} is selecting seats: ${data.seatIds.join(', ')}`, 'warning');
    });

    socketRef.current.on('seats-reserved-for-payment', (data) => {
      console.log('💳 Seats reserved for payment:', data);
      addMessage(`${data.userName} reserved seats for payment: ${data.seatIds.join(', ')}`, 'warning');
    });

    socketRef.current.on('seats-booked', (data) => {
      console.log('✅ Seats booked:', data);
      addMessage(`${data.userName} booked seats: ${data.seatIds.join(', ')}`, 'success');
    });

    socketRef.current.on('seats-released', (data) => {
      console.log('🔄 Seats released:', data);
      addMessage(`Seats released: ${data.seatIds.join(', ')} (${data.reason})`, 'info');
    });

    socketRef.current.on('seat-selection-success', (data) => {
      console.log('✅ Seat selection successful:', data);
      addMessage(`Seat selection successful! Expires at: ${new Date(data.expiresAt).toLocaleTimeString()}`, 'success');
    });

    socketRef.current.on('seat-selection-failed', (data) => {
      console.log('❌ Seat selection failed:', data);
      addMessage(`Seat selection failed: ${data.message}`, 'error');
    });

    socketRef.current.on('payment-initiated', (data) => {
      console.log('💳 Payment initiated:', data);
      addMessage(`Payment initiated! Expires at: ${new Date(data.expiresAt).toLocaleTimeString()}`, 'success');
    });

    socketRef.current.on('payment-completed', (data) => {
      console.log('✅ Payment completed:', data);
      addMessage(`Payment completed! Booking ID: ${data.bookingId}`, 'success');
    });

    socketRef.current.on('payment-failed', (data) => {
      console.log('❌ Payment failed:', data);
      addMessage(`Payment failed: ${data.message}`, 'error');
    });

    socketRef.current.on('reservation-expired', (data) => {
      console.log('⏰ Reservation expired:', data);
      addMessage(`Reservation expired for seats: ${data.seatIds.join(', ')}`, 'warning');
    });
  };

  const addMessage = (text, type) => {
    const newMessage = {
      id: Date.now(),
      text,
      type,
      timestamp: new Date()
    };
    setMessages(prev => [...prev.slice(-19), newMessage]); // Keep last 20 messages
  };

  const sendTestMessage = () => {
    if (socketRef.current && socketConnected && messageInput.trim()) {
      addMessage(`You: ${messageInput}`, 'user');
      setMessageInput('');
    }
  };

  const testSeatSelection = () => {
    if (socketRef.current && socketConnected) {
      const testSeatIds = ['seat-A-1', 'seat-A-2', 'seat-B-1'];
      socketRef.current.emit('select-seats', {
        showtimeId: testShowtimeId,
        seatIds: testSeatIds
      });
      addMessage(`Testing seat selection: ${testSeatIds.join(', ')}`, 'info');
    }
  };

  const testPaymentInitiation = () => {
    if (socketRef.current && socketConnected) {
      const testSeatIds = ['seat-A-1', 'seat-A-2'];
      socketRef.current.emit('initiate-payment', {
        showtimeId: testShowtimeId,
        seatIds: testSeatIds
      });
      addMessage(`Testing payment initiation: ${testSeatIds.join(', ')}`, 'info');
    }
  };

  const testSeatRelease = () => {
    if (socketRef.current && socketConnected) {
      const testSeatIds = ['seat-A-1', 'seat-A-2'];
      socketRef.current.emit('release-seats', {
        showtimeId: testShowtimeId,
        seatIds: testSeatIds
      });
      addMessage(`Testing seat release: ${testSeatIds.join(', ')}`, 'info');
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info': return '#1890ff';
      case 'user': return '#722ed1';
      default: return '#999';
    }
  };

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', textAlign: 'center', marginBottom: '32px' }}>
            🔌 Socket.IO Real-time Test
          </Title>

          <Row gutter={[24, 24]}>
            {/* Connection Status */}
            <Col xs={24} lg={8}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px'
                }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
                  Connection Status
                </Title>
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Badge 
                      status={socketConnected ? 'success' : 'error'} 
                      text={socketConnected ? 'Connected' : 'Disconnected'}
                    />
                    <Text style={{ color: '#999' }}>
                      {socketConnected ? 'Real-time active' : 'Connection lost'}
                    </Text>
                  </div>
                  
                  <div>
                    <Text style={{ color: '#999', fontSize: '14px' }}>Current User</Text>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                      {user?.name || 'Guest'}
                    </div>
                  </div>
                  
                  <div>
                    <Text style={{ color: '#999', fontSize: '14px' }}>Test Showtime ID</Text>
                    <div style={{ color: '#fff', fontSize: '14px', fontFamily: 'monospace', marginTop: '4px' }}>
                      {testShowtimeId}
                    </div>
                  </div>
                  
                  <Button 
                    type="primary" 
                    danger
                    onClick={disconnectSocket}
                    disabled={!socketConnected}
                    style={{ width: '100%' }}
                  >
                    <DisconnectOutlined /> Disconnect
                  </Button>
                </Space>
              </Card>
            </Col>

            {/* Active Users */}
            <Col xs={24} lg={8}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px'
                }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
                  👥 Active Users ({activeUsers.length})
                </Title>
                
                <List
                  dataSource={activeUsers}
                  renderItem={(user) => (
                    <List.Item style={{ border: 'none', padding: '8px 0' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%'
                      }}>
                        <UserOutlined style={{ color: '#1890ff' }} />
                        <div>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                            {user.userName}
                          </div>
                          <div style={{ color: '#999', fontSize: '12px' }}>
                            {new Date(user.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No other users active' }}
                />
              </Card>
            </Col>

            {/* Test Controls */}
            <Col xs={24} lg={8}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px'
                }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
                  🧪 Test Controls
                </Title>
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary"
                    onClick={testSeatSelection}
                    disabled={!socketConnected}
                    style={{ width: '100%' }}
                  >
                    Test Seat Selection
                  </Button>
                  
                  <Button 
                    type="default"
                    onClick={testPaymentInitiation}
                    disabled={!socketConnected}
                    style={{ width: '100%' }}
                  >
                    Test Payment Initiation
                  </Button>
                  
                  <Button 
                    type="default"
                    onClick={testSeatRelease}
                    disabled={!socketConnected}
                    style={{ width: '100%' }}
                  >
                    Test Seat Release
                  </Button>
                  
                  <div style={{ marginTop: '16px' }}>
                    <Input
                      placeholder="Test message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onPressEnter={sendTestMessage}
                      style={{ marginBottom: '8px' }}
                    />
                    <Button 
                      type="default"
                      onClick={sendTestMessage}
                      disabled={!socketConnected || !messageInput.trim()}
                      style={{ width: '100%' }}
                      icon={<SendOutlined />}
                    >
                      Send Message
                    </Button>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Message Log */}
          <Card
            style={{ 
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              marginTop: '24px'
            }}
          >
            <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
              📝 Real-time Messages ({messages.length})
            </Title>
            
            <div style={{ 
              height: '400px', 
              overflowY: 'auto', 
              background: '#0a0a0a',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #333'
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  No messages yet. Connect to see real-time updates.
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      color: getMessageColor(message.type),
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}>
                      {message.type === 'success' && <CheckCircleOutlined style={{ marginRight: '8px' }} />}
                      {message.text}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: '12px'
                    }}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default SocketTestPage;
