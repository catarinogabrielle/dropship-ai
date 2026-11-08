/**
 * CLIENT-SIDE STORAGE PERSISTENCE & BACKUP SYSTEM
 * Garante que TODAS as credenciais (OpenAI, ElevenLabs, Kiwify, Shopify, Meta Ads, Google Ads, TikTok),
 * produtos e criativos NUNCA sejam perdidos ao fechar o navegador/PWA ou entre Serverless Lambdas na Vercel.
 */

export interface StoredCredentialsVault {
  [provider: string]: {
    apiKey: string;
    accountId?: string;
    pixelId?: string;
    webhookSecret?: string;
    accountName?: string;
    isVerified?: boolean;
    updatedAt?: string;
  };
}

const VAULT_KEY = 'autopilot_credentials_vault_v1';
const PROFILE_KEY = 'autopilot_user_profile_v1';
const PRODUCTS_KEY = 'autopilot_products_vault_v1';
const CREATIVES_KEY = 'autopilot_creatives_vault_v1';
const DELETED_PRODUCTS_KEY = 'autopilot_deleted_products_v1';
const DELETED_CREATIVES_KEY = 'autopilot_deleted_creatives_v1';

export function getStoredProfileName(): string {
  if (typeof window === 'undefined') return 'Gabriel (Operação Principal)';
  return localStorage.getItem(PROFILE_KEY) || 'Gabriel (Operação Principal)';
}

export function saveStoredProfileName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, name);
}

export function getDeletedProductIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getDeletedCreativeIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_CREATIVES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getStoredCredentialsVault(): StoredCredentialsVault {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    const parsed: StoredCredentialsVault = raw ? JSON.parse(raw) : {};
    if (parsed.WIX) {
      delete parsed.WIX;
      localStorage.setItem(VAULT_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return {};
  }
}

export function saveCredentialToVault(
  provider: string,
  data: {
    apiKey?: string;
    accountId?: string;
    pixelId?: string;
    webhookSecret?: string;
    accountName?: string;
    isVerified?: boolean;
  }
): void {
  if (typeof window === 'undefined' || provider === 'WIX') return;
  try {
    const vault = getStoredCredentialsVault();
    const prev = vault[provider];

    const nextApiKey =
      data.apiKey !== undefined ? data.apiKey.trim() : (prev?.apiKey || '').trim();
    const nextAccountId =
      data.accountId !== undefined ? data.accountId.trim() : prev?.accountId;
    const nextPixelId =
      data.pixelId !== undefined ? data.pixelId.trim() : prev?.pixelId;
    const nextWebhookSecret =
      data.webhookSecret !== undefined
        ? data.webhookSecret.trim()
        : prev?.webhookSecret;

    vault[provider] = {
      ...prev,
      apiKey: nextApiKey || prev?.apiKey || '',
      accountId: nextAccountId !== undefined ? nextAccountId : prev?.accountId,
      pixelId: nextPixelId !== undefined ? nextPixelId : prev?.pixelId,
      webhookSecret:
        nextWebhookSecret !== undefined ? nextWebhookSecret : prev?.webhookSecret,
      accountName: data.accountName !== undefined ? data.accountName : prev?.accountName,
      isVerified: data.isVerified !== undefined ? data.isVerified : prev?.isVerified,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('Erro ao salvar vault local:', err);
  }
}

export function removeCredentialFromVault(provider: string): void {
  if (typeof window === 'undefined') return;
  try {
    const vault = getStoredCredentialsVault();
    if (vault[provider]) {
      delete vault[provider];
      localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    }
  } catch {
    // ignore
  }
}

/**
 * Retorna um pacote leve e limpo com todas as credenciais salvas/digitadas no cofre local
 * para hidratar qualquer rota Serverless (/api/products/generate, /api/creatives/generate, /api/video/render, etc.)
 */
export function getClientCredentialsPayload(): Record<
  string,
  {
    apiKey: string;
    accountId?: string;
    pixelId?: string;
    webhookSecret?: string;
    accountName?: string;
    isVerified?: boolean;
  }
> {
  const vault = getStoredCredentialsVault();
  const payload: Record<string, any> = {};

  for (const [provider, item] of Object.entries(vault)) {
    if (provider === 'WIX' || !item) continue;
    const apiKey = (item.apiKey || '').trim();
    const webhookSecret = (item.webhookSecret || '').trim();
    const accountId = (item.accountId || '').trim();
    const pixelId = (item.pixelId || '').trim();

    if (apiKey || webhookSecret || accountId || pixelId || item.isVerified) {
      payload[provider] = {
        apiKey,
        accountId: accountId || undefined,
        pixelId: pixelId || undefined,
        webhookSecret: webhookSecret || undefined,
        accountName: item.accountName,
        isVerified: item.isVerified ?? false,
      };
    }
  }

  return payload;
}

export function saveProductsToVault(products: any[]): void {
  if (typeof window === 'undefined' || !Array.isArray(products) || products.length === 0) return;
  try {
    const deleted = new Set(getDeletedProductIds());
    const existing = getStoredProductsVault();
    const map = new Map<string, any>();
    for (const p of existing) {
      if (p?.id && !deleted.has(p.id)) map.set(p.id, p);
    }
    for (const p of products) {
      if (p?.id) {
        deleted.delete(p.id);
        map.set(p.id, {
          ...p,
          creatives: undefined,
          campaigns: undefined,
          sales: undefined,
        });
      }
    }
    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(deleted)));
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(Array.from(map.values())));
  } catch {
    // ignore quota errors
  }
}

