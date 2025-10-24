const mongoose = require('mongoose');
const User = require('../models/userModel');

mongoose.connect('mongodb://localhost:27017/cinema_booking');

async function listUsers() {
  try {
    console.log('=== LISTING ALL USERS ===\n');
    
    const users = await User.find({}).select('name email role');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('\n🔧 CREATING TEST USER...');
      
      const testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: '123456',
        phone: '0123456789',
        role: 'user'
      });
      
      await testUser.save();
      console.log('✅ Created test user:');
      console.log('   Email: test@example.com');
      console.log('   Password: 123456');
      console.log('   Name: Test User');
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    console.log('\n🎯 LOGIN CREDENTIALS:');
    console.log('Email: test@example.com');
    console.log('Password: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
