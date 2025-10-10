import React, { useEffect, useState } from 'react';
import { Layout, Typography, Row, Col, Card, Select, DatePicker, Spin, Empty, Tag } from 'antd';
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

  const [selectedMovie, setSelectedMovie] = useState(searchParams.get('movie') || '');
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get('branch') || '');
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '');

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [moviesRes, branchesRes] = await Promise.all([
          movieAPI.getMovies({ limit: 100 }),
          branchAPI.getBranches(),
        ]);
        setMovies(moviesRes?.movies || []);
        setBranches(branchesRes || []);
      } catch (e) {
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
        const res = await showtimeAPI.getShowtimes();
        let list = res?.showtimes || [];
        if (selectedMovie) list = list.filter(s => s.movie?._id === selectedMovie);
        if (selectedBranch) list = list.filter(s => s.branch?._id === selectedBranch);
        if (selectedDate) {
          const d0 = new Date(selectedDate);
          d0.setHours(0,0,0,0);
          const d1 = new Date(selectedDate);
          d1.setHours(23,59,59,999);
          list = list.filter(s => {
            const st = new Date(s.startTime);
            return st >= d0 && st <= d1;
          });
        }
        setShowtimes(list);
      } catch (e) {
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
          <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>Showtimes</Title>

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
            <Row gutter={[16,16]}>
              {showtimes.map(st => (
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
                        <Link to={`/booking/${st._id}`} style={{ marginLeft: 12, color: '#ff4d4f' }}>Book</Link>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default ShowtimesPage;


