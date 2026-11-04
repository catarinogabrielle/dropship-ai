'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { ApiCredentialData } from '@/types/autopilot';

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
    provider: 'OPENAI',
    title: 'OpenAI (GPT-4o)',
    tag: 'Essencial • Comece Aqui',
    isEssential: true,
    shortDesc: 'Cria seus produtos digitais, analisa concorrentes e escreve os anúncios em inglês.',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'Pegar Chave na OpenAI',
    stepByStepTutorial: [
      '1. Clique em "Pegar Chave na OpenAI" acima e faça login.',
      '2. No menu esquerdo, clique em "API keys" e depois em "+ Create new secret key".',
      '3. Em "Settings > Billing", garanta pelo menos US$ 5 de saldo para liberar o GPT-4o.',
      '4. Copie o código "sk-proj-..." e cole no campo abaixo.',
    ],
    fields: {
      apiKeyLabel: 'Chave da OpenAI (API Key)',
      apiKeyPlaceholder: 'sk-proj-...',
    },
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
  },
  {
    provider: 'ELEVENLABS',
    title: 'ElevenLabs (Voz Americana)',
    tag: 'Voz IA • Aba 3',
    isEssential: false,
    shortDesc: 'Grava a locução em inglês nativo (.MP3) para os seus vídeos de vendas.',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    docsLabel: 'Pegar Chave ElevenLabs',
    stepByStepTutorial: [
      '1. Crie sua conta gratuita em elevenlabs.io.',
      '2. Clique no seu perfil (canto inferior esquerdo) → "API Keys".',
      '3. Clique em "Create API Key", copie o código e cole abaixo.',
    ],
    fields: {
      apiKeyLabel: 'Chave ElevenLabs (xi-api-key)',
      apiKeyPlaceholder: 'sk_...',
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
      '3. Copie o "Token" gerado pela Kiwify e cole no campo abaixo.',
    ],
    fields: {
      webhookSecretLabel: 'Token do Webhook Kiwify',
      webhookSecretPlaceholder: 'kwf_sec_...',
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
      '2. Escolha o evento "Order payment" e cole o Link de Webhook abaixo.',
      '3. Copie o "Webhook signing secret" da Shopify e cole abaixo.',
    ],
    fields: {
      accountIdLabel: 'Domínio da Loja (Opcional)',
      accountIdPlaceholder: 'sua-loja.myshopify.com',
      webhookSecretLabel: 'Webhook Secret (Ou Admin Token)',
      webhookSecretPlaceholder: 'whsec_... ou shpat_...',
    },
    icon: <ShoppingBag className="w-5 h-5 text-lime-400" />,
  },
  {
    provider: 'META_ADS',
    title: 'Facebook & Instagram Ads',
    tag: 'Tráfego Pago • Aba 4',
    isEssential: false,
    shortDesc: 'Sincroniza suas campanhas e ativa o Robô de Stop-Loss e Escala +20%.',
    docsUrl: 'https://developers.facebook.com/tools/explorer/',
    docsLabel: 'Meta Graph Explorer',
    stepByStepTutorial: [
      '1. Pegue o número da sua Conta de Anúncios no Gerenciador do Facebook (act_123456...).',
      '2. Gere um Token de Acesso com permissão ads_management em Configurações do Negócio ou Graph Explorer.',
      '3. Cole o Token, o ID da Conta e o ID do Pixel abaixo.',
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

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const getSavedCred = (provider: string) =>
    credentials.find((c) => c.provider === provider);

  const handleFieldChange = (
    provider: string,
    field: 'apiKey' | 'accountId' | 'pixelId' | 'webhookSecret',
    value: string
  ) => {
    const existing = getSavedCred(provider);
    setFormState((prev) => ({
      ...prev,
      [provider]: {
        apiKey: prev[provider]?.apiKey ?? existing?.apiKey ?? '',
        accountId: prev[provider]?.accountId ?? existing?.accountId ?? '',
        pixelId: prev[provider]?.pixelId ?? existing?.pixelId ?? '',
        webhookSecret: prev[provider]?.webhookSecret ?? existing?.webhookSecret ?? '',
        [field]: value,
      },
    }));
  };

  const handleCopyWebhook = (path: string, provider: string) => {
    navigator.clipboard.writeText(`${origin}${path}`);
    setCopiedWebhook(provider);
    setTimeout(() => setCopiedWebhook(null), 2000);
  };

  const handleTestAndSave = async (provider: string) => {
    setTestingProvider(provider);
    setFeedback((prev) => {
      const copy = { ...prev };
      delete copy[provider];
      return copy;
    });

    const existing = getSavedCred(provider);
    const values = {
      apiKey: formState[provider]?.apiKey ?? existing?.apiKey ?? '',
      accountId: formState[provider]?.accountId ?? existing?.accountId ?? '',
      pixelId: formState[provider]?.pixelId ?? existing?.pixelId ?? '',
      webhookSecret: formState[provider]?.webhookSecret ?? existing?.webhookSecret ?? '',
    };

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
            message: `Verificado: ${data.credential?.accountName}`,
          },
        }));
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

  const isOpenAiConnected = Boolean(getSavedCred('OPENAI')?.isVerified);
  const connectedCount = credentials.filter((c) => c.isVerified).length;

  return (
    <div className="space-y-6">
      {/* Header Limpo e Direto do Módulo 0 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Central de Conexões & APIs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Conecte apenas a <strong className="text-emerald-400">OpenAI</strong> para começar a criar produtos e anúncios agora. As demais integrações são opcionais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <strong className="text-emerald-400">{connectedCount}</strong> de {PROVIDERS.length} conectadas
          </span>

          {isOpenAiConnected && onNavigateTab && (
            <button
              onClick={() => onNavigateTab(1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition"
            >
              Criar Meu Primeiro Produto
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Limpo em 2 Colunas (OpenAI em destaque no topo se quiser ou 2 colunas equilibradas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map((cfg) => {
          const saved = getSavedCred(cfg.provider);
          const current = formState[cfg.provider] || {
            apiKey: saved?.apiKey || '',
            accountId: saved?.accountId || '',
            pixelId: saved?.pixelId || '',
            webhookSecret: saved?.webhookSecret || '',
          };
          const isTesting = testingProvider === cfg.provider;
          const fb = feedback[cfg.provider];
          const tutorialOpen = Boolean(showTutorial[cfg.provider]);
          const secretVisible = Boolean(showSecret[cfg.provider]);

          return (
            <div
              key={cfg.provider}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition ${
                cfg.isEssential ? 'md:col-span-2' : ''
              } ${
                saved?.isVerified
                  ? 'border-emerald-500/40 bg-slate-900/90'
                  : cfg.isEssential
                  ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900'
                  : 'border-slate-800/90 bg-slate-900/50'
              }`}
            >
              <div className="space-y-3">
                {/* Topo do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      {cfg.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{cfg.title}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            cfg.isEssential
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

                  {saved?.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ativo
                    </span>
                  ) : (
                    <a
                      href={cfg.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 shrink-0"
                    >
                      {cfg.docsLabel}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Botão Sanfona para Tutorial (Não polui a tela, abre sob demanda) */}
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
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    {tutorialOpen
                      ? 'Ocultar passo a passo'
                      : 'Como pegar este código (Passo a passo)'}
                    {tutorialOpen ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
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

                {/* Link de Webhook Compacto (Se aplicável) */}
                {cfg.webhookEndpointPath && (
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/90 rounded-xl px-3 py-1.5">
                    <span className="text-[11px] text-slate-400 shrink-0">Webhook:</span>
                    <code className="text-[11px] text-emerald-300 truncate flex-1">
                      {origin}
                      {cfg.webhookEndpointPath}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyWebhook(cfg.webhookEndpointPath!, cfg.provider)
                      }
                      className="text-[11px] font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedWebhook === cfg.provider ? 'Copiado' : 'Copiar'}
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
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        {cfg.fields.webhookSecretLabel}
                      </label>
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
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {fb ? (
                    <span
                      className={`text-[11px] flex items-center gap-1 truncate ${
                        fb.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{fb.message}</span>
                    </span>
                  ) : saved?.isVerified && saved.accountName ? (
                    <span className="text-[11px] text-slate-400 truncate block">
                      {saved.accountName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-600">
                      Validação via requisição HTTP real
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleTestAndSave(cfg.provider)}
                  disabled={isTesting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white transition shrink-0"
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
          );
        })}
      </div>
    </div>
  );
}
