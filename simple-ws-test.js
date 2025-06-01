const io = require('socket.io-client');

console.log('Testing WebSocket connection to localhost:4000...');

const socket = io('http://localhost:4000', {
  path: '/socket.io',
  transports: ['polling'], // Start with polling to avoid WebSocket issues
  timeout: 5000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
  
  // Test authentication
  socket.emit('authenticate', { 
    userId: 'test-user-123', 
    token: 'test-token' 
  });
});

socket.on('authenticated', (data) => {
  console.log('✅ Authenticated:', data);
  
  // Test ping
  socket.emit('ping');
});

socket.on('pong', (data) => {
  console.log('✅ Ping/Pong working:', data);
  
  // Test complete
  console.log('✅ WebSocket test successful');
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ Test timed out');
  socket.disconnect();
  process.exit(1);
}, 10000);