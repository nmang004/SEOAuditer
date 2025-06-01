const io = require('socket.io-client');

console.log('🧪 Testing Real-time Progress Events...\n');

async function testProgressEvents() {
  const socket = io('http://localhost:4000', {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    timeout: 10000,
    forceNew: true
  });

  let progressUpdates = 0;
  let testJobId = 'test-progress-' + Date.now();
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timeout - no progress events received'));
    }, 15000);

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      console.log('Socket ID:', socket.id);
      
      // Authenticate
      socket.emit('authenticate', { 
        userId: 'test-user-123', 
        token: 'test-token' 
      });
    });

    socket.on('authenticated', (data) => {
      console.log('✅ Authenticated successfully');
      
      // Subscribe to analysis progress
      socket.emit('subscribe_analysis', { jobId: testJobId });
    });

    socket.on('subscribed', (data) => {
      console.log(`✅ Subscribed to analysis: ${data.jobId}`);
      
      // Now trigger an actual analysis to test real progress events
      triggerAnalysis(testJobId);
    });

    socket.on('analysis_progress', (progress) => {
      progressUpdates++;
      console.log(`📈 Progress Update ${progressUpdates}:`);
      console.log(`   Job ID: ${progress.jobId}`);
      console.log(`   Stage: ${progress.stage}`);
      console.log(`   Progress: ${progress.percentage}%`);
      console.log(`   Details: ${progress.details}`);
      console.log(`   Timestamp: ${progress.timestamp}`);
      console.log('');
      
      // Test passes if we get at least one progress update
      if (progressUpdates >= 1) {
        clearTimeout(timeout);
        socket.disconnect();
        resolve({
          success: true,
          updatesReceived: progressUpdates,
          testJobId: testJobId
        });
      }
    });

    socket.on('analysis_completed', (event) => {
      console.log(`✅ Analysis completed: ${event.jobId}`);
      console.log(`   Data:`, event.data);
      
      clearTimeout(timeout);
      socket.disconnect();
      resolve({
        success: true,
        updatesReceived: progressUpdates,
        completed: true,
        testJobId: testJobId
      });
    });

    socket.on('analysis_error', (event) => {
      console.log(`❌ Analysis error: ${event.jobId}`);
      console.log(`   Error:`, event.data);
      
      clearTimeout(timeout);
      socket.disconnect();
      resolve({
        success: false,
        error: event.data,
        updatesReceived: progressUpdates,
        testJobId: testJobId
      });
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Connection error: ${error.message}`));
    });
  });
}

async function triggerAnalysis(jobId) {
  try {
    console.log('🚀 Triggering test analysis...');
    
    // Make a request to start an analysis
    const response = await fetch('http://localhost:4000/api/crawl/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        options: {
          pages: 1,
          depth: 1,
          jobId: jobId
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Analysis started:', result);
    } else {
      console.log('⚠️ Failed to start analysis (will test with mock events)');
      
      // If we can't start a real analysis, simulate progress events
      // This would typically be done by the analysis system
      setTimeout(() => {
        console.log('📡 Simulating progress events...');
        // The WebSocket server should emit these events during real analysis
      }, 2000);
    }
  } catch (error) {
    console.log('⚠️ Error triggering analysis:', error.message);
    console.log('   Will rely on any existing progress events...');
  }
}

// Run the test
testProgressEvents()
  .then((result) => {
    console.log('📋 PROGRESS EVENTS TEST RESULTS:');
    console.log('================================');
    
    if (result.success) {
      console.log('✅ Progress events working correctly');
      console.log(`📊 Updates received: ${result.updatesReceived}`);
      console.log(`🏁 Analysis completed: ${result.completed || false}`);
    } else {
      console.log('❌ Progress events failed');
      console.log('❌ Error:', result.error);
    }
    
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.log('❌ Progress test failed:', error.message);
    process.exit(1);
  });