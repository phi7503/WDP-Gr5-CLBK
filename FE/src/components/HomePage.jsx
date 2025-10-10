import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Space, message } from 'antd';
import { PlayCircleOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MovieCard from './MovieCard';
import { movieAPI, showtimeAPI, comboAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const HomePage = () => {
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      
      // Load trending movies for featured movie
      const trendingResponse = await movieAPI.getTrendingMovies();
      if (trendingResponse && trendingResponse.length > 0) {
        setFeaturedMovie(trendingResponse[0]);
      }
      
      // Load all movies for now showing
      const moviesResponse = await movieAPI.getMovies();
      if (moviesResponse && moviesResponse.movies) {
        // Filter movies with status "now-showing"
        const nowShowing = moviesResponse.movies.filter(movie => movie.status === 'now-showing');
        setNowShowingMovies(nowShowing.slice(0, 8)); // Limit to 8 movies
        
        // Use some movies as trailers
        setTrailers(moviesResponse.movies.slice(0, 4));
      }
      
      // Load combos for promotional section
      const combosResponse = await comboAPI.getCombos();
      if (combosResponse) {
        setCombos(combosResponse.slice(0, 4)); // Limit to 4 combos
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      message.error('Failed to load movies. Please check your backend connection.');
      
      // Don't use fallback data - show empty state instead
      setFeaturedMovie(null);
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
          <Text style={{ color: '#fff', fontSize: '18px' }}>Loading movies...</Text>
        </Content>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content>
        {/* Hero Section */}
        {featuredMovie && (
          <div 
            className="hero-section"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${featuredMovie.poster})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px'
            }}
          >
          <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} lg={12}>
                <div style={{ color: '#fff' }}>
                  <Text style={{ 
                    color: '#ff4d4f', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                  }}>
                    MARVEL STUDIOS
                  </Text>
                  
                  <Title level={1} style={{ 
                    color: '#fff', 
                    fontSize: '48px',
                    fontWeight: 'bold',
                    margin: '16px 0'
                  }}>
                    {featuredMovie.title}
                  </Title>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <Space size="large">
                      <Text style={{ color: '#fff' }}>
                        {featuredMovie.genre.join(' | ')}
                      </Text>
                      <Text style={{ color: '#fff' }}>
                        <CalendarOutlined style={{ marginRight: '4px' }} />
                        {featuredMovie.releaseDate}
                      </Text>
                      <Text style={{ color: '#fff' }}>
                        <ClockCircleOutlined style={{ marginRight: '4px' }} />
                        {featuredMovie.duration}
                      </Text>
                    </Space>
                  </div>
                  
                  <Paragraph style={{ 
                    color: '#fff', 
                    fontSize: '16px',
                    lineHeight: '1.6',
                    marginBottom: '32px'
                  }}>
                    {featuredMovie.description}
                  </Paragraph>
                  
                  <Button 
                    type="primary" 
                    size="large"
                    className="primary-button"
                    style={{ fontSize: '16px', height: '48px', padding: '0 32px' }}
                  >
                    <Link to="/movies" style={{ color: 'white', textDecoration: 'none' }}>
                      Explore Movies →
                    </Link>
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </div>
        )}

        {/* Fallback Hero Section if no featured movie */}
        {!featuredMovie && !loading && (
          <div 
            className="hero-section"
            style={{
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px'
            }}
          >
            <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
              <Title level={1} style={{ color: '#fff', fontSize: '48px', marginBottom: '24px' }}>
                Welcome to QuickShow
              </Title>
              <Paragraph style={{ color: '#fff', fontSize: '18px', marginBottom: '32px' }}>
                Your ultimate destination for movie tickets and entertainment
              </Paragraph>
              <Button 
                type="primary" 
                size="large"
                className="primary-button"
                style={{ fontSize: '16px', height: '48px', padding: '0 32px' }}
              >
                <Link to="/movies" style={{ color: 'white', textDecoration: 'none' }}>
                  Explore Movies →
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Now Showing Section */}
        <div style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '48px'
          }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              Now Showing
            </Title>
            <Link to="/movies" style={{ color: '#ff4d4f', textDecoration: 'none' }}>
              View All →
            </Link>
          </div>
          
          <Row gutter={[24, 24]}>
            {nowShowingMovies.map(movie => (
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

        {/* Trailers Section */}
        <div style={{ padding: '80px 24px', background: '#1a1a1a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: '48px' }}>
              Trailers
            </Title>
            
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <Card
                  style={{ 
                    background: '#333',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                  cover={
                    <div style={{ 
                      position: 'relative', 
                      height: '400px',
                      backgroundImage: `url(${trailers[0]?.poster || 'https://via.placeholder.com/600x400/333/fff?text=Trailer'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PlayCircleOutlined 
                        style={{ 
                          fontSize: '64px', 
                          color: '#fff',
                          cursor: 'pointer'
                        }} 
                      />
                    </div>
                  }
                />
              </Col>
              
              <Col xs={24} lg={8}>
                <Row gutter={[16, 16]}>
                  {trailers.slice(1).map(trailer => (
                    <Col span={12} key={trailer._id}>
                      <Card
                        style={{ 
                          background: '#333',
                          border: '1px solid #555',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                        cover={
                          <div style={{ 
                            position: 'relative', 
                            height: '120px',
                            backgroundImage: `url(${trailer.poster || 'https://via.placeholder.com/300x200/333/fff?text=Trailer'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <PlayCircleOutlined 
                              style={{ 
                                fontSize: '32px', 
                                color: '#fff',
                                cursor: 'pointer'
                              }} 
                            />
                          </div>
                        }
                      />
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </div>
        </div>

        {/* Combos & Concessions Section */}
        <div style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '48px'
            }}>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                Combos & Concessions
              </Title>
              <Link to="/combos" style={{ color: '#ff4d4f', textDecoration: 'none' }}>
                View All →
              </Link>
            </div>
            
            <Row gutter={[24, 24]}>
              {combos.map(combo => (
                <Col xs={12} sm={8} md={6} key={combo._id}>
                  <Card
                    style={{ 
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                    cover={
                      <img
                        alt={combo.name}
                        src={combo.image ? `http://localhost:5000/${combo.image}` : 'https://via.placeholder.com/300x200/333/fff?text=Combo'}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                      />
                    }
                  >
                    <Card.Meta
                      title={
                        <Title level={5} style={{ color: '#fff', margin: 0 }}>
                          {combo.name}
                        </Title>
                      }
                      description={
                        <div>
                          <Text style={{ color: '#999', fontSize: '12px' }}>
                            {combo.description}
                          </Text>
                          <div style={{ marginTop: '8px' }}>
                            <Text style={{ color: '#ff4d4f', fontSize: '16px', fontWeight: 'bold' }}>
                              ${combo.price}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default HomePage;
