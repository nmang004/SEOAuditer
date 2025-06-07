#!/usr/bin/env node

const lighthouse = require('lighthouse').default || require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');
const autocannon = require('autocannon');

class PerformanceMonitor {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.reportDir = path.join(process.cwd(), 'reports');
    this.results = {
      lighthouse: {},
      loadTest: {},
      metrics: {},
      recommendations: []
    };
  }

  async run() {
    console.log('🚀 Starting comprehensive performance monitoring...');
    
    try {
      await this.ensureReportDirectory();
      await this.runLighthouseTests();
      await this.runLoadTests();
      await this.analyzeResults();
      await this.generateReport();
      
      console.log('✅ Performance monitoring completed successfully!');
      console.log(`📊 Reports saved to: ${this.reportDir}`);
    } catch (error) {
      console.error('❌ Performance monitoring failed:', error);
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

  async runLighthouseTests() {
    console.log('🔍 Running Lighthouse performance tests...');

    const urls = [
      '/',
      '/dashboard',
      '/projects',
      '/reports-demo'
    ];

    for (const url of urls) {
      console.log(`  Testing: ${this.baseUrl}${url}`);
      
      try {
        const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
        
        const options = {
          logLevel: 'info',
          output: 'json',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          port: chrome.port,
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1
          }
        };

        const runnerResult = await lighthouse(`${this.baseUrl}${url}`, options);
        await chrome.kill();

        // Extract key metrics
        const metrics = runnerResult.report ? JSON.parse(runnerResult.report) : runnerResult.lhr;
        
        this.results.lighthouse[url] = {
          performanceScore: metrics.categories.performance.score * 100,
          accessibilityScore: metrics.categories.accessibility.score * 100,
          bestPracticesScore: metrics.categories['best-practices'].score * 100,
          seoScore: metrics.categories.seo.score * 100,
          metrics: {
            firstContentfulPaint: metrics.audits['first-contentful-paint'].numericValue,
            largestContentfulPaint: metrics.audits['largest-contentful-paint'].numericValue,
            firstInputDelay: metrics.audits['max-potential-fid'].numericValue,
            cumulativeLayoutShift: metrics.audits['cumulative-layout-shift'].numericValue,
            speedIndex: metrics.audits['speed-index'].numericValue,
            timeToInteractive: metrics.audits['interactive'].numericValue
          },
          opportunities: metrics.audits['unused-css-rules'] ? {
            unusedCSS: metrics.audits['unused-css-rules'].details?.overallSavingsBytes || 0,
            unusedJS: metrics.audits['unused-javascript'] ? metrics.audits['unused-javascript'].details?.overallSavingsBytes || 0 : 0,
            nextGenFormats: metrics.audits['uses-webp-images'] ? metrics.audits['uses-webp-images'].details?.overallSavingsBytes || 0 : 0,
            textCompression: metrics.audits['uses-text-compression'] ? metrics.audits['uses-text-compression'].details?.overallSavingsBytes || 0 : 0
          } : {}
        };

        // Save detailed report
        const detailedReport = JSON.stringify(metrics, null, 2);
        await fs.writeFile(
          path.join(this.reportDir, `lighthouse-${url.replace(/\//g, '_') || 'home'}.json`),
          detailedReport
        );

        console.log(`    ✅ Performance: ${this.results.lighthouse[url].performanceScore.toFixed(1)}/100`);
        
      } catch (error) {
        console.error(`    ❌ Failed to test ${url}:`, error.message);
        this.results.lighthouse[url] = { error: error.message };
      }
    }
  }

  async runLoadTests() {
    console.log('⚡ Running load tests...');

    const testConfigs = [
      { name: 'Light Load', connections: 10, duration: 30 },
      { name: 'Medium Load', connections: 50, duration: 30 },
      { name: 'Heavy Load', connections: 100, duration: 30 }
    ];

    for (const config of testConfigs) {
      console.log(`  Running ${config.name} test (${config.connections} connections)...`);
      
      try {
        const result = await autocannon({
          url: this.baseUrl,
          connections: config.connections,
          duration: config.duration,
          headers: {
            'User-Agent': 'Performance-Monitor/1.0'
          }
        });

        this.results.loadTest[config.name] = {
          requests: {
            total: result.requests.total,
            average: result.requests.average,
            min: result.requests.min,
            max: result.requests.max
          },
          latency: {
            average: result.latency.average,
            min: result.latency.min,
            max: result.latency.max,
            p99: result.latency.p99
          },
          throughput: {
            average: result.throughput.average,
            min: result.throughput.min,
            max: result.throughput.max
          },
          errors: result.errors,
          timeouts: result.timeouts,
          duration: result.duration
        };

        console.log(`    ✅ ${result.requests.total} requests, ${result.latency.average.toFixed(1)}ms avg latency`);
        
      } catch (error) {
        console.error(`    ❌ Load test failed:`, error.message);
        this.results.loadTest[config.name] = { error: error.message };
      }
    }
  }

  async analyzeResults() {
    console.log('📊 Analyzing performance results...');

    // Calculate overall scores
    const lighthouseScores = Object.values(this.results.lighthouse)
      .filter(result => !result.error)
      .map(result => result.performanceScore);

    if (lighthouseScores.length > 0) {
      this.results.metrics.averagePerformanceScore = lighthouseScores.reduce((a, b) => a + b, 0) / lighthouseScores.length;
    }

    // Load test analysis
    const heavyLoadResult = this.results.loadTest['Heavy Load'];
    if (heavyLoadResult && !heavyLoadResult.error) {
      this.results.metrics.canHandle100Users = heavyLoadResult.errors === 0 && heavyLoadResult.latency.p99 < 2000;
      this.results.metrics.averageLatencyUnderLoad = heavyLoadResult.latency.average;
    }

    // Generate recommendations
    this.generateRecommendations();

    console.log(`  📈 Average Performance Score: ${this.results.metrics.averagePerformanceScore?.toFixed(1) || 'N/A'}/100`);
    console.log(`  🚀 Can handle 100+ users: ${this.results.metrics.canHandle100Users ? 'Yes' : 'No'}`);
  }

  generateRecommendations() {
    const recommendations = [];

    // Lighthouse-based recommendations
    Object.entries(this.results.lighthouse).forEach(([url, result]) => {
      if (result.error) return;

      if (result.performanceScore < 90) {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          page: url,
          issue: `Performance score is ${result.performanceScore.toFixed(1)}/100`,
          suggestion: 'Optimize Core Web Vitals metrics'
        });
      }

      if (result.metrics.largestContentfulPaint > 2500) {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          page: url,
          issue: `LCP is ${(result.metrics.largestContentfulPaint / 1000).toFixed(1)}s`,
          suggestion: 'Optimize image loading and reduce server response time'
        });
      }

      if (result.metrics.cumulativeLayoutShift > 0.1) {
        recommendations.push({
          priority: 'medium',
          category: 'performance',
          page: url,
          issue: `CLS is ${result.metrics.cumulativeLayoutShift.toFixed(3)}`,
          suggestion: 'Add size attributes to images and avoid dynamic content insertion'
        });
      }

      if (result.opportunities.unusedCSS > 50000) {
        recommendations.push({
          priority: 'medium',
          category: 'optimization',
          page: url,
          issue: `${Math.round(result.opportunities.unusedCSS / 1024)}KB unused CSS`,
          suggestion: 'Implement critical CSS extraction and remove unused styles'
        });
      }
    });

    // Load test recommendations
    const heavyLoad = this.results.loadTest['Heavy Load'];
    if (heavyLoad && !heavyLoad.error) {
      if (heavyLoad.latency.p99 > 2000) {
        recommendations.push({
          priority: 'high',
          category: 'scalability',
          page: 'all',
          issue: `99th percentile latency is ${heavyLoad.latency.p99}ms under load`,
          suggestion: 'Implement Redis caching and database optimization'
        });
      }

      if (heavyLoad.errors > 0) {
        recommendations.push({
          priority: 'critical',
          category: 'reliability',
          page: 'all',
          issue: `${heavyLoad.errors} errors occurred during load testing`,
          suggestion: 'Investigate error causes and improve error handling'
        });
      }
    }

    this.results.recommendations = recommendations.sort((a, b) => {
      const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    
    // Generate summary report
    const summaryReport = {
      timestamp,
      summary: {
        averagePerformanceScore: this.results.metrics.averagePerformanceScore,
        canHandle100Users: this.results.metrics.canHandle100Users,
        criticalIssues: this.results.recommendations.filter(r => r.priority === 'critical').length,
        highPriorityIssues: this.results.recommendations.filter(r => r.priority === 'high').length
      },
      lighthouse: this.results.lighthouse,
      loadTest: this.results.loadTest,
      recommendations: this.results.recommendations
    };

    await fs.writeFile(
      path.join(this.reportDir, `performance-report-${Date.now()}.json`),
      JSON.stringify(summaryReport, null, 2)
    );

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(summaryReport);
    await fs.writeFile(
      path.join(this.reportDir, `performance-report-${Date.now()}.html`),
      htmlReport
    );

    // Console summary
    console.log('\n📋 Performance Summary:');
    console.log('========================');
    console.log(`📊 Average Performance Score: ${summaryReport.summary.averagePerformanceScore?.toFixed(1) || 'N/A'}/100`);
    console.log(`🚀 Handles 100+ concurrent users: ${summaryReport.summary.canHandle100Users ? 'Yes' : 'No'}`);
    console.log(`🔴 Critical issues: ${summaryReport.summary.criticalIssues}`);
    console.log(`🟡 High priority issues: ${summaryReport.summary.highPriorityIssues}`);
    
    if (this.results.recommendations.length > 0) {
      console.log('\n🔧 Top Recommendations:');
      this.results.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
        console.log(`   → ${rec.suggestion}`);
      });
    }
  }

  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report - ${new Date(data.timestamp).toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { color: #666; }
        .section { margin: 20px 0; }
        .recommendation { padding: 10px; margin: 5px 0; border-left: 4px solid #ccc; }
        .critical { border-left-color: #e74c3c; }
        .high { border-left-color: #f39c12; }
        .medium { border-left-color: #f1c40f; }
        .low { border-left-color: #27ae60; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Report</h1>
        <p>Generated: ${new Date(data.timestamp).toLocaleString()}</p>
        
        <div class="metric">
            <div class="metric-value">${data.summary.averagePerformanceScore?.toFixed(1) || 'N/A'}/100</div>
            <div class="metric-label">Avg Performance Score</div>
        </div>
        
        <div class="metric">
            <div class="metric-value">${data.summary.canHandle100Users ? '✅' : '❌'}</div>
            <div class="metric-label">100+ Users</div>
        </div>
        
        <div class="metric">
            <div class="metric-value">${data.summary.criticalIssues + data.summary.highPriorityIssues}</div>
            <div class="metric-label">Priority Issues</div>
        </div>
    </div>

    <div class="section">
        <h2>Lighthouse Scores</h2>
        <table>
            <tr>
                <th>Page</th>
                <th>Performance</th>
                <th>Accessibility</th>
                <th>Best Practices</th>
                <th>SEO</th>
                <th>LCP (ms)</th>
                <th>CLS</th>
            </tr>
            ${Object.entries(data.lighthouse).map(([url, result]) => {
              if (result.error) return `<tr><td>${url}</td><td colspan="6">Error: ${result.error}</td></tr>`;
              return `
                <tr>
                    <td>${url || '/'}</td>
                    <td>${result.performanceScore?.toFixed(1) || 'N/A'}</td>
                    <td>${result.accessibilityScore?.toFixed(1) || 'N/A'}</td>
                    <td>${result.bestPracticesScore?.toFixed(1) || 'N/A'}</td>
                    <td>${result.seoScore?.toFixed(1) || 'N/A'}</td>
                    <td>${result.metrics?.largestContentfulPaint?.toFixed(0) || 'N/A'}</td>
                    <td>${result.metrics?.cumulativeLayoutShift?.toFixed(3) || 'N/A'}</td>
                </tr>
              `;
            }).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Load Test Results</h2>
        <table>
            <tr>
                <th>Test</th>
                <th>Requests</th>
                <th>Avg Latency (ms)</th>
                <th>P99 Latency (ms)</th>
                <th>Errors</th>
                <th>Throughput (req/s)</th>
            </tr>
            ${Object.entries(data.loadTest).map(([test, result]) => {
              if (result.error) return `<tr><td>${test}</td><td colspan="5">Error: ${result.error}</td></tr>`;
              return `
                <tr>
                    <td>${test}</td>
                    <td>${result.requests?.total || 'N/A'}</td>
                    <td>${result.latency?.average?.toFixed(1) || 'N/A'}</td>
                    <td>${result.latency?.p99?.toFixed(1) || 'N/A'}</td>
                    <td>${result.errors || 0}</td>
                    <td>${result.throughput?.average?.toFixed(1) || 'N/A'}</td>
                </tr>
              `;
            }).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        ${data.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <strong>[${rec.priority.toUpperCase()}] ${rec.page === 'all' ? 'All Pages' : rec.page}</strong><br>
                ${rec.issue}<br>
                <em>→ ${rec.suggestion}</em>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
  }
}

// Run the monitor
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  monitor.run().catch(console.error);
}

module.exports = PerformanceMonitor; 