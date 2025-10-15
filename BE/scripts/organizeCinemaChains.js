/**
 * Script to organize branches into cinema chains (CGV, BHD, Lotte)
 * and check movies without showtimes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from '../models/branchModel.js';
import Movie from '../models/movieModel.js';
import Showtime from '../models/showtimeModel.js';
import Theater from '../models/theaterModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Detect cinema chain from branch name
const detectCinemaChain = (branchName) => {
  const name = branchName.toLowerCase();
  if (name.includes('cgv')) return 'CGV';
  if (name.includes('bhd') || name.includes('star')) return 'BHD';
  if (name.includes('lotte') || name.includes('platinum')) return 'Lotte';
  return 'Other';
};

// Step 1: Update all branches with cinema chain
const updateBranchesWithChain = async () => {
  console.log('\n📊 Step 1: Updating branches with cinema chains...');
  
  const branches = await Branch.find({});
  console.log(`Found ${branches.length} branches`);
  
  let updated = 0;
  for (const branch of branches) {
    const chain = detectCinemaChain(branch.name);
    branch.cinemaChain = chain;
    await branch.save();
    console.log(`✓ ${branch.name} → ${chain}`);
    updated++;
  }
  
  console.log(`\n✅ Updated ${updated} branches`);
  
  // Show summary
  const summary = await Branch.aggregate([
    { $group: { _id: '$cinemaChain', count: { $sum: 1 }, branches: { $push: '$name' } } },
    { $sort: { _id: 1 } }
  ]);
  
  console.log('\n📈 Summary by Cinema Chain:');
  summary.forEach(item => {
    console.log(`\n${item._id}: ${item.count} branches`);
    item.branches.forEach(name => console.log(`  - ${name}`));
  });
};

// Step 2: Check movies without showtimes
const checkMoviesWithoutShowtimes = async () => {
  console.log('\n\n📊 Step 2: Checking movies without showtimes...');
  
  const allMovies = await Movie.find({ status: 'now-showing' }).select('title status');
  console.log(`Found ${allMovies.length} movies with status 'now-showing'`);
  
  const moviesWithoutShowtimes = [];
  
  for (const movie of allMovies) {
    const showtimeCount = await Showtime.countDocuments({ 
      movie: movie._id,
      startTime: { $gte: new Date() } // Future showtimes
    });
    
    if (showtimeCount === 0) {
      moviesWithoutShowtimes.push(movie);
      console.log(`❌ "${movie.title}" - NO SHOWTIMES`);
    } else {
      console.log(`✓ "${movie.title}" - ${showtimeCount} showtimes`);
    }
  }
  
  console.log(`\n⚠️  ${moviesWithoutShowtimes.length} movies WITHOUT showtimes:`);
  moviesWithoutShowtimes.forEach(m => console.log(`   - ${m.title}`));
  
  return moviesWithoutShowtimes;
};

// Step 3: Show showtimes distribution by cinema chain
const showShowtimesDistribution = async () => {
  console.log('\n\n📊 Step 3: Showtimes distribution by cinema chain...');
  
  const distribution = await Showtime.aggregate([
    {
      $lookup: {
        from: 'branches',
        localField: 'branch',
        foreignField: '_id',
        as: 'branchInfo'
      }
    },
    { $unwind: '$branchInfo' },
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movieInfo'
      }
    },
    { $unwind: '$movieInfo' },
    {
      $group: {
        _id: {
          chain: '$branchInfo.cinemaChain',
          movieTitle: '$movieInfo.title'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.chain': 1, count: -1 } }
  ]);
  
  // Group by chain
  const byChain = {};
  distribution.forEach(item => {
    const chain = item._id.chain;
    if (!byChain[chain]) byChain[chain] = [];
    byChain[chain].push({
      movie: item._id.movieTitle,
      showtimes: item.count
    });
  });
  
  console.log('\n📈 Showtimes by Cinema Chain:');
  Object.keys(byChain).sort().forEach(chain => {
    console.log(`\n🎬 ${chain}:`);
    byChain[chain].forEach(item => {
      console.log(`   ${item.movie}: ${item.showtimes} showtimes`);
    });
  });
};

// Step 4: Create showtimes for movies without them
const createMissingShowtimes = async (moviesWithoutShowtimes) => {
  if (moviesWithoutShowtimes.length === 0) {
    console.log('\n✅ All movies have showtimes!');
    return;
  }
  
  console.log(`\n\n📊 Step 4: Creating showtimes for ${moviesWithoutShowtimes.length} movies...`);
  
  // Get all branches with theaters
  const branches = await Branch.find({ isActive: true }).populate('theaters');
  console.log(`Found ${branches.length} active branches`);
  
  if (branches.length === 0) {
    console.log('❌ No active branches found!');
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let created = 0;
  
  for (const movie of moviesWithoutShowtimes) {
    console.log(`\n📽️  Creating showtimes for: ${movie.title}`);
    
    // Create showtimes for next 7 days across all chains
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDate = new Date(today);
      showDate.setDate(showDate.getDate() + dayOffset);
      
      // Distribute across cinema chains evenly
      const chainsToUse = ['CGV', 'BHD', 'Lotte'];
      
      for (const chain of chainsToUse) {
        // Get branches for this chain
        const chainBranches = branches.filter(b => b.cinemaChain === chain && b.theaters.length > 0);
        
        if (chainBranches.length === 0) continue;
        
        // Pick first branch for this chain
        const branch = chainBranches[0];
        const theater = branch.theaters[0];
        
        // Create 3 showtimes per day per chain: morning, afternoon, evening
        const showTimes = [
          { hour: 10, minute: 0 },
          { hour: 14, minute: 30 },
          { hour: 19, minute: 0 }
        ];
        
        for (const time of showTimes) {
          const startTime = new Date(showDate);
          startTime.setHours(time.hour, time.minute, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + (movie.duration || 120));
          
          // Check if showtime already exists
          const existing = await Showtime.findOne({
            movie: movie._id,
            branch: branch._id,
            theater: theater._id,
            startTime: startTime
          });
          
          if (!existing) {
            const showtime = new Showtime({
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
              isFirstShow: time.hour === 10,
              isLastShow: time.hour === 19,
              status: 'active'
            });
            
            await showtime.save();
            created++;
            console.log(`   ✓ ${chain} - ${branch.name} - ${time.hour}:${time.minute.toString().padStart(2, '0')}`);
          }
        }
      }
    }
  }
  
  console.log(`\n✅ Created ${created} new showtimes!`);
};

// Main execution
const main = async () => {
  console.log('🎬 Cinema Chain Organization Script');
  console.log('===================================\n');
  
  await connectDB();
  
  try {
    // Step 1: Update branches
    await updateBranchesWithChain();
    
    // Step 2: Check movies without showtimes
    const moviesWithoutShowtimes = await checkMoviesWithoutShowtimes();
    
    // Step 3: Show current distribution
    await showShowtimesDistribution();
    
    // Step 4: Create missing showtimes (optional - uncomment to enable)
    const shouldCreateShowtimes = process.argv.includes('--create-showtimes');
    if (shouldCreateShowtimes) {
      await createMissingShowtimes(moviesWithoutShowtimes);
      // Show updated distribution
      await showShowtimesDistribution();
    } else {
      console.log('\n💡 To create showtimes for movies without them, run:');
      console.log('   node scripts/organizeCinemaChains.js --create-showtimes');
    }
    
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📊 Database connection closed');
  }
};

main();

