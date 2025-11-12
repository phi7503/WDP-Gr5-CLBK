import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Space, message, Rate } from 'antd';
import { PlayCircleOutlined, CalendarOutlined, ClockCircleOutlined, StarFilled, FireFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MovieCard from './MovieCard';
import ChatBot from './ChatBot';
import { movieAPI, showtimeAPI, comboAPI, branchAPI, BACKEND_URL, getImageUrl } from '../services/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const HomePage = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]); // ✅ Load từ database
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [branchesByChain, setBranchesByChain] = useState({});

  // Auto-slide effect - Tự động chuyển slide sau mỗi 5 giây
  useEffect(() => {
    if (featuredMovies.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
      }, 5000); // Thay đổi mỗi 5 giây
      
      return () => clearInterval(interval);
    }
  }, [featuredMovies.length]);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      
      // ✅ Load featured movies từ database (top 5 phim có hotness cao nhất và có backdrop)
      try {
        const featuredResponse = await movieAPI.getMovies({ 
          limit: 20, 
          status: 'now-showing',
          sortBy: 'hotness' 
        });
        
        if (featuredResponse && featuredResponse.movies) {
          // Lọc các phim có backdropImage và lấy top 5
          const moviesWithBackdrop = featuredResponse.movies
            .filter(movie => movie.backdropImage)
            .slice(0, 5);
          
          setFeaturedMovies(moviesWithBackdrop);
        }
      } catch (featuredError) {
        console.error('Error loading featured movies:', featuredError);
      }
      
      // Load all movies for different sections
      const moviesResponse = await movieAPI.getMovies({ limit: 100 });
      if (moviesResponse && moviesResponse.movies) {
        // Filter movies by status
        const nowShowing = moviesResponse.movies.filter(movie => movie.status === 'now-showing');
        const comingSoon = moviesResponse.movies.filter(movie => movie.status === 'coming-soon');
        
        setNowShowingMovies(nowShowing.slice(0, 12)); // Increase to 12 movies
        setComingSoonMovies(comingSoon.slice(0, 8)); // Add coming soon movies
        
        // Use more movies as trailers
        setTrailers(moviesResponse.movies.slice(0, 6));
      }
      
      // Load trending movies separately
      try {
        const trendingResponse = await movieAPI.getTrendingMovies();
        if (trendingResponse && trendingResponse.length > 0) {
          setTrendingMovies(trendingResponse.slice(0, 8));
        }
      } catch (trendingError) {
        console.error('Error loading trending movies:', trendingError);
      }
      
      // Load combos for promotional section
      try {
        const combosResponse = await comboAPI.getCombos();
        if (combosResponse && combosResponse.length > 0) {
          setCombos(combosResponse.slice(0, 5)); // Limit to 5 combos
        } else {
          setCombos([]);
        }
      } catch (comboError) {
        console.error('Error loading combos:', comboError);
        setCombos([]);
      }
      
      // Load branches grouped by cinema chain
      try {
        const branchesResponse = await branchAPI.getBranchesGrouped();
        if (branchesResponse && branchesResponse.groupedByChain) {
          setBranchesByChain(branchesResponse.groupedByChain);
        }
      } catch (branchError) {
        console.error('Error loading branches:', branchError);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      // ✅ Lỗi sẽ tự động được hiển thị bởi api.js
      
      // Don't use fallback data - show empty state instead
      setFeaturedMovies([]);
      setNowShowingMovies([]);
      setTrailers([]);
      setCombos([]);
    } finally {
      setLoading(false);
    }
  };

  // Show loading or fallback if no featured movie
  if (loading) {
    return (
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Header />
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Text style={{ color: '#fff', fontSize: '18px' }}>Đang tải phim...</Text>
        </Content>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh', paddingTop: '64px' }}>
      <Header />
      
      <Content>
        {/* 🎬 HERO CAROUSEL - Featured Movies Slider với ảnh từ database */}
        {featuredMovies.length > 0 && (
        <div className="hero-carousel-container" style={{ position: 'relative', overflow: 'hidden' }}>
          {featuredMovies.map((movie, index) => {
            const backdropUrl = getImageUrl(movie.backdropImage);
            return (
            <div
              key={movie._id || index}
              className="hero-slide"
              style={{
                position: index === currentSlide ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                opacity: index === currentSlide ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                pointerEvents: index === currentSlide ? 'auto' : 'none',
                zIndex: index === currentSlide ? 1 : 0
              }}
            >
              <div 
                className="hero-section-modern"
                style={{
                  backgroundImage: backdropUrl 
                    ? `url(${backdropUrl}), linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)` 
                    : 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  minHeight: '100vh',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 24px',
                  backgroundColor: '#0a0a0a' // Fallback màu nền
                }}
              >
                {/* Gradient Overlay - Làm nhẹ để ảnh hiển thị rõ hơn */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to right, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.5) 40%, rgba(10,10,10,0.2) 70%, transparent 100%), linear-gradient(to top, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.4) 40%, transparent 100%)',
                  zIndex: 1
                }} />
                
                {/* Content */}
                <div style={{ 
                  maxWidth: '1400px', 
                  width: '100%', 
                  margin: '0 auto',
                  position: 'relative',
                  zIndex: 2,
                  marginTop: '10vh'
                }}>
                  <div style={{ maxWidth: '700px' }}>
                    {/* Featured Badge */}
                    <div style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      marginBottom: '24px',
                      animation: 'fadeInUp 0.6s ease-out'
                    }}>
                      <Text style={{ 
                        color: '#fff', 
                        fontSize: '13px', 
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                      }}>
                        ⭐ PHIM NỔI BẬT {index + 1}/{featuredMovies.length}
                      </Text>
                    </div>
                    
                    {/* Title with Gradient */}
                    <Title level={1} style={{ 
                      background: 'linear-gradient(135deg, #ffffff 0%, #ef4444 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: 'clamp(36px, 6vw, 76px)',
                      fontWeight: '800',
                      margin: '0 0 28px 0',
                      lineHeight: '1.1',
                      animation: 'fadeInUp 0.6s ease-out 0.1s both'
                    }}>
                      {movie.title}
                    </Title>
                    
                    {/* Info Row */}
                    <div style={{ 
                      marginBottom: '28px',
                      animation: 'fadeInUp 0.6s ease-out 0.2s both'
                    }}>
                      <Space size="large" wrap>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <StarFilled style={{ color: '#fadb14', fontSize: '20px' }} />
                          <Text style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>
                            {movie.rating}/10
                          </Text>
                        </div>
                        <Text style={{ color: '#d1d5db', fontSize: '16px' }}>
                          <ClockCircleOutlined style={{ marginRight: '6px' }} />
                          {movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : 'N/A'}
                        </Text>
                        <Text style={{ color: '#d1d5db', fontSize: '16px' }}>
                          {movie.genre && movie.genre.length > 0 ? movie.genre.join(' • ') : 'N/A'}
                        </Text>
                      </Space>
                    </div>
                    
                    {/* Description */}
                    <Paragraph style={{ 
                      color: '#d1d5db', 
                      fontSize: '17px',
                      lineHeight: '1.8',
                      marginBottom: '40px',
                      maxWidth: '600px',
                      animation: 'fadeInUp 0.6s ease-out 0.3s both'
                    }}>
                      {movie.description}
                    </Paragraph>
                    
                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '16px', 
                      flexWrap: 'wrap',
                      animation: 'fadeInUp 0.6s ease-out 0.4s both'
                    }}>
                      <Link to={`/movie/${movie._id}`}>
                        <Button 
                          type="primary" 
                          size="large"
                          className="hero-button-primary"
                          style={{ 
                            fontSize: '16px', 
                            height: '56px', 
                            padding: '0 40px',
                            fontWeight: '700',
                            borderRadius: '28px',
                            border: 'none'
                          }}
                        >
                          <span style={{ marginRight: '8px' }}>🎟️</span>
                          Đặt vé ngay
                        </Button>
                      </Link>
                      
                      {movie.trailer && (
                        <Button 
                          size="large"
                          className="hero-button-secondary"
                          onClick={() => window.open(movie.trailer, '_blank')}
                          style={{ 
                            fontSize: '16px', 
                            height: '56px', 
                            padding: '0 40px',
                            fontWeight: '600',
                            borderRadius: '28px',
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            color: '#fff'
                          }}
                        >
                          <PlayCircleOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
                          Xem trailer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
          
          {/* Slide Indicators (Dots) */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px',
            zIndex: 10
          }}>
            {featuredMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{
                  width: index === currentSlide ? '40px' : '12px',
                  height: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: index === currentSlide 
                    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                    : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: index === currentSlide ? '0 4px 12px rgba(239, 68, 68, 0.5)' : 'none'
                }}
              />
            ))}
          </div>
          
          {/* Navigation Arrows */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length)}
            style={{
              position: 'absolute',
              left: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              background: 'rgba(10,10,10,0.5)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="carousel-arrow-btn"
          >
            ‹
          </button>
          
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % featuredMovies.length)}
            style={{
              position: 'absolute',
              right: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              background: 'rgba(10,10,10,0.5)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="carousel-arrow-btn"
          >
            ›
          </button>
        </div>
        )}

        {/* Now Showing Section - 12 Movies Grid */}
        <div className="section-container" style={{ padding: '100px 24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="section-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '56px'
          }}>
            <div>
              <Title level={2} style={{ 
                color: '#fff', 
                margin: 0,
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: '800',
                letterSpacing: '-0.5px'
              }}>
              Đang chiếu
            </Title>
              <Text style={{ color: '#9ca3af', fontSize: '16px', marginTop: '8px', display: 'block' }}>
                Xem những bộ phim bom tấn mới nhất tại rạp
              </Text>
            </div>
            <Link to="/movies?status=now-showing">
              <Button 
                type="text"
                className="view-all-button"
                style={{ 
                  color: '#ef4444',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
              Xem tất cả →
              </Button>
            </Link>
          </div>
          
          <Row gutter={[24, 24]}>
            {nowShowingMovies.map((movie, index) => (
              <Col xs={12} sm={12} md={8} lg={6} key={movie._id}>
                <div 
                  className="movie-card-wrapper"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                <MovieCard movie={movie} />
                </div>
              </Col>
            ))}
          </Row>
          
          {nowShowingMovies.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Text style={{ color: '#666', fontSize: '18px' }}>
                Hiện không có phim nào đang chiếu
              </Text>
            </div>
          )}
        </div>

        {/* Trending Now Section - 6 Hot Movies with Fire Badge */}
        {trendingMovies.length > 0 && (
            <div style={{ 
            padding: '100px 24px', 
            background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)',
            position: 'relative'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div className="section-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
                marginBottom: '56px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FireFilled style={{ color: '#ef4444', fontSize: '36px' }} />
                    <Title level={2} style={{ 
                      color: '#fff', 
                      margin: 0,
                      fontSize: 'clamp(28px, 4vw, 42px)',
                      fontWeight: '800',
                      letterSpacing: '-0.5px'
                    }}>
                      Đang thịnh hành
              </Title>
                  </div>
                  <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
                    Những bộ phim hot nhất mọi người đang xem
                  </Text>
                </div>
                <Link to="/movies?sortBy=hotness">
                  <Button 
                    type="text"
                    className="view-all-button"
                    style={{ 
                      color: '#ef4444',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                Xem tất cả →
                  </Button>
              </Link>
            </div>
            
              <Row gutter={[32, 32]}>
                {trendingMovies.slice(0, 6).map((movie, index) => (
                  <Col xs={12} sm={12} md={8} lg={8} key={movie._id}>
                    <div 
                      className="trending-card-wrapper"
                      style={{
                        animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`
                      }}
                    >
                      <MovieCard movie={movie} trending />
                    </div>
              </Col>
            ))}
          </Row>
            </div>
          </div>
        )}

        {/* Coming Soon Section - 8 Movies with Yellow Badge */}
        {comingSoonMovies.length > 0 && (
          <div style={{ padding: '100px 24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div className="section-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '56px'
            }}>
              <div>
                <Title level={2} style={{ 
                  color: '#fff', 
                  margin: 0,
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  fontWeight: '800',
                  letterSpacing: '-0.5px'
                }}>
                🎬 Sắp công chiếu
              </Title>
                <Text style={{ color: '#9ca3af', fontSize: '16px', marginTop: '8px', display: 'block' }}>
                  Chuẩn bị cho những bộ phim sắp ra mắt
                </Text>
              </div>
              <Link to="/movies?status=coming-soon">
                <Button 
                  type="text"
                  className="view-all-button"
                  style={{ 
                    color: '#ef4444',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                Xem tất cả →
                </Button>
              </Link>
            </div>
            
          <Row gutter={[24, 24]}>
              {comingSoonMovies.slice(0, 8).map((movie, index) => (
                <Col xs={12} sm={12} md={8} lg={6} key={movie._id}>
                  <div 
                    className="coming-soon-card-wrapper"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <MovieCard movie={movie} comingSoon />
                  </div>
              </Col>
            ))}
          </Row>
          </div>
        )}

        {/* Latest Trailers Section - Grid 3 Columns */}
        <div style={{ 
          padding: '100px 24px', 
          background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="section-header" style={{ marginBottom: '56px' }}>
              <Title level={2} style={{ 
                color: '#fff', 
                margin: 0,
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: '800',
                letterSpacing: '-0.5px'
              }}>
                Trailer mới nhất
            </Title>
              <Text style={{ color: '#9ca3af', fontSize: '16px', marginTop: '8px', display: 'block' }}>
                Xem những trailer và teaser mới nhất
              </Text>
            </div>
            
            <Row gutter={[32, 32]}>
              {trailers.slice(0, 6).map((trailer, index) => (
                <Col xs={24} sm={12} md={12} lg={8} key={trailer._id}>
                  <div 
                    className="trailer-card"
                  style={{ 
                      position: 'relative',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      background: '#1a1a1a',
                      cursor: 'pointer',
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ 
                      position: 'relative', 
                      paddingBottom: '56.25%',
                      background: '#000',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={trailer.poster ? `${BACKEND_URL}/${trailer.poster}` : 'https://via.placeholder.com/640x360/111/fff?text=Trailer'}
                        alt={trailer.title}
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                      {/* Dark Overlay */}
                      <div className="trailer-overlay" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.3s ease'
                      }}>
                        {/* Play Button */}
                        <div className="play-button" style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)'
                        }}>
                          <PlayCircleOutlined style={{ 
                            fontSize: '48px', 
                            color: '#fff'
                          }} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div style={{ padding: '20px' }}>
                      <Title level={5} style={{ 
                        color: '#fff', 
                        margin: '0 0 8px 0',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        {trailer.title}
                      </Title>
                      <Text style={{ color: '#9ca3af', fontSize: '14px' }}>
                        {trailer.duration ? `${Math.floor(trailer.duration / 60)}h ${trailer.duration % 60}m` : '2m 30s'} Trailer
                      </Text>
                    </div>
                          </div>
                    </Col>
                  ))}
            </Row>
          </div>
        </div>

        {/* Combos & Snacks Section - Grid 4 Columns with Shimmer */}
        <div style={{ padding: '100px 24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="section-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '56px'
          }}>
            <div>
              <Title level={2} style={{ 
                color: '#fff', 
                margin: 0,
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: '800',
                letterSpacing: '-0.5px'
              }}>
                🍿 Combo & Đồ ăn vặt
              </Title>
              <Text style={{ color: '#9ca3af', fontSize: '16px', marginTop: '8px', display: 'block' }}>
                Hoàn thiện trải nghiệm xem phim của bạn
              </Text>
            </div>
            <Link to="/combos">
              <Button 
                type="text"
                className="view-all-button"
                style={{ 
                  color: '#ef4444',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Xem tất cả →
              </Button>
            </Link>
          </div>
          
          <Row gutter={[24, 24]}>
            {combos.map((combo, index) => (
              <Col xs={12} sm={12} md={8} lg={6} key={combo._id}>
                <div 
                  className="combo-card"
                  style={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#1a1a1a',
                    border: '2px solid transparent',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  {/* Image Container */}
                  <div style={{ 
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#111'
                  }}>
                    <img
                      alt={combo.name}
                      src={combo.image ? (combo.image.startsWith('http://') || combo.image.startsWith('https://') ? combo.image : `${BACKEND_URL}/${combo.image}`) : 'https://via.placeholder.com/400x300/111/fff?text=Combo'}
                      style={{
                        width: '100%',
                        height: '240px',
                        objectFit: 'cover',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                    {/* Shimmer Effect Overlay */}
                    <div className="shimmer-overlay" style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      transition: 'left 0.5s ease'
                    }} />
                  </div>
                  
                  {/* Content */}
                  <div style={{ padding: '20px' }}>
                    <Title level={5} style={{ 
                      color: '#fff', 
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '700'
                    }}>
                      {combo.name}
                    </Title>
                    <Text style={{ 
                      color: '#9ca3af', 
                      fontSize: '13px',
                      display: 'block',
                      marginBottom: '16px',
                      lineHeight: '1.5'
                    }}>
                      {combo.description?.slice(0, 60) || 'Delicious combo for your movie experience'}
                    </Text>
                    
                    {/* Price and Button */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '16px'
                    }}>
                      <div>
                        <Text style={{ 
                          color: '#ef4444', 
                          fontSize: '22px', 
                          fontWeight: '800',
                          display: 'block',
                          lineHeight: '1'
                        }}>
                          {combo.price.toLocaleString('vi-VN')}₫
                        </Text>
                      </div>
                      <Button 
                        type="primary"
                        className="combo-add-button"
                        style={{
                          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                          border: 'none',
                          borderRadius: '20px',
                          fontWeight: '600',
                          height: '40px',
                          padding: '0 20px'
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
          
          {combos.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Text style={{ color: '#666', fontSize: '18px' }}>
                No combos available at the moment
              </Text>
            </div>
          )}
        </div>
      </Content>
      
      <Footer />
      <ChatBot />
    </Layout>
  );
};

export default HomePage;
