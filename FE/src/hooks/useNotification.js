/**
  Custom hook for notifications using Ant Design App context
 */
import { App } from 'antd';

export const useNotification = () => {
  const { notification } = App.useApp();
  
  const showError = (description, message = 'Lỗi') => {
    notification.error({
      message,
      description,
      placement: 'topRight',
      duration: 0,
    });
  };
  
  const showSuccess = (description, message = 'Thành công') => {
    notification.success({
      message,
      description,
      placement: 'topRight',
      duration: 0,
    });
  };
  
  const showWarning = (description, message = 'Cảnh báo') => {
    notification.warning({
      message,
      description,
      placement: 'topRight',
      duration: 0,
    });
  };
  
  const showInfo = (description, message = 'Thông báo') => {
    notification.info({
      message,
      description,
      placement: 'topRight',
      duration: 0,
    });
  };
  
  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    notification, // Export raw notification for advanced usage
  };
};
