import React from 'react';
import { Layout, Menu, Button, Input } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Header: AntHeader } = Layout;
const { Search } = Input;

const Header = () => {
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
    <AntHeader style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 24px',
      background: '#0a0a0a',
      borderBottom: '1px solid #333'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: '#ffffff'
          }}>
            <span style={{ color: '#ff4d4f' }}>Quick</span>Show
          </span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <Menu
        theme="dark"
        mode="horizontal"
        items={menuItems}
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
          style={{ width: 200 }}
          prefix={<SearchOutlined style={{ color: '#666' }} />}
        />
        <Button 
          type="primary" 
          className="primary-button"
          icon={<UserOutlined />}
        >
          Log In
        </Button>
      </div>
    </AntHeader>
  );
};

export default Header;
