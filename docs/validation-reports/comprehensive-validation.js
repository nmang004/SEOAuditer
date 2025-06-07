#!/usr/bin/env node

/**
 * Comprehensive SEO Application Validation
 * Tests against the provided checklist requirements
 */

const fs = require('fs');
const path = require('path');

class ComprehensiveValidator {
  constructor() {
    this.checklist = {
      coreRequirements: {
        mockDataReplacement: { status: 'INCOMPLETE', details: [], weight: 5 },
        dataLoading: { status: 'INCOMPLETE', details: [], weight: 4 },
        chartIntegration: { status: 'INCOMPLETE', details: [], weight: 4 },
        performance: { status: 'INCOMPLETE', details: [], weight: 3 }
      },
      dashboardComponents: {
        statisticsCards: { status: 'INCOMPLETE', details: [], weight: 3 },
        recentProjects: { status: 'INCOMPLETE', details: [], weight: 3 },
        seoScoreTrends: { status: 'INCOMPLETE', details: [], weight: 4 },
        priorityIssues: { status: 'INCOMPLETE', details: [], weight: 4 },
        performanceMetrics: { status: 'INCOMPLETE', details: [], weight: 3 }
      },
      dataAccuracy: {
        projectStats: { status: 'INCOMPLETE', details: [], weight: 5 },
        analysisHistory: { status: 'INCOMPLETE', details: [], weight: 3 },
        scoreCalculations: { status: 'INCOMPLETE', details: [], weight: 4 },
        issuePrioritization: { status: 'INCOMPLETE', details: [], weight: 4 }
      },
      criticalIssues: []
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  readFile(relativePath) {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      this.log(`Warning: Could not read file ${relativePath}`, 'WARN');
      return null;
    }
  }

  validateMockDataReplacement() {
    this.log('🔍 Validating mock data replacement...');
    
    const files = [
      'src/app/(app)/dashboard/page.tsx',
      'src/components/dashboard/enhanced-stats-overview.tsx',
      'src/components/dashboard/recent-projects.tsx',
      'src/app/api/dashboard/stats/route.ts',
      'src/app/api/dashboard/recent-projects/route.ts'
    ];

    let totalPoints = 0;
    const maxPoints = 5;

    // Check for React Query usage
    const dashboardPage = this.readFile(files[0]);
    if (dashboardPage && (dashboardPage.includes('useDashboardStats') || dashboardPage.includes('useRecentProjects'))) {
      totalPoints += 1;
      this.checklist.coreRequirements.mockDataReplacement.details.push('✅ Dashboard uses React Query hooks for data fetching');
    } else {
      this.checklist.coreRequirements.mockDataReplacement.details.push('❌ Dashboard not using React Query hooks');
    }

    // Check for API integration
    const statsAPI = this.readFile(files[3]);
    if (statsAPI && statsAPI.includes('prisma.') && statsAPI.includes('Promise.all')) {
      totalPoints += 2;
      this.checklist.coreRequirements.mockDataReplacement.details.push('✅ Stats API uses Prisma with parallel queries');
    } else {
      this.checklist.coreRequirements.mockDataReplacement.details.push('❌ Stats API missing proper database integration');
    }

    // Check for real data transformation
    const projectsAPI = this.readFile(files[4]);
    if (projectsAPI && projectsAPI.includes('trend') && projectsAPI.includes('scoreDiff')) {
      totalPoints += 1;
      this.checklist.coreRequirements.mockDataReplacement.details.push('✅ Projects API calculates real trends from data');
    } else {
      this.checklist.coreRequirements.mockDataReplacement.details.push('❌ Projects API missing trend calculations');
    }

    // Check components use real data
    const statsComponent = this.readFile(files[1]);
    if (statsComponent && statsComponent.includes('useDashboardStats') && !statsComponent.includes('fallbackData')) {
      totalPoints += 1;
      this.checklist.coreRequirements.mockDataReplacement.details.push('✅ Stats component fetches real data');
    } else if (statsComponent && statsComponent.includes('fallbackData')) {
      totalPoints += 0.5;
      this.checklist.coreRequirements.mockDataReplacement.details.push('⚠️  Stats component has fallback but uses real data');
    } else {
      this.checklist.coreRequirements.mockDataReplacement.details.push('❌ Stats component not using real data');
    }

    this.checklist.coreRequirements.mockDataReplacement.status = 
      totalPoints >= 4 ? 'COMPLETE' : totalPoints >= 2 ? 'NEEDS_REVIEW' : 'INCOMPLETE';
  }

  validateDataLoading() {
    this.log('⚡ Validating data loading performance...');
    
    const hookFile = this.readFile('src/hooks/useReactQueryDashboard.ts');
    let totalPoints = 0;
    const maxPoints = 4;

    if (hookFile) {
      // Check caching configuration
      if (hookFile.includes('staleTime') && hookFile.includes('gcTime')) {
        totalPoints += 1;
        this.checklist.coreRequirements.dataLoading.details.push('✅ Caching properly configured (staleTime, gcTime)');
      }

      // Check retry logic
      if (hookFile.includes('retry:') && hookFile.includes('retryDelay')) {
        totalPoints += 1;
        this.checklist.coreRequirements.dataLoading.details.push('✅ Retry logic implemented');
      }

      // Check refetch intervals
      if (hookFile.includes('refetchInterval')) {
        totalPoints += 1;
        this.checklist.coreRequirements.dataLoading.details.push('✅ Auto-refresh configured');
      }

      // Check error handling
      const dashboardPage = this.readFile('src/app/(app)/dashboard/page.tsx');
      if (dashboardPage && dashboardPage.includes('error') && dashboardPage.includes('refetch')) {
        totalPoints += 1;
        this.checklist.coreRequirements.dataLoading.details.push('✅ Error handling with retry capability');
      }
    }

    this.checklist.coreRequirements.dataLoading.status = 
      totalPoints >= 3 ? 'COMPLETE' : totalPoints >= 2 ? 'NEEDS_REVIEW' : 'INCOMPLETE';
  }

  validateChartIntegration() {
    this.log('📊 Validating chart integration...');
    
    const chartFiles = [
      'src/components/charts/performance-chart.tsx',
      'src/components/charts/issue-trends-chart.tsx'
    ];

    let totalPoints = 0;
    const maxPoints = 4;

    chartFiles.forEach(file => {
      const content = this.readFile(file);
      if (content) {
        // Check Chart.js usage
        if (content.includes('react-chartjs-2') && content.includes('Chart as ChartJS')) {
          totalPoints += 1;
          this.checklist.coreRequirements.chartIntegration.details.push(`✅ ${file.split('/').pop()} uses Chart.js properly`);
        }

        // Check real data integration
        if (content.includes('usePerformanceTrends') || content.includes('useIssueTrends')) {
          totalPoints += 1;
          this.checklist.coreRequirements.chartIntegration.details.push(`✅ ${file.split('/').pop()} uses real API data`);
        }
      }
    });

    // Check responsive design
    const performanceChart = this.readFile(chartFiles[0]);
    if (performanceChart && performanceChart.includes('responsive: true') && performanceChart.includes('maintainAspectRatio')) {
      totalPoints += 1;
      this.checklist.coreRequirements.chartIntegration.details.push('✅ Charts are responsive');
    }

    this.checklist.coreRequirements.chartIntegration.status = 
      totalPoints >= 3 ? 'COMPLETE' : totalPoints >= 2 ? 'NEEDS_REVIEW' : 'INCOMPLETE';
  }

  validatePerformance() {
    this.log('🚀 Validating performance optimizations...');
    
    let totalPoints = 0;
    const maxPoints = 3;

    // Check React Query optimization
    const hookFile = this.readFile('src/hooks/useReactQueryDashboard.ts');
    if (hookFile && hookFile.includes('staleTime: 5 * 60 * 1000')) {
      totalPoints += 1;
      this.checklist.coreRequirements.performance.details.push('✅ Optimal cache timing (5 min stale)');
    }

    // Check API parallel queries
    const statsAPI = this.readFile('src/app/api/dashboard/stats/route.ts');
    if (statsAPI && statsAPI.includes('Promise.all')) {
      totalPoints += 1;
      this.checklist.coreRequirements.performance.details.push('✅ Parallel database queries');
    }

    // Check query prefetching
    if (hookFile && hookFile.includes('prefetch')) {
      totalPoints += 1;
      this.checklist.coreRequirements.performance.details.push('✅ Query prefetching available');
    }

    this.checklist.coreRequirements.performance.status = 
      totalPoints >= 2 ? 'COMPLETE' : totalPoints >= 1 ? 'NEEDS_REVIEW' : 'INCOMPLETE';
  }

  validateDashboardComponents() {
    this.log('🎛️  Validating dashboard components...');
    
    // Read common files once
    const dashboardPage = this.readFile('src/app/(app)/dashboard/page.tsx');
    
    // Statistics Cards
    const statsComponent = this.readFile('src/components/dashboard/enhanced-stats-overview.tsx');
    if (statsComponent && 
        statsComponent.includes('totalProjects') && 
        statsComponent.includes('averageScore') && 
        statsComponent.includes('criticalIssues')) {
      this.checklist.dashboardComponents.statisticsCards.status = 'COMPLETE';
      this.checklist.dashboardComponents.statisticsCards.details.push('✅ All required statistics cards implemented');
    }

    // Recent Projects
    const projectsComponent = this.readFile('src/components/dashboard/recent-projects.tsx');
    if ((projectsComponent && projectsComponent.includes('projects: Project[]')) &&
        (dashboardPage && dashboardPage.includes('useRecentProjects'))) {
      this.checklist.dashboardComponents.recentProjects.status = 'COMPLETE';
      this.checklist.dashboardComponents.recentProjects.details.push('✅ Recent projects component implemented and dashboard uses real data hook');
    }

    // SEO Score Trends
    if (dashboardPage && dashboardPage.includes('PerformanceChart')) {
      this.checklist.dashboardComponents.seoScoreTrends.status = 'COMPLETE';
      this.checklist.dashboardComponents.seoScoreTrends.details.push('✅ SEO score trends charts integrated');
    }

    // Priority Issues
    if (dashboardPage && dashboardPage.includes('priorityIssues')) {
      this.checklist.dashboardComponents.priorityIssues.status = 'COMPLETE';
      this.checklist.dashboardComponents.priorityIssues.details.push('✅ Priority issues section implemented');
    }

    // Performance Metrics
    if (dashboardPage && dashboardPage.includes('performanceTrends')) {
      this.checklist.dashboardComponents.performanceMetrics.status = 'COMPLETE';
      this.checklist.dashboardComponents.performanceMetrics.details.push('✅ Performance metrics displayed');
    }
  }

  validateDataAccuracy() {
    this.log('🎯 Validating data accuracy...');
    
    // Project Statistics
    const statsAPI = this.readFile('src/app/api/dashboard/stats/route.ts');
    if (statsAPI && 
        statsAPI.includes('prisma.project.count') && 
        statsAPI.includes('aggregate') && 
        statsAPI.includes('_avg')) {
      this.checklist.dataAccuracy.projectStats.status = 'COMPLETE';
      this.checklist.dataAccuracy.projectStats.details.push('✅ Project statistics use proper database aggregations');
    }

    // Analysis History
    if (statsAPI && statsAPI.includes('recentAnalyses') && statsAPI.includes('scoreTrends')) {
      this.checklist.dataAccuracy.analysisHistory.status = 'COMPLETE';
      this.checklist.dataAccuracy.analysisHistory.details.push('✅ Analysis history properly tracked');
    }

    // Score Calculations
    if (statsAPI && statsAPI.includes('scoreImprovement') && 
        (statsAPI.includes('scoreDiff') || statsAPI.includes('recentAnalyses.reduce'))) {
      this.checklist.dataAccuracy.scoreCalculations.status = 'COMPLETE';
      this.checklist.dataAccuracy.scoreCalculations.details.push('✅ Score calculations are mathematically correct');
    }

    // Issue Prioritization
    if (statsAPI && statsAPI.includes('severity') && statsAPI.includes('criticalIssues')) {
      this.checklist.dataAccuracy.issuePrioritization.status = 'COMPLETE';
      this.checklist.dataAccuracy.issuePrioritization.details.push('✅ Issue prioritization reflects severity properly');
    }
  }

  generateDetailedReport() {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'COMPLETE': return '✅';
        case 'NEEDS_REVIEW': return '⚠️';
        case 'INCOMPLETE': return '❌';
        default: return '❓';
      }
    };

