import React, { useState, useEffect } from 'react';
import { Modal, Card, Typography, Input, Button, Space, Row, Col, Divider, Progress, Alert } from 'antd';
import { CreditCardOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PaymentModal = ({ 
  visible, 
  onCancel, 
  onComplete, 
  selectedSeats, 
  seats, 
  showtime, 
  combos, 
  selectedCombos, 
  setSelectedCombos,
  appliedVoucher,
  setAppliedVoucher,
  voucherCode,
  setVoucherCode,
  customerInfo,
  setCustomerInfo,
  paymentCountdown,
  calculateTotal 
}) => {
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      setPaymentStep(1);
      setIsProcessing(false);
    }
  }, [visible]);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleCardInfoChange = (field, value) => {
    setCardInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextStep = () => {
    if (paymentStep === 1) {
      setPaymentStep(2);
    } else if (paymentStep === 2) {
      setPaymentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (paymentStep === 2) {
      setPaymentStep(1);
    } else if (paymentStep === 3) {
      setPaymentStep(2);
    }
  };

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onComplete({
        paymentMethod,
        cardInfo,
        total: calculateTotal(),
        timestamp: new Date()
      });
    }, 2000);
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value) => {
    return value.replace(/\D/g, '').replace(/(.{2})/, '$1/').trim();
  };

  const renderStep1 = () => (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
        📋 Review Your Order
      </Title>
      
      {/* Showtime Info */}
      {showtime && (
        <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Movie:</strong> {showtime.movie?.title}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Date:</strong> {new Date(showtime.startTime).toLocaleDateString()}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Time:</strong> {new Date(showtime.startTime).toLocaleTimeString()}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Theater:</strong> {showtime.theater?.name}</Text>
            </Col>
          </Row>
        </Card>
      )}

      {/* Selected Seats */}
      <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
          🎫 Selected Seats
        </Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {selectedSeats.map(seatId => {
            const seat = seats.find(s => s._id === seatId);
            return (
              <div key={seatId} style={{ 
                padding: '12px 16px', 
                background: '#ff4d4f', 
                color: 'white', 
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
              }}>
                <span>🎯</span>
                <span>{seat?.row}{seat?.number}</span>
                <span>-</span>
                <span>{((seat?.price || 0) * 24000).toLocaleString('vi-VN')} VND</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Combos */}
      {selectedCombos.length > 0 && (
        <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
          <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
            🍿 Combos & Concessions
          </Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedCombos.map(combo => (
              <div key={combo._id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px',
                background: '#333',
                borderRadius: '8px'
              }}>
                <div>
                  <Text strong style={{ color: '#fff', fontSize: '14px' }}>
                    {combo.name} x{combo.quantity}
                  </Text>
                </div>
                <Text style={{ color: '#ff4d4f', fontSize: '14px', fontWeight: 'bold' }}>
                  {(combo.price * combo.quantity * 24000).toLocaleString('vi-VN')} VND
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Total */}
      <Card style={{ background: '#2a2a2a', border: '2px solid #ff4d4f' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>
            💰 Total Amount
          </Title>
          <Text style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#ff4d4f',
            textShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
          }}>
            {(calculateTotal() * 24000).toLocaleString('vi-VN')} VND
          </Text>
        </div>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
        💳 Payment Method
      </Title>
      
      <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type={paymentMethod === 'card' ? 'primary' : 'default'}
            size="large"
            icon={<CreditCardOutlined />}
            onClick={() => handlePaymentMethodChange('card')}
            style={{ width: '100%', height: '48px' }}
          >
            Credit/Debit Card
          </Button>
          
          <Button 
            type={paymentMethod === 'paypal' ? 'primary' : 'default'}
            size="large"
            onClick={() => handlePaymentMethodChange('paypal')}
            style={{ width: '100%', height: '48px' }}
          >
            PayPal
          </Button>
          
          <Button 
            type={paymentMethod === 'bank' ? 'primary' : 'default'}
            size="large"
            onClick={() => handlePaymentMethodChange('bank')}
            style={{ width: '100%', height: '48px' }}
          >
            Bank Transfer
          </Button>
        </Space>
      </Card>

      {paymentMethod === 'card' && (
        <Card style={{ background: '#2a2a2a', border: '1px solid #444' }}>
          <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
            Card Information
          </Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Card Number"
              value={cardInfo.number}
              onChange={(e) => handleCardInfoChange('number', formatCardNumber(e.target.value))}
              maxLength={19}
              size="large"
              style={{ background: '#333', borderColor: '#555', color: '#fff' }}
            />
            <Row gutter={16}>
              <Col span={12}>
                <Input
                  placeholder="MM/YY"
                  value={cardInfo.expiry}
                  onChange={(e) => handleCardInfoChange('expiry', formatExpiry(e.target.value))}
                  maxLength={5}
                  size="large"
                  style={{ background: '#333', borderColor: '#555', color: '#fff' }}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="CVV"
                  value={cardInfo.cvv}
                  onChange={(e) => handleCardInfoChange('cvv', e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  size="large"
                  style={{ background: '#333', borderColor: '#555', color: '#fff' }}
                />
              </Col>
            </Row>
            <Input
              placeholder="Cardholder Name"
              value={cardInfo.name}
              onChange={(e) => handleCardInfoChange('name', e.target.value)}
              size="large"
              style={{ background: '#333', borderColor: '#555', color: '#fff' }}
            />
          </Space>
        </Card>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
        👤 Customer Information
      </Title>
      
      <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="Full Name"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
            size="large"
            style={{ background: '#333', borderColor: '#555', color: '#fff' }}
          />
          <Input
            placeholder="Email Address"
            type="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
            size="large"
            style={{ background: '#333', borderColor: '#555', color: '#fff' }}
          />
          <Input
            placeholder="Phone Number"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
            size="large"
            style={{ background: '#333', borderColor: '#555', color: '#fff' }}
          />
        </Space>
      </Card>

      {/* Payment Summary */}
      <Card style={{ background: '#2a2a2a', border: '2px solid #ff4d4f' }}>
        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
          💰 Payment Summary
        </Title>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#ff4d4f'
          }}>
            {(calculateTotal() * 24000).toLocaleString('vi-VN')} VND
          </Text>
        </div>
      </Card>
    </div>
  );

  return (
    <Modal
      title={
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#fff',
          textAlign: 'center',
          padding: '20px 0'
        }}>
          💳 Complete Payment
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ 
        background: '#1a1a1a', 
        padding: '0',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
      footer={[
        <Button 
          key="cancel" 
          onClick={onCancel}
          size="large"
          style={{ 
            background: '#333', 
            borderColor: '#555', 
            color: '#fff',
            height: '48px',
            padding: '0 32px'
          }}
        >
          Cancel
        </Button>,
        ...(paymentStep > 1 ? [
          <Button 
            key="back" 
            onClick={handlePreviousStep}
            size="large"
            style={{ 
              background: '#666', 
              borderColor: '#888', 
              color: '#fff',
              height: '48px',
              padding: '0 32px'
            }}
          >
            Back
          </Button>
        ] : []),
        <Button 
          key="next" 
          type="primary" 
          className="primary-button" 
          onClick={paymentStep === 3 ? handleCompletePayment : handleNextStep}
          loading={isProcessing}
          size="large"
          style={{ 
            height: '48px',
            padding: '0 32px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {paymentStep === 3 ? (isProcessing ? 'Processing...' : 'Complete Payment') : 'Next'}
        </Button>
      ]}
    >
      <div style={{ padding: '24px' }}>
        {/* Progress Steps */}
        <div style={{ marginBottom: '32px' }}>
          <Progress 
            percent={(paymentStep / 3) * 100} 
            showInfo={false}
            strokeColor="#ff4d4f"
            style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: paymentStep >= 1 ? '#ff4d4f' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                color: '#fff',
                fontWeight: 'bold'
              }}>
                1
              </div>
              <Text style={{ color: '#999', fontSize: '12px' }}>Review</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: paymentStep >= 2 ? '#ff4d4f' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                color: '#fff',
                fontWeight: 'bold'
              }}>
                2
              </div>
              <Text style={{ color: '#999', fontSize: '12px' }}>Payment</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: paymentStep >= 3 ? '#ff4d4f' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                color: '#fff',
                fontWeight: 'bold'
              }}>
                3
              </div>
              <Text style={{ color: '#999', fontSize: '12px' }}>Confirm</Text>
            </div>
          </div>
        </div>

        {/* Payment Countdown */}
        {paymentCountdown && (
          <Alert
            message={`Payment expires in ${Math.floor(paymentCountdown / 60)}:${(paymentCountdown % 60).toString().padStart(2, '0')}`}
            type="error"
            showIcon
            icon={<ClockCircleOutlined />}
            style={{ 
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)', 
              border: '1px solid #ff4d4f',
              animation: 'paymentPulse 1s ease-in-out infinite alternate'
            }}
          />
        )}

        {/* Step Content */}
        {paymentStep === 1 && renderStep1()}
        {paymentStep === 2 && renderStep2()}
        {paymentStep === 3 && renderStep3()}
      </div>
    </Modal>
  );
};

export default PaymentModal;
