/**
 * Script to fix showtimes - Update ALL movies to now-showing and create showtimes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/movieModel.js';
import Branch from '../models/branchModel.js';
import Theater from '../models/theaterModel.js';
import Showtime from '../models/showtimeModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const fixMoviesAndCreateShowtimes = async () => {
  console.log('🎬 FIXING MOVIES & CREATING SHOWTIMES...\n');

  // 1. Update ALL movies to 'now-showing'
  console.log('📝 Step 1: Updating all movies to "now-showing"...');
  const updateResult = await Movie.updateMany(
    {},
    { $set: { status: 'now-showing' } }
  );
  console.log(`✅ Updated ${updateResult.modifiedCount} movies\n`);

  // 2. Get all movies
  const movies = await Movie.find({});
  console.log(`📽️  Found ${movies.length} movies total\n`);

  if (movies.length === 0) {
    console.log('⚠️  No movies found in database!');
    return;
  }

  // 3. Get all branches with theaters
  const branches = await Branch.find({}).populate('theaters');
  console.log(`🏢 Found ${branches.length} branches\n`);

  if (branches.length === 0) {
    console.log('⚠️  No branches found! Please run setup-full first.');
    return;
  }

  // 4. Delete existing showtimes (fresh start)
  console.log('🗑️  Deleting old showtimes...');
  const deleteResult = await Showtime.deleteMany({});
  console.log(`✅ Deleted ${deleteResult.deletedCount} old showtimes\n`);

  // 5. Create showtimes for ALL movies
  console.log('🎬 Creating NEW showtimes for ALL movies...\n');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let showtimesCreated = 0;
  let movieCount = 0;
  
  for (const movie of movies) {
    movieCount++;
    console.log(`[${movieCount}/${movies.length}] 📽️  ${movie.title}`);
    
    let movieShowtimes = 0;
    
    // Create showtimes for next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDate = new Date(today);
      showDate.setDate(showDate.getDate() + dayOffset);
      
      // For each branch
      for (const branch of branches) {
        if (!branch.theaters || branch.theaters.length === 0) continue;
        
        // Use first theater of each branch
        const theater = branch.theaters[0];
        
        // 3 showtimes per day: morning, afternoon, evening
        const times = [
          { hour: 10, minute: 0, isFirst: true, isLast: false },
          { hour: 14, minute: 30, isFirst: false, isLast: false },
          { hour: 19, minute: 0, isFirst: false, isLast: true }
        ];
        
        for (const time of times) {
          const startTime = new Date(showDate);
          startTime.setHours(time.hour, time.minute, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + (movie.duration || 120));
          
          try {
            await Showtime.create({
              movie: movie._id,
              branch: branch._id,
              theater: theater._id,
              startTime,
              endTime,
              price: {
                standard: 100000,
                vip: 150000,
                couple: 180000
              },
              isFirstShow: time.isFirst,
              isLastShow: time.isLast,
              status: 'active'
            });
            
            showtimesCreated++;
            movieShowtimes++;
          } catch (error) {
            console.error(`    ❌ Error creating showtime: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`    ✓ Created ${movieShowtimes} showtimes`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL SUMMARY:');
  console.log(`${'='.repeat(60)}`);
  console.log(`   Total Movies: ${movies.length}`);
  console.log(`   Total Branches: ${branches.length}`);
  console.log(`   Total Showtimes Created: ${showtimesCreated}`);
  console.log(`   Days: 7`);
  console.log(`   Times per day: 3`);
  console.log(`   Expected per movie: ${branches.length * 7 * 3}`);
  console.log(`${'='.repeat(60)}\n`);
};

const main = async () => {
  await connectDB();
  
  try {
    await fixMoviesAndCreateShowtimes();
    console.log('✅ ALL DONE! You can now use the showtime pages.\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

main();

