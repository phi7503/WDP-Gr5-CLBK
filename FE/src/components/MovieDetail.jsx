import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Space, Avatar, DatePicker, message, Badge, Tag, Select, Input, Collapse } from 'antd';
import { PlayCircleOutlined, HeartOutlined, StarOutlined, CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, FireFilled, GlobalOutlined, TagOutlined, TrophyOutlined, CheckCircleOutlined, FilterOutlined, SearchOutlined, DownOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MovieCard from './MovieCard';
import TrailerModal from './TrailerModal';
import { movieAPI, showtimeAPI, getImageUrl } from '../services/api';
import '../cinema-brand.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { Search } = Input;

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default: hôm nay
  const [showtimes, setShowtimes] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]); // Store tất cả showtimes
  const [availableDates, setAvailableDates] = useState([]); // Các ngày có suất chiếu
  const [loading, setLoading] = useState(true);
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);
  // Filter states
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCinemaChain, setSelectedCinemaChain] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCities, setExpandedCities] = useState([]);

  useEffect(() => {
    if (id) {
      loadMovieDetails();
    }
  }, [id]);

  // Filter showtimes when date or filters change
  useEffect(() => {
    if (allShowtimes.length > 0 && selectedDate) {
      filterShowtimesByDate(allShowtimes, selectedDate);
    }
  }, [selectedDate, selectedCity, selectedCinemaChain, searchTerm, allShowtimes.length]);

  // Auto-expand first city when showtimes change
  useEffect(() => {
    if (showtimes.length > 0 && expandedCities.length === 0) {
      const citiesSet = new Set();
      showtimes.forEach(st => {
        const city = st.branch?.location?.city || st.branch?.location?.province || 'Khác';
        if (city) citiesSet.add(city);
      });
      const cities = Array.from(citiesSet).sort();
      if (cities.length > 0) {
        setExpandedCities([cities[0]]);
      }
    }
  }, [showtimes.length]);

  // Reload showtimes when page becomes visible (user returns from booking page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && id) {
        // Reload showtimes when page becomes visible
        reloadShowtimes();
      }
    };

    const handleFocus = () => {
      // Reload showtimes when window gains focus
      if (id) {
        reloadShowtimes();
      }
    };

    // Check if need to reload after booking - check every 2 seconds
    const intervalId = setInterval(() => {
      const shouldReload = localStorage.getItem('shouldReloadShowtimes');
      if (shouldReload === 'true' && id) {
        localStorage.removeItem('shouldReloadShowtimes');
        reloadShowtimes();
      }
    }, 2000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [id, selectedDate]);

  // Helper function to reload showtimes
  const reloadShowtimes = async () => {
    try {
      const sts = await showtimeAPI.getShowtimes({ movie: id, limit: 1000 });
      const showtimesList = Array.isArray(sts) ? sts : (sts?.showtimes || []);
      
      setAllShowtimes(showtimesList);
      
      // Extract available dates
      const dates = [...new Set(showtimesList.map(st => {
        const date = new Date(st.startTime);
        return date.toISOString().split('T')[0];
      }))].sort();
      
      setAvailableDates(dates);
      
      // Filter showtimes by selected date
      if (selectedDate) {
        filterShowtimesByDate(showtimesList, selectedDate);
      }
    } catch (error) {
      console.error('Error reloading showtimes:', error);
    }
  };

  // Helper function to filter showtimes by date and filters
  const filterShowtimesByDate = (showtimesList, date) => {
    const now = new Date();
    let filtered = showtimesList.filter(st => {
      const showtimeDate = new Date(st.startTime).toISOString().split('T')[0];
      const startTime = new Date(st.startTime);
      // ✅ Lọc theo ngày VÀ chỉ giữ lại các suất chiếu chưa bắt đầu
      return showtimeDate === date && startTime > now;
    });

    // Filter by city
    if (selectedCity !== 'all') {
      filtered = filtered.filter(st => {
        const branchCity = st.branch?.location?.city || st.branch?.location?.province || '';
        const normalizeText = (text) => {
          return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[.\s]+/g, '');
        };
        return normalizeText(branchCity).includes(normalizeText(selectedCity));
      });
    }

    // Filter by cinema chain
    if (selectedCinemaChain !== 'all') {
      filtered = filtered.filter(st => {
        const branchChain = st.branch?.cinemaChain || 'Other';
        return branchChain === selectedCinemaChain;
      });
    }

    // Filter by search term (branch name)
    if (searchTerm.trim()) {
      filtered = filtered.filter(st => {
        const branchName = st.branch?.name || '';
        return branchName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    console.log(`Filtered showtimes for ${date}:`, filtered.length);
    setShowtimes(filtered);
  };

  // Get unique cities from showtimes
  const getAvailableCities = () => {
    const citiesSet = new Set();
    showtimes.forEach(st => {
      const city = st.branch?.location?.city || st.branch?.location?.province;
      if (city) {
        citiesSet.add(city);
      }
    });
    return Array.from(citiesSet).sort();
  };

  // Get unique cinema chains from showtimes
  const getAvailableCinemaChains = () => {
    const chainsSet = new Set();
    showtimes.forEach(st => {
      const chain = st.branch?.cinemaChain || 'Other';
      chainsSet.add(chain);
    });
    return Array.from(chainsSet).sort();
  };

  // Function to get actor image from TMDB API
  const getActorImage = async (actorName) => {
    try {
      // Sử dụng TMDB API để tìm diễn viên (sử dụng API key từ backend scripts)
      const TMDB_API_KEY = '1f54bd990f1cdfb230adb312546d765d';
      const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(actorName)}&language=en-US`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const actor = data.results[0];
        if (actor.profile_path) {
          return `https://image.tmdb.org/t/p/w500${actor.profile_path}`;
        }
      }
    } catch (error) {
      console.error(`Error fetching image for ${actorName}:`, error);
    }
    
    return null; // Return null nếu không tìm thấy
  };

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading movie details for ID:', id);
      
      // Load movie details
      const movieResponse = await movieAPI.getMovieById(id);
      console.log('Movie response:', movieResponse);
      
      if (movieResponse) {
        setMovie(movieResponse);
        
        // Create cast data from movie cast array
        if (movieResponse.cast && movieResponse.cast.length > 0) {
          // Load actor images in parallel
          const castPromises = movieResponse.cast.map(async (actor, index) => {
            // Nếu cast là string, tách tên và nhân vật (format: "Tên diễn viên - Tên nhân vật")
            let name = actor;
            let character = `Nhân vật ${index + 1}`;
            
            if (typeof actor === 'string' && actor.includes(' - ')) {
              const parts = actor.split(' - ');
              name = parts[0];
              character = parts[1] || character;
            }
            
            // Tạo avatar gradient đẹp hơn với màu sắc khác nhau cho mỗi diễn viên
            const colors = [
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
              'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
            ];
            const colorIndex = index % colors.length;
            
            // Lấy ảnh thật từ TMDB
            const actorImage = await getActorImage(name);
            
            return {
              name: name,
              character: character,
              avatar: actorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ef4444&color=fff&size=200&bold=true&font-size=0.5`,
              gradient: colors[colorIndex],
              hasRealImage: !!actorImage
            };
          });
          
          const castData = await Promise.all(castPromises);
          setCast(castData);
        }
      }
      
      // Load recommended movies
      try {
        const recommendedResponse = await movieAPI.getRecommendedMovies();
        console.log('Recommended response:', recommendedResponse);
        if (recommendedResponse) {
          setRecommendedMovies(recommendedResponse.slice(0, 4));
        }
      } catch (recError) {
        console.error('Error loading recommended movies:', recError);
        // Don't fail the whole component for recommended movies
      }

      // Load showtimes for this movie
      try {
        // ✅ FIX: Pass movie ID to API for server-side filtering
        const sts = await showtimeAPI.getShowtimes({ movie: id, limit: 1000 });
        console.log('Showtimes response for movie:', sts);
        
        const showtimesList = Array.isArray(sts) ? sts : (sts?.showtimes || []);
        console.log('Showtimes count:', showtimesList.length);
        
        // Store all showtimes
        setAllShowtimes(showtimesList);
        
        // Extract available dates
        const dates = [...new Set(showtimesList.map(st => {
          const date = new Date(st.startTime);
          return date.toISOString().split('T')[0];
        }))].sort();
        
        setAvailableDates(dates);
        console.log('Available dates:', dates);
        
        // Auto-select date: hôm nay nếu có, không thì ngày gần nhất
        const today = new Date().toISOString().split('T')[0];
        const hasToday = dates.includes(today);
        const autoSelectedDate = hasToday ? today : (dates[0] || today);
        
        setSelectedDate(autoSelectedDate);
        console.log('Auto-selected date:', autoSelectedDate);
        
        // Filter showtimes by selected date
        filterShowtimesByDate(showtimesList, autoSelectedDate);
      } catch (showtimeError) {
        console.error('Error loading showtimes:', showtimeError);
        setShowtimes([]);
        setAllShowtimes([]);
        // Don't fail the whole component for showtimes
      }
    } catch (error) {
      console.error('Error loading movie details:', error);
      message.error('Không thể tải thông tin phim. Vui lòng kiểm tra kết nối backend.');
      
      // Set fallback movie data to prevent blank screen
      setMovie({
        _id: id,
        title: 'Không tìm thấy phim',
        description: 'Không thể tải thông tin phim. Vui lòng kiểm tra kết nối.',
        poster: 'https://via.placeholder.com/400x600/333/fff?text=No+Image',
        duration: 'N/A',
        genre: ['Unknown'],
        rating: 0,
        hotness: 0,
        status: 'unknown',
        language: 'Unknown',
        cast: []
      });
    } finally {
      setLoading(false);
    }
  };

  const dates = [
    { label: "Tue 15", value: "2025-01-15" },
    { label: "Wed 16", value: "2025-01-16" },
    { label: "Thu 17", value: "2025-01-17" },
    { label: "Fri 18", value: "2025-01-18" },
    { label: "Sat 19", value: "2025-01-19" },
    { label: "Sun 20", value: "2025-01-20" }
  ];

  // Show loading state
  if (loading) {
    return (
      <Layout style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: '18px' }}>
            Đang tải thông tin phim...
          </div>
        </Content>
        <Footer />
      </Layout>
    );
  }

  // Show error state if no movie data
  if (!movie) {
    return (
      <Layout style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: '18px' }}>
            Không tìm thấy phim hoặc lỗi khi tải dữ liệu
          </div>
          <Link to="/movies" style={{ color: '#ff4d4f', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>
            ← Quay lại danh sách phim
          </Link>
        </Content>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '0 24px' }}>
        {/* Hero Section with Backdrop */}
        {movie?.backdropImage && (
          <div style={{
            position: 'relative',
            width: '100%',
            height: '500px',
            marginBottom: '80px',
            overflow: 'hidden'
          }}>
            <img
              src={getImageUrl(movie.backdropImage)}
              alt={movie.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.3)'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(10,10,10,0.7) 50%, rgba(10,10,10,0.95) 100%)'
            }} />
          </div>
        )}

        {/* Movie Detail Section */}
        <div style={{ padding: movie?.backdropImage ? '0 24px 80px' : '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[48, 48]} align="top">
            {/* Movie Poster */}
            <Col xs={24} lg={8}>
              <Card
                style={{ 
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
                cover={
                  <img
                    alt={movie?.title || 'Poster phim'}
                    src={movie?.poster ? getImageUrl(movie.poster) : 'https://via.placeholder.com/400x600/333/fff?text=Poster+Phim'}
                    style={{
                      width: '100%',
                      height: '600px',
                      objectFit: 'cover'
                    }}
                  />
                }
              />
            </Col>

            {/* Movie Info */}
            <Col xs={24} lg={16}>
              <div style={{ color: '#fff' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Space size="middle">
                    <Tag color="red" style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}>
                      {movie?.language === 'English' ? 'Tiếng Anh' : movie?.language === 'Vietnamese' ? 'Tiếng Việt' : movie?.language || 'Chưa xác định'}
                    </Tag>
                    {movie?.status === 'now-showing' && (
                      <Tag color="green" style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}>
                        Đang chiếu
                      </Tag>
                    )}
                    {movie?.status === 'coming-soon' && (
                      <Tag color="orange" style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}>
                        Sắp chiếu
                      </Tag>
                    )}
                  </Space>
                </div>
                
                <Title level={1} style={{ 
                  color: '#fff', 
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  fontWeight: 'bold',
                  margin: '16px 0 24px 0',
                  lineHeight: '1.2'
                }}>
                  {movie?.title || 'Tên phim'}
                </Title>
                
                <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StarOutlined style={{ color: '#ffd700', fontSize: '20px' }} />
                    <Text style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                      {movie?.rating || 0}/10
                    </Text>
                    <Text style={{ color: '#999', fontSize: '14px', marginLeft: '4px' }}>
                      IMDb
                    </Text>
                  </div>
                  <Text style={{ color: '#999', fontSize: '16px' }}>
                    <ClockCircleOutlined style={{ marginRight: '6px' }} />
                    {movie?.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : 'Chưa xác định'}
                  </Text>
                  <Text style={{ color: '#999', fontSize: '16px' }}>
                    <CalendarOutlined style={{ marginRight: '6px' }} />
                    {movie?.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    }) : 'Chưa xác định'}
                  </Text>
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <Space size="small" wrap>
                    {(movie?.genre || []).map((g, idx) => (
                      <Tag key={idx} color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}>
                        {g}
                      </Tag>
                    ))}
                  </Space>
                </div>
                
                {movie?.director && (
                  <div style={{ marginBottom: '24px' }}>
                    <Text style={{ color: '#999', fontSize: '14px', marginRight: '8px' }}>
                      Đạo diễn:
                    </Text>
                    <Text style={{ color: '#fff', fontSize: '16px', fontWeight: '500' }}>
                      {movie.director}
                    </Text>
                  </div>
                )}
                
                <div style={{ marginBottom: '32px' }}>
                  <Title level={3} style={{ color: '#fff', fontSize: '20px', marginBottom: '16px' }}>
                    Nội dung phim
                  </Title>
                  <Paragraph style={{ 
                    color: '#d1d5db', 
                    fontSize: '17px',
                    lineHeight: '1.8',
                    margin: 0
                  }}>
                    {movie?.description || 'Chưa có mô tả cho bộ phim này.'}
                  </Paragraph>
                </div>
                
                <Space size="large" style={{ marginBottom: '48px' }}>
                  {movie?.trailer && (
                  <Button 
                    size="large"
                    icon={<PlayCircleOutlined />}
                      onClick={() => setTrailerModalVisible(true)}
                    style={{ 
                      background: '#333', 
                      border: '1px solid #666',
                      color: '#fff',
                      height: '48px',
                      padding: '0 24px'
                    }}
                  >
                      Xem Trailer
                  </Button>
                  )}
                  
                  <Button 
                    type="primary" 
                    size="large"
                    className="primary-button"
                    style={{ height: '48px', padding: '0 24px' }}
                    onClick={() => navigate(`/showtimes?movie=${id}`)}
                  >
                    Đặt Vé
                  </Button>
                  
                  <Button 
                    size="large"
                    icon={<HeartOutlined />}
                    style={{ 
                      background: '#333', 
                      border: '1px solid #666',
                      color: '#fff',
                      height: '48px',
                      width: '48px'
                    }}
                  />
                </Space>
              </div>
            </Col>
          </Row>
        </div>

        {/* Movie Information Section */}
        <div style={{ padding: '80px 0', background: '#0a0a0a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ 
              color: '#fff', 
              marginBottom: '64px', 
              fontSize: '40px', 
              textAlign: 'center',
              fontWeight: '700',
              letterSpacing: '1px'
            }}>
              Thông tin phim
            </Title>
            
            <Row gutter={[24, 24]}>
              {/* Ngày khởi chiếu */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card 
                  hoverable
                  style={{ 
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 77, 79, 0.2)';
                    e.currentTarget.style.borderColor = '#ff4d4f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <CalendarOutlined style={{ 
                      color: '#ff4d4f', 
                      fontSize: '32px', 
                      marginBottom: '16px',
                      display: 'block'
                    }} />
                    <Text style={{ 
                      color: '#999', 
                      fontSize: '13px', 
                      display: 'block', 
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      Ngày khởi chiếu
                    </Text>
                    <Text style={{ 
                      color: '#fff', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      lineHeight: '1.5'
                    }}>
                      {movie?.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      }) : 'Chưa xác định'}
                    </Text>
                  </div>
                </Card>
              </Col>

              {/* Ngày kết thúc */}
              {movie?.endDate && (
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card 
                    hoverable
                    style={{ 
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                      border: '1px solid #333',
                      borderRadius: '16px',
                      height: '100%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'default'
                    }}
                    bodyStyle={{ padding: '24px' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 77, 79, 0.2)';
                      e.currentTarget.style.borderColor = '#ff4d4f';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#333';
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <CalendarOutlined style={{ 
                        color: '#ff4d4f', 
                        fontSize: '32px', 
                        marginBottom: '16px',
                        display: 'block'
                      }} />
                      <Text style={{ 
                        color: '#999', 
                        fontSize: '13px', 
                        display: 'block', 
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: '500'
                      }}>
                        Ngày kết thúc
                      </Text>
                      <Text style={{ 
                        color: '#fff', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        lineHeight: '1.5'
                      }}>
                        {new Date(movie.endDate).toLocaleDateString('vi-VN', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </div>
                  </Card>
                </Col>
              )}

              {/* Trạng thái */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card 
                  hoverable
                  style={{ 
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 77, 79, 0.2)';
                    e.currentTarget.style.borderColor = '#ff4d4f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ 
                      color: movie?.status === 'now-showing' ? '#52c41a' : movie?.status === 'coming-soon' ? '#faad14' : '#999', 
                      fontSize: '32px', 
                      marginBottom: '16px',
                      display: 'block'
                    }} />
                    <Text style={{ 
                      color: '#999', 
                      fontSize: '13px', 
                      display: 'block', 
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      Trạng thái
                    </Text>
                    <Tag 
                      color={movie?.status === 'now-showing' ? 'success' : movie?.status === 'coming-soon' ? 'warning' : 'default'}
                      style={{ 
                        fontSize: '14px', 
                        padding: '6px 16px', 
                        borderRadius: '20px',
                        fontWeight: '600',
                        border: 'none'
                      }}
                    >
                      {movie?.status === 'now-showing' ? 'Đang chiếu' : movie?.status === 'coming-soon' ? 'Sắp chiếu' : 'Đã kết thúc'}
                    </Tag>
                  </div>
                </Card>
              </Col>

              {/* Độ hot */}
              {movie?.hotness && movie.hotness > 0 && (
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card 
                    hoverable
                    style={{ 
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                      border: '1px solid #333',
                      borderRadius: '16px',
                      height: '100%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'default'
                    }}
                    bodyStyle={{ padding: '24px' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 77, 79, 0.3)';
                      e.currentTarget.style.borderColor = '#ff4d4f';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#333';
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <FireFilled style={{ 
                        color: '#ff4d4f', 
                        fontSize: '32px', 
                        marginBottom: '16px',
                        display: 'block'
                      }} />
                      <Text style={{ 
                        color: '#999', 
                        fontSize: '13px', 
                        display: 'block', 
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: '500'
                      }}>
                        Độ hot
                      </Text>
                      <Text style={{ 
                        color: '#ff4d4f', 
                        fontSize: '24px', 
                        fontWeight: '700',
                        lineHeight: '1.5'
                      }}>
                        {movie.hotness}
                      </Text>
                    </div>
                  </Card>
                </Col>
              )}

              {/* Ngôn ngữ */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card 
                  hoverable
                  style={{ 
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 77, 79, 0.2)';
                    e.currentTarget.style.borderColor = '#ff4d4f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <GlobalOutlined style={{ 
                      color: '#ff4d4f', 
                      fontSize: '32px', 
                      marginBottom: '16px',
                      display: 'block'
                    }} />
                    <Text style={{ 
                      color: '#999', 
                      fontSize: '13px', 
                      display: 'block', 
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      Ngôn ngữ
                    </Text>
                    <Text style={{ 
                      color: '#fff', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      lineHeight: '1.5'
                    }}>
                      {movie?.language === 'English' ? 'Tiếng Anh' : movie?.language === 'Vietnamese' ? 'Tiếng Việt' : movie?.language || 'Chưa xác định'}
                    </Text>
                  </div>
                </Card>
              </Col>

              {/* Thể loại */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card 
                  hoverable
                  style={{ 
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 77, 79, 0.2)';
                    e.currentTarget.style.borderColor = '#ff4d4f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <TagOutlined style={{ 
                      color: '#ff4d4f', 
                      fontSize: '32px', 
                      marginBottom: '16px',
                      display: 'block'
                    }} />
                    <Text style={{ 
                      color: '#999', 
                      fontSize: '13px', 
                      display: 'block', 
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      Thể loại
                    </Text>
                    <Space size="small" wrap style={{ justifyContent: 'center' }}>
                      {(movie?.genre || []).slice(0, 3).map((g, idx) => (
                        <Tag key={idx} color="blue" style={{ 
                          fontSize: '12px', 
                          padding: '4px 10px', 
                          borderRadius: '12px',
                          margin: '2px',
                          border: 'none'
                        }}>
                          {g}
                        </Tag>
                      ))}
                      {(movie?.genre || []).length > 3 && (
                        <Tag color="default" style={{ 
                          fontSize: '12px', 
                          padding: '4px 10px', 
                          borderRadius: '12px',
                          margin: '2px',
                          border: 'none'
                        }}>
                          +{(movie?.genre || []).length - 3}
                        </Tag>
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>

              {/* Thời lượng */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card 
                  hoverable
                  style={{ 
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 77, 79, 0.2)';
                    e.currentTarget.style.borderColor = '#ff4d4f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <ClockCircleOutlined style={{ 
                      color: '#ff4d4f', 
                      fontSize: '32px', 
                      marginBottom: '16px',
                      display: 'block'
                    }} />
                    <Text style={{ 
                      color: '#999', 
                      fontSize: '13px', 
                      display: 'block', 
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      Thời lượng
                    </Text>
                    <Text style={{ 
                      color: '#fff', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      lineHeight: '1.5'
                    }}>
                      {movie?.duration ? `${Math.floor(movie.duration / 60)} giờ ${movie.duration % 60} phút` : 'Chưa xác định'}
                    </Text>
                  </div>
                </Card>
              </Col>

              {/* Đánh giá IMDb */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card 
                  hoverable
                  style={{ 
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.3)';
                    e.currentTarget.style.borderColor = '#ffd700';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <TrophyOutlined style={{ 
                      color: '#ffd700', 
                      fontSize: '32px', 
                      marginBottom: '16px',
                      display: 'block'
                    }} />
                    <Text style={{ 
                      color: '#999', 
                      fontSize: '13px', 
                      display: 'block', 
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      Đánh giá IMDb
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <StarOutlined style={{ color: '#ffd700', fontSize: '20px' }} />
                      <Text style={{ 
                        color: '#ffd700', 
                        fontSize: '24px', 
                        fontWeight: '700',
                        lineHeight: '1.5'
                      }}>
                        {movie?.rating || 0}/10
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Cast Section */}
        {cast.length > 0 && (
          <div style={{ padding: '80px 0', background: 'var(--bg-card)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
              <Title level={2} style={{ color: '#fff', marginBottom: '48px', fontSize: '32px', textAlign: 'center' }}>
                Diễn viên chính
              </Title>
            
            <Row gutter={[24, 32]} justify="center">
              {cast.map((actor, index) => (
                <Col xs={12} sm={8} md={6} lg={4} key={index}>
                  <Card
                    hoverable
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      height: '100%'
                    }}
                    bodyStyle={{ padding: '20px' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(239, 68, 68, 0.3)';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#333';
                    }}
                  >
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      margin: '0 auto 16px',
                      background: actor.hasRealImage ? 'transparent' : actor.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: actor.hasRealImage ? 0 : '48px',
                      fontWeight: 'bold',
                      color: '#fff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                      border: actor.hasRealImage ? '3px solid #ef4444' : 'none'
                    }}>
                      {actor.hasRealImage ? (
                        <img
                          src={actor.avatar}
                          alt={actor.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                          onError={(e) => {
                            // Fallback nếu ảnh lỗi
                            e.target.style.display = 'none';
                            e.target.parentElement.style.background = actor.gradient;
                            e.target.parentElement.style.fontSize = '48px';
                            e.target.parentElement.innerHTML = `<span>${actor.name.charAt(0).toUpperCase()}</span>`;
                          }}
                        />
                      ) : (
                        <span style={{ zIndex: 1 }}>
                          {actor.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <Text style={{ 
                        color: '#fff', 
                        display: 'block', 
                        fontWeight: '600', 
                        fontSize: '16px', 
                        marginBottom: '6px',
                        lineHeight: '1.4'
                      }}>
                        {actor.name}
                      </Text>
                      <Text style={{ 
                        color: '#999', 
                        fontSize: '13px',
                        lineHeight: '1.4'
                      }}>
                        {actor.character}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>
        )}

        {/* Showtimes Section - NEW */}
        <div style={{ padding: '80px 0', background: '#0a0a0a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} className="cinema-title" style={{ marginBottom: '32px', textAlign: 'center', fontSize: '32px' }}>
              Lịch Chiếu & Đặt Vé
            </Title>

            {/* Date Selector */}
            {availableDates.length > 0 && (
              <div style={{ 
                marginBottom: '32px',
                padding: '20px',
                background: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #333'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block', marginBottom: '12px' }}>
                    <CalendarOutlined /> Chọn ngày:
                  </Text>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {availableDates.map((date, index) => {
                      const dateObj = new Date(date + 'T00:00:00');
                      const today = new Date().toISOString().split('T')[0];
                      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                      
                      let dayLabel = dateObj.toLocaleDateString('vi-VN', { 
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit'
                      });
                      
                      if (date === today) dayLabel = 'Hôm nay';
                      else if (date === tomorrow) dayLabel = 'Ngày mai';
                      
                      const isSelected = date === selectedDate;
                      const showtimeCount = allShowtimes.filter(st => {
                        return new Date(st.startTime).toISOString().split('T')[0] === date;
                      }).length;

                      return (
                        <Button
                          key={index}
                          size="large"
                          onClick={() => setSelectedDate(date)}
                          style={{
                            background: isSelected 
                              ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7a45 100%)' 
                              : '#333',
                            border: isSelected ? 'none' : '1px solid #666',
                            color: '#fff',
                            height: 'auto',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            minWidth: '100px'
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            {dayLabel}
                          </span>
                          <span style={{ fontSize: '12px', opacity: 0.8 }}>
                            {showtimeCount} suất
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Bar */}
                {showtimes.length > 0 && (
                  <div style={{ 
                    paddingTop: '20px', 
                    borderTop: '1px solid #333',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <Text strong style={{ color: '#fff', fontSize: '14px' }}>
                      <FilterOutlined /> Lọc:
                    </Text>
                    <Search
                      placeholder="Tìm kiếm rạp..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: 200, flex: '0 0 auto' }}
                      allowClear
                      prefix={<SearchOutlined style={{ color: '#666' }} />}
                    />
                    <Select
                      value={selectedCity}
                      onChange={setSelectedCity}
                      placeholder="Chọn thành phố"
                      style={{ width: 180, flex: '0 0 auto' }}
                      allowClear
                    >
                      <Option value="all">Tất cả thành phố</Option>
                      {getAvailableCities().map(city => (
                        <Option key={city} value={city}>
                          <EnvironmentOutlined /> {city}
                        </Option>
                      ))}
                    </Select>
                    <Select
                      value={selectedCinemaChain}
                      onChange={setSelectedCinemaChain}
                      placeholder="Chọn cụm rạp"
                      style={{ width: 180, flex: '0 0 auto' }}
                      allowClear
                    >
                      <Option value="all">Tất cả cụm rạp</Option>
                      {getAvailableCinemaChains().map(chain => (
                        <Option key={chain} value={chain}>
                          {chain}
                        </Option>
                      ))}
                    </Select>
                    {(selectedCity !== 'all' || selectedCinemaChain !== 'all' || searchTerm) && (
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedCity('all');
                          setSelectedCinemaChain('all');
                          setSearchTerm('');
                        }}
                        style={{
                          background: '#333',
                          border: '1px solid #666',
                          color: '#fff'
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#fff' }}>
                Đang tải suất chiếu...
              </div>
            ) : showtimes.length === 0 ? (
              <Card style={{ background: '#1a1a1a', border: '1px solid #333', textAlign: 'center', padding: '40px' }}>
                <Text style={{ color: '#999', fontSize: '16px' }}>
                  Hiện tại chưa có suất chiếu nào cho phim này
                </Text>
              </Card>
            ) : (
              <div>
                {/* Group showtimes by city, then by branch */}
                {(() => {
                  // Group by city first
                  const groupedByCity = {};
                  showtimes.forEach(st => {
                    const city = st.branch?.location?.city || st.branch?.location?.province || 'Khác';
                    if (!groupedByCity[city]) {
                      groupedByCity[city] = {};
                    }
                    
                    const branchId = st.branch?._id || 'unknown';
                    if (!groupedByCity[city][branchId]) {
                      groupedByCity[city][branchId] = {
                        branch: st.branch,
                        showtimes: []
                      };
                    }
                    groupedByCity[city][branchId].showtimes.push(st);
                  });

                  // Sort cities
                  const cities = Object.keys(groupedByCity).sort();

                  return (
                    <Collapse
                      ghost
                      activeKey={expandedCities}
                      onChange={setExpandedCities}
                      expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} style={{ color: '#ff4d4f' }} />}
                      style={{ background: 'transparent' }}
                    >
                      {cities.map((city) => {
                        const branches = Object.values(groupedByCity[city]);
                        const totalShowtimes = branches.reduce((sum, b) => sum + b.showtimes.length, 0);

                        return (
                          <Panel
                            key={city}
                            header={
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <EnvironmentOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                                  <Text strong style={{ color: '#fff', fontSize: '18px' }}>
                                    {city}
                                  </Text>
                                  <Badge 
                                    count={branches.length} 
                                    style={{ backgroundColor: '#ff4d4f' }}
                                    title="Số rạp"
                                  />
                                </div>
                                <Text style={{ color: '#999', fontSize: '14px' }}>
                                  {totalShowtimes} suất chiếu
                                </Text>
                              </div>
                            }
                            style={{
                              background: '#1a1a1a',
                              border: '1px solid #333',
                              marginBottom: '16px',
                              borderRadius: '12px',
                              overflow: 'hidden'
                            }}
                          >
                            {branches.map((data, idx) => (
                              <Card
                                key={idx}
                                style={{
                                  background: '#0a0a0a',
                                  border: '1px solid #333',
                                  marginBottom: '16px',
                                  borderRadius: '12px'
                                }}
                                bodyStyle={{ padding: '16px' }}
                              >
                                {/* Branch Header */}
                                <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #333' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block' }}>
                                        {data.branch?.name || 'Rạp chiếu'}
                                      </Text>
                                      <Text style={{ color: '#999', fontSize: '13px' }}>
                                        {data.branch?.cinemaChain || 'N/A'} • {data.branch?.location?.address || ''}
                                      </Text>
                                    </div>
                                    <Tag color="blue" style={{ margin: 0 }}>
                                      {data.showtimes.length} suất
                                    </Tag>
                                  </div>
                                </div>

                                {/* Time Slots */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                  {data.showtimes
                                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                                    .map((st, stIdx) => {
                                      const startTime = new Date(st.startTime);
                                      const timeStr = startTime.toLocaleTimeString('vi-VN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      });

                                      return (
                                        <Button
                                          key={stIdx}
                                          size="large"
                                          onClick={() => navigate(`/booking/${st._id}`)}
                                          style={{
                                            background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7a45 100%)',
                                            border: 'none',
                                            color: '#fff',
                                            minWidth: '110px',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            transition: 'all 0.3s ease',
                                            height: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 77, 79, 0.4)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                          }}
                                        >
                                          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                            {timeStr}
                                          </span>
                                          <span style={{ fontSize: '11px', opacity: 0.9 }}>
                                            {(st.totalSeats - (st.bookedSeats || 0))} ghế
                                          </span>
                                          {(st.isFirstShow || st.isLastShow) && (
                                            <Tag 
                                              color={st.isFirstShow ? 'blue' : 'purple'} 
                                              style={{ margin: 0, fontSize: '9px', padding: '0 4px' }}
                                            >
                                              {st.isFirstShow ? 'Đầu' : 'Cuối'}
                                            </Tag>
                                          )}
                                        </Button>
                                      );
                                    })}
                                </div>
                              </Card>
                            ))}
                          </Panel>
                        );
                      })}
                    </Collapse>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Movies */}
        <div style={{ padding: '80px 0', background: 'var(--bg-card)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '48px'
            }}>
              <Title level={2} style={{ color: '#fff', margin: 0, fontSize: '32px' }}>
                Phim bạn có thể thích
              </Title>
              <Link to="/movies" style={{ color: '#ff4d4f', textDecoration: 'none', fontSize: '16px', fontWeight: '500' }}>
                Xem tất cả →
              </Link>
            </div>
            
            <Row gutter={[24, 24]}>
              {recommendedMovies.map(movie => (
                <Col xs={12} sm={8} md={6} key={movie._id}>
                  <MovieCard movie={movie} />
                </Col>
              ))}
            </Row>
            
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Link to="/movies">
              <Button 
                type="primary" 
                size="large"
                className="primary-button"
              >
                  Xem thêm phim
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </Content>
      
      <Footer />
      
      {/* Trailer Modal */}
      <TrailerModal
        visible={trailerModalVisible}
        trailerUrl={movie?.trailer}
        onClose={() => setTrailerModalVisible(false)}
      />
    </Layout>
  );
};

export default MovieDetail;
