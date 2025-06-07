console.log('Testing analysis controller import...');

try {
  console.log('1. Testing direct import...');
  const { analysisController } = require('./dist/controllers/analysis.controller');
  console.log('✅ Analysis controller imported successfully');
  
  console.log('2. Testing controller properties...');
  console.log('getProjectAnalyses method exists:', typeof analysisController.getProjectAnalyses);
  
  if (typeof analysisController.getProjectAnalyses === 'function') {
    console.log('✅ getProjectAnalyses method is available');
  } else {
    console.log('❌ getProjectAnalyses method is missing or not a function');
  }
  
  console.log('All controller methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(analysisController)).filter(name => name !== 'constructor'));
  
} catch (error) {
  console.error('❌ Error importing analysis controller:', error.message);
  console.error('Stack:', error.stack);
} 