import React from 'react';

const MovieSelection = ({ movies, selectedMovie, onSelectMovie }) => {
  return (
    <div className="bg-gray-900 border border-red-600 rounded-lg p-6 min-h-[500px]">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-7 h-7 bg-red-600 rounded mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">
          Chọn phim
        </h2>
      </div>
      
      <p className="text-gray-400 mb-6">
        Khám phá những bộ phim đang chiếu
      </p>

      {/* Movie Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {movies.map((movie) => (
          <div
            key={movie._id}
            onClick={() => onSelectMovie(movie)}
            className={`bg-gray-800 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-red-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30 ${
              selectedMovie?._id === movie._id 
                ? 'border-red-600 shadow-lg shadow-red-600/30' 
                : 'border-red-600'
            }`}
          >
            {/* Movie Poster */}
            <div
              className="h-48 bg-cover bg-center rounded-t-lg relative"
              style={{
                backgroundImage: `url(${movie.poster?.startsWith('http') ? movie.poster : `http://localhost:5000/${movie.poster?.replace(/^\/+/, '')}`})`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-t-lg"></div>
            </div>
            
            {/* Movie Title */}
            <div className="p-4">
              <h3 className="text-white font-bold text-center text-sm leading-tight">
                {movie.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieSelection;
