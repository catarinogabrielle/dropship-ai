import { NextResponse } from 'next/server';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';
import { ensureAutopilotCronRunning } from '@/services/autopilot-engine';

export async function GET() {
  try {
    await ensureSqliteTables();
    const cronState = ensureAutopilotCronRunning();

    const [
      credentials,
      productsCount,
      creativesCount,
      campaignsCount,
      salesCount,
      salesAgg,
      campaignsAgg,
      recentLogs,
      exchangeData,
    ] = await Promise.all([
      prisma.apiCredential.findMany({ orderBy: { updatedAt: 'desc' } }),
      prisma.product.count(),
      prisma.creative.count(),
      prisma.campaign.count(),
      prisma.sale.count(),
      prisma.sale.aggregate({
        _sum: {
          grossUsd: true,
          gatewayFeeUsd: true,
          netUsd: true,
          netBrl: true,
        },
      }),
      prisma.campaign.aggregate({
        _sum: {
          spendUsd: true,
          revenueUsd: true,
          purchases: true,
          impressions: true,
          clicks: true,
        },
      }),
      prisma.automationLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      getRealUsdBrlRate(),
    ]);

    // Calculo dinamico e 100% real da Barra de Progresso de Ativacao (0% a 100%)
    const step1OpenAiVerified = credentials.some((c) => c.provider === 'OPENAI' && c.isVerified);
    const step2ProductSaved = productsCount > 0;
    const step3CreativeGenerated = creativesCount > 0;
    const step4AdsOrTiktokVerified = credentials.some(
      (c) => (c.provider === 'META_ADS' || c.provider === 'TIKTOK') && c.isVerified
    );
    const step5WebhookAndCronReady =
      cronState.isCronActive &&
      (credentials.some((c) => (c.provider === 'KIWIFY' || c.provider === 'SHOPIFY') && c.isVerified) ||
        salesCount > 0);

    const steps = [
      {
        id: 1,
        weight: 20,
        label: 'Chave OpenAI validada no banco',
        completed: step1OpenAiVerified,
        tabIndex: 0,
      },
      {
        id: 2,
        weight: 20,
        label: 'Produto real extraído e calculado',
        completed: step2ProductSaved,
        tabIndex: 1,
      },
      {
        id: 3,
        weight: 20,
        label: 'Roteiro/Copy em inglês gerado via IA',
        completed: step3CreativeGenerated,
        tabIndex: 2,
      },
      {
        id: 4,
        weight: 20,
        label: 'Meta Ads ou TikTok US autenticado',
        completed: step4AdsOrTiktokVerified,
        tabIndex: 0,
      },
      {
        id: 5,
        weight: 20,
        label: 'Robô Cron ativo e Webhook configurado',
        completed: step5WebhookAndCronReady,
        tabIndex: 5,
      },
    ];

    const progressPercent = steps.reduce((acc, s) => acc + (s.completed ? s.weight : 0), 0);

    return NextResponse.json({
      progressPercent,
      steps,
      cronState,
      exchange: exchangeData,
      counts: {
        products: productsCount,
        creatives: creativesCount,
        campaigns: campaignsCount,
        sales: salesCount,
      },
      financials: {
        grossUsd: salesAgg._sum.grossUsd || 0,
        gatewayFeeUsd: salesAgg._sum.gatewayFeeUsd || 0,
        netUsd: salesAgg._sum.netUsd || 0,
        netBrl: salesAgg._sum.netBrl || 0,
        totalAdSpendUsd: campaignsAgg._sum.spendUsd || 0,
        totalAdRevenueUsd: campaignsAgg._sum.revenueUsd || 0,
        totalAdPurchases: campaignsAgg._sum.purchases || 0,
      },
      credentials,
      recentLogs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno ao consultar status do sistema';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
