import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Row, Col, Card, Space, Avatar, DatePicker, message } from 'antd';
import { PlayCircleOutlined, HeartOutlined, StarOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MovieCard from './MovieCard';
import { movieAPI, showtimeAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const MovieDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMovieDetails();
    }
  }, [id]);

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
        const sts = await showtimeAPI.getShowtimes();
        console.log('Showtimes response:', sts);
        if (sts && sts.showtimes) {
          const filtered = sts.showtimes.filter(s => s.movie && s.movie._id === id);
          console.log('Filtered showtimes:', filtered);
          setShowtimes(filtered);
        }
      } catch (showtimeError) {
        console.error('Error loading showtimes:', showtimeError);
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
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
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
      <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
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
                    src={movie?.poster ? `http://localhost:5000/${movie.poster}` : 'https://via.placeholder.com/400x600/333/fff?text=Movie+Poster'}
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
                  
                  {showtimes && showtimes.length > 0 && (
                    <Button 
                      type="primary" 
                      size="large"
                      className="primary-button"
                      style={{ height: '48px', padding: '0 24px' }}
                    >
                      <Link to={`/booking/${showtimes[0]._id}`} style={{ color: 'white', textDecoration: 'none' }}>
                        Buy Tickets
                      </Link>
                    </Button>
                  )}
                  
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
        <div style={{ padding: '80px 0', background: '#1a1a1a' }}>
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

        {/* Choose Date Section */}
        <div style={{ padding: '80px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: '48px' }}>
              Choose Date
            </Title>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: '#1a1a1a',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {dates.map((date, index) => (
                  <Button
                    key={index}
                    type={index === 1 ? 'primary' : 'default'}
                    className={index === 1 ? 'primary-button' : ''}
                    style={{
                      background: index === 1 ? '#ff4d4f' : '#333',
                      border: index === 1 ? '1px solid #ff4d4f' : '1px solid #666',
                      color: '#fff',
                      height: '48px',
                      padding: '0 24px'
                    }}
                  >
                    {date.label}
                  </Button>
                ))}
              </div>
              
              {showtimes && showtimes.length > 0 && (
                <Button 
                  type="primary" 
                  size="large"
                  className="primary-button"
                  style={{ height: '48px', padding: '0 32px' }}
                >
                  <Link to={`/booking/${showtimes[0]._id}`} style={{ color: 'white', textDecoration: 'none' }}>
                    Book Now
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Movies */}
        <div style={{ padding: '80px 0', background: '#1a1a1a' }}>
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
