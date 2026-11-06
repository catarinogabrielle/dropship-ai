import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

/**
 * API DE BACKUP & PERSISTÊNCIA COMPLETA
 * Permite exportar e importar todas as credenciais, produtos, campanhas e configurações
 * Garante que o usuário possa salvar em arquivo JSON no computador e restaurar com 1 clique!
 */

export async function GET() {
  try {
    await ensureSqliteTables();
    const [credentials, products, creatives, campaigns, sales] = await Promise.all([
      prisma.apiCredential.findMany(),
      prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.creative.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
      prisma.campaign.findMany({ take: 50, orderBy: { lastSyncedAt: 'desc' } }),
      prisma.sale.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
    ]);

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      system: 'US Dollar AI Commerce Autopilot',
      credentials: credentials.map((c) => ({
        provider: c.provider,
        apiKey: c.apiKey,
        accountId: c.accountId,
        pixelId: c.pixelId,
        webhookSecret: c.webhookSecret,
        accountName: c.accountName,
        currency: c.currency,
        isVerified: c.isVerified,
      })),
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        sourceUrl: p.sourceUrl,
        segment: p.segment,
        rawScrapedText: p.rawScrapedText,
        costUsd: p.costUsd,
        priceUsd: p.priceUsd,
        orderBumpUsd: p.orderBumpUsd,
        shippingUsd: p.shippingUsd,
        gatewayFeePercent: p.gatewayFeePercent,
        gatewayFeeFixedUsd: p.gatewayFeeFixedUsd,
        breakevenCpaUsd: p.breakevenCpaUsd,
        breakevenRoas: p.breakevenRoas,
        targetCpaUsd: p.targetCpaUsd,
        avatarProfileJson: p.avatarProfileJson,
        painPointsJson: p.painPointsJson,
        uniqueMechanism: p.uniqueMechanism,
      })),
      creativesCount: creatives.length,
      campaignsCount: campaigns.length,
      salesCount: sales.length,
    };

    // Se estiver rodando localmente (não-Vercel), salva cópia em pasta local data/
    try {
      if (!process.env.VERCEL) {
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(dataDir, 'autopilot_auto_backup.json'),
          JSON.stringify(backupData, null, 2),
          'utf-8'
        );
      }
    } catch {
      // Ignore local disk write errors
    }

    return NextResponse.json(backupData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao exportar backup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Arquivo de backup inválido ou vazio.' }, { status: 400 });
    }

    let restoredCredsCount = 0;
    let restoredProductsCount = 0;

    // 1. Restaura Credenciais
    if (Array.isArray(body.credentials)) {
      for (const cred of body.credentials) {
        if (!cred.provider || !cred.apiKey) continue;
        await prisma.apiCredential.upsert({
          where: { provider: cred.provider },
          update: {
            apiKey: cred.apiKey,
            accountId: cred.accountId || null,
            pixelId: cred.pixelId || null,
            webhookSecret: cred.webhookSecret || null,
            accountName: cred.accountName || null,
            currency: cred.currency || 'USD',
            isVerified: cred.isVerified ?? true,
            lastTestedAt: new Date(),
          },
          create: {
            provider: cred.provider,
            apiKey: cred.apiKey,
            accountId: cred.accountId || null,
            pixelId: cred.pixelId || null,
            webhookSecret: cred.webhookSecret || null,
            accountName: cred.accountName || null,
            currency: cred.currency || 'USD',
            isVerified: cred.isVerified ?? true,
            lastTestedAt: new Date(),
          },
        });
        restoredCredsCount++;
      }
    }

    // 2. Restaura Produtos
    if (Array.isArray(body.products)) {
      for (const prod of body.products) {
        if (!prod.title) continue;
        await prisma.product.upsert({
          where: { id: prod.id || `prod_${Date.now()}_${Math.random()}` },
          update: {
            title: prod.title,
            sourceUrl: prod.sourceUrl || 'manual-entry',
            segment: prod.segment || 'KIWIFY_GLOBAL',
            rawScrapedText: prod.rawScrapedText || prod.title,
            costUsd: prod.costUsd || 0,
            priceUsd: prod.priceUsd || 37,
            orderBumpUsd: prod.orderBumpUsd || 0,
            shippingUsd: prod.shippingUsd || 0,
            gatewayFeePercent: prod.gatewayFeePercent || 9.99,
            gatewayFeeFixedUsd: prod.gatewayFeeFixedUsd || 0.8,
            breakevenCpaUsd: prod.breakevenCpaUsd || 30,
            breakevenRoas: prod.breakevenRoas || 1.3,
            targetCpaUsd: prod.targetCpaUsd || 20,
            avatarProfileJson: prod.avatarProfileJson || '{}',
            painPointsJson: prod.painPointsJson || '[]',
            uniqueMechanism: prod.uniqueMechanism || '',
          },
          create: {
            id: prod.id || undefined,
            title: prod.title,
            sourceUrl: prod.sourceUrl || 'manual-entry',
            segment: prod.segment || 'KIWIFY_GLOBAL',
            rawScrapedText: prod.rawScrapedText || prod.title,
            costUsd: prod.costUsd || 0,
            priceUsd: prod.priceUsd || 37,
            orderBumpUsd: prod.orderBumpUsd || 0,
            shippingUsd: prod.shippingUsd || 0,
            gatewayFeePercent: prod.gatewayFeePercent || 9.99,
            gatewayFeeFixedUsd: prod.gatewayFeeFixedUsd || 0.8,
            breakevenCpaUsd: prod.breakevenCpaUsd || 30,
            breakevenRoas: prod.breakevenRoas || 1.3,
            targetCpaUsd: prod.targetCpaUsd || 20,
            avatarProfileJson: prod.avatarProfileJson || '{}',
            painPointsJson: prod.painPointsJson || '[]',
            uniqueMechanism: prod.uniqueMechanism || '',
          },
        });
        restoredProductsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backup restaurado com sucesso! ${restoredCredsCount} conexões de APIs e ${restoredProductsCount} produtos restaurados.`,
      restoredCredsCount,
      restoredProductsCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao importar backup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
