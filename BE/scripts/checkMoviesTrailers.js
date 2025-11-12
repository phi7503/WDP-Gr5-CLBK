/**
 * Script to check which movies are missing trailers
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const checkMoviesTrailers = async () => {
  try {
    const allMovies = await Movie.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Total movies in database: ${allMovies.length}\n`);
    
    let hasTrailer = 0;
    let missingTrailer = 0;
    
    const missingTrailerMovies = [];
    
    for (const movie of allMovies) {
      const hasTrailerValue = movie.trailer && movie.trailer.trim() !== '' && movie.trailer !== 'null';
      
      if (hasTrailerValue) {
        hasTrailer++;
      } else {
        missingTrailer++;
        missingTrailerMovies.push({
          title: movie.title,
          id: movie._id,
          currentTrailer: movie.trailer || '(empty)'
        });
      }
    }
    
    console.log('📈 Trailer Statistics:');
    console.log(`   ✅ Movies with trailer: ${hasTrailer}/${allMovies.length} (${((hasTrailer / allMovies.length) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Movies missing trailer: ${missingTrailer}/${allMovies.length} (${((missingTrailer / allMovies.length) * 100).toFixed(1)}%)\n`);
    
    if (missingTrailerMovies.length > 0) {
      console.log('❌ Movies missing trailers:');
      missingTrailerMovies.forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title}`);
        console.log(`      ID: ${movie.id}`);
        console.log(`      Current: ${movie.currentTrailer}\n`);
      });
    } else {
      console.log('✅ All movies have trailers!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await checkMoviesTrailers();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

