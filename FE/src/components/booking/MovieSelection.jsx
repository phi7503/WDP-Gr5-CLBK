import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { MovieFilter } from '@mui/icons-material';

const MovieSelection = ({ movies, selectedMovie, onSelectMovie }) => {
  return (
    <Box 
      sx={{ 
        bgcolor: '#1a1a1a', 
        border: '1px solid #dc2626', 
        borderRadius: 2, 
        p: 3,
        minHeight: '500px'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MovieFilter sx={{ color: '#dc2626', mr: 1, fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
          Chọn phim
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
        Khám phá những bộ phim đang chiếu
      </Typography>

      {/* Movie Grid */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 2 
        }}
      >
        {movies.map((movie) => (
          <Card
            key={movie._id}
            onClick={() => onSelectMovie(movie)}
            sx={{
              bgcolor: '#2a2a2a',
              border: selectedMovie?._id === movie._id ? '2px solid #dc2626' : '1px solid #dc2626',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#ef4444',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)'
              }
            }}
          >
            {/* Movie Poster */}
            <Box
              sx={{
                height: 200,
                backgroundImage: `url(${movie.poster?.startsWith('http') ? movie.poster : `http://localhost:5000/${movie.poster?.replace(/^\/+/, '')}`})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px 8px 0 0',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
                  borderRadius: '8px 8px 0 0'
                }
              }}
            />
            
            {/* Movie Title */}
            <CardContent sx={{ p: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: '1rem',
                  lineHeight: 1.3
                }}
              >
                {movie.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default MovieSelection;
