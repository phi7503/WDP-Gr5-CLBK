import React, { useEffect, useState } from 'react';
import { Layout, Result, Button, Spin, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { bookingAPI, payOSAPI } from '../services/api';

const { Content } = Layout;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const paymentStatus = searchParams.get('status'); // ✅ Lấy status từ URL
  const orderCode = searchParams.get('orderCode'); // ✅ Lấy orderCode từ URL
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [comboPayment, setComboPayment] = useState(null); // ✅ Thông tin thanh toán combo
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // ✅ Xử lý thanh toán combo (không có bookingId nhưng có orderCode)
      if (!bookingId && orderCode && paymentStatus === 'PAID') {
        console.log('✅ Combo payment detected:', orderCode);
        try {
          // Lấy thông tin combo từ localStorage
          const paymentInfo = localStorage.getItem(`payment_combo_${orderCode}`);
          if (paymentInfo) {
            const payment = JSON.parse(paymentInfo);
            setComboPayment(payment);
            setLoading(false);
            
            // Xóa thông tin payment sau 5 phút để tránh localStorage bị đầy
            setTimeout(() => {
              localStorage.removeItem(`payment_combo_${orderCode}`);
            }, 5 * 60 * 1000);
            return;
          } else {
            // Nếu không tìm thấy trong localStorage, vẫn hiển thị success nhưng không có chi tiết combo
            // Có thể là do localStorage đã bị xóa hoặc refresh trang
            console.warn('⚠️ Combo payment info not found in localStorage, orderCode:', orderCode);
            // Vẫn đánh dấu là combo payment nhưng không có chi tiết
            setComboPayment({ orderCode: orderCode, type: 'combo', noDetails: true });
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error loading combo payment info:', error);
          setLoading(false);
          return;
        }
      }
      
      // ✅ Xử lý thanh toán booking (có bookingId)
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        // ✅ ƯU TIÊN: Kiểm tra payment status từ PayOS API trước (chắc chắn nhất)
        setCheckingPayment(true);
        try {
          const checkResponse = await payOSAPI.checkAndUpdatePayment(bookingId);
          console.log('✅ Payment status checked from PayOS API:', checkResponse);
          
          // ✅ Nếu có booking trong response và đã cập nhật thành công
          if (checkResponse && checkResponse.success && checkResponse.booking) {
            if (checkResponse.booking.paymentStatus === 'completed') {
              console.log('✅ Payment verified from PayOS API - COMPLETED');
              setBooking(checkResponse.booking);
              setLoading(false);
              setCheckingPayment(false);
              localStorage.setItem('shouldReloadShowtimes', 'true');
              localStorage.setItem('lastBookingTime', Date.now().toString());
              return; // ✅ Đã verify thành công từ PayOS API
            }
          }
          
          // ✅ Nếu có booking nhưng có warning (không thể kết nối PayOS)
          if (checkResponse && checkResponse.booking && checkResponse.warning) {
            console.warn('⚠️ Cannot connect to PayOS API, but URL shows status:', paymentStatus);
            
            // Nếu URL có status=PAID, fallback về URL params nhưng có cảnh báo
            if (paymentStatus === 'PAID') {
              console.log('⚠️ Using URL params as fallback (status=PAID detected)');
              try {
                const updateResponse = await payOSAPI.updatePaymentFromRedirect(bookingId, {
                  status: paymentStatus,
                  orderCode: orderCode
                });
                if (updateResponse && updateResponse.success && updateResponse.booking) {
                  setBooking(updateResponse.booking);
                  message.warning('Đã cập nhật từ URL redirect. Vui lòng kiểm tra lại sau khi kết nối PayOS được khôi phục.');
                } else {
                  setBooking(checkResponse.booking); // Fallback về booking hiện tại
                }
              } catch (updateError) {
                console.error('Error updating from URL params:', updateError);
                setBooking(checkResponse.booking); // Fallback về booking hiện tại
              }
            } else {
              setBooking(checkResponse.booking); // Không có status=PAID trong URL, giữ nguyên booking
            }
            
            setLoading(false);
            setCheckingPayment(false);
            return;
          }
          
          // ✅ Nếu có booking trong response
          if (checkResponse && checkResponse.booking) {
            setBooking(checkResponse.booking);
            setLoading(false);
            setCheckingPayment(false);
            localStorage.setItem('shouldReloadShowtimes', 'true');
            localStorage.setItem('lastBookingTime', Date.now().toString());
            return;
          }
          
          // Set flag để reload showtime data
          localStorage.setItem('shouldReloadShowtimes', 'true');
          localStorage.setItem('lastBookingTime', Date.now().toString());
        } catch (error) {
          console.error('Error checking payment status from PayOS API:', error);
          
          // ✅ Fallback: Nếu không thể kết nối PayOS nhưng URL có status=PAID
          if (paymentStatus === 'PAID' && (error.message?.includes('không thể kết nối') || error.message?.includes('ENOTFOUND') || error.error?.includes('không thể kết nối'))) {
            console.warn('⚠️ Cannot connect to PayOS API but URL shows PAID. Using URL params as fallback...');
            try {
              const updateResponse = await payOSAPI.updatePaymentFromRedirect(bookingId, {
                status: paymentStatus,
                orderCode: orderCode
              });
              if (updateResponse && updateResponse.success && updateResponse.booking) {
                setBooking(updateResponse.booking);
                message.warning('Đã cập nhật từ URL redirect. Vui lòng kiểm tra lại sau khi kết nối PayOS được khôi phục.');
                localStorage.setItem('shouldReloadShowtimes', 'true');
                localStorage.setItem('lastBookingTime', Date.now().toString());
                setLoading(false);
                setCheckingPayment(false);
                return;
              }
            } catch (updateError) {
              console.error('Error updating from URL params:', updateError);
              // Tiếp tục load booking từ database
            }
          }
        } finally {
          setCheckingPayment(false);
        }

        // Đợi một chút để đảm bảo database đã được cập nhật
        setTimeout(async () => {
          try {
            const response = await bookingAPI.getBookingById(bookingId);
          setBooking(response.booking || response);
          } catch (error) {
            console.error('Error fetching booking:', error);
            message.error('Không thể tải thông tin booking');
          } finally {
            setLoading(false);
          }
        }, 1000);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [bookingId, orderCode, paymentStatus]);

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {(loading || checkingPayment) ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <Spin size="large" />
              <p style={{ color: '#fff', marginTop: '20px' }}>
                {checkingPayment ? 'Đang kiểm tra thanh toán...' : 'Đang xử lý thanh toán...'}
              </p>
            </div>
          ) : (
            <Result
              icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '72px' }} />}
              title={
                <span style={{ color: '#fff', fontSize: '24px' }}>
                  Thanh toán thành công!
                </span>
              }
              subTitle={
                <div style={{ color: '#ccc', marginTop: '20px' }}>
                  <p>Cảm ơn bạn đã thanh toán!</p>
                  {comboPayment ? (
                    <>
                      {comboPayment.noDetails ? (
                        <>
                          <p style={{ marginTop: '16px' }}>
                            Bạn đã thanh toán combo thành công!
                          </p>
                          <p style={{ marginTop: '8px', fontSize: '14px' }}>
                            Mã đơn hàng: <strong style={{ color: '#fff' }}>{orderCode}</strong>
                          </p>
                        </>
                      ) : (
                        <>
                          <p style={{ marginTop: '16px', color: '#fff', fontSize: '16px', fontWeight: '500' }}>
                            Bạn đã thanh toán thành công cho:
                          </p>
                          <div style={{ 
                            background: '#1a1a1a', 
                            border: '1px solid #333', 
                            borderRadius: '8px', 
                            padding: '16px', 
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                          }}>
                            {comboPayment.combo.image && (
                              <img 
                                src={comboPayment.combo.image.startsWith('http://') || comboPayment.combo.image.startsWith('https://') 
                                  ? comboPayment.combo.image 
                                  : `http://localhost:5000/${comboPayment.combo.image}`}
                                alt={comboPayment.combo.name}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  objectFit: 'cover',
                                  borderRadius: '8px'
                                }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                                {comboPayment.combo.name}
                              </p>
                              <p style={{ color: '#999', fontSize: '14px', margin: '4px 0' }}>
                                {comboPayment.combo.description}
                              </p>
                              <p style={{ color: '#ff4d4f', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                                {comboPayment.combo.price.toLocaleString('vi-VN')}₫
                              </p>
                            </div>
                          </div>
                          <p style={{ marginTop: '16px', fontSize: '14px' }}>
                            Mã đơn hàng: <strong style={{ color: '#fff' }}>{orderCode}</strong>
                          </p>
                        </>
                      )}
                    </>
                  ) : booking?.paymentStatus === 'completed' ? (
                    <>
                      <p>Mã QR code đã được gửi đến email của bạn.</p>
                      <p>Vui lòng kiểm tra email để nhận mã QR code và check-in tại rạp.</p>
                    </>
                  ) : (
                    <p>Vui lòng kiểm tra email để nhận mã QR code.</p>
                  )}
                </div>
              }
              extra={[
                comboPayment ? (
                  <>
                    <Button
                      type="primary"
                      key="combo-page"
                      size="large"
                      onClick={() => navigate('/combos')}
                      style={{ marginRight: '10px' }}
                    >
                      Xem thêm combo
                    </Button>
                    <Button
                      key="home"
                      size="large"
                      onClick={() => navigate('/')}
                    >
                      Về trang chủ
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="primary"
                      key="booking-details"
                      size="large"
                      onClick={() => bookingId && navigate(`/booking-details/${bookingId}`)}
                      style={{ marginRight: '10px' }}
                    >
                      Xem chi tiết booking
                    </Button>
                    <Button
                      key="home"
                      size="large"
                      onClick={() => navigate('/')}
                    >
                      Về trang chủ
                    </Button>
                  </>
                ),
              ]}
            />
          )}
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default PaymentSuccessPage;

