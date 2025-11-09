import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Button, Input, Dropdown, Avatar, Empty } from 'antd';
import { SearchOutlined, UserOutlined, LogoutOutlined, BookOutlined, PictureOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { movieAPI, getImageUrl } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import '../cinema-brand.css';

const { Header: AntHeader } = Layout;
const { Search } = Input;

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Debounce 2.5 giây - chỉ search khi user dừng gõ 2.5s
  const debouncedSearchValue = useDebounce(searchValue, 2500);

  // ✅ Load search query từ URL khi component mount hoặc URL thay đổi
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query && query.trim() && query.trim() !== searchValue) {
      // Chỉ set nếu query khác với current value để tránh loop
      setSearchValue(query.trim());
      // Sẽ trigger search thông qua debouncedSearchValue
    } else if (!query && searchValue) {
      // Nếu URL không có query nhưng searchValue có, giữ nguyên (user đang gõ)
      // Không reset searchValue
    }
  }, [location.search]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ',
      icon: <UserOutlined />,
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

  // ✅ Search movies chỉ khi user dừng gõ 2.5 giây (debounced)
  useEffect(() => {
    const searchMovies = async () => {
      if (debouncedSearchValue && debouncedSearchValue.trim().length >= 1) {
        try {
          setLoading(true);
          // ✅ Hiển thị dropdown với loading state khi bắt đầu search
          setShowDropdown(true);
          
          const response = await movieAPI.getMovies({
            search: debouncedSearchValue.trim(),
            limit: 10, // Tăng lên 10 phim để hiển thị nhiều hơn
          });
          
          if (response && response.movies) {
            setSearchResults(response.movies);
            setShowDropdown(true);
            // ✅ Update URL nếu có thay đổi
            const urlParams = new URLSearchParams(location.search);
            const currentQuery = urlParams.get('q');
            if (currentQuery !== debouncedSearchValue.trim()) {
              const newUrl = `${window.location.pathname}?q=${encodeURIComponent(debouncedSearchValue.trim())}`;
              window.history.pushState({}, '', newUrl);
            }
          } else {
            setSearchResults([]);
            // Vẫn hiển thị dropdown nếu có text để show "không tìm thấy"
            if (debouncedSearchValue.trim().length >= 2) {
              setShowDropdown(true);
            } else {
              setShowDropdown(false);
            }
          }
        } catch (error) {
          console.error('Error searching movies:', error);
          setSearchResults([]);
          if (debouncedSearchValue.trim().length >= 2) {
            setShowDropdown(true);
          } else {
            setShowDropdown(false);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
        // ✅ Nếu xóa hết text, xóa query parameter
        if (location.search.includes('q=')) {
          const newUrl = window.location.pathname;
          window.history.pushState({}, '', newUrl);
        }
        setShowDropdown(false);
      }
    };

    searchMovies();
  }, [debouncedSearchValue, location.search]);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // ✅ Hiển thị dropdown ngay khi user bắt đầu gõ để show "Đang chờ..."
    if (value.trim().length >= 1) {
      // Hiển thị dropdown với message "Đang chờ bạn dừng gõ..."
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  };

  const handleSearch = (value) => {
    if (value && value.trim()) {
      // ✅ Chỉ update URL, không navigate sang trang search
      // Giữ dropdown mở để user có thể xem kết quả ngay
      const newUrl = `${window.location.pathname}?q=${encodeURIComponent(value.trim())}`;
      window.history.pushState({}, '', newUrl);
      // Không đóng dropdown, để user thấy kết quả
      // setShowDropdown(false);
    }
  };

  const handleMovieClick = (movieId) => {
    setShowDropdown(false);
    setSearchValue('');
    navigate(`/movies/${movieId}`);
  };

  const handleViewAll = () => {
    // ✅ Chỉ update URL, không navigate
    const newUrl = `${window.location.pathname}?q=${encodeURIComponent(searchValue.trim())}`;
    window.history.pushState({}, '', newUrl);
    // Có thể mở rộng dropdown hoặc load thêm kết quả
    // Hoặc giữ nguyên dropdown hiện tại
  };
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        <div ref={searchRef} style={{ position: 'relative', width: 350 }}>
        <Search
          placeholder="Tìm kiếm phim..."
          className="cinema-search-bar"
            style={{ width: '100%' }}
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            loading={loading}
            allowClear
            onFocus={() => {
              // ✅ Hiển thị dropdown khi focus vào search bar
              if (searchValue.trim().length >= 1 || debouncedSearchValue.trim().length >= 1) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={(e) => {
              // Nếu nhấn Escape, đóng dropdown
              if (e.key === 'Escape') {
                setShowDropdown(false);
              }
            }}
          />
          
          {/* ✅ Dropdown kết quả tìm kiếm - Hiển thị thẳng dưới search bar, căn chỉnh với search bar */}
          {showDropdown && (searchValue.trim().length >= 1 || debouncedSearchValue.trim().length >= 1) && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '100%',
                marginTop: 0,
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                zIndex: 1001,
                maxHeight: '70vh',
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>
                  <div style={{ marginBottom: '8px', fontSize: '24px' }}>🔍</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>Đang tìm kiếm "{debouncedSearchValue}"...</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    Vui lòng đợi trong giây lát
                  </div>
                </div>
              ) : searchValue !== debouncedSearchValue && searchValue.trim().length >= 1 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                  <div style={{ marginBottom: '8px' }}>⌨️</div>
                  <div>Đang chờ bạn dừng gõ...</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    Kết quả sẽ hiển thị sau 2.5 giây khi bạn dừng gõ
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #333' }}>
                    <div style={{ 
                      color: '#fff', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Kết quả tìm kiếm ({searchResults.length})</span>
                      <Button
                        type="link"
                        size="small"
                        onClick={handleViewAll}
                        style={{ 
                          color: '#ef4444', 
                          padding: 0,
                          height: 'auto'
                        }}
                      >
                        Xem tất cả →
                      </Button>
                    </div>
                  </div>
                  {searchResults.map((movie) => (
                    <div
                      key={movie._id}
                      onClick={() => handleMovieClick(movie._id)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #333',
                        transition: 'background 0.2s',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2a2a2a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Movie Poster */}
                      <Avatar
                        src={movie.poster ? getImageUrl(movie.poster) : null}
                        icon={<PictureOutlined />}
                        size={50}
                        shape="square"
                        style={{
                          flexShrink: 0,
                          borderRadius: '8px',
                          objectFit: 'cover',
                        }}
                      />
                      
                      {/* Movie Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          color: '#fff', 
                          fontSize: '14px', 
                          fontWeight: '600',
                          marginBottom: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {movie.title}
                        </div>
                        <div style={{ 
                          color: '#999', 
                          fontSize: '12px',
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          {movie.genre && movie.genre.length > 0 && (
                            <span>{movie.genre.slice(0, 2).join(', ')}</span>
                          )}
                          {movie.rating && (
                            <span>⭐ {movie.rating}/10</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : searchValue.trim().length >= 2 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <div style={{ color: '#999', fontSize: '14px', marginBottom: '12px' }}>
                          Không tìm thấy phim nào cho "{searchValue}"
                        </div>
                        <Button
                          type="primary"
                          size="small"
                          onClick={handleViewAll}
                          style={{
                            background: '#ef4444',
                            borderColor: '#ef4444'
                          }}
                        >
                          Xem tất cả kết quả
                        </Button>
                      </div>
                    }
                  />
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                  Nhập ít nhất 2 ký tự để tìm kiếm...
                </div>
              )}
            </div>
          )}
        </div>
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
            onClick={() => navigate('/auth')}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;
