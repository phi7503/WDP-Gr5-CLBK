import mongoose from 'mongoose';
import User from '../models/userModel.js';

async function testLogin() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ Connected to MongoDB');
    
    // Test login with test1@example.com
    const email = 'test1@example.com';
    const password = '123456';
    
    console.log(`\n🔍 Testing login for: ${email}`);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Password hash: ${user.password.substring(0, 20)}...`);
    
    // Test password match
    const isPasswordMatch = await user.matchPassword(password);
    console.log(`\n🔐 Password match test: ${isPasswordMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (isPasswordMatch) {
      console.log('\n🎉 Login should work! Try again in the browser.');
    } else {
      console.log('\n❌ Password mismatch. Let me recreate the user...');
      
      // Delete and recreate user
      await User.deleteOne({ email });
      
      const newUser = new User({
        name: 'Nguyễn Văn A',
        email: 'test1@example.com',
        password: '123456',
        phone: '0123456789',
        role: 'customer'
      });
      
      await newUser.save();
      console.log('✅ User recreated successfully!');
      
      // Test again
      const testUser = await User.findOne({ email });
      const testMatch = await testUser.matchPassword(password);
      console.log(`🔐 Password match after recreation: ${testMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
