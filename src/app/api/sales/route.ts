import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';

export async function GET(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const { searchParams } = new URL(req.url);
    const segment = searchParams.get('segment');

    const whereClause =
      segment && segment !== 'ALL' && segment !== 'ADS_SCALE'
        ? { platform: segment }
        : undefined;

    const [sales, aggregate, exchange, webhookLogs] = await Promise.all([
      prisma.sale.findMany({
        where: whereClause,
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.aggregate({
        where: whereClause,
        _sum: {
          grossUsd: true,
          gatewayFeeUsd: true,
          netUsd: true,
          netBrl: true,
        },
        _count: {
          id: true,
        },
      }),
      getRealUsdBrlRate(),
      prisma.automationLog.findMany({
        where: {
          module: { in: ['WEBHOOK_KIWIFY', 'WEBHOOK_SHOPIFY', 'WEBHOOK_WIX', 'META_CAPI'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    return NextResponse.json({
      sales,
      summary: {
        count: aggregate._count.id || 0,
        grossUsd: +(aggregate._sum.grossUsd || 0).toFixed(2),
        gatewayFeeUsd: +(aggregate._sum.gatewayFeeUsd || 0).toFixed(2),
        netUsd: +(aggregate._sum.netUsd || 0).toFixed(2),
        netBrl: +(aggregate._sum.netBrl || 0).toFixed(2),
        liveConvertedNetBrl: +((aggregate._sum.netUsd || 0) * exchange.rate).toFixed(2),
      },
      exchange,
      webhookLogs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao consultar vendas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
