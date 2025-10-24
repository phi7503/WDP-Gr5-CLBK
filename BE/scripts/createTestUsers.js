const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/cinema_booking');

async function createTestUsers() {
  try {
    console.log('=== CREATING TEST USERS FOR SOCKET.IO TESTING ===\n');
    
    // Delete existing test users
    await User.deleteMany({ 
      email: { $in: ['test1@example.com', 'test2@example.com'] } 
    });
    console.log('✅ Deleted existing test users');
    
    // Create User 1
    const user1 = new User({
      name: 'Nguyễn Văn A',
      email: 'test1@example.com',
      password: '123456',
      phone: '0123456789',
      role: 'user'
    });
    
    // Create User 2  
    const user2 = new User({
      name: 'Trần Thị B',
      email: 'test2@example.com', 
      password: '123456',
      phone: '0987654321',
      role: 'user'
    });
    
    // Save users (password will be hashed by pre-save hook)
    await user1.save();
    await user2.save();
    
    console.log('✅ Created test users:');
    console.log('👤 User 1:');
    console.log('   Email: test1@example.com');
    console.log('   Password: 123456');
    console.log('   Name: Nguyễn Văn A');
    console.log('');
    console.log('👤 User 2:');
    console.log('   Email: test2@example.com');
    console.log('   Password: 123456');
    console.log('   Name: Trần Thị B');
    console.log('');
    console.log('🎯 HOW TO TEST SOCKET.IO:');
    console.log('1. Open 2 browser tabs/windows');
    console.log('2. Tab 1: Login with test1@example.com');
    console.log('3. Tab 2: Login with test2@example.com');
    console.log('4. Both go to same showtime booking page');
    console.log('5. Watch real-time seat selection!');
    console.log('');
    console.log('✅ Test users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUsers();
