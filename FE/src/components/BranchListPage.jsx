import React, { useEffect, useState, useRef } from 'react';
import { 
  Layout, Typography, Row, Col, Card, Spin, Empty, Pagination, Button, 
  Input, Space, Tag, Modal, Divider, List, Badge, Tooltip
} from 'antd';
import { 
  SearchOutlined, EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined,
  StarFilled, FireFilled, CloseOutlined, EyeOutlined, ShoppingCartOutlined
} from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { branchAPI, showtimeAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const BranchListPage = () => {
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showtimesByBranch, setShowtimesByBranch] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [highlightedBranchId, setHighlightedBranchId] = useState(null);
  const branchRefs = useRef({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [brs, stsRes] = await Promise.all([
          branchAPI.getBranches(),
          showtimeAPI.getShowtimes(),
        ]);
        const branchesList = brs || [];
        setBranches(branchesList);
        setFilteredBranches(branchesList);
        
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
        console.error('Error loading branches:', e);
        setBranches([]);
        setFilteredBranches([]);
        setShowtimesByBranch({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter branches by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBranches(branches);
      setCurrentPage(1);
      return;
    }
    const filtered = branches.filter(branch =>
      branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBranches(filtered);
    setCurrentPage(1);
  }, [searchTerm, branches]);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
    setModalVisible(true);
  };

  const handleCardHover = (branchId) => {
    setHighlightedBranchId(branchId);
  };

  const handleCardLeave = () => {
    setHighlightedBranchId(null);
  };

  const getTodayShowtimes = (branchId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const showtimes = showtimesByBranch[branchId] || [];
    return showtimes
      .filter(st => {
        const stDate = new Date(st.startTime);
        return stDate >= today && stDate < tomorrow;
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 3);
  };

  const getBranchRating = (branch) => {
    // Mock rating - in real app, this would come from reviews
    return (4.0 + Math.random() * 1.5).toFixed(1);
  };

  const getReviewCount = (branch) => {
    // Mock review count
    return Math.floor(Math.random() * 500) + 50;
  };

  const getDistance = (branch) => {
    // Mock distance - in real app, calculate from user location
    return (Math.random() * 15 + 0.5).toFixed(1);
  };

  const paginatedBranches = filteredBranches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <Layout style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '0' }}>
        {/* Header Section - Search & Filters */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
          padding: '40px 24px',
          borderBottom: '1px solid #333'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <Title level={1} style={{ 
              color: '#fff', 
              marginBottom: '32px',
              fontSize: '36px',
              fontWeight: '700',
              textAlign: 'center'
            }}>
              Danh sách chi nhánh
            </Title>
            
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Search
                placeholder="Tìm kiếm theo tên rạp, địa chỉ..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  marginBottom: '24px'
                }}
              />
              
              <Space wrap style={{ justifyContent: 'center', width: '100%' }}>
                <Tag 
                  color="default" 
                  style={{ 
                    padding: '6px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    border: '1px solid #333'
                  }}
                >
                  Tất cả
                </Tag>
                <Tag 
                  color="default" 
                  style={{ 
                    padding: '6px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    border: '1px solid #333'
                  }}
                >
                  Gần nhất
                </Tag>
                <Tag 
                  color="default" 
                  style={{ 
                    padding: '6px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    border: '1px solid #333'
                  }}
                >
                  ⭐ 4.0+
                </Tag>
                <Tag 
                  color="default" 
                  style={{ 
                    padding: '6px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    border: '1px solid #333'
                  }}
                >
                  IMAX
                </Tag>
                <Tag 
                  color="default" 
                  style={{ 
                    padding: '6px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    border: '1px solid #333'
                  }}
                >
                  3D
                </Tag>
                <Tag 
                  color="default" 
                  style={{ 
                    padding: '6px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    border: '1px solid #333'
                  }}
                >
                  VIP
                </Tag>
              </Space>
            </div>
          </div>
        </div>

        {/* Main Content - Map & List Layout */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '120px 0' }}>
              <Spin size="large" />
            </div>
          ) : filteredBranches.length === 0 ? (
            <Empty 
              description={<Text style={{ color: '#999', fontSize: '16px' }}>Không tìm thấy chi nhánh nào</Text>} 
              style={{ padding: '120px 0' }}
            />
          ) : (
            <Row gutter={[24, 24]}>
              {/* Map Section - 60% */}
              <Col xs={24} lg={14}>
                <Card 
                  style={{ 
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    height: '800px',
                    overflow: 'hidden'
                  }}
                  bodyStyle={{ padding: 0, height: '100%' }}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    border: '1px solid #333',
                    borderRadius: '16px'
                  }}>
                    {/* Placeholder for Google Maps - Replace with actual Google Maps integration */}
                    <div style={{ textAlign: 'center', color: '#666' }}>
                      <EnvironmentOutlined style={{ fontSize: '64px', marginBottom: '16px', color: '#ff4d4f' }} />
                      <Text style={{ color: '#999', fontSize: '16px', display: 'block' }}>
                        Bản đồ tương tác
                      </Text>
                      <Text style={{ color: '#666', fontSize: '14px', display: 'block', marginTop: '8px' }}>
                        Tích hợp Google Maps API để hiển thị vị trí các chi nhánh
                      </Text>
                    </div>
                    
                    {/* Map pins overlay - would be positioned based on coordinates */}
                    {paginatedBranches.map((branch, index) => (
                      <Tooltip 
                        key={branch._id}
                        title={`${branch.name} - ${getDistance(branch)}km`}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: `${20 + (index % 3) * 30}%`,
                            top: `${30 + Math.floor(index / 3) * 25}%`,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            transform: highlightedBranchId === branch._id ? 'scale(1.2)' : 'scale(1)',
                            zIndex: highlightedBranchId === branch._id ? 10 : 1
                          }}
                          onMouseEnter={() => handleCardHover(branch._id)}
                          onMouseLeave={handleCardLeave}
                        >
                          <EnvironmentOutlined 
                            style={{ 
                              fontSize: '32px',
                              color: highlightedBranchId === branch._id ? '#ff4d4f' : '#52c41a',
                              filter: highlightedBranchId === branch._id ? 'drop-shadow(0 0 8px rgba(255, 77, 79, 0.8))' : 'none'
                            }} 
                          />
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </Card>
              </Col>

              {/* Branch List Section - 40% */}
              <Col xs={24} lg={10}>
                <div style={{ 
                  maxHeight: '800px',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {paginatedBranches.length === 0 ? (
                    <Empty description={<Text style={{ color: '#999' }}>Không có chi nhánh</Text>} />
                  ) : (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      {paginatedBranches.map((branch) => {
                        const rating = getBranchRating(branch);
                        const reviewCount = getReviewCount(branch);
                        const distance = getDistance(branch);
                        const todayShowtimes = getTodayShowtimes(branch._id);
                        const facilities = branch.facilities || [];

                        return (
                          <Card
                            key={branch._id}
                            ref={(el) => (branchRefs.current[branch._id] = el)}
                            hoverable
                            style={{
                              background: highlightedBranchId === branch._id 
                                ? 'linear-gradient(135deg, #252525 0%, #1a1a1a 100%)'
                                : 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                              border: highlightedBranchId === branch._id 
                                ? '2px solid #ff4d4f' 
                                : '1px solid #333',
                              borderRadius: '16px',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'default',
                              boxShadow: highlightedBranchId === branch._id 
                                ? '0 8px 24px rgba(255, 77, 79, 0.3)' 
                                : 'none'
                            }}
                            bodyStyle={{ padding: '20px' }}
                            onMouseEnter={() => handleCardHover(branch._id)}
                            onMouseLeave={handleCardLeave}
                          >
                            {/* Branch Header */}
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Title 
                                  level={4} 
                                  style={{ 
                                    color: '#fff', 
                                    margin: 0,
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    flex: 1
                                  }}
                                >
                                  {branch.name}
                                </Title>
                                {branch.cinemaChain && (
                                  <Tag 
                                    color="red" 
                                    style={{ 
                                      marginLeft: '8px',
                                      borderRadius: '12px',
                                      border: 'none',
                                      fontWeight: '600'
                                    }}
                                  >
                                    {branch.cinemaChain}
                                  </Tag>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                {/* Rating */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <StarFilled style={{ color: '#ffd700', fontSize: '16px' }} />
                                  <Text style={{ color: '#ffd700', fontSize: '14px', fontWeight: '600' }}>
                                    {rating}
                                  </Text>
                                  <Text style={{ color: '#999', fontSize: '12px', marginLeft: '4px' }}>
                                    ({reviewCount})
                                  </Text>
                                </div>

                                {/* Distance */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <EnvironmentOutlined style={{ color: '#ff4d4f', fontSize: '14px' }} />
                                  <Text style={{ color: '#999', fontSize: '13px' }}>
                                    {distance} km
                                  </Text>
                                </div>

                                {/* Operating Hours */}
                                {branch.operatingHours && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ClockCircleOutlined style={{ color: '#999', fontSize: '14px' }} />
                                    <Text style={{ color: '#999', fontSize: '13px' }}>
                                      {branch.operatingHours.open} - {branch.operatingHours.close}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Address & Contact */}
                            <div style={{ marginBottom: '16px' }}>
                              <Text style={{ color: '#999', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                <EnvironmentOutlined style={{ marginRight: '6px' }} />
                                {branch.location?.address || branch.location}
                              </Text>
                              {branch.contact?.phone && (
                                <Text style={{ color: '#999', fontSize: '13px', display: 'block' }}>
                                  <PhoneOutlined style={{ marginRight: '6px' }} />
                                  {branch.contact.phone}
                                </Text>
                              )}
                            </div>

                            {/* Today's Showtimes */}
                            {todayShowtimes.length > 0 && (
                              <div style={{ marginBottom: '16px', padding: '12px', background: '#0a0a0a', borderRadius: '8px' }}>
                                <Text style={{ color: '#fff', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                                  🎬 Suất chiếu hôm nay:
                                </Text>
                                <Space size="small" wrap>
                                  {todayShowtimes.map((st, idx) => (
                                    <Tag 
                                      key={idx}
                                      color="blue"
                                      style={{ 
                                        margin: '2px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        fontSize: '12px'
                                      }}
                                    >
                                      {st.movie?.title || 'Phim'} - {new Date(st.startTime).toLocaleTimeString('vi-VN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </Tag>
                                  ))}
                                  {(showtimesByBranch[branch._id] || []).length > 3 && (
                                    <Tag 
                                      color="default"
                                      style={{ 
                                        margin: '2px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        fontSize: '12px'
                                      }}
                                    >
                                      +{(showtimesByBranch[branch._id] || []).length - 3} suất khác
                                    </Tag>
                                  )}
                                </Space>
                              </div>
                            )}

                            {/* Facilities */}
                            {facilities.length > 0 && (
                              <div style={{ marginBottom: '16px' }}>
                                <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                                  🛎️ Dịch vụ:
                                </Text>
                                <Space size="small" wrap>
                                  {facilities.slice(0, 5).map((facility, idx) => (
                                    <Tag 
                                      key={idx}
                                      color="cyan"
                                      style={{ 
                                        margin: '2px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontSize: '11px',
                                        padding: '2px 8px'
                                      }}
                                    >
                                      {facility}
                                    </Tag>
                                  ))}
                                  {facilities.length > 5 && (
                                    <Tag 
                                      color="default"
                                      style={{ 
                                        margin: '2px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontSize: '11px',
                                        padding: '2px 8px'
                                      }}
                                    >
                                      +{facilities.length - 5}
                                    </Tag>
                                  )}
                                </Space>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                              <Button
                                type="default"
                                icon={<EyeOutlined />}
                                onClick={() => handleBranchClick(branch)}
                                style={{
                                  flex: 1,
                                  background: '#333',
                                  border: '1px solid #555',
                                  color: '#fff',
                                  borderRadius: '8px',
                                  height: '40px'
                                }}
                              >
                                Chi tiết
                              </Button>
                              <Button
                                type="primary"
                                icon={<ShoppingCartOutlined />}
                                onClick={() => window.location.href = `/showtimes?branch=${branch._id}`}
                                style={{
                                  flex: 1,
                                  background: '#ff4d4f',
                                  border: 'none',
                                  borderRadius: '8px',
                                  height: '40px',
                                  fontWeight: '600'
                                }}
                              >
                                Đặt vé
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </Space>
                  )}
                </div>
              </Col>
            </Row>
          )}

          {/* Pagination */}
          {filteredBranches.length > pageSize && (
            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <Pagination
                current={currentPage}
                total={filteredBranches.length}
                pageSize={pageSize}
                onChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                showQuickJumper
                showTotal={(total, range) => 
                  <Text style={{ color: '#999' }}>
                    {range[0]}-{range[1]} của {total} chi nhánh
                  </Text>
                }
                style={{ color: '#fff' }}
              />
            </div>
          )}
        </div>
      </Content>

      {/* Branch Detail Modal */}
      <Modal
        title={null}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
        closeIcon={<CloseOutlined style={{ color: '#fff' }} />}
        style={{ top: 20 }}
        bodyStyle={{
          background: '#1a1a1a',
          padding: '32px',
          borderRadius: '16px'
        }}
      >
        {selectedBranch && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: '8px' }}>
                  {selectedBranch.name}
                </Title>
                {selectedBranch.cinemaChain && (
                  <Tag color="red" style={{ borderRadius: '12px', border: 'none', fontWeight: '600' }}>
                    {selectedBranch.cinemaChain}
                  </Tag>
                )}
              </div>
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => {
                  setModalVisible(false);
                  window.location.href = `/showtimes?branch=${selectedBranch._id}`;
                }}
                style={{
                  background: '#ff4d4f',
                  border: 'none',
                  borderRadius: '8px',
                  height: '40px',
                  fontWeight: '600'
                }}
              >
                Đặt vé ngay
              </Button>
            </div>

            <Divider style={{ borderColor: '#333', margin: '24px 0' }} />

            {/* Rating & Info */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#0a0a0a', borderRadius: '12px' }}>
                  <StarFilled style={{ color: '#ffd700', fontSize: '24px', marginBottom: '8px' }} />
                  <div>
                    <Text style={{ color: '#ffd700', fontSize: '20px', fontWeight: '700' }}>
                      {getBranchRating(selectedBranch)}
                    </Text>
                    <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {getReviewCount(selectedBranch)} đánh giá
                    </Text>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#0a0a0a', borderRadius: '12px' }}>
                  <EnvironmentOutlined style={{ color: '#ff4d4f', fontSize: '24px', marginBottom: '8px' }} />
                  <div>
                    <Text style={{ color: '#fff', fontSize: '16px', fontWeight: '600', display: 'block' }}>
                      {getDistance(selectedBranch)} km
                    </Text>
                    <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Từ vị trí của bạn
                    </Text>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#0a0a0a', borderRadius: '12px' }}>
                  <ClockCircleOutlined style={{ color: '#52c41a', fontSize: '24px', marginBottom: '8px' }} />
                  <div>
                    <Text style={{ color: '#fff', fontSize: '14px', fontWeight: '600', display: 'block' }}>
                      {selectedBranch.operatingHours?.open || '09:00'} - {selectedBranch.operatingHours?.close || '23:00'}
                    </Text>
                    <Text style={{ color: '#999', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Giờ mở cửa
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Address & Contact */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={4} style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>
                Địa chỉ & Liên hệ
              </Title>
              <Paragraph style={{ color: '#999', marginBottom: '8px' }}>
                <EnvironmentOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
                {selectedBranch.location?.address || selectedBranch.location}
                {selectedBranch.location?.city && `, ${selectedBranch.location.city}`}
                {selectedBranch.location?.province && `, ${selectedBranch.location.province}`}
              </Paragraph>
              {selectedBranch.contact?.phone && (
                <Paragraph style={{ color: '#999', marginBottom: '8px' }}>
                  <PhoneOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
                  {selectedBranch.contact.phone}
                </Paragraph>
              )}
              {selectedBranch.contact?.email && (
                <Paragraph style={{ color: '#999' }}>
                  📧 {selectedBranch.contact.email}
                </Paragraph>
              )}
            </div>

            {/* Facilities */}
            {selectedBranch.facilities && selectedBranch.facilities.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>
                  Dịch vụ & Tiện ích
                </Title>
                <Space size="small" wrap>
                  {selectedBranch.facilities.map((facility, idx) => (
                    <Tag 
                      key={idx}
                      color="cyan"
                      style={{ 
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '13px',
                        padding: '4px 12px'
                      }}
                    >
                      {facility}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* Google Maps Embed */}
            {selectedBranch.location?.coordinates && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>
                  Vị trí trên bản đồ
                </Title>
                <div style={{
                  width: '100%',
                  height: '300px',
                  background: '#0a0a0a',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #333'
                }}>
                  <div style={{ textAlign: 'center', color: '#666' }}>
                    <EnvironmentOutlined style={{ fontSize: '48px', marginBottom: '12px', color: '#ff4d4f' }} />
                    <Text style={{ color: '#999', fontSize: '14px', display: 'block' }}>
                      Tích hợp Google Maps API
                    </Text>
                    <Text style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Lat: {selectedBranch.location.coordinates.latitude}, 
                      Lng: {selectedBranch.location.coordinates.longitude}
                    </Text>
                  </div>
                </div>
              </div>
            )}

            {/* Theaters Count */}
            {selectedBranch.theaters && (
              <div>
                <Text style={{ color: '#999', fontSize: '13px' }}>
                  Số phòng chiếu: <Text style={{ color: '#fff', fontWeight: '600' }}>{selectedBranch.theaters.length}</Text>
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Footer />
    </Layout>
  );
};

export default BranchListPage;
