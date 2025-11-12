/**
 * Script to update images for featured movies (Dune, The Dark Knight, etc.)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import Movie from '../models/movieModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TMDB API Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || '1f54bd990f1cdfb230adb312546d765d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const uploadsDir = path.join(__dirname, '../uploads');
const postersDir = path.join(__dirname, '../uploads/posters');
const backdropsDir = path.join(__dirname, '../uploads/backdrops');

[uploadsDir, postersDir, backdropsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Function to download image
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
};

// Function to search movie on TMDB
const searchMovieOnTMDB = async (title) => {
  try {
    const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US`;
    
    return new Promise((resolve, reject) => {
      https.get(searchUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.results && parsed.results.length > 0) {
              resolve(parsed.results[0]);
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

// Featured movies with specific TMDB IDs for accuracy
const featuredMovies = [
  {
    title: 'Dune',
    tmdbId: 438631, // Dune (2021)
    posterFilename: 'dune-poster.jpg',
    backdropFilename: 'dune-backdrop.jpg'
  },
  {
    title: 'The Dark Knight',
    tmdbId: 155, // The Dark Knight
    posterFilename: 'dark-knight-poster.jpg',
    backdropFilename: 'dark-knight-backdrop.jpg'
  },
  {
    title: 'Avengers: Endgame',
    tmdbId: 299534, // Avengers: Endgame
    posterFilename: 'avengers-endgame-poster.jpg',
    backdropFilename: 'avengers-endgame-backdrop.jpg'
  },
  {
    title: 'Inception',
    tmdbId: 27205, // Inception
    posterFilename: 'inception-poster.jpg',
    backdropFilename: 'inception-backdrop.jpg'
  },
  {
    title: 'Interstellar',
    tmdbId: 157336, // Interstellar
    posterFilename: 'interstellar-poster.jpg',
    backdropFilename: 'interstellar-backdrop.jpg'
  }
];

// Function to get movie details from TMDB by ID
const getMovieDetails = async (tmdbId) => {
  try {
    const movieUrl = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
    
    return new Promise((resolve, reject) => {
      https.get(movieUrl, (res) => {
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
  } catch (error) {
    return null;
  }
};

const updateFeaturedMoviesImages = async () => {
  console.log('🖼️  Updating images for featured movies...\n');
  
  try {
    for (const movieInfo of featuredMovies) {
      const movie = await Movie.findOne({ title: movieInfo.title });
      
      if (!movie) {
        console.log(`❌ Movie not found: ${movieInfo.title}\n`);
        continue;
      }
      
      console.log(`🎬 Processing: ${movieInfo.title}`);
      
      // Get movie details from TMDB
      const tmdbMovie = await getMovieDetails(movieInfo.tmdbId);
      
      if (!tmdbMovie) {
        console.log(`   ⚠️  Could not fetch from TMDB\n`);
        continue;
      }
      
      let needsUpdate = false;
      
      // Download and update poster
      if (tmdbMovie.poster_path) {
        const posterUrl = `${TMDB_IMAGE_BASE}/w500${tmdbMovie.poster_path}`;
        const posterPath = path.join(postersDir, movieInfo.posterFilename);
        
        try {
          // Delete old poster if exists
          if (fs.existsSync(posterPath)) {
            fs.unlinkSync(posterPath);
          }
          
          await downloadImage(posterUrl, posterPath);
          movie.poster = `uploads/posters/${movieInfo.posterFilename}`;
          console.log(`   ✅ Poster updated: ${movieInfo.posterFilename}`);
          needsUpdate = true;
        } catch (error) {
          console.log(`   ❌ Failed to download poster: ${error.message}`);
        }
      }
      
      // Download and update backdrop
      if (tmdbMovie.backdrop_path) {
        const backdropUrl = `${TMDB_IMAGE_BASE}/w1920${tmdbMovie.backdrop_path}`;
        const backdropPath = path.join(backdropsDir, movieInfo.backdropFilename);
        
        try {
          // Delete old backdrop if exists
          if (fs.existsSync(backdropPath)) {
            fs.unlinkSync(backdropPath);
          }
          
          await downloadImage(backdropUrl, backdropPath);
          movie.backdropImage = `uploads/backdrops/${movieInfo.backdropFilename}`;
          console.log(`   ✅ Backdrop updated: ${movieInfo.backdropFilename}`);
          needsUpdate = true;
        } catch (error) {
          console.log(`   ❌ Failed to download backdrop: ${error.message}`);
        }
      }
      
      // Update database
      if (needsUpdate) {
        await movie.save();
        console.log(`   ✅ Database updated\n`);
      } else {
        console.log(`   ⏭️  No update needed\n`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await updateFeaturedMoviesImages();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

