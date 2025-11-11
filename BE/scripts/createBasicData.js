/**
 * Quick script to create basic branches, theaters and showtimes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from '../models/branchModel.js';
import Theater from '../models/theaterModel.js';
import SeatLayout from '../models/seatLayoutModel.js';
import Seat from '../models/seatModel.js';
import Movie from '../models/movieModel.js';
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

const createBasicSetup = async () => {
  console.log('🎬 Creating Basic Cinema Setup...\n');

  // 1. Create Branches and Theaters first (SeatLayout needs theater reference)
  const branchesData = [
    // CGV
    { name: 'CGV Vincom Center', chain: 'CGV', city: 'Ho Chi Minh', province: 'Ho Chi Minh' },
    { name: 'CGV Aeon Mall', chain: 'CGV', city: 'Ho Chi Minh', province: 'Ho Chi Minh' },
    { name: 'CGV Landmark 81', chain: 'CGV', city: 'Ho Chi Minh', province: 'Ho Chi Minh' },
    
    // BHD
    { name: 'BHD Star Bitexco', chain: 'BHD', city: 'Ho Chi Minh', province: 'Ho Chi Minh' },
    { name: 'BHD Star Cineplex', chain: 'BHD', city: 'Ho Chi Minh', province: 'Ho Chi Minh' },
    
    // Lotte
    { name: 'Lotte Cinema Diamond', chain: 'Lotte', city: 'Ho Chi Minh', province: 'Ho Chi Minh' },
    { name: 'Lotte Cinema Go Vap', chain: 'Lotte', city: 'Ho Chi Minh', province: 'Ho Chi Minh' },
  ];

  const createdBranches = [];

  for (const branchData of branchesData) {
    let branch = await Branch.findOne({ name: branchData.name });
    
    if (!branch) {
      console.log(`\nCreating ${branchData.name}...`);
      
      // Create branch first (without theaters)
      branch = await Branch.create({
        name: branchData.name,
        cinemaChain: branchData.chain,
        location: {
          address: `123 ${branchData.name} Street`,
          city: branchData.city,
          province: branchData.province
        },
        contact: {
          phone: '0901234567',
          email: `contact@${branchData.chain.toLowerCase()}.com`
        },
        theaters: [],
        facilities: ['Parking', '3D', 'IMAX'],
        isActive: true
      });
      
      // Create 2 theaters for this branch
      const theaterIds = [];
      
      for (let i = 1; i <= 2; i++) {
        // Create theater
        const theater = await Theater.create({
          name: `${branchData.name} - Screen ${i}`,
          branch: branch._id,
          seatLayout: null // Will update later
        });
        
        theaterIds.push(theater._id);
        
        // Create seat layout for this theater
        const seatLayout = await SeatLayout.create({
          name: `${branchData.name} - Screen ${i} Layout`,
          branch: branch._id,
          theater: theater._id,
          rows: 10,
          seatsPerRow: 10,
          rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
          vipRows: ['H', 'I', 'J'],
          coupleSeats: [
            { row: 'F', startSeat: 4, endSeat: 7 },
            { row: 'G', startSeat: 4, endSeat: 7 },
            { row: 'H', startSeat: 4, endSeat: 7 }
          ],
          aisleAfterColumns: [5]
        });
        
        // Update theater with seat layout
        await Theater.findByIdAndUpdate(theater._id, { seatLayout: seatLayout._id });
        
        // Create seats for this theater
        const seatCount = await Seat.countDocuments({ theater: theater._id, branch: branch._id });
        
        if (seatCount === 0) {
          const seats = [];
          const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
          
          for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            for (let col = 1; col <= 10; col++) {
              let seatType = 'standard';
              if (rowIndex >= 7) seatType = 'vip'; // Last 3 rows are VIP
              if (col >= 4 && col <= 7 && rowIndex >= 5 && rowIndex <= 7) seatType = 'couple'; // Middle back rows
              
              seats.push({
                row: rows[rowIndex],
                number: col,
                type: seatType,
                theater: theater._id,
                branch: branch._id,
                isActive: true,
                position: {
                  x: col - 1,  // 0-indexed
                  y: rowIndex  // 0-indexed
                }
              });
            }
          }
          
          await Seat.insertMany(seats);
          console.log(`  ✓ Created ${seats.length} seats for ${theater.name}`);
        }
      }
      
      // Update branch with theaters
      await Branch.findByIdAndUpdate(branch._id, { theaters: theaterIds });
      
      console.log(`✅ ${branchData.name} created with 2 theaters`);
    }
    
    createdBranches.push(branch);
  }

  console.log(`\n✅ Total branches: ${createdBranches.length}`);

  // 3. Create Showtimes for all movies
  console.log('\n🎬 Creating showtimes for all movies...');
  
  const movies = await Movie.find({ status: 'now-showing' });
  console.log(`Found ${movies.length} movies with status 'now-showing'`);
  
  if (movies.length === 0) {
    console.log('⚠️  No movies found with status "now-showing"');
    console.log('Please update your movies status first');
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let showtimesCreated = 0;
  
  for (const movie of movies) {
    console.log(`\n📽️  Creating showtimes for: ${movie.title}`);
    
    // Create showtimes for next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDate = new Date(today);
      showDate.setDate(showDate.getDate() + dayOffset);
      
      // For each branch (all chains)
      for (const branch of createdBranches) {
        const populatedBranch = await Branch.findById(branch._id).populate('theaters');
        
        if (!populatedBranch.theaters || populatedBranch.theaters.length === 0) continue;
        
        // Use first theater
        const theater = populatedBranch.theaters[0];
        
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
          
          // Check if already exists
          const existing = await Showtime.findOne({
            movie: movie._id,
            branch: branch._id,
            theater: theater._id,
            startTime: startTime
          });
          
          if (!existing) {
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
          }
        }
      }
    }
    
    console.log(`  ✓ Created showtimes for ${movie.title}`);
  }
  
  console.log(`\n✅ Total showtimes created: ${showtimesCreated}`);
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`   Branches: ${createdBranches.length}`);
  console.log(`   Movies: ${movies.length}`);
  console.log(`   Showtimes: ${showtimesCreated}`);
  console.log(`   Days: 7`);
  console.log(`   Times per day: 3`);
};

const main = async () => {
  await connectDB();
  
  try {
    await createBasicSetup();
    console.log('\n✅ Setup complete!');
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📊 Database connection closed');
  }
};

main();

