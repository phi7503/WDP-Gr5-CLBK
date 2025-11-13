import React from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { Event } from '@mui/icons-material';

const ShowtimeSelection = ({ showtimes, selectedShowtime, onSelectShowtime, selectedMovie }) => {
  const formatShowtime = (startTime) => {
    return new Date(startTime).toLocaleString("vi-VN", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const getDateGroup = (startTime) => {
    return new Date(startTime).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const groupedShowtimes = showtimes.reduce((groups, showtime) => {
    const date = getDateGroup(showtime.startTime);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(showtime);
    return groups;
  }, {});

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
        <Event sx={{ color: '#dc2626', mr: 1, fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
          Chọn suất chiếu
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
        Lựa chọn thời gian phù hợp
      </Typography>

      {/* Selected Movie Display */}
      {selectedMovie && (
        <Card sx={{ 
          bgcolor: '#2a2a2a', 
          border: '1px solid #dc2626', 
          borderRadius: 2, 
          mb: 3,
          p: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 60,
                height: 80,
                backgroundImage: `url(${selectedMovie.poster?.startsWith('http') ? selectedMovie.poster : `http://localhost:5000/${selectedMovie.poster?.replace(/^\/+/, '')}`})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 1,
                mr: 2
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                {selectedMovie.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                Phim đã chọn
              </Typography>
            </Box>
          </Box>
        </Card>
      )}

      {/* Showtime Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Object.entries(groupedShowtimes).map(([date, showtimesOfDate]) => (
          <Box key={date}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              {date}
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 2 
              }}
            >
              {showtimesOfDate
                .filter(showtime => new Date(showtime.startTime) > new Date())
                .map((showtime) => (
                <Card
                  key={showtime._id}
                  onClick={() => onSelectShowtime(showtime)}
                  sx={{
                    bgcolor: '#2a2a2a',
                    border: selectedShowtime?._id === showtime._id ? '2px solid #dc2626' : '1px solid #dc2626',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      borderColor: '#ef4444',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}
                      >
                        {formatShowtime(showtime.startTime).split(' ')[0]}
                      </Typography>
                      <Chip 
                        label="available" 
                        size="small" 
                        sx={{ 
                          bgcolor: '#3b82f6', 
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }} 
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                      Rạp: {showtime.branch?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                      Phòng: {showtime.theater?.name}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ShowtimeSelection;