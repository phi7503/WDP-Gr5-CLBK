import React, { useEffect, useState } from 'react';
import { Layout, Typography, Row, Col, Card, Select, DatePicker, Spin, Empty, Tag, Pagination, Input, Button, message } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { movieAPI, showtimeAPI, branchAPI, theaterAPI } from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const ShowtimesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const [selectedMovie, setSelectedMovie] = useState(searchParams.get('movie') || '');
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get('branch') || '');
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '');

  useEffect(() => {
    const loadFilters = async () => {
      try {
        console.log('Loading filters...');
        const [moviesRes, branchesRes] = await Promise.all([
          movieAPI.getMovies({ limit: 100 }),
          branchAPI.getBranches(),
        ]);
        console.log('Movies response:', moviesRes);
        console.log('Branches response:', branchesRes);
        setMovies(moviesRes?.movies || []);
        setBranches(branchesRes || []);
      } catch (e) {
        console.error('Error loading filters:', e);
        setMovies([]);
        setBranches([]);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const qs = {};
    if (selectedMovie) qs.movie = selectedMovie;
    if (selectedBranch) qs.branch = selectedBranch;
    if (selectedDate) qs.date = selectedDate;
    setSearchParams(qs);
  }, [selectedMovie, selectedBranch, selectedDate]);

  useEffect(() => {
    const loadShowtimes = async () => {
      try {
        setLoading(true);
        console.log('Loading showtimes with filters:', { selectedMovie, selectedBranch, selectedDate });
        
        // Build query params for API
        const params = {
          limit: 1000 // Get more results (backend default is only 10!)
        };
        if (selectedMovie) params.movie = selectedMovie;
        if (selectedBranch) params.branch = selectedBranch;
        if (selectedDate) params.date = selectedDate;
        
        // Call API with params - backend will handle filtering
        const res = await showtimeAPI.getShowtimes(params);
        console.log('Showtimes API response:', res);
        
        const list = Array.isArray(res) ? res : (res?.showtimes || []);
        console.log('Final showtimes list:', list.length, 'items');
        
        if (list.length > 0) {
          console.log('First showtime sample:', {
            movie: list[0].movie?.title,
            branch: list[0].branch?.name,
            startTime: list[0].startTime
          });
        }
        
        setShowtimes(list);
      } catch (e) {
        console.error('Error loading showtimes:', e);
        // ✅ Lỗi sẽ tự động được hiển thị bởi api.js
        setShowtimes([]);
      } finally {
        setLoading(false);
      }
    };
    loadShowtimes();
  }, [selectedMovie, selectedBranch, selectedDate]);

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>Showtimes</Title>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                type="primary" 
                onClick={async () => {
                  try {
                    console.log('Testing API...');
                    const res = await showtimeAPI.getShowtimes();
                    console.log('Direct API test result:', res);
                    alert(`API returned ${res?.showtimes?.length || 0} showtimes`);
                  } catch (e) {
                    console.error('API test failed:', e);
                    alert('API test failed: ' + e.message);
                  }
                }}
              >
                Test API
              </Button>
              <Button 
                onClick={() => {
                  console.log('Clearing all filters...');
                  setSelectedMovie('');
                  setSelectedBranch('');
                  setSelectedDate('');
                }}
              >
                Clear Filters
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    console.log('Loading all showtimes without filters...');
                    const res = await showtimeAPI.getShowtimes();
                    console.log('All showtimes:', res?.showtimes?.map(s => ({ 
                      id: s._id, 
                      movie: s.movie?.title, 
                      branch: s.branch?.name,
                      startTime: s.startTime 
                    })));
                    alert(`Found ${res?.showtimes?.length || 0} showtimes total`);
                  } catch (e) {
                    console.error('Error:', e);
                  }
                }}
              >
                Show All
              </Button>
            </div>
          </div>

          {/* Debug Info */}
          <Card style={{ background: '#2a2a2a', border: '1px solid #555', marginBottom: 16 }} bodyStyle={{ padding: 12 }}>
            <Text style={{ color: '#fff', fontSize: '12px' }}>
              Debug: Movies: {movies.length} | Branches: {branches.length} | Showtimes: {showtimes.length} | 
              Selected: Movie={selectedMovie || 'none'} ({movies.find(m => m._id === selectedMovie)?.title || 'unknown'}) | 
              Branch={selectedBranch || 'none'} | Date={selectedDate || 'none'}
            </Text>
          </Card>

          {/* Filters */}
          <Card style={{ background: '#1a1a1a', border: '1px solid #333', marginBottom: 24 }} bodyStyle={{ padding: 16 }}>
            <Row gutter={[16,16]}>
              <Col xs={24} md={8}>
                <Select value={selectedMovie} onChange={setSelectedMovie} placeholder="Movie" allowClear style={{ width: '100%' }}>
                  {movies.map(m => (
                    <Option key={m._id} value={m._id}>{m.title}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={8}>
                <Select value={selectedBranch} onChange={setSelectedBranch} placeholder="Branch" allowClear style={{ width: '100%' }}>
                  {branches.map(b => (
                    <Option key={b._id} value={b._id}>{b.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={8}>
                <DatePicker style={{ width: '100%' }} value={selectedDate ? dayjs(selectedDate) : null} onChange={(d)=> setSelectedDate(d ? d.format('YYYY-MM-DD') : '')} />
              </Col>
            </Row>
          </Card>

          {/* List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin /></div>
          ) : showtimes.length === 0 ? (
            <Empty description={<Text style={{ color: '#999' }}>No showtimes</Text>} style={{ marginTop: 48 }} />
          ) : (
            <>
              <Row gutter={[16,16]}>
                {showtimes.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(st => (
                  <Col xs={24} key={st._id}>
                    <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{st.movie?.title}</Text>
                          <div style={{ color: '#999', marginTop: 4 }}>{new Date(st.startTime).toLocaleString()} • {st.branch?.name} • {st.theater?.name}</div>
                        </Col>
                        <Col>
                          {st.isFirstShow && <Tag color="green">First show</Tag>}
                          {st.isLastShow && <Tag color="red">Last show</Tag>}
                          <Link to={`/realtime-booking/${st._id}`} style={{ marginLeft: 12, color: '#ff4d4f' }}>Book</Link>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
              </Row>
              
              {/* Pagination */}
              {showtimes.length > pageSize && (
                <div style={{ textAlign: 'center', marginTop: '48px' }}>
                  <Pagination
                    current={currentPage}
                    total={showtimes.length}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    showQuickJumper
                    showTotal={(total, range) => 
                      `${range[0]}-${range[1]} của ${total} suất chiếu`
                    }
                    style={{ color: '#fff' }}
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

export default ShowtimesPage;


