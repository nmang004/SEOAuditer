import { PrismaClient } from '@prisma/client'

// Global Prisma client instance with connection pooling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Add connection management
export async function connectPrisma() {
  try {
    await prisma.$connect()
    console.log('✅ Prisma connected successfully')
  } catch (error) {
    console.error('❌ Prisma connection error:', error)
  }
}

export async function disconnectPrisma() {
  await prisma.$disconnect()
} 