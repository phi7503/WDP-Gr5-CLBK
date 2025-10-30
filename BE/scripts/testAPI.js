import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...');
    
    // Test login API
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test1@example.com',
        password: '123456'
      })
    });
    
    console.log('Login API Status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData.name);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', errorText);
    }
    
    // Test showtime API
    const showtimeResponse = await fetch('http://localhost:5000/api/showtimes/68f70af5d7083344ef66c73d');
    console.log('Showtime API Status:', showtimeResponse.status);
    
    if (showtimeResponse.ok) {
      const showtimeData = await showtimeResponse.json();
      console.log('✅ Showtime loaded:', showtimeData.movie?.title);
    } else {
      const errorText = await showtimeResponse.text();
      console.log('❌ Showtime failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testAPI();
