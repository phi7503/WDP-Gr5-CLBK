/**
 * Script to check featured movies images
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

const checkFeaturedMovies = async () => {
  try {
    const featuredTitles = ['Dune', 'The Dark Knight', 'Avengers: Endgame', 'Inception', 'Interstellar'];
    
    console.log('🔍 Checking featured movies...\n');
    
    for (const title of featuredTitles) {
      const movie = await Movie.findOne({ title: title });
      
      if (!movie) {
        console.log(`❌ Movie not found: ${title}\n`);
        continue;
      }
      
      console.log(`📽️  ${movie.title}`);
      
      // Check poster
      let posterStatus = '❌';
      let posterInfo = movie.poster || '(empty)';
      if (movie.poster && movie.poster.trim() !== '') {
        if (movie.poster.startsWith('http')) {
          posterStatus = '✅ (External URL)';
        } else {
          const posterPath = path.join(__dirname, '..', movie.poster);
          if (fs.existsSync(posterPath)) {
            const stats = fs.statSync(posterPath);
            posterStatus = `✅ (${(stats.size / 1024).toFixed(2)} KB)`;
          } else {
            posterStatus = '❌ (File not found)';
          }
        }
      }
      console.log(`   📸 Poster: ${posterStatus}`);
      console.log(`      Path: ${posterInfo}`);
      
      // Check backdrop
      let backdropStatus = '❌';
      let backdropInfo = movie.backdropImage || '(empty)';
      if (movie.backdropImage && movie.backdropImage.trim() !== '') {
        if (movie.backdropImage.startsWith('http')) {
          backdropStatus = '✅ (External URL)';
        } else {
          const backdropPath = path.join(__dirname, '..', movie.backdropImage);
          if (fs.existsSync(backdropPath)) {
            const stats = fs.statSync(backdropPath);
            backdropStatus = `✅ (${(stats.size / 1024).toFixed(2)} KB)`;
          } else {
            backdropStatus = '❌ (File not found)';
          }
        }
      }
      console.log(`   🖼️  Backdrop: ${backdropStatus}`);
      console.log(`      Path: ${backdropInfo}`);
      
      // Check if using placeholder
      const isPlaceholder = 
        (movie.poster && movie.poster.includes('via.placeholder.com')) ||
        (movie.backdropImage && movie.backdropImage.includes('via.placeholder.com'));
      
      if (isPlaceholder) {
        console.log(`   ⚠️  WARNING: Using placeholder images!`);
      } else {
        console.log(`   ✅ Using real images`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await checkFeaturedMovies();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
})();

