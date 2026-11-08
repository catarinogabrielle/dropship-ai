import { prisma, ensureSqliteTables } from '@/lib/prisma';

export interface VaultCredentialInput {
  provider?: string;
  apiKey?: string;
  accountId?: string | null;
  pixelId?: string | null;
  webhookSecret?: string | null;
  accountName?: string | null;
  currency?: string | null;
  isVerified?: boolean;
}

function normalizeCredentialsInput(
  rawVault?: Record<string, VaultCredentialInput> | VaultCredentialInput[] | null
): Array<VaultCredentialInput & { provider: string }> {
  if (!rawVault) return [];

  if (Array.isArray(rawVault)) {
    return rawVault
      .filter((c) => Boolean(c?.provider && c.provider !== 'WIX'))
      .map((c) => ({ ...c, provider: String(c.provider) }));
  }

  if (typeof rawVault === 'object') {
    return Object.entries(rawVault)
      .filter(([provider]) => Boolean(provider && provider !== 'WIX'))
      .map(([provider, item]) => ({
        ...(item || {}),
        provider,
      }));
  }

  return [];
}

/**
 * Hidrata o SQLite da instancia Serverless atual (Vercel /tmp) com as credenciais do cofre enviado na requisicao,
 * garantindo que rotas separadas (generate, ingest, creatives, video, tiktok, ads) sempre enxerguem as chaves salvas.
 */
export async function ensureCredentialsFromVault(
  rawVault?: Record<string, VaultCredentialInput> | VaultCredentialInput[] | null
): Promise<void> {
  await ensureSqliteTables();
  const entries = normalizeCredentialsInput(rawVault);
  if (entries.length === 0) return;

  for (const cred of entries) {
    const cleanApiKey = (cred.apiKey || '').trim();
    const cleanWebhook = (cred.webhookSecret || '').trim();
    const cleanAccountId = (cred.accountId || '').trim();
    const cleanPixelId = (cred.pixelId || '').trim();

    const hasValue = Boolean(
      cleanApiKey || cleanWebhook || cleanAccountId || cleanPixelId || cred.isVerified
    );
    if (!hasValue) continue;

    // Para provedores que exigem API Key (OpenAI, ElevenLabs, TikTok, Meta, Google), nao gravar registro vazio
    const isWebhookOnlyProvider = cred.provider === 'KIWIFY' || cred.provider === 'SHOPIFY';
    const effectiveApiKey = cleanApiKey || (isWebhookOnlyProvider ? cleanWebhook : '');
    if (!isWebhookOnlyProvider && !effectiveApiKey) continue;

    const existing = await prisma.apiCredential
      .findUnique({ where: { provider: cred.provider } })
      .catch(() => null);

    // Se ja existir chave mais completa no banco local e a recebida vier vazia, preserva a existente
    if (existing?.apiKey && !effectiveApiKey) continue;

    await prisma.apiCredential
      .upsert({
        where: { provider: cred.provider },
        update: {
          apiKey: effectiveApiKey || existing?.apiKey || '',
          accountId: cleanAccountId || existing?.accountId || null,
          pixelId: cleanPixelId || existing?.pixelId || null,
          webhookSecret: cleanWebhook || existing?.webhookSecret || null,
          accountName:
            cred.accountName || existing?.accountName || `${cred.provider} Ativo`,
          currency: cred.currency || existing?.currency || 'USD',
          isVerified:
            cred.isVerified !== undefined
              ? cred.isVerified
              : existing?.isVerified ?? true,
          lastTestedAt: new Date(),
        },
        create: {
          provider: cred.provider,
          apiKey: effectiveApiKey,
          accountId: cleanAccountId || null,
          pixelId: cleanPixelId || null,
          webhookSecret: cleanWebhook || null,
          accountName: cred.accountName || `${cred.provider} Ativo`,
          currency: cred.currency || 'USD',
          isVerified: cred.isVerified ?? true,
          lastTestedAt: new Date(),
        },
      })
      .catch(() => {});
  }
}

/**
 * Resolve uma credencial combinando SQLite + _vaultCredentials + Variavel de Ambiente (process.env).
 */
export async function resolveProviderCredential(
  provider: string,
  rawVault?: Record<string, VaultCredentialInput> | VaultCredentialInput[] | null,
  envKeyName?: string
): Promise<{
  apiKey: string;
  accountId: string;
  pixelId: string;
  webhookSecret: string;
}> {
  await ensureCredentialsFromVault(rawVault);

  const dbCred = await prisma.apiCredential
    .findUnique({ where: { provider } })
    .catch(() => null);

  const entries = normalizeCredentialsInput(rawVault);
  const vaultMatch = entries.find((e) => e.provider === provider);

  const envValue = envKeyName ? process.env[envKeyName] || '' : '';

  return {
    apiKey: (dbCred?.apiKey || vaultMatch?.apiKey || envValue || '').trim(),
    accountId: (dbCred?.accountId || vaultMatch?.accountId || '').trim(),
    pixelId: (dbCred?.pixelId || vaultMatch?.pixelId || '').trim(),
    webhookSecret: (dbCred?.webhookSecret || vaultMatch?.webhookSecret || '').trim(),
  };
}

