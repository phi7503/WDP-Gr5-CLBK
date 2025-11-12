/**
 * Test search API
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const testSearch = async (searchTerm) => {
  console.log(`\n🔍 Testing search for: "${searchTerm}"\n`);
  
  // Escape special regex characters (same as in controller)
  const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const filter = {
    $or: [
      { title: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
      { director: { $regex: escapedSearch, $options: "i" } },
      { cast: { $regex: escapedSearch, $options: "i" } },
      { genre: { $regex: escapedSearch, $options: "i" } },
    ]
  };
  
  const movies = await Movie.find(filter)
    .select('title description genre director cast')
    .limit(10);
  
  console.log(`📊 Found ${movies.length} movies:\n`);
  
  if (movies.length > 0) {
    movies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title}`);
      console.log(`   Genre: ${movie.genre?.join(', ') || 'N/A'}`);
      console.log(`   Director: ${movie.director || 'N/A'}`);
      console.log(`   Description: ${movie.description?.substring(0, 80)}...`);
      console.log('');
    });
  } else {
    console.log('❌ No movies found');
  }
  
  return movies;
};

(async () => {
  await connectDB();
  
  // Test với các từ khóa khác nhau
  await testSearch('dark');
  await testSearch('dune');
  await testSearch('fantastic');
  await testSearch('ma');
  
  await mongoose.connection.close();
  process.exit(0);
})();

