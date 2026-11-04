import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';
import { MetaAdsService } from '@/services/meta-ads.service';

/**
 * MÓDULO 5: Webhook Receptor Real da Shopify US (Dropshipping Físico EUA)
 * Taxa oficial Shopify Payments US: 2.9% + US$ 0.30
 * Dispara Server-Side Meta Conversions API (CAPI) com hash SHA-256 do e-mail
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody || '{}');

    // Valida assinatura HMAC-SHA256 da Shopify se webhookSecret estiver configurado
    const shopifyCred = await prisma.apiCredential.findUnique({ where: { provider: 'SHOPIFY' } });
    const configuredSecret = shopifyCred?.webhookSecret;
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');

    if (configuredSecret && hmacHeader) {
      const computedHmac = crypto
        .createHmac('sha256', configuredSecret)
        .update(rawBody, 'utf8')
        .digest('base64');
      if (computedHmac !== hmacHeader) {
        return NextResponse.json(
          { error: 'Assinatura HMAC de Webhook Shopify invalida.' },
          { status: 401 }
        );
      }
    }

    const financialStatus = String(
      payload.financial_status || payload.order_status || payload.status || ''
    ).toLowerCase();

    const externalOrderId = String(
      payload.id || payload.order_number || payload.order_id || `shop_${Date.now()}`
    );

    const grossUsd = Number(
      payload.total_price || payload.current_total_price || payload.amount || 0
    );

    const customerEmail =
      payload.email || payload.contact_email || payload.customer?.email || '';
    const customerCountry =
      payload.shipping_address?.country_code ||
      payload.billing_address?.country_code ||
      payload.customer?.default_address?.country_code ||
      'US';

    const customerEmailHash = customerEmail
      ? crypto.createHash('sha256').update(String(customerEmail).trim().toLowerCase()).digest('hex')
      : null;

    if (financialStatus !== 'paid' && financialStatus !== 'approved') {
      await prisma.automationLog.create({
        data: {
          module: 'WEBHOOK_SHOPIFY',
          action: `ORDER_STATUS_${financialStatus.toUpperCase() || 'IGNORED'}`,
          targetId: externalOrderId,
          httpStatus: 200,
          detailsJson: JSON.stringify({ financialStatus, externalOrderId }),
        },
      });
      return NextResponse.json({ received: true, status: financialStatus });
    }

    // Taxa real Shopify US: 2.9% + US$ 0.30
    const gatewayFeeUsd = +(grossUsd * 0.029 + 0.3).toFixed(2);
    const netUsd = +(grossUsd - gatewayFeeUsd).toFixed(2);

    // Cotacao real do Dolar em tempo real
    const exchange = await getRealUsdBrlRate();
    const exchangeRateBrl = exchange.rate;
    const netBrl = +(netUsd * exchangeRateBrl).toFixed(2);

    let linkedProductId: string | null = payload.product_id || null;
    if (!linkedProductId) {
      const matchedProduct = await prisma.product.findFirst({
        where: { segment: 'SHOPIFY_US' },
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
        platform: 'SHOPIFY_US',
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
        module: 'WEBHOOK_SHOPIFY',
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
    const message = error instanceof Error ? error.message : 'Erro ao processar webhook Shopify';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
