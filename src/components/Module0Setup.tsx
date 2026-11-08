'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  AlertCircle,
  Sparkles,
  Volume2,
  Video,
  Megaphone,
  ShoppingBag,
  Globe,
  BookOpen,
  Eye,
  EyeOff,
  Copy,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  HardDrive,
  FolderDown,
  FolderUp,
  User,
  Shield,
  Save,
  Zap,
  Trash2,
  Cpu,
} from 'lucide-react';
import { ApiCredentialData } from '@/types/autopilot';
import {
  StoredCredentialsVault,
  getStoredCredentialsVault,
  saveCredentialToVault,
  removeCredentialFromVault,
  getStoredProfileName,
  saveStoredProfileName,
  downloadBackupToFile,
  restoreBackupFromFile,
  syncVaultToBackend,
} from '@/lib/storage-persistence';

interface Module0SetupProps {
  credentials: ApiCredentialData[];
  onRefresh: () => Promise<void>;
  onNavigateTab?: (tab: number) => void;
}

interface ProviderConfig {
  provider: string;
  title: string;
  tag: string;
  isEssential: boolean;
  isFreeHighlight?: boolean;
  shortDesc: string;
  docsUrl: string;
  docsLabel: string;
  stepByStepTutorial: string[];
  webhookEndpointPath?: string;
  fields: {
    apiKeyLabel?: string;
    apiKeyPlaceholder?: string;
    accountIdLabel?: string;
    accountIdPlaceholder?: string;
    pixelIdLabel?: string;
    pixelIdPlaceholder?: string;
    webhookSecretLabel?: string;
    webhookSecretPlaceholder?: string;
  };
  icon: React.ReactNode;
}

