import React from 'react';
import { Card, Button, Rate, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { FireFilled, PlayCircleOutlined, HeartOutlined } from '@ant-design/icons';
import '../movie-card-animations.css';
import '../cinema-brand.css';
import { BACKEND_URL } from '../services/api';

const { Text, Title } = Typography;

const MovieCard = ({ movie, trending = false, comingSoon = false }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/movie/${movie._id}`);
  };

  return (
    <Card
      className="movie-card cinema-card cinema-fade-in"
      hoverable
      onClick={handleCardClick}
      style={{ 
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px var(--shadow-primary)'
      }}
      cover={
        <div style={{ position: 'relative', height: '340px', overflow: 'hidden' }}>
          {/* Badge for Trending */}
          {trending && (
            <div className="trending-badge cinema-badge-hot">
              <FireFilled /> TRENDING
            </div>
          )}
          
          {/* Badge for Coming Soon */}
          {comingSoon && (
            <div className="coming-soon-badge cinema-badge-premium">
              ⭐ COMING SOON
            </div>
          )}
          
          <img
            alt={movie.title}
            src={movie.poster ? `${BACKEND_URL}/${movie.poster}` : 'https://via.placeholder.com/300x450/111/fff?text=Movie+Poster'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
          />
          
          {/* Hover Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none'
          }} className="movie-overlay">
            <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>
              <PlayCircleOutlined style={{ fontSize: '48px', marginBottom: '8px', color: 'var(--primary-red)' }} />
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Xem chi tiết</div>
            </div>
          </div>
          
          {/* Gradient Overlay on Hover */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, transparent 100%)',
            opacity: 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none'
          }} className="card-gradient-overlay" />
        </div>
      }
    >
      <div style={{ padding: '20px' }}>
        {/* Movie Title */}
        <Link to={`/movie/${movie._id}`} style={{ textDecoration: 'none' }}>
          <Title level={5} className="cinema-title movie-title-link" style={{ 
            margin: '0 0 12px 0',
            fontSize: '17px',
            fontWeight: '700',
            lineHeight: '1.3',
            transition: 'color 0.3s ease'
          }}>
            {movie.title}
          </Title>
        </Link>
        
        {/* Rating and Info */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '12px'
        }}>
          <Rate 
            disabled 
            value={movie.rating || 4.5} 
            style={{ fontSize: '14px', color: 'var(--accent-gold)' }}
          />
          <Text className="cinema-accent-text" style={{ fontSize: '14px', fontWeight: '600' }}>
            {movie.rating || 4.5}
          </Text>
        </div>
        
        {/* Genre and Duration */}
        <Text className="cinema-text" style={{ 
          fontSize: '13px',
          display: 'block',
          marginBottom: '16px'
        }}>
          {movie.genre?.slice(0, 2).join(' • ') || 'Action • Adventure'} • {movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : '2h 8m'}
        </Text>
        
        {/* Book Button */}
        <Link to={`/movie/${movie._id}`}>
          <Button 
            type="primary" 
            block
            className="cinema-primary-button movie-book-button"
            style={{ 
              borderRadius: '8px',
              height: '42px',
              fontWeight: '600',
              fontSize: '15px'
            }}
          >
            {comingSoon ? '🔔 Notify Me' : '🎟️ Book Now'}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default MovieCard;
