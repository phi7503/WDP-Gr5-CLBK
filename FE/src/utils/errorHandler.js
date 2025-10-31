import { message } from 'antd';

/**
 * Helper function để hiển thị error message từ API
 * Tự động parse error và hiển thị notification từ phải sang trái
 */
export const handleApiError = (error, defaultMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.') => {
  console.error('API Error:', error);
  
  // Lấy error message từ nhiều nguồn
  let errorMessage = defaultMessage;
  
  if (error && error.message) {
    errorMessage = error.message;
  } else if (error && error.data && error.data.message) {
    errorMessage = error.data.message;
  } else if (error && error.data && error.data.error) {
    errorMessage = error.data.error;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  // Hiển thị error notification (từ phải sang trái)
  message.error(errorMessage, 5);
  
  return errorMessage;
};

/**
 * Helper function để hiển thị success message
 */
export const showSuccess = (msg, duration = 4) => {
  message.success(msg, duration);
};

/**
 * Helper function để hiển thị warning message
 */
export const showWarning = (msg, duration = 4) => {
  message.warning(msg, duration);
};

/**
 * Helper function để hiển thị info message
 */
export const showInfo = (msg, duration = 4) => {
  message.info(msg, duration);
};

