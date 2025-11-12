/**
 * Script to check specific movies for missing data
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Movie from '../models/movieModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const checkSpecificMovies = async () => {
  try {
    const movieTitles = ['Biệt Đội Sấm Sét', 'Nhà Ga Ma Chó'];
    
    console.log('🔍 Checking specific movies...\n');
    
    for (const title of movieTitles) {
      const movie = await Movie.findOne({ title: title });
      
      if (!movie) {
        console.log(`❌ Movie not found: ${title}\n`);
        continue;
      }
      
      console.log(`📽️  ${movie.title}`);
      console.log(`   ID: ${movie._id}`);
      
      // Check poster
      let hasPoster = false;
      let posterPath = null;
      if (movie.poster && movie.poster.trim() !== '') {
        if (movie.poster.startsWith('http')) {
          hasPoster = true;
          posterPath = movie.poster;
        } else {
          posterPath = path.join(__dirname, '..', movie.poster);
          hasPoster = fs.existsSync(posterPath);
        }
      }
      console.log(`   📸 Poster: ${hasPoster ? '✅' : '❌'} ${movie.poster || '(empty)'}`);
      if (posterPath && !hasPoster && !movie.poster.startsWith('http')) {
        console.log(`      Expected path: ${posterPath}`);
      }
      
      // Check backdrop
      let hasBackdrop = false;
      let backdropPath = null;
      if (movie.backdropImage && movie.backdropImage.trim() !== '') {
        if (movie.backdropImage.startsWith('http')) {
          hasBackdrop = true;
          backdropPath = movie.backdropImage;
        } else {
          backdropPath = path.join(__dirname, '..', movie.backdropImage);
          hasBackdrop = fs.existsSync(backdropPath);
        }
      }
      console.log(`   🖼️  Backdrop: ${hasBackdrop ? '✅' : '❌'} ${movie.backdropImage || '(empty)'}`);
      if (backdropPath && !hasBackdrop && !movie.backdropImage.startsWith('http')) {
        console.log(`      Expected path: ${backdropPath}`);
      }
      
      // Check trailer
      const hasTrailer = movie.trailer && movie.trailer.trim() !== '' && movie.trailer !== 'null';
      console.log(`   🎬 Trailer: ${hasTrailer ? '✅' : '❌'} ${movie.trailer || '(empty)'}`);
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await checkSpecificMovies();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
})();

