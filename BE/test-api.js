import fetch from 'node-fetch';

const testAPI = async () => {
  try {
    console.log('Testing API endpoints...');
    
    // Test employee bookings endpoint
    const response = await fetch('http://localhost:5000/api/bookings/employee-all');
    const data = await response.json();
    
    console.log('✅ API Response:', data);
    console.log('✅ Server is running successfully!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
};

testAPI();
