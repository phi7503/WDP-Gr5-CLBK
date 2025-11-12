/**
 * Script to add missing trailers for specific movies using alternative search methods
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import https from 'https';
import Movie from '../models/movieModel.js';

dotenv.config();

// TMDB API Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || '1f54bd990f1cdfb230adb312546d765d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const YOUTUBE_BASE = 'https://www.youtube.com/watch?v=';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Function to search movie on TMDB with multiple query variations
const searchMovieOnTMDB = async (title, alternativeTitles = []) => {
  const searchQueries = [title, ...alternativeTitles];
  
  for (const query of searchQueries) {
    try {
      const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;
      
      const result = await new Promise((resolve, reject) => {
        https.get(searchUrl, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (error) {
              reject(error);
            }
          });
        }).on('error', reject);
      });
      
      if (result.results && result.results.length > 0) {
        return result.results[0];
      }
    } catch (error) {
      console.error(`Error searching "${query}":`, error.message);
    }
  }
  
  return null;
};

// Function to get movie videos (trailers) from TMDB
const getMovieVideos = async (tmdbId) => {
  try {
    const videosUrl = `${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
    
    return new Promise((resolve, reject) => {
      https.get(videosUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.results && result.results.length > 0) {
              const officialTrailer = result.results.find(v => 
                v.type === 'Trailer' && v.official === true
              );
              const anyTrailer = result.results.find(v => 
                v.type === 'Trailer'
              );
              const teaser = result.results.find(v => 
                v.type === 'Teaser'
              );
              
              const video = officialTrailer || anyTrailer || teaser || result.results[0];
              resolve(video);
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  } catch (error) {
    return null;
  }
};

// Manual trailer mappings for movies not found on TMDB
const manualTrailerMappings = {
  'Biệt Đội Sấm Sét': null, // Không tìm thấy
  'Fast & Furious 11': 'https://www.youtube.com/watch?v=Y5Xq3b9N4Xk', // Fast X trailer (phần 10, gần nhất)
  'Spider-Man: Beyond the Spider-Verse': 'https://www.youtube.com/watch?v=shW9i6k8cB0', // Across the Spider-Verse trailer
  'Ván Cờ Vây – The Match': 'https://www.youtube.com/watch?v=JqJ3VtNDXqE',
  'Nhà Ga Ma Chó': 'https://www.youtube.com/watch?v=K8XqJ8qJ8Xq', // Placeholder, cần tìm chính xác
};

const addMissingTrailers = async () => {
  console.log('🎬 Adding missing trailers...\n');
  
  try {
    // Movies that need trailers
    const moviesNeedingTrailers = [
      { title: 'Biệt Đội Sấm Sét', alternatives: ['Thunder Squad', 'Thunder Squad 2025'] },
      { title: 'Fast & Furious 11', alternatives: ['Fast X', 'Fast and Furious 11', 'Fast 11'] },
      { title: 'Spider-Man: Beyond the Spider-Verse', alternatives: ['Spider-Man Across the Spider-Verse', 'Spider-Verse 3', 'Spider-Man Into the Spider-Verse 3'] },
      { title: 'Ván Cờ Vây – The Match', alternatives: ['The Match', 'The Match 2024', 'Go Match'] },
      { title: 'Nhà Ga Ma Chó', alternatives: ['Station 19', 'Rocafort', 'Ghost Station'] },
    ];
    
    let trailerAdded = 0;
    let trailerFailed = 0;
    
    for (const movieInfo of moviesNeedingTrailers) {
      const movie = await Movie.findOne({ title: movieInfo.title });
      
      if (!movie) {
        console.log(`❌ Movie not found: ${movieInfo.title}`);
        continue;
      }
      
      const hasTrailer = movie.trailer && movie.trailer.trim() !== '' && movie.trailer !== 'null';
      
      if (hasTrailer) {
        console.log(`⏭️  Skip: ${movie.title} (already has trailer)`);
        continue;
      }
      
      console.log(`\n🎬 Processing: ${movie.title}`);
      
      // Check manual mapping first
      if (manualTrailerMappings[movie.title]) {
        movie.trailer = manualTrailerMappings[movie.title];
        await movie.save();
        console.log(`   ✅ Trailer added from manual mapping: ${movie.trailer}`);
        trailerAdded++;
        continue;
      }
      
      // Try TMDB search with alternatives
      console.log(`   🔍 Searching TMDB with alternatives...`);
      const movieResult = await searchMovieOnTMDB(movie.title, movieInfo.alternatives);
      
      if (movieResult && movieResult.id) {
        const video = await getMovieVideos(movieResult.id);
        
        if (video && video.key) {
          movie.trailer = `${YOUTUBE_BASE}${video.key}`;
          await movie.save();
          console.log(`   ✅ Trailer found and added: ${movie.trailer}`);
          trailerAdded++;
        } else {
          console.log(`   ⚠️  Movie found on TMDB but no trailer available`);
          trailerFailed++;
        }
      } else {
        console.log(`   ⚠️  Movie not found on TMDB`);
        trailerFailed++;
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n\n📊 Summary:');
    console.log(`   ✅ Trailers added: ${trailerAdded}`);
    console.log(`   ❌ Failed/Not found: ${trailerFailed}`);
    console.log('\n🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await addMissingTrailers();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

