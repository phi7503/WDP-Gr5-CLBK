import mongoose from 'mongoose';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

async function createTestUsers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ Connected to MongoDB');
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
      role: 'customer',
      province: 'Hà Nội',
      city: 'Hà Nội',
      gender: 'male',
      dob: new Date('1999-10-10'),
    });
    
    // Create User 2  
    const user2 = new User({
      name: 'Trần Thị B',
      email: 'test2@example.com', 
      password: '123456',
      phone: '0987654321',
      role: 'customer',
      province: 'Hà Nội',
      city: 'Hà Nội',
      gender: 'female',
      dob: new Date('2001-12-05'),
    });
    
    // Create User 3
    const user3 = new User({
      name: 'Nguyễn Văn Mạnh',
      email: 'manhgg22@gmail.com',
      password: '123456',
      phone: '0869287789',
      role: 'customer',
      province: 'Hà Nội',
      city: 'Hà Nội',
      gender: 'male',
      dob: new Date('2000-01-01'),
    });
    
    // Save users (password will be hashed by pre-save hook)
    await user1.save();
    await user2.save();
    await user3.save();
    
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
