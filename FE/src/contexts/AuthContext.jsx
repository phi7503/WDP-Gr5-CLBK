import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth data on app load
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    console.log('🔍 AuthContext loading:', {
      hasToken: !!savedToken,
      tokenLength: savedToken?.length || 0,
      hasUser: !!savedUser,
      userData: savedUser
    });

    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        console.log('✅ AuthContext loaded:', {
          hasToken: !!savedToken,
          userId: JSON.parse(savedUser)?._id
        });
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      // ✅ Nếu có user nhưng không có token, thử lấy lại từ localStorage
      if (savedUser && savedUser !== 'undefined' && !savedToken) {
        console.warn('⚠️ User exists but no token found, checking localStorage again...');
        const retryToken = localStorage.getItem('token');
        if (retryToken) {
          setToken(retryToken);
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.error('Error parsing user:', e);
          }
        }
      }
    }
    
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

