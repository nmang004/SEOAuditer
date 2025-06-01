const https = require('http');

const endpoints = [
  'http://localhost:4000/api/health',
  'http://localhost:4000/api/dashboard/stats',
  'http://localhost:4000/api/projects'
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const end = Date.now();
        resolve({
          url,
          status: res.statusCode,
          responseTime: end - start,
          size: data.length
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        error: err.message,
        responseTime: Date.now() - start
      });
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      resolve({
        url,
        error: 'Timeout',
        responseTime: 5000
      });
    });
  });
}

async function runTests() {
  console.log('🚀 API Performance Testing\n');
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    const results = [];
    
    // Run 5 tests per endpoint
    for (let i = 0; i < 5; i++) {
      const result = await testEndpoint(endpoint);
      results.push(result);
      console.log(`  Test ${i + 1}: ${result.responseTime}ms (${result.status || 'ERROR'})`);
    }
    
    const times = results.filter(r => !r.error).map(r => r.responseTime);
    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      console.log(`  📊 Avg: ${avg.toFixed(1)}ms | Min: ${min}ms | Max: ${max}ms`);
    }
    console.log('');
  }
}

runTests().catch(console.error);