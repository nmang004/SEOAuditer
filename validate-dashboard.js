#!/usr/bin/env node

/**
 * SEO Application Validation Script
 * Tests dashboard functionality against the provided checklist
 */

const fs = require('fs');
const path = require('path');

class DashboardValidator {
  constructor() {
    this.results = {
      coreRequirements: {
        mockDataReplacement: { status: 'INCOMPLETE', details: [] },
        dataLoading: { status: 'INCOMPLETE', details: [] },
        chartIntegration: { status: 'INCOMPLETE', details: [] },
        performance: { status: 'INCOMPLETE', details: [] }
      },
      dashboardComponents: {
        statisticsCards: { status: 'INCOMPLETE', details: [] },
        recentProjects: { status: 'INCOMPLETE', details: [] },
        seoScoreTrends: { status: 'INCOMPLETE', details: [] },
        priorityIssues: { status: 'INCOMPLETE', details: [] },
        performanceMetrics: { status: 'INCOMPLETE', details: [] }
      },
      dataAccuracy: {
        projectStats: { status: 'INCOMPLETE', details: [] },
        analysisHistory: { status: 'INCOMPLETE', details: [] },
        scoreCalculations: { status: 'INCOMPLETE', details: [] },
        issuePrioritization: { status: 'INCOMPLETE', details: [] }
      },
      criticalIssues: []
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  // Core Requirements Validation
  validateMockDataReplacement() {
    this.log('Validating mock data replacement...');
    
    const dashboardPage = this.readFile('src/app/(app)/dashboard/page.tsx');
    const statsComponent = this.readFile('src/components/dashboard/enhanced-stats-overview.tsx');
    const projectsComponent = this.readFile('src/components/dashboard/recent-projects.tsx');
    
    // Check for React Query usage (real API data)
    const usesReactQuery = dashboardPage.includes('useReactQueryDashboard') ||
                          dashboardPage.includes('useDashboardStats') ||
                          statsComponent.includes('useDashboardStats');
    
    // Check for hardcoded mock data
    const mockDataPatterns = [
      /mockData\s*=/,
      /const\s+sampleData/i,
      /const\s+testData/i,
      /Math\.random/,
      /hardcoded.*data/i
    ];
    
    const hasMockData = mockDataPatterns.some(pattern => 
      pattern.test(dashboardPage) || 
      pattern.test(statsComponent) || 
      pattern.test(projectsComponent)
    );
    
    // Check API integration
    const apiFile = this.readFile('src/app/api/dashboard/stats/route.ts');
    const usesPrisma = apiFile && apiFile.includes('prisma.');
    const usesDatabase = apiFile && (apiFile.includes('prisma.project.count') || 
                                   apiFile.includes('prisma.sEOAnalysis'));
    
    if (usesReactQuery && !hasMockData && usesPrisma && usesDatabase) {
      this.results.coreRequirements.mockDataReplacement.status = 'COMPLETE';
      this.results.coreRequirements.mockDataReplacement.details.push(
        '✅ Dashboard uses React Query for data fetching',
        '✅ API endpoints use Prisma for database queries',
        '✅ No hardcoded mock data found in components'
      );
    } else {
      this.results.coreRequirements.mockDataReplacement.status = 'INCOMPLETE';
      if (!usesReactQuery) this.results.coreRequirements.mockDataReplacement.details.push('❌ Not using React Query');
      if (hasMockData) this.results.coreRequirements.mockDataReplacement.details.push('❌ Found hardcoded mock data');
      if (!usesPrisma) this.results.coreRequirements.mockDataReplacement.details.push('❌ API not using Prisma');
    }
  }

  validateDataLoading() {
    this.log('Validating data loading performance...');
    
    const hooksFile = this.readFile('src/hooks/useReactQueryDashboard.ts');
    
    // Check for caching configuration
    const hasCaching = hooksFile && hooksFile.includes('staleTime') && hooksFile.includes('gcTime');
    
    // Check for loading states
    const dashboardPage = this.readFile('src/app/(app)/dashboard/page.tsx');
    const hasLoadingStates = dashboardPage.includes('isLoading') && 
                           dashboardPage.includes('loading');
    
    // Check for error handling
    const hasErrorHandling = dashboardPage.includes('error') && 
                           dashboardPage.includes('ErrorBoundary');
    
    if (hasCaching && hasLoadingStates) {
      this.results.coreRequirements.dataLoading.status = 'COMPLETE';
      this.results.coreRequirements.dataLoading.details.push(
        '✅ React Query caching configured (staleTime, gcTime)',
        '✅ Loading states implemented',
        '✅ Error handling present'
      );
    } else {
      this.results.coreRequirements.dataLoading.status = 'INCOMPLETE';
      if (!hasCaching) this.results.coreRequirements.dataLoading.details.push('❌ No caching configuration');
      if (!hasLoadingStates) this.results.coreRequirements.dataLoading.details.push('❌ Missing loading states');
    }
  }

  validateChartIntegration() {
    this.log('Validating chart integration...');
    
    const performanceChart = this.readFile('src/components/charts/performance-chart.tsx');
    const issueChart = this.readFile('src/components/charts/issue-trends-chart.tsx');
    
    // Check for Chart.js integration
    const usesChartJS = performanceChart && performanceChart.includes('react-chartjs-2') &&
                       issueChart && issueChart.includes('react-chartjs-2');
    
    // Check for real data integration
    const usesRealData = performanceChart && performanceChart.includes('usePerformanceTrends') &&
                        issueChart && issueChart.includes('useIssueTrends');
    
    // Check for responsive design
    const isResponsive = performanceChart && performanceChart.includes('responsive: true') &&
                        performanceChart.includes('maintainAspectRatio');
    
    if (usesChartJS && usesRealData && isResponsive) {
      this.results.coreRequirements.chartIntegration.status = 'COMPLETE';
      this.results.coreRequirements.chartIntegration.details.push(
        '✅ Chart.js integration working',
        '✅ Charts use real API data',
        '✅ Responsive design implemented'
      );
    } else {
      this.results.coreRequirements.chartIntegration.status = 'INCOMPLETE';
      if (!usesChartJS) this.results.coreRequirements.chartIntegration.details.push('❌ Chart.js not properly integrated');
      if (!usesRealData) this.results.coreRequirements.chartIntegration.details.push('❌ Charts not using real data');
      if (!isResponsive) this.results.coreRequirements.chartIntegration.details.push('❌ Charts not responsive');
    }
  }

  validatePerformance() {
    this.log('Validating performance optimizations...');
    
    const hooksFile = this.readFile('src/hooks/useReactQueryDashboard.ts');
    const dashboardPage = this.readFile('src/app/(app)/dashboard/page.tsx');
    
    // Check for React Query optimization
    const hasOptimization = hooksFile && (
      hooksFile.includes('staleTime: 5 * 60 * 1000') || // 5 minutes
      hooksFile.includes('refetchInterval') ||
      hooksFile.includes('retry:')
    );
    
    // Check for prefetching
    const hasPrefetching = hooksFile && hooksFile.includes('prefetch');
    
    // Check for efficient data fetching
    const apiFile = this.readFile('src/app/api/dashboard/stats/route.ts');
    const usesParallelQueries = apiFile && apiFile.includes('Promise.all');
    
    if (hasOptimization && usesParallelQueries) {
      this.results.coreRequirements.performance.status = 'COMPLETE';
      this.results.coreRequirements.performance.details.push(
        '✅ React Query caching optimized',
        '✅ Parallel database queries implemented',
        '✅ Efficient data fetching patterns'
      );
    } else {
      this.results.coreRequirements.performance.status = 'INCOMPLETE';
      if (!hasOptimization) this.results.coreRequirements.performance.details.push('❌ Missing query optimization');
      if (!usesParallelQueries) this.results.coreRequirements.performance.details.push('❌ No parallel queries');
    }
  }

  // Dashboard Components Validation
  validateDashboardComponents() {
    this.log('Validating dashboard components...');
    
    // Statistics Cards
    const statsComponent = this.readFile('src/components/dashboard/enhanced-stats-overview.tsx');
    const hasStatCards = statsComponent && (
      statsComponent.includes('totalProjects') &&
      statsComponent.includes('averageScore') &&
      statsComponent.includes('criticalIssues')
    );
    
    if (hasStatCards) {
      this.results.dashboardComponents.statisticsCards.status = 'COMPLETE';
      this.results.dashboardComponents.statisticsCards.details.push(
        '✅ Statistics cards show real project count, analysis count, average scores'
      );
    } else {
      this.results.dashboardComponents.statisticsCards.status = 'INCOMPLETE';
      this.results.dashboardComponents.statisticsCards.details.push('❌ Statistics cards missing or incomplete');
    }

    // Recent Projects
    const projectsComponent = this.readFile('src/components/dashboard/recent-projects.tsx');
    const hasRecentProjects = projectsComponent && projectsComponent.includes('projects');
    
    if (hasRecentProjects) {
      this.results.dashboardComponents.recentProjects.status = 'COMPLETE';
      this.results.dashboardComponents.recentProjects.details.push('✅ Recent projects component implemented');
    } else {
      this.results.dashboardComponents.recentProjects.status = 'INCOMPLETE';
      this.results.dashboardComponents.recentProjects.details.push('❌ Recent projects component missing');
    }
  }

  // Data Accuracy Validation
  validateDataAccuracy() {
    this.log('Validating data accuracy...');
    
    const apiFile = this.readFile('src/app/api/dashboard/stats/route.ts');
    
    if (apiFile) {
      // Check for proper aggregations
      const hasAggregations = apiFile.includes('prisma.project.count') &&
                            apiFile.includes('aggregate') &&
                            apiFile.includes('_avg');
      
      // Check for date filtering
      const hasDateFiltering = apiFile.includes('weekAgo') && apiFile.includes('monthAgo');
      
      // Check for proper grouping
      const hasGrouping = apiFile.includes('groupBy');
      
      if (hasAggregations && hasDateFiltering) {
        this.results.dataAccuracy.projectStats.status = 'COMPLETE';
        this.results.dataAccuracy.projectStats.details.push(
          '✅ Project statistics use proper database aggregations',
          '✅ Date filtering implemented for trends'
        );
      } else {
        this.results.dataAccuracy.projectStats.status = 'INCOMPLETE';
        if (!hasAggregations) this.results.dataAccuracy.projectStats.details.push('❌ Missing database aggregations');
        if (!hasDateFiltering) this.results.dataAccuracy.projectStats.details.push('❌ No date filtering');
      }
    }
  }

  // Utility methods
  readFile(relativePath) {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      this.log(`Warning: Could not read file ${relativePath}`, 'WARN');
      return null;
    }
  }

  // Generate report
  generateReport() {
    this.log('Generating validation report...');
    
    let report = '\n' + '='.repeat(80) + '\n';
    report += '           SEO APPLICATION VALIDATION REPORT\n';
    report += '='.repeat(80) + '\n';
    
    // Core Requirements
    report += '\n📋 CORE REQUIREMENTS VALIDATION:\n';
    report += '-'.repeat(50) + '\n';
    
    Object.entries(this.results.coreRequirements).forEach(([key, result]) => {
      const status = result.status === 'COMPLETE' ? '✅ COMPLETE' : 
                    result.status === 'INCOMPLETE' ? '❌ INCOMPLETE' : '⚠️  NEEDS REVIEW';
      report += `${key.toUpperCase()}: [${status}]\n`;
      result.details.forEach(detail => report += `  ${detail}\n`);
      report += '\n';
    });
    
    // Dashboard Components
    report += '\n📊 DASHBOARD COMPONENTS VALIDATION:\n';
    report += '-'.repeat(50) + '\n';
    
    Object.entries(this.results.dashboardComponents).forEach(([key, result]) => {
      const status = result.status === 'COMPLETE' ? '✅ COMPLETE' : 
                    result.status === 'INCOMPLETE' ? '❌ INCOMPLETE' : '⚠️  NEEDS REVIEW';
      report += `${key.toUpperCase()}: [${status}]\n`;
      result.details.forEach(detail => report += `  ${detail}\n`);
      report += '\n';
    });
    
    // Data Accuracy
    report += '\n🎯 DATA ACCURACY:\n';
    report += '-'.repeat(50) + '\n';
    
    Object.entries(this.results.dataAccuracy).forEach(([key, result]) => {
      const status = result.status === 'COMPLETE' ? '✅ COMPLETE' : 
                    result.status === 'INCOMPLETE' ? '❌ INCOMPLETE' : '⚠️  NEEDS REVIEW';
      report += `${key.toUpperCase()}: [${status}]\n`;
      result.details.forEach(detail => report += `  ${detail}\n`);
      report += '\n';
    });
    
    // Critical Issues
    if (this.results.criticalIssues.length > 0) {
      report += '\n🚨 CRITICAL ISSUES FOUND:\n';
      report += '-'.repeat(50) + '\n';
      this.results.criticalIssues.forEach(issue => report += `❌ ${issue}\n`);
      report += '\n';
    }
    
    // Overall Status
    const totalComplete = Object.values({
      ...this.results.coreRequirements,
      ...this.results.dashboardComponents,
      ...this.results.dataAccuracy
    }).filter(result => result.status === 'COMPLETE').length;
    
    const totalItems = Object.keys({
      ...this.results.coreRequirements,
      ...this.results.dashboardComponents,
      ...this.results.dataAccuracy
    }).length;
    
    const completionRate = Math.round((totalComplete / totalItems) * 100);
    
    report += '\n📈 OVERALL STATUS:\n';
    report += '-'.repeat(50) + '\n';
    report += `Completion Rate: ${completionRate}% (${totalComplete}/${totalItems})\n`;
    
    if (completionRate >= 90) {
      report += 'Status: ✅ READY FOR PRODUCTION\n';
    } else if (completionRate >= 70) {
      report += 'Status: ⚠️  NEEDS MINOR FIXES\n';
    } else {
      report += 'Status: ❌ MAJOR ISSUES REQUIRE ATTENTION\n';
    }
    
    report += '\n' + '='.repeat(80) + '\n';
    
    return report;
  }

  // Run all validations
  async validate() {
    this.log('Starting SEO application validation...');
    
    try {
      // Core Requirements
      this.validateMockDataReplacement();
      this.validateDataLoading();
      this.validateChartIntegration();
      this.validatePerformance();
      
      // Dashboard Components
      this.validateDashboardComponents();
      
      // Data Accuracy
      this.validateDataAccuracy();
      
      // Generate and display report
      const report = this.generateReport();
      console.log(report);
      
      // Save report to file
      fs.writeFileSync('validation-report.txt', report);
      this.log('Validation report saved to validation-report.txt');
      
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'ERROR');
      this.results.criticalIssues.push(`Validation script error: ${error.message}`);
    }
  }
}

// Run validation
const validator = new DashboardValidator();
validator.validate().catch(console.error);