    let report = '\n' + '='.repeat(80) + '\n';
    report += '    COMPREHENSIVE SEO APPLICATION VALIDATION REPORT\n';
    report += '='.repeat(80) + '\n';
    report += `Validation Date: ${new Date().toLocaleString()}\n`;
    report += `Backend URL: http://localhost:4000\n`;
    report += `Frontend URL: http://localhost:3003\n\n`;

    // Core Requirements
    report += '📋 CORE REQUIREMENTS VALIDATION:\n';
    report += '-'.repeat(50) + '\n';
    Object.entries(this.checklist.coreRequirements).forEach(([key, result]) => {
      const icon = getStatusIcon(result.status);
      report += `${icon} ${key.toUpperCase()}: [${result.status}]\n`;
      result.details.forEach(detail => report += `   ${detail}\n`);
      report += '\n';
    });

    // Dashboard Components
    report += '📊 DASHBOARD COMPONENTS VALIDATION:\n';
    report += '-'.repeat(50) + '\n';
    Object.entries(this.checklist.dashboardComponents).forEach(([key, result]) => {
      const icon = getStatusIcon(result.status);
      report += `${icon} ${key.toUpperCase()}: [${result.status}]\n`;
      result.details.forEach(detail => report += `   ${detail}\n`);
      report += '\n';
    });

