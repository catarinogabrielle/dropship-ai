'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Rocket,
  Package,
  PenTool,
  Video,
  Bot,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  HelpCircle,
  X,
  Sparkles,
  Menu,
  Download,
  HardDrive,
  FolderDown,
  FolderUp,
} from 'lucide-react';
import {
  downloadBackupToFile,
  syncVaultToBackend,
  saveProductsToVault,
  saveCreativesToVault,
  saveCredentialToVault,
  getStoredCredentialsVault,
  getStoredProductsVault,
  getStoredCreativesVault,
  getDeletedProductIds,
  getDeletedCreativeIds,
} from '@/lib/storage-persistence';
import {
  SystemStatusData,
  ProductData,
  CreativeData,
  CampaignData,
  SaleData,
  SegmentType,
  ApiCredentialData,
} from '@/types/autopilot';
import Module0Setup from '@/components/Module0Setup';
import Module1Products from '@/components/Module1Products';
import Module2Copywriting from '@/components/Module2Copywriting';
import Module3VideoTikTok from '@/components/Module3VideoTikTok';
import Module4TrafficBot from '@/components/Module4TrafficBot';
import Module5SalesWebhooks from '@/components/Module5SalesWebhooks';

const SIDEBAR_MODULES = [
  {
    index: 0,
    shortTitle: 'IA Grátis & Conexões',
    mobileLabel: 'Conexões',
    subtitle: 'Modo $0 Ativo, Gemini, Groq & Lojas',
    icon: Rocket,
    stepId: 1,
    nextLabel: 'Próximo: Produtos & Simulador →',
  },
  {
    index: 1,
    shortTitle: 'Produtos & Calculadora',
    mobileLabel: 'Produtos',
    subtitle: 'Gerador Grátis de E-book, Afiliado & Dropship',
    icon: Package,
    stepId: 2,
    nextLabel: 'Próximo: Gerador de Copy em Inglês →',
  },
  {
    index: 2,
    shortTitle: 'Copywriting & Anúncios',
    mobileLabel: 'Copy IA',
    subtitle: 'Roteiros e textos em inglês grátis c/ tradução',
    icon: PenTool,
    stepId: 3,
    nextLabel: 'Próximo: Voz Americana & Vídeo Grátis →',
  },
  {
    index: 3,
    shortTitle: 'Estúdio de Voz & Vídeo',
    mobileLabel: 'Vídeo',
    subtitle: 'Voz EUA Grátis MP3, FFmpeg MP4 & TikTok',
    icon: Video,
    stepId: 3,
    nextLabel: 'Próximo: Robô de Tráfego Pago →',
  },
  {
    index: 4,
    shortTitle: 'Robô de Tráfego Pago',
    mobileLabel: 'Robô Ads',
    subtitle: 'Stop-Loss e Escala +20% (Meta/Google)',
    icon: Bot,
    stepId: 4,
    nextLabel: 'Próximo: Vendas em Dólar & Webhooks →',
  },
  {
    index: 5,
    shortTitle: 'Vendas & Webhooks',
    mobileLabel: 'Vendas',
    subtitle: 'Lucro em USD/BRL e links Kiwify/Shopify',
    icon: DollarSign,
    stepId: 5,
    nextLabel: 'Voltar para Conexões & Contas →',
  },
];

const SEGMENT_PILLS: {
  id: SegmentType;
  label: string;
  fee: string;
}[] = [
  { id: 'ALL', label: 'Todos', fee: 'Geral' },
  { id: 'KIWIFY_GLOBAL', label: 'Kiwify Global', fee: '9.99%+$0.80' },
  { id: 'SHOPIFY_US', label: 'Shopify US', fee: '2.9%+$0.30' },
  { id: 'TIKTOK_SHOP', label: 'TikTok Shop US', fee: '6.0%' },
  { id: 'ADS_SCALE', label: 'Escala Ads (Meta/Google)', fee: 'Auto-Scale' },
];

