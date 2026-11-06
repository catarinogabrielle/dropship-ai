import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureSqliteTables } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const segment = searchParams.get('segment');

    const creatives = await prisma.creative.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(segment && segment !== 'ALL' && segment !== 'ADS_SCALE'
          ? { product: { segment } }
          : {}),
      },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ creatives });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar criativos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const body = await req.json();
    const {
      id,
      hookEn,
      bodyEn,
      ctaEn,
      metaPrimaryText,
      metaHeadline,
      googleHeadlinesJson,
      orderBumpCopyEn,
      translationPt,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do criativo obrigatorio.' }, { status: 400 });
    }

    const updated = await prisma.creative.update({
      where: { id },
      data: {
        ...(hookEn !== undefined ? { hookEn } : {}),
        ...(bodyEn !== undefined ? { bodyEn } : {}),
        ...(ctaEn !== undefined ? { ctaEn } : {}),
        ...(metaPrimaryText !== undefined ? { metaPrimaryText } : {}),
        ...(metaHeadline !== undefined ? { metaHeadline } : {}),
        ...(googleHeadlinesJson !== undefined ? { googleHeadlinesJson } : {}),
        ...(orderBumpCopyEn !== undefined ? { orderBumpCopyEn } : {}),
        ...(translationPt !== undefined ? { translationPt } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: { product: true },
    });

    await prisma.automationLog.create({
      data: {
        module: 'COPYWRITING_EDITOR',
        action: 'INLINE_SAVE_CREATIVE',
        targetId: updated.id,
        httpStatus: 200,
        detailsJson: JSON.stringify({ angle: updated.angle, productId: updated.productId }),
      },
    });

    return NextResponse.json({ creative: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar criativo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
    }
    await prisma.creative.delete({ where: { id } });
    return NextResponse.json({ deleted: true, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao remover criativo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
