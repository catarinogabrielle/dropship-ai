import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Se estiver rodando na Vercel sem DATABASE_URL externo configurado,
// copia o banco SQLite inicial para /tmp/production.db (gravavel em Serverless)
if (process.env.VERCEL && (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:.'))) {
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
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./production.db';
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
