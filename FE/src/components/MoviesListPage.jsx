import React, { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Card, Input, Select, Button, Pagination, Spin, Empty } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MovieCard from './MovieCard';
import { movieAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const MoviesListPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('hotness');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  const genres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 
    'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary'
  ];

  const statuses = [
    { value: 'now-showing', label: 'Đang chiếu' },
    { value: 'coming-soon', label: 'Sắp chiếu' },
    { value: 'ended', label: 'Kết thúc' }
  ];

  useEffect(() => {
    loadMovies();
  }, [currentPage, searchTerm, selectedGenre, selectedStatus, sortBy]);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        genre: selectedGenre,
        status: selectedStatus,
        sortBy: sortBy
      };

      const response = await movieAPI.getMovies(params);
      
      if (response) {
        setMovies(response.movies || []);
        setTotalPages(response.pages || 1);
        setTotalMovies(response.total || 0);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'genre':
        setSelectedGenre(value);
        break;
      case 'status':
        setSelectedStatus(value);
        break;
      case 'sort':
        setSortBy(value);
        break;
      default:
        break;
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGenre('');
    setSelectedStatus('');
    setSortBy('hotness');
    setCurrentPage(1);
  };

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: '8px' }}>
              Danh sách phim
            </Title>
            <Text style={{ color: '#999' }}>
              Tìm thấy {totalMovies} phim
            </Text>
          </div>

          {/* Search and Filters */}
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              marginBottom: '32px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="Tìm kiếm phim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onSearch={handleSearch}
                  prefix={<SearchOutlined style={{ color: '#666' }} />}
                  style={{ width: '100%' }}
                />
              </Col>
              
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="Thể loại"
                  value={selectedGenre}
                  onChange={(value) => handleFilterChange('genre', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {genres.map(genre => (
                    <Option key={genre} value={genre}>{genre}</Option>
                  ))}
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="Trạng thái"
                  value={selectedStatus}
                  onChange={(value) => handleFilterChange('status', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {statuses.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="Sắp xếp"
                  value={sortBy}
                  onChange={(value) => handleFilterChange('sort', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="hotness">Phổ biến</Option>
                  <Option value="releaseDate">Mới nhất</Option>
                  <Option value="title">Tên A-Z</Option>
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={4}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={clearFilters}
                  style={{
                    background: '#333',
                    border: '1px solid #666',
                    color: '#fff',
                    width: '100%'
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Movies Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text style={{ color: '#999' }}>Đang tải phim...</Text>
              </div>
            </div>
          ) : movies.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: '#999' }}>
                  Không tìm thấy phim nào
                </Text>
              }
              style={{ margin: '80px 0' }}
            >
              <Button type="primary" className="primary-button" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </Empty>
          ) : (
            <>
              <Row gutter={[24, 24]}>
                {movies.map((movie) => (
                  <Col key={movie._id} xs={24} sm={12} md={8} lg={6}>
                    <MovieCard movie={movie} />
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ textAlign: 'center', marginTop: '48px' }}>
                  <Pagination
                    current={currentPage}
                    total={totalMovies}
                    pageSize={12}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) => 
                      `${range[0]}-${range[1]} của ${total} phim`
                    }
                    style={{
                      color: '#fff'
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default MoviesListPage;

