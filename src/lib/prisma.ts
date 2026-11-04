import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Garante que na Vercel o banco SQLite funcione imediatamente em /tmp/production.db
// mesmo se alguma integracao tiver definido outro formato de DATABASE_URL
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/production.db';
  try {
    if (!fs.existsSync(tmpDbPath)) {
      const bundledDb = path.join(process.cwd(), 'prisma', 'production.db');
      if (fs.existsSync(bundledDb)) {
        fs.copyFileSync(bundledDb, tmpDbPath);
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  } catch {
    process.env.DATABASE_URL = 'file:/tmp/production.db';
  }
} else if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = 'file:./production.db';
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
