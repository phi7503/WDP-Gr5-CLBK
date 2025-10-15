import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Input } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import '../cinema-brand.css';

const { Header: AntHeader } = Layout;
const { Search } = Input;

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

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
      label: <Link to="/">Home</Link>,
    },
    {
      key: 'movies',
      label: <Link to="/movies">Movies</Link>,
    },
    {
      key: 'showtimes',
      label: <Link to="/showtimes">Showtimes</Link>,
    },
    {
      key: 'branches',
      label: <Link to="/branches">Branches</Link>,
    },
    {
      key: 'combos',
      label: <Link to="/combos">Combos</Link>,
    },
    {
      key: 'vouchers',
      label: <Link to="/vouchers">Vouchers</Link>,
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
          placeholder="Search movies..."
          className="cinema-search-bar"
          style={{ width: 200 }}
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
        />
        <Button 
          type="primary" 
          className="cinema-primary-button"
          icon={<UserOutlined />}
        >
          Log In
        </Button>
      </div>
    </AntHeader>
  );
};

export default Header;
