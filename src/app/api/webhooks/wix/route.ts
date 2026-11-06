import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { getRealUsdBrlRate } from '@/lib/exchange';
import { MetaAdsService } from '@/services/meta-ads.service';

/**
 * MÓDULO 5: Webhook Receptor Real para Wix Stores / Wix eCommerce US
 * Taxa oficial Wix Payments US (Cartão de Crédito Online): 2.9% + US$ 0.30
 * Compatível com Wix Automations ("Send via webhook" quando Pedido Pago) e Wix eCommerce Order Webhooks
 * Dispara Server-Side Meta Conversions API (CAPI) com hash SHA-256 do e-mail
 */

/**
 * Health Check via GET para verificação no navegador ou ping de teste da plataforma
 */
export async function GET() {
  try {
    await ensureSqliteTables();
    return NextResponse.json({
      status: 'online',
      active: true,
      platform: 'Wix Stores US (Wix eCommerce)',
      endpoint: '/api/webhooks/wix',
      fee: '2.9% + US$ 0.30',
      readyForSales: true,
      message: 'Webhook Wix Stores US ativo e pronto para receber vendas em Dólar em tempo real!',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro no health check';
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody || '{}');

    // Suporta formato aninhado de Wix Automations (payload.data) ou direto
    const dataObj = payload.data || payload.order || payload;

    // Valida secret se configurado na tabela ApiCredential (provider: WIX)
    const wixCred = await prisma.apiCredential.findUnique({ where: { provider: 'WIX' } });
    const configuredSecret = wixCred?.webhookSecret;
    const incomingSignature =
      req.headers.get('x-wix-signature') ||
      req.headers.get('authorization') ||
      payload.webhook_secret ||
      new URL(req.url).searchParams.get('secret');

    if (
      configuredSecret &&
      incomingSignature &&
      !incomingSignature.includes(configuredSecret) &&
      incomingSignature !== configuredSecret
    ) {
      return NextResponse.json(
        { error: 'Assinatura/Secret de Webhook Wix invalida.' },
        { status: 401 }
      );
    }

    const paymentStatus = String(
      dataObj.paymentStatus ||
        dataObj.payment_status ||
        dataObj.status ||
        payload.status ||
        'PAID'
    ).toUpperCase();

    const externalOrderId = String(
      dataObj.number ||
        dataObj.orderNumber ||
        dataObj.orderId ||
        dataObj.id ||
        `wix_${Date.now()}`
    );

    const grossUsd = Number(
      dataObj.priceSummary?.total?.amount ||
        dataObj.totals?.total ||
        dataObj.totalPrice ||
        dataObj.total_price ||
        dataObj.amount ||
        0
    );

    const customerEmail =
      dataObj.buyerInfo?.email ||
      dataObj.billingInfo?.contactDetails?.email ||
      dataObj.contact?.email ||
      dataObj.email ||
      '';

    const customerCountry =
      dataObj.shippingInfo?.logistics?.shippingDestination?.address?.country ||
      dataObj.billingInfo?.address?.country ||
      dataObj.country ||
      'US';

    const customerEmailHash = customerEmail
      ? crypto
          .createHash('sha256')
          .update(String(customerEmail).trim().toLowerCase())
          .digest('hex')
      : null;

    if (
      paymentStatus !== 'PAID' &&
      paymentStatus !== 'APPROVED' &&
      paymentStatus !== 'FULFILLED'
    ) {
      await prisma.automationLog.create({
        data: {
          module: 'WEBHOOK_WIX',
          action: `ORDER_STATUS_${paymentStatus || 'IGNORED'}`,
          targetId: externalOrderId,
          httpStatus: 200,
          detailsJson: JSON.stringify({ paymentStatus, externalOrderId }),
        },
      });
      return NextResponse.json({ received: true, status: paymentStatus });
    }

    // Taxa real Wix Payments US: 2.9% + US$ 0.30
    const gatewayFeeUsd = +(grossUsd * 0.029 + 0.3).toFixed(2);
    const netUsd = +(grossUsd - gatewayFeeUsd).toFixed(2);

    // Cotacao real do Dolar em tempo real
    const exchange = await getRealUsdBrlRate();
    const exchangeRateBrl = exchange.rate;
    const netBrl = +(netUsd * exchangeRateBrl).toFixed(2);

    let linkedProductId: string | null = dataObj.productId || null;
    if (!linkedProductId) {
      const matchedProduct = await prisma.product.findFirst({
        where: { segment: { in: ['WIX_US', 'SHOPIFY_US'] } },
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
        platform: 'WIX_US',
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
        module: 'WEBHOOK_WIX',
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
    const message = error instanceof Error ? error.message : 'Erro ao processar webhook Wix';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
