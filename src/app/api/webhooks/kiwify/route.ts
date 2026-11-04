import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';
import { MetaAdsService } from '@/services/meta-ads.service';

/**
 * MÓDULO 5: Webhook Receptor Real da Kiwify Internacional (USD)
 * Taxa oficial: 9.99% + US$ 0.80
 * Dispara Server-Side Meta Conversions API (CAPI) com hash SHA-256 do e-mail
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Valida secret se configurado na tabela ApiCredential
    const kiwifyCred = await prisma.apiCredential.findUnique({ where: { provider: 'KIWIFY' } });
    const configuredSecret = kiwifyCred?.webhookSecret || kiwifyCred?.apiKey;
    const incomingSignature =
      req.headers.get('x-kiwify-signature') ||
      payload.signature ||
      payload.webhook_secret ||
      new URL(req.url).searchParams.get('signature');

    if (configuredSecret && incomingSignature && incomingSignature !== configuredSecret) {
      return NextResponse.json({ error: 'Assinatura de Webhook Kiwify invalida.' }, { status: 401 });
    }

    const orderStatus = String(
      payload.order_status || payload.status || payload.Order?.order_status || ''
    ).toLowerCase();

    const externalOrderId = String(
      payload.order_id || payload.id || payload.order_ref || `kwf_${Date.now()}`
    );

    // Extrai valor bruto em USD do payload oficial da Kiwify
    const rawAmountCents = payload.Commissions?.charge_amount || payload.charge_amount;
    const grossUsd =
      payload.amount !== undefined
        ? Number(payload.amount)
        : rawAmountCents !== undefined
        ? Number(rawAmountCents) / 100
        : Number(payload.product_price || 0);

    const customerEmail =
      payload.Customer?.email || payload.customer?.email || payload.customer_email || '';
    const customerCountry =
      payload.Customer?.country || payload.customer?.country || payload.country || 'US';

    const customerEmailHash = customerEmail
      ? crypto.createHash('sha256').update(String(customerEmail).trim().toLowerCase()).digest('hex')
      : null;

    if (orderStatus !== 'paid' && orderStatus !== 'approved') {
      await prisma.automationLog.create({
        data: {
          module: 'WEBHOOK_KIWIFY',
          action: `ORDER_STATUS_${orderStatus.toUpperCase() || 'IGNORED'}`,
          targetId: externalOrderId,
          httpStatus: 200,
          detailsJson: JSON.stringify({ orderStatus, externalOrderId }),
        },
      });
      return NextResponse.json({ received: true, status: orderStatus });
    }

    // Taxa real Kiwify Global: 9.99% + US$ 0.80
    const gatewayFeeUsd = +(grossUsd * 0.0999 + 0.8).toFixed(2);
    const netUsd = +(grossUsd - gatewayFeeUsd).toFixed(2);

    // Cotacao real do Dolar em tempo real
    const exchange = await getRealUsdBrlRate();
    const exchangeRateBrl = exchange.rate;
    const netBrl = +(netUsd * exchangeRateBrl).toFixed(2);

    // Vincula ao produto se productId for informado ou ao produto KIWIFY_GLOBAL cadastrado
    let linkedProductId: string | null = payload.product_id || null;
    if (!linkedProductId) {
      const matchedProduct = await prisma.product.findFirst({
        where: { segment: 'KIWIFY_GLOBAL' },
        orderBy: { createdAt: 'desc' },
      });
      linkedProductId = matchedProduct?.id || null;
    }

    // Dispara Server-Side Meta Conversions API (CAPI)
    let capiSent = false;
    try {
      const metaService = new MetaAdsService();
      const capiRes = await metaService.sendCapiPurchaseEvent({
        orderId: externalOrderId,
        customerEmailHash: customerEmailHash || undefined,
        grossUsd,
        customerCountry,
      });
      capiSent = capiRes.sent;
    } catch {
      capiSent = false;
    }

    const sale = await prisma.sale.upsert({
      where: { externalOrderId },
      update: {
        productId: linkedProductId,
        customerEmailHash,
        customerCountry,
        grossUsd,
        gatewayFeeUsd,
        netUsd,
        exchangeRateBrl,
        netBrl,
        capiSent,
        status: 'PAID',
      },
      create: {
        productId: linkedProductId,
        platform: 'KIWIFY_GLOBAL',
        externalOrderId,
        customerEmailHash,
        customerCountry,
        grossUsd,
        gatewayFeeUsd,
        netUsd,
        exchangeRateBrl,
        netBrl,
        capiSent,
        status: 'PAID',
      },
    });

    await prisma.automationLog.create({
      data: {
        module: 'WEBHOOK_KIWIFY',
        action: 'USD_SALE_RECORDED',
        targetId: sale.id,
        httpStatus: 200,
        detailsJson: JSON.stringify({
          externalOrderId,
          grossUsd,
          gatewayFeeUsd,
          netUsd,
          exchangeRateBrl,
          netBrl,
          capiSent,
        }),
      },
    });

    return NextResponse.json({
      received: true,
      status: 'APPROVED_USD_SALE',
      sale,
      capiDispatched: capiSent,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar webhook Kiwify';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
