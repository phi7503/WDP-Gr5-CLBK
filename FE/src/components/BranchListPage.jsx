import React, { useEffect, useState } from 'react';
import { Layout, Typography, Row, Col, Card, List, Spin, Empty, Pagination, Button } from 'antd';
import Header from './Header';
import Footer from './Footer';
import { branchAPI, showtimeAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const BranchListPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showtimesByBranch, setShowtimesByBranch] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6); // Show 6 branches per page

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [brs, stsRes] = await Promise.all([
          branchAPI.getBranches(),
          showtimeAPI.getShowtimes(),
        ]);
        setBranches(brs || []);
        const sts = stsRes?.showtimes || [];
        const map = {};
        for (const st of sts) {
          const bid = st.branch?._id;
          if (!bid) continue;
          if (!map[bid]) map[bid] = [];
          map[bid].push(st);
        }
        setShowtimesByBranch(map);
      } catch (e) {
        setBranches([]);
        setShowtimesByBranch({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: 24 }}>Branches</Title>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin /></div>
          ) : branches.length === 0 ? (
            <Empty description={<Text style={{ color: '#999' }}>No branches</Text>} />
          ) : (
            <>
              <Row gutter={[16,16]}>
                {branches.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(b => (
                  <Col xs={24} md={12} key={b._id}>
                    <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
                      <Title level={4} style={{ color: '#fff', margin: 0 }}>{b.name}</Title>
                      <Text style={{ color: '#999' }}>{b.location?.address || b.location}</Text>
                      <div style={{ marginTop: 12 }}>
                        <Text style={{ color: '#fff' }}>Upcoming showtimes ({(showtimesByBranch[b._id] || []).length})</Text>
                        <List
                          size="small"
                          dataSource={(showtimesByBranch[b._id] || []).slice(0, 8)}
                          renderItem={st => (
                            <List.Item style={{ borderColor: '#333' }}>
                              <Text style={{ color: '#ccc' }}>
                                {st.movie?.title} • {new Date(st.startTime).toLocaleString()} • {st.theater?.name}
                              </Text>
                            </List.Item>
                          )}
                        />
                        {(showtimesByBranch[b._id] || []).length > 8 && (
                          <Button 
                            type="link" 
                            style={{ color: '#ff4d4f', padding: 0 }}
                            onClick={() => {/* TODO: Navigate to branch detail */}}
                          >
                            View all showtimes →
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
              
              {/* Pagination */}
              {branches.length > pageSize && (
                <div style={{ textAlign: 'center', marginTop: '48px' }}>
                  <Pagination
                    current={currentPage}
                    total={branches.length}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    showQuickJumper
                    showTotal={(total, range) => 
                      `${range[0]}-${range[1]} của ${total} chi nhánh`
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

export default BranchListPage;


