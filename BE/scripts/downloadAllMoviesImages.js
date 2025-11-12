/**
 * Script to download poster and backdrop images for all movies missing images
 * Uses TMDB API to search for movies and download images
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TMDB API Configuration (you may need to add your API key to .env)
const TMDB_API_KEY = process.env.TMDB_API_KEY || '1f54bd990f1cdfb230adb312546d765d'; // Public demo key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Create directories if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
const postersDir = path.join(__dirname, '../uploads/posters');
const backdropsDir = path.join(__dirname, '../uploads/backdrops');

[uploadsDir, postersDir, backdropsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Function to download image from URL
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
    }).on('error', (err) => {
      reject(err);
    });
  });
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

// Function to get placeholder image URL
const getPlaceholderImage = (title, type = 'poster') => {
  const width = type === 'poster' ? 500 : 1920;
  const height = type === 'poster' ? 750 : 1080;
  const text = encodeURIComponent(title);
  return `https://via.placeholder.com/${width}x${height}/1a1a1a/ffffff?text=${text}`;
};

// Function to generate filename from movie title
const generateFilename = (title, type = 'poster') => {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `${sanitized}-${type}.jpg`;
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const downloadAllMoviesImages = async () => {
  console.log('📥 Starting image download for all movies...\n');
  
  try {
    const allMovies = await Movie.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${allMovies.length} movies to process\n`);
    
    let posterDownloaded = 0;
    let posterSkipped = 0;
    let posterFailed = 0;
    let backdropDownloaded = 0;
    let backdropSkipped = 0;
    let backdropFailed = 0;
    let dbUpdated = 0;
    
    for (const movie of allMovies) {
      console.log(`\n🎬 Processing: ${movie.title}`);
      
      let posterPath = movie.poster;
      let backdropPath = movie.backdropImage;
      let needsUpdate = false;
      
      // Check and download poster
      if (!movie.poster || movie.poster.trim() === '' || !fs.existsSync(path.join(__dirname, '..', movie.poster))) {
        console.log(`   📸 Poster missing, searching...`);
        
        // Try to find on TMDB
        const tmdbResult = await searchMovieOnTMDB(movie.title);
        
        if (tmdbResult && tmdbResult.poster_path) {
          const posterUrl = `${TMDB_IMAGE_BASE}/w500${tmdbResult.poster_path}`;
          const filename = generateFilename(movie.title, 'poster');
          const filepath = path.join(postersDir, filename);
          
          try {
            await downloadImage(posterUrl, filepath);
            posterPath = `uploads/posters/${filename}`;
            console.log(`   ✅ Poster downloaded from TMDB: ${filename}`);
            posterDownloaded++;
            needsUpdate = true;
          } catch (error) {
            console.log(`   ⚠️  Failed to download from TMDB, using placeholder`);
            posterPath = getPlaceholderImage(movie.title, 'poster');
            posterFailed++;
            needsUpdate = true;
          }
        } else {
          console.log(`   ⚠️  Not found on TMDB, using placeholder`);
          posterPath = getPlaceholderImage(movie.title, 'poster');
          posterFailed++;
          needsUpdate = true;
        }
      } else {
        console.log(`   ⏭️  Poster already exists`);
        posterSkipped++;
      }
      
      // Check and download backdrop
      if (!movie.backdropImage || movie.backdropImage.trim() === '' || !fs.existsSync(path.join(__dirname, '..', movie.backdropImage))) {
        console.log(`   🖼️  Backdrop missing, searching...`);
        
        // Try to find on TMDB
        const tmdbResult = await searchMovieOnTMDB(movie.title);
        
        if (tmdbResult && tmdbResult.backdrop_path) {
          const backdropUrl = `${TMDB_IMAGE_BASE}/w1920${tmdbResult.backdrop_path}`;
          const filename = generateFilename(movie.title, 'backdrop');
          const filepath = path.join(backdropsDir, filename);
          
          try {
            await downloadImage(backdropUrl, filepath);
            backdropPath = `uploads/backdrops/${filename}`;
            console.log(`   ✅ Backdrop downloaded from TMDB: ${filename}`);
            backdropDownloaded++;
            needsUpdate = true;
          } catch (error) {
            console.log(`   ⚠️  Failed to download from TMDB, using placeholder`);
            backdropPath = getPlaceholderImage(movie.title, 'backdrop');
            backdropFailed++;
            needsUpdate = true;
          }
        } else {
          // Use poster as backdrop if available
          if (posterPath && posterPath.startsWith('uploads/')) {
            const posterFilename = path.basename(posterPath);
            const backdropFilename = posterFilename.replace('poster', 'backdrop');
            backdropPath = `uploads/backdrops/${backdropFilename}`;
            // Copy poster to backdrop
            const sourcePath = path.join(__dirname, '..', posterPath);
            const destPath = path.join(backdropsDir, backdropFilename);
            if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, destPath);
              console.log(`   ✅ Backdrop created from poster`);
              backdropDownloaded++;
              needsUpdate = true;
            }
          } else {
            console.log(`   ⚠️  Not found on TMDB, using placeholder`);
            backdropPath = getPlaceholderImage(movie.title, 'backdrop');
            backdropFailed++;
            needsUpdate = true;
          }
        }
      } else {
        console.log(`   ⏭️  Backdrop already exists`);
        backdropSkipped++;
      }
      
      // Update database if needed
      if (needsUpdate) {
        movie.poster = posterPath;
        movie.backdropImage = backdropPath;
        await movie.save();
        console.log(`   ✅ Database updated`);
        dbUpdated++;
      }
    }
    
    console.log('\n\n📊 Summary:');
    console.log('   Posters:');
    console.log(`      ✅ Downloaded: ${posterDownloaded}`);
    console.log(`      ⏭️  Skipped: ${posterSkipped}`);
    console.log(`      ❌ Failed/Placeholder: ${posterFailed}`);
    console.log('   Backdrops:');
    console.log(`      ✅ Downloaded: ${backdropDownloaded}`);
    console.log(`      ⏭️  Skipped: ${backdropSkipped}`);
    console.log(`      ❌ Failed/Placeholder: ${backdropFailed}`);
    console.log(`   ✅ Database updated: ${dbUpdated} movies`);
    console.log('\n🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await downloadAllMoviesImages();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

