/**
 * Script to check which movies are missing poster or backdrop images
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

const checkMoviesImages = async () => {
  try {
    const allMovies = await Movie.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Total movies in database: ${allMovies.length}\n`);
    
    let hasBothImages = 0;
    let missingPoster = 0;
    let missingBackdrop = 0;
    let missingBoth = 0;
    let hasLocalPoster = 0;
    let hasLocalBackdrop = 0;
    let hasExternalPoster = 0;
    let hasExternalBackdrop = 0;
    
    const missingPosterMovies = [];
    const missingBackdropMovies = [];
    const missingBothMovies = [];
    
    for (const movie of allMovies) {
      const hasPoster = movie.poster && movie.poster.trim() !== '';
      const hasBackdrop = movie.backdropImage && movie.backdropImage.trim() !== '';
      
      const posterIsLocal = hasPoster && movie.poster.startsWith('uploads/');
      const backdropIsLocal = hasBackdrop && movie.backdropImage.startsWith('uploads/');
      
      if (hasPoster && hasBackdrop) {
        hasBothImages++;
        if (posterIsLocal) hasLocalPoster++;
        else hasExternalPoster++;
        if (backdropIsLocal) hasLocalBackdrop++;
        else hasExternalBackdrop++;
      } else if (!hasPoster && !hasBackdrop) {
        missingBoth++;
        missingBothMovies.push({
          title: movie.title,
          id: movie._id
        });
      } else if (!hasPoster) {
        missingPoster++;
        missingPosterMovies.push({
          title: movie.title,
          id: movie._id,
          hasBackdrop: true
        });
        if (backdropIsLocal) hasLocalBackdrop++;
        else hasExternalBackdrop++;
      } else if (!hasBackdrop) {
        missingBackdrop++;
        missingBackdropMovies.push({
          title: movie.title,
          id: movie._id,
          hasPoster: true
        });
        if (posterIsLocal) hasLocalPoster++;
        else hasExternalPoster++;
      }
    }
    
    console.log('📈 Statistics:');
    console.log(`   ✅ Movies with both poster & backdrop: ${hasBothImages}`);
    console.log(`   ⚠️  Movies missing poster only: ${missingPoster}`);
    console.log(`   ⚠️  Movies missing backdrop only: ${missingBackdrop}`);
    console.log(`   ❌ Movies missing both: ${missingBoth}\n`);
    
    console.log('📁 Image Sources:');
    console.log(`   📸 Local posters: ${hasLocalPoster}`);
    console.log(`   🌐 External posters: ${hasExternalPoster}`);
    console.log(`   📸 Local backdrops: ${hasLocalBackdrop}`);
    console.log(`   🌐 External backdrops: ${hasExternalBackdrop}\n`);
    
    if (missingBothMovies.length > 0) {
      console.log('❌ Movies missing BOTH poster and backdrop:');
      missingBothMovies.forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title} (ID: ${movie.id})`);
      });
      console.log('');
    }
    
    if (missingPosterMovies.length > 0) {
      console.log('⚠️  Movies missing POSTER only:');
      missingPosterMovies.slice(0, 10).forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title} (ID: ${movie.id})`);
      });
      if (missingPosterMovies.length > 10) {
        console.log(`   ... and ${missingPosterMovies.length - 10} more`);
      }
      console.log('');
    }
    
    if (missingBackdropMovies.length > 0) {
      console.log('⚠️  Movies missing BACKDROP only:');
      missingBackdropMovies.slice(0, 10).forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title} (ID: ${movie.id})`);
      });
      if (missingBackdropMovies.length > 10) {
        console.log(`   ... and ${missingBackdropMovies.length - 10} more`);
      }
      console.log('');
    }
    
    console.log(`\n💡 Summary:`);
    console.log(`   Total movies: ${allMovies.length}`);
    console.log(`   Complete (both images): ${hasBothImages} (${((hasBothImages / allMovies.length) * 100).toFixed(1)}%)`);
    console.log(`   Incomplete: ${missingPoster + missingBackdrop + missingBoth} (${(((missingPoster + missingBackdrop + missingBoth) / allMovies.length) * 100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await checkMoviesImages();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

