import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

/**
 * API DE BACKUP & PERSISTÊNCIA COMPLETA
 * Permite exportar e importar todas as credenciais (incluindo Kiwify e Shopify via Webhook/Secret),
 * produtos, criativos e configurações.
 */

export async function GET() {
  try {
    await ensureSqliteTables();
    const [credentials, products, creatives, campaigns, sales] = await Promise.all([
      prisma.apiCredential.findMany({
        where: { provider: { not: 'WIX' } },
      }),
      prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.creative.findMany({ take: 100, orderBy: { createdAt: 'desc' } }),
      prisma.campaign.findMany({ take: 50, orderBy: { lastSyncedAt: 'desc' } }),
      prisma.sale.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
    ]);

    const backupData = {
      version: '1.1',
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
        segment: p.segment === 'WIX_US' ? 'SHOPIFY_US' : p.segment,
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
      creatives: creatives.map((cr) => ({
        id: cr.id,
        productId: cr.productId,
        angle: cr.angle,
        hookEn: cr.hookEn,
        bodyEn: cr.bodyEn,
        ctaEn: cr.ctaEn,
        metaPrimaryText: cr.metaPrimaryText,
        metaHeadline: cr.metaHeadline,
        googleHeadlinesJson: cr.googleHeadlinesJson,
        orderBumpCopyEn: cr.orderBumpCopyEn,
        translationPt: cr.translationPt,
        audioFilePath: cr.audioFilePath,
        videoFilePath: cr.videoFilePath,
        status: cr.status,
      })),
      creativesCount: creatives.length,
      campaignsCount: campaigns.length,
      salesCount: sales.length,
    };

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
    let restoredCreativesCount = 0;

    // Remove qualquer registro antigo da Wix se existir
    await prisma.apiCredential.deleteMany({ where: { provider: 'WIX' } }).catch(() => {});

    // 1. Restaura Credenciais (incluindo Kiwify e Shopify que usam webhookSecret / accountId)
    if (Array.isArray(body.credentials)) {
      for (const cred of body.credentials) {
        if (!cred.provider || cred.provider === 'WIX') continue;
        const hasAnyValue = Boolean(
          cred.apiKey?.trim() ||
            cred.webhookSecret?.trim() ||
            cred.accountId?.trim() ||
            cred.pixelId?.trim() ||
            cred.isVerified
        );
        if (!hasAnyValue) continue;

        const cleanApiKey = (cred.apiKey || cred.webhookSecret || '').trim();
        const defaultAccountName =
          cred.accountName ||
          (cred.provider === 'KIWIFY'
            ? 'Kiwify Global • Webhook Ativo (9.99% + $0.80)'
            : cred.provider === 'SHOPIFY'
            ? cred.accountId
              ? `Shopify US (${cred.accountId})`
              : 'Shopify US • Webhook Ativo (2.9% + $0.30)'
            : `${cred.provider} Ativo`);

        await prisma.apiCredential.upsert({
          where: { provider: cred.provider },
          update: {
            apiKey: cleanApiKey,
            accountId: cred.accountId?.trim() || null,
            pixelId: cred.pixelId?.trim() || null,
            webhookSecret: cred.webhookSecret?.trim() || null,
            accountName: defaultAccountName,
            currency: cred.currency || 'USD',
            isVerified: cred.isVerified ?? true,
            lastTestedAt: new Date(),
          },
          create: {
            provider: cred.provider,
            apiKey: cleanApiKey,
            accountId: cred.accountId?.trim() || null,
            pixelId: cred.pixelId?.trim() || null,
            webhookSecret: cred.webhookSecret?.trim() || null,
            accountName: defaultAccountName,
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
        const cleanSegment = prod.segment === 'WIX_US' ? 'SHOPIFY_US' : prod.segment || 'KIWIFY_GLOBAL';
        const prodId = prod.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await prisma.product.upsert({
          where: { id: prodId },
          update: {
            title: prod.title,
            sourceUrl: prod.sourceUrl || 'manual-entry',
            segment: cleanSegment,
            rawScrapedText: prod.rawScrapedText || prod.title,
            costUsd: prod.costUsd ?? 0,
            priceUsd: prod.priceUsd ?? 37,
            orderBumpUsd: prod.orderBumpUsd ?? 0,
            shippingUsd: prod.shippingUsd ?? 0,
            gatewayFeePercent: prod.gatewayFeePercent ?? 9.99,
            gatewayFeeFixedUsd: prod.gatewayFeeFixedUsd ?? 0.8,
            breakevenCpaUsd: prod.breakevenCpaUsd ?? 30,
            breakevenRoas: prod.breakevenRoas ?? 1.3,
            targetCpaUsd: prod.targetCpaUsd ?? 20,
            avatarProfileJson: prod.avatarProfileJson || '{}',
            painPointsJson: prod.painPointsJson || '[]',
            uniqueMechanism: prod.uniqueMechanism || '',
          },
          create: {
            id: prodId,
            title: prod.title,
            sourceUrl: prod.sourceUrl || 'manual-entry',
            segment: cleanSegment,
            rawScrapedText: prod.rawScrapedText || prod.title,
            costUsd: prod.costUsd ?? 0,
            priceUsd: prod.priceUsd ?? 37,
            orderBumpUsd: prod.orderBumpUsd ?? 0,
            shippingUsd: prod.shippingUsd ?? 0,
            gatewayFeePercent: prod.gatewayFeePercent ?? 9.99,
            gatewayFeeFixedUsd: prod.gatewayFeeFixedUsd ?? 0.8,
            breakevenCpaUsd: prod.breakevenCpaUsd ?? 30,
            breakevenRoas: prod.breakevenRoas ?? 1.3,
            targetCpaUsd: prod.targetCpaUsd ?? 20,
            avatarProfileJson: prod.avatarProfileJson || '{}',
            painPointsJson: prod.painPointsJson || '[]',
            uniqueMechanism: prod.uniqueMechanism || '',
          },
        });
        restoredProductsCount++;
      }
    }

    // 3. Restaura Criativos (se existirem os respectivos produtos)
    if (Array.isArray(body.creatives)) {
      for (const cr of body.creatives) {
        if (!cr.id || !cr.productId || !cr.hookEn) continue;
        const parentExists = await prisma.product.findUnique({ where: { id: cr.productId } });
        if (!parentExists) continue;
        await prisma.creative.upsert({
          where: { id: cr.id },
          update: {
            angle: cr.angle || 'PAS_DIRECT',
            hookEn: cr.hookEn,
            bodyEn: cr.bodyEn || '',
            ctaEn: cr.ctaEn || '',
            metaPrimaryText: cr.metaPrimaryText || '',
            metaHeadline: cr.metaHeadline || '',
            googleHeadlinesJson: cr.googleHeadlinesJson || '[]',
            orderBumpCopyEn: cr.orderBumpCopyEn || '',
            translationPt: cr.translationPt || '',
            audioFilePath: cr.audioFilePath || null,
            videoFilePath: cr.videoFilePath || null,
            status: cr.status || 'GENERATED',
          },
          create: {
            id: cr.id,
            productId: cr.productId,
            angle: cr.angle || 'PAS_DIRECT',
            hookEn: cr.hookEn,
            bodyEn: cr.bodyEn || '',
            ctaEn: cr.ctaEn || '',
            metaPrimaryText: cr.metaPrimaryText || '',
            metaHeadline: cr.metaHeadline || '',
            googleHeadlinesJson: cr.googleHeadlinesJson || '[]',
            orderBumpCopyEn: cr.orderBumpCopyEn || '',
            translationPt: cr.translationPt || '',
            audioFilePath: cr.audioFilePath || null,
            videoFilePath: cr.videoFilePath || null,
            status: cr.status || 'GENERATED',
          },
        });
        restoredCreativesCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backup restaurado com sucesso! ${restoredCredsCount} conexões, ${restoredProductsCount} produtos e ${restoredCreativesCount} criativos restaurados.`,
      restoredCredsCount,
      restoredProductsCount,
      restoredCreativesCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao importar backup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
