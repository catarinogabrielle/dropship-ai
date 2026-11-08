import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';
import { resolveProviderCredential } from '@/lib/server-vault';

export const maxDuration = 60;

/**
 * POST /api/products/generate
 * Gera um produto completo real via OpenAI (GPT-4o) para quem ainda nao tem produto:
 * - Modo "CREATE_EBOOK": Cria um Infoproduto/Protocolo completo em Ingles (com capitulos prontos para virar PDF na Kiwify Global)
 * - Modo "AFFILIATE_OFFER": Estrutura uma oferta real para promover como Afiliado em Dolar (ClickBank, Digistore24, Kiwify)
 * - Modo "DROPSHIP_PRODUCT": Estrutura uma oferta de Dropshipping Fisico EUA (Zendrop, CJ Dropshipping)
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const body = await req.json();
    const {
      mode = 'CREATE_EBOOK', // 'CREATE_EBOOK' | 'AFFILIATE_OFFER' | 'DROPSHIP_PRODUCT'
      niche,
      productIdea,
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

    if (!niche && !productIdea) {
      return NextResponse.json(
        { error: 'Escolha um nicho ou descreva o tipo de produto que deseja criar/vender.' },
        { status: 400 }
      );
    }

    const { apiKey } = await resolveProviderCredential(
      'OPENAI',
      _vaultCredentials,
      'OPENAI_API_KEY'
    );
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'OPENAI_API_KEY nao configurada. Va ate o Passo 0 (Conexoes & Contas), cole sua chave (sk-...) e clique em "Testar & Salvar".',
        },
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
          content: `You are an elite US Product Creator, Direct-Response Strategist, and Affiliate/Dropshipping Architect.
The user wants to sell in the United States and earn in USD without owning physical inventory.
Mode selected: "${mode}".
Return a strict JSON object with the following keys:
{
  "title": "High-converting American English commercial title for the product/offer",
  "titlePt": "Traducao do titulo em portugues",
  "uniqueMechanism": "Detailed Unique Mechanism in English (with PT-BR explanation in parentheses)",
  "avatarProfile": {
    "demographics": "US target buyer demographics (Age, gender, income, profile)",
    "psychographics": "Deep desires, fears, daily frustrations",
    "usBuyingTriggers": "Why Americans buy this immediately",
    "orderBumpSuggestionEn": "Specific Order Bump deliverable in English",
    "orderBumpSuggestionPt": "Traducao em portugues do Order Bump",
    "productCreationMode": "${mode}",
    "whereToFindOrHostPt": "Instrucao passo a passo em portugues de onde hospedar este produto (Kiwify Global) ou onde pegar o link de afiliado/fornecedor (ClickBank, Digistore24, CJ Dropshipping, Zendrop)",
    "deliverableContentMarkdown": "COMPLETE, detailed, ready-to-use digital product / protocol content in English (at least 600-900 words structured in 5 practical modules/chapters with actionable daily steps, checklists, and sales page summary) so the user can download it as their real product deliverable or sales page!"
  },
  "painPoints": [
    {
      "painEn": "Pain point #1 in native American English",
      "painPt": "Traducao fiel em portugues da dor #1"
    }
  ]
}
Ensure painPoints has EXACTLY 5 items.`,
        },
        {
          role: 'user',
          content: `Mode: ${mode}
Niche: ${niche}
Product Idea / Specific Offer: ${productIdea || 'Create the highest-converting US offer in this niche'}
Affiliate Network / Supplier Source: ${affiliateNetwork}
Target Selling Price / Commission in USD: $${priceUsd}`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');

    const cleanPriceUsd = Number(priceUsd);
    const cleanCostUsd = Number(costUsd || 0);
    const cleanOrderBumpUsd = Number(orderBumpUsd || 0);
    const cleanShippingUsd = Number(shippingUsd || 0);
    const aov = +(cleanPriceUsd + cleanOrderBumpUsd).toFixed(2);

    const feePercent =
      segment === 'KIWIFY_GLOBAL' ? 9.99 : segment === 'TIKTOK_SHOP' ? 6.0 : 2.9;
    const feeFixed =
      segment === 'KIWIFY_GLOBAL' ? 0.8 : segment === 'TIKTOK_SHOP' ? 0.0 : 0.3;

    // Se for Afiliado, o priceUsd informado ja pode ser a comissao liquida ou o preco com taxa
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
      ...(parsed.avatarProfile || {}),
      titlePt: parsed.titlePt || '',
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

    const rawTextSummary = [
      `GENERATED_MODE: ${mode}`,
      `NICHE: ${niche}`,
      `TITLE: ${parsed.title}`,
      `MECHANISM: ${parsed.uniqueMechanism}`,
      `DELIVERABLE: ${parsed.avatarProfile?.deliverableContentMarkdown || ''}`,
    ]
      .join('\n')
      .slice(0, 14000);

    const product = await prisma.product.create({
      data: {
        title: parsed.title || `${niche} US Protocol`,
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
        painPointsJson: JSON.stringify(parsed.painPoints || []),
        uniqueMechanism: parsed.uniqueMechanism || '',
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
          title: product.title,
          priceUsd: cleanPriceUsd,
          breakevenCpaUsd,
          targetCpaUsd,
        }),
      },
    });

    const exchange = await getRealUsdBrlRate();

    return NextResponse.json({ product, exchange });
  } catch (error: any) {
    const message =
      error?.response?.data?.error?.message ||
      error.message ||
      'Erro ao gerar produto com Inteligencia Artificial.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