const PROVIDERS: ProviderConfig[] = [
  {
    provider: 'GEMINI',
    title: 'Google Gemini 2.5 Flash (Recomendado)',
    tag: '100% Grátis • Sem Cartão',
    isEssential: false,
    isFreeHighlight: true,
    shortDesc: 'IA oficial do Google com plano gratuito sem precisar de cartão. Deixa a geração de E-books e Copys muito mais rápida e inteligente.',
    docsUrl: 'https://aistudio.google.com/apikey',
    docsLabel: 'Pegar Chave Grátis (Google AI)',
    stepByStepTutorial: [
      '1. Clique em "Pegar Chave Grátis (Google AI)" acima e entre com sua conta Gmail normal.',
      '2. Clique no botão azul "Create API key" (Criar chave de API) — NÃO pede cartão de crédito.',
      '3. Copie a chave (começa com AIza...) e cole aqui embaixo para liberar IA rápida do Google sem pagar nada!',
    ],
    fields: {
      apiKeyLabel: 'Chave Gratuita Google Gemini (Opcional)',
      apiKeyPlaceholder: 'AIzaSy...',
    },
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
  },
  {
    provider: 'GROQ',
    title: 'Groq LLaMA 3.3 70B (Ultra Rápida)',
    tag: '100% Grátis • Sem Cartão',
    isEssential: false,
    isFreeHighlight: true,
    shortDesc: 'Outra opção 100% gratuita sem cartão de crédito para gerar roteiros em inglês e produtos digitais em 2 segundos.',
    docsUrl: 'https://console.groq.com/keys',
    docsLabel: 'Pegar Chave Grátis (Groq)',
    stepByStepTutorial: [
      '1. Acesse console.groq.com/keys e entre com sua conta Google ou e-mail (gratuito, sem cartão).',
      '2. Clique em "Create API Key", dê um nome qualquer e copie o código (começa com gsk_...).',
      '3. Cole no campo abaixo e clique em "Testar & Salvar".',
    ],
    fields: {
      apiKeyLabel: 'Chave Gratuita Groq (Opcional)',
      apiKeyPlaceholder: 'gsk_...',
    },
    icon: <Cpu className="w-5 h-5 text-cyan-400" />,
  },
  {
    provider: 'OPENAI',
    title: 'OpenAI (GPT-4o) — Opcional / Paga',
    tag: 'Opcional • Só se tiver saldo',
    isEssential: false,
    shortDesc: 'Se sua conta estiver sem créditos (erro 429), NÃO precisa pagar agora: o sistema pula automaticamente para a IA Gratuita ($0,00)!',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'Abrir OpenAI',
    stepByStepTutorial: [
      '1. Use apenas quando você já estiver ganhando em Dólar e quiser pagar créditos na OpenAI.',
      '2. Enquanto tiver US$ 0 de saldo, deixe vazio ou use o Modo Gratuito / Gemini / Groq acima.',
    ],
    fields: {
      apiKeyLabel: 'Chave da OpenAI (Apenas se tiver créditos)',
      apiKeyPlaceholder: 'sk-proj-... (opcional)',
    },
    icon: <Zap className="w-5 h-5 text-amber-400" />,
  },
  {
    provider: 'ELEVENLABS',
    title: 'ElevenLabs (Voz) — Opcional',
    tag: 'Já temos Voz Grátis na Aba 3',
    isEssential: false,
    shortDesc: 'A Aba 3 já gera Voz Neural Americana (.MP3) 100% de graça sem ElevenLabs! Use esta chave só se quiser vozes personalizadas.',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    docsLabel: 'Abrir ElevenLabs',
    stepByStepTutorial: [
      '1. Não é obrigatório ter conta na ElevenLabs: nossa Voz Neural Grátis já funciona de fábrica.',
      '2. Caso queira usar créditos grátis mensais extras da ElevenLabs, crie conta e cole sua xi-api-key abaixo.',
    ],
    fields: {
      apiKeyLabel: 'Chave ElevenLabs (Opcional)',
      apiKeyPlaceholder: 'sk_... (opcional)',
    },
    icon: <Volume2 className="w-5 h-5 text-purple-400" />,
  },
  {
    provider: 'KIWIFY',
    title: 'Kiwify Internacional (USD)',
    tag: 'Checkout Digital',
    isEssential: false,
    shortDesc: 'Recebe notificações de vendas em Dólar de E-books e cursos (Taxa: 9.99% + $0.80).',
    docsUrl: 'https://dashboard.kiwify.com.br/',
    docsLabel: 'Abrir Kiwify',
    webhookEndpointPath: '/api/webhooks/kiwify',
    stepByStepTutorial: [
      '1. No painel da Kiwify, acesse "Apps → Webhooks → Criar Webhook".',
      '2. Cole o Link de Webhook abaixo no campo URL e marque "Compra aprovada".',
      '3. Copie o "Token" gerado pela Kiwify, cole no campo abaixo e clique em "Testar & Salvar".',
    ],
    fields: {
      webhookSecretLabel: 'Token do Webhook Kiwify (Opcional)',
      webhookSecretPlaceholder: 'kwf_sec_... (ou clique em Testar & Salvar para ativar)',
    },
    icon: <Globe className="w-5 h-5 text-amber-400" />,
  },
  {
    provider: 'SHOPIFY',
    title: 'Shopify US (Dropshipping)',
    tag: 'Checkout Físico',
    isEssential: false,
    shortDesc: 'Conecta sua loja Shopify americana via Webhook ou Admin Token (Taxa: 2.9% + $0.30).',
    docsUrl: 'https://admin.shopify.com/',
    docsLabel: 'Abrir Shopify',
    webhookEndpointPath: '/api/webhooks/shopify',
    stepByStepTutorial: [
      '1. Na Shopify, vá em "Settings → Notifications → Webhooks → Create webhook".',
      '2. Escolha o evento "Order payment", formato JSON, e cole o Link de Webhook abaixo.',
      '3. Cole o domínio da loja ou o "Webhook signing secret" abaixo e clique em "Testar & Salvar".',
    ],
    fields: {
      accountIdLabel: 'Domínio da Loja (Opcional)',
      accountIdPlaceholder: 'sua-loja.myshopify.com',
      webhookSecretLabel: 'Webhook Secret ou Admin Token (Opcional)',
      webhookSecretPlaceholder: 'whsec_... ou shpat_...',
    },
    icon: <ShoppingBag className="w-5 h-5 text-lime-400" />,
  },
  {
    provider: 'META_ADS',
    title: 'Facebook & Instagram Ads',
    tag: 'Opcional • Só p/ Tráfego Pago',
    isEssential: false,
    shortDesc: 'Opcional no Modo R$ 0,00. Sincroniza campanhas pagas e ativa o Robô de Stop-Loss.',
    docsUrl: 'https://developers.facebook.com/tools/explorer/',
    docsLabel: 'Meta Graph Explorer',
    stepByStepTutorial: [
      '💡 Começando com R$ 0,00? Deixe desconectado! Você só precisa disso quando for pagar anúncios.',
      '1. Pegue o número da sua Conta de Anúncios no Gerenciador do Facebook (act_123456...).',
      '2. Atenção: Tokens do Graph Explorer expiram em 1 a 2 horas! Para durar 60 dias, clique no ícone azul "i" ao lado do token -> "Open in Access Token Tool" -> "Extend Access Token" (ou crie um Token Permanente em Configurações do Negócio -> Usuários do Sistema).',
      '3. Cole o Token, o ID da Conta (act_...) e o ID do Pixel abaixo.',
    ],
    fields: {
      apiKeyLabel: 'Access Token da Meta',
      apiKeyPlaceholder: 'EAABsbCS...',
      accountIdLabel: 'ID da Conta (act_...)',
      accountIdPlaceholder: 'act_123456789',
      pixelIdLabel: 'ID do Pixel (Opcional p/ CAPI)',
      pixelIdPlaceholder: '987654321',
    },
    icon: <Megaphone className="w-5 h-5 text-blue-400" />,
  },
  {
    provider: 'GOOGLE_ADS',
    title: 'Google Ads & YouTube US',
    tag: 'Tráfego Pago',
    isEssential: false,
    shortDesc: 'Conecta sua conta Google Ads americana para campanhas de Pesquisa e Shorts.',
    docsUrl: 'https://ads.google.com/',
    docsLabel: 'Abrir Google Ads',
    stepByStepTutorial: [
      '1. Acesse ads.google.com e copie seu ID de Cliente (formato 123-456-7890) no topo direito.',
      '2. Informe seu Token de Acesso/Developer Token e clique em Salvar.',
    ],
    fields: {
      apiKeyLabel: 'Token Google Ads',
      apiKeyPlaceholder: 'Token ou chave de acesso',
      accountIdLabel: 'Customer ID (123-456-7890)',
      accountIdPlaceholder: '123-456-7890',
    },
    icon: <Search className="w-5 h-5 text-sky-400" />,
  },
  {
    provider: 'TIKTOK',
    title: 'TikTok US (Auto-Post)',
    tag: 'Orgânico & Shop • Aba 3',
    isEssential: false,
    shortDesc: 'Publica vídeos direto no TikTok US (Opcional — você também pode baixar o MP4).',
    docsUrl: 'https://developers.tiktok.com/doc/content-posting-api-get-started',
    docsLabel: 'TikTok Developers',
    stepByStepTutorial: [
      '1. Crie um app no portal TikTok for Developers com "Content Posting API".',
      '2. Gere o Access Token OAuth da sua conta e cole abaixo.',
    ],
    fields: {
      apiKeyLabel: 'TikTok Access Token',
      apiKeyPlaceholder: 'act....',
    },
    icon: <Video className="w-5 h-5 text-pink-400" />,
  },
];

