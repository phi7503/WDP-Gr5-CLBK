import React from 'react';
import { Card, Button, Rate, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { FireFilled } from '@ant-design/icons';

const { Text, Title } = Typography;

const MovieCard = ({ movie, trending = false, comingSoon = false }) => {
  return (
    <Card
      className="movie-card"
      hoverable
      style={{ 
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
      cover={
        <div style={{ position: 'relative', height: '340px', overflow: 'hidden' }}>
          {/* Badge for Trending */}
          {trending && (
            <div className="trending-badge">
              <FireFilled /> TRENDING
            </div>
          )}
          
          {/* Badge for Coming Soon */}
          {comingSoon && (
            <div className="coming-soon-badge">
              ⭐ COMING SOON
            </div>
          )}
          
          <img
            alt={movie.title}
            src={movie.poster ? `http://localhost:5000/${movie.poster}` : 'https://via.placeholder.com/300x450/111/fff?text=Movie+Poster'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
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
          <Title level={5} style={{ 
            color: '#fff', 
            margin: '0 0 12px 0',
            fontSize: '17px',
            fontWeight: '700',
            lineHeight: '1.3',
            transition: 'color 0.3s ease'
          }}
          className="movie-title-link">
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
            style={{ fontSize: '14px', color: '#fadb14' }}
          />
          <Text style={{ color: '#fadb14', fontSize: '14px', fontWeight: '600' }}>
            {movie.rating || 4.5}
          </Text>
        </div>
        
        {/* Genre and Duration */}
        <Text style={{ 
          color: '#9ca3af', 
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
            className="movie-book-button"
            style={{ 
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              border: 'none',
              borderRadius: '8px',
              height: '42px',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
