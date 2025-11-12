/**
 * Script to check if all movies have complete data (poster, backdrop, trailer)
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

const checkAllMoviesComplete = async () => {
  try {
    const allMovies = await Movie.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Checking ${allMovies.length} movies for complete data...\n`);
    
    let complete = 0;
    let missingPoster = 0;
    let missingBackdrop = 0;
    let missingTrailer = 0;
    let missingMultiple = 0;
    
    const incompleteMovies = [];
    
    for (const movie of allMovies) {
      const hasPoster = movie.poster && movie.poster.trim() !== '' && 
                       (movie.poster.startsWith('http') || fs.existsSync(path.join(__dirname, '..', movie.poster)));
      const hasBackdrop = movie.backdropImage && movie.backdropImage.trim() !== '' && 
                         (movie.backdropImage.startsWith('http') || fs.existsSync(path.join(__dirname, '..', movie.backdropImage)));
      const hasTrailer = movie.trailer && movie.trailer.trim() !== '' && movie.trailer !== 'null';
      
      const missing = [];
      if (!hasPoster) missing.push('poster');
      if (!hasBackdrop) missing.push('backdrop');
      if (!hasTrailer) missing.push('trailer');
      
      if (missing.length === 0) {
        complete++;
      } else {
        if (missing.length > 1) missingMultiple++;
        if (!hasPoster) missingPoster++;
        if (!hasBackdrop) missingBackdrop++;
        if (!hasTrailer) missingTrailer++;
        
        incompleteMovies.push({
          title: movie.title,
          missing: missing
        });
      }
    }
    
    console.log('📈 Complete Data Statistics:');
    console.log(`   ✅ Complete (all data): ${complete}/${allMovies.length} (${((complete / allMovies.length) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Incomplete: ${allMovies.length - complete}/${allMovies.length} (${(((allMovies.length - complete) / allMovies.length) * 100).toFixed(1)}%)\n`);
    
    console.log('📊 Missing Data Breakdown:');
    console.log(`   📸 Missing poster: ${missingPoster}`);
    console.log(`   🖼️  Missing backdrop: ${missingBackdrop}`);
    console.log(`   🎬 Missing trailer: ${missingTrailer}`);
    console.log(`   ⚠️  Missing multiple items: ${missingMultiple}\n`);
    
    if (incompleteMovies.length > 0) {
      console.log('❌ Movies with incomplete data:');
      incompleteMovies.forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title}`);
        console.log(`      Missing: ${movie.missing.join(', ')}\n`);
      });
    } else {
      console.log('✅ All movies have complete data! 🎉');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await checkAllMoviesComplete();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

