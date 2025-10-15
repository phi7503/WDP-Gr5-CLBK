import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Movie from '../models/movieModel.js';

dotenv.config();
connectDB();

/**
 * Script to add backdrop images to movies
 * Run: npm run add-backdrops
 */

const addBackdropImages = async () => {
  console.log('🎬 ADDING BACKDROP IMAGES TO MOVIES...\n');

  try {
    const movies = await Movie.find({});
    console.log(`📽️  Found ${movies.length} movies\n`);

    let updated = 0;

    for (const movie of movies) {
      // Chỉ update nếu chưa có backdropImage
      if (!movie.backdropImage) {
        // Tạo backdrop URL từ poster (hoặc placeholder)
        // Trong production, bạn nên có ảnh backdrop thật
        let backdropUrl = '';
        
        if (movie.poster) {
          // Nếu có poster, tạo backdrop URL tương tự
          backdropUrl = movie.poster.replace('posters', 'backdrops');
        } else {
          // Placeholder backdrop
          backdropUrl = `https://via.placeholder.com/1920x800/1a1a1a/fff?text=${encodeURIComponent(movie.title)}+Backdrop`;
        }

        movie.backdropImage = backdropUrl;
        await movie.save();
        
        console.log(`✅ Updated: ${movie.title}`);
        console.log(`   Backdrop: ${backdropUrl}\n`);
        updated++;
      } else {
        console.log(`⏭️  Skip: ${movie.title} (already has backdrop)\n`);
      }
    }

    console.log('\n============================================================');
    console.log('📊 SUMMARY:');
    console.log('============================================================');
    console.log(`   Total Movies: ${movies.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${movies.length - updated}`);
    console.log('============================================================');
    console.log('\n✅ DONE!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('📊 Database connection closed\n');
  }
};

addBackdropImages();

