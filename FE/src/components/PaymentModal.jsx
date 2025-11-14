import React, { useState, useEffect } from 'react';
import { Modal, Card, Typography, Input, Button, Space, Row, Col, Divider, Progress, Alert, message } from 'antd';
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
  calculateTotal,
  seatStatuses // ✅ Thêm seatStatuses để lấy giá đúng
}) => {
  const [paymentStep, setPaymentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Hệ thống phân hạng ghế theo giá VNĐ
  const getSeatCategory = (price) => {
    if (price >= 200000) {
      return {
        name: 'DIAMOND VIP',
        icon: '💎',
        color: '#9333ea',
        bgColor: 'linear-gradient(135deg, #9333ea, #7c3aed)',
        description: 'Ghế massage, recliner cao cấp'
      };
    } else if (price >= 150000) {
      return {
        name: 'PLATINUM',
        icon: '👑',
        color: '#6b7280',
        bgColor: 'linear-gradient(135deg, #6b7280, #4b5563)',
        description: 'Ghế da cao cấp, tựa lưng điện'
      };
    } else if (price >= 100000) {
      return {
        name: 'GOLD VIP',
        icon: '🥇',
        color: '#f59e0b',
        bgColor: 'linear-gradient(135deg, #f59e0b, #d97706)',
        description: 'Ghế VIP rộng rãi, thoải mái'
      };
    } else if (price >= 70000) {
      return {
        name: 'SILVER',
        icon: '🥈',
        color: '#10b981',
        bgColor: 'linear-gradient(135deg, #10b981, #059669)',
        description: 'Ghế thoải mái, vị trí tốt'
      };
    } else {
      return {
        name: 'STANDARD',
        icon: '🎬',
        color: '#3b82f6',
        bgColor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        description: 'Ghế tiêu chuẩn'
      };
    }
  };

  useEffect(() => {
    if (visible) {
      setPaymentStep(1);
      setIsProcessing(false);
    }
  }, [visible]);

  const handleNextStep = () => {
    if (paymentStep === 1) {
      setPaymentStep(2); // Chuyển sang phần chọn combos
    } else if (paymentStep === 2) {
      setPaymentStep(3); // Chuyển sang phần thông tin khách hàng
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
        paymentMethod: 'bank',
        total: calculateTotal(),
        timestamp: new Date()
      });
    }, 2000);
  };

  const renderStep1 = () => (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
        📋 Xem lại đơn hàng
      </Title>
      
      {/* Showtime Info */}
      {showtime && (
        <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Phim:</strong> {showtime.movie?.title}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Ngày:</strong> {new Date(showtime.startTime).toLocaleDateString('vi-VN')}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Giờ:</strong> {new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#ccc' }}><strong style={{ color: '#fff' }}>Rạp:</strong> {showtime.theater?.name}</Text>
            </Col>
          </Row>
        </Card>
      )}

      {/* Seat Categories Legend */}
      <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
          📋 Chú thích hạng ghế
        </Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { price: 250000, name: 'DIAMOND VIP', icon: '💎', color: '#9333ea', desc: 'Ghế massage, recliner cao cấp' },
            { price: 180000, name: 'PLATINUM', icon: '👑', color: '#6b7280', desc: 'Ghế da cao cấp, tựa lưng điện' },
            { price: 120000, name: 'GOLD VIP', icon: '🥇', color: '#f59e0b', desc: 'Ghế VIP rộng rãi, thoải mái' },
            { price: 80000, name: 'SILVER', icon: '🥈', color: '#10b981', desc: 'Ghế thoải mái, vị trí tốt' },
            { price: 50000, name: 'STANDARD', icon: '🎬', color: '#3b82f6', desc: 'Ghế tiêu chuẩn' }
          ].map((category, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              border: `1px solid ${category.color}40`
            }}>
              <span style={{ fontSize: '20px' }}>{category.icon}</span>
              <div>
                <div style={{ color: category.color, fontWeight: 'bold', fontSize: '12px' }}>
                  {category.name}
                </div>
                <div style={{ color: '#999', fontSize: '10px' }}>
                  {category.desc}
                </div>
                <div style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>
                  {category.price.toLocaleString('vi-VN')} ₫
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Selected Seats */}
      <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
          🎫 Ghế đã chọn
        </Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {selectedSeats.map(seatId => {
            const seat = seats.find(s => s._id === seatId);
            const seatStatus = seatStatuses?.get?.(seatId); // ✅ Lấy seatStatus nếu có
            
            // ✅ Lấy giá từ seatStatus trước, nếu không có thì từ seat, nếu không có thì từ showtime price
            let seatPrice = 0;
            if (seatStatus?.price) {
              seatPrice = seatStatus.price;
            } else if (seat?.price) {
              seatPrice = seat.price;
            } else if (showtime?.price?.standard) {
              seatPrice = showtime.price.standard;
            } else if (showtime?.price) {
              seatPrice = typeof showtime.price === 'number' ? showtime.price : 50000;
            } else {
              seatPrice = 50000; // Default fallback
            }
            
            const seatCategory = getSeatCategory(seatPrice);
            
            return (
              <div key={seatId} style={{ 
                padding: '16px 20px', 
                background: seatCategory.bgColor, 
                color: 'white', 
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                border: `2px solid ${seatCategory.color}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{seatCategory.icon}</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {seat?.row}{seat?.number}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    {seatPrice.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                
                {/* Category */}
                <div style={{ 
                  fontSize: '12px', 
                  opacity: 0.9,
                  fontWeight: '500',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  {seatCategory.name}
                </div>
                
                {/* Description */}
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.8,
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  {seatCategory.description}
                </div>
                
                {/* Decorative element */}
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  width: '30px',
                  height: '30px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  opacity: 0.3
                }} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Combos */}
      {selectedCombos.length > 0 && (
        <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
          <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
            🍿 Combo & Đồ ăn vặt
          </Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedCombos.map(combo => (
              <div key={combo._id} style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'linear-gradient(135deg, #333, #2a2a2a)',
                borderRadius: '12px',
                border: '1px solid #444',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}>
                {/* Combo Image */}
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: '#444'
                }}>
                  <img
                    src={combo.image ? 
                      (combo.image.startsWith('http://') || combo.image.startsWith('https://') ? 
                        combo.image : 
                        `http://localhost:5000/${combo.image}`) : 
                      'https://via.placeholder.com/80x80/333/fff?text=🍿'
                    }
                    alt={combo.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80x80/333/fff?text=🍿';
                    }}
                  />
                </div>
                
                {/* Combo Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Text strong style={{ color: '#fff', fontSize: '16px' }}>
                      {combo.name}
                    </Text>
                    <span style={{ 
                      background: '#ff4d4f', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      x{combo.quantity}
                    </span>
                  </div>
                  
                  {combo.description && (
                    <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                      {combo.description}
                    </Text>
                  )}
                  
                  {combo.items && combo.items.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ color: '#ccc', fontSize: '11px' }}>
                        Bao gồm: {combo.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                      </Text>
                    </div>
                  )}
                </div>
                
                {/* Price */}
                <div style={{ textAlign: 'right' }}>
                  <Text style={{ color: '#ff4d4f', fontSize: '18px', fontWeight: 'bold' }}>
                    {(combo.price * combo.quantity).toLocaleString('vi-VN')} ₫
                  </Text>
                  <div style={{ color: '#999', fontSize: '11px' }}>
                    {combo.price.toLocaleString('vi-VN')} ₫/combo
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Total */}
      <Card style={{ background: '#2a2a2a', border: '2px solid #ff4d4f' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>
            💰 Tổng tiền
          </Title>
          <Text style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#ff4d4f',
            textShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
          }}>
            {calculateTotal().toLocaleString('vi-VN')} ₫
          </Text>
        </div>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
        🍿 Chọn Bỏng & Nước
      </Title>
      
      {combos.length === 0 ? (
        <Card style={{ background: '#2a2a2a', border: '1px solid #444', textAlign: 'center', padding: '40px' }}>
          <Text style={{ color: '#999', fontSize: '16px' }}>
            Đang tải combos...
          </Text>
        </Card>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {combos.map(combo => {
            const selectedCombo = selectedCombos.find(sc => sc._id === combo._id);
            const quantity = selectedCombo?.quantity || 0;
            
            return (
              <Card 
                key={combo._id}
                style={{
                  background: quantity > 0 ? 'rgba(82, 196, 26, 0.1)' : '#2a2a2a',
                  border: quantity > 0 ? '2px solid #52c41a' : '1px solid #444',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}
              >
                <Row gutter={[16, 16]} align="middle">
                  {/* Combo Image */}
                  <Col>
                    <div style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      background: '#444',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}>
                      <img
                        src={combo.image ? 
                          (combo.image.startsWith('http://') || combo.image.startsWith('https://') ? 
                            combo.image : 
                            `http://localhost:5000/${combo.image}`) : 
                          'https://via.placeholder.com/100x100/333/fff?text=🍿'
                        }
                        alt={combo.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x100/333/fff?text=🍿';
                        }}
                      />
                    </div>
                  </Col>
                  
                  {/* Combo Info */}
                  <Col flex="auto">
                    <div>
                      <Text strong style={{ color: '#fff', fontSize: '18px', display: 'block', marginBottom: '8px' }}>
                        {combo.name}
                      </Text>
                      <Text style={{ color: '#999', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                        {combo.description || 'Combo hấp dẫn'}
                      </Text>
                      
                      {combo.items && combo.items.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <Text style={{ color: '#ccc', fontSize: '12px', fontWeight: 'bold' }}>
                            Bao gồm:
                          </Text>
                          <ul style={{ color: '#999', fontSize: '11px', margin: '4px 0', paddingLeft: '16px' }}>
                            {combo.items.map((item, index) => (
                              <li key={index}>{item.name} x{item.quantity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <Text style={{ color: '#ff4d4f', fontSize: '20px', fontWeight: 'bold' }}>
                        {combo.price.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                  </Col>
                  
                  <Col>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Button
                        size="large"
                        onClick={() => {
                          if (quantity > 0) {
                            const newQuantity = quantity - 1;
                            if (newQuantity === 0) {
                              setSelectedCombos(selectedCombos.filter(sc => sc._id !== combo._id));
                            } else {
                              setSelectedCombos(selectedCombos.map(sc => 
                                sc._id === combo._id ? { ...sc, quantity: newQuantity } : sc
                              ));
                            }
                          }
                        }}
                        disabled={quantity === 0}
                        style={{ 
                          minWidth: '40px', 
                          height: '40px',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}
                      >
                        -
                      </Button>
                      
                      <Text style={{ 
                        color: '#fff', 
                        fontSize: '20px', 
                        fontWeight: 'bold',
                        minWidth: '40px',
                        textAlign: 'center',
                        background: '#333',
                        padding: '8px 12px',
                        borderRadius: '8px'
                      }}>
                        {quantity}
                      </Text>
                      
                      <Button
                        size="large"
                        onClick={() => {
                          if (quantity === 0) {
                            setSelectedCombos([...selectedCombos, { ...combo, quantity: 1 }]);
                          } else {
                            setSelectedCombos(selectedCombos.map(sc => 
                              sc._id === combo._id ? { ...sc, quantity: quantity + 1 } : sc
                            ));
                          }
                        }}
                        style={{ 
                          minWidth: '40px', 
                          height: '40px',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </Col>
                </Row>
                
                {quantity > 0 && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px', 
                    background: 'rgba(82, 196, 26, 0.2)', 
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#52c41a', fontSize: '14px', fontWeight: '600' }}>
                      Tổng: {(combo.price * quantity).toLocaleString('vi-VN')} ₫
                    </Text>
                  </div>
                )}
              </Card>
            );
          })}
        </Space>
      )}
      
      {/* Selected Combos Summary */}
      {selectedCombos.length > 0 && (
        <Card style={{ marginTop: '24px', background: '#2a2a2a', border: '2px solid #52c41a' }}>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              Đã chọn {selectedCombos.reduce((sum, c) => sum + c.quantity, 0)} combo
            </Text>
            <Text style={{ 
              color: '#fff', 
              fontSize: '20px', 
              fontWeight: 'bold'
            }}>
              Tổng: {selectedCombos.reduce((sum, c) => sum + (c.price * c.quantity), 0).toLocaleString('vi-VN')} ₫
            </Text>
          </div>
        </Card>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
        👤 Thông Tin Khách Hàng & Thanh Toán
      </Title>
      
      {/* Customer Information */}
      <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
          Thông tin liên hệ
        </Title>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            placeholder="Họ và tên *"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
            size="large"
            style={{ background: '#333', borderColor: '#555', color: '#fff' }}
          />
          <Input
            placeholder="Email *"
            type="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
            size="large"
            style={{ background: '#333', borderColor: '#555', color: '#fff' }}
          />
          <Input
            placeholder="Số điện thoại"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
            size="large"
            style={{ background: '#333', borderColor: '#555', color: '#fff' }}
          />
        </Space>
      </Card>

      {/* Voucher Section */}
      <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '1px solid #444' }}>
        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
          🎟️ Mã Giảm Giá
        </Title>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input
              placeholder="Nhập mã voucher"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              size="large"
              style={{ 
                background: '#333', 
                borderColor: appliedVoucher ? '#52c41a' : '#555', 
                color: '#fff',
                flex: 1
              }}
              disabled={!!appliedVoucher}
            />
            {!appliedVoucher ? (
              <Button
                type="primary"
                size="large"
                onClick={async () => {
                  if (!voucherCode.trim()) {
                    return;
                  }
                  // Call API to validate voucher
                  try {
                    const response = await fetch(`/api/vouchers/code/${voucherCode}`);
                    if (response.ok) {
                      const voucher = await response.json();
                      
                      // Validate voucher
                      const now = new Date();
                      const startDate = new Date(voucher.startDate);
                      const endDate = new Date(voucher.endDate);
                      
                      if (!voucher.isActive) {
                        message.error('Mã voucher không còn hiệu lực');
                        return;
                      }
                      
                      if (now < startDate) {
                        message.error('Mã voucher chưa có hiệu lực');
                        return;
                      }
                      
                      if (now > endDate) {
                        message.error('Mã voucher đã hết hạn');
                        return;
                      }
                      
                      // Check minimum purchase
                      const currentTotal = calculateTotal();
                      if (voucher.minPurchase && currentTotal < voucher.minPurchase) {
                        message.error(`Đơn hàng tối thiểu ${voucher.minPurchase.toLocaleString('vi-VN')} ₫ để sử dụng voucher này`);
                        return;
                      }
                      
                      setAppliedVoucher(voucher);
                      message.success(`Áp dụng voucher thành công! Giảm ${voucher.discountType === 'percentage' ? voucher.discountValue + '%' : voucher.discountValue.toLocaleString('vi-VN') + ' ₫'}`);
                    } else {
                      message.error('Mã voucher không hợp lệ');
                    }
                  } catch (error) {
                    console.error('Error applying voucher:', error);
                    message.error('Không thể áp dụng voucher');
                  }
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #52c41a, #389e0d)', 
                  border: 'none',
                  minWidth: '100px'
                }}
              >
                Áp dụng
              </Button>
            ) : (
              <Button
                danger
                size="large"
                onClick={() => {
                  setAppliedVoucher(null);
                  setVoucherCode('');
                  message.info('Đã hủy voucher');
                }}
                style={{ minWidth: '100px' }}
              >
                Hủy
              </Button>
            )}
          </div>
          
          {appliedVoucher && (
            <div style={{ 
              padding: '12px', 
              background: 'rgba(82, 196, 26, 0.1)', 
              borderRadius: '8px',
              border: '1px solid #52c41a'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: '#52c41a', fontSize: '14px', display: 'block' }}>
                    ✓ {appliedVoucher.code}
                  </Text>
                  <Text style={{ color: '#999', fontSize: '12px' }}>
                    {appliedVoucher.description}
                  </Text>
                </div>
                <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                  -{appliedVoucher.discountType === 'percentage' 
                    ? `${appliedVoucher.discountValue}%` 
                    : `${appliedVoucher.discountValue.toLocaleString('vi-VN')} ₫`}
                </Text>
              </div>
            </div>
          )}
        </Space>
      </Card>

      {/* Banking Information */}
      <Card style={{ marginBottom: '16px', background: '#2a2a2a', border: '2px solid #52c41a' }}>
        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
          💳 Thông Tin Chuyển Khoản
        </Title>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ 
            padding: '16px', 
            background: 'rgba(82, 196, 26, 0.1)', 
            borderRadius: '8px',
            border: '1px solid #52c41a'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Ngân hàng
              </Text>
              <Text strong style={{ color: '#fff', fontSize: '16px' }}>
                Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)
              </Text>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Số tài khoản
              </Text>
              <Text strong style={{ color: '#52c41a', fontSize: '18px', fontFamily: 'monospace' }}>
                1234567890
              </Text>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Chủ tài khoản
              </Text>
              <Text strong style={{ color: '#fff', fontSize: '16px' }}>
                CÔNG TY TNHH CLBK
              </Text>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Nội dung chuyển khoản
              </Text>
              <Text strong style={{ color: '#ff4d4f', fontSize: '16px', fontFamily: 'monospace' }}>
                DATVE {showtime?._id?.toString().slice(-6).toUpperCase() || 'XXXXXX'}
              </Text>
              <Text style={{ color: '#999', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                ⚠️ Vui lòng ghi đúng nội dung để hệ thống tự động xác nhận thanh toán
              </Text>
            </div>
            
            <div>
              <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Số tiền cần chuyển
              </Text>
              <Text strong style={{ 
                color: '#ff4d4f', 
                fontSize: '24px', 
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255, 77, 79, 0.5)'
              }}>
                {calculateTotal().toLocaleString('vi-VN')} ₫
              </Text>
            </div>
          </div>
          
          <div style={{ 
            padding: '12px', 
            background: 'rgba(255, 193, 7, 0.1)', 
            borderRadius: '8px',
            border: '1px solid #ffc107'
          }}>
            <Text style={{ color: '#ffc107', fontSize: '12px' }}>
              ⏰ Sau khi chuyển khoản, hệ thống sẽ tự động xác nhận trong vòng 5-10 phút.
              Vui lòng kiểm tra email để nhận vé sau khi thanh toán thành công.
            </Text>
          </div>
        </Space>
      </Card>

      {/* Payment Summary */}
      <Card style={{ background: '#2a2a2a', border: '2px solid #ff4d4f' }}>
        <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>
          💰 Tổng Thanh Toán
        </Title>
        
        {/* Breakdown */}
        <div style={{ marginBottom: '16px' }}>
          {/* Seats Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text style={{ color: '#999' }}>Tiền vé ({selectedSeats.length} ghế):</Text>
            <Text style={{ color: '#fff' }}>
              {selectedSeats.reduce((total, seatId) => {
                const seat = seats.find(s => s._id === seatId);
                const seatStatus = seatStatuses?.get?.(seatId);
                let seatPrice = 0;
                if (seatStatus?.price) {
                  seatPrice = seatStatus.price;
                } else if (seat?.price) {
                  seatPrice = seat.price;
                } else if (showtime?.price?.standard) {
                  seatPrice = showtime.price.standard;
                } else if (showtime?.price) {
                  seatPrice = typeof showtime.price === 'number' ? showtime.price : 50000;
                } else {
                  seatPrice = 50000;
                }
                return total + seatPrice;
              }, 0).toLocaleString('vi-VN')} ₫
            </Text>
          </div>
          
          {/* Combos Total */}
          {selectedCombos.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text style={{ color: '#999' }}>Combo & Đồ ăn:</Text>
              <Text style={{ color: '#fff' }}>
                {selectedCombos.reduce((sum, c) => sum + (c.price * c.quantity), 0).toLocaleString('vi-VN')} ₫
              </Text>
            </div>
          )}
          
          {/* Voucher Discount */}
          {appliedVoucher && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text style={{ color: '#52c41a' }}>Giảm giá ({appliedVoucher.code}):</Text>
              <Text style={{ color: '#52c41a' }}>
                -{(() => {
                  const subtotal = selectedSeats.reduce((total, seatId) => {
                    const seat = seats.find(s => s._id === seatId);
                    const seatStatus = seatStatuses?.get?.(seatId);
                    let seatPrice = 0;
                    if (seatStatus?.price) {
                      seatPrice = seatStatus.price;
                    } else if (seat?.price) {
                      seatPrice = seat.price;
                    } else if (showtime?.price?.standard) {
                      seatPrice = showtime.price.standard;
                    } else if (showtime?.price) {
                      seatPrice = typeof showtime.price === 'number' ? showtime.price : 50000;
                    } else {
                      seatPrice = 50000;
                    }
                    return total + seatPrice;
                  }, 0) + selectedCombos.reduce((sum, c) => sum + (c.price * c.quantity), 0);
                  
                  let discount = 0;
                  if (appliedVoucher.discountType === 'percentage') {
                    discount = subtotal * (appliedVoucher.discountValue / 100);
                    if (appliedVoucher.maxDiscount && discount > appliedVoucher.maxDiscount) {
                      discount = appliedVoucher.maxDiscount;
                    }
                  } else {
                    discount = appliedVoucher.discountValue;
                  }
                  
                  return Math.round(discount).toLocaleString('vi-VN');
                })()} ₫
              </Text>
            </div>
          )}
          
          <Divider style={{ margin: '12px 0', borderColor: '#444' }} />
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <Text style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#ff4d4f',
            textShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
          }}>
            {calculateTotal().toLocaleString('vi-VN')} ₫
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
          💳 Hoàn tất thanh toán
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      style={{ top: 20 }}
      styles={{
        body: {
          background: '#1a1a1a', 
          padding: '0',
          maxHeight: '80vh',
          overflowY: 'auto'
        }
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
          Hủy
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
            Quay lại
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
          {paymentStep === 3 ? (isProcessing ? 'Đang xử lý...' : 'Hoàn tất thanh toán') : 'Tiếp theo'}
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
              <Text style={{ color: '#999', fontSize: '12px' }}>Xem lại</Text>
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
              <Text style={{ color: '#999', fontSize: '12px' }}>Bỏng & Nước</Text>
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
              <Text style={{ color: '#999', fontSize: '12px' }}>Xác nhận</Text>
            </div>
          </div>
        </div>

        {/* Payment Countdown */}
        {paymentCountdown && (
          <Alert
            message={`Thanh toán hết hạn sau ${Math.floor(paymentCountdown / 60)}:${(paymentCountdown % 60).toString().padStart(2, '0')}`}
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
