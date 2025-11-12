/**
 * Script to verify that movie image files actually exist on disk
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

const verifyMovieImages = async () => {
  try {
    const allMovies = await Movie.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Checking ${allMovies.length} movies...\n`);
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const postersDir = path.join(__dirname, '../uploads/posters');
    const backdropsDir = path.join(__dirname, '../uploads/backdrops');
    
    let posterExists = 0;
    let posterMissing = 0;
    let backdropExists = 0;
    let backdropMissing = 0;
    let bothExist = 0;
    let bothMissing = 0;
    let oneMissing = 0;
    
    const missingFiles = [];
    
    for (const movie of allMovies) {
      let hasPoster = false;
      let hasBackdrop = false;
      let posterPath = null;
      let backdropPath = null;
      
      // Check poster
      if (movie.poster && movie.poster.trim() !== '') {
        if (movie.poster.startsWith('uploads/')) {
          posterPath = path.join(__dirname, '..', movie.poster);
          hasPoster = fs.existsSync(posterPath);
        } else if (movie.poster.startsWith('http://') || movie.poster.startsWith('https://')) {
          hasPoster = true; // External URL, assume exists
        } else {
          // Try relative path
          posterPath = path.join(postersDir, movie.poster);
          hasPoster = fs.existsSync(posterPath);
        }
      }
      
      // Check backdrop
      if (movie.backdropImage && movie.backdropImage.trim() !== '') {
        if (movie.backdropImage.startsWith('uploads/')) {
          backdropPath = path.join(__dirname, '..', movie.backdropImage);
          hasBackdrop = fs.existsSync(backdropPath);
        } else if (movie.backdropImage.startsWith('http://') || movie.backdropImage.startsWith('https://')) {
          hasBackdrop = true; // External URL, assume exists
        } else {
          // Try relative path
          backdropPath = path.join(backdropsDir, movie.backdropImage);
          hasBackdrop = fs.existsSync(backdropPath);
        }
      }
      
      if (hasPoster) posterExists++;
      else {
        posterMissing++;
        missingFiles.push({
          title: movie.title,
          type: 'poster',
          path: movie.poster,
          filePath: posterPath
        });
      }
      
      if (hasBackdrop) backdropExists++;
      else {
        backdropMissing++;
        missingFiles.push({
          title: movie.title,
          type: 'backdrop',
          path: movie.backdropImage,
          filePath: backdropPath
        });
      }
      
      if (hasPoster && hasBackdrop) bothExist++;
      else if (!hasPoster && !hasBackdrop) bothMissing++;
      else oneMissing++;
    }
    
    console.log('📈 File Verification Results:');
    console.log(`   ✅ Posters exist: ${posterExists}/${allMovies.length}`);
    console.log(`   ❌ Posters missing: ${posterMissing}/${allMovies.length}`);
    console.log(`   ✅ Backdrops exist: ${backdropExists}/${allMovies.length}`);
    console.log(`   ❌ Backdrops missing: ${backdropMissing}/${allMovies.length}\n`);
    
    console.log('📊 Movie Status:');
    console.log(`   ✅ Both images exist: ${bothExist}`);
    console.log(`   ⚠️  One image missing: ${oneMissing}`);
    console.log(`   ❌ Both images missing: ${bothMissing}\n`);
    
    if (missingFiles.length > 0) {
      console.log('❌ Missing Image Files:');
      missingFiles.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} - ${item.type}`);
        console.log(`      DB Path: ${item.path}`);
        if (item.filePath) {
          console.log(`      Expected: ${item.filePath}`);
        }
        console.log('');
      });
    }
    
    // List actual files in directories
    console.log('\n📁 Files in uploads directories:');
    if (fs.existsSync(postersDir)) {
      const posterFiles = fs.readdirSync(postersDir);
      console.log(`   Posters: ${posterFiles.length} files`);
      if (posterFiles.length > 0 && posterFiles.length <= 10) {
        posterFiles.forEach(file => console.log(`      - ${file}`));
      } else if (posterFiles.length > 10) {
        posterFiles.slice(0, 10).forEach(file => console.log(`      - ${file}`));
        console.log(`      ... and ${posterFiles.length - 10} more`);
      }
    } else {
      console.log('   ⚠️  Posters directory does not exist');
    }
    
    if (fs.existsSync(backdropsDir)) {
      const backdropFiles = fs.readdirSync(backdropsDir);
      console.log(`   Backdrops: ${backdropFiles.length} files`);
      if (backdropFiles.length > 0 && backdropFiles.length <= 10) {
        backdropFiles.forEach(file => console.log(`      - ${file}`));
      } else if (backdropFiles.length > 10) {
        backdropFiles.slice(0, 10).forEach(file => console.log(`      - ${file}`));
        console.log(`      ... and ${backdropFiles.length - 10} more`);
      }
    } else {
      console.log('   ⚠️  Backdrops directory does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await verifyMovieImages();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

