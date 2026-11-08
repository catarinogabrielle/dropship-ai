import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { MetaAdsService } from '@/services/meta-ads.service';
import {
  ensureCredentialsFromVault,
  ensureProductsListFromVault,
} from '@/lib/server-vault';

export const maxDuration = 60;

export async function GET() {
  try {
    await ensureSqliteTables();
    const [campaigns, logs] = await Promise.all([
      prisma.campaign.findMany({
        include: { product: true },
        orderBy: { lastSyncedAt: 'desc' },
      }),
      prisma.automationLog.findMany({
        where: {
          module: { in: ['META_ADS_SYNC', 'ADS_AUTOPILOT', 'ADS_AUTOPILOT_CRON', 'BULLMQ_WORKER'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    return NextResponse.json({ campaigns, logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao consultar campanhas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const body = await req.json().catch(() => ({}));
    const { productId, _vaultCredentials, _vaultProducts } = body;

    await ensureCredentialsFromVault(_vaultCredentials);
    await ensureProductsListFromVault(_vaultProducts);

    const metaService = new MetaAdsService();
    const syncedCampaigns = await metaService.syncAllAdSets(productId);

    const campaigns = await prisma.campaign.findMany({
      include: { product: true },
      orderBy: { lastSyncedAt: 'desc' },
    });

    return NextResponse.json({
      syncedCount: syncedCampaigns.length,
      campaigns,
    });
  } catch (error: any) {
    const errDetails = error?.response?.data || { message: error.message };
    const rawMsg = String(
      errDetails?.error?.message ||
        errDetails?.message ||
        error.message ||
        'Erro ao sincronizar campanhas da Meta Ads'
    );
    const isTokenExpired =
      errDetails?.error?.code === 190 ||
      /session has expired|validating access token|token.*expired|oauth/i.test(rawMsg);

    if (isTokenExpired) {
      await prisma.apiCredential
        .updateMany({
          where: { provider: 'META_ADS' },
          data: { isVerified: false },
        })
        .catch(() => {});
    }

    await prisma.automationLog.create({
      data: {
        module: 'META_ADS_SYNC',
        action: isTokenExpired ? 'TOKEN_EXPIRED' : 'SYNC_FAILED',
        httpStatus: error?.response?.status || 400,
        detailsJson: JSON.stringify(errDetails),
      },
    });

    const friendlyError = isTokenExpired
      ? 'Seu Token temporário do Facebook Ads expirou (tokens criados no Graph Explorer duram apenas 1 a 2 horas). Se você está começando no Modo Grátis (R$ 0,00), não precisa usar esta aba — pule direto para a Aba 5! Caso queira sincronizar anúncios pagos, desconecte o token expirado abaixo ou gere um novo na Aba 0.'
      : rawMsg;

    return NextResponse.json(
      {
        error: friendlyError,
        rawMetaError: rawMsg,
        tokenExpired: isTokenExpired,
      },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const { campaignId, productId, status, _vaultCredentials, _vaultProducts } = await req.json();
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId obrigatorio' }, { status: 400 });
    }

    await ensureCredentialsFromVault(_vaultCredentials);
    await ensureProductsListFromVault(_vaultProducts);

    const existing = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!existing) {
      return NextResponse.json({ error: 'Campanha nao encontrada' }, { status: 404 });
    }

    // Se o usuario alternou o status (ACTIVE/PAUSED), atualiza tambem na Meta Graph API se conectada
    if (status && (status === 'ACTIVE' || status === 'PAUSED')) {
      try {
        const metaService = new MetaAdsService();
        await metaService.updateAdSetBudgetOrStatus(existing.externalAdSetId, { status });
      } catch {
        // Prossegue com atualizacao local caso seja campanha offline/outra plataforma
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(productId !== undefined ? { productId: productId || null } : {}),
        ...(status ? { status, lastSyncedAt: new Date() } : {}),
      },
      include: { product: true },
    });
    return NextResponse.json({ campaign: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar campanha';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
