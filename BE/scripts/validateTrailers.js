/**
 * Script to validate trailer URLs
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import https from 'https';
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

// Function to check if YouTube URL is valid
const checkYouTubeURL = (url) => {
  if (!url || url.trim() === '') return { valid: false, reason: 'Empty URL' };
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  if (!youtubeRegex.test(url)) {
    return { valid: false, reason: 'Not a YouTube URL' };
  }
  
  // Extract video ID
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (!videoIdMatch) {
    return { valid: false, reason: 'No video ID found' };
  }
  
  return { valid: true, videoId: videoIdMatch[1] };
};

const validateTrailers = async () => {
  try {
    const allMovies = await Movie.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Validating ${allMovies.length} movie trailers...\n`);
    
    let validTrailers = 0;
    let invalidTrailers = 0;
    const invalidMovies = [];
    
    for (const movie of allMovies) {
      if (!movie.trailer || movie.trailer.trim() === '' || movie.trailer === 'null') {
        invalidTrailers++;
        invalidMovies.push({
          title: movie.title,
          trailer: movie.trailer || '(empty)',
          reason: 'Empty or null'
        });
        continue;
      }
      
      const validation = checkYouTubeURL(movie.trailer);
      
      if (validation.valid) {
        validTrailers++;
        console.log(`✅ ${movie.title}`);
        console.log(`   Video ID: ${validation.videoId}`);
        console.log(`   URL: ${movie.trailer}\n`);
      } else {
        invalidTrailers++;
        invalidMovies.push({
          title: movie.title,
          trailer: movie.trailer,
          reason: validation.reason
        });
        console.log(`❌ ${movie.title}`);
        console.log(`   Reason: ${validation.reason}`);
        console.log(`   URL: ${movie.trailer}\n`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Valid trailers: ${validTrailers}/${allMovies.length}`);
    console.log(`   ❌ Invalid trailers: ${invalidTrailers}/${allMovies.length}`);
    
    if (invalidMovies.length > 0) {
      console.log('\n❌ Invalid Trailers:');
      invalidMovies.forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title}`);
        console.log(`      URL: ${movie.trailer}`);
        console.log(`      Reason: ${movie.reason}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await validateTrailers();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

