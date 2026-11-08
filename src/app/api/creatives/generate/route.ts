import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { ensureProductFromVault } from '@/lib/server-vault';
import { generateStructuredJsonWithFallback } from '@/lib/free-ai';
import {
  buildFreeCreativesFallback,
  CreativeGenerationItem,
} from '@/lib/free-fallbacks';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const { productId, _vaultCredentials, _vaultProduct } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { error: 'Selecione um produto real do banco de dados.' },
        { status: 400 }
      );
    }

    const product = await ensureProductFromVault(productId, _vaultProduct);
    if (!product) {
      return NextResponse.json(
        { error: 'Produto nao encontrado no banco de dados.' },
        { status: 404 }
      );
    }

    let parsedPains: any[] = [];
    try {
      parsedPains = JSON.parse(product.painPointsJson || '[]');
    } catch {
      parsedPains = [];
    }

    const fallbackItems = buildFreeCreativesFallback({
      title: product.title,
      segment: product.segment,
      priceUsd: product.priceUsd,
      orderBumpUsd: product.orderBumpUsd,
      uniqueMechanism: product.uniqueMechanism,
      painPoints: parsedPains,
    });

    const aiResult = await generateStructuredJsonWithFallback<{
      creatives?: CreativeGenerationItem[];
    }>({
      vaultCredentials: _vaultCredentials,
      temperature: 0.78,
      maxTokens: 3200,
      validate: (p) => {
        const arr = Array.isArray(p) ? p : p?.creatives;
        return (
          Array.isArray(arr) &&
          arr.length > 0 &&
          Boolean(arr[0]?.hookEn || arr[0]?.bodyEn)
        );
      },
      systemPrompt: `You are an elite $100M US Direct-Response Creative Director & Voiceover Scriptwriter (specialized in TikTok Shop US, Meta Reels Ads, and YouTube Shorts).

STRICT COPYWRITING & VOICEOVER RULES FOR THE US MARKET:
1. NO AI CLICHÉS: Never use robotic words like "Unlock", "Unleash", "Revolutionize", "Game-changer", "Delve", "Say goodbye to", or "Introducing". Write at a natural 6th-grade American conversational level.
2. OPTIMIZED FOR NEURAL VOICEOVER:
   - Write hookEn, bodyEn, and ctaEn ONLY as spoken words (do NOT put stage directions like [Scene 1] or [Smile] inside hookEn/bodyEn/ctaEn, because TTS voices will read them aloud!).
   - Use natural American contractions ("I'm", "didn't", "here's", "you've", "honestly", "literally") and natural punctuation pauses.
   - Total spoken length (hookEn + bodyEn + ctaEn) MUST be 65 to 95 words (~30 seconds of spoken audio).
3. THREE DISTINCT HIGH-CONVERTING ANGLES:
   - "PAS_DIRECT"
   - "UGC_STORYTELLING"
   - "SHOCK_HOOK"
4. META ADS PRIMARY TEXT (metaPrimaryText): Scroll-stopping 1st line, short mechanism, 3 ✅ bullets, guarantee & CTA.
5. GOOGLE ADS STRICT CHARACTER LIMITS:
   - Each string in "googleHeadlines" <= 30 characters.
   - Each string in "googleDescriptions" <= 90 characters.
6. COMPLETE PORTUGUESE GUIDE (translationPt): Full Portuguese translation AND a "🎬 QUE VÍDEO USAR DE FUNDO:" tip (recommending free Pexels vertical B-roll).

Return a strict JSON object with key "creatives" containing an array of 3 objects:
{
  "creatives": [
    {
      "angle": "PAS_DIRECT" | "UGC_STORYTELLING" | "SHOCK_HOOK",
      "hookEn": "Spoken 3-second hook in natural American English (12-18 words, no brackets)",
      "bodyEn": "Spoken main story/mechanism in natural American English (40-60 words, no brackets)",
      "ctaEn": "Spoken call-to-action in natural American English (12-18 words, no brackets)",
      "metaPrimaryText": "Full Facebook/Instagram Ad Primary Text in English with ✅ bullets",
      "metaHeadline": "Punchy Facebook Ad Headline in English (5-8 words)",
      "googleHeadlines": ["<=30 chars 1", "<=30 chars 2", "<=30 chars 3"],
      "googleDescriptions": ["<=90 chars 1", "<=90 chars 2"],
      "orderBumpCopyEn": "High-converting 2-sentence impulse Order Bump checkout copy in English",
      "translationPt": "TRADUÇÃO DO ROTEIRO FALADO: ... \\n\\n🎬 QUE VÍDEO USAR DE FUNDO: ..."
    }
  ]
}`,
      userPrompt: `Product Title: ${product.title}
Segment: ${product.segment}
Price USD: $${product.priceUsd} (Order Bump: $${product.orderBumpUsd})
Unique Mechanism: ${product.uniqueMechanism}
Pain Points: ${product.painPointsJson}
Avatar Profile: ${product.avatarProfileJson}
Product Details: ${product.rawScrapedText.slice(0, 3200)}`,
      fallbackBuilder: () => ({ creatives: fallbackItems }),
    });

    const rawData = aiResult.data as any;
    const rawArray: any[] = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.creatives)
      ? rawData.creatives
      : fallbackItems;

    // Garante 3 angulos completos mesmo que LLM retorne menos itens
    const normalizedItems = [0, 1, 2].map((idx) => {
      const fb = fallbackItems[idx];
      const item = rawArray[idx] || {};
      return {
        angle: item.angle || fb.angle,
        hookEn: (item.hookEn || fb.hookEn).trim(),
        bodyEn: (item.bodyEn || fb.bodyEn).trim(),
        ctaEn: (item.ctaEn || fb.ctaEn).trim(),
        metaPrimaryText: (item.metaPrimaryText || fb.metaPrimaryText).trim(),
        metaHeadline: (item.metaHeadline || fb.metaHeadline).trim(),
        googleHeadlines: Array.isArray(item.googleHeadlines)
          ? item.googleHeadlines
          : fb.googleHeadlines,
        googleDescriptions: Array.isArray(item.googleDescriptions)
          ? item.googleDescriptions
          : fb.googleDescriptions,
        orderBumpCopyEn: (item.orderBumpCopyEn || fb.orderBumpCopyEn).trim(),
        translationPt: (item.translationPt || fb.translationPt).trim(),
      };
    });

    const savedCreatives = [];
    for (const item of normalizedItems) {
      const headlines = (item.googleHeadlines || []).map((h: string) => String(h).slice(0, 30));
      const descriptions = (item.googleDescriptions || []).map((d: string) =>
        String(d).slice(0, 90)
      );

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
        module: 'FREE_AI_COPYWRITER',
        action: 'GENERATED_3_ANGLES',
        targetId: product.id,
        httpStatus: 200,
        detailsJson: JSON.stringify({
          productTitle: product.title,
          aiEngineUsed: aiResult.engineUsed,
          isFreeMode: aiResult.isFreeMode,
          generatedIds: savedCreatives.map((c) => c.id),
        }),
      },
    });

    return NextResponse.json({
      creatives: savedCreatives,
      aiEngineUsed: aiResult.engineUsed,
      isFreeMode: aiResult.isFreeMode,
      fallbackNotice: aiResult.fallbackNotice,
    });
  } catch (error: any) {
    const message =
      error?.response?.data?.error?.message || error.message || 'Erro ao gerar criativos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
