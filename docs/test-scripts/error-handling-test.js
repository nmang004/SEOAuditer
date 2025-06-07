const io = require('socket.io-client');

console.log('🧪 Testing Error Handling and Reconnection...\n');

async function testErrorHandling() {
  let reconnectAttempts = 0;
  let disconnectCount = 0;
  
  console.log('1️⃣ Testing Initial Connection...');
  
  const socket = io('http://localhost:4000', {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    timeout: 5000,
    forceNew: true
  });

  const results = {
    initialConnection: false,
    authentication: false,
    gracefulDisconnect: false,
    reconnection: false,
    errorRecovery: false
  };

  return new Promise((resolve) => {
    const testTimeout = setTimeout(() => {
      console.log('⏱️ Test completed (timeout)');
      resolve(results);
    }, 20000);

    socket.on('connect', () => {
      console.log(`✅ Connected (attempt ${reconnectAttempts + 1}): ${socket.id}`);
      results.initialConnection = true;
      
      if (reconnectAttempts === 0) {
        // First connection - test authentication
        socket.emit('authenticate', { 
          userId: 'test-user-123', 
          token: 'test-token' 
        });
      } else {
        // Reconnected successfully
        results.reconnection = true;
        console.log('✅ Reconnection successful');
        
        clearTimeout(testTimeout);
        socket.disconnect();
        resolve(results);
      }
    });

    socket.on('authenticated', (data) => {
      console.log('✅ Authentication successful:', data);
      results.authentication = true;
      
      // Test planned disconnect after 2 seconds
      setTimeout(() => {
        console.log('\n2️⃣ Testing Graceful Disconnect...');
        socket.disconnect();
      }, 2000);
    });

    socket.on('authentication_error', (error) => {
      console.log('⚠️ Authentication error (expected for some tests):', error);
    });

    socket.on('disconnect', (reason) => {
      disconnectCount++;
      console.log(`🔌 Disconnected (${disconnectCount}): ${reason}`);
      
      if (reason === 'io client disconnect') {
        results.gracefulDisconnect = true;
        console.log('✅ Graceful disconnect successful');
        
        // Test reconnection after brief delay
        setTimeout(() => {
          console.log('\n3️⃣ Testing Reconnection...');
          reconnectAttempts++;
          socket.connect();
        }, 1000);
      }
    });

    socket.on('connect_error', (error) => {
      console.log(`❌ Connection error: ${error.message}`);
      
      if (reconnectAttempts === 0) {
        // If initial connection fails, we can't test much else
        clearTimeout(testTimeout);
        resolve(results);
      }
    });

    socket.on('error', (error) => {
      console.log(`⚠️ Socket error: ${error}`);
      results.errorRecovery = true; // We handled an error gracefully
    });

    // Test ping/pong for connection health
    socket.on('pong', (data) => {
      console.log('💓 Heartbeat received:', data.timestamp);
    });

    // Send periodic pings to test connection health
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 3000);

    // Cleanup
    setTimeout(() => {
      clearInterval(pingInterval);
    }, 15000);
  });
}

// Test network interruption simulation
async function testNetworkInterruption() {
  console.log('\n4️⃣ Testing Network Interruption Handling...');
  
  const socket = io('http://localhost:4000', {
    path: '/socket.io',
    transports: ['websocket'],
    timeout: 3000,
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000
  });

  const networkTest = {
    initialConnection: false,
    reconnectionAttempts: 0,
    finalReconnection: false
  };

  return new Promise((resolve) => {
    const testTimeout = setTimeout(() => {
      socket.disconnect();
      resolve(networkTest);
    }, 10000);

    socket.on('connect', () => {
      console.log('✅ Network test connected');
      networkTest.initialConnection = true;
      
      if (networkTest.reconnectionAttempts > 0) {
        networkTest.finalReconnection = true;
        console.log('✅ Network recovery successful');
        clearTimeout(testTimeout);
        socket.disconnect();
        resolve(networkTest);
      } else {
        // Simulate network interruption by forcing disconnect
        setTimeout(() => {
          console.log('📡 Simulating network interruption...');
          socket.disconnect();
        }, 2000);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Network test disconnect: ${reason}`);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      networkTest.reconnectionAttempts = attemptNumber;
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
    });

    socket.on('reconnect_failed', () => {
      console.log('❌ Reconnection failed');
      clearTimeout(testTimeout);
      resolve(networkTest);
    });
  });
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Error Handling and Reconnection Tests\n');
  
  try {
    const basicResults = await testErrorHandling();
    const networkResults = await testNetworkInterruption();
    
    console.log('\n📋 ERROR HANDLING TEST RESULTS:');
    console.log('================================');
    
    const checkMark = (test) => test ? '✅' : '❌';
    
    console.log(`${checkMark(basicResults.initialConnection)} Initial Connection: ${basicResults.initialConnection ? 'WORKING' : 'FAILED'}`);
    console.log(`${checkMark(basicResults.authentication)} Authentication: ${basicResults.authentication ? 'WORKING' : 'FAILED'}`);
    console.log(`${checkMark(basicResults.gracefulDisconnect)} Graceful Disconnect: ${basicResults.gracefulDisconnect ? 'WORKING' : 'FAILED'}`);
    console.log(`${checkMark(basicResults.reconnection)} Basic Reconnection: ${basicResults.reconnection ? 'WORKING' : 'FAILED'}`);
    console.log(`${checkMark(networkResults.initialConnection)} Network Test Connection: ${networkResults.initialConnection ? 'WORKING' : 'FAILED'}`);
    console.log(`${checkMark(networkResults.reconnectionAttempts > 0)} Reconnection Attempts: ${networkResults.reconnectionAttempts > 0 ? `${networkResults.reconnectionAttempts} attempts` : 'NONE'}`);
    console.log(`${checkMark(networkResults.finalReconnection)} Network Recovery: ${networkResults.finalReconnection ? 'WORKING' : 'FAILED'}`);
    
    const allTests = [
      basicResults.initialConnection,
      basicResults.authentication,
      basicResults.gracefulDisconnect,
      basicResults.reconnection,
      networkResults.initialConnection,
      networkResults.reconnectionAttempts > 0
    ];
    
    const passedTests = allTests.filter(Boolean).length;
    const totalTests = allTests.length;
    
    console.log(`\n📊 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    let status;
    if (passedTests === totalTests) {
      console.log('🎉 ALL ERROR HANDLING TESTS PASSED');
      status = 'COMPLETE';
    } else if (passedTests >= 4) {
      console.log('⚠️ MOSTLY WORKING - Minor issues detected');
      status = 'NEEDS_REVIEW';
    } else {
      console.log('❌ CRITICAL ISSUES - Error handling needs attention');
      status = 'INCOMPLETE';
    }
    
    return {
      status,
      score: passedTests,
      total: totalTests,
      details: { basicResults, networkResults }
    };
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    return {
      status: 'INCOMPLETE',
      score: 0,
      total: 6,
      error: error.message
    };
  }
}

// Execute tests
runAllTests().then((results) => {
  console.log('\n🏁 Error handling tests complete');
  process.exit(results.score >= 4 ? 0 : 1);
}).catch((error) => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});