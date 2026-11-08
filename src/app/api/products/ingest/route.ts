import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';
import { resolveProviderCredential } from '@/lib/server-vault';

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

    // 1. Download real do HTML da URL usando axios + cheerio (com fallback automatico via Jina Reader para paginas com Cloudflare/anti-bot)
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

    // 2. Obtem a chave real da OpenAI do banco, cofre sincronizado ou .env
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

    // 3. Chama a API oficial da OpenAI (gpt-4o, json_object) para estruturar Avatar, 5 Dores, Mecanismo Unico e Order Bump
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an elite US direct-response e-commerce strategist and copy chief.
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
        },
        {
          role: 'user',
          content: `Source URL: ${sourceUrl}\nSegment: ${segment}\nPrice USD: $${priceUsd}\nScraped Product Page Content:\n${rawScrapedText}`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');

    // 4. Calculo matematico exato dos indicadores financeiros (Unit Economics em USD e BRL)
    const cleanPriceUsd = Number(priceUsd);
    const cleanCostUsd = Number(costUsd || 0);
    const cleanOrderBumpUsd = Number(orderBumpUsd || 0);
    const cleanShippingUsd = Number(shippingUsd || 0);
    const aov = +(cleanPriceUsd + cleanOrderBumpUsd).toFixed(2);

    // Taxas reais por segmento:
    // Kiwify Internacional: 9.99% + $0.80
    // Dropshipping Fisico EUA (Shopify US): 2.9% + $0.30
    // TikTok Shop US: 6.0% + $0.00
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
        action: 'SCRAPE_AND_OPENAI_ANALYSIS',
        targetId: product.id,
        httpStatus: 200,
        detailsJson: JSON.stringify({
          sourceUrl,
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

    return NextResponse.json({ product, exchange });
  } catch (error: any) {
    const message = error?.response?.data?.error?.message || error.message || 'Erro ao ingerir produto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