export default function AutopilotDashboardPage() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedSegment, setSelectedSegment] =
    useState<SegmentType>('ALL');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [creatives, setCreatives] = useState<CreativeData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [salesData, setSalesData] = useState<{
    sales: SaleData[];
    summary: {
      count: number;
      grossUsd: number;
      gatewayFeeUsd: number;
      netUsd: number;
      netBrl: number;
      liveConvertedNetBrl: number;
    };
  }>({
    sales: [],
    summary: {
      count: 0,
      grossUsd: 0,
      gatewayFeeUsd: 0,
      netUsd: 0,
      netBrl: 0,
      liveConvertedNetBrl: 0,
    },
  });
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  const fetchAllRealData = useCallback(async () => {
    try {
      const segParam =
        selectedSegment === 'ADS_SCALE' || selectedSegment === 'ALL'
          ? 'ALL'
          : selectedSegment;

      const [statusRes, prodRes, creatRes, adsRes, salesRes] =
        await Promise.all([
          fetch('/api/system/status', { cache: 'no-store' }),
          fetch(`/api/products?segment=${segParam}`, { cache: 'no-store' }),
          fetch(`/api/creatives?segment=${segParam}`, { cache: 'no-store' }),
          fetch('/api/ads/sync', { cache: 'no-store' }),
          fetch(`/api/sales?segment=${segParam}`, { cache: 'no-store' }),
        ]);

      let mergedCreds: ApiCredentialData[] = [];
      let totalVaultProductsCount = 0;
      let totalVaultCreativesCount = 0;

      // 1. Produtos (Servidor + Cofre Local para sobreviver a Serverless Lambdas isoladas)
      if (prodRes.ok) {
        const pr = await prodRes.json();
        const serverProds: ProductData[] = pr.products || [];
        if (serverProds.length > 0) saveProductsToVault(serverProds);

        const deletedIds = new Set(getDeletedProductIds());
        const vaultProds: ProductData[] = getStoredProductsVault();
        totalVaultProductsCount = vaultProds.length;

        const map = new Map<string, ProductData>();
        for (const p of vaultProds) {
          if (p?.id && !deletedIds.has(p.id)) {
            if (segParam === 'ALL' || p.segment === segParam) {
              map.set(p.id, p);
            }
          }
        }
        for (const p of serverProds) {
          if (p?.id && !deletedIds.has(p.id)) {
            map.set(p.id, p);
          }
        }

        const mergedProds = Array.from(map.values()).sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        setProducts(mergedProds);
      }

      // 2. Criativos (Servidor + Cofre Local + Estado em memoria p/ manter MP4/MP3 grandes)
      if (creatRes.ok) {
        const cr = await creatRes.json();
        const serverCreats: CreativeData[] = cr.creatives || [];
        if (serverCreats.length > 0) saveCreativesToVault(serverCreats);

        const deletedCreatIds = new Set(getDeletedCreativeIds());
        const vaultCreats: CreativeData[] = getStoredCreativesVault();
        totalVaultCreativesCount = vaultCreats.length;

        setCreatives((prev) => {
          const map = new Map<string, CreativeData>();
          for (const c of vaultCreats) {
            if (c?.id && !deletedCreatIds.has(c.id)) {
              const seg = c.product?.segment;
              if (segParam === 'ALL' || !seg || seg === segParam) {
                map.set(c.id, c);
              }
            }
          }
          for (const c of prev) {
            if (c?.id && !deletedCreatIds.has(c.id)) {
              const seg = c.product?.segment;
              if (segParam === 'ALL' || !seg || seg === segParam) {
                const existing = map.get(c.id);
                map.set(c.id, {
                  ...(existing || c),
                  ...c,
                  audioFilePath: c.audioFilePath || existing?.audioFilePath || null,
                  videoFilePath: c.videoFilePath || existing?.videoFilePath || null,
                });
              }
            }
          }
          for (const c of serverCreats) {
            if (c?.id && !deletedCreatIds.has(c.id)) {
              const existing = map.get(c.id);
              map.set(c.id, {
                ...c,
                audioFilePath: c.audioFilePath || existing?.audioFilePath || null,
                videoFilePath: c.videoFilePath || existing?.videoFilePath || null,
              });
            }
          }
          return Array.from(map.values()).sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );
        });
      }

      // 3. Status & Credenciais (Espelha servidor <-> cofre local e calcula progresso real)
      if (statusRes.ok) {
        const st: SystemStatusData = await statusRes.json();
        const serverCreds: ApiCredentialData[] = st.credentials || [];

        for (const c of serverCreds) {
          if (c.provider === 'WIX') continue;
          if (c.apiKey || c.webhookSecret || c.accountId || c.isVerified) {
            saveCredentialToVault(c.provider, {
              apiKey: c.apiKey || undefined,
              accountId: c.accountId || undefined,
              pixelId: c.pixelId || undefined,
              webhookSecret: c.webhookSecret || undefined,
              accountName: c.accountName || undefined,
              isVerified: c.isVerified,
            });
          }
        }

        const vaultCredsMap = getStoredCredentialsVault();
        const credsByProvider = new Map<string, ApiCredentialData>();

        for (const [provider, v] of Object.entries(vaultCredsMap)) {
          if (provider === 'WIX' || !v) continue;
          const isWebhookOnly = provider === 'KIWIFY' || provider === 'SHOPIFY';
          const isValidActive = isWebhookOnly
            ? Boolean(v.isVerified)
            : Boolean(v.isVerified && v.apiKey?.trim());
          if (v.apiKey || v.webhookSecret || v.accountId || isValidActive) {
            credsByProvider.set(provider, {
              id: `vault_${provider}`,
              provider,
              apiKey: v.apiKey || '',
              accountId: v.accountId || null,
              pixelId: v.pixelId || null,
              webhookSecret: v.webhookSecret || null,
              isVerified: isValidActive,
              accountName: v.accountName || `${provider} Ativo`,
              currency: 'USD',
              lastTestedAt: v.updatedAt || null,
              updatedAt: v.updatedAt || new Date().toISOString(),
            });
          }
        }

        for (const sc of serverCreds) {
          if (sc.provider !== 'WIX') {
            const existing = credsByProvider.get(sc.provider);
            credsByProvider.set(sc.provider, {
              ...sc,
              apiKey: sc.apiKey || existing?.apiKey || '',
              accountId: sc.accountId || existing?.accountId || null,
              pixelId: sc.pixelId || existing?.pixelId || null,
              webhookSecret: sc.webhookSecret || existing?.webhookSecret || null,
              isVerified: Boolean(sc.isVerified || existing?.isVerified),
            });
          }
        }

        mergedCreds = Array.from(credsByProvider.values());
        const effectiveProdCount = Math.max(
          st.counts?.products || 0,
          totalVaultProductsCount
        );
        const effectiveCreatCount = Math.max(
          st.counts?.creatives || 0,
          totalVaultCreativesCount
        );

        const aiProviderConnected = mergedCreds.find(
          (c) =>
            (c.provider === 'GEMINI' ||
              c.provider === 'GROQ' ||
              c.provider === 'OPENAI') &&
            c.isVerified &&
            c.apiKey.trim()
        );
        const metaOrTiktokOk = mergedCreds.some(
          (c) =>
            (c.provider === 'META_ADS' || c.provider === 'TIKTOK') &&
            c.isVerified &&
            c.apiKey.trim()
        );
        const webhookOk =
          Boolean(st.cronState?.isCronActive) &&
          (mergedCreds.some(
            (c) => (c.provider === 'KIWIFY' || c.provider === 'SHOPIFY') && c.isVerified
          ) ||
            (st.counts?.sales || 0) > 0);

        const mergedSteps = [
          {
            id: 1,
            weight: 20,
            label: aiProviderConnected
              ? `Motor IA conectado (${aiProviderConnected.provider})`
              : 'Modo IA Gratuita ($0,00) pronto para usar',
            completed: true,
            tabIndex: 0,
          },
          {
            id: 2,
            weight: 20,
            label: 'Produto real extraído e calculado',
            completed: effectiveProdCount > 0,
            tabIndex: 1,
          },
          {
            id: 3,
            weight: 20,
            label: 'Roteiro/Copy em inglês gerado via IA',
            completed: effectiveCreatCount > 0,
            tabIndex: 2,
          },
          {
            id: 4,
            weight: 20,
            label: 'Meta Ads ou TikTok US autenticado',
            completed: metaOrTiktokOk,
            tabIndex: 0,
          },
          {
            id: 5,
            weight: 20,
            label: 'Robô Cron ativo e Webhook configurado',
            completed: webhookOk,
            tabIndex: 5,
          },
        ];

        setSystemStatus({
          ...st,
          credentials: mergedCreds,
          counts: {
            ...st.counts,
            products: effectiveProdCount,
            creatives: effectiveCreatCount,
          },
          steps: mergedSteps,
          progressPercent: mergedSteps.reduce(
            (acc, s) => acc + (s.completed ? s.weight : 0),
            0
          ),
        });
      }

      if (adsRes.ok) {
        const ad = await adsRes.json();
        setCampaigns(ad.campaigns || []);
      }
      if (salesRes.ok) {
        const sl = await salesRes.json();
        setSalesData({
          sales: sl.sales || [],
          summary: sl.summary || {
            count: 0,
            grossUsd: 0,
            gatewayFeeUsd: 0,
            netUsd: 0,
            netBrl: 0,
            liveConvertedNetBrl: 0,
          },
        });
      }
    } finally {
      setLoadingInitial(false);
    }
  }, [selectedSegment]);

  const handleProductCreated = useCallback((newProd: ProductData) => {
    saveProductsToVault([newProd]);
    setProducts((prev) => {
      const map = new Map<string, ProductData>();
      map.set(newProd.id, newProd);
      for (const p of prev) map.set(p.id, p);
      return Array.from(map.values());
    });
  }, []);

  const handleCreativesUpdated = useCallback((updatedList: CreativeData[]) => {
    saveCreativesToVault(updatedList);
    setCreatives((prev) => {
      const map = new Map<string, CreativeData>();
      for (const c of prev) map.set(c.id, c);
      for (const c of updatedList) {
        const existing = map.get(c.id);
        map.set(c.id, {
          ...c,
          audioFilePath: c.audioFilePath || existing?.audioFilePath || null,
          videoFilePath: c.videoFilePath || existing?.videoFilePath || null,
        });
      }
      return Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    });
  }, []);

  useEffect(() => {
    // Sincroniza cofre local com o backend automaticamente se o backend tiver reiniciado
    syncVaultToBackend().finally(() => {
      fetchAllRealData();
    });
  }, [fetchAllRealData]);

  const progressPercent = systemStatus?.progressPercent ?? 0;
  const exchangeRateBrl = systemStatus?.exchange?.rate ?? 5.49;
  const currentModuleMeta = SIDEBAR_MODULES[activeTab] || SIDEBAR_MODULES[0];
  const isMetaConnected = Boolean(
    systemStatus?.credentials?.some(
      (c) => c.provider === 'META_ADS' && c.isVerified
    )
  );

  const isStepDone = (tabIdx: number): boolean => {
    if (tabIdx === 0) {
      return true;
    }
    if (tabIdx === 1) return products.length > 0 || (systemStatus?.counts.products ?? 0) > 0;
    if (tabIdx === 2) return creatives.length > 0 || (systemStatus?.counts.creatives ?? 0) > 0;
    if (tabIdx === 3) {
      return creatives.some((c) => Boolean(c.audioFilePath || c.videoFilePath));
    }
    if (tabIdx === 4) return isMetaConnected || (systemStatus?.counts.campaigns ?? 0) > 0;
    if (tabIdx === 5) return (systemStatus?.counts.sales ?? 0) > 0;
    return false;
  };

  const handleSelectTab = (idx: number) => {
    setActiveTab(idx);
    setMobileMenuOpen(false);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderSidebarContent = () => (
    <>
      <div className="p-4 space-y-5 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/favicon.svg"
              alt="Logo"
              className="w-9 h-9 rounded-xl shadow-md shadow-emerald-950/60 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate">
                US Dollar Autopilot
              </h1>
              <span className="text-[11px] text-emerald-400 font-medium block truncate">
                Operação Internacional IA
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Progresso Compacta */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Ativação do Sistema</span>
            <span className="font-bold text-emerald-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Navegação Única Numerada */}
        <nav className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2.5 pb-1">
            Fluxo de Trabalho (0 a 5)
          </div>
          {SIDEBAR_MODULES.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.index;
            const done = isStepDone(item.index);

            return (
              <button
                key={item.index}
                onClick={() => handleSelectTab(item.index)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center gap-3 group border ${
                  isActive
                    ? 'bg-emerald-500/15 text-white border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950'
                      : done
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      {item.index}. {item.shortTitle}
                    </span>
                    {done && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {item.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Resumo Rápido Inferior na Sidebar */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2.5 shrink-0">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-lg bg-slate-900/90 border border-slate-800/80 py-1.5 px-1">
            <span className="text-[10px] text-slate-500 block">Produtos</span>
            <span className="text-xs font-bold text-white">
              {systemStatus?.counts.products ?? 0}
            </span>
          </div>
          <div className="rounded-lg bg-slate-900/90 border border-slate-800/80 py-1.5 px-1">
            <span className="text-[10px] text-slate-500 block">Criativos</span>
            <span className="text-xs font-bold text-white">
              {systemStatus?.counts.creatives ?? 0}
            </span>
          </div>
          <div className="rounded-lg bg-slate-900/90 border border-slate-800/80 py-1.5 px-1">
            <span className="text-[10px] text-slate-500 block">Vendas</span>
            <span className="text-xs font-bold text-emerald-400">
              {systemStatus?.counts.sales ?? 0}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setShowHelpModal(true);
            }}
            className="flex items-center justify-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 py-2 px-2 text-[11px] font-medium text-slate-300 hover:text-white transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Como funciona</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('open-pwa-install'));
              }
            }}
            className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 py-2 px-2 text-[11px] font-bold text-emerald-300 transition"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Instalar App</span>
          </button>
        </div>

        {/* Botão de Salvar Backup no Computador */}
        <button
          type="button"
          onClick={async () => {
            try {
              const file = await downloadBackupToFile();
              alert(`Backup exportado com sucesso: ${file}\nGuarde este arquivo na pasta do seu computador para restaurar quando quiser!`);
            } catch (err: any) {
              alert('Falha ao exportar backup: ' + (err?.message || 'Erro desconhecido'));
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 py-1.5 px-2 text-[11px] font-bold text-cyan-300 transition"
          title="Baixa arquivo .JSON com todas as suas chaves e produtos para o seu computador"
        >
          <FolderDown className="w-3.5 h-3.5" />
          <span>Salvar Backup no PC</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#070B12] text-slate-100">
      {/* SIDEBAR DESKTOP (100% TRAVADA, NUNCA ROLA COM A PÁGINA) */}
      <aside className="hidden lg:flex w-72 shrink-0 border-r border-slate-800/80 bg-[#0B101B] flex-col justify-between h-full select-none">
        {renderSidebarContent()}
      </aside>

      {/* DRAWER MOBILE & TABLET (< 1024px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#0B101B] border-r border-slate-800 flex flex-col justify-between h-full shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* COLUNA DIREITA: TOPBAR FIXA + CONTEÚDO CENTRAL COM SCROLL PRÓPRIO */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOPBAR FIXA */}
        <header className="shrink-0 z-20 bg-[#070B12]/95 border-b border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3 space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-3">
          {/* Linha 1 no Mobile: Menu Hamburger + Marca + Indicadores Financeiros */}
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white shrink-0"
                aria-label="Abrir menu"
              >
                <Menu className="w-4 h-4" />
              </button>
              <img
                src="/favicon.svg"
                alt="Logo"
                className="w-7 h-7 rounded-lg shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-white block truncate">
                  {currentModuleMeta.index}. {currentModuleMeta.shortTitle}
                </span>
                <span className="text-[10px] text-emerald-400 block">
                  Ativação: {progressPercent}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 flex items-center gap-1 text-[11px]">
                <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                <strong className="text-white">R$ {exchangeRateBrl.toFixed(2)}</strong>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400"
                title="Ajuda"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                onClick={fetchAllRealData}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                title="Atualizar dados"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingInitial ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Seletor de Segmento em Pílulas */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 overflow-x-auto no-scrollbar max-w-full">
            {SEGMENT_PILLS.map((seg) => {
              const active = selectedSegment === seg.id;
              return (
                <button
                  key={seg.id}
                  onClick={() => {
                    setSelectedSegment(seg.id);
                    if (seg.id === 'ADS_SCALE') handleSelectTab(4);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{seg.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded hidden xl:inline ${
                      active
                        ? 'bg-slate-950/20 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {seg.fee}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Indicadores Financeiros Desktop */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <div className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">USD/BRL:</span>
              <strong className="text-white">R$ {exchangeRateBrl.toFixed(2)}</strong>
            </div>

            <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/30 px-3 py-1.5 text-xs">
              <span className="text-slate-400">Lucro Líquido: </span>
              <strong className="text-emerald-400">
                US$ {(systemStatus?.financials.netUsd ?? 0).toFixed(2)}
              </strong>
            </div>

            <button
              onClick={fetchAllRealData}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              title="Atualizar dados"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingInitial ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </header>

        {/* ÁREA CENTRAL QUE ROLA INDEPENDENTEMENTE */}
        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-24 lg:pb-8"
        >
          <div className="max-w-6xl w-full mx-auto space-y-5">
            {activeTab === 0 && (
              <Module0Setup
                credentials={systemStatus?.credentials || []}
                onRefresh={fetchAllRealData}
                onNavigateTab={handleSelectTab}
              />
            )}

            {activeTab === 1 && (
              <Module1Products
                products={products}
                selectedSegment={selectedSegment}
                exchangeRateBrl={exchangeRateBrl}
                onRefresh={fetchAllRealData}
                onNavigateTab={handleSelectTab}
                onProductCreated={handleProductCreated}
              />
            )}

            {activeTab === 2 && (
              <Module2Copywriting
                products={products}
                creatives={creatives}
                onRefresh={fetchAllRealData}
                onNavigateTab={handleSelectTab}
                onCreativesUpdated={handleCreativesUpdated}
              />
            )}

            {activeTab === 3 && (
              <Module3VideoTikTok
                creatives={creatives}
                onRefresh={fetchAllRealData}
                onNavigateTab={handleSelectTab}
                onCreativesUpdated={handleCreativesUpdated}
              />
            )}

            {activeTab === 4 && (
              <Module4TrafficBot
                campaigns={campaigns}
                products={products}
                logs={systemStatus?.recentLogs || []}
                isMetaConnected={isMetaConnected}
                cronSchedule={
                  systemStatus?.cronState?.schedule || 'A cada 30 min'
                }
                onRefresh={fetchAllRealData}
                onNavigateTab={handleSelectTab}
              />
            )}

            {activeTab === 5 && (
              <Module5SalesWebhooks
                sales={salesData.sales}
                summary={salesData.summary}
                exchange={
                  systemStatus?.exchange || {
                    rate: exchangeRateBrl,
                    bid: exchangeRateBrl,
                    ask: exchangeRateBrl,
                    high: exchangeRateBrl,
                    low: exchangeRateBrl,
                    pctChange: 0,
                    source: 'awesomeapi',
                    timestamp: new Date().toISOString(),
                  }
                }
                onRefresh={fetchAllRealData}
              />
            )}

            {/* Barra Inferior de Próximo Passo */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 text-center sm:text-left">
                Etapa {activeTab} de 5 • Dados salvos em tempo real
              </span>
              <button
                onClick={() => handleSelectTab((activeTab + 1) % 6)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition"
              >
                <span>{currentModuleMeta.nextLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR FIXA NO CELULAR / TABLET (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0B101B]/95 backdrop-blur-md border-t border-slate-800 px-1 py-1.5 grid grid-cols-6 gap-0.5">
        {SIDEBAR_MODULES.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.index;
          const done = isStepDone(item.index);

          return (
            <button
              key={item.index}
              type="button"
              onClick={() => handleSelectTab(item.index)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition relative ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {done && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-1.5 border border-[#0B101B]" />
                )}
              </div>
              <span className="text-[10px] mt-1 truncate max-w-full">
                {item.index}.{item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* MODAL DE AJUDA RÁPIDA */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Como Funciona o Sistema em 5 Passos Simples
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <strong className="text-emerald-300">Passo 0 (Comece com R$ 0,00!):</strong> O sistema já vem com <strong>IA Gratuita e Voz Americana Grátis integradas</strong>. Se quiser IA ainda mais ilimitada grátis, pegue uma chave sem cartão no <strong>Google Gemini</strong> ou <strong>Groq</strong>. OpenAI/Facebook Ads são 100% opcionais!
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-emerald-400">Passo 1 (Produtos):</strong> Crie um E-book próprio em inglês de graça com 1 clique ou escolha um produto de Afiliado (Digistore24/ClickBank — cadastro grátis!).
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-emerald-400">Passo 2 (Copywriting):</strong> Gere 3 campanhas e roteiros completos em inglês americano de graça, com tradução em português ao lado.
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-emerald-400">Passo 3 (Voz & Vídeo Grátis):</strong> Gere a locução americana grátis (.MP3), junte com um vídeo grátis do Pexels em .MP4 e poste no <strong>TikTok, Reels e Shorts sem gastar dinheiro</strong> para fazer suas primeiras vendas em Dólar!
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-emerald-400">Passos 4 e 5 (Escala & Vendas):</strong> Depois que lucrar suas primeiras vendas, use a Aba 4 para gerenciar Tráfego Pago com Stop-Loss e receba suas vendas na Aba 5 via Webhook Kiwify/Shopify.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full sm:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950"
              >
                Entendi, voltar ao painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
