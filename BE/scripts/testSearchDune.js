import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';

dotenv.config();

const testSearch = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test search for "dune"
    const searchTerm = 'dune';
    const movies = await Movie.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { director: { $regex: searchTerm, $options: 'i' } },
        { cast: { $regex: searchTerm, $options: 'i' } },
      ]
    }).select('title status genre').limit(10);

    console.log(`\n🔍 Search results for "${searchTerm}":`);
    console.log(`Found ${movies.length} movies:`);
    movies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title} (${movie.status}) - ${movie.genre?.join(', ') || 'N/A'}`);
    });

    // Also check all movies with "dune" in title (case insensitive)
    const allDuneMovies = await Movie.find({
      title: { $regex: /dune/i }
    }).select('title status').limit(10);

    console.log(`\n📽️ All movies with "dune" in title:`);
    console.log(`Found ${allDuneMovies.length} movies:`);
    allDuneMovies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title} (${movie.status})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testSearch();





