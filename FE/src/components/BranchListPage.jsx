import React, { useEffect, useState, useRef } from 'react';
import { 
  Layout, Typography, Row, Col, Card, Spin, Empty, Pagination, Button, 
  Input, Space, Tag, Modal, Divider, message
} from 'antd';
import { 
  SearchOutlined, EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined,
  StarFilled, CloseOutlined, EyeOutlined, ShoppingCartOutlined, ReloadOutlined
} from '@ant-design/icons';
import Header from './Header';
import Footer from './Footer';
import { branchAPI, showtimeAPI } from '../services/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Hàm tính khoảng cách giữa 2 điểm (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Component cho map trong modal
const BranchMapModal = ({ branch, mapId }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (window.L && branch.location?.coordinates && !mapRef.current) {
      const map = window.L.map(mapId, {
        center: [branch.location.coordinates.latitude, branch.location.coordinates.longitude],
        zoom: 15,
        zoomControl: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const marker = window.L.marker(
        [branch.location.coordinates.latitude, branch.location.coordinates.longitude]
      ).addTo(map);

      marker.bindPopup(`<strong>${branch.name}</strong><br/>${branch.location?.address || ''}`).openPopup();
      
      mapRef.current = map;

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, [branch, mapId]);

  return null;
};

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
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'name' | 'rating'
  const mapRef = useRef(null);
  const branchRefs = useRef({});
  const hasFittedBounds = useRef(false);
  const lastPageRef = useRef(1);
  const userLocationMarkerRef = useRef(null);

  // Load Leaflet (OpenStreetMap) - Miễn phí, không cần API key
  useEffect(() => {
    if (window.L) {
      setMapLoaded(true);
    } else {
      // Wait for Leaflet to load from CDN
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          setMapLoaded(true);
          clearInterval(checkLeaflet);
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkLeaflet);
        if (!window.L) {
          message.error({
            content: 'Không thể tải bản đồ. Vui lòng kiểm tra kết nối internet.',
            duration: 3,
            key: 'map-load-error'
          });
        }
      }, 5000);
    }
  }, []);

  // Get user location (manual trigger)
  const getUserLocation = (showNotification = true) => {
    if (!navigator.geolocation) {
      if (showNotification) {
        message.error({
          content: 'Trình duyệt của bạn không hỗ trợ Geolocation',
          duration: 3,
          key: 'geolocation-error'
        });
      }
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
        
        if (showNotification) {
          message.success({
            content: 'Đã lấy vị trí của bạn thành công!',
            duration: 2,
            key: 'location-success'
          });
        }
        
        // Fly to user location on map
        if (map && window.L) {
          setTimeout(() => {
            map.setView([latitude, longitude], 15, {
              animate: true,
              duration: 1.0
            });
          }, 100);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
        
        if (showNotification) {
          let errorMsg = 'Không thể lấy vị trí.';
          if (error.code === 1) {
            errorMsg = 'Bạn đã từ chối truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.';
          } else if (error.code === 2) {
            errorMsg = 'Không thể xác định vị trí. Vui lòng kiểm tra kết nối.';
          } else if (error.code === 3) {
            errorMsg = 'Hết thời gian chờ. Vui lòng thử lại.';
          }
          message.warning({
            content: errorMsg,
            duration: 3,
            key: 'location-warning'
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Fly to user location on map
  const flyToMyLocation = () => {
    if (userLocation && map && window.L) {
      map.setView([userLocation.lat, userLocation.lng], 15, {
        animate: true,
        duration: 1.0
      });
      message.info({
        content: 'Đã di chuyển đến vị trí của bạn',
        duration: 2,
        key: 'fly-to-location'
      });
    } else {
      // Nếu chưa có vị trí, lấy vị trí trước
      getUserLocation(true);
    }
  };

  // Request location permission on mount (chỉ một lần, không hiển thị notification)
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          // Không hiển thị notification khi tự động load
        },
        (error) => {
          // Không hiển thị notification khi tự động load thất bại
          console.log('Location not available:', error);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // Cache 5 phút
        }
      );
    }
  }, []);

  // Load branches and showtimes
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [brs, stsRes] = await Promise.all([
          branchAPI.getBranches(),
          showtimeAPI.getShowtimes(),
        ]);
        const branchesList = brs || [];
        
        // Calculate distances and add to branches
        const branchesWithDistance = branchesList.map(branch => {
          let distance = null;
          if (userLocation && branch.location?.coordinates?.latitude && branch.location?.coordinates?.longitude) {
            distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              branch.location.coordinates.latitude,
              branch.location.coordinates.longitude
            );
          }
          return { ...branch, distance };
        });

        // Sort by distance if available
        if (sortBy === 'distance' && userLocation) {
          branchesWithDistance.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        } else if (sortBy === 'name') {
          branchesWithDistance.sort((a, b) => a.name.localeCompare(b.name));
        }

        setBranches(branchesWithDistance);
        setFilteredBranches(branchesWithDistance);
        
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
  }, [userLocation, sortBy]);

  // Initialize Leaflet Map (OpenStreetMap)
  useEffect(() => {
    if (!mapLoaded || !window.L || map) return;
    
    // Đợi mapRef.current sẵn sàng với retry
    let retryCount = 0;
    const maxRetries = 30; // 3 giây
    let timeoutId = null;
    let isCleanedUp = false;
    
    const checkAndInit = () => {
      if (isCleanedUp || map) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        return;
      }
      
      if (!mapRef.current) {
        retryCount++;
        if (retryCount < maxRetries) {
          timeoutId = setTimeout(checkAndInit, 100);
          return;
        } else {
          console.error('Map container not found after retries');
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          return;
        }
      }
      
      // Clear timeout nếu đã tìm thấy container
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      const center = userLocation 
        ? [userLocation.lat, userLocation.lng]
        : branches.length > 0 && branches[0]?.location?.coordinates 
          ? [branches[0].location.coordinates.latitude, branches[0].location.coordinates.longitude]
          : [10.7769, 106.7009]; // Default: Ho Chi Minh City

      try {
        const leafletMap = window.L.map(mapRef.current, {
          center,
          zoom: userLocation ? 12 : 10,
          zoomControl: true,
          attributionControl: true
        });

        // Add OpenStreetMap tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(leafletMap);

        setMap(leafletMap);

        // Add user location marker (LỚN HƠN)
        if (userLocation) {
          const userIcon = window.L.divIcon({
            className: 'custom-user-marker',
            html: `
              <div style="
                background-color: #ff4d4f;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 4px solid white;
                box-shadow: 0 3px 12px rgba(255, 77, 79, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulse 2s infinite;
              ">
                <div style="
                  width: 12px;
                  height: 12px;
                  background-color: white;
                  border-radius: 50%;
                "></div>
              </div>
              <style>
                @keyframes pulse {
                  0% { box-shadow: 0 3px 12px rgba(255, 77, 79, 0.6); }
                  50% { box-shadow: 0 3px 20px rgba(255, 77, 79, 0.9); }
                  100% { box-shadow: 0 3px 12px rgba(255, 77, 79, 0.6); }
                }
              </style>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const userMarker = window.L.marker([userLocation.lat, userLocation.lng], { 
            icon: userIcon,
            zIndexOffset: 1000 // Luôn ở trên cùng
          })
            .addTo(leafletMap)
            .bindPopup('📍 Vị trí của bạn')
            .openPopup();
          
          userLocationMarkerRef.current = userMarker;
        }

        // Invalidate size sau khi map được tạo và khi container resize
        const invalidateSize = () => {
          if (leafletMap) {
            leafletMap.invalidateSize();
          }
        };
        
        // Invalidate nhiều lần để đảm bảo map render đúng
        setTimeout(invalidateSize, 100);
        setTimeout(invalidateSize, 300);
        setTimeout(invalidateSize, 500);
        setTimeout(invalidateSize, 1000);
        
        // Invalidate khi window resize
        window.addEventListener('resize', invalidateSize);
        
        return () => {
          window.removeEventListener('resize', invalidateSize);
        };
      } catch (error) {
        console.error('Error initializing map:', error);
        message.error({
          content: 'Không thể khởi tạo bản đồ. Vui lòng thử lại.',
          duration: 3,
          key: 'map-init-error'
        });
      }
    };

    // Thử khởi tạo ngay, nếu chưa sẵn sàng thì đợi
    const initTimer = setTimeout(() => {
      checkAndInit();
    }, 100);
    
    return () => {
      isCleanedUp = true;
      if (initTimer) clearTimeout(initTimer);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mapLoaded, userLocation, map, branches]);

  // Add branch markers to Leaflet map
  useEffect(() => {
    if (map && branches.length > 0 && window.L) {
      // Clear existing markers
      markers.forEach(marker => map.removeLayer(marker));
      const newMarkers = [];

      const paginatedBranches = filteredBranches.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      );

      paginatedBranches.forEach((branch) => {
        if (branch.location?.coordinates?.latitude && branch.location?.coordinates?.longitude) {
          const isHighlighted = highlightedBranchId === branch._id;
          const color = isHighlighted ? '#ff4d4f' : '#52c41a';
          
          // Create custom icon
          const customIcon = window.L.divIcon({
            className: 'custom-branch-marker',
            html: `
              <div style="
                background-color: ${color};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                transform: ${isHighlighted ? 'scale(1.2)' : 'scale(1)'};
              ">
                <div style="
                  width: 12px;
                  height: 12px;
                  background-color: white;
                  border-radius: 50%;
                "></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = window.L.marker(
            [branch.location.coordinates.latitude, branch.location.coordinates.longitude],
            { icon: customIcon }
          ).addTo(map);

          // Create popup content
          const popupContent = `
            <div style="color: #000; padding: 8px; min-width: 200px;">
              <strong style="font-size: 14px; color: #333;">${branch.name}</strong><br/>
              ${branch.distance ? `<span style="color: #666; font-size: 12px;">📍 Khoảng cách: ${branch.distance.toFixed(1)} km</span>` : ''}
              ${branch.location?.address ? `<br/><span style="color: #999; font-size: 11px;">${branch.location.address}</span>` : ''}
              <br/>
              <button 
                onclick="window.dispatchEvent(new CustomEvent('branchClick', { detail: '${branch._id}' }))"
                style="
                  margin-top: 8px;
                  padding: 6px 12px;
                  background: #ff4d4f;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                "
              >
                Xem chi tiết
              </button>
            </div>
          `;

          marker.bindPopup(popupContent);

          marker.on('click', () => {
            setSelectedBranch(branch);
            setModalVisible(true);
          });

          marker.on('mouseover', () => {
            setHighlightedBranchId(branch._id);
            marker.openPopup();
            // KHÔNG di chuyển map khi hover, chỉ mở popup
          });

          marker.on('mouseout', () => {
            setHighlightedBranchId(null);
            // Đóng popup sau một chút để user có thể đọc
            setTimeout(() => {
              marker.closePopup();
            }, 300);
          });

          newMarkers.push(marker);
        }
      });

      setMarkers(newMarkers);

      // Fit map to show all markers - CHỈ KHI THAY ĐỔI TRANG HOẶC LẦN ĐẦU, KHÔNG PHẢI KHI HOVER
      const pageChanged = lastPageRef.current !== currentPage;
      
      if (newMarkers.length > 0 && (!hasFittedBounds.current || pageChanged)) {
        try {
          const group = new window.L.featureGroup(newMarkers);
          // Thêm user location marker nếu có
          if (userLocationMarkerRef.current) {
            group.addLayer(userLocationMarkerRef.current);
          }
          const bounds = group.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
            hasFittedBounds.current = true;
          }
        } catch (error) {
          console.error('Error fitting map bounds:', error);
        }
      }
      
      // Update last page
      lastPageRef.current = currentPage;
    }
  }, [map, branches, filteredBranches, currentPage, userLocation]); // BỎ highlightedBranchId khỏi dependency

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
    return (4.0 + Math.random() * 1.5).toFixed(1);
  };

  const getReviewCount = (branch) => {
    return Math.floor(Math.random() * 500) + 50;
  };

  const getDistance = (branch) => {
    if (branch.distance !== null && branch.distance !== undefined) {
      return branch.distance.toFixed(1);
    }
    return 'N/A';
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
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <Button
                  type={userLocation ? 'default' : 'primary'}
                  icon={<EnvironmentOutlined />}
                  loading={locationLoading}
                  onClick={() => getUserLocation(true)}
                  style={{
                    borderRadius: '20px',
                    height: '36px'
                  }}
                >
                  {userLocation ? 'Cập nhật vị trí' : 'Lấy vị trí của tôi'}
                </Button>
                {userLocation && (
                  <>
                    <Button 
                      type="default"
                      icon={<EyeOutlined />}
                      onClick={flyToMyLocation}
                      style={{
                        borderRadius: '20px',
                        height: '36px',
                        border: '1px solid #52c41a',
                        color: '#52c41a',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Xem vị trí của tôi
                    </Button>
                    <Text style={{ color: '#999', fontSize: '12px' }}>
                      📍 Đã lấy vị trí
                              </Text>
                  </>
                )}
                      </div>
              
              <Space wrap style={{ justifyContent: 'center', width: '100%' }}>
                <Tag 
                  color={sortBy === 'distance' ? 'red' : 'default'}
                  onClick={() => setSortBy('distance')}
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
                  color={sortBy === 'name' ? 'red' : 'default'}
                  onClick={() => setSortBy('name')}
                  style={{ 
                    padding: '6px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    border: '1px solid #333'
                  }}
                >
                  Tên A-Z
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
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                  styles={{ body: { padding: 0, height: '100%' } }}
                >
                  <div
                    ref={mapRef}
                    id="branch-map-container"
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '800px',
                      borderRadius: '16px',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                  
                  {/* Floating button: Xem vị trí của tôi */}
                  {userLocation && mapLoaded && (
                          <Button 
                      type="primary"
                      icon={<EnvironmentOutlined />}
                      onClick={flyToMyLocation}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        zIndex: 1000,
                        background: '#52c41a',
                        border: 'none',
                        borderRadius: '8px',
                        height: '40px',
                        boxShadow: '0 4px 12px rgba(82, 196, 26, 0.4)',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Vị trí của tôi
                          </Button>
                        )}
                  
                  {!mapLoaded && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(26, 26, 26, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                      borderRadius: '16px'
                    }}>
                      <Spin size="large" />
                      </div>
                  )}
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
                            styles={{ body: { padding: '20px' } }}
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
                                    {distance !== 'N/A' ? `${distance} km` : 'Chưa xác định'}
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
        styles={{
          body: {
            background: '#1a1a1a',
            padding: '32px',
            borderRadius: '16px'
          }
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
                      {getDistance(selectedBranch)} {getDistance(selectedBranch) !== 'N/A' ? 'km' : ''}
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

            {/* Leaflet Map Embed */}
            {selectedBranch.location?.coordinates && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>
                  Vị trí trên bản đồ
                </Title>
                <div
                  id={`map-modal-${selectedBranch._id}`}
                  style={{
                    width: '100%',
                    height: '300px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    zIndex: 1
                  }}
                />
                {mapLoaded && window.L && (
                  <BranchMapModal
                    branch={selectedBranch}
                    mapId={`map-modal-${selectedBranch._id}`}
                  />
                )}
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
