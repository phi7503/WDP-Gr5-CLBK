import React from 'react';
import { Card, Button, Rate, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Text, Title } = Typography;

const MovieCard = ({ movie }) => {
  return (
    <Card
      className="movie-card"
      hoverable
      style={{ 
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      cover={
        <div style={{ position: 'relative', height: '300px', overflow: 'hidden' }}>
          <img
            alt={movie.title}
            src={movie.poster ? `http://localhost:5000/${movie.poster}` : 'https://via.placeholder.com/300x400/333/fff?text=Movie+Poster'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      }
      actions={[
        <div key="actions" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 16px'
        }}>
          <Button 
            type="primary" 
            className="primary-button"
            style={{ flex: 1, marginRight: '8px' }}
          >
            <Link to={`/movie/${movie._id}`} style={{ color: 'white', textDecoration: 'none' }}>
              Buy Ticket
            </Link>
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Rate 
              disabled 
              value={movie.rating || 4.5} 
              style={{ fontSize: '14px' }}
            />
            <Text style={{ color: '#fff', fontSize: '14px' }}>
              {movie.rating || 4.5}
            </Text>
          </div>
        </div>
      ]}
    >
      <Card.Meta
        title={
          <Title level={5} style={{ color: '#fff', margin: 0 }}>
            {movie.title}
          </Title>
        }
        description={
          <div>
            <Text style={{ color: '#999', fontSize: '12px' }}>
              {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '2018'} - 
              {movie.genre ? movie.genre.join(', ') : 'Action, Adventure'} - 
              {movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : '2h 8m'}
            </Text>
          </div>
        }
      />
    </Card>
  );
};

export default MovieCard;