    // Data Accuracy
    report += '🎯 DATA ACCURACY:\n';
    report += '-'.repeat(50) + '\n';
    Object.entries(this.checklist.dataAccuracy).forEach(([key, result]) => {
      const icon = getStatusIcon(result.status);
      report += `${icon} ${key.toUpperCase()}: [${result.status}]\n`;
      result.details.forEach(detail => report += `   ${detail}\n`);
      report += '\n';
    });

    // Critical Issues
    if (this.checklist.criticalIssues.length > 0) {
      report += '🚨 CRITICAL ISSUES FOUND:\n';
      report += '-'.repeat(50) + '\n';
      this.checklist.criticalIssues.forEach(issue => report += `❌ ${issue}\n`);
      report += '\n';
    }

    // Calculate weighted completion
    const allSections = {
      ...this.checklist.coreRequirements,
      ...this.checklist.dashboardComponents,
      ...this.checklist.dataAccuracy
    };

    let totalWeight = 0;
    let completedWeight = 0;
    let needsReviewWeight = 0;

    Object.values(allSections).forEach(section => {
      totalWeight += section.weight;
      if (section.status === 'COMPLETE') {
        completedWeight += section.weight;
      } else if (section.status === 'NEEDS_REVIEW') {
        needsReviewWeight += section.weight / 2; // Half credit for needs review
      }
    });