/**
 * Garante que um Product criado em outra Serverless Lambda exista no SQLite da Lambda atual.
 */
export async function ensureProductFromVault(
  productId?: string | null,
  vaultProduct?: any
) {
  await ensureSqliteTables();
  const targetId = productId || vaultProduct?.id;
  if (!targetId) return null;

  const existing = await prisma.product
    .findUnique({ where: { id: targetId } })
    .catch(() => null);
  if (existing) return existing;

  if (!vaultProduct || !vaultProduct.title) return null;

  const cleanSegment =
    vaultProduct.segment === 'WIX_US'
      ? 'SHOPIFY_US'
      : vaultProduct.segment || 'KIWIFY_GLOBAL';

  return prisma.product
    .upsert({
      where: { id: targetId },
      update: {},
      create: {
        id: targetId,
        title: String(vaultProduct.title),
        sourceUrl: String(vaultProduct.sourceUrl || 'https://dashboard.kiwify.com.br/'),
        segment: String(cleanSegment),
        rawScrapedText: String(vaultProduct.rawScrapedText || ''),
        costUsd: Number(vaultProduct.costUsd || 0),
        priceUsd: Number(vaultProduct.priceUsd || 37),
        orderBumpUsd: Number(vaultProduct.orderBumpUsd || 0),
        shippingUsd: Number(vaultProduct.shippingUsd || 0),
        gatewayFeePercent: Number(vaultProduct.gatewayFeePercent ?? 9.99),
        gatewayFeeFixedUsd: Number(vaultProduct.gatewayFeeFixedUsd ?? 0.8),
        breakevenCpaUsd: Number(vaultProduct.breakevenCpaUsd || 0),
        breakevenRoas: Number(vaultProduct.breakevenRoas || 1),
        targetCpaUsd: Number(vaultProduct.targetCpaUsd || 0),
        avatarProfileJson: String(vaultProduct.avatarProfileJson || '{}'),
        painPointsJson: String(vaultProduct.painPointsJson || '[]'),
        uniqueMechanism: String(vaultProduct.uniqueMechanism || ''),
      },
    })
    .catch(() => null);
}

/**
 * Garante que varios produtos do vault existam na Lambda atual (ex.: Robô de Ads / Campanhas).
 */
export async function ensureProductsListFromVault(vaultProducts?: any[]) {
  if (!Array.isArray(vaultProducts) || vaultProducts.length === 0) return;
  for (const prod of vaultProducts) {
    if (prod?.id) {
      await ensureProductFromVault(prod.id, prod);
    }
  }
}

/**
 * Garante que um Creative criado em outra Serverless Lambda exista no SQLite da Lambda atual.
 */
export async function ensureCreativeFromVault(
  creativeId?: string | null,
  vaultCreative?: any,
  vaultProduct?: any
) {
  await ensureSqliteTables();
  const targetId = creativeId || vaultCreative?.id;
  if (!targetId) return null;

  const existing = await prisma.creative
    .findUnique({ where: { id: targetId }, include: { product: true } })
    .catch(() => null);
  if (existing) return existing;

  if (!vaultCreative || !vaultCreative.productId) return null;

  const productData = vaultProduct || vaultCreative.product;
  const ensuredProduct = await ensureProductFromVault(
    vaultCreative.productId,
    productData || {
      id: vaultCreative.productId,
      title: 'US Offer Product',
      segment: 'KIWIFY_GLOBAL',
      priceUsd: 37,
    }
  );
  if (!ensuredProduct) return null;

  return prisma.creative
    .upsert({
      where: { id: targetId },
      update: {},
      create: {
        id: targetId,
        productId: ensuredProduct.id,
        angle: String(vaultCreative.angle || 'PAS_DIRECT'),
        hookEn: String(vaultCreative.hookEn || ''),
        bodyEn: String(vaultCreative.bodyEn || ''),
        ctaEn: String(vaultCreative.ctaEn || ''),
        metaPrimaryText: String(vaultCreative.metaPrimaryText || ''),
        metaHeadline: String(vaultCreative.metaHeadline || ''),
        googleHeadlinesJson: String(vaultCreative.googleHeadlinesJson || '{}'),
        orderBumpCopyEn: String(vaultCreative.orderBumpCopyEn || ''),
        translationPt: String(vaultCreative.translationPt || ''),
        audioFilePath: vaultCreative.audioFilePath || null,
        videoFilePath: vaultCreative.videoFilePath || null,
        tiktokPublishId: vaultCreative.tiktokPublishId || null,
        metaCreativeId: vaultCreative.metaCreativeId || null,
        status: String(vaultCreative.status || 'GENERATED'),
      },
      include: { product: true },
    })
    .catch(() => null);
}
