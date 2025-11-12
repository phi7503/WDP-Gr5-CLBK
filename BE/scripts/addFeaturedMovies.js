/**
 * Add featured movies (Dune, The Dark Knight, etc.) to database
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

const featuredMovies = [
  {
    title: "Dune",
    description: "Paul Atreides leads a rebellion to restore his family's reign over the desert planet Arrakis while facing a terrible future only he can foresee.",
    duration: 155,
    genre: ["Sci-Fi", "Adventure", "Drama"],
    releaseDate: new Date("2021-10-22"),
    endDate: new Date("2025-12-31"),
    language: "English",
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac", "Zendaya"],
    poster: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyUYV37hLq5t3Fj0.jpg",
    backdropImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&q=80",
    trailer: "https://www.youtube.com/watch?v=8g18jFHCLXk",
    status: "now-showing",
    hotness: 85,
    rating: 8.0,
  },
  {
    title: "The Dark Knight",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    duration: 152,
    genre: ["Action", "Crime", "Drama"],
    releaseDate: new Date("2008-07-18"),
    endDate: new Date("2025-12-31"),
    language: "English",
    director: "Christopher Nolan",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80",
    trailer: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
    status: "now-showing",
    hotness: 90,
    rating: 9.1,
  },
  {
    title: "Avengers: Endgame",
    description: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.",
    duration: 181,
    genre: ["Action", "Adventure", "Sci-Fi"],
    releaseDate: new Date("2019-04-26"),
    endDate: new Date("2025-12-31"),
    language: "English",
    director: "Anthony Russo, Joe Russo",
    cast: ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo", "Chris Hemsworth"],
    poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    backdropImage: "https://image.tmdb.org/t/p/w1920/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    trailer: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
    status: "now-showing",
    hotness: 88,
    rating: 9.2,
  },
  {
    title: "Inception",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    duration: 148,
    genre: ["Action", "Sci-Fi", "Thriller"],
    releaseDate: new Date("2010-07-16"),
    endDate: new Date("2025-12-31"),
    language: "English",
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy", "Ellen Page"],
    poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    backdropImage: "https://image.tmdb.org/t/p/w1920/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    trailer: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    status: "now-showing",
    hotness: 87,
    rating: 9.0,
  },
  {
    title: "Interstellar",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    duration: 169,
    genre: ["Adventure", "Drama", "Sci-Fi"],
    releaseDate: new Date("2014-11-07"),
    endDate: new Date("2025-12-31"),
    language: "English",
    director: "Christopher Nolan",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdropImage: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&q=80",
    trailer: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    status: "now-showing",
    hotness: 86,
    rating: 8.8,
  },
];

const addFeaturedMovies = async () => {
  try {
    let added = 0;
    let skipped = 0;
    
    for (const movieData of featuredMovies) {
      // Check if movie already exists
      const existing = await Movie.findOne({ title: movieData.title });
      
      if (existing) {
        console.log(`⚠️  "${movieData.title}" already exists, skipping...`);
        skipped++;
        continue;
      }
      
      const movie = await Movie.create(movieData);
      console.log(`✅ Added: ${movie.title} (ID: ${movie._id})`);
      added++;
    }
    
    console.log(`\n🎉 Completed!`);
    console.log(`   ✅ Added: ${added} movies`);
    console.log(`   ⚠️  Skipped: ${skipped} movies`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

(async () => {
  await connectDB();
  await addFeaturedMovies();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
})();

