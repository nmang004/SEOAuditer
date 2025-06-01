const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function validateDatabase() {
  console.log('==========================================');
  console.log('DATABASE VALIDATION REPORT');
  console.log('==========================================\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  async function runTest(name, testFn, expected) {
    try {
      const result = await testFn();
      const passed = expected ? expected(result) : true;
      
      if (passed) {
        console.log(`✅ ${name}`);
        results.passed++;
        results.tests.push({ name, status: 'PASSED' });
      } else {
        console.log(`❌ ${name}`);
        results.failed++;
        results.tests.push({ name, status: 'FAILED', reason: 'Expectation not met' });
      }
      
      return result;
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
      results.failed++;
      results.tests.push({ name, status: 'FAILED', reason: error.message });
      return null;
    }
  }

  try {
    // Core Requirements
    console.log('CORE REQUIREMENTS VALIDATION:');
    console.log('-----------------------------');

    // 1. Database Connection
    await runTest(
      'Database Connection',
      async () => {
        await prisma.$connect();
        return true;
      }
    );

    // 2. Schema Migration Status
    await runTest(
      'Schema Migration Status',
      async () => {
        const tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `;
        return tables;
      },
      (result) => result.length >= 20 // Should have at least 20 tables
    );

    // 3. Prisma Integration
    await runTest(
      'Prisma ORM Operations',
      async () => {
        const operations = {
          create: false,
          read: false,
          update: false,
          delete: false
        };

        // Test in transaction to rollback
        await prisma.$transaction(async (tx) => {
          // CREATE
          const user = await tx.user.create({
            data: {
              email: 'test-validation@example.com',
              passwordHash: 'hashed_password_example',
              name: 'Validation Test'
            }
          });
          operations.create = !!user.id;

          // READ
          const found = await tx.user.findUnique({
            where: { id: user.id }
          });
          operations.read = !!found;

          // UPDATE
          const updated = await tx.user.update({
            where: { id: user.id },
            data: { name: 'Updated Name' }
          });
          operations.update = updated.name === 'Updated Name';

          // DELETE
          const deleted = await tx.user.delete({
            where: { id: user.id }
          });
          operations.delete = !!deleted;

          throw new Error('Rollback test data');
        }).catch(e => {
          if (e.message !== 'Rollback test data') throw e;
        });

        return operations;
      },
      (result) => result.create && result.read && result.update && result.delete
    );

    // 4. Data Seeding
    await runTest(
      'Data Seeding Verification',
      async () => {
        const counts = await prisma.$transaction([
          prisma.user.count(),
          prisma.project.count(),
          prisma.sEOAnalysis.count(),
          prisma.sEOIssue.count()
        ]);
        
        return {
          users: counts[0],
          projects: counts[1],
          analyses: counts[2],
          issues: counts[3]
        };
      },
      (result) => result.users > 0 && result.projects > 0
    );

    // Database Health Checks
    console.log('\nDATABASE HEALTH CHECK:');
    console.log('----------------------');

    // 5. Connection Pool
    await runTest(
      'Connection Pool Configuration',
      async () => {
        const poolStats = await prisma.$queryRaw`
          SELECT count(*) as connections 
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `;
        return poolStats[0].connections;
      },
      (result) => result > 0 && result < 100 // Reasonable connection count
    );

    // 6. Indexes
    await runTest(
      'Performance Indexes',
      async () => {
        const indexes = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM pg_indexes 
          WHERE schemaname = 'public'
        `;
        return indexes[0].count;
      },
      (result) => result > 100 // Should have many indexes for performance
    );

    // 7. Foreign Key Constraints
    await runTest(
      'Data Integrity Constraints',
      async () => {
        const constraints = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM information_schema.table_constraints 
          WHERE constraint_schema = 'public' 
          AND constraint_type = 'FOREIGN KEY'
        `;
        return constraints[0].count;
      },
      (result) => Number(result) >= 15 // Should have many foreign keys
    );

    // Additional Performance Tests
    console.log('\nPERFORMANCE VALIDATION:');
    console.log('-----------------------');

    // 8. Query Performance
    const start = Date.now();
    await runTest(
      'Query Performance (<100ms)',
      async () => {
        await prisma.project.findMany({
          include: { 
            user: true,
            analyses: { 
              take: 1,
              include: { 
                issues: { take: 5 }
              }
            }
          },
          take: 10
        });
        return Date.now() - start;
      },
      (result) => result < 100 // Should complete in under 100ms
    );

    // 9. Transaction Performance
    const txStart = Date.now();
    await runTest(
      'Transaction Performance (<50ms)',
      async () => {
        await prisma.$transaction([
          prisma.user.count(),
          prisma.project.count(),
          prisma.sEOAnalysis.count(),
          prisma.sEOIssue.count(),
          prisma.sEORecommendation.count()
        ]);
        return Date.now() - txStart;
      },
      (result) => result < 50 // Should complete in under 50ms
    );

    // Final Summary
    console.log('\n==========================================');
    console.log('VALIDATION SUMMARY');
    console.log('==========================================');
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.failed === 0) {
      console.log('\n✅ ALL VALIDATION TESTS PASSED!');
      console.log('The database is fully operational and meets all requirements.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }

    // Database Info
    const dbInfo = await prisma.$queryRaw`
      SELECT version() as version,
             current_database() as database,
             pg_database_size(current_database()) as size
    `;
    
    console.log('\nDATABASE INFORMATION:');
    console.log('---------------------');
    console.log(`PostgreSQL Version: ${dbInfo[0].version.split(' ').slice(0, 2).join(' ')}`);
    console.log(`Database Name: ${dbInfo[0].database}`);
    console.log(`Database Size: ${(Number(dbInfo[0].size) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Prisma Version: 6.8.2`);

  } catch (error) {
    console.error('\n❌ Critical validation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateDatabase().catch(console.error);