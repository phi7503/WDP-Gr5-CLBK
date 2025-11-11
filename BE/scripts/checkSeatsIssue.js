const mongoose = require('mongoose');
const Showtime = require('../models/showtimeModel');
const Theater = require('../models/theaterModel');
const SeatLayout = require('../models/seatLayoutModel');

mongoose.connect('mongodb://localhost:27017/cinema_booking');

async function checkSeatsIssue() {
  try {
    console.log('=== CHECKING SEATS ISSUE ===\n');
    
    // Get some showtimes
    const showtimes = await Showtime.find({}).populate('theater').limit(5);
    
    for (const showtime of showtimes) {
      console.log(`Showtime ID: ${showtime._id}`);
      console.log(`Movie: ${showtime.movie}`);
      console.log(`Theater ID: ${showtime.theater?._id}`);
      console.log(`Theater Name: ${showtime.theater?.name}`);
      
      if (showtime.theater?.seatLayout) {
        console.log(`SeatLayout ID: ${showtime.theater.seatLayout}`);
        
        const seatLayout = await SeatLayout.findById(showtime.theater.seatLayout);
        if (seatLayout) {
          console.log(`✅ SeatLayout found: ${seatLayout._id}`);
          console.log(`Seats count: ${seatLayout.seats?.length || 0}`);
          
          if (seatLayout.seats && seatLayout.seats.length > 0) {
            console.log(`Sample seat: Row ${seatLayout.seats[0].row}, Number ${seatLayout.seats[0].number}`);
          }
        } else {
          console.log('❌ SeatLayout NOT FOUND');
        }
      } else {
        console.log('❌ Theater has NO seatLayout');
      }
      console.log('---\n');
    }
    
    // Check theaters without seatLayout
    console.log('=== THEATERS WITHOUT SEAT LAYOUT ===\n');
    const theatersWithoutLayout = await Theater.find({ seatLayout: { $exists: false } });
    console.log(`Found ${theatersWithoutLayout.length} theaters without seatLayout`);
    
    for (const theater of theatersWithoutLayout) {
      console.log(`Theater: ${theater.name} (${theater._id})`);
    }
    
    // Check seatLayouts
    console.log('\n=== SEAT LAYOUTS ===\n');
    const seatLayouts = await SeatLayout.find({});
    console.log(`Total seat layouts: ${seatLayouts.length}`);
    
    for (const layout of seatLayouts) {
      console.log(`Layout ${layout._id}: ${layout.seats?.length || 0} seats`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSeatsIssue();
