import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Garante que na Vercel o banco SQLite funcione imediatamente em /tmp/production.db
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/production.db';
  try {
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'production.db'),
        path.join(process.cwd(), 'production.db'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          fs.copyFileSync(candidate, tmpDbPath);
          break;
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  } catch {
    process.env.DATABASE_URL = 'file:/tmp/production.db';
  }
} else if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = 'file:./production.db';
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  schemaInitialized?: boolean;
  schemaInitPromise?: Promise<void>;
};

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

/**
 * Auto-inicializa as tabelas SQLite caso /tmp/production.db tenha sido criado do zero em Serverless
 */
export async function ensureSqliteTables(): Promise<void> {
  if (globalForPrisma.schemaInitialized) return;
  if (globalForPrisma.schemaInitPromise) return globalForPrisma.schemaInitPromise;

  globalForPrisma.schemaInitPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000;').catch(() => {});
      await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ApiCredential" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "provider" TEXT NOT NULL UNIQUE,
        "apiKey" TEXT NOT NULL,
        "accountId" TEXT,
        "pixelId" TEXT,
        "webhookSecret" TEXT,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "accountName" TEXT,
        "currency" TEXT,
        "lastTestedAt" DATETIME,
        "updatedAt" DATETIME NOT NULL
      );
    `);
      await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Product" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "sourceUrl" TEXT NOT NULL,
        "segment" TEXT NOT NULL,
        "rawScrapedText" TEXT NOT NULL,
        "costUsd" REAL NOT NULL,
        "priceUsd" REAL NOT NULL,
        "orderBumpUsd" REAL NOT NULL DEFAULT 0.0,
        "shippingUsd" REAL NOT NULL DEFAULT 0.0,
        "gatewayFeePercent" REAL NOT NULL DEFAULT 9.99,
        "gatewayFeeFixedUsd" REAL NOT NULL DEFAULT 0.80,
        "breakevenCpaUsd" REAL NOT NULL,
        "breakevenRoas" REAL NOT NULL,
        "targetCpaUsd" REAL NOT NULL,
        "avatarProfileJson" TEXT NOT NULL,
        "painPointsJson" TEXT NOT NULL,
        "uniqueMechanism" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
      await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Creative" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        "angle" TEXT NOT NULL,
        "hookEn" TEXT NOT NULL,
        "bodyEn" TEXT NOT NULL,
        "ctaEn" TEXT NOT NULL,
        "metaPrimaryText" TEXT NOT NULL,
        "metaHeadline" TEXT NOT NULL,
        "googleHeadlinesJson" TEXT NOT NULL,
        "orderBumpCopyEn" TEXT NOT NULL,
        "translationPt" TEXT NOT NULL,
        "audioFilePath" TEXT,
        "videoFilePath" TEXT,
        "tiktokPublishId" TEXT,
        "metaCreativeId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'GENERATED',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Creative_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
      await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Campaign" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT,
        "platform" TEXT NOT NULL,
        "externalCampaignId" TEXT,
        "externalAdSetId" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "dailyBudgetUsd" REAL NOT NULL,
        "spendUsd" REAL NOT NULL DEFAULT 0.0,
        "impressions" INTEGER NOT NULL DEFAULT 0,
        "clicks" INTEGER NOT NULL DEFAULT 0,
        "videoP25Watched" INTEGER NOT NULL DEFAULT 0,
        "hookRate" REAL NOT NULL DEFAULT 0.0,
        "ctr" REAL NOT NULL DEFAULT 0.0,
        "purchases" INTEGER NOT NULL DEFAULT 0,
        "revenueUsd" REAL NOT NULL DEFAULT 0.0,
        "cpaUsd" REAL NOT NULL DEFAULT 0.0,
        "roas" REAL NOT NULL DEFAULT 0.0,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Campaign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
      await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Sale" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT,
        "platform" TEXT NOT NULL,
        "externalOrderId" TEXT NOT NULL UNIQUE,
        "customerEmailHash" TEXT,
        "customerCountry" TEXT NOT NULL DEFAULT 'US',
        "grossUsd" REAL NOT NULL,
        "gatewayFeeUsd" REAL NOT NULL,
        "netUsd" REAL NOT NULL,
        "exchangeRateBrl" REAL NOT NULL,
        "netBrl" REAL NOT NULL,
        "capiSent" BOOLEAN NOT NULL DEFAULT false,
        "status" TEXT NOT NULL DEFAULT 'PAID',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Sale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
      await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AutomationLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "module" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "targetId" TEXT,
        "httpStatus" INTEGER,
        "detailsJson" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
      globalForPrisma.schemaInitialized = true;
    } catch {
      // Ignore if already initialized
    }
  })();

  return globalForPrisma.schemaInitPromise;
}
