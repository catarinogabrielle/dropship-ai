import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'Selecione um produto real do banco de dados.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Produto nao encontrado no banco de dados.' }, { status: 404 });
    }

    const cred = await prisma.apiCredential.findUnique({ where: { provider: 'OPENAI' } });
    const apiKey = cred?.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY nao configurada. Valide sua chave na Aba 0.' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a $100M US Direct-Response Copywriter (specialized in Meta Ads, TikTok Shop US, and Google Ads).
Based on the real product data provided, generate 3 complete campaign structures in native American English with a faithful Portuguese (PT-BR) translation for each.
The 3 angles MUST be:
1. "PAS_DIRECT" (Problem - Agitate - Solution)
2. "UGC_STORYTELLING" (Native conversational US TikTok creator review)
3. "SHOCK_HOOK" (Pattern interrupt in the first 3 seconds)

Return a strict JSON object with key "creatives" containing an array of 3 objects:
{
  "creatives": [
    {
      "angle": "PAS_DIRECT" | "UGC_STORYTELLING" | "SHOCK_HOOK",
      "hookEn": "First 3-second verbal/visual hook in American English",
      "bodyEn": "Main video script body (20-35 seconds) in American English",
      "ctaEn": "Direct call to action in American English",
      "metaPrimaryText": "High-converting Facebook/Instagram Ad Primary Text in English",
      "metaHeadline": "Facebook Ad Headline + Short Description in English",
      "googleHeadlines": [
        "Max 30 chars headline 1",
        "Max 30 chars headline 2",
        "Max 30 chars headline 3"
      ],
      "googleDescriptions": [
        "Max 90 chars Google Ads description 1",
        "Max 90 chars Google Ads description 2"
      ],
      "orderBumpCopyEn": "One-click Order Bump checkout box copy in English",
      "translationPt": "Traducao completa e fiel em Portugues (Roteiro + Anuncio Meta + Order Bump) para o operador brasileiro entender cada frase"
    }
  ]
}
CRITICAL RULE: Each string inside googleHeadlines MUST be <= 30 characters. Each string inside googleDescriptions MUST be <= 90 characters.`,
        },
        {
          role: 'user',
          content: `Product Title: ${product.title}
Segment: ${product.segment}
Price USD: $${product.priceUsd} (Order Bump: $${product.orderBumpUsd})
Unique Mechanism: ${product.uniqueMechanism}
Pain Points: ${product.painPointsJson}
Avatar Profile: ${product.avatarProfileJson}
Scraped Excerpt: ${product.rawScrapedText.slice(0, 4000)}`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{"creatives":[]}');
    const items = Array.isArray(parsed.creatives) ? parsed.creatives : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'A OpenAI nao retornou os criativos estruturados. Tente novamente.' },
        { status: 500 }
      );
    }

    const savedCreatives = [];
    for (const item of items) {
      // Garante estritamente o limite de 30 e 90 caracteres do Google Ads
      const headlines = (item.googleHeadlines || []).map((h: string) => String(h).slice(0, 30));
      const descriptions = (item.googleDescriptions || []).map((d: string) => String(d).slice(0, 90));

      const created = await prisma.creative.create({
        data: {
          productId: product.id,
          angle: item.angle || 'PAS_DIRECT',
          hookEn: item.hookEn || '',
          bodyEn: item.bodyEn || '',
          ctaEn: item.ctaEn || '',
          metaPrimaryText: item.metaPrimaryText || '',
          metaHeadline: item.metaHeadline || '',
          googleHeadlinesJson: JSON.stringify({ headlines, descriptions }),
          orderBumpCopyEn: item.orderBumpCopyEn || '',
          translationPt: item.translationPt || '',
          status: 'GENERATED',
        },
        include: { product: true },
      });
      savedCreatives.push(created);
    }

    await prisma.automationLog.create({
      data: {
        module: 'OPENAI_COPYWRITER',
        action: 'GENERATED_3_ANGLES',
        targetId: product.id,
        httpStatus: 200,
        detailsJson: JSON.stringify({
          productTitle: product.title,
          generatedIds: savedCreatives.map((c) => c.id),
        }),
      },
    });

    return NextResponse.json({ creatives: savedCreatives });
  } catch (error: any) {
    const message = error?.response?.data?.error?.message || error.message || 'Erro ao gerar criativos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
