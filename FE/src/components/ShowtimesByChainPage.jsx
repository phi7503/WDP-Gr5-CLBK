import React, { useState, useEffect } from 'react';
import { Layout, Typography, Tabs, Card, Row, Col, Button, Badge, Tag, Spin, Empty, message, Collapse, Divider } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, FireOutlined, CalendarOutlined, RightOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { branchAPI, showtimeAPI, movieAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const ShowtimesByChainPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [branchesByChain, setBranchesByChain] = useState({});
  const [showtimesByBranch, setShowtimesByBranch] = useState({});
  const [movieDetails, setMovieDetails] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeChain, setActiveChain] = useState('CGV');

  // Generate next 7 days for date picker
  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        fullDate: date
      });
    }
    return dates;
  };

  const dates = getNext7Days();

  useEffect(() => {
    loadAllData();
  }, [selectedDate]);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // 1. Load branches grouped by chain
      const branchesResponse = await branchAPI.getBranchesGrouped();
      if (branchesResponse && branchesResponse.groupedByChain) {
        setBranchesByChain(branchesResponse.groupedByChain);

        // 2. Load showtimes for each branch
        const showtimesData = {};
        const movieIds = new Set();

        for (const chain in branchesResponse.groupedByChain) {
          const branches = branchesResponse.groupedByChain[chain];
          
          for (const branch of branches) {
            try {
              const showtimes = await showtimeAPI.getShowtimesByBranch(branch._id, { date: selectedDate });
              
              if (showtimes && showtimes.length > 0) {
                showtimesData[branch._id] = showtimes;
                
                // Collect movie IDs
                showtimes.forEach(st => {
                  if (st.movie && st.movie._id) {
                    movieIds.add(st.movie._id);
                  }
                });
              }
            } catch (error) {
              console.error(`Error loading showtimes for branch ${branch.name}:`, error);
            }
          }
        }

        setShowtimesByBranch(showtimesData);

        // 3. Load movie details
        const moviesData = {};
        for (const movieId of movieIds) {
          try {
            const movie = await movieAPI.getMovieById(movieId);
            if (movie) {
              moviesData[movieId] = movie;
            }
          } catch (error) {
            console.error(`Error loading movie ${movieId}:`, error);
          }
        }
        setMovieDetails(moviesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Không thể tải dữ liệu suất chiếu');
    } finally {
      setLoading(false);
    }
  };

  // Group showtimes by movie for a branch
  const groupShowtimesByMovie = (branchId) => {
    const showtimes = showtimesByBranch[branchId] || [];
    const grouped = {};

    showtimes.forEach(showtime => {
      const movieId = showtime.movie?._id || showtime.movie;
      if (!movieId) return;

      if (!grouped[movieId]) {
        grouped[movieId] = [];
      }
      grouped[movieId].push(showtime);
    });

    // Sort showtimes by start time
    Object.keys(grouped).forEach(movieId => {
      grouped[movieId].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });

    return grouped;
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Get seat availability status
  const getSeatAvailabilityStatus = (showtime) => {
    const totalSeats = showtime.totalSeats || 100;
    const bookedSeats = showtime.bookedSeats || 0;
    const availableSeats = totalSeats - bookedSeats;
    const availabilityPercent = (availableSeats / totalSeats) * 100;

    if (availabilityPercent <= 0) {
      return { status: 'sold-out', color: 'rgba(255,255,255,0.3)', text: 'Hết vé', disabled: true };
    } else if (availabilityPercent <= 20) {
      return { status: 'almost-full', color: '#ef4444', text: `${availableSeats} ghế`, disabled: false, blink: true };
    } else if (availabilityPercent <= 50) {
      return { status: 'filling-fast', color: '#f59e0b', text: `${availableSeats} ghế`, disabled: false, pulse: true };
    } else {
      return { status: 'available', color: '#10b981', text: `${availableSeats} ghế`, disabled: false };
    }
  };

  // Handle showtime selection
  const handleShowtimeClick = (showtime, movie) => {
    if (!showtime || getSeatAvailabilityStatus(showtime).disabled) return;
    
    navigate('/booking', {
      state: {
        showtime: showtime,
        movie: movie,
        branch: showtime.branch,
        theater: showtime.theater
      }
    });
  };

  // Render movie showtimes for a branch
  const renderMovieShowtimes = (branchId, movieId, showtimes) => {
    const movie = movieDetails[movieId] || showtimes[0]?.movie;
    if (!movie) return null;

    return (
      <div key={movieId} className="movie-showtime-section" style={{ marginBottom: '32px' }}>
        <Row gutter={24} align="middle">
          {/* Movie Poster */}
          <Col xs={24} sm={6} md={4}>
            <div 
              className="movie-poster-container"
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => navigate(`/movies/${movie._id}`)}
            >
              <img 
                src={movie.poster || movie.posterUrl || '/placeholder-movie.jpg'} 
                alt={movie.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
              {movie.hotnessScore >= 70 && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <FireOutlined style={{ color: '#fff' }} />
                  <Text style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>HOT</Text>
                </div>
              )}
            </div>
          </Col>

          {/* Movie Info & Showtimes */}
          <Col xs={24} sm={18} md={20}>
            <div style={{ marginBottom: '12px' }}>
              <Title 
                level={4} 
                style={{ marginBottom: '8px', cursor: 'pointer' }}
                onClick={() => navigate(`/movies/${movie._id}`)}
              >
                {movie.title}
              </Title>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <Tag color="blue">{movie.rating || 'P'}</Tag>
                <Text type="secondary">
                  <ClockCircleOutlined /> {movie.duration || 120} phút
                </Text>
                {movie.genre && movie.genre.length > 0 && (
                  <Text type="secondary">• {movie.genre.slice(0, 2).join(', ')}</Text>
                )}
              </div>
            </div>

            {/* Showtime Slots */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {showtimes.map((showtime) => {
                const availability = getSeatAvailabilityStatus(showtime);
                
                return (
                  <div
                    key={showtime._id}
                    className={`showtime-slot ${availability.status}`}
                    style={{
                      position: 'relative',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: `1px solid ${availability.color}`,
                      background: `${availability.color}15`,
                      cursor: availability.disabled ? 'not-allowed' : 'pointer',
                      opacity: availability.disabled ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      minWidth: '120px',
                      textAlign: 'center'
                    }}
                    onClick={() => !availability.disabled && handleShowtimeClick(showtime, movie)}
                    onMouseEnter={(e) => {
                      if (!availability.disabled) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 4px 12px ${availability.color}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: availability.color, marginBottom: '4px' }}>
                      {formatTime(showtime.startTime)}
                    </div>
                    <div style={{ fontSize: '12px', color: availability.color }}>
                      {availability.text}
                    </div>
                    
                    {/* Badges */}
                    {showtime.isFirstShow && (
                      <Tag 
                        color="blue" 
                        style={{ 
                          position: 'absolute', 
                          top: '-8px', 
                          left: '-8px', 
                          fontSize: '10px',
                          padding: '2px 6px'
                        }}
                      >
                        Suất đầu
                      </Tag>
                    )}
                    {showtime.isLastShow && (
                      <Tag 
                        color="purple" 
                        style={{ 
                          position: 'absolute', 
                          top: '-8px', 
                          right: '-8px', 
                          fontSize: '10px',
                          padding: '2px 6px'
                        }}
                      >
                        Suất cuối 🌙
                      </Tag>
                    )}
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '24px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
      </div>
    );
  };

  // Render branch with all movies
  const renderBranch = (branch) => {
    const showtimesByMovie = groupShowtimesByMovie(branch._id);
    const movieCount = Object.keys(showtimesByMovie).length;

    if (movieCount === 0) return null;

    return (
      <Panel
        key={branch._id}
        header={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <Text strong style={{ fontSize: '16px' }}>
                <EnvironmentOutlined style={{ marginRight: '8px', color: '#dc2626' }} />
                {branch.name}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px', marginLeft: '24px' }}>
                {branch.location?.address}, {branch.location?.city}
              </Text>
            </div>
            <Badge count={movieCount} style={{ backgroundColor: '#dc2626' }}>
              <Tag color="green">{movieCount} phim</Tag>
            </Badge>
          </div>
        }
        style={{
          marginBottom: '16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ padding: '16px' }}>
          {Object.entries(showtimesByMovie).map(([movieId, showtimes]) =>
            renderMovieShowtimes(branch._id, movieId, showtimes)
          )}
        </div>
      </Panel>
    );
  };

  // Render cinema chain tab
  const renderChainContent = (chain, branches) => {
    if (!branches || branches.length === 0) {
      return (
        <Empty
          description={`Không có rạp ${chain} nào`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '40px 0' }}
        />
      );
    }

    // Filter branches that have showtimes
    const branchesWithShowtimes = branches.filter(branch => {
      const showtimes = showtimesByBranch[branch._id];
      return showtimes && showtimes.length > 0;
    });

    if (branchesWithShowtimes.length === 0) {
      return (
        <Empty
          description={`Không có suất chiếu tại ${chain} vào ngày này`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '40px 0' }}
        />
      );
    }

    return (
      <Collapse 
        ghost
        expandIconPosition="end"
        defaultActiveKey={branchesWithShowtimes.length > 0 ? [branchesWithShowtimes[0]._id] : []}
      >
        {branchesWithShowtimes.map(branch => renderBranch(branch))}
      </Collapse>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Header />
      
      <Content style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <Title level={1} style={{ color: '#fff', marginBottom: '16px' }}>
              Lịch Chiếu Theo Cụm Rạp
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
              Chọn cụm rạp, chọn rạp, chọn phim và đặt vé ngay!
            </Paragraph>
          </div>

          {/* Date Picker */}
          <Card 
            style={{ 
              marginBottom: '32px', 
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CalendarOutlined style={{ fontSize: '20px', color: '#dc2626' }} />
              <Text strong style={{ fontSize: '16px', color: '#fff' }}>Chọn ngày:</Text>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {dates.map(date => (
                <Button
                  key={date.value}
                  type={selectedDate === date.value ? 'primary' : 'default'}
                  size="large"
                  onClick={() => setSelectedDate(date.value)}
                  style={{
                    background: selectedDate === date.value ? '#dc2626' : 'rgba(255,255,255,0.05)',
                    borderColor: selectedDate === date.value ? '#dc2626' : 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    minWidth: '120px'
                  }}
                >
                  {date.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Loading */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
              <Paragraph style={{ marginTop: '20px', color: 'rgba(255,255,255,0.7)' }}>
                Đang tải suất chiếu...
              </Paragraph>
            </div>
          ) : (
            /* Cinema Chain Tabs */
            <Tabs
              activeKey={activeChain}
              onChange={setActiveChain}
              size="large"
              type="card"
              tabBarStyle={{
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                marginBottom: '24px'
              }}
              tabBarGutter={16}
            >
              {Object.entries(branchesByChain).map(([chain, branches]) => (
                <TabPane
                  tab={
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {chain} ({branches.length})
                    </span>
                  }
                  key={chain}
                >
                  {renderChainContent(chain, branches)}
                </TabPane>
              ))}
            </Tabs>
          )}
        </div>
      </Content>

      <Footer />

      {/* Custom Styles */}
      <style jsx>{`
        .showtime-slot.almost-full {
          animation: blink 1s infinite;
        }
        
        .showtime-slot.filling-fast {
          animation: pulse 1.5s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .movie-poster-container:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3);
        }
      `}</style>
    </Layout>
  );
};

export default ShowtimesByChainPage;

