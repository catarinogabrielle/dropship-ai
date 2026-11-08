import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';

export async function GET(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const { searchParams } = new URL(req.url);
    const segment = searchParams.get('segment');

    const whereClause =
      segment && segment !== 'ALL' && segment !== 'ADS_SCALE' ? { segment } : undefined;

    const [products, exchange] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          creatives: { orderBy: { createdAt: 'desc' } },
          campaigns: { orderBy: { lastSyncedAt: 'desc' } },
          sales: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      getRealUsdBrlRate(),
    ]);

    return NextResponse.json({ products, exchange });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar produtos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID do produto obrigatorio.' }, { status: 400 });
    }
    await prisma.product.deleteMany({ where: { id } });
    return NextResponse.json({ deleted: true, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir produto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
