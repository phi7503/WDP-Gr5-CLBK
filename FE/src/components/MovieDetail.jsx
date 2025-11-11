import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Space, Avatar, DatePicker, message, Badge, Tag } from 'antd';
import { PlayCircleOutlined, HeartOutlined, StarOutlined, CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MovieCard from './MovieCard';
import { movieAPI, showtimeAPI, getImageUrl, BACKEND_URL } from '../services/api';
import '../cinema-brand.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

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

  useEffect(() => {
    if (id) {
      loadMovieDetails();
    }
  }, [id]);

  // Filter showtimes when date changes
  useEffect(() => {
    if (allShowtimes.length > 0 && selectedDate) {
      filterShowtimesByDate(allShowtimes, selectedDate);
    }
  }, [selectedDate]);

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

  // Helper function to filter showtimes by date
  const filterShowtimesByDate = (showtimesList, date) => {
    const filtered = showtimesList.filter(st => {
      const showtimeDate = new Date(st.startTime).toISOString().split('T')[0];
      return showtimeDate === date;
    });
    console.log(`Filtered showtimes for ${date}:`, filtered.length);
    setShowtimes(filtered);
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
          const castData = movieResponse.cast.map((actor, index) => ({
            name: actor,
            character: `Character ${index + 1}`,
            avatar: `https://via.placeholder.com/80x80/333/fff?text=${actor.charAt(0)}`
          }));
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
      message.error('Failed to load movie details. Please check your backend connection.');
      
      // Set fallback movie data to prevent blank screen
      setMovie({
        _id: id,
        title: 'Movie Not Found',
        description: 'Unable to load movie details. Please check your connection.',
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
            Loading movie details...
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
            Movie not found or failed to load
          </div>
          <Link to="/movies" style={{ color: '#ff4d4f', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>
            ← Back to Movies
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
        {/* Movie Detail Section */}
        <div style={{ padding: '80px 0', maxWidth: '1200px', margin: '0 auto' }}>
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
                    alt={movie?.title || 'Movie Poster'}
                    src={movie?.poster ? `${BACKEND_URL}/${movie.poster}` : 'https://via.placeholder.com/400x600/333/fff?text=Movie+Poster'}
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
                <Text style={{ 
                  color: '#ff4d4f', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}>
                  {movie?.language || 'Unknown'}
                </Text>
                
                <Title level={1} style={{ 
                  color: '#fff', 
                  fontSize: '48px',
                  fontWeight: 'bold',
                  margin: '16px 0'
                }}>
                  {movie?.title || 'Movie Title'}
                </Title>
                
                <div style={{ marginBottom: '24px' }}>
                  <Space size="large">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StarOutlined style={{ color: '#ffd700' }} />
                      <Text style={{ color: '#fff', fontSize: '16px' }}>
                        {movie?.rating || 0} IMDb Rating
                      </Text>
                    </div>
                  </Space>
                </div>
                
                <Paragraph style={{ 
                  color: '#fff', 
                  fontSize: '16px',
                  lineHeight: '1.6',
                  marginBottom: '24px'
                }}>
                  {movie?.description || 'No description available'}
                </Paragraph>
                
                <div style={{ marginBottom: '32px' }}>
                  <Space size="large">
                    <Text style={{ color: '#fff' }}>
                      <ClockCircleOutlined style={{ marginRight: '4px' }} />
                      {movie?.duration || 'N/A'}
                    </Text>
                    <Text style={{ color: '#fff' }}>
                      {(movie?.genre || ['Unknown']).join(' | ')}
                    </Text>
                    <Text style={{ color: '#fff' }}>
                      <CalendarOutlined style={{ marginRight: '4px' }} />
                      1 May, 2025
                    </Text>
                  </Space>
                </div>
                
                <Space size="large" style={{ marginBottom: '48px' }}>
                  <Button 
                    size="large"
                    icon={<PlayCircleOutlined />}
                    style={{ 
                      background: '#333', 
                      border: '1px solid #666',
                      color: '#fff',
                      height: '48px',
                      padding: '0 24px'
                    }}
                  >
                    Watch Trailer
                  </Button>
                  
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

        {/* Cast Section */}
        <div style={{ padding: '80px 0', background: 'var(--bg-card)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: '48px' }}>
              Your Favorite Cast
            </Title>
            
            <Row gutter={[24, 24]} justify="center">
              {cast.map((actor, index) => (
                <Col key={index}>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={80} 
                      src={actor.avatar}
                      style={{ marginBottom: '16px' }}
                    />
                    <div>
                      <Text style={{ color: '#fff', display: 'block', fontWeight: 'bold' }}>
                        {actor.name}
                      </Text>
                      <Text style={{ color: '#999', fontSize: '12px' }}>
                        {actor.character}
                      </Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* Showtimes Section - NEW */}
        <div style={{ padding: '80px 0', background: '#0a0a0a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={2} className="cinema-title" style={{ marginBottom: '32px' }}>
              Lịch Chiếu & Đặt Vé
            </Title>

            {/* Date Selector */}
            {availableDates.length > 0 && (
              <div style={{ 
                marginBottom: '32px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '20px',
                background: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #333'
              }}>
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
                {/* Group showtimes by branch */}
                {(() => {
                  const groupedByBranch = {};
                  showtimes.forEach(st => {
                    const branchId = st.branch?._id || 'unknown';
                    if (!groupedByBranch[branchId]) {
                      groupedByBranch[branchId] = {
                        branch: st.branch,
                        showtimes: []
                      };
                    }
                    groupedByBranch[branchId].showtimes.push(st);
                  });

                  return Object.values(groupedByBranch).map((data, idx) => (
                    <Card
                      key={idx}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        marginBottom: '24px',
                        borderRadius: '12px'
                      }}
                    >
                      {/* Branch Header */}
                      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #333' }}>
                        <Space>
                          <EnvironmentOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                          <div>
                            <Text strong style={{ color: '#fff', fontSize: '18px', display: 'block' }}>
                              {data.branch?.name || 'Rạp chiếu'}
                            </Text>
                            <Text style={{ color: '#999', fontSize: '14px' }}>
                              {data.branch?.location?.city || 'N/A'}
                            </Text>
                          </div>
                        </Space>
                      </div>

                      {/* Time Slots */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {data.showtimes
                          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                          .map((st, stIdx) => {
                            const startTime = new Date(st.startTime);
                            const timeStr = startTime.toLocaleTimeString('vi-VN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            });
                            const dateStr = startTime.toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit'
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
                                  height: 'auto',
                                  minWidth: '140px',
                                  padding: '12px 20px',
                                  borderRadius: '8px',
                                  transition: 'all 0.3s ease',
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
                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                  {timeStr}
                                </span>
                                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                                  {dateStr}
                                </span>
                                <span style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
                                  {(st.totalSeats - (st.bookedSeats || 0))} ghế
                                </span>
                                {st.isFirstShow && (
                                  <Tag color="blue" style={{ margin: 0, fontSize: '10px' }}>
                                    Suất đầu
                                  </Tag>
                                )}
                                {st.isLastShow && (
                                  <Tag color="purple" style={{ margin: 0, fontSize: '10px' }}>
                                    Suất cuối
                                  </Tag>
                                )}
                              </Button>
                            );
                          })}
                      </div>
                    </Card>
                  ));
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
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                You May Also Like
              </Title>
              <Link to="/movies" style={{ color: '#ff4d4f', textDecoration: 'none' }}>
                View All →
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
              <Button 
                type="primary" 
                size="large"
                className="primary-button"
              >
                Show more
              </Button>
            </div>
          </div>
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default MovieDetail;