export function getStoredProductsVault(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const deleted = new Set(getDeletedProductIds());
    return Array.isArray(list) ? list.filter((p) => p?.id && !deleted.has(p.id)) : [];
  } catch {
    return [];
  }
}

export function removeProductFromVault(productId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const deletedProds = new Set(getDeletedProductIds());
    deletedProds.add(productId);
    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(deletedProds)));

    const prods = getStoredProductsVault().filter((p) => p.id !== productId);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods));

    const creats = getStoredCreativesVault();
    const deletedCreats = new Set(getDeletedCreativeIds());
    for (const c of creats) {
      if (c.productId === productId && c.id) deletedCreats.add(c.id);
    }
    localStorage.setItem(DELETED_CREATIVES_KEY, JSON.stringify(Array.from(deletedCreats)));
    localStorage.setItem(
      CREATIVES_KEY,
      JSON.stringify(creats.filter((c) => c.productId !== productId))
    );
  } catch {
    // ignore
  }
}

function compactCreativeForStorage(c: any): any {
  const safeAudio =
    typeof c.audioFilePath === 'string' &&
    c.audioFilePath.startsWith('data:') &&
    c.audioFilePath.length > 600_000
      ? null
      : c.audioFilePath || null;

  const safeVideo =
    typeof c.videoFilePath === 'string' &&
    c.videoFilePath.startsWith('data:') &&
    c.videoFilePath.length > 250_000
      ? null
      : c.videoFilePath || null;

  return {
    ...c,
    audioFilePath: safeAudio,
    videoFilePath: safeVideo,
    product: c.product
      ? {
          id: c.product.id,
          title: c.product.title,
          segment: c.product.segment,
          priceUsd: c.product.priceUsd,
        }
      : undefined,
  };
}

