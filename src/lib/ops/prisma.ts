// Re-export the project's shared Prisma singleton
// (uses PrismaPg adapter for Neon, connection pooling, etc.)
export { prisma } from '@/lib/prisma';
