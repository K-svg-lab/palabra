/**
 * Database client singleton
 * Handles Prisma client instantiation with proper singleton pattern
 */

import { PrismaClient } from '@prisma/client';

// Declare global type for Prisma client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client instance
 */
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Global Prisma client instance
 * Uses singleton pattern to prevent multiple instances in development
 */
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Disconnect from database
 * Useful for graceful shutdowns
 */
export async function disconnect() {
  await prisma.$disconnect();
}

/**
 * Check database connection
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