export function saveCreativesToVault(creatives: any[]): void {
  if (typeof window === 'undefined' || !Array.isArray(creatives) || creatives.length === 0) return;
  try {
    const deleted = new Set(getDeletedCreativeIds());
    const existing = getStoredCreativesVault();
    const map = new Map<string, any>();
    for (const c of existing) {
      if (c?.id && !deleted.has(c.id)) map.set(c.id, c);
    }
    for (const c of creatives) {
      if (c?.id) {
        deleted.delete(c.id);
        map.set(c.id, compactCreativeForStorage(c));
      }
    }
    localStorage.setItem(DELETED_CREATIVES_KEY, JSON.stringify(Array.from(deleted)));
    localStorage.setItem(CREATIVES_KEY, JSON.stringify(Array.from(map.values())));
  } catch {
    // Fallback mais enxuto se o navegador estiver quase sem cota no localStorage
    try {
      const stripped = creatives.map((c) => ({
        ...compactCreativeForStorage(c),
        audioFilePath: null,
        videoFilePath: null,
      }));
      localStorage.setItem(CREATIVES_KEY, JSON.stringify(stripped));
    } catch {
      // ignore
    }
  }
}

export function getStoredCreativesVault(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CREATIVES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const deleted = new Set(getDeletedCreativeIds());
    return Array.isArray(list) ? list.filter((c) => c?.id && !deleted.has(c.id)) : [];
  } catch {
    return [];
  }
}

export function removeCreativeFromVault(creativeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const deleted = new Set(getDeletedCreativeIds());
    deleted.add(creativeId);
    localStorage.setItem(DELETED_CREATIVES_KEY, JSON.stringify(Array.from(deleted)));

    const creats = getStoredCreativesVault().filter((c) => c.id !== creativeId);
    localStorage.setItem(CREATIVES_KEY, JSON.stringify(creats));
  } catch {
    // ignore
  }
}

/**
 * Sincroniza TODO o cofre local para /api/system/backup na abertura do app
 */
export async function syncVaultToBackend(): Promise<{ synced: number }> {
  if (typeof window === 'undefined') return { synced: 0 };
  const vault = getStoredCredentialsVault();
  const products = getStoredProductsVault();
  const creatives = getStoredCreativesVault();

  const credentialsArray = Object.entries(vault)
    .filter(([provider, item]) => {
      if (provider === 'WIX') return false;
      const isWebhookOnly = provider === 'KIWIFY' || provider === 'SHOPIFY';
      if (!isWebhookOnly) {
        return Boolean(item?.apiKey?.trim());
      }
      return Boolean(
        item?.apiKey?.trim() ||
          item?.webhookSecret?.trim() ||
          item?.accountId?.trim() ||
          item?.pixelId?.trim() ||
          item?.isVerified
      );
    })
    .map(([provider, item]) => ({
      provider,
      apiKey: (item.apiKey || '').trim(),
      accountId: (item.accountId || '').trim(),
      pixelId: (item.pixelId || '').trim(),
      webhookSecret: (item.webhookSecret || '').trim(),
      accountName: item.accountName,
      isVerified:
        item.isVerified !== undefined
          ? item.isVerified
          : provider === 'KIWIFY' || provider === 'SHOPIFY',
    }));

  if (credentialsArray.length === 0 && products.length === 0 && creatives.length === 0) {
    return { synced: 0 };
  }

  try {
    const res = await fetch('/api/system/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentials: credentialsArray,
        products,
        creatives,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return { synced: (data.restoredCredsCount || 0) + (data.restoredProductsCount || 0) };
    }
  } catch {
    // Ignora falhas pontuais de rede
  }

  return { synced: 0 };
}

/**
 * Exporta todas as credenciais, produtos e criativos em arquivo .JSON para o computador do usuário
 */
