import mongoose from 'mongoose';
import Showtime from '../models/showtimeModel.js';
import Movie from '../models/movieModel.js';
import Theater from '../models/theaterModel.js';

async function checkShowtimes() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ Connected to MongoDB');
    
    const showtimes = await Showtime.find().limit(5).populate('movie').populate('theater');
    console.log('\n📅 Available showtimes:');
    
    if (showtimes.length === 0) {
      console.log('❌ No showtimes found!');
    } else {
      showtimes.forEach((st, i) => {
        console.log(`${i+1}. ID: ${st._id}`);
        console.log(`   Movie: ${st.movie?.title || 'N/A'}`);
        console.log(`   Theater: ${st.theater?.name || 'N/A'}`);
        console.log(`   Date: ${st.date}`);
        console.log(`   Time: ${st.time}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkShowtimes();
