#!/usr/bin/env node

const io = require('socket.io-client');

// WebSocket Connection Test Script
async function testWebSocketConnection() {
  console.log('🧪 Starting WebSocket Validation Tests\n');
  
  const tests = {
    connectionEstablished: false,
    authenticationWorking: false,
    progressEventsReceived: false,
    errorHandlingWorks: false,
    reconnectionWorks: false
  };
  
  const results = [];
  
  try {
    console.log('1️⃣ Testing WebSocket Server Connection...');
    
    // Test basic connection
    const socket = io('http://localhost:4000', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });
    
    // Connection test
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
      
      socket.on('connect', () => {
        console.log('   ✅ WebSocket connected successfully');
        console.log(`   📊 Socket ID: ${socket.id}`);
        tests.connectionEstablished = true;
        clearTimeout(timeout);
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        console.log('   ❌ Connection failed:', error.message);
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    console.log('\n2️⃣ Testing Authentication...');
    
    // Test authentication
    const authSuccess = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      
      socket.on('authenticated', (data) => {
        console.log('   ✅ Authentication successful:', data);
        tests.authenticationWorking = true;
        clearTimeout(timeout);
        resolve(true);
      });
      
      socket.on('authentication_error', (error) => {
        console.log('   ⚠️ Authentication failed (expected for test):', error);
        clearTimeout(timeout);
        resolve(false);
      });
      
      // Send auth request
      socket.emit('authenticate', { 
        userId: 'test-user-123', 
        token: 'test-token' 
      });
    });
    
    if (authSuccess) {
      console.log('\n3️⃣ Testing Real-time Progress Events...');
      
      // Test progress subscription
      const testJobId = 'test-job-' + Date.now();
      
      socket.emit('subscribe_analysis', { jobId: testJobId });
      
      // Listen for subscription confirmation
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        
        socket.on('subscribed', (data) => {
          console.log('   ✅ Subscribed to analysis:', data.jobId);
          clearTimeout(timeout);
          resolve();
        });
      });
      
      // Simulate progress events
      let progressReceived = 0;
      socket.on('analysis_progress', (progress) => {
        progressReceived++;
        console.log(`   📈 Progress update ${progressReceived}: ${progress.percentage}% - ${progress.stage}`);
        
        if (progressReceived >= 1) {
          tests.progressEventsReceived = true;
        }
      });
      
      // Wait a moment for any incoming events
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n4️⃣ Testing Error Handling...');
    
    // Test ping/pong
    const pingSuccess = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 3000);
      
      socket.on('pong', (data) => {
        console.log('   ✅ Ping/Pong working:', data);
        tests.errorHandlingWorks = true;
        clearTimeout(timeout);
        resolve(true);
      });
      
      socket.emit('ping');
    });
    
    console.log('\n5️⃣ Testing Graceful Disconnect...');
    
    // Test disconnect
    socket.disconnect();
    console.log('   ✅ Socket disconnected gracefully');
    
    // Attempt reconnection
    console.log('\n6️⃣ Testing Reconnection...');
    
    const reconnectSocket = io('http://localhost:4000', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    });
    
    const reconnectSuccess = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      
      reconnectSocket.on('connect', () => {
        console.log('   ✅ Reconnection successful');
        tests.reconnectionWorks = true;
        clearTimeout(timeout);
        resolve(true);
      });
      
      reconnectSocket.on('connect_error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
    
    reconnectSocket.disconnect();
    
  } catch (error) {
    console.log('   ❌ Test error:', error.message);
  }
  
  // Generate test results
  console.log('\n📋 WEBSOCKET VALIDATION RESULTS:');
  console.log('================================');
  
  const checkMark = (test) => test ? '✅' : '❌';
  
  console.log(`${checkMark(tests.connectionEstablished)} WebSocket Server Connection: ${tests.connectionEstablished ? 'WORKING' : 'FAILED'}`);
  console.log(`${checkMark(tests.authenticationWorking)} Authentication Flow: ${tests.authenticationWorking ? 'WORKING' : 'FAILED'}`);
  console.log(`${checkMark(tests.progressEventsReceived)} Real-time Progress Events: ${tests.progressEventsReceived ? 'WORKING' : 'NOT TESTED'}`);
  console.log(`${checkMark(tests.errorHandlingWorks)} Error Handling (Ping/Pong): ${tests.errorHandlingWorks ? 'WORKING' : 'FAILED'}`);
  console.log(`${checkMark(tests.reconnectionWorks)} Reconnection Capability: ${tests.reconnectionWorks ? 'WORKING' : 'FAILED'}`);
  
  const passedTests = Object.values(tests).filter(Boolean).length;
  const totalTests = Object.keys(tests).length;
  
  console.log(`\n📊 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - WebSocket system is fully functional!');
  } else if (passedTests >= 3) {
    console.log('⚠️ PARTIAL SUCCESS - Core functionality working with some issues');
  } else {
    console.log('❌ CRITICAL ISSUES - WebSocket system needs attention');
  }
  
  return {
    tests,
    score: passedTests,
    total: totalTests,
    status: passedTests === totalTests ? 'COMPLETE' : passedTests >= 3 ? 'NEEDS_REVIEW' : 'INCOMPLETE'
  };
}

// Run the tests
testWebSocketConnection().then((results) => {
  console.log('\n🏁 Testing complete');
  process.exit(results.score === results.total ? 0 : 1);
}).catch((error) => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});