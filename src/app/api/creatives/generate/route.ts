import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma, ensureSqliteTables } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
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
      temperature: 0.78,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an elite $100M US Direct-Response Creative Director & Voiceover Scriptwriter (specialized in TikTok Shop US, Meta Reels Ads, and YouTube Shorts).

STRICT COPYWRITING & VOICEOVER RULES FOR THE US MARKET:
1. NO AI CLICHÉS: Never use robotic words like "Unlock", "Unleash", "Revolutionize", "Game-changer", "Delve", "Say goodbye to", or "Introducing". Write at a natural 6th-grade American conversational level.
2. OPTIMIZED FOR ELEVENLABS VOICEOVER:
   - Write hookEn, bodyEn, and ctaEn ONLY as spoken words (do NOT put stage directions like [Scene 1] or [Smile] inside hookEn/bodyEn/ctaEn, because ElevenLabs will read them aloud!).
   - Use natural American contractions ("I'm", "didn't", "here's", "you've", "honestly", "literally") and natural punctuation pauses ("...", "—") so the TTS voice breathes and sounds 100% like a real American filming on an iPhone.
   - Total spoken length (hookEn + bodyEn + ctaEn) MUST be 70 to 95 words (~30-38 seconds of spoken audio).
3. THREE DISTINCT HIGH-CONVERTING ANGLES:
   - "PAS_DIRECT": Visceral problem callout -> Agitate why common solutions fail -> Introduce the Unique Mechanism -> Risk-free CTA.
   - "UGC_STORYTELLING": First-person native TikTok confession ("Okay, I wasn't gonna post this, but if you struggle with...") -> Personal discovery -> Results -> CTA.
   - "SHOCK_HOOK": Counter-intuitive pattern interrupt in the first 3 seconds ("Stop doing [common habit] if you want [desired outcome]...") -> Reveal hidden cause -> Solution -> CTA.
4. META ADS PRIMARY TEXT (metaPrimaryText):
   - Must follow the proven US direct-response structure:
     * Scroll-stopping 1st line
     * Short relatable story + Unique Mechanism
     * 3 bullet points with "✅" showing tangible outcomes
     * Social proof + Risk reversal (e.g., 60-Day Guarantee / Fast US Shipping)
     * Clear Call to Action
5. GOOGLE ADS STRICT CHARACTER LIMITS:
   - Each string in "googleHeadlines" MUST be <= 30 characters.
   - Each string in "googleDescriptions" MUST be <= 90 characters.
6. COMPLETE PORTUGUESE GUIDE (translationPt):
   - Provide the full faithful Portuguese translation of the voiceover script AND include a "🎬 DICA VISUAL DE VÍDEO:" telling the Brazilian operator what kind of B-roll/video clip to use as background!

Return a strict JSON object with key "creatives" containing an array of 3 objects:
{
  "creatives": [
    {
      "angle": "PAS_DIRECT" | "UGC_STORYTELLING" | "SHOCK_HOOK",
      "hookEn": "Spoken 3-second hook in natural American English (12-18 words, no brackets)",
      "bodyEn": "Spoken main story/mechanism in natural American English (45-60 words, no brackets)",
      "ctaEn": "Spoken call-to-action in natural American English (12-18 words, no brackets)",
      "metaPrimaryText": "Full multi-paragraph Facebook/Instagram Ad Primary Text in English with ✅ bullets",
      "metaHeadline": "Punchy Facebook Ad Headline in English (5-8 words)",
      "googleHeadlines": [
        "<=30 chars headline 1",
        "<=30 chars headline 2",
        "<=30 chars headline 3"
      ],
      "googleDescriptions": [
        "<=90 chars Google Ads description 1",
        "<=90 chars Google Ads description 2"
      ],
      "orderBumpCopyEn": "High-converting 2-sentence impulse Order Bump checkout copy in English",
      "translationPt": "TRADUÇÃO DO ROTEIRO FALADO: ... \\n\\nTRADUÇÃO DO ANÚNCIO FACEBOOK: ... \\n\\n🎬 QUE VÍDEO USAR DE FUNDO: ..."
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Product Title: ${product.title}
Segment: ${product.segment}
Price USD: $${product.priceUsd} (Order Bump: $${product.orderBumpUsd})
Unique Mechanism: ${product.uniqueMechanism}
Pain Points: ${product.painPointsJson}
Avatar Profile: ${product.avatarProfileJson}
Product Details: ${product.rawScrapedText.slice(0, 4000)}`,
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
