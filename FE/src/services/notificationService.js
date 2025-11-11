/**
 * Service để hiển thị notification từ bất kỳ đâu
 * Sử dụng static method của notification để có thể gọi từ api.js
 */

import { notification } from 'antd';

// Đảm bảo notification được config
notification.config({
  placement: 'topRight',
  top: 80,
  duration: 5,
  maxCount: 3,
  rtl: false,
  pauseOnHover: true,
});

// Export function để hiển thị error notification
export const showErrorNotification = (errorMessage) => {
  if (!notification || typeof notification.error !== 'function') {
    console.error('❌ Notification không khả dụng');
    return;
  }

  try {
    notification.error({
      message: 'Lỗi',
      description: errorMessage,
      placement: 'topRight',
      duration: 5,
    });
  } catch (error) {
    console.error('❌ Lỗi khi hiển thị notification:', error);
  }
};

// Export function để hiển thị success notification
export const showSuccessNotification = (message, description = '') => {
  if (!notification || typeof notification.success !== 'function') {
    console.error('❌ Notification không khả dụng');
    return;
  }

  try {
    notification.success({
      message: message,
      description: description,
      placement: 'topRight',
      duration: 3,
    });
  } catch (error) {
    console.error('❌ Lỗi khi hiển thị notification:', error);
  }
};

// Export function để hiển thị warning notification
export const showWarningNotification = (message, description = '') => {
  if (!notification || typeof notification.warning !== 'function') {
    console.error('❌ Notification không khả dụng');
    return;
  }

  try {
    notification.warning({
      message: message,
      description: description,
      placement: 'topRight',
      duration: 4,
    });
  } catch (error) {
    console.error('❌ Lỗi khi hiển thị notification:', error);
  }
};

