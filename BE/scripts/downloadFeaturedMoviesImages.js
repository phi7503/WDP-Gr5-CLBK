/**
 * Script to download poster and backdrop images for featured movies
 * Usage: node scripts/downloadFeaturedMoviesImages.js
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

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '../uploads');
const postersDir = path.join(__dirname, '../uploads/posters');
const backdropsDir = path.join(__dirname, '../uploads/backdrops');

[uploadsDir, postersDir, backdropsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Function để tải ảnh từ URL
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
          fs.unlink(filepath, () => {}); // Xóa file nếu có lỗi
          reject(err);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Redirect
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

// Danh sách phim và ảnh cần tải
const moviesImages = [
  {
    title: "Dune",
    poster: {
      url: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg",
      filename: "dune-poster.jpg"
    },
    backdrop: {
      url: "https://image.tmdb.org/t/p/w1920/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg",
      filename: "dune-backdrop.jpg"
    }
  },
  {
    title: "The Dark Knight",
    poster: {
      url: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      filename: "dark-knight-poster.jpg"
    },
    backdrop: {
      url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80",
      filename: "dark-knight-backdrop.jpg"
    }
  },
  {
    title: "Avengers: Endgame",
    poster: {
      url: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      filename: "avengers-endgame-poster.jpg"
    },
    backdrop: {
      url: "https://image.tmdb.org/t/p/w1920/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
      filename: "avengers-endgame-backdrop.jpg"
    }
  },
  {
    title: "Inception",
    poster: {
      url: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      filename: "inception-poster.jpg"
    },
    backdrop: {
      url: "https://image.tmdb.org/t/p/w1920/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
      filename: "inception-backdrop.jpg"
    }
  },
  {
    title: "Interstellar",
    poster: {
      url: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      filename: "interstellar-poster.jpg"
    },
    backdrop: {
      url: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&q=80",
      filename: "interstellar-backdrop.jpg"
    }
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const downloadAndUpdateImages = async () => {
  console.log('📥 Starting image download and update...\n');
  
  let posterSuccess = 0;
  let posterFailed = 0;
  let backdropSuccess = 0;
  let backdropFailed = 0;
  let dbUpdated = 0;
  
  for (const movieData of moviesImages) {
    try {
      // Tìm phim trong database
      const movie = await Movie.findOne({ title: movieData.title });
      
      if (!movie) {
        console.log(`⚠️  Movie "${movieData.title}" not found in database, skipping...\n`);
        continue;
      }
      
      console.log(`🎬 Processing: ${movieData.title}`);
      
      // Download poster
      let posterPath = null;
      try {
        const posterFilepath = path.join(postersDir, movieData.poster.filename);
        
        if (!fs.existsSync(posterFilepath)) {
          console.log(`   ⬇️  Downloading poster...`);
          await downloadImage(movieData.poster.url, posterFilepath);
          console.log(`   ✅ Poster downloaded: ${movieData.poster.filename}`);
          posterSuccess++;
        } else {
          console.log(`   ⏭️  Poster already exists: ${movieData.poster.filename}`);
        }
        
        posterPath = `uploads/posters/${movieData.poster.filename}`;
      } catch (error) {
        console.error(`   ❌ Failed to download poster:`, error.message);
        posterFailed++;
        // Fallback to original URL
        posterPath = movieData.poster.url;
      }
      
      // Download backdrop
      let backdropPath = null;
      try {
        const backdropFilepath = path.join(backdropsDir, movieData.backdrop.filename);
        
        if (!fs.existsSync(backdropFilepath)) {
          console.log(`   ⬇️  Downloading backdrop...`);
          await downloadImage(movieData.backdrop.url, backdropFilepath);
          console.log(`   ✅ Backdrop downloaded: ${movieData.backdrop.filename}`);
          backdropSuccess++;
        } else {
          console.log(`   ⏭️  Backdrop already exists: ${movieData.backdrop.filename}`);
        }
        
        backdropPath = `uploads/backdrops/${movieData.backdrop.filename}`;
      } catch (error) {
        console.error(`   ❌ Failed to download backdrop:`, error.message);
        backdropFailed++;
        // Fallback to original URL
        backdropPath = movieData.backdrop.url;
      }
      
      // Update database
      movie.poster = posterPath;
      movie.backdropImage = backdropPath;
      await movie.save();
      
      console.log(`   ✅ Database updated`);
      console.log(`      Poster: ${posterPath}`);
      console.log(`      Backdrop: ${backdropPath}\n`);
      dbUpdated++;
      
    } catch (error) {
      console.error(`❌ Error processing ${movieData.title}:`, error.message);
      console.log('');
    }
  }
  
  console.log('📊 Summary:');
  console.log(`   ✅ Posters downloaded: ${posterSuccess}`);
  console.log(`   ❌ Posters failed: ${posterFailed}`);
  console.log(`   ✅ Backdrops downloaded: ${backdropSuccess}`);
  console.log(`   ❌ Backdrops failed: ${backdropFailed}`);
  console.log(`   ✅ Database updated: ${dbUpdated} movies`);
  console.log(`\n📁 Image locations:`);
  console.log(`   Posters: ${postersDir}`);
  console.log(`   Backdrops: ${backdropsDir}`);
  console.log(`\n💡 Access URLs:`);
  console.log(`   http://localhost:5000/uploads/posters/[filename]`);
  console.log(`   http://localhost:5000/uploads/backdrops/[filename]`);
  console.log('\n🎉 Done!');
};

(async () => {
  await connectDB();
  await downloadAndUpdateImages();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

