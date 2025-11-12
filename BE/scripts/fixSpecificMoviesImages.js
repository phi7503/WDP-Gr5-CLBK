/**
 * Script to find and download real images for specific movies
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
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
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
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
const searchMovieOnTMDB = async (title, alternatives = []) => {
  const searchQueries = [title, ...alternatives];
  
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

// Manual image URLs for movies not found on TMDB
const manualImageMappings = {
  'Biệt Đội Sấm Sét': {
    poster: 'https://image.tmdb.org/t/p/w500/default-poster.jpg', // Will try to find alternative
    backdrop: 'https://image.tmdb.org/t/p/w1920/default-backdrop.jpg'
  },
  'Nhà Ga Ma Chó': {
    poster: 'https://image.tmdb.org/t/p/w500/default-poster.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1920/default-backdrop.jpg'
  }
};

// Alternative search terms and image sources
const movieSearchConfig = {
  'Biệt Đội Sấm Sét': {
    alternatives: ['Thunder Squad', 'Thunder Squad 2025', 'Thunder Squad movie'],
    // Try to use generic action movie images if not found
    fallbackPoster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80',
    fallbackBackdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80'
  },
  'Nhà Ga Ma Chó': {
    alternatives: ['Rocafort', 'Ghost Station', 'Station 19', 'Estación Fantasma'],
    // Try to use horror/thriller movie images
    fallbackPoster: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80',
    fallbackBackdrop: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80'
  }
};

const fixSpecificMoviesImages = async () => {
  console.log('🖼️  Fixing images for specific movies...\n');
  
  try {
    const movieTitles = ['Biệt Đội Sấm Sét', 'Nhà Ga Ma Chó'];
    
    for (const title of movieTitles) {
      const movie = await Movie.findOne({ title: title });
      
      if (!movie) {
        console.log(`❌ Movie not found: ${title}\n`);
        continue;
      }
      
      console.log(`🎬 Processing: ${movie.title}`);
      
      const config = movieSearchConfig[title] || {};
      const alternatives = config.alternatives || [];
      
      // Check if currently using placeholder
      const isPlaceholder = movie.poster && movie.poster.includes('via.placeholder.com');
      
      if (isPlaceholder) {
        console.log(`   ⚠️  Currently using placeholder, searching for real images...`);
      }
      
      let posterPath = movie.poster;
      let backdropPath = movie.backdropImage;
      let needsUpdate = false;
      
      // Try to find poster from TMDB
      if (isPlaceholder || !movie.poster || movie.poster.trim() === '') {
        console.log(`   📸 Searching for poster...`);
        
        const tmdbResult = await searchMovieOnTMDB(title, alternatives);
        
        if (tmdbResult && tmdbResult.poster_path) {
          const posterUrl = `${TMDB_IMAGE_BASE}/w500${tmdbResult.poster_path}`;
          const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-poster.jpg`;
          const filepath = path.join(postersDir, filename);
          
          try {
            await downloadImage(posterUrl, filepath);
            posterPath = `uploads/posters/${filename}`;
            console.log(`   ✅ Poster downloaded from TMDB: ${filename}`);
            needsUpdate = true;
          } catch (error) {
            console.log(`   ⚠️  Failed to download from TMDB, trying fallback...`);
            // Try fallback
            if (config.fallbackPoster) {
              try {
                const fallbackFilename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-poster-fallback.jpg`;
                const fallbackPath = path.join(postersDir, fallbackFilename);
                await downloadImage(config.fallbackPoster, fallbackPath);
                posterPath = `uploads/posters/${fallbackFilename}`;
                console.log(`   ✅ Poster downloaded from fallback`);
                needsUpdate = true;
              } catch (err) {
                console.log(`   ❌ Fallback also failed`);
              }
            }
          }
        } else {
          console.log(`   ⚠️  Not found on TMDB, trying fallback...`);
          if (config.fallbackPoster) {
            try {
              const fallbackFilename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-poster-fallback.jpg`;
              const fallbackPath = path.join(postersDir, fallbackFilename);
              await downloadImage(config.fallbackPoster, fallbackPath);
              posterPath = `uploads/posters/${fallbackFilename}`;
              console.log(`   ✅ Poster downloaded from fallback`);
              needsUpdate = true;
            } catch (err) {
              console.log(`   ❌ Fallback failed`);
            }
          }
        }
      }
      
      // Try to find backdrop from TMDB
      if (isPlaceholder || !movie.backdropImage || movie.backdropImage.trim() === '') {
        console.log(`   🖼️  Searching for backdrop...`);
        
        const tmdbResult = await searchMovieOnTMDB(title, alternatives);
        
        if (tmdbResult && tmdbResult.backdrop_path) {
          const backdropUrl = `${TMDB_IMAGE_BASE}/w1920${tmdbResult.backdrop_path}`;
          const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-backdrop.jpg`;
          const filepath = path.join(backdropsDir, filename);
          
          try {
            await downloadImage(backdropUrl, filepath);
            backdropPath = `uploads/backdrops/${filename}`;
            console.log(`   ✅ Backdrop downloaded from TMDB: ${filename}`);
            needsUpdate = true;
          } catch (error) {
            console.log(`   ⚠️  Failed to download from TMDB, trying fallback...`);
            if (config.fallbackBackdrop) {
              try {
                const fallbackFilename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-backdrop-fallback.jpg`;
                const fallbackPath = path.join(backdropsDir, fallbackFilename);
                await downloadImage(config.fallbackBackdrop, fallbackPath);
                backdropPath = `uploads/backdrops/${fallbackFilename}`;
                console.log(`   ✅ Backdrop downloaded from fallback`);
                needsUpdate = true;
              } catch (err) {
                console.log(`   ❌ Fallback also failed`);
              }
            }
          }
        } else {
          console.log(`   ⚠️  Not found on TMDB, trying fallback...`);
          if (config.fallbackBackdrop) {
            try {
              const fallbackFilename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-backdrop-fallback.jpg`;
              const fallbackPath = path.join(backdropsDir, fallbackFilename);
              await downloadImage(config.fallbackBackdrop, fallbackPath);
              backdropPath = `uploads/backdrops/${fallbackFilename}`;
              console.log(`   ✅ Backdrop downloaded from fallback`);
              needsUpdate = true;
            } catch (err) {
              console.log(`   ❌ Fallback failed`);
            }
          }
        }
      }
      
      // Update database if needed
      if (needsUpdate) {
        movie.poster = posterPath;
        movie.backdropImage = backdropPath;
        await movie.save();
        console.log(`   ✅ Database updated\n`);
      } else {
        console.log(`   ⏭️  No update needed\n`);
      }
      
      // Add delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await fixSpecificMoviesImages();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

