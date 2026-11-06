/**
 * CLIENT-SIDE STORAGE PERSISTENCE & BACKUP SYSTEM
 * Garante que os dados do usuário NUNCA sejam perdidos ao fechar o navegador/PWA.
 * Salva automaticamente no LocalStorage e permite salvar/carregar backups em arquivos .JSON no PC.
 */

export interface StoredCredentialsVault {
  [provider: string]: {
    apiKey: string;
    accountId?: string;
    pixelId?: string;
    webhookSecret?: string;
    isVerified?: boolean;
    updatedAt?: string;
  };
}

const VAULT_KEY = 'autopilot_credentials_vault_v1';
const PROFILE_KEY = 'autopilot_user_profile_v1';
const PRODUCTS_KEY = 'autopilot_products_vault_v1';

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
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCredentialToVault(
  provider: string,
  data: {
    apiKey: string;
    accountId?: string;
    pixelId?: string;
    webhookSecret?: string;
    isVerified?: boolean;
  }
): void {
  if (typeof window === 'undefined') return;
  try {
    const vault = getStoredCredentialsVault();
    vault[provider] = {
      ...vault[provider],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('Erro ao salvar vault local:', err);
  }
}

/**
 * Sincroniza o cofre local para o backend (útil após cold starts da Vercel ou abrir o app)
 */
export async function syncVaultToBackend(): Promise<{ synced: number }> {
  if (typeof window === 'undefined') return { synced: 0 };
  const vault = getStoredCredentialsVault();
  const providers = Object.keys(vault);
  if (providers.length === 0) return { synced: 0 };

  let synced = 0;
  for (const provider of providers) {
    const item = vault[provider];
    if (!item?.apiKey) continue;
    try {
      await fetch('/api/settings/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: item.apiKey,
          accountId: item.accountId || '',
          pixelId: item.pixelId || '',
          webhookSecret: item.webhookSecret || '',
        }),
      });
      synced++;
    } catch {
      // Ignora falhas pontuais de rede
    }
  }
  return { synced };
}

/**
 * Exporta todas as credenciais e configurações em arquivo .JSON para o computador do usuário
 */
export async function downloadBackupToFile(profileName?: string): Promise<string> {
  const profile = profileName || getStoredProfileName();
  const vault = getStoredCredentialsVault();

  let serverData: any = {};
  try {
    const res = await fetch('/api/system/backup');
    if (res.ok) {
      serverData = await res.json();
    }
  } catch {
    // Continua com os dados do vault local
  }

  const backupObject = {
    app: 'US Dollar AI Commerce Autopilot',
    version: '1.0',
    profileName: profile,
    savedAt: new Date().toISOString(),
    localVault: vault,
    credentials: serverData.credentials || Object.entries(vault).map(([k, v]) => ({
      provider: k,
      apiKey: v.apiKey,
      accountId: v.accountId,
      pixelId: v.pixelId,
      webhookSecret: v.webhookSecret,
      isVerified: v.isVerified ?? true,
    })),
    products: serverData.products || [],
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

        // 1. Restaura Vault Local
        if (parsed.localVault && typeof parsed.localVault === 'object') {
          localStorage.setItem(VAULT_KEY, JSON.stringify(parsed.localVault));
        } else if (Array.isArray(parsed.credentials)) {
          const vault: StoredCredentialsVault = {};
          for (const c of parsed.credentials) {
            if (c.provider) {
              vault[c.provider] = {
                apiKey: c.apiKey || '',
                accountId: c.accountId,
                pixelId: c.pixelId,
                webhookSecret: c.webhookSecret,
                isVerified: c.isVerified ?? true,
              };
            }
          }
          localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
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
