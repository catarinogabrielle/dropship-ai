/**
 * CLIENT-SIDE STORAGE PERSISTENCE & BACKUP SYSTEM
 * Garante que TODAS as credenciais (incluindo Kiwify e Shopify via Webhook Secret / Domínio),
 * produtos e criativos NUNCA sejam perdidos ao fechar o navegador/PWA ou em cold starts da Vercel.
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

export function getStoredProfileName(): string {
  if (typeof window === 'undefined') return 'Gabriel (Operação Principal)';
  return localStorage.getItem(PROFILE_KEY) || 'Gabriel (Operação Principal)';
}

export function saveStoredProfileName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, name);
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
    vault[provider] = {
      ...vault[provider],
      apiKey: data.apiKey !== undefined ? data.apiKey : vault[provider]?.apiKey || '',
      accountId: data.accountId !== undefined ? data.accountId : vault[provider]?.accountId,
      pixelId: data.pixelId !== undefined ? data.pixelId : vault[provider]?.pixelId,
      webhookSecret:
        data.webhookSecret !== undefined ? data.webhookSecret : vault[provider]?.webhookSecret,
      accountName: data.accountName !== undefined ? data.accountName : vault[provider]?.accountName,
      isVerified: data.isVerified !== undefined ? data.isVerified : vault[provider]?.isVerified,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('Erro ao salvar vault local:', err);
  }
}

export function saveProductsToVault(products: any[]): void {
  if (typeof window === 'undefined' || !Array.isArray(products) || products.length === 0) return;
  try {
    const existing = getStoredProductsVault();
    const map = new Map<string, any>();
    for (const p of existing) {
      if (p?.id) map.set(p.id, p);
    }
    for (const p of products) {
      if (p?.id) map.set(p.id, p);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(Array.from(map.values())));
  } catch {
    // ignore quota errors
  }
}

export function getStoredProductsVault(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeProductFromVault(productId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const prods = getStoredProductsVault().filter((p) => p.id !== productId);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods));
    const creats = getStoredCreativesVault().filter((c) => c.productId !== productId);
    localStorage.setItem(CREATIVES_KEY, JSON.stringify(creats));
  } catch {
    // ignore
  }
}

export function saveCreativesToVault(creatives: any[]): void {
  if (typeof window === 'undefined' || !Array.isArray(creatives) || creatives.length === 0) return;
  try {
    const existing = getStoredCreativesVault();
    const map = new Map<string, any>();
    for (const c of existing) {
      if (c?.id) map.set(c.id, c);
    }
    for (const c of creatives) {
      if (c?.id) map.set(c.id, c);
    }
    localStorage.setItem(CREATIVES_KEY, JSON.stringify(Array.from(map.values())));
  } catch {
    // ignore
  }
}

export function getStoredCreativesVault(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CREATIVES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeCreativeFromVault(creativeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const creats = getStoredCreativesVault().filter((c) => c.id !== creativeId);
    localStorage.setItem(CREATIVES_KEY, JSON.stringify(creats));
  } catch {
    // ignore
  }
}

/**
 * Sincroniza TODO o cofre local (Credenciais Kiwify/Shopify/OpenAI/ElevenLabs/Meta/etc + Produtos + Criativos)
 * para o backend em uma única requisição rápida (ideal após fechar/abrir o app ou cold start na Vercel)
 */
export async function syncVaultToBackend(): Promise<{ synced: number }> {
  if (typeof window === 'undefined') return { synced: 0 };
  const vault = getStoredCredentialsVault();
  const products = getStoredProductsVault();
  const creatives = getStoredCreativesVault();

  const credentialsArray = Object.entries(vault)
    .filter(([provider, item]) => {
      if (provider === 'WIX') return false;
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
      apiKey: item.apiKey || '',
      accountId: item.accountId || '',
      pixelId: item.pixelId || '',
      webhookSecret: item.webhookSecret || '',
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
      apiKey: v.apiKey || '',
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

  const backupObject = {
    app: 'US Dollar AI Commerce Autopilot',
    version: '1.1',
    profileName: profile,
    savedAt: new Date().toISOString(),
    localVault: vault,
    credentials: Array.from(mergedCredsMap.values()),
    products:
      Array.isArray(serverData.products) && serverData.products.length > 0
        ? serverData.products
        : localProducts,
    creatives:
      Array.isArray(serverData.creatives) && serverData.creatives.length > 0
        ? serverData.creatives
        : localCreatives,
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

        // 1. Restaura Vault Local (incluindo Kiwify e Shopify)
        if (parsed.localVault && typeof parsed.localVault === 'object') {
          delete parsed.localVault.WIX;
          localStorage.setItem(VAULT_KEY, JSON.stringify(parsed.localVault));
        } else if (Array.isArray(parsed.credentials)) {
          const vault: StoredCredentialsVault = {};
          for (const c of parsed.credentials) {
            if (c.provider && c.provider !== 'WIX') {
              vault[c.provider] = {
                apiKey: c.apiKey || '',
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