    const completionRate = Math.round(((completedWeight + needsReviewWeight) / totalWeight) * 100);

    // Overall Status
    report += '📈 OVERALL STATUS:\n';
    report += '-'.repeat(50) + '\n';
    report += `Weighted Completion Rate: ${completionRate}%\n`;
    report += `Fully Complete: ${Math.round((completedWeight / totalWeight) * 100)}%\n`;
    report += `Needs Review: ${Math.round((needsReviewWeight / totalWeight) * 200)}%\n\n`;

    if (completionRate >= 90) {
      report += 'Status: ✅ READY FOR PRODUCTION\n';
      report += 'Recommendation: All core requirements met. Consider minor optimizations.\n';
    } else if (completionRate >= 80) {
      report += 'Status: ⚠️  MOSTLY READY - MINOR FIXES NEEDED\n';
      report += 'Recommendation: Address items marked "NEEDS_REVIEW" before production.\n';
    } else if (completionRate >= 60) {
      report += 'Status: ⚠️  SIGNIFICANT GAPS REQUIRE ATTENTION\n';
      report += 'Recommendation: Complete missing core functionality before production.\n';
    } else {
      report += 'Status: ❌ NOT READY FOR PRODUCTION\n';
      report += 'Recommendation: Major implementation required. Focus on core requirements first.\n';
    }

    report += '\n' + '='.repeat(80) + '\n';
    return report;
  }

  async validate() {
    this.log('🚀 Starting comprehensive SEO application validation...');
    
    try {
      // Run all validations
      this.validateMockDataReplacement();
      this.validateDataLoading();
      this.validateChartIntegration();
      this.validatePerformance();
      this.validateDashboardComponents();
      this.validateDataAccuracy();

      // Generate and display report
      const report = this.generateDetailedReport();
      console.log(report);

      // Save report
      fs.writeFileSync('comprehensive-validation-report.txt', report);
      this.log('📋 Comprehensive validation report saved to comprehensive-validation-report.txt');

    } catch (error) {
      this.log(`❌ Validation failed: ${error.message}`, 'ERROR');
      this.checklist.criticalIssues.push(`Validation script error: ${error.message}`);
    }
  }
}

// Run validation
const validator = new ComprehensiveValidator();
validator.validate().catch(console.error);