// Import types for proper typing
type PrismaClientType = any;

// Prisma client with build-time safety
let prismaInstance: PrismaClientType = null;
let isDatabaseAvailable = false;

// Check if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;

if (!isBuildTime && process.env.DATABASE_URL && process.env.DATABASE_URL !== 'dummy') {
  try {
    const { PrismaClient } = require('@prisma/client');
    
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      enableTracing: false,
    });
    
    isDatabaseAvailable = true;
  } catch (error) {
    console.warn('Prisma client could not be initialized:', error);
    prismaInstance = null;
    isDatabaseAvailable = false;
  }
}

// Export a proxy that handles build-time safety with proper typing
export const prisma = new Proxy({} as any, {
  get(target, prop) {
    if (!isDatabaseAvailable || !prismaInstance) {
      console.warn(`Prisma method ${String(prop)} called but database not available`);
      return () => Promise.resolve([]);
    }
    return prismaInstance[prop];
  }
}) as PrismaClientType;

// Connection management functions
export async function connectPrisma() {
  if (!isDatabaseAvailable || !prismaInstance) {
    console.log('⚠️ Database not available, skipping connection');
    return;
  }
  
  try {
    await prismaInstance.$connect();
    console.log('✅ Prisma connected successfully');
  } catch (error) {
    console.error('❌ Prisma connection error:', error);
  }
}

export async function disconnectPrisma() {
  if (!isDatabaseAvailable || !prismaInstance) {
    return;
  }
  
  try {
    await prismaInstance.$disconnect();
  } catch (error) {
    console.error('Error disconnecting Prisma:', error);
  }
}

// Helper function to check if database is available
export function isDatabaseConnected() {
  return isDatabaseAvailable && prismaInstance !== null;
} 