const mongoose = require('mongoose');
const Showtime = require('../models/showtimeModel');
const Theater = require('../models/theaterModel');
const SeatLayout = require('../models/seatLayoutModel');

mongoose.connect('mongodb://localhost:27017/cinema_booking');

async function fixSeatLayout() {
  try {
    console.log('=== FIXING SEAT LAYOUT ISSUE ===\n');
    
    // 1. Check if we have any seat layouts
    const seatLayouts = await SeatLayout.find({});
    console.log(`Found ${seatLayouts.length} seat layouts`);
    
    if (seatLayouts.length === 0) {
      console.log('❌ No seat layouts found! Creating default seat layout...');
      
      // Create a default seat layout
      const defaultSeatLayout = new SeatLayout({
        name: 'Standard Cinema Layout',
        description: 'Default seat layout for all theaters',
        seats: []
      });
      
      // Generate seats (8 rows, 12 seats per row)
      for (let row = 1; row <= 8; row++) {
        for (let seat = 1; seat <= 12; seat++) {
          defaultSeatLayout.seats.push({
            row: String.fromCharCode(64 + row), // A, B, C, D, E, F, G, H
            number: seat,
            type: 'standard',
            price: 50000 // 50k VND
          });
        }
      }
      
      await defaultSeatLayout.save();
      console.log(`✅ Created default seat layout with ${defaultSeatLayout.seats.length} seats`);
    }
    
    // 2. Check theaters without seatLayout
    const theatersWithoutLayout = await Theater.find({ 
      $or: [
        { seatLayout: { $exists: false } },
        { seatLayout: null }
      ]
    });
    
    console.log(`\nFound ${theatersWithoutLayout.length} theaters without seat layout`);
    
    // Get the first available seat layout
    const availableLayout = await SeatLayout.findOne({});
    
    if (availableLayout) {
      console.log(`Using seat layout: ${availableLayout._id}`);
      
      // Assign seat layout to theaters that don't have one
      for (const theater of theatersWithoutLayout) {
        theater.seatLayout = availableLayout._id;
        await theater.save();
        console.log(`✅ Assigned seat layout to theater: ${theater.name}`);
      }
    }
    
    // 3. Verify the fix
    console.log('\n=== VERIFICATION ===');
    const showtimes = await Showtime.find({}).populate('theater').limit(3);
    
    for (const showtime of showtimes) {
      console.log(`\nShowtime: ${showtime._id}`);
      console.log(`Theater: ${showtime.theater?.name}`);
      
      if (showtime.theater?.seatLayout) {
        const seatLayout = await SeatLayout.findById(showtime.theater.seatLayout);
        if (seatLayout) {
          console.log(`✅ SeatLayout: ${seatLayout._id} (${seatLayout.seats?.length || 0} seats)`);
        } else {
          console.log('❌ SeatLayout not found');
        }
      } else {
        console.log('❌ Theater has no seatLayout');
      }
    }
    
    console.log('\n✅ Seat layout fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixSeatLayout();
