import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';
import { generateStructuredJsonWithFallback } from '@/lib/free-ai';
import {
  buildFreeProductFallback,
  GeneratedProductPayload,
} from '@/lib/free-fallbacks';

export const maxDuration = 60;

/**
 * POST /api/products/generate
 * Gera um produto completo real usando IA Gratuita ($0.00) ou GPT-4o (se houver saldo):
 * 1. OpenAI GPT-4o (se chave tiver créditos)
 * 2. Google Gemini 2.5 Flash (Grátis)
 * 3. Groq LLaMA 3.3 70B (Grátis)
 * 4. Cloud IA Sem Chave (OVH Anonymous LLaMA 3.3 / Qwen)
 * 5. Arquiteto Direct-Response Grátis Offline ($0.00 garantido)
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const body = await req.json();
    const {
      mode = 'CREATE_EBOOK', // 'CREATE_EBOOK' | 'AFFILIATE_OFFER' | 'DROPSHIP_PRODUCT'
      niche,
      productIdea: rawProductIdea,
      offerIdea,
      affiliateNetwork = 'ClickBank / Digistore24',
      affiliateLink = '',
      segment = 'KIWIFY_GLOBAL',
      priceUsd = 37,
      costUsd = 0,
      orderBumpUsd = 14,
      shippingUsd = 0,
      monthlyProfitGoalUsd = 3000,
      _vaultCredentials,
    } = body;
    const productIdea = rawProductIdea || offerIdea || '';

    if (!niche && !productIdea) {
      return NextResponse.json(
        { error: 'Escolha um nicho ou descreva o tipo de produto que deseja criar/vender.' },
        { status: 400 }
      );
    }

    const cleanPriceUsd = Number(priceUsd);
    const cleanCostUsd = Number(costUsd || 0);
    const cleanOrderBumpUsd = Number(orderBumpUsd || 0);
    const cleanShippingUsd = Number(shippingUsd || 0);

    const aiResult = await generateStructuredJsonWithFallback<GeneratedProductPayload>({
      vaultCredentials: _vaultCredentials,
      temperature: 0.72,
      maxTokens: 3200,
      validate: (p) => Boolean(p && typeof p.title === 'string' && p.title.trim().length > 2),
      systemPrompt: `You are an elite US Product Creator, Direct-Response Strategist, and Affiliate/Dropshipping Architect.
The user wants to sell in the United States and earn in USD without owning physical inventory (starting with zero upfront budget).
Mode selected: "${mode}".
Return a strict JSON object with the following keys:
{
  "title": "High-converting American English commercial title for the product/offer",
  "titlePt": "Traducao do titulo em portugues do Brasil",
  "uniqueMechanism": "Detailed Unique Mechanism in English (with PT-BR explanation in parentheses)",
  "avatarProfile": {
    "demographics": "US target buyer demographics (Age, gender, income, profile)",
    "psychographics": "Deep desires, fears, daily frustrations",
    "usBuyingTriggers": "Why Americans buy this immediately",
    "orderBumpSuggestionEn": "Specific Order Bump deliverable in English",
    "orderBumpSuggestionPt": "Traducao em portugues do Order Bump",
    "productCreationMode": "${mode}",
    "whereToFindOrHostPt": "Instrucao passo a passo em portugues de como vender de graca (Kiwify Global, Digistore24, ClickBank ou CJ Dropshipping) e iniciar com trafego organico gratuito no TikTok/Reels.",
    "deliverableContentMarkdown": "COMPLETE, detailed, ready-to-use digital product / protocol content in English (at least 600-800 words structured in 5 practical modules/chapters with actionable daily steps and checklists) so the user can download it as their real product deliverable!"
  },
  "painPoints": [
    {
      "painEn": "Pain point #1 in native American English",
      "painPt": "Traducao fiel em portugues da dor #1"
    }
  ]
}
Ensure painPoints has EXACTLY 5 items with painPt written in Portuguese (pt-BR).`,
      userPrompt: `Mode: ${mode}
Niche: ${niche}
Product Idea / Specific Offer: ${productIdea || 'Create the highest-converting US offer in this niche'}
Affiliate Network / Supplier Source: ${affiliateNetwork}
Target Selling Price / Commission in USD: $${cleanPriceUsd}`,
      fallbackBuilder: () =>
        buildFreeProductFallback({
          mode,
          niche: String(niche || ''),
          productIdea: String(productIdea || ''),
          affiliateNetwork,
          segment,
          priceUsd: cleanPriceUsd,
          orderBumpUsd: cleanOrderBumpUsd,
        }),
    });

    const fallbackTemplate = buildFreeProductFallback({
      mode,
      niche: String(niche || ''),
      productIdea: String(productIdea || ''),
      affiliateNetwork,
      segment,
      priceUsd: cleanPriceUsd,
      orderBumpUsd: cleanOrderBumpUsd,
    });

    const parsed = aiResult.data;
    const mergedAvatar = {
      ...fallbackTemplate.avatarProfile,
      ...(parsed.avatarProfile || {}),
      productCreationMode: mode,
      deliverableContentMarkdown:
        parsed.avatarProfile?.deliverableContentMarkdown &&
        parsed.avatarProfile.deliverableContentMarkdown.length > 120
          ? parsed.avatarProfile.deliverableContentMarkdown
          : fallbackTemplate.avatarProfile.deliverableContentMarkdown,
    };
    const mergedPainPoints =
      Array.isArray(parsed.painPoints) && parsed.painPoints.length > 0
        ? parsed.painPoints.slice(0, 5)
        : fallbackTemplate.painPoints;

    const aov = +(cleanPriceUsd + cleanOrderBumpUsd).toFixed(2);

    const feePercent =
      segment === 'KIWIFY_GLOBAL' ? 9.99 : segment === 'TIKTOK_SHOP' ? 6.0 : 2.9;
    const feeFixed =
      segment === 'KIWIFY_GLOBAL' ? 0.8 : segment === 'TIKTOK_SHOP' ? 0.0 : 0.3;

    const gatewayFee =
      mode === 'AFFILIATE_OFFER'
        ? 0
        : +(aov * (feePercent / 100) + feeFixed).toFixed(2);

    const breakevenCpaUsd = +(aov - cleanCostUsd - cleanShippingUsd - gatewayFee).toFixed(2);
    const breakevenRoas = breakevenCpaUsd > 0 ? +(aov / breakevenCpaUsd).toFixed(2) : 9.99;
    const targetCpaUsd = +(breakevenCpaUsd * 0.65).toFixed(2);

    const netMarginAfterTargetCpa = +(breakevenCpaUsd - targetCpaUsd).toFixed(2);
    const goalUsd = Number(monthlyProfitGoalUsd || 3000);
    const requiredMonthlySales =
      netMarginAfterTargetCpa > 0 ? Math.ceil(goalUsd / netMarginAfterTargetCpa) : 0;
    const requiredDailySales = +(requiredMonthlySales / 30).toFixed(1);

    const enrichedAvatarProfile = {
      ...mergedAvatar,
      titlePt: parsed.titlePt || fallbackTemplate.titlePt,
      aiEngineUsed: aiResult.engineUsed,
      unitEconomicsSummary: {
        aovUsd: aov,
        gatewayFeeUsd: gatewayFee,
        grossMarginUsd: breakevenCpaUsd,
        netProfitPerSaleAtTargetCpaUsd: netMarginAfterTargetCpa,
        monthlyProfitGoalUsd: goalUsd,
        requiredDailySales,
        requiredMonthlySales,
      },
    };

    const effectiveSourceUrl =
      affiliateLink && affiliateLink.trim().startsWith('http')
        ? affiliateLink.trim()
        : mode === 'AFFILIATE_OFFER'
        ? 'https://www.digistore24.com/en/home/marketplace'
        : mode === 'DROPSHIP_PRODUCT'
        ? 'https://cjdropshipping.com/'
        : 'https://dashboard.kiwify.com.br/';

    const finalTitle = parsed.title || fallbackTemplate.title;
    const finalMechanism = parsed.uniqueMechanism || fallbackTemplate.uniqueMechanism;

    const rawTextSummary = [
      `GENERATED_MODE: ${mode}`,
      `ENGINE: ${aiResult.engineUsed}`,
      `NICHE: ${niche}`,
      `TITLE: ${finalTitle}`,
      `MECHANISM: ${finalMechanism}`,
      `DELIVERABLE: ${enrichedAvatarProfile.deliverableContentMarkdown || ''}`,
    ]
      .join('\n')
      .slice(0, 14000);

    const product = await prisma.product.create({
      data: {
        title: finalTitle,
        sourceUrl: effectiveSourceUrl,
        segment,
        rawScrapedText: rawTextSummary,
        costUsd: cleanCostUsd,
        priceUsd: cleanPriceUsd,
        orderBumpUsd: cleanOrderBumpUsd,
        shippingUsd: cleanShippingUsd,
        gatewayFeePercent: mode === 'AFFILIATE_OFFER' ? 0 : feePercent,
        gatewayFeeFixedUsd: mode === 'AFFILIATE_OFFER' ? 0 : feeFixed,
        breakevenCpaUsd,
        breakevenRoas,
        targetCpaUsd,
        avatarProfileJson: JSON.stringify(enrichedAvatarProfile),
        painPointsJson: JSON.stringify(mergedPainPoints),
        uniqueMechanism: finalMechanism,
      },
    });

    await prisma.automationLog.create({
      data: {
        module: 'AI_PRODUCT_CREATOR',
        action: `GENERATED_${mode}`,
        targetId: product.id,
        httpStatus: 200,
        detailsJson: JSON.stringify({
          mode,
          niche,
          aiEngineUsed: aiResult.engineUsed,
          isFreeMode: aiResult.isFreeMode,
          title: product.title,
          priceUsd: cleanPriceUsd,
          breakevenCpaUsd,
          targetCpaUsd,
        }),
      },
    });

    const exchange = await getRealUsdBrlRate();

    return NextResponse.json({
      product,
      exchange,
      aiEngineUsed: aiResult.engineUsed,
      isFreeMode: aiResult.isFreeMode,
      fallbackNotice: aiResult.fallbackNotice,
    });
  } catch (error: any) {
    const message =
      error?.response?.data?.error?.message ||
      error.message ||
      'Erro ao gerar produto com Inteligencia Artificial.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
