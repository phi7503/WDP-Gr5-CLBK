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
    <div className="bg-gray-900 border border-red-600 rounded-lg p-6 min-h-[500px]">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-7 h-7 bg-red-600 rounded mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">
          Chọn suất chiếu
        </h2>
      </div>
      
      <p className="text-gray-400 mb-6">
        Lựa chọn thời gian phù hợp
      </p>

      {/* Selected Movie Display */}
      {selectedMovie && (
        <div className="bg-gray-800 border border-red-600 rounded-lg mb-6 p-4">
          <div className="flex items-center">
            <div
              className="w-15 h-20 bg-cover bg-center rounded mr-4"
              style={{
                backgroundImage: `url(${selectedMovie.poster?.startsWith('http') ? selectedMovie.poster : `http://localhost:5000/${selectedMovie.poster?.replace(/^\/+/, '')}`})`
              }}
            />
            <div>
              <h3 className="text-lg font-bold text-white">
                {selectedMovie.title}
              </h3>
              <p className="text-gray-400 text-sm">
                Phim đã chọn
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Showtime Grid */}
      <div className="flex flex-col gap-6">
        {Object.entries(groupedShowtimes).map(([date, showtimesOfDate]) => (
          <div key={date}>
            <h3 className="text-lg font-semibold text-white mb-4">
              {date}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showtimesOfDate
                .filter(showtime => new Date(showtime.startTime) > new Date())
                .map((showtime) => (
                <div
                  key={showtime._id}
                  onClick={() => onSelectShowtime(showtime)}
                  className={`bg-gray-800 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-red-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30 ${
                    selectedShowtime?._id === showtime._id 
                      ? 'border-red-600 shadow-lg shadow-red-600/30' 
                      : 'border-red-600'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-bold text-white">
                        {formatShowtime(showtime.startTime).split(' ')[0]}
                      </h4>
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        available
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-1">
                      Rạp: {showtime.branch?.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Phòng: {showtime.theater?.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowtimeSelection;
