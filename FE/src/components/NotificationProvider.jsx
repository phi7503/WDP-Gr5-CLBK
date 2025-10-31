/**
 * Provider component để quản lý notification globally
 * Sử dụng notification.useNotification() hook để có context đúng
 */

import React, { createContext, useContext } from 'react';
import { notification } from 'antd';

const NotificationContext = createContext(null);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Sử dụng notification.useNotification() để có context đúng
  const [api, contextHolder] = notification.useNotification({
    placement: 'topRight',
    top: 80,
    duration: 5,
    maxCount: 3,
    pauseOnHover: true,
  });

  return (
    <NotificationContext.Provider value={api}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

