const mongoose = require('mongoose');
const User = require('../models/userModel');

mongoose.connect('mongodb://localhost:27017/cinema_booking');

async function checkExistingUsers() {
  try {
    console.log('=== CHECKING EXISTING USERS ===\n');
    
    const users = await User.find({}).select('name email role');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    console.log('\n🎯 FOR SOCKET.IO TESTING:');
    console.log('You can use any existing user or create new ones');
    console.log('Just open 2 browser tabs and login with different accounts');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkExistingUsers();