export async function downloadBackupToFile(profileName?: string): Promise<string> {
  const profile = profileName || getStoredProfileName();
  const vault = getStoredCredentialsVault();
  const localProducts = getStoredProductsVault();
  const localCreatives = getStoredCreativesVault();

  let serverData: any = {};
  try {
    const res = await fetch('/api/system/backup');
    if (res.ok) {
      serverData = await res.json();
    }
  } catch {
    // Continua com os dados do vault local
  }

  const vaultCredentials = Object.entries(vault)
    .filter(
      ([k, v]) =>
        k !== 'WIX' &&
        Boolean(v?.apiKey || v?.webhookSecret || v?.accountId || v?.pixelId || v?.isVerified)
    )
    .map(([k, v]) => ({
      provider: k,
      apiKey: (v.apiKey || '').trim(),
      accountId: v.accountId,
      pixelId: v.pixelId,
      webhookSecret: v.webhookSecret,
      accountName: v.accountName,
      isVerified: v.isVerified ?? true,
    }));

  const mergedCredsMap = new Map<string, any>();
  for (const c of vaultCredentials) mergedCredsMap.set(c.provider, c);
  if (Array.isArray(serverData.credentials)) {
    for (const c of serverData.credentials) {
      if (c.provider && c.provider !== 'WIX') mergedCredsMap.set(c.provider, c);
    }
  }

  const mergedProductsMap = new Map<string, any>();
  for (const p of localProducts) {
    if (p?.id) mergedProductsMap.set(p.id, p);
  }
  if (Array.isArray(serverData.products)) {
    for (const p of serverData.products) {
      if (p?.id) mergedProductsMap.set(p.id, p);
    }
  }

  const mergedCreativesMap = new Map<string, any>();
  for (const c of localCreatives) {
    if (c?.id) mergedCreativesMap.set(c.id, c);
  }
  if (Array.isArray(serverData.creatives)) {
    for (const c of serverData.creatives) {
      if (c?.id) mergedCreativesMap.set(c.id, c);
    }
  }

  const backupObject = {
    app: 'US Dollar AI Commerce Autopilot',
    version: '1.2',
    profileName: profile,
    savedAt: new Date().toISOString(),
    localVault: vault,
    credentials: Array.from(mergedCredsMap.values()),
    products: Array.from(mergedProductsMap.values()),
    creatives: Array.from(mergedCreativesMap.values()),
  };

  const jsonString = JSON.stringify(backupObject, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const cleanDate = new Date().toISOString().slice(0, 10);
  const filename = `dropship_ai_backup_${profile.replace(/\s+/g, '_').toLowerCase()}_${cleanDate}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Restaura o backup a partir de um arquivo .JSON selecionado no computador do usuário
 */
export async function restoreBackupFromFile(file: File): Promise<{
  success: boolean;
  message: string;
  profileName?: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Arquivo de backup inválido ou ilegível.');
        }

        // Limpa marcações de excluídos ao restaurar backup explícito
        localStorage.removeItem(DELETED_PRODUCTS_KEY);
        localStorage.removeItem(DELETED_CREATIVES_KEY);

        // 1. Restaura Vault Local (incluindo Kiwify e Shopify)
        if (parsed.localVault && typeof parsed.localVault === 'object') {
          delete parsed.localVault.WIX;
          localStorage.setItem(VAULT_KEY, JSON.stringify(parsed.localVault));
        } else if (Array.isArray(parsed.credentials)) {
          const vault: StoredCredentialsVault = {};
          for (const c of parsed.credentials) {
            if (c.provider && c.provider !== 'WIX') {
              vault[c.provider] = {
                apiKey: (c.apiKey || '').trim(),
                accountId: c.accountId,
                pixelId: c.pixelId,
                webhookSecret: c.webhookSecret,
                accountName: c.accountName,
                isVerified: c.isVerified ?? true,
              };
            }
          }
          localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
        }

        if (Array.isArray(parsed.products)) {
          saveProductsToVault(parsed.products);
        }
        if (Array.isArray(parsed.creatives)) {
          saveCreativesToVault(parsed.creatives);
        }

        // 2. Restaura Perfil
        if (parsed.profileName) {
          saveStoredProfileName(parsed.profileName);
        }

        // 3. Envia para o backend para persistir no SQLite
        const res = await fetch('/api/system/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });

        const data = await res.json();
        resolve({
          success: true,
          message: data.message || 'Backup restaurado com sucesso no seu computador!',
          profileName: parsed.profileName,
        });
      } catch (err: any) {
        resolve({
          success: false,
          message: err?.message || 'Falha ao restaurar backup.',
        });
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo do computador.'));
    reader.readAsText(file);
  });
}
