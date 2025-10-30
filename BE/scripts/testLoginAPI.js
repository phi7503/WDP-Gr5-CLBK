import mongoose from 'mongoose';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

async function testLoginAPI() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ Connected to MongoDB');
    
    // Test the exact same logic as authController
    const email = 'test1@example.com';
    const password = '123456';
    
    console.log(`\n🔍 Testing login API logic for: ${email}`);
    
    // Check for user email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User found:', user.name);
    
    // Test password match
    const passwordMatch = await user.matchPassword(password);
    console.log(`🔐 Password match: ${passwordMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (user && passwordMatch) {
      // Generate token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here_123456', {
        expiresIn: "30d",
      });
      
      const response = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: token,
      };
      
      console.log('\n🎉 Login API Response:');
      console.log(`- _id: ${response._id}`);
      console.log(`- name: ${response.name}`);
      console.log(`- email: ${response.email}`);
      console.log(`- role: ${response.role}`);
      console.log(`- token: ${token.substring(0, 20)}...`);
      
      console.log('\n✅ Login should work! The issue might be in the frontend request.');
    } else {
      console.log('❌ Login failed - password mismatch');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLoginAPI();