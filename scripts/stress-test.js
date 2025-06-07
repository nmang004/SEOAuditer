#!/usr/bin/env node

const autocannon = require('autocannon');
const fs = require('fs').promises;
const path = require('path');

class StressTester {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.reportDir = path.join(process.cwd(), 'reports', 'stress-tests');
    this.results = [];
  }

  async run() {
    console.log('🔥 Starting comprehensive stress testing...');
    
    try {
      await this.ensureReportDirectory();
      await this.runBasicLoadTests();
      await this.runEndpointSpecificTests();
      await this.runConcurrencyTests();
      await this.runSustainedLoadTests();
      await this.generateReport();
      
      console.log('✅ Stress testing completed successfully!');
      console.log(`📊 Reports saved to: ${this.reportDir}`);
    } catch (error) {
      console.error('❌ Stress testing failed:', error);
      process.exit(1);
    }
  }

  async ensureReportDirectory() {
    try {
      await fs.access(this.reportDir);
    } catch {
      await fs.mkdir(this.reportDir, { recursive: true });
    }
  }

  async runBasicLoadTests() {
    console.log('\n🚀 Running basic load tests...');
    
    const testConfigs = [
      { name: 'Light Load', connections: 10, duration: 30 },
      { name: 'Medium Load', connections: 50, duration: 30 },
      { name: 'Heavy Load', connections: 100, duration: 30 },
      { name: 'Extreme Load', connections: 200, duration: 30 }
    ];

    for (const config of testConfigs) {
      console.log(`  Testing: ${config.name} (${config.connections} connections)`);
      
      try {
        const result = await autocannon({
          url: this.baseUrl,
          connections: config.connections,
          duration: config.duration,
          headers: {
            'User-Agent': 'StressTester/1.0'
          }
        });

        const testResult = {
          category: 'Basic Load',
          name: config.name,
          config,
          success: true,
          metrics: {
            requests: result.requests,
            latency: result.latency,
            throughput: result.throughput,
            errors: result.errors,
            timeouts: result.timeouts,
            duration: result.duration
          },
          performance: {
            avgLatency: result.latency.average,
            p99Latency: result.latency.p99,
            requestsPerSecond: result.requests.average,
            errorRate: (result.errors / result.requests.total) * 100
          }
        };

        this.results.push(testResult);
        
        console.log(`    ✅ ${result.requests.total} requests, ${result.latency.average.toFixed(1)}ms avg, ${result.errors} errors`);
        
      } catch (error) {
        console.error(`    ❌ Test failed:`, error.message);
        this.results.push({
          category: 'Basic Load',
          name: config.name,
          config,
          success: false,
          error: error.message
        });
      }
    }
  }

  async runEndpointSpecificTests() {
    console.log('\n🎯 Running endpoint-specific tests...');
    
    const endpoints = [
      { path: '/api/health', name: 'Health Check' },
      { path: '/api/dashboard/stats', name: 'Dashboard Stats' },
      { path: '/dashboard', name: 'Dashboard Page' },
      { path: '/projects', name: 'Projects Page' }
    ];

    for (const endpoint of endpoints) {
      console.log(`  Testing: ${endpoint.name}`);
      
      try {
        const result = await autocannon({
          url: `${this.baseUrl}${endpoint.path}`,
          connections: 50,
          duration: 20,
          headers: {
            'User-Agent': 'StressTester/1.0'
          }
        });

        const testResult = {
          category: 'Endpoint Specific',
          name: endpoint.name,
          endpoint: endpoint.path,
          success: true,
          metrics: {
            requests: result.requests,
            latency: result.latency,
            throughput: result.throughput,
            errors: result.errors,
            timeouts: result.timeouts
          },
          performance: {
            avgLatency: result.latency.average,
            p99Latency: result.latency.p99,
            requestsPerSecond: result.requests.average,
            errorRate: (result.errors / result.requests.total) * 100
          }
        };

        this.results.push(testResult);
        
        console.log(`    ✅ ${result.requests.total} requests, ${result.latency.average.toFixed(1)}ms avg`);
        
      } catch (error) {
        console.error(`    ❌ Test failed:`, error.message);
        this.results.push({
          category: 'Endpoint Specific',
          name: endpoint.name,
          endpoint: endpoint.path,
          success: false,
          error: error.message
        });
      }
    }
  }

  async runConcurrencyTests() {
    console.log('\n⚡ Running concurrency tests...');
    
    const concurrencyLevels = [25, 50, 100, 150, 200];

    for (const connections of concurrencyLevels) {
      console.log(`  Testing: ${connections} concurrent connections`);
      
      try {
        const result = await autocannon({
          url: this.baseUrl,
          connections,
          duration: 15,
          headers: {
            'User-Agent': 'StressTester/1.0'
          }
        });

        const testResult = {
          category: 'Concurrency',
          name: `${connections} Connections`,
          connections,
          success: true,
          metrics: {
            requests: result.requests,
            latency: result.latency,
            throughput: result.throughput,
            errors: result.errors,
            timeouts: result.timeouts
          },
          performance: {
            avgLatency: result.latency.average,
            p99Latency: result.latency.p99,
            requestsPerSecond: result.requests.average,
            errorRate: (result.errors / result.requests.total) * 100
          }
        };

        this.results.push(testResult);
        
        const stable = result.latency.p99 < 2000 && result.errors === 0;
        console.log(`    ${stable ? '✅' : '⚠️'} ${result.requests.total} requests, ${result.latency.average.toFixed(1)}ms avg, P99: ${result.latency.p99.toFixed(1)}ms`);
        
      } catch (error) {
        console.error(`    ❌ Test failed:`, error.message);
        this.results.push({
          category: 'Concurrency',
          name: `${connections} Connections`,
          connections,
          success: false,
          error: error.message
        });
      }
    }
  }

  async runSustainedLoadTests() {
    console.log('\n⏱️  Running sustained load tests...');
    
    const sustainedTests = [
      { name: '5 Minute Sustained', connections: 50, duration: 300 },
      { name: '10 Minute Sustained', connections: 30, duration: 600 }
    ];

    for (const test of sustainedTests) {
      console.log(`  Testing: ${test.name} (${test.connections} connections for ${test.duration}s)`);
      
      try {
        const result = await autocannon({
          url: this.baseUrl,
          connections: test.connections,
          duration: test.duration,
          headers: {
            'User-Agent': 'StressTester/1.0'
          }
        });

        const testResult = {
          category: 'Sustained Load',
          name: test.name,
          config: test,
          success: true,
          metrics: {
            requests: result.requests,
            latency: result.latency,
            throughput: result.throughput,
            errors: result.errors,
            timeouts: result.timeouts,
            duration: result.duration
          },
          performance: {
            avgLatency: result.latency.average,
            p99Latency: result.latency.p99,
            requestsPerSecond: result.requests.average,
            errorRate: (result.errors / result.requests.total) * 100,
            stability: result.latency.p99 < 2000 && result.errors < (result.requests.total * 0.01)
          }
        };

        this.results.push(testResult);
        
        console.log(`    ✅ ${result.requests.total} requests over ${test.duration}s, ${result.latency.average.toFixed(1)}ms avg`);
        
      } catch (error) {
        console.error(`    ❌ Test failed:`, error.message);
        this.results.push({
          category: 'Sustained Load',
          name: test.name,
          config: test,
          success: false,
          error: error.message
        });
      }
    }
  }

  async generateReport() {
    console.log('\n📊 Generating stress test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    // Save JSON report
    const jsonPath = path.join(this.reportDir, `stress-test-${Date.now()}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(this.reportDir, `stress-test-${Date.now()}.html`);
    await fs.writeFile(htmlPath, htmlReport);

    console.log(`  📄 JSON report: ${jsonPath}`);
    console.log(`  🌐 HTML report: ${htmlPath}`);
    
    // Print summary
    this.printSummary(report.summary);
  }

  generateSummary() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    const avgLatencies = successful
      .filter(r => r.performance)
      .map(r => r.performance.avgLatency);
    
    const p99Latencies = successful
      .filter(r => r.performance)
      .map(r => r.performance.p99Latency);
    
    const errorRates = successful
      .filter(r => r.performance)
      .map(r => r.performance.errorRate);

    return {
      totalTests: this.results.length,
      successfulTests: successful.length,
      failedTests: failed.length,
      averageLatency: avgLatencies.length > 0 ? avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length : 0,
      maxP99Latency: p99Latencies.length > 0 ? Math.max(...p99Latencies) : 0,
      averageErrorRate: errorRates.length > 0 ? errorRates.reduce((a, b) => a + b, 0) / errorRates.length : 0,
      canHandle100Users: successful.some(r => 
        r.config && r.config.connections >= 100 && 
        r.performance && r.performance.p99Latency < 2000 && 
        r.performance.errorRate < 1
      )
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const summary = this.generateSummary();
    
    if (summary.averageLatency > 500) {
      recommendations.push({
        type: 'warning',
        message: 'Average latency is high. Consider optimizing database queries and adding more caching.'
      });
    }
    
    if (summary.maxP99Latency > 2000) {
      recommendations.push({
        type: 'error',
        message: 'P99 latency exceeds 2 seconds. This may impact user experience under load.'
      });
    }
    
    if (summary.averageErrorRate > 1) {
      recommendations.push({
        type: 'error',
        message: 'Error rate is above 1%. Check for application errors and resource limits.'
      });
    }
    
    if (!summary.canHandle100Users) {
      recommendations.push({
        type: 'warning',
        message: 'Application may not handle 100+ concurrent users reliably. Consider scaling optimizations.'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'All stress tests passed successfully! Application is performing well under load.'
      });
    }
    
    return recommendations;
  }

  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Stress Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; color: #007acc; }
        .results { margin: 20px 0; }
        .test-result { background: white; border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .success { border-left: 4px solid #4caf50; }
        .error { border-left: 4px solid #f44336; }
        .recommendations { margin: 20px 0; }
        .recommendation { padding: 10px; margin: 5px 0; border-radius: 5px; }
        .recommendation.success { background: #e8f5e8; border-left: 4px solid #4caf50; }
        .recommendation.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .recommendation.error { background: #f8d7da; border-left: 4px solid #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔥 Stress Test Report</h1>
        <p>Generated: ${data.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${data.summary.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value">${((data.summary.successfulTests / data.summary.totalTests) * 100).toFixed(1)}%</div>
        </div>
        <div class="metric">
            <h3>Avg Latency</h3>
            <div class="value">${data.summary.averageLatency.toFixed(1)}ms</div>
        </div>
        <div class="metric">
            <h3>Max P99 Latency</h3>
            <div class="value">${data.summary.maxP99Latency.toFixed(1)}ms</div>
        </div>
        <div class="metric">
            <h3>100+ Users</h3>
            <div class="value">${data.summary.canHandle100Users ? '✅' : '❌'}</div>
        </div>
    </div>
    
    <div class="recommendations">
        <h2>📋 Recommendations</h2>
        ${data.recommendations.map(rec => `
            <div class="recommendation ${rec.type}">
                ${rec.message}
            </div>
        `).join('')}
    </div>
    
    <div class="results">
        <h2>📊 Test Results</h2>
        ${data.results.map(result => `
            <div class="test-result ${result.success ? 'success' : 'error'}">
                <h3>${result.category}: ${result.name}</h3>
                ${result.success ? `
                    <p><strong>Requests:</strong> ${result.metrics.requests.total}</p>
                    <p><strong>Avg Latency:</strong> ${result.performance.avgLatency.toFixed(1)}ms</p>
                    <p><strong>P99 Latency:</strong> ${result.performance.p99Latency.toFixed(1)}ms</p>
                    <p><strong>Error Rate:</strong> ${result.performance.errorRate.toFixed(2)}%</p>
                ` : `
                    <p><strong>Error:</strong> ${result.error}</p>
                `}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  printSummary(summary) {
    console.log('\n📋 Stress Test Summary:');
    console.log('========================');
    console.log(`📊 Total tests: ${summary.totalTests}`);
    console.log(`✅ Successful: ${summary.successfulTests}`);
    console.log(`❌ Failed: ${summary.failedTests}`);
    console.log(`⏱️  Average latency: ${summary.averageLatency.toFixed(1)}ms`);
    console.log(`🚀 Can handle 100+ users: ${summary.canHandle100Users ? 'Yes' : 'No'}`);
    
    if (summary.averageErrorRate > 0) {
      console.log(`🔴 Average error rate: ${summary.averageErrorRate.toFixed(2)}%`);
    }
  }
}

// Run the stress tester
const tester = new StressTester();
tester.run().catch(console.error); 