export default function Module0Setup({
  credentials,
  onRefresh,
  onNavigateTab,
}: Module0SetupProps) {
  const [formState, setFormState] = useState<
    Record<
      string,
      {
        apiKey: string;
        accountId: string;
        pixelId: string;
        webhookSecret: string;
      }
    >
  >({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState<Record<string, boolean>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    Record<string, { type: 'success' | 'error'; message: string }>
  >({});

  const [userProfileName, setUserProfileName] = useState<string>('Gabriel (Operação Principal)');
  const [vaultSnapshot, setVaultSnapshot] = useState<StoredCredentialsVault>({});
  const [backupToast, setBackupToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSyncedRef = useRef<boolean>(false);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const getSavedCred = (provider: string) =>
    credentials.find((c) => c.provider === provider);

  // Auto-hidratação completa (incluindo Kiwify e Shopify que usam webhookSecret/accountId sem apiKey)
  useEffect(() => {
    setUserProfileName(getStoredProfileName());
    const vault = getStoredCredentialsVault();
    setVaultSnapshot(vault);

    if (Object.keys(vault).length > 0) {
      setFormState((prev) => {
        const merged: any = { ...prev };
        for (const [p, val] of Object.entries(vault)) {
          if (p === 'WIX') continue;
          const hasAny = Boolean(
            val.apiKey || val.accountId || val.pixelId || val.webhookSecret || val.isVerified
          );
          if (hasAny) {
            merged[p] = {
              apiKey: prev[p]?.apiKey ?? val.apiKey ?? '',
              accountId: prev[p]?.accountId ?? val.accountId ?? '',
              pixelId: prev[p]?.pixelId ?? val.pixelId ?? '',
              webhookSecret: prev[p]?.webhookSecret ?? val.webhookSecret ?? '',
            };
          }
        }
        return merged;
      });
    }
  }, []);

  // Espelha credenciais verificadas do backend para o cofre local e re-sincroniza se faltar alguma no backend
  useEffect(() => {
    const vault = getStoredCredentialsVault();
    let vaultUpdated = false;

    for (const c of credentials) {
      if (c.provider === 'WIX') continue;
      if (c.isVerified) {
        const currentVault = vault[c.provider];
        if (
          !currentVault?.isVerified ||
          (c.webhookSecret && !currentVault?.webhookSecret) ||
          (c.apiKey && !currentVault?.apiKey)
        ) {
          saveCredentialToVault(c.provider, {
            apiKey: c.apiKey || currentVault?.apiKey || '',
            accountId: c.accountId || currentVault?.accountId || '',
            pixelId: c.pixelId || currentVault?.pixelId || '',
            webhookSecret: c.webhookSecret || currentVault?.webhookSecret || '',
            accountName: c.accountName || currentVault?.accountName || '',
            isVerified: true,
          });
          vaultUpdated = true;
        }
      }
    }

    if (vaultUpdated) {
      setVaultSnapshot(getStoredCredentialsVault());
    }

    // Verifica se existe algum provider salvo/verificado no cofre local que sumiu do backend (cold start)
    const latestVault = getStoredCredentialsVault();
    const missingOnBackend = Object.entries(latestVault).some(([prov, v]) => {
      if (prov === 'WIX') return false;
      const isWebhookOnly = prov === 'KIWIFY' || prov === 'SHOPIFY';
      const hasData = isWebhookOnly
        ? Boolean(v?.apiKey || v?.webhookSecret || v?.accountId || v?.pixelId || v?.isVerified)
        : Boolean(v?.apiKey?.trim());
      if (!hasData || !v?.isVerified) return false;
      return !credentials.some((c) => c.provider === prov && c.isVerified);
    });

    if (missingOnBackend && !hasAutoSyncedRef.current) {
      hasAutoSyncedRef.current = true;
      syncVaultToBackend().then(({ synced }) => {
        if (synced > 0) {
          onRefresh();
        }
      });
    }
  }, [credentials, onRefresh]);

  const handleFieldChange = (
    provider: string,
    field: 'apiKey' | 'accountId' | 'pixelId' | 'webhookSecret',
    value: string
  ) => {
    const existing = getSavedCred(provider);
    const vaultItem = vaultSnapshot[provider];
    const updated = {
      apiKey: formState[provider]?.apiKey ?? existing?.apiKey ?? vaultItem?.apiKey ?? '',
      accountId:
        formState[provider]?.accountId ?? existing?.accountId ?? vaultItem?.accountId ?? '',
      pixelId: formState[provider]?.pixelId ?? existing?.pixelId ?? vaultItem?.pixelId ?? '',
      webhookSecret:
        formState[provider]?.webhookSecret ??
        existing?.webhookSecret ??
        vaultItem?.webhookSecret ??
        '',
      [field]: value,
    };
    setFormState((prev) => ({
      ...prev,
      [provider]: updated,
    }));
    // Salva instantaneamente no LocalStorage para nunca perder dados ao fechar
    saveCredentialToVault(provider, updated);
    setVaultSnapshot(getStoredCredentialsVault());
  };

  const handleCopyWebhook = (path: string, provider: string) => {
    navigator.clipboard.writeText(`${origin}${path}`);
    setCopiedWebhook(provider);
    setTimeout(() => setCopiedWebhook(null), 2000);
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const filename = await downloadBackupToFile(userProfileName);
      setBackupToast({
        type: 'success',
        message: `Arquivo de backup "${filename}" baixado para o seu computador! Guarde em sua pasta segura.`,
      });
      setTimeout(() => setBackupToast(null), 5000);
    } catch (err: any) {
      setBackupToast({
        type: 'error',
        message: err.message || 'Erro ao exportar backup para o computador.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleTriggerRestore = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    try {
      const res = await restoreBackupFromFile(file);
      if (res.success) {
        setBackupToast({
          type: 'success',
          message: res.message || 'Backup restaurado com sucesso do seu arquivo!',
        });
        if (res.profileName) {
          setUserProfileName(res.profileName);
        }
        // Recarrega do cofre
        const vault = getStoredCredentialsVault();
        setVaultSnapshot(vault);
        setFormState((prev) => {
          const merged: any = { ...prev };
          for (const [p, val] of Object.entries(vault)) {
            if (p === 'WIX') continue;
            merged[p] = {
              apiKey: val.apiKey || '',
              accountId: val.accountId || '',
              pixelId: val.pixelId || '',
              webhookSecret: val.webhookSecret || '',
            };
          }
          return merged;
        });
        await onRefresh();
      } else {
        setBackupToast({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setBackupToast({
        type: 'error',
        message: err.message || 'Falha ao processar arquivo de backup.',
      });
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setBackupToast(null), 6000);
    }
  };

  const handleProfileNameChange = (newName: string) => {
    setUserProfileName(newName);
    saveStoredProfileName(newName);
  };

  const handleTestAndSave = async (provider: string) => {
    setTestingProvider(provider);
    setFeedback((prev) => {
      const copy = { ...prev };
      delete copy[provider];
      return copy;
    });

    const existing = getSavedCred(provider);
    const vaultItem = vaultSnapshot[provider];
    const values = {
      apiKey: formState[provider]?.apiKey ?? existing?.apiKey ?? vaultItem?.apiKey ?? '',
      accountId:
        formState[provider]?.accountId ?? existing?.accountId ?? vaultItem?.accountId ?? '',
      pixelId: formState[provider]?.pixelId ?? existing?.pixelId ?? vaultItem?.pixelId ?? '',
      webhookSecret:
        formState[provider]?.webhookSecret ??
        existing?.webhookSecret ??
        vaultItem?.webhookSecret ??
        '',
    };

    // Salva os campos digitados no vault local preventivamente
    saveCredentialToVault(provider, values);
    setVaultSnapshot(getStoredCredentialsVault());

    try {
      const res = await fetch('/api/settings/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, ...values }),
      });
      const data = await res.json();

      if (!res.ok || !data.isVerified) {
        setFeedback((prev) => ({
          ...prev,
          [provider]: {
            type: 'error',
            message: data.error || 'Chave inválida. Verifique o passo a passo.',
          },
        }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [provider]: {
            type: 'success',
            message: `Salvo & Verificado: ${data.credential?.accountName}`,
          },
        }));
        saveCredentialToVault(provider, {
          ...values,
          accountName: data.credential?.accountName,
          isVerified: true,
        });
        setVaultSnapshot(getStoredCredentialsVault());
        await onRefresh();
      }
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [provider]: {
          type: 'error',
          message: err.message || 'Erro de conexão.',
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleDisconnectProvider = async (provider: string) => {
    try {
      await fetch(`/api/settings/credentials?provider=${provider}`, {
        method: 'DELETE',
      });
    } catch {
      // ignora erro de rede
    }
    removeCredentialFromVault(provider);
    setVaultSnapshot(getStoredCredentialsVault());
    setFormState((prev) => ({
      ...prev,
      [provider]: { apiKey: '', accountId: '', pixelId: '', webhookSecret: '' },
    }));
    setFeedback((prev) => ({
      ...prev,
      [provider]: {
        type: 'success',
        message: 'Chave removida! Modo 100% Gratuito ativo para este recurso.',
      },
    }));
    await onRefresh();
  };

  const isProviderConnected = (provider: string) => {
    const cfg = PROVIDERS.find((p) => p.provider === provider);
    const requiresApiKey = Boolean(cfg?.fields.apiKeyLabel);
    const saved = getSavedCred(provider);
    const vaultItem = vaultSnapshot[provider];
    if (requiresApiKey) {
      return Boolean(
        (saved?.isVerified && saved?.apiKey?.trim()) ||
          (vaultItem?.isVerified && vaultItem?.apiKey?.trim())
      );
    }
    return Boolean(saved?.isVerified || vaultItem?.isVerified);
  };

  const connectedCount = PROVIDERS.filter((p) => isProviderConnected(p.provider)).length;

  return (
    <div className="space-y-5">
      {/* Header Limpo e Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Central de IA Gratuita & Conexões
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tudo já funciona no <strong className="text-emerald-400">Modo R$ 0,00 (Grátis)</strong> sem pagar OpenAI nem ElevenLabs!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-bold">
            Motor Gratuito Ativo • {connectedCount}/{PROVIDERS.length} opcionais
          </span>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab(1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-extrabold text-slate-950 transition shadow-sm"
            >
              Começar Grátis (Criar Produto)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* BANNER ZERO CUSTO ($0.00): COMO GERAR TUDO SEM DINHEIRO INICIAL */}
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 p-4 sm:p-5 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              MODO R$ 0,00 ATIVADO DE FÁBRICA
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Você NÃO precisa pagar OpenAI, ElevenLabs nem Tráfego Pago para começar!
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              O sistema usa automaticamente <strong className="text-emerald-300">Inteligência Artificial Gratuita na Nuvem</strong> +{' '}
              <strong className="text-cyan-300">Voz Neural Americana Gratuita (.MP3)</strong> +{' '}
              <strong className="text-purple-300">Renderizador FFmpeg (.MP4)</strong>. Mesmo se sua chave da OpenAI estiver sem saldo (erro 429), o aplicativo gera seus E-books, Copys e Vídeos sem cobrar nada.
            </p>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab(1)}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition"
            >
              <Sparkles className="w-4 h-4" />
              Ir Direto ao Passo 1 (Grátis)
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-[11px]">
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 text-slate-300">
            <strong className="text-emerald-400 block mb-0.5">1. Produto R$ 0</strong>
            Crie um E-book em Inglês grátis na Aba 1 ou cadastre-se grátis como Afiliado na Digistore24 / ClickBank.
          </div>
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 text-slate-300">
            <strong className="text-cyan-400 block mb-0.5">2. Roteiros R$ 0</strong>
            Gere 3 roteiros americanos na Aba 2 e transforme o E-book em PDF grátis no Google Docs ou Canva.
          </div>
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 text-slate-300">
            <strong className="text-purple-400 block mb-0.5">3. Voz & Vídeo R$ 0</strong>
            Gere locução americana + vídeo .MP4 na Aba 3 sem pagar ElevenLabs (baixe grátis do Pexels!).
          </div>
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 text-slate-300">
            <strong className="text-amber-400 block mb-0.5">4. Tráfego Orgânico R$ 0</strong>
            Poste os vídeos de graça no TikTok, Reels e Shorts para fazer suas primeiras vendas antes de pagar anúncios!
          </div>
        </div>
      </div>

      {/* INPUT OCULTO PARA CARREGAR BACKUP DO COMPUTADOR */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* FEEDBACK DE BACKUP */}
      {backupToast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition animate-fadeIn ${
            backupToast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          {backupToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{backupToast.message}</span>
        </div>
      )}

      {/* CENTRAL DE PERSISTÊNCIA & BACKUP NO COMPUTADOR DO USUÁRIO */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <HardDrive className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                Persistência & Backup no seu Computador
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> Auto-Save Ativo
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Todas as informações digitadas são salvas automaticamente na memória do seu computador para você nunca perder nada ao fechar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white transition disabled:opacity-50 shadow-sm"
              title="Baixa um arquivo .JSON com todas as suas chaves e produtos para guardar em sua pasta"
            >
              <FolderDown className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Salvando...' : 'Salvar no Meu PC (.JSON)'}
            </button>

            <button
              type="button"
              onClick={handleTriggerRestore}
              disabled={isRestoring}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 transition disabled:opacity-50"
              title="Carrega um arquivo .JSON do seu computador para restaurar tudo"
            >
              <FolderUp className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
              {isRestoring ? 'Restaurando...' : 'Carregar do Meu PC'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-400" /> Perfil / Usuário Fixo:
            </span>
            <input
              type="text"
              value={userProfileName}
              onChange={(e) => handleProfileNameChange(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
              placeholder="Seu nome ou operação..."
            />
          </div>
          <span className="text-slate-400">
            💡 Dica: Salve o arquivo na sua pasta do projeto ou Google Drive para ter um backup permanente.
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map((cfg) => {
          const saved = getSavedCred(cfg.provider);
          const vaultItem = vaultSnapshot[cfg.provider];
          const isActive = isProviderConnected(cfg.provider);
          const displayAccountName = saved?.accountName || vaultItem?.accountName || '';
          const current = {
            apiKey: formState[cfg.provider]?.apiKey ?? saved?.apiKey ?? vaultItem?.apiKey ?? '',
            accountId:
              formState[cfg.provider]?.accountId ??
              saved?.accountId ??
              vaultItem?.accountId ??
              '',
            pixelId:
              formState[cfg.provider]?.pixelId ?? saved?.pixelId ?? vaultItem?.pixelId ?? '',
            webhookSecret:
              formState[cfg.provider]?.webhookSecret ??
              saved?.webhookSecret ??
              vaultItem?.webhookSecret ??
              '',
          };
          const isTesting = testingProvider === cfg.provider;
          const fb = feedback[cfg.provider];
          const tutorialOpen = Boolean(showTutorial[cfg.provider]);
          const secretVisible = Boolean(showSecret[cfg.provider]);

          return (
            <div
              key={cfg.provider}
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition min-w-0 ${
                cfg.isEssential ? 'md:col-span-2' : ''
              } ${
                isActive
                  ? 'border-emerald-500/40 bg-slate-900/90'
                  : cfg.isFreeHighlight
                  ? 'border-cyan-500/35 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950'
                  : 'border-slate-800/90 bg-slate-900/50'
              }`}
            >
              <div className="space-y-3">
                {/* Topo do Card */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      {cfg.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white">{cfg.title}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            cfg.isFreeHighlight
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cfg.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{cfg.shortDesc}</p>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto shrink-0">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ativo
                      </span>
                    ) : (
                      <a
                        href={cfg.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        {cfg.docsLabel}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Botão Sanfona para Tutorial */}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setShowTutorial((prev) => ({
                        ...prev,
                        [cfg.provider]: !prev[cfg.provider],
                      }))
                    }
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {tutorialOpen
                        ? 'Ocultar passo a passo'
                        : 'Como pegar este código (Passo a passo)'}
                    </span>
                    {tutorialOpen ? (
                      <ChevronUp className="w-3 h-3 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3 h-3 shrink-0" />
                    )}
                  </button>

                  {tutorialOpen && (
                    <div className="mt-2 rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1.5 text-xs text-slate-300">
                      {cfg.stepByStepTutorial.map((step, i) => (
                        <div key={i} className="leading-relaxed">
                          {step}
                        </div>
                      ))}
                      <div className="pt-1">
                        <a
                          href={cfg.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 font-semibold hover:underline"
                        >
                          Abrir {cfg.docsLabel} em nova aba
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Link de Webhook Compacto (Sem Corte Visual) */}
                {cfg.webhookEndpointPath && (
                  <div className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800/90 rounded-xl px-3 py-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        URL do Webhook:
                      </span>
                      <code className="text-[11px] font-mono text-emerald-300 break-all select-all block">
                        {origin}
                        {cfg.webhookEndpointPath}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyWebhook(cfg.webhookEndpointPath!, cfg.provider)
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 hover:text-white inline-flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedWebhook === cfg.provider ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                )}

                {/* Inputs Compactos */}
                <div
                  className={`grid gap-3 ${
                    cfg.isEssential ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {cfg.fields.apiKeyLabel && (
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-slate-300">
                          {cfg.fields.apiKeyLabel}
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowSecret((prev) => ({
                              ...prev,
                              [cfg.provider]: !prev[cfg.provider],
                            }))
                          }
                          className="text-[11px] text-slate-500 hover:text-slate-300 inline-flex items-center gap-1"
                        >
                          {secretVisible ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <input
                        type={secretVisible ? 'text' : 'password'}
                        value={current.apiKey}
                        onChange={(e) =>
                          handleFieldChange(cfg.provider, 'apiKey', e.target.value)
                        }
                        placeholder={cfg.fields.apiKeyPlaceholder}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {cfg.fields.accountIdLabel && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        {cfg.fields.accountIdLabel}
                      </label>
                      <input
                        type="text"
                        value={current.accountId}
                        onChange={(e) =>
                          handleFieldChange(cfg.provider, 'accountId', e.target.value)
                        }
                        placeholder={cfg.fields.accountIdPlaceholder}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {cfg.fields.pixelIdLabel && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        {cfg.fields.pixelIdLabel}
                      </label>
                      <input
                        type="text"
                        value={current.pixelId}
                        onChange={(e) =>
                          handleFieldChange(cfg.provider, 'pixelId', e.target.value)
                        }
                        placeholder={cfg.fields.pixelIdPlaceholder}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {cfg.fields.webhookSecretLabel && (
                    <div className={cfg.fields.accountIdLabel ? '' : 'sm:col-span-2'}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-slate-300">
                          {cfg.fields.webhookSecretLabel}
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowSecret((prev) => ({
                              ...prev,
                              [cfg.provider]: !prev[cfg.provider],
                            }))
                          }
                          className="text-[11px] text-slate-500 hover:text-slate-300 inline-flex items-center gap-1"
                        >
                          {secretVisible ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <input
                        type={secretVisible ? 'text' : 'password'}
                        value={current.webhookSecret}
                        onChange={(e) =>
                          handleFieldChange(
                            cfg.provider,
                            'webhookSecret',
                            e.target.value
                          )
                        }
                        placeholder={cfg.fields.webhookSecretPlaceholder}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé do Card */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  {fb ? (
                    <span
                      className={`text-[11px] flex items-center gap-1 ${
                        fb.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{fb.message}</span>
                    </span>
                  ) : isActive && displayAccountName ? (
                    <span className="text-[11px] text-emerald-400/90 font-medium truncate block">
                      ✓ {displayAccountName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-600">
                      Salvo automaticamente neste computador
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(isActive || Boolean(current.apiKey?.trim())) && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectProvider(cfg.provider)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-800 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/40 px-2.5 py-2 text-[11px] font-semibold text-slate-300 hover:text-rose-300 transition"
                      title="Remover esta chave para usar só o Modo Gratuito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleTestAndSave(cfg.provider)}
                    disabled={isTesting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white transition shrink-0"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        Testar & Salvar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
