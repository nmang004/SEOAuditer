// Database handler with complete build-time safety
let prismaClient: any = null;
let isInitialized = false;

// Mock data for build time
const mockData = {
  project: {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  user: {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  // Add other models as needed
};

async function initializePrisma() {
  if (isInitialized) {
    return prismaClient;
  }

  // Check if we're in a build environment or missing DATABASE_URL
  const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;
  const isDummyUrl = process.env.DATABASE_URL === 'postgresql://dummy:dummy@localhost:5432/dummy?schema=public';

  if (isBuildTime || isDummyUrl || !process.env.DATABASE_URL) {
    console.log('🔧 Using mock database for build time');
    prismaClient = mockData;
    isInitialized = true;
    return prismaClient;
  }

  try {
    // Dynamic import to avoid loading Prisma during build
    const { PrismaClient } = await import('@prisma/client');
    
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    
    console.log('✅ Real Prisma client initialized');
    isInitialized = true;
    return prismaClient;
  } catch (error) {
    console.warn('⚠️ Failed to initialize Prisma, using mock data:', error);
    prismaClient = mockData;
    isInitialized = true;
    return prismaClient;
  }
}

// Export a lazy-loaded database instance
export const getDatabase = async () => {
  return await initializePrisma();
};

// Connection management
export async function connectDatabase() {
  const db = await getDatabase();
  
  if (db === mockData) {
    console.log('📝 Using mock database, no connection needed');
    return;
  }
  
  try {
    await db.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}

export async function disconnectDatabase() {
  if (!isInitialized || prismaClient === mockData) {
    return;
  }
  
  try {
    await prismaClient.$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('Error disconnecting database:', error);
  }
}

// Helper to check if real database is available
export function isDatabaseAvailable() {
  return isInitialized && prismaClient !== mockData;
} 