/**
 * Script to find and add trailers for movies from TMDB API
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

// Function to search movie on TMDB
const searchMovieOnTMDB = async (title) => {
  try {
    const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=vi-VN`;
    
    return new Promise((resolve, reject) => {
      https.get(searchUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.results && result.results.length > 0) {
              resolve(result.results[0]); // Return first result
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
    console.error(`Error searching TMDB for "${title}":`, error.message);
    return null;
  }
};

// Function to get movie videos (trailers) from TMDB
const getMovieVideos = async (tmdbId) => {
  try {
    const videosUrl = `${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
    
    return new Promise((resolve, reject) => {
      https.get(videosUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.results && result.results.length > 0) {
              // Find official trailer first, then any trailer, then teaser
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
    console.error(`Error getting videos for TMDB ID ${tmdbId}:`, error.message);
    return null;
  }
};

// Function to get trailer URL from TMDB movie
const getTrailerFromTMDB = async (title) => {
  try {
    // Search for movie
    const movieResult = await searchMovieOnTMDB(title);
    
    if (!movieResult || !movieResult.id) {
      return null;
    }
    
    // Get videos
    const video = await getMovieVideos(movieResult.id);
    
    if (!video || !video.key) {
      return null;
    }
    
    // Return YouTube URL
    return `${YOUTUBE_BASE}${video.key}`;
  } catch (error) {
    console.error(`Error getting trailer for "${title}":`, error.message);
    return null;
  }
};

const addMoviesTrailers = async () => {
  console.log('🎬 Starting trailer search and update...\n');
  
  try {
    const allMovies = await Movie.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${allMovies.length} movies to process\n`);
    
    let trailerAdded = 0;
    let trailerSkipped = 0;
    let trailerFailed = 0;
    
    for (const movie of allMovies) {
      const hasTrailer = movie.trailer && movie.trailer.trim() !== '' && movie.trailer !== 'null';
      
      if (hasTrailer) {
        console.log(`⏭️  Skip: ${movie.title} (already has trailer)`);
        trailerSkipped++;
        continue;
      }
      
      console.log(`\n🎬 Processing: ${movie.title}`);
      console.log(`   🔍 Searching for trailer...`);
      
      try {
        const trailerUrl = await getTrailerFromTMDB(movie.title);
        
        if (trailerUrl) {
          movie.trailer = trailerUrl;
          await movie.save();
          console.log(`   ✅ Trailer found and added: ${trailerUrl}`);
          trailerAdded++;
        } else {
          console.log(`   ⚠️  Trailer not found on TMDB`);
          trailerFailed++;
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error.message);
        trailerFailed++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n\n📊 Summary:');
    console.log(`   ✅ Trailers added: ${trailerAdded}`);
    console.log(`   ⏭️  Skipped (already have): ${trailerSkipped}`);
    console.log(`   ❌ Failed/Not found: ${trailerFailed}`);
    console.log(`   📊 Total processed: ${allMovies.length}`);
    console.log('\n🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await addMoviesTrailers();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

