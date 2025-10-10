import React, { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Card, Input, Tabs, Empty, Spin } from 'antd';
import { SearchOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MovieCard from './MovieCard';
import { movieAPI, showtimeAPI } from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('movies');

  const handleSearch = async (value) => {
    if (!value.trim()) {
      setMovies([]);
      setShowtimes([]);
      return;
    }

    setSearchTerm(value);
    setLoading(true);

    try {
      // Search movies
      const moviesResponse = await movieAPI.getMovies({ search: value, limit: 20 });
      setMovies(moviesResponse?.movies || []);

      // Search showtimes (if needed)
      const showtimesResponse = await showtimeAPI.getShowtimes({ 
        search: value, 
        limit: 20 
      });
      setShowtimes(showtimesResponse?.showtimes || []);
    } catch (error) {
      console.error('Search error:', error);
      setMovies([]);
      setShowtimes([]);
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'movies',
      label: `Phim (${movies.length})`,
      children: (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text style={{ color: '#999' }}>Đang tìm kiếm...</Text>
              </div>
            </div>
          ) : movies.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: '#999' }}>
                  {searchTerm ? 'Không tìm thấy phim nào' : 'Nhập từ khóa để tìm kiếm'}
                </Text>
              }
              style={{ margin: '40px 0' }}
            />
          ) : (
            <Row gutter={[24, 24]}>
              {movies.map((movie) => (
                <Col key={movie._id} xs={24} sm={12} md={8} lg={6}>
                  <MovieCard movie={movie} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
    {
      key: 'showtimes',
      label: `Suất chiếu (${showtimes.length})`,
      children: (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text style={{ color: '#999' }}>Đang tìm kiếm...</Text>
              </div>
            </div>
          ) : showtimes.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: '#999' }}>
                  {searchTerm ? 'Không tìm thấy suất chiếu nào' : 'Nhập từ khóa để tìm kiếm'}
                </Text>
              }
              style={{ margin: '40px 0' }}
            />
          ) : (
            <Row gutter={[24, 24]}>
              {showtimes.map((showtime) => (
                <Col key={showtime._id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '12px'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <img
                        src={showtime.movie?.poster || 'https://via.placeholder.com/200x300/333/fff?text=Movie'}
                        alt={showtime.movie?.title}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}
                      />
                    </div>
                    
                    <Title level={5} style={{ color: '#fff', marginBottom: '8px' }}>
                      {showtime.movie?.title}
                    </Title>
                    
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <CalendarOutlined style={{ color: '#999', marginRight: '8px' }} />
                        <Text style={{ color: '#fff' }}>
                          {dayjs(showtime.startTime).format('DD/MM/YYYY')}
                        </Text>
                      </div>
                      
                      <div>
                        <ClockCircleOutlined style={{ color: '#999', marginRight: '8px' }} />
                        <Text style={{ color: '#fff' }}>
                          {dayjs(showtime.startTime).format('HH:mm')} - {dayjs(showtime.endTime).format('HH:mm')}
                        </Text>
                      </div>
                      
                      <Text style={{ color: '#999' }}>
                        {showtime.branch?.name} - {showtime.theater?.name}
                      </Text>
                      
                      <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                        {showtime.price?.toLocaleString('vi-VN')} VND
                      </Text>
                    </Space>
                    
                    <div style={{ marginTop: '16px' }}>
                      <Button
                        type="primary"
                        className="primary-button"
                        block
                        onClick={() => window.location.href = `/booking/${showtime._id}`}
                      >
                        Đặt vé
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: '16px' }}>
              Tìm kiếm
            </Title>
            
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Search
                placeholder="Tìm kiếm phim, diễn viên, thể loại..."
                size="large"
                onSearch={handleSearch}
                prefix={<SearchOutlined style={{ color: '#666' }} />}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Search Results */}
          {searchTerm && (
            <Card
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ marginBottom: '24px' }}>
                <Text style={{ color: '#999' }}>
                  Kết quả tìm kiếm cho: <Text style={{ color: '#fff' }}>"{searchTerm}"</Text>
                </Text>
              </div>
              
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                style={{ color: '#fff' }}
              />
            </Card>
          )}

          {/* Popular Searches */}
          {!searchTerm && (
            <Card
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
                Tìm kiếm phổ biến
              </Title>
              
              <Row gutter={[16, 16]}>
                {[
                  'Action', 'Comedy', 'Horror', 'Romance', 
                  'Sci-Fi', 'Thriller', 'Animation', 'Drama'
                ].map((genre) => (
                  <Col key={genre} xs={12} sm={8} md={6}>
                    <Button
                      type="text"
                      style={{
                        color: '#ff4d4f',
                        border: '1px solid #ff4d4f',
                        borderRadius: '20px',
                        width: '100%'
                      }}
                      onClick={() => handleSearch(genre)}
                    >
                      {genre}
                    </Button>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default SearchPage;

