import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';

async function testSocketConnection() {
  try {
    console.log('🧪 Testing Socket.IO connection...');
    
    // Create a test token
    const testToken = jwt.sign(
      { id: '68fb42ee605488126ca4852e' }, // test2 user ID (Trần Thị B)
      '1234567890', // Use the correct JWT secret
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Test token created:', testToken.substring(0, 50) + '...');
    
    // Connect to socket
    const socket = io('http://localhost:5000', {
      auth: {
        token: testToken
      }
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      
      // Test join showtime
      const showtimeId = '68f70af5d7083344ef66c73d';
      console.log('🚪 Joining showtime:', showtimeId);
      socket.emit('join-showtime', showtimeId);
      
      // Test seat selection
      setTimeout(() => {
        console.log('🔒 Testing seat selection...');
        socket.emit('select-seats', {
          showtimeId: showtimeId,
          seatIds: ['6883a135245b2d10fd9e9884']
        });
      }, 2000);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });
    
    socket.on('seat-selection-success', (data) => {
      console.log('✅ Seat selection success:', data);
    });
    
    socket.on('seat-selection-failed', (data) => {
      console.log('❌ Seat selection failed:', data);
    });
    
    socket.on('seats-being-selected', (data) => {
      console.log('📍 Seats being selected:', data);
    });
    
    // Keep connection alive for testing
    setTimeout(() => {
      console.log('🔌 Disconnecting...');
      socket.disconnect();
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSocketConnection();
