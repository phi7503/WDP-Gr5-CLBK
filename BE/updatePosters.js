import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Movie Schema
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  genre: { type: [String], required: true },
  releaseDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  language: { type: String, required: true },
  director: { type: String, required: true },
  cast: { type: [String], required: true },
  poster: { type: String, required: true },
  trailer: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['now-showing', 'coming-soon', 'ended'],
    default: 'coming-soon'
  },
  hotness: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Movie = mongoose.model('Movie', movieSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Mapping từ tên phim đến tên file poster
const posterMapping = {
  'Nàng Bạch Tuyết': 'snow-white-2025.jpg',
  'Nhà Ga Ma Chó': 'station-ghost-2025.jpg',
  'Âm Dương Lộ': 'yin-yang-road-2025.jpg',
  'Na Tra 2: Ma Đồng Náo Hải': 'nezha-2.jpg',
  'Bố Già 3': 'bo-gia-3.jpg',
  'Cô Gái Đến Từ Hôm Qua': 'co-gai-den-tu-hom-qua-2025.jpg',
  'Siêu Sao Siêu Ngốc': 'sieu-sao-sieu-ngoc-2025.jpg',
  'Ván Cờ Vây – The Match': 'the-match-2025.jpg',
  'Rhino King': 'rhino-king-2025.jpg',
  'The Bad Guys 2': 'bad-guys-2-2025.jpg',
  'Freakier Friday': 'freakier-friday-2025.jpg',
  'Wicked: For Good': 'wicked-for-good-2025.jpg',
  'Fast & Furious 11': 'fast-furious-11-2025.jpg',
  'Spider-Man: Beyond the Spider-Verse': 'spiderman-beyond-2025.jpg',
  'Mission: Impossible 8': 'mission-impossible-8-2025.jpg',
  'Mật Danh: Kế Toán 2': 'accountant-2-2025.jpg',
  'Lưỡi Hái Tử Thần: Huyết Thống': 'scythe-bloodline-2025.jpg',
  'Quái Vật Đầm Lầy': 'swamp-monster-2025.jpg',
  'Biệt Đội Sấm Sét': 'thunder-squad-2025.jpg',
  'Trượt Dốc': 'sliding-down-2025.jpg',
  'Melo Movie - Tình Yêu Của Mu Bi': 'melo-movie-2025.jpg',
  'Avengers: Secret Wars': 'avengers-secret-wars-2025.jpg',
  'Black Panther: Wakanda Forever 2': 'black-panther-2-2025.jpg'
};

// Function to update poster paths
const updatePosters = async () => {
  try {
    console.log('🖼️  Starting poster path update...');
    
    const postersDir = path.join(__dirname, 'uploads', 'posters');
    
    // Check if posters directory exists
    if (!fs.existsSync(postersDir)) {
      console.log('📁 Creating uploads/posters directory...');
      fs.mkdirSync(postersDir, { recursive: true });
    }
    
    // Get list of existing poster files
    const existingFiles = fs.readdirSync(postersDir);
    console.log(`📂 Found ${existingFiles.length} existing poster files`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Update each movie's poster path
    for (const [movieTitle, posterFilename] of Object.entries(posterMapping)) {
      const movie = await Movie.findOne({ title: movieTitle });
      
      if (movie) {
        const newPosterPath = `uploads/posters/${posterFilename}`;
        
        // Check if poster file exists
        const posterPath = path.join(postersDir, posterFilename);
        const fileExists = fs.existsSync(posterPath);
        
        if (fileExists) {
          // Update poster path in database
          movie.poster = newPosterPath;
          await movie.save();
          console.log(`✅ Updated: ${movieTitle} → ${posterFilename}`);
          updatedCount++;
        } else {
          console.log(`⚠️  File not found: ${posterFilename} (${movieTitle})`);
          skippedCount++;
        }
      } else {
        console.log(`❌ Movie not found: ${movieTitle}`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updatedCount} movies`);
    console.log(`⚠️  Skipped: ${skippedCount} movies (files not found)`);
    console.log(`📁 Poster directory: ${postersDir}`);
    
    if (skippedCount > 0) {
      console.log('\n💡 To add missing posters:');
      console.log('1. Download poster images manually');
      console.log('2. Save them in uploads/posters/ directory');
      console.log('3. Run this script again');
    }
    
    console.log('\n🎉 Poster update completed!');
    
  } catch (error) {
    console.error('❌ Error updating posters:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Main execution
const main = async () => {
  console.log('🖼️  Poster Path Updater');
  console.log('========================');
  
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables');
    process.exit(1);
  }
  
  await connectDB();
  await updatePosters();
};

main().catch(console.error);
