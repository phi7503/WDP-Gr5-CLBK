import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Input, Dropdown } from 'antd';
import { SearchOutlined, UserOutlined, LogoutOutlined, BookOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/app.context';
import '../cinema-brand.css';

const { Header: AntHeader } = Layout;
const { Search } = Input;

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'bookings',
      label: 'Lịch sử đặt vé',
      icon: <BookOutlined />,
      onClick: () => navigate('/bookings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const menuItems = [
    {
      key: 'home',
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: 'movies',
      label: <Link to="/movies">Phim</Link>,
    },
    {
      key: 'showtimes',
      label: <Link to="/showtimes">Lịch chiếu</Link>,
    },
    {
      key: 'branches',
      label: <Link to="/branches">Chi nhánh</Link>,
    },
    {
      key: 'combos',
      label: <Link to="/combos">Combo</Link>,
    },
    {
      key: 'vouchers',
      label: <Link to="/vouchers">Voucher</Link>,
    },
  ];

  return (
    <AntHeader className="cinema-brand-header" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      transition: 'all 0.3s ease',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="cinema-logo">
            <span style={{ color: 'var(--primary-red)' }}>Quick</span>Show
          </span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <Menu
        theme="dark"
        mode="horizontal"
        items={menuItems}
        className="cinema-nav-menu"
        style={{ 
          background: 'transparent',
          border: 'none',
          flex: 1,
          justifyContent: 'center'
        }}
      />

      {/* Search and Login */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Search
          placeholder="Tìm kiếm phim..."
          className="cinema-search-bar"
          style={{ width: 200 }}
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
        />
        {user ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button 
              type="primary" 
              className="cinema-primary-button"
              icon={<UserOutlined />}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                background: 'var(--primary-red)',
                borderColor: 'var(--primary-red)'
              }}
            >
              {user.name}
            </Button>
          </Dropdown>
        ) : (
          <Button 
            type="primary" 
            className="cinema-primary-button"
            icon={<UserOutlined />}
            onClick={() => navigate('/login')}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;