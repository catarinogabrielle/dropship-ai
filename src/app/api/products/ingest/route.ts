import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';
import { generateStructuredJsonWithFallback } from '@/lib/free-ai';
import { buildFreeProductFallback } from '@/lib/free-fallbacks';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const body = await req.json();
    const {
      sourceUrl,
      segment = 'KIWIFY_GLOBAL',
      costUsd = 0,
      priceUsd,
      orderBumpUsd = 0,
      shippingUsd = 0,
      monthlyProfitGoalUsd = 5000,
      _vaultCredentials,
    } = body;

    if (!sourceUrl || !priceUsd) {
      return NextResponse.json(
        { error: 'URL da pagina do produto (sourceUrl) e Preco em Dolar (priceUsd) sao obrigatorios.' },
        { status: 400 }
      );
    }

    // 1. Download real do HTML da URL usando axios + cheerio (com fallback automatico via Jina Reader)
    let htmlContent = '';
    let fallbackReaderText = '';
    try {
      const pageRes = await axios.get(sourceUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8',
        },
        timeout: 15000,
      });
      htmlContent = typeof pageRes.data === 'string' ? pageRes.data : JSON.stringify(pageRes.data);
    } catch {
      try {
        const jinaRes = await axios.get(`https://r.jina.ai/${sourceUrl}`, {
          timeout: 15000,
        });
        fallbackReaderText =
          typeof jinaRes.data === 'string' ? jinaRes.data : JSON.stringify(jinaRes.data);
      } catch {
        fallbackReaderText = `URL: ${sourceUrl}`;
      }
    }

    const $ = cheerio.load(htmlContent || '<html><body></body></html>');
    $('script, style, noscript, svg, iframe').remove();

    const pageTitle =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('title').first().text().trim() ||
      $('h1').first().text().trim() ||
      'US Offer';

    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      '';

    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt.length > 3 && headings.length < 25) headings.push(txt);
    });

    const bodyText =
      $('body').text().replace(/\s+/g, ' ').trim().slice(0, 12000) ||
      fallbackReaderText.slice(0, 12000);
    const rawScrapedText = [
      `SOURCE_URL: ${sourceUrl}`,
      `TITLE: ${pageTitle}`,
      `META_DESCRIPTION: ${metaDescription}`,
      `HEADINGS: ${headings.join(' | ')}`,
      `CONTENT: ${bodyText}`,
    ]
      .join('\n')
      .slice(0, 14000);

    const cleanPriceUsd = Number(priceUsd);
    const cleanCostUsd = Number(costUsd || 0);
    const cleanOrderBumpUsd = Number(orderBumpUsd || 0);
    const cleanShippingUsd = Number(shippingUsd || 0);

    const inferredMode =
      segment === 'SHOPIFY_US' ? 'DROPSHIP_PRODUCT' : 'AFFILIATE_OFFER';

    const aiResult = await generateStructuredJsonWithFallback<any>({
      vaultCredentials: _vaultCredentials,
      temperature: 0.65,
      maxTokens: 2200,
      validate: (p) => Boolean(p && (p.title || p.uniqueMechanism)),
      systemPrompt: `You are an elite US direct-response e-commerce strategist and copy chief.
Analyze the real scraped product page and return a strict JSON object with the following structure:
{
  "title": "Clean commercial product title in English",
  "avatarProfile": {
    "demographics": "Age range, gender, income level, US location profile",
    "psychographics": "Core desires, daily frustrations, beliefs",
    "usBuyingTriggers": "Why American consumers buy this impulsively",
    "orderBumpSuggestionEn": "Specific high-converting Order Bump / complementary deliverable in English with suggested USD price",
    "orderBumpSuggestionPt": "Traducao em portugues da sugestao de Order Bump"
  },
  "painPoints": [
    {
      "painEn": "Specific pain point #1 in native American English",
      "painPt": "Traducao fiel em portugues da dor #1"
    }
  ],
  "uniqueMechanism": "Detailed explanation of the product's Unique Mechanism in English (with PT-BR summary in parentheses)"
}
Ensure painPoints has EXACTLY 5 real pain points extracted from the product context.`,
      userPrompt: `Source URL: ${sourceUrl}\nSegment: ${segment}\nPrice USD: $${cleanPriceUsd}\nScraped Product Page Content:\n${rawScrapedText.slice(
        0,
        8000
      )}`,
      fallbackBuilder: () => {
        const fb = buildFreeProductFallback({
          mode: inferredMode,
          niche: metaDescription || pageTitle,
          productIdea: pageTitle,
          segment,
          priceUsd: cleanPriceUsd,
          orderBumpUsd: cleanOrderBumpUsd,
        });
        return {
          title: pageTitle !== 'US Offer' ? pageTitle : fb.title,
          avatarProfile: fb.avatarProfile,
          painPoints: fb.painPoints,
          uniqueMechanism: fb.uniqueMechanism,
        };
      },
    });

    const parsed = aiResult.data;

    // Calculo matematico exato dos indicadores financeiros (Unit Economics em USD e BRL)
    const aov = +(cleanPriceUsd + cleanOrderBumpUsd).toFixed(2);

    const feePercent =
      segment === 'KIWIFY_GLOBAL' ? 9.99 : segment === 'TIKTOK_SHOP' ? 6.0 : 2.9;
    const feeFixed =
      segment === 'KIWIFY_GLOBAL' ? 0.8 : segment === 'TIKTOK_SHOP' ? 0.0 : 0.3;

    const gatewayFee = +(aov * (feePercent / 100) + feeFixed).toFixed(2);
    const breakevenCpaUsd = +(aov - cleanCostUsd - cleanShippingUsd - gatewayFee).toFixed(2);
    const breakevenRoas = breakevenCpaUsd > 0 ? +(aov / breakevenCpaUsd).toFixed(2) : 9.99;
    const targetCpaUsd = +(breakevenCpaUsd * 0.65).toFixed(2);

    const netMarginAfterTargetCpa = +(breakevenCpaUsd - targetCpaUsd).toFixed(2);
    const goalUsd = Number(monthlyProfitGoalUsd || 5000);
    const requiredMonthlySales =
      netMarginAfterTargetCpa > 0 ? Math.ceil(goalUsd / netMarginAfterTargetCpa) : 0;
    const requiredDailySales = +(requiredMonthlySales / 30).toFixed(1);

    const enrichedAvatarProfile = {
      ...(parsed.avatarProfile || {}),
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

    const product = await prisma.product.create({
      data: {
        title: parsed.title || pageTitle,
        sourceUrl,
        segment,
        rawScrapedText,
        costUsd: cleanCostUsd,
        priceUsd: cleanPriceUsd,
        orderBumpUsd: cleanOrderBumpUsd,
        shippingUsd: cleanShippingUsd,
        gatewayFeePercent: feePercent,
        gatewayFeeFixedUsd: feeFixed,
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
        module: 'PRODUCT_INGEST',
        action: 'SCRAPE_AND_FREE_AI_ANALYSIS',
        targetId: product.id,
        httpStatus: 200,
        detailsJson: JSON.stringify({
          sourceUrl,
          aiEngineUsed: aiResult.engineUsed,
          isFreeMode: aiResult.isFreeMode,
          title: product.title,
          segment,
          aov,
          breakevenCpaUsd,
          breakevenRoas,
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
    const message = error?.response?.data?.error?.message || error.message || 'Erro ao ingerir produto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
