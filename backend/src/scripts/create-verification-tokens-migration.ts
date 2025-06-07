import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Create Verification Tokens Migration Script
 * 
 * This script creates the verification_tokens table and migrates existing
 * verification tokens from the users table to the new secure token system.
 */

async function createVerificationTokensMigration() {
  try {
    logger.info('Starting verification tokens migration...');

    // Step 1: Check if migration is needed
    const tableExists = await checkTableExists();
    if (tableExists) {
      logger.info('Verification tokens table already exists, checking for data migration...');
    } else {
      logger.info('Creating verification tokens table...');
      await createVerificationTokensTable();
    }

    // Step 2: Migrate existing tokens (if any)
    await migrateExistingTokens();

    // Step 3: Cleanup old token fields (optional - commented out for safety)
    // await cleanupOldTokenFields();

    logger.info('Verification tokens migration completed successfully');

  } catch (error) {
    logger.error('Verification tokens migration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkTableExists(): Promise<boolean> {
  try {
    await (prisma as any).verificationToken.findFirst();
    return true;
  } catch (error) {
    return false;
  }
}

async function createVerificationTokensTable(): Promise<void> {
  // This will be handled by Prisma migrations
  // We're just ensuring the schema is applied
  logger.info('Verification tokens table will be created by Prisma migration');
}

async function migrateExistingTokens(): Promise<void> {
  logger.info('Checking for existing verification tokens to migrate...');

  // Find users with existing verification tokens
  const usersWithTokens = await prisma.user.findMany({
    where: {
      verificationToken: {
        not: null
      },
      emailVerified: false
    },
    select: {
      id: true,
      email: true,
      verificationToken: true,
      verificationExpires: true
    }
  });

  if (usersWithTokens.length === 0) {
    logger.info('No existing verification tokens found to migrate');
    return;
  }

  logger.info(`Found ${usersWithTokens.length} users with existing verification tokens`);

  // Import the secure token service
  const { SecureTokenService } = await import('../services/SecureTokenService');
  const tokenService = new SecureTokenService(prisma);

  let migratedCount = 0;
  let errorCount = 0;

  for (const user of usersWithTokens) {
    try {
      logger.info(`Migrating token for user ${user.email}...`);

      // Generate a new secure token for this user
      await tokenService.generateVerificationToken(
        user.id,
        user.email,
        'email_verification'
      );

      // Clear the old token from users table
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: null,
          verificationExpires: null
        }
      });

      migratedCount++;
      logger.info(`Successfully migrated token for user ${user.email}`);

    } catch (error) {
      errorCount++;
      logger.error(`Failed to migrate token for user ${user.email}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  logger.info('Token migration completed', {
    totalUsers: usersWithTokens.length,
    migratedCount,
    errorCount
  });
}

// async function cleanupOldTokenFields(): Promise<void> {
//   logger.info('Cleanup of old token fields is disabled for safety');
//   logger.info('To remove old token fields from users table:');
//   logger.info('1. Ensure all tokens are migrated successfully');
//   logger.info('2. Update Prisma schema to remove verificationToken and verificationExpires fields');
//   logger.info('3. Generate and run a new Prisma migration');
// }

// Run migration if this script is executed directly
if (require.main === module) {
  createVerificationTokensMigration()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed', error);
      process.exit(1);
    });
}

export { createVerificationTokensMigration };