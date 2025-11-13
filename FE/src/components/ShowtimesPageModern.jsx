import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Layout, Typography, Button, DatePicker, Select, Tag, Empty, Collapse, Tooltip, Badge, message } from 'antd';
import { 
  PlayCircleOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  FireOutlined,
  StarFilled,
  CalendarOutlined,
  FilterOutlined,
  CloseOutlined,
  DownOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Header from './Header';
import Footer from './Footer';
import { movieAPI, showtimeAPI, branchAPI, getImageUrl } from '../services/api';
import '../showtimes-colors.css';

// Lazy load heavy components
const CinemaLoadingSpinner = lazy(() => import('./CinemaLoadingSpinner'));
const CinemaSkeleton = lazy(() => import('./CinemaSkeleton'));

// Inline fallback for lazy components
const LazyLoadFallback = () => (
  <div style={{ textAlign: 'center', padding: '20px' }}>
    <div className="spinner" style={{
      width: '40px',
      height: '40px',
      margin: '0 auto',
      border: '3px solid rgba(255,255,255,0.1)',
      borderTop: '3px solid #dc2626',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  </div>
);

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const ShowtimesPageModern = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // View Mode State
  const [viewMode, setViewMode] = useState('by-movie'); // 'by-movie', 'by-cinema', 'by-date'
  
  // Filter States
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedCity, setSelectedCity] = useState('all'); // NEW: City filter
  const [selectedCinemaChain, setSelectedCinemaChain] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedMovie, setSelectedMovie] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all'); // 'all', 'morning', 'afternoon', 'evening', 'night'
  
  // Data States
  const [movies, setMovies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchesByChain, setBranchesByChain] = useState({});
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // UI States
  const [expandedChains, setExpandedChains] = useState([]);
  const [expandedBranches, setExpandedBranches] = useState([]);
  const sectionsRef = useRef([]);
  const hasLoadedInitialShowtimes = useRef(false);

  // Cinema chains configuration
  const cinemaChains = [
    { key: 'CGV', label: 'CGV Cinemas', color: '#E71A0F', icon: '🎬' },
    { key: 'Lotte', label: 'Lotte Cinema', color: '#ED1C24', icon: '🎭' },
    { key: 'BHD', label: 'BHD Star Cineplex', color: '#FFD700', icon: '⭐' },
    { key: 'Galaxy', label: 'Galaxy Cinema', color: '#9333EA', icon: '🌌' },
    { key: 'Beta', label: 'Beta Cinemas', color: '#06B6D4', icon: '🎪' },
    { key: 'MegaGS', label: 'Mega GS Cinemas', color: '#F59E0B', icon: '🎯' },
    { key: 'Platinum', label: 'Platinum Cineplex', color: '#6B7280', icon: '💎' },
    { key: 'Diamond', label: 'Diamond Cinema', color: '#3B82F6', icon: '💍' },
    { key: 'CineStar', label: 'CineStar', color: '#8B5CF6', icon: '⭐' },
    { key: 'Other', label: 'Rạp khác', color: '#6B7280', icon: '🎥' }
  ];

  // Cities configuration (match with database values)
  const cities = [
    { key: 'all', label: 'Tất cả thành phố', icon: '🌏' },
    { key: 'TP.HCM', label: 'TP. Hồ Chí Minh', icon: '🏙️', aliases: ['Ho Chi Minh', 'Saigon', 'HCMC'] },
    { key: 'Hà Nội', label: 'Hà Nội', icon: '🏛️', aliases: ['Ha Noi', 'Hanoi', 'HN'] },
    { key: 'Hải Phòng', label: 'Hải Phòng', icon: '⚓', aliases: ['Hai Phong', 'Haiphong', 'HP'] },
    { key: 'Đà Nẵng', label: 'Đà Nẵng', icon: '🌊', aliases: ['Da Nang', 'Danang', 'DN'] },
    { key: 'Cần Thơ', label: 'Cần Thơ', icon: '🌾', aliases: ['Can Tho', 'Cantho', 'CT'] },
    { key: 'other', label: 'Tỉnh thành khác', icon: '📍', isOther: true }
  ];
  
  // Main cities for "other" filter
  const mainCities = ['TP.HCM', 'Hà Nội', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ'];

  // Generate next 7 days
  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().add(i, 'day');
      dates.push({
        value: date.format('YYYY-MM-DD'),
        label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : date.format('ddd, DD/MM'),
        day: date.format('ddd'),
        date: date.format('DD'),
        month: date.format('MMM'),
        isToday: i === 0,
        isWeekend: date.day() === 0 || date.day() === 6
      });
    }
    return dates;
  };

  const next7Days = getNext7Days();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // ✅ Load showtimes khi movies và branches đã sẵn sàng (lần đầu tiên)
  useEffect(() => {
    if (movies.length > 0 && branches.length > 0 && !initialLoading && !hasLoadedInitialShowtimes.current) {
      hasLoadedInitialShowtimes.current = true;
      loadShowtimes();
    }
  }, [movies.length, branches.length, initialLoading]);

  // Load showtimes when filters change
  useEffect(() => {
    // Chỉ load nếu đã có movies và branches, và không phải đang initial loading
    if (movies.length > 0 && branches.length > 0 && !initialLoading) {
      loadShowtimes();
    }
  }, [selectedDate, selectedCity, selectedCinemaChain, selectedBranch, selectedMovie, selectedTimeRange]);

  // Reload data when page becomes visible (user returns from booking page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && movies.length > 0 && branches.length > 0) {
        // Reload data when page becomes visible
        loadShowtimes();
      }
    };

    const handleFocus = () => {
      // Reload data when window gains focus
      if (movies.length > 0 && branches.length > 0) {
        loadShowtimes();
      }
    };

    // Check if need to reload after booking
    const shouldReload = localStorage.getItem('shouldReloadShowtimes');
    if (shouldReload === 'true' && movies.length > 0 && branches.length > 0) {
      localStorage.removeItem('shouldReloadShowtimes');
      loadShowtimes();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedDate, selectedCity, selectedCinemaChain, selectedBranch, selectedMovie, selectedTimeRange, movies.length, branches.length]);

  // Scroll reveal effect + Lazy load images
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Lazy load images khi scroll vào view
            const images = entry.target.querySelectorAll('img[data-src]');
            images.forEach(img => {
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
              }
            });
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Preload khi còn cách 100px
      }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [showtimes]);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      setLoading(true);
      
      // Load movies and branches in parallel
      const [moviesRes, branchesRes] = await Promise.all([
        movieAPI.getMovies({ limit: 100, status: 'now-showing' }),
        branchAPI.getBranchesGrouped()
      ]);

      const moviesList = moviesRes?.movies || [];
      setMovies(moviesList);

      // ✅ Check URL params for movie ID
      const movieIdFromUrl = searchParams.get('movie');
      if (movieIdFromUrl) {
        // Verify movie exists in list
        const movieExists = moviesList.some(m => m._id === movieIdFromUrl);
        if (movieExists) {
          console.log('🎬 Auto-selecting movie from URL:', movieIdFromUrl);
          setSelectedMovie(movieIdFromUrl);
        } else {
          console.warn('⚠️ Movie ID from URL not found:', movieIdFromUrl);
        }
      }

      if (branchesRes && branchesRes.groupedByChain) {
        setBranchesByChain(branchesRes.groupedByChain);
        
        // Flatten branches for dropdown
        const allBranches = [];
        Object.values(branchesRes.groupedByChain).forEach(chainBranches => {
          allBranches.push(...chainBranches);
        });
        setBranches(allBranches);
      }

      setInitialLoading(false);
      setLoading(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      message.error('Không thể tải dữ liệu. Vui lòng thử lại!');
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const loadShowtimes = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = {
        date: selectedDate,
        limit: 1000
      };

      if (selectedMovie !== 'all') params.movie = selectedMovie;
      if (selectedBranch !== 'all') params.branch = selectedBranch;

      const response = await showtimeAPI.getShowtimes(params);
      let showtimesList = Array.isArray(response) ? response : (response?.showtimes || []);
      

      // Filter by city if selected
      if (selectedCity !== 'all') {
        // Special case: "other" means NOT in main cities
        if (selectedCity === 'other') {
          showtimesList = showtimesList.filter(st => {
            const branchCity = st.branch?.location?.city || st.branch?.location?.province || '';
            if (!branchCity) return false;
            
            const normalizeText = (text) => {
              return text
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[.\s]+/g, '');
            };
            
            const normalizedBranchCity = normalizeText(branchCity);
            
            // Check if NOT in any main city
            return !mainCities.some(mainCity => {
              const normalizedMainCity = normalizeText(mainCity);
              return normalizedBranchCity === normalizedMainCity || 
                     normalizedBranchCity.includes(normalizedMainCity) ||
                     normalizedMainCity.includes(normalizedBranchCity);
            });
          });
        } else {
          // Normal city filter
          showtimesList = showtimesList.filter(st => {
            const branchCity = st.branch?.location?.city || st.branch?.location?.province || '';
            
            if (!branchCity) return false;
            
            // Normalize for comparison (remove spaces, accents, lowercase, dots)
            const normalizeText = (text) => {
              return text
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese accents
                .replace(/[.\s]+/g, ''); // Remove dots and spaces
            };
            
            const normalizedSelectedCity = normalizeText(selectedCity);
            const normalizedBranchCity = normalizeText(branchCity);
            
            // Direct match (exact after normalize)
            if (normalizedBranchCity === normalizedSelectedCity) {
              return true;
            }
            
            // Check if contains (for partial matches)
            if (normalizedBranchCity.includes(normalizedSelectedCity) || 
                normalizedSelectedCity.includes(normalizedBranchCity)) {
              return true;
            }
            
            // Check aliases
            const cityConfig = cities.find(c => c.key === selectedCity);
            if (cityConfig && cityConfig.aliases) {
              return cityConfig.aliases.some(alias => {
                const normalizedAlias = normalizeText(alias);
                return normalizedBranchCity.includes(normalizedAlias) || 
                       normalizedAlias.includes(normalizedBranchCity);
              });
            }
            
            return false;
          });
        }
      }

      // Filter by cinema chain if selected
      if (selectedCinemaChain !== 'all') {
        showtimesList = showtimesList.filter(st => {
          const branchChain = st.branch?.cinemaChain || 'Other';
          return branchChain === selectedCinemaChain;
        });
      }

      // Filter by time range
      if (selectedTimeRange !== 'all') {
        showtimesList = showtimesList.filter(st => {
          const hour = new Date(st.startTime).getHours();
          switch (selectedTimeRange) {
            case 'morning': return hour >= 6 && hour < 12;
            case 'afternoon': return hour >= 12 && hour < 18;
            case 'evening': return hour >= 18 && hour < 22;
            case 'night': return hour >= 22 || hour < 6;
            default: return true;
          }
        });
      }

      setShowtimes(showtimesList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading showtimes:', error);
      message.error('Không thể tải lịch chiếu');
      setLoading(false);
    }
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Get seat availability status
  const getSeatStatus = (showtime) => {
    const total = showtime.totalSeats || 100;
    const booked = showtime.bookedSeats || 0;
    const available = total - booked;
    const percent = (available / total) * 100;

    if (percent <= 0) {
      return { status: 'sold-out', color: 'var(--seat-soldout-text)', bg: 'var(--seat-soldout-bg)', border: 'var(--seat-soldout-border)', text: 'Hết vé', icon: '', disabled: true };
    } else if (percent <= 20) {
      return { status: 'almost-full', color: 'var(--seat-almost-text)', bg: 'var(--seat-almost-bg)', border: 'var(--seat-almost-border)', text: `${available} ghế`, icon: '🔥', disabled: false, animate: 'blink' };
    } else if (percent <= 50) {
      return { status: 'filling-fast', color: 'var(--seat-filling-text)', bg: 'var(--seat-filling-bg)', border: 'var(--seat-filling-border)', text: `${available} ghế`, icon: '⚠️', disabled: false, animate: 'pulse' };
    } else {
      return { status: 'available', color: 'var(--seat-available-text)', bg: 'var(--seat-available-bg)', border: 'var(--seat-available-border)', text: `${available} ghế`, icon: '✓', disabled: false };
    }
  };

  // Handle showtime click
  const handleShowtimeClick = (showtime) => {
    const status = getSeatStatus(showtime);
    if (status.disabled) return;

    navigate(`/booking/${showtime._id}`, {
      state: {
        showtime: showtime,
        movie: showtime.movie,
        branch: showtime.branch,
        theater: showtime.theater
      }
    });
  };

  // Group showtimes by movie
  const groupShowtimesByMovie = () => {
    const grouped = {};
    
    showtimes.forEach(st => {
      const movieId = st.movie?._id || st.movie;
      if (!grouped[movieId]) {
        grouped[movieId] = {
          movie: st.movie,
          byChain: {}
        };
      }
      
      const chain = st.branch?.cinemaChain || 'Other';
      if (!grouped[movieId].byChain[chain]) {
        grouped[movieId].byChain[chain] = {};
      }
      
      const branchId = st.branch?._id;
      if (!grouped[movieId].byChain[chain][branchId]) {
        grouped[movieId].byChain[chain][branchId] = {
          branch: st.branch,
          showtimes: []
        };
      }
      
      grouped[movieId].byChain[chain][branchId].showtimes.push(st);
    });

    // Sort showtimes by time
    Object.values(grouped).forEach(movieData => {
      Object.values(movieData.byChain).forEach(chainData => {
        Object.values(chainData).forEach(branchData => {
          branchData.showtimes.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        });
      });
    });

    return grouped;
  };

  // Group showtimes by cinema
  const groupShowtimesByCinema = () => {
    const grouped = {};
    
    showtimes.forEach(st => {
      const chain = st.branch?.cinemaChain || 'Other';
      if (!grouped[chain]) {
        grouped[chain] = {};
      }
      
      const branchId = st.branch?._id;
      if (!grouped[chain][branchId]) {
        grouped[chain][branchId] = {
          branch: st.branch,
          byMovie: {}
        };
      }
      
      const movieId = st.movie?._id;
      if (!grouped[chain][branchId].byMovie[movieId]) {
        grouped[chain][branchId].byMovie[movieId] = {
          movie: st.movie,
          showtimes: []
        };
      }
      
      grouped[chain][branchId].byMovie[movieId].showtimes.push(st);
    });

    // Sort
    Object.values(grouped).forEach(chainData => {
      Object.values(chainData).forEach(branchData => {
        Object.values(branchData.byMovie).forEach(movieData => {
          movieData.showtimes.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        });
      });
    });

    return grouped;
  };

  // Group showtimes by time (Timeline view)
  const groupShowtimesByTime = () => {
    const periods = {
      morning: { label: '☀️ BUỔI SÁNG (6:00 - 12:00)', showtimes: [] },
      afternoon: { label: '🌤️ BUỔI CHIỀU (12:00 - 18:00)', showtimes: [] },
      evening: { label: '🌆 BUỔI TỐI (18:00 - 22:00)', showtimes: [] },
      night: { label: '🌙 ĐÊM KHUYA (22:00 - 6:00)', showtimes: [] }
    };

    showtimes.forEach(st => {
      const hour = new Date(st.startTime).getHours();
      if (hour >= 6 && hour < 12) periods.morning.showtimes.push(st);
      else if (hour >= 12 && hour < 18) periods.afternoon.showtimes.push(st);
      else if (hour >= 18 && hour < 22) periods.evening.showtimes.push(st);
      else periods.night.showtimes.push(st);
    });

    // Sort by time
    Object.values(periods).forEach(period => {
      period.showtimes.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });

    return periods;
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
    setSelectedCity('all');
    setSelectedCinemaChain('all');
    setSelectedBranch('all');
    setSelectedMovie('all');
    setSelectedTimeRange('all');
  };

  // Get unique cities from branches
  const getAvailableCities = () => {
    const citiesSet = new Set();
    branches.forEach(branch => {
      const city = branch.location?.city || branch.location?.province;
      if (city) {
        citiesSet.add(city);
      }
    });
    return Array.from(citiesSet);
  };

  // Render time slot button
  const renderTimeSlot = (showtime, index = 0) => {
    const status = getSeatStatus(showtime);
    const time = formatTime(showtime.startTime);

    return (
      <Tooltip
        key={showtime._id}
        title={
          <div style={{ padding: '8px' }}>
            <div><strong>{showtime.theater?.name || 'Screen'}</strong></div>
            <div style={{ marginTop: '8px' }}>
              <div>🪑 Còn: {showtime.totalSeats - (showtime.bookedSeats || 0)}/{showtime.totalSeats} ghế</div>
              <div style={{ marginTop: '4px' }}>💰 {(showtime.price?.standard || showtime.price || 50000).toLocaleString('vi-VN')} VNĐ</div>
            </div>
          </div>
        }
        placement="top"
      >
        <div
          className={`time-slot ${status.status} ${status.animate || ''}`}
          style={{
            position: 'relative',
            display: 'inline-block',
            padding: '12px 16px',
            margin: '6px',
            borderRadius: '8px',
            border: `1px solid ${status.border}`,
            background: status.bg,
            color: status.color,
            cursor: status.disabled ? 'not-allowed' : 'pointer',
            opacity: status.disabled ? 0.5 : 1,
            minWidth: '120px',
            textAlign: 'center',
            transition: 'all 0.2s var(--ease-smooth)',
            animationDelay: `${index * 50}ms`
          }}
          onClick={() => handleShowtimeClick(showtime)}
          onMouseEnter={(e) => {
            if (!status.disabled) {
              e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${status.color}40`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
            {status.icon} {time}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {status.text}
          </div>

          {/* Badges */}
          {showtime.isFirstShow && (
            <Tag 
              style={{
                position: 'absolute',
                top: '-8px',
                left: '-8px',
                background: 'var(--badge-first-bg)',
                border: 'none',
                color: '#fff',
                fontSize: '10px',
                padding: '2px 6px'
              }}
            >
              Suất đầu
            </Tag>
          )}
          {showtime.isLastShow && (
            <Tag 
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--badge-last-bg)',
                border: 'none',
                color: '#fff',
                fontSize: '10px',
                padding: '2px 6px'
              }}
            >
              🌙 Suất cuối
            </Tag>
          )}
        </div>
      </Tooltip>
    );
  };

  // Render BY MOVIE view
  const renderByMovieView = () => {
    const groupedData = groupShowtimesByMovie();
    
    if (Object.keys(groupedData).length === 0) {
      return (
        <Empty
          description="Không có suất chiếu nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '60px 0' }}
        />
      );
    }

    return (
      <div className="by-movie-view">
        {Object.entries(groupedData).map(([movieId, movieData], movieIndex) => {
          const movie = movieData.movie;
          if (!movie) return null;

          return (
            <div
              key={movieId}
              ref={el => sectionsRef.current[movieIndex] = el}
              className="movie-section section-reveal"
              style={{
                marginBottom: '48px',
                padding: '24px',
                background: 'var(--surface-1)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              {/* Movie Backdrop Banner - NEW */}
              {movie.backdropImage && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '300px',
                  marginBottom: '24px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #1a1a1a, #262626)'
                }}>
                  <img
                    data-src={getImageUrl(movie.backdropImage)}
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 800'%3E%3Crect fill='%231a1a1a' width='1920' height='800'/%3E%3C/svg%3E"
                    alt={`${movie.title} backdrop`}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'opacity 0.5s ease-out'
                    }}
                  />
                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 100%)'
                  }} />
                  {/* Movie title overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    color: '#fff',
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                  }}>
                    <Title level={1} style={{ color: '#fff', margin: 0 }}>
                      {movie.title}
                    </Title>
                  </div>
                </div>
              )}

              {/* Movie Header */}
              <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
                <img
                  data-src={getImageUrl(movie.poster || movie.posterUrl) || '/placeholder-movie.jpg'}
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 225'%3E%3Crect fill='%231a1a1a' width='150' height='225'/%3E%3Ctext x='50%25' y='50%25' fill='%23666' font-size='30' text-anchor='middle' dy='.3em'%3E🎬%3C/text%3E%3C/svg%3E"
                  alt={movie.title}
                  loading="lazy"
                  style={{
                    width: '150px',
                    height: '225px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    transition: 'opacity 0.3s ease-out',
                    background: 'linear-gradient(135deg, #1a1a1a, #262626)'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <Title level={2} style={{ color: '#fff', marginBottom: '12px' }}>
                    {movie.title}
                  </Title>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {movie.genre && movie.genre.length > 0 && (
                      <Text style={{ color: 'var(--text-secondary)' }}>
                        {movie.genre.join(', ')}
                      </Text>
                    )}
                    <Text style={{ color: 'var(--text-secondary)' }}>
                      <ClockCircleOutlined /> {movie.duration || 120} phút
                    </Text>
                    {movie.rating && (
                      <Text style={{ color: 'var(--text-secondary)' }}>
                        <StarFilled style={{ color: '#fbbf24' }} /> {movie.rating}/5
                      </Text>
                    )}
                  </div>
                  {movie.hotnessScore >= 70 && (
                    <Tag 
                      icon={<FireOutlined />}
                      color="red"
                      style={{ marginBottom: '12px' }}
                    >
                      HOT {movie.hotnessScore}/100
                    </Tag>
                  )}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      style={{ background: 'var(--gradient-primary)', border: 'none' }}
                      onClick={() => navigate(`/movies/${movieId}`)}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              </div>

              {/* Showtimes by Chain */}
              {Object.entries(movieData.byChain).map(([chain, chainData]) => {
                const chainInfo = cinemaChains.find(c => c.key === chain) || cinemaChains[cinemaChains.length - 1];
                
                return (
                  <div key={chain} style={{ marginBottom: '32px' }}>
                    <Title 
                      level={4} 
                      style={{ 
                        color: chainInfo.color,
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{chainInfo.icon}</span>
                      {chainInfo.label}
                    </Title>

                    {Object.entries(chainData).map(([branchId, branchData]) => {
                      const branch = branchData.branch;
                      if (!branch) return null;

                      return (
                        <div 
                          key={branchId}
                          style={{
                            padding: '16px',
                            marginBottom: '16px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          <div style={{ marginBottom: '12px' }}>
                            <Text strong style={{ fontSize: '16px', color: '#fff' }}>
                              <EnvironmentOutlined style={{ color: chainInfo.color, marginRight: '8px' }} />
                              {branch.name}
                            </Text>
                            <Text style={{ marginLeft: '8px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                              {branch.location?.city}
                            </Text>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {branchData.showtimes.map((st, idx) => renderTimeSlot(st, idx))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Render BY CINEMA view
  const renderByCinemaView = () => {
    const groupedData = groupShowtimesByCinema();
    
    if (Object.keys(groupedData).length === 0) {
      return (
        <Empty
          description="Không có suất chiếu nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '60px 0' }}
        />
      );
    }

    return (
      <div className="by-cinema-view">
        {Object.entries(groupedData).map(([chain, chainData]) => {
          const chainInfo = cinemaChains.find(c => c.key === chain) || cinemaChains[cinemaChains.length - 1];
          
          return (
            <div 
              key={chain}
              style={{
                marginBottom: '40px',
                padding: '24px',
                background: 'var(--surface-1)',
                borderRadius: '16px',
                border: `1px solid ${chainInfo.color}20`
              }}
            >
              <Title 
                level={3} 
                style={{ 
                  color: chainInfo.color,
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '32px' }}>{chainInfo.icon}</span>
                {chainInfo.label}
                <Badge 
                  count={Object.keys(chainData).length} 
                  style={{ backgroundColor: chainInfo.color, marginLeft: '12px' }}
                  title="Số rạp"
                />
              </Title>

              <Collapse
                ghost
                expandIconPosition="end"
                style={{ background: 'transparent' }}
              >
                {Object.entries(chainData).map(([branchId, branchData]) => {
                  const branch = branchData.branch;
                  if (!branch) return null;

                  const movieCount = Object.keys(branchData.byMovie).length;

                  return (
                    <Panel
                      key={branchId}
                      header={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div>
                            <Text strong style={{ fontSize: '16px', color: '#fff' }}>
                              <EnvironmentOutlined style={{ marginRight: '8px', color: chainInfo.color }} />
                              {branch.name}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '13px', marginLeft: '24px' }}>
                              {branch.location?.address}, {branch.location?.city}
                            </Text>
                          </div>
                          <Tag color="green">{movieCount} phim</Tag>
                        </div>
                      }
                      style={{
                        marginBottom: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ padding: '16px' }}>
                        {Object.entries(branchData.byMovie).map(([movieId, movieData]) => {
                          const movie = movieData.movie;
                          if (!movie) return null;

                          return (
                            <div 
                              key={movieId}
                              style={{
                                display: 'flex',
                                gap: '16px',
                                marginBottom: '24px',
                                padding: '16px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '8px'
                              }}
                            >
                              <img
                                data-src={getImageUrl(movie.poster || movie.posterUrl) || '/placeholder.jpg'}
                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 90'%3E%3Crect fill='%231a1a1a' width='60' height='90'/%3E%3C/svg%3E"
                                alt={movie.title}
                                loading="lazy"
                                style={{
                                  width: '60px',
                                  height: '90px',
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                  cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/movies/${movieId}`)}
                              />
                              <div style={{ flex: 1 }}>
                                <Text 
                                  strong 
                                  style={{ fontSize: '15px', color: '#fff', cursor: 'pointer' }}
                                  onClick={() => navigate(`/movies/${movieId}`)}
                                >
                                  {movie.title}
                                </Text>
                                <div style={{ marginTop: '4px', marginBottom: '12px' }}>
                                  <Text style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                    {movie.duration || 120} phút
                                  </Text>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {movieData.showtimes.map((st, idx) => renderTimeSlot(st, idx))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Panel>
                  );
                })}
              </Collapse>
            </div>
          );
        })}
      </div>
    );
  };

  // Render BY DATE (Timeline) view
  const renderByDateView = () => {
    const periods = groupShowtimesByTime();
    
    const totalShowtimes = Object.values(periods).reduce((sum, period) => sum + period.showtimes.length, 0);

    if (totalShowtimes === 0) {
      return (
        <Empty
          description="Không có suất chiếu nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '60px 0' }}
        />
      );
    }

    return (
      <div className="by-date-view">
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Title level={3} style={{ color: '#fff' }}>
            📅 {dayjs(selectedDate).format('dddd, DD/MM/YYYY')}
          </Title>
          <Text style={{ color: 'var(--text-secondary)' }}>
            Tổng {totalShowtimes} suất chiếu
          </Text>
        </div>

        {Object.entries(periods).map(([periodKey, periodData]) => {
          if (periodData.showtimes.length === 0) return null;

          return (
            <div 
              key={periodKey}
              style={{
                marginBottom: '40px',
                padding: '24px',
                background: 'var(--surface-1)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <Title level={4} style={{ color: '#fff', marginBottom: '24px' }}>
                {periodData.label} - {periodData.showtimes.length} suất
              </Title>

              <div className="timeline">
                {periodData.showtimes.map((st, idx) => {
                  const movie = st.movie;
                  const branch = st.branch;
                  if (!movie || !branch) return null;

                  const chain = branch.cinemaChain || 'Other';
                  const chainInfo = cinemaChains.find(c => c.key === chain) || cinemaChains[cinemaChains.length - 1];
                  const status = getSeatStatus(st);

                  return (
                    <div
                      key={st._id}
                      className="timeline-item"
                      style={{
                        display: 'flex',
                        gap: '24px',
                        marginBottom: '24px',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        border: `1px solid rgba(255,255,255,0.05)`,
                        borderLeft: `4px solid ${chainInfo.color}`,
                        transition: 'all 0.3s var(--ease-smooth)',
                        cursor: status.disabled ? 'not-allowed' : 'pointer',
                        opacity: status.disabled ? 0.6 : 1
                      }}
                      onClick={() => handleShowtimeClick(st)}
                      onMouseEnter={(e) => {
                        if (!status.disabled) {
                          e.currentTarget.style.transform = 'translateX(8px)';
                          e.currentTarget.style.boxShadow = `0 8px 24px ${chainInfo.color}30`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ minWidth: '80px', textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '28px', 
                          fontWeight: 'bold', 
                          color: status.color,
                          marginBottom: '4px'
                        }}>
                          {formatTime(st.startTime)}
                        </div>
                        <Text style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {status.icon} {status.text}
                        </Text>
                      </div>

                      <img
                        data-src={getImageUrl(movie.poster || movie.posterUrl) || '/placeholder.jpg'}
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 90'%3E%3Crect fill='%231a1a1a' width='60' height='90'/%3E%3C/svg%3E"
                        alt={movie.title}
                        loading="lazy"
                        style={{
                          width: '60px',
                          height: '90px',
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <Title level={5} style={{ color: '#fff', marginBottom: '8px' }}>
                          {movie.title}
                        </Title>
                        <div style={{ marginBottom: '8px' }}>
                          <Text style={{ color: 'var(--text-secondary)', marginRight: '12px' }}>
                            {movie.genre?.join(', ')}
                          </Text>
                          <Text style={{ color: 'var(--text-secondary)' }}>
                            • {movie.duration || 120} phút
                          </Text>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <Tag color={chainInfo.color}>
                            {chainInfo.icon} {chainInfo.label}
                          </Tag>
                          <Tag>
                            <EnvironmentOutlined /> {branch.name}
                          </Tag>
                          <Tag>
                            {branch.location?.city}
                          </Tag>
                          <Tag>
                            💰 {(st.price?.standard || st.price || 50000).toLocaleString('vi-VN')} VNĐ
                          </Tag>
                        </div>
                      </div>

                      {!status.disabled && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Button
                            type="primary"
                            style={{ background: 'var(--gradient-primary)', border: 'none' }}
                          >
                            Đặt vé
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header />
      
      <Content style={{ padding: '40px 20px', marginTop: '64px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Page Title */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-fade-in-up">
            <Title level={1} style={{ 
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '16px',
              fontSize: '48px'
            }}>
              🎬 Lịch Chiếu Phim
            </Title>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              Chọn suất chiếu phù hợp với bạn
            </Text>
          </div>

          {/* Filter Bar */}
          <div 
            className="filter-bar"
            style={{
              padding: '24px',
              background: 'var(--surface-1)',
              borderRadius: '16px',
              marginBottom: '32px',
              border: '1px solid rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* View Mode Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '24px',
              borderBottom: '2px solid rgba(255,255,255,0.05)',
              paddingBottom: '16px'
            }}>
              <Button
                type={viewMode === 'by-movie' ? 'primary' : 'default'}
                icon={<PlayCircleOutlined />}
                onClick={() => setViewMode('by-movie')}
                style={{
                  background: viewMode === 'by-movie' ? 'var(--gradient-primary)' : 'transparent',
                  border: viewMode === 'by-movie' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
              >
                Theo Phim
              </Button>
              <Button
                type={viewMode === 'by-cinema' ? 'primary' : 'default'}
                icon={<EnvironmentOutlined />}
                onClick={() => setViewMode('by-cinema')}
                style={{
                  background: viewMode === 'by-cinema' ? 'var(--gradient-primary)' : 'transparent',
                  border: viewMode === 'by-cinema' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
              >
                Theo Rạp
              </Button>
              <Button
                type={viewMode === 'by-date' ? 'primary' : 'default'}
                icon={<CalendarOutlined />}
                onClick={() => setViewMode('by-date')}
                style={{
                  background: viewMode === 'by-date' ? 'var(--gradient-primary)' : 'transparent',
                  border: viewMode === 'by-date' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
              >
                Timeline
              </Button>
            </div>

            {/* Date Selector */}
            <div style={{ marginBottom: '20px' }}>
              <Text strong style={{ color: '#fff', marginBottom: '12px', display: 'block' }}>
                <CalendarOutlined /> Chọn ngày:
              </Text>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {next7Days.map(day => (
                  <Button
                    key={day.value}
                    type={selectedDate === day.value ? 'primary' : 'default'}
                    onClick={() => setSelectedDate(day.value)}
                    style={{
                      background: selectedDate === day.value ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                      border: selectedDate === day.value ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: day.isWeekend ? '#f59e0b' : '#fff',
                      minWidth: '100px',
                      height: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>{day.day}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{day.date}</div>
                    {day.isToday && (
                      <Tag color="green" style={{ fontSize: '10px', margin: 0, marginTop: '4px' }}>Hôm nay</Tag>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filters Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              {/* City Filter - NEW */}
              <Select
                value={selectedCity}
                onChange={setSelectedCity}
                style={{ width: '100%' }}
                placeholder="Chọn thành phố"
                suffixIcon={<EnvironmentOutlined />}
              >
                <Option value="all">
                  <span style={{ fontSize: '16px' }}>🌏</span> Tất cả thành phố
                </Option>
                {cities.slice(1).map(city => (
                  <Option key={city.key} value={city.key}>
                    <span style={{ fontSize: '16px' }}>{city.icon}</span> {city.label}
                  </Option>
                ))}
              </Select>

              <Select
                value={selectedCinemaChain}
                onChange={setSelectedCinemaChain}
                style={{ width: '100%' }}
                placeholder="Chọn cụm rạp"
              >
                <Option value="all">Tất cả cụm rạp</Option>
                {cinemaChains.map(chain => (
                  <Option key={chain.key} value={chain.key}>
                    {chain.icon} {chain.label}
                  </Option>
                ))}
              </Select>

              <Select
                value={selectedMovie}
                onChange={setSelectedMovie}
                style={{ width: '100%' }}
                placeholder="Chọn phim"
                showSearch
                optionFilterProp="children"
              >
                <Option value="all">Tất cả phim</Option>
                {movies.map(movie => (
                  <Option key={movie._id} value={movie._id}>
                    {movie.title}
                  </Option>
                ))}
              </Select>

              <Select
                value={selectedTimeRange}
                onChange={setSelectedTimeRange}
                style={{ width: '100%' }}
                placeholder="Khung giờ"
              >
                <Option value="all">Cả ngày</Option>
                <Option value="morning">☀️ Sáng (6h-12h)</Option>
                <Option value="afternoon">🌤️ Chiều (12h-18h)</Option>
                <Option value="evening">🌆 Tối (18h-22h)</Option>
                <Option value="night">🌙 Đêm (22h-6h)</Option>
              </Select>

              <Button
                icon={<CloseOutlined />}
                onClick={clearFilters}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>

            {/* Results count */}
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'var(--text-secondary)' }}>
                Tìm thấy <strong style={{ color: 'var(--primary-500)' }}>{showtimes.length}</strong> suất chiếu
                {selectedCity !== 'all' && (
                  <span> tại <strong style={{ color: '#10b981' }}>
                    {cities.find(c => c.key === selectedCity)?.label}
                  </strong></span>
                )}
                {selectedCinemaChain !== 'all' && (
                  <span> • <strong style={{ color: '#f59e0b' }}>
                    {cinemaChains.find(c => c.key === selectedCinemaChain)?.label}
                  </strong></span>
                )}
              </Text>
            </div>
          </div>

          {/* Content Area */}
          {initialLoading ? (
            <Suspense fallback={<LazyLoadFallback />}>
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <CinemaLoadingSpinner 
                  type="film-reel" 
                  message="Preparing your cinema experience..."
                  size="large"
                />
              </div>
            </Suspense>
          ) : loading ? (
            <Suspense fallback={<LazyLoadFallback />}>
              <div>
                <CinemaSkeleton 
                  type={viewMode === 'by-movie' ? 'movie-card' : viewMode === 'by-cinema' ? 'chain-header' : 'timeline'} 
                  count={viewMode === 'by-date' ? 8 : 3}
                />
              </div>
            </Suspense>
          ) : (
            <>
              {viewMode === 'by-movie' && renderByMovieView()}
              {viewMode === 'by-cinema' && renderByCinemaView()}
              {viewMode === 'by-date' && renderByDateView()}
            </>
          )}
        </div>
      </Content>

      <Footer />

      {/* Custom Styles */}
      <style jsx="true">{`
        /* Time Slot Animations */
        .time-slot {
          animation: slideInStagger 0.3s var(--ease-smooth) forwards;
          opacity: 0;
        }

        @keyframes slideInStagger {
          from {
            opacity: 0;
            transform: translateX(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .time-slot.pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .time-slot.blink {
          animation: blink 1s ease-in-out infinite;
        }

        /* Section Reveal */
        .section-reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.8s var(--ease-smooth);
        }

        .section-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Timeline Item Animation */
        .timeline-item {
          animation: slideInRight 0.4s var(--ease-smooth) forwards;
          animation-delay: calc(var(--index, 0) * 80ms);
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default ShowtimesPageModern;

