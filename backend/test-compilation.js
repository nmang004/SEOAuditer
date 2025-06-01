const { PrismaClient } = require('@prisma/client');

async function testCompilation() {
  console.log('🔍 Testing backend compilation and imports...\n');

  try {
    // Test 1: Database connection
    console.log('1. Testing Prisma Client...');
    const prisma = new PrismaClient();
    console.log('✅ Prisma Client instantiated successfully');

    // Test 2: Core dependencies
    console.log('\n2. Testing core dependencies...');
    const express = require('express');
    const cors = require('cors');
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    console.log('✅ Core dependencies loaded successfully');

    // Test 3: PDF/Excel dependencies
    console.log('\n3. Testing report generation dependencies...');
    const PDFDocument = require('pdfkit');
    const XLSX = require('xlsx');
    const csvWriter = require('csv-writer');
    console.log('✅ Report generation dependencies loaded successfully');

    // Test 4: Analysis dependencies
    console.log('\n4. Testing analysis dependencies...');
    const cheerio = require('cheerio');
    const puppeteer = require('puppeteer');
    const lighthouse = require('lighthouse');
    console.log('✅ Analysis dependencies loaded successfully');

    // Test 5: Try to import main analysis modules
    console.log('\n5. Testing analysis modules...');
    
    // Import the built modules
    const { EnhancedIssueDetection } = require('./dist/seo-crawler/engine/AnalysisModules/EnhancedIssueDetection');
    const { EnhancedContentAnalyzer } = require('./dist/seo-crawler/engine/AnalysisModules/EnhancedContentAnalyzer');
    const { EnhancedRecommendationEngine } = require('./dist/seo-crawler/engine/AnalysisModules/EnhancedRecommendationEngine');
    
    // Try to instantiate them
    const issueDetection = new EnhancedIssueDetection();
    const contentAnalyzer = new EnhancedContentAnalyzer();
    const recommendationEngine = new EnhancedRecommendationEngine();
    
    console.log('✅ Analysis modules instantiated successfully');

    // Test 6: Controller instantiation
    console.log('\n6. Testing controllers...');
    const { analysisController } = require('./dist/controllers/analysis.controller');
    console.log('✅ Controllers instantiated successfully');

    console.log('\n🎉 All compilation tests passed! Backend is ready for use.');
    console.log('\nNext steps:');
    console.log('- Run: npm run dev');
    console.log('- Test API endpoints');
    console.log('- Run actual SEO analysis');

    await prisma.$disconnect();
    return true;

  } catch (error) {
    console.error('\n❌ Compilation test failed:');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    return false;
  }
}

if (require.main === module) {
  testCompilation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { testCompilation }; 