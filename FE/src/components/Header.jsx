import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Button, Input, Dropdown, Avatar, Empty, Drawer } from 'antd';
import { SearchOutlined, UserOutlined, LogoutOutlined, BookOutlined, PictureOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/app.context';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Debounce 2.5 giây - chỉ search khi user dừng gõ 2.5s
  const debouncedSearchValue = useDebounce(searchValue, 2500);

  // ✅ Load search query từ URL khi component mount (chỉ 1 lần)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query && query.trim()) {
      setSearchValue(query.trim());
      // Set showDropdown để hiển thị kết quả nếu có
      setShowDropdown(true);
    }
    // Chỉ chạy 1 lần khi mount, không phụ thuộc vào location.search để tránh loop
  }, []); // Empty dependency array - chỉ chạy 1 lần

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Tài khoản',
      onClick: () => {
        // Navigate to profile page or show profile modal
        console.log('Navigate to profile');
      },
    },
    {
      key: 'bookings',
      label: 'Lịch sử đặt vé',
      onClick: () => navigate('/bookings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
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

  // ✅ Search movies tự động khi user dừng gõ 2.5 giây (debounced)
  useEffect(() => {
    console.log('🎯 Search useEffect triggered');
    console.log('  - debouncedSearchValue:', debouncedSearchValue);
    console.log('  - searchValue:', searchValue);
    console.log('  - Are they equal?', debouncedSearchValue === searchValue);

    const searchMovies = async () => {
      // Nếu xóa hết text
      if (!debouncedSearchValue || debouncedSearchValue.trim().length === 0) {
        console.log('🗑️ Clearing search - empty value');
        setSearchResults([]);
        setShowDropdown(false);
        setLoading(false);
        // Xóa query parameter từ URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('q')) {
          urlParams.delete('q');
          const newUrl = urlParams.toString() 
            ? `${window.location.pathname}?${urlParams.toString()}`
            : window.location.pathname;
          window.history.pushState({}, '', newUrl);
        }
        return;
      }

      // Có text, bắt đầu search
      try {
        console.log('🚀 Starting auto search for:', debouncedSearchValue);
        setLoading(true);
        setShowDropdown(true); // ✅ Đảm bảo dropdown hiển thị ngay khi bắt đầu search
        console.log('✅ Set showDropdown = true (before API call)');
        
        const response = await movieAPI.getMovies({
          search: debouncedSearchValue.trim(),
          limit: 10,
          sortBy: 'hotness', // ✅ Sort by hotness như API example
        });
        
        console.log('✅ Search API response:', response);
        console.log('📊 Movies found:', response?.movies?.length || 0);
        
        if (response && response.movies) {
          setSearchResults(response.movies || []);
          setShowDropdown(true); // ✅ Đảm bảo dropdown hiển thị
          console.log('✅ Set showDropdown = true (after API success)');
          
          // Update URL (chỉ update nếu khác với current)
          const urlParams = new URLSearchParams(window.location.search);
          const currentQuery = urlParams.get('q');
          if (currentQuery !== debouncedSearchValue.trim()) {
            urlParams.set('q', debouncedSearchValue.trim());
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.pushState({}, '', newUrl);
            console.log('🔗 URL updated to:', newUrl);
          }
        } else {
          console.log('⚠️ No movies found in response');
          setSearchResults([]);
          setShowDropdown(true); // ✅ Vẫn hiển thị dropdown để show "không tìm thấy"
          console.log('✅ Set showDropdown = true (no movies found)');
        }
      } catch (error) {
        console.error('❌ Error searching movies:', error);
        setSearchResults([]);
        setShowDropdown(true);
        console.log('✅ Set showDropdown = true (error)');
      } finally {
        setLoading(false);
        // ✅ Force re-render để đảm bảo dropdown hiển thị
        console.log('✅ Final showDropdown state:', showDropdown);
        console.log('✅ Final searchResults length:', searchResults.length);
        console.log('✅ Final debouncedSearchValue:', debouncedSearchValue);
      }
    };

    // Chỉ search nếu có debouncedSearchValue
    if (debouncedSearchValue !== undefined) {
      searchMovies();
    }
  }, [debouncedSearchValue]); // ✅ CHỈ phụ thuộc vào debouncedSearchValue

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        // Chỉ đóng dropdown nếu không đang focus vào search input
        if (document.activeElement !== searchRef.current?.querySelector('input')) {
          setShowDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    console.log('⌨️ User typing:', value);
    setSearchValue(value);
    
    // ✅ LUÔN hiển thị dropdown ngay khi user bắt đầu gõ
    if (value.trim().length >= 1) {
      setShowDropdown(true);
      console.log('✅ Show dropdown = true (user typing)');
    } else {
      // Nếu xóa hết, đóng dropdown và clear results
      setShowDropdown(false);
      setSearchResults([]);
      setLoading(false);
      console.log('❌ Show dropdown = false (empty input)');
    }
  };

  const handleSearch = async (value) => {
    if (value && value.trim()) {
      console.log('🔍 User pressed Enter - searching immediately for:', value);
      // ✅ Khi user nhấn Enter, search ngay lập tức (bỏ qua debounce)
      setSearchValue(value.trim());
      setShowDropdown(true);
      setLoading(true);
      
      try {
        const response = await movieAPI.getMovies({
          search: value.trim(),
          limit: 10,
          sortBy: 'hotness', // ✅ Sort by hotness như API example
        });
        
        console.log('✅ Enter search results:', response?.movies?.length || 0);
        
        if (response && response.movies) {
          setSearchResults(response.movies || []);
          setShowDropdown(true);
          
          // Update URL
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('q', value.trim());
          const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
          window.history.pushState({}, '', newUrl);
          console.log('🔗 URL updated to:', newUrl);
        } else {
          setSearchResults([]);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('❌ Error in Enter search:', error);
        setSearchResults([]);
        setShowDropdown(true);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchValue('');
      setShowDropdown(false);
      setSearchResults([]);
      setLoading(false);
    }
  };

  const handleMovieClick = (movieId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    // ✅ Đóng dropdown và chuyển trang
    setShowDropdown(false);
    setSearchValue('');
    setSearchResults([]);
    // ✅ Chuyển đến trang chi tiết phim
    navigate(`/movies/${movieId}`);
  };

  const handleViewAll = () => {
    // ✅ Chỉ update URL, không navigate
    const newUrl = `${window.location.pathname}?q=${encodeURIComponent(searchValue.trim())}`;
    window.history.pushState({}, '', newUrl);
    // Có thể mở rộng dropdown hoặc load thêm kết quả
    // Hoặc giữ nguyên dropdown hiện tại
  };
  // ✅ Menu items với dropdown cho "Phim"
  const menuItems = [
    {
      key: 'home',
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: 'movies',
      label: 'Phim',
      children: [
        {
          key: 'movies-now-showing',
          label: <Link to="/movies?status=now-showing">Phim đang chiếu</Link>,
        },
        {
          key: 'movies-coming-soon',
          label: <Link to="/movies?status=coming-soon">Phim sắp chiếu</Link>,
        },
        {
          key: 'movies-trending',
          label: <Link to="/movies?sortBy=hotness">Top phim hay</Link>,
        },
      ],
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

  // ✅ Mobile menu items (cho Drawer)
  const mobileMenuItems = [
    {
      key: 'home',
      label: <Link to="/" onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>,
    },
    {
      key: 'movies',
      label: 'Phim',
      children: [
        {
          key: 'movies-now-showing',
          label: <Link to="/movies?status=now-showing" onClick={() => setMobileMenuOpen(false)}>Phim đang chiếu</Link>,
        },
        {
          key: 'movies-coming-soon',
          label: <Link to="/movies?status=coming-soon" onClick={() => setMobileMenuOpen(false)}>Phim sắp chiếu</Link>,
        },
        {
          key: 'movies-trending',
          label: <Link to="/movies?sortBy=hotness" onClick={() => setMobileMenuOpen(false)}>Top phim hay</Link>,
        },
      ],
    },
    {
      key: 'showtimes',
      label: <Link to="/showtimes" onClick={() => setMobileMenuOpen(false)}>Lịch chiếu</Link>,
    },
    {
      key: 'branches',
      label: <Link to="/branches" onClick={() => setMobileMenuOpen(false)}>Chi nhánh</Link>,
    },
    {
      key: 'combos',
      label: <Link to="/combos" onClick={() => setMobileMenuOpen(false)}>Combo</Link>,
    },
    {
      key: 'vouchers',
      label: <Link to="/vouchers" onClick={() => setMobileMenuOpen(false)}>Voucher</Link>,
    },
  ];

  return (
    <>
    <AntHeader className="cinema-brand-header" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 32px',
      height: '64px',
      lineHeight: '64px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      transition: 'all 0.3s ease',
      background: isScrolled 
        ? 'rgba(10, 10, 10, 0.95)' 
        : 'rgba(10, 10, 10, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: isScrolled 
        ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
        : 'none',
      overflow: 'visible',
    }}>
      {/* Logo */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        flex: '0 0 auto'
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <span className="cinema-logo" style={{ fontSize: '28px', fontWeight: '800' }}>
            <span style={{ 
              color: '#ef4444',
              textShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
            }}>CLBK</span>
          </span>
        </Link>
      </div>

      {/* Navigation Menu - Desktop */}
      <Menu
        theme="dark"
        mode="horizontal"
        items={menuItems}
        className="cinema-nav-menu"
        style={{ 
          background: 'transparent',
          border: 'none',
          flex: 1,
          justifyContent: 'center',
          color: '#fff',
          fontSize: '15px',
          fontWeight: '500',
          minWidth: 0,
          lineHeight: '64px',
          margin: 0,
          padding: 0
        }}
        triggerSubMenuAction="hover"
      />

      {/* Hamburger Menu - Mobile */}
      <Button
        type="text"
        onClick={() => setMobileMenuOpen(true)}
        style={{
          display: 'none',
          color: '#fff',
          fontSize: '20px',
          padding: '8px',
        }}
        className="mobile-menu-btn"
      >
        ☰
      </Button>

      {/* Search and Login */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 10001, flex: '0 0 auto' }}>
        <div ref={searchRef} style={{ position: 'relative', width: 320, zIndex: 10001 }}>
        <Search
          placeholder="Tìm kiếm phim..."
          className="cinema-search-bar"
            style={{ width: '100%' }}
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            loading={loading}
            allowClear
            onFocus={() => {
              // ✅ LUÔN hiển thị dropdown khi focus vào search bar (nếu có text hoặc kết quả)
              if (searchValue.trim().length >= 1 || debouncedSearchValue.trim().length >= 1 || searchResults.length > 0) {
                setShowDropdown(true);
                console.log('✅ Show dropdown = true (onFocus)');
              }
            }}
            onKeyDown={(e) => {
              // Nếu nhấn Escape, đóng dropdown
              if (e.key === 'Escape') {
                setShowDropdown(false);
              }
            }}
          />
          
          {/* ✅ Dropdown kết quả tìm kiếm - LUÔN hiển thị khi showDropdown = true */}
          {showDropdown && (
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
                zIndex: 10002,
                maxHeight: '70vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'block',
                visibility: 'visible',
                opacity: 1,
                pointerEvents: 'auto',
              }}
            >
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: '14px', color: '#999' }}>Đang tìm kiếm "{debouncedSearchValue}"...</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    Vui lòng đợi trong giây lát
                  </div>
                </div>
              ) : searchValue.trim() !== debouncedSearchValue.trim() && searchValue.trim().length >= 1 && !loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                  <div style={{ marginBottom: '4px' }}>Đang chờ bạn dừng gõ...</div>
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
                      onClick={(e) => handleMovieClick(movie._id, e)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #333',
                        transition: 'background 0.2s ease',
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
                      {movie.poster ? (
                        <img
                          src={getImageUrl(movie.poster)}
                          alt={movie.title}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          background: '#333',
                          flexShrink: 0
                        }} />
                      )}
                      
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
              ) : debouncedSearchValue.trim().length >= 1 && searchResults.length === 0 && !loading ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    Không tìm thấy phim nào
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                    Không có kết quả cho "{debouncedSearchValue}"
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
              ) : searchValue.trim().length >= 1 && searchValue.trim() !== debouncedSearchValue.trim() && !loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                  <div style={{ marginBottom: '4px' }}>Đang chờ bạn dừng gõ...</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    Kết quả sẽ hiển thị sau 2.5 giây khi bạn dừng gõ
                  </div>
                </div>
              ) : searchValue.trim().length >= 1 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                  <div style={{ marginBottom: '4px' }}>Đang tìm kiếm...</div>
                </div>
              ) : null}
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
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '8px',
                height: '40px',
                padding: '0 20px',
                fontWeight: '600',
                fontSize: '15px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              {user.name}
            </Button>
          </Dropdown>
        ) : (
          <Button 
            type="primary" 
            className="cinema-primary-button"
            onClick={() => navigate('/auth')}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: '8px',
              height: '40px',
              padding: '0 20px',
              fontWeight: '600',
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </AntHeader>

    {/* ✅ Mobile Menu Drawer */}
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="cinema-logo" style={{ fontSize: '24px' }}>
            <span style={{ color: 'var(--primary-red)' }}>Quick</span>Show
          </span>
        </div>
      }
      placement="right"
      onClose={() => setMobileMenuOpen(false)}
      open={mobileMenuOpen}
      bodyStyle={{ 
        background: '#0a0a0a',
        padding: 0,
      }}
      headerStyle={{
        background: '#0a0a0a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      closeIcon={<span style={{ color: '#fff', fontSize: '24px' }}>×</span>}
    >
      <Menu
        mode="vertical"
        items={mobileMenuItems}
        theme="dark"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
        }}
        triggerSubMenuAction="click"
      />
      {user && (
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          marginTop: '16px'
        }}>
          <div style={{ color: '#fff', marginBottom: '12px', fontWeight: '600' }}>
            {user.name}
          </div>
          <Button
            type="primary"
            block
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/bookings');
            }}
            style={{ marginBottom: '8px' }}
          >
            Lịch sử đặt vé
          </Button>
          <Button
            block
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            danger
          >
            Đăng xuất
          </Button>
        </div>
      )}
    </Drawer>

    {/* ✅ CSS cho responsive */}
    <style>{`
      @media (max-width: 768px) {
        .cinema-nav-menu {
          display: none !important;
        }
        .mobile-menu-btn {
          display: block !important;
        }
        .cinema-brand-header > div:first-child {
          flex: 0 0 auto;
        }
        .cinema-brand-header > div:last-child {
          flex: 0 0 auto;
        }
      }
      @media (min-width: 769px) {
        .mobile-menu-btn {
          display: none !important;
        }
      }
    `}</style>
    </>
  );
};

export default Header;