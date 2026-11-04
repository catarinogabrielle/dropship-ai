'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  Package,
  PenTool,
  Video,
  Bot,
  DollarSign,
  CheckCircle2,
  Circle,
  ArrowRight,
  RefreshCw,
  Database,
  TrendingUp,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import {
  SystemStatusData,
  ProductData,
  CreativeData,
  CampaignData,
  SaleData,
  SegmentType,
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
    label: '0. 🚀 Comece Aqui: Conectar Contas (Passo a Passo)',
    shortTitle: 'Conectar Contas',
    subtitle: 'Ensina onde clicar para conectar OpenAI, Kiwify, Facebook e Google',
    icon: Rocket,
    footerExplanation:
      'Tudo pronto neste passo? Clique no botão verde ao lado para ir ao Passo 1, onde vamos escolher um produto e calcular quanto você vai ganhar em Dólar e em Reais!',
    nextStepLabel: 'Ir para o Passo 1: Escolher Produto & Calcular Lucro →',
  },
  {
    index: 1,
    label: '1. 📦 Meus Produtos & Simulador de Lucro (USD/R$)',
    shortTitle: 'Produtos & Simulador',
    subtitle: 'Cole o link de um produto e veja quanto ele dá de lucro em Reais',
    icon: Package,
    footerExplanation:
      'Depois de salvar seu produto acima, clique no botão ao lado para ir ao Passo 2: a Inteligência Artificial vai escrever seus anúncios em inglês (com tradução em português)!',
    nextStepLabel: 'Ir para o Passo 2: Criar Textos de Vendas em Inglês →',
  },
  {
    index: 2,
    label: '2. ✍️ Criar Textos e Anúncios em Inglês (IA)',
    shortTitle: 'Textos em Inglês',
    subtitle: 'Cria anúncios prontos para Facebook, Google e TikTok sem falar inglês',
    icon: PenTool,
    footerExplanation:
      'Seus roteiros e anúncios em inglês já estão salvos! Agora clique no botão ao lado para ir ao Passo 3 e gravar a voz de um locutor americano lendo seu texto.',
    nextStepLabel: 'Ir para o Passo 3: Gravar Voz Americana e Vídeo →',
  },
  {
    index: 3,
    label: '3. 🎬 Fábrica de Voz Americana & Vídeos (.MP4)',
    shortTitle: 'Voz & Vídeo',
    subtitle: 'Grava locução nativa, junta com seu vídeo e baixa ou posta no TikTok',
    icon: Video,
    footerExplanation:
      'Com seu vídeo pronto em mãos, clique no botão ao lado para ir ao Passo 4: aprender a subir seu anúncio no Facebook/Google e ativar o Robô que protege seu dinheiro.',
    nextStepLabel: 'Ir para o Passo 4: Robô de Anúncios (Facebook/Google) →',
  },
  {
    index: 4,
    label: '4. 🤖 Robô Protetor de Anúncios (Facebook & Google)',
    shortTitle: 'Robô de Anúncios',
    subtitle: 'Pausa anúncios que não vendem e aumenta os que dão lucro sozinho',
    icon: Bot,
    footerExplanation:
      'Agora clique no botão ao lado para ir ao Passo 5 e pegar o Link de Notificação para colar na sua Kiwify ou Shopify e acompanhar cada venda caindo em Dólar!',
    nextStepLabel: 'Ir para o Passo 5: Minhas Vendas em Dólar & Links →',
  },
  {
    index: 5,
    label: '5. 💰 Minhas Vendas em Dólar & Links da Kiwify/Shopify',
    shortTitle: 'Vendas em Dólar',
    subtitle: 'Veja cada venda convertida para Reais na cotação do minuto',
    icon: DollarSign,
    footerExplanation:
      'Parabéns! Você percorreu todos os 5 passos da operação internacional em Dólar. Clique ao lado se quiser voltar à Central de Contas (Passo 0).',
    nextStepLabel: 'Voltar ao Passo 0: Central de Contas →',
  },
];

const SEGMENT_TABS: {
  id: SegmentType;
  title: string;
  feeBadge: string;
  subtitle: string;
}[] = [
  {
    id: 'KIWIFY_GLOBAL',
    title: '1. Kiwify Internacional (Vender E-books / Cursos em Dólar)',
    feeBadge: 'Mais Fácil p/ Começar • Taxa: 9.99% + $0.80',
    subtitle: 'Você não precisa de estoque nem frete. O cliente paga em Dólar e recebe no e-mail.',
  },
  {
    id: 'SHOPIFY_US',
    title: '2. Dropshipping Físico EUA (Shopify + Fornecedor EUA)',
    feeBadge: 'Produtos Físicos • Taxa: 2.9% + $0.30',
    subtitle: 'Você vende na sua loja e o fornecedor americano entrega na casa do cliente.',
  },
  {
    id: 'TIKTOK_SHOP',
    title: '3. TikTok US & Vídeos Virais (Sem Gastar com Anúncio)',
    feeBadge: 'Tráfego Orgânico / TikTok Shop • Taxa: 6.0%',
    subtitle: 'Gere vídeos em inglês na Aba 3 e poste no TikTok para atrair compradores.',
  },
  {
    id: 'ADS_SCALE',
    title: '4. Facebook Ads & Google Ads (Escala com Robô)',
    feeBadge: 'Anúncios Automáticos nos EUA',
    subtitle: 'Suba seus anúncios e deixe o Robô da Aba 4 vigiar a cada 30 minutos.',
  },
];

export default function AutopilotDashboardPage() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedSegment, setSelectedSegment] =
    useState<SegmentType>('KIWIFY_GLOBAL');
  const [showWelcomeGuide, setShowWelcomeGuide] = useState<boolean>(true);

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
        selectedSegment === 'ADS_SCALE' ? 'ALL' : selectedSegment;

      const [statusRes, prodRes, creatRes, adsRes, salesRes] =
        await Promise.all([
          fetch('/api/system/status', { cache: 'no-store' }),
          fetch(`/api/products?segment=${segParam}`, { cache: 'no-store' }),
          fetch(`/api/creatives?segment=${segParam}`, { cache: 'no-store' }),
          fetch('/api/ads/sync', { cache: 'no-store' }),
          fetch(`/api/sales?segment=${segParam}`, { cache: 'no-store' }),
        ]);

      if (statusRes.ok) {
        const st = await statusRes.json();
        setSystemStatus(st);
      }
      if (prodRes.ok) {
        const pr = await prodRes.json();
        setProducts(pr.products || []);
      }
      if (creatRes.ok) {
        const cr = await creatRes.json();
        setCreatives(cr.creatives || []);
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

  useEffect(() => {
    fetchAllRealData();
  }, [fetchAllRealData]);

  const progressPercent = systemStatus?.progressPercent ?? 0;
  const exchangeRateBrl = systemStatus?.exchange?.rate ?? 5.48;
  const currentModuleMeta = SIDEBAR_MODULES[activeTab] || SIDEBAR_MODULES[0];
  const isMetaConnected = Boolean(
    systemStatus?.credentials?.some(
      (c) => c.provider === 'META_ADS' && c.isVerified
    )
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100">
      {/* MENU DE NAVEGAÇÃO LATERAL ESQUERDO (SIDEBAR GUIADA PASSO A PASSO) */}
      <aside className="w-full lg:w-84 xl:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/90 bg-slate-900/95 flex flex-col justify-between">
        <div className="p-5 space-y-5">
          {/* Logo e Subtítulo Claro */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white">
                Piloto Automático de Vendas em Dólar
              </h1>
              <span className="text-xs font-medium text-emerald-400 block">
                Venda nos EUA morando no Brasil • Passo a Passo
              </span>
            </div>
          </div>

          {/* Barra de Progresso Real de Ativação (0% a 100%) */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white">
                Checklist do Seu Negócio em Dólar
              </span>
              <span className="text-sm font-extrabold text-emerald-400">
                {progressPercent}% Concluído
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Clique em qualquer item abaixo para ir direto à tela correspondente:
            </p>

            <ul className="space-y-2 pt-1">
              {(systemStatus?.steps || []).map((step) => (
                <li
                  key={step.id}
                  onClick={() => setActiveTab(step.tabIndex)}
                  className="flex items-start gap-2 text-xs cursor-pointer group p-1.5 rounded-lg hover:bg-slate-900 transition"
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-amber-400 group-hover:text-emerald-300 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={
                      step.completed
                        ? 'text-emerald-300 font-semibold'
                        : 'text-slate-300 group-hover:text-white'
                    }
                  >
                    <strong>Passo {step.id}:</strong> {step.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Numerados na Sidebar com Explicação */}
          <nav className="space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-2">
              Menu Passo a Passo (Siga na Ordem 0 &rarr; 5)
            </div>
            {SIDEBAR_MODULES.map((item) => {
              const isActive = activeTab === item.index;
              return (
                <button
                  key={item.index}
                  onClick={() => setActiveTab(item.index)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition flex flex-col gap-0.5 border ${
                    isActive
                      ? 'bg-emerald-500/20 text-white border-emerald-500/50 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold leading-snug">
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-slate-950 font-extrabold shrink-0">
                        Você está aqui
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    {item.subtitle}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Status do Banco SQLite & Câmbio ao Vivo no Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Cotação do Dólar Agora:</span>
            <strong className="text-emerald-400">
              1 USD = R$ {exchangeRateBrl.toFixed(2)}
            </strong>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Produtos / Anúncios / Vendas:</span>
            <strong className="text-white">
              {systemStatus?.counts.products ?? 0} /{' '}
              {systemStatus?.counts.creatives ?? 0} /{' '}
              {systemStatus?.counts.sales ?? 0}
            </strong>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR: Boas-vindas + Cotação do Dólar em Tempo Real + Abas por Segmento */}
        <header className="border-b border-slate-800 bg-slate-900/70 px-6 py-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                VOCÊ ESTÁ NO PASSO {activeTab} DE 5
              </span>
              <h2 className="text-xl font-extrabold text-white">
                {currentModuleMeta.label}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowWelcomeGuide(!showWelcomeGuide)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3.5 py-2 text-xs font-extrabold text-amber-300 transition"
              >
                <HelpCircle className="w-4 h-4" />
                {showWelcomeGuide
                  ? 'Esconder Guia "O Que É Este Sistema"'
                  : '❓ Primeiro Acesso? Clique Aqui para Entender Tudo'}
              </button>

              {/* Card Cotação USD -> BRL ao vivo */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div className="text-xs">
                  <span className="text-slate-400">1 Dólar vale hoje: </span>
                  <strong className="text-emerald-400">
                    R$ {exchangeRateBrl.toFixed(2)}
                  </strong>
                </div>
              </div>

              <button
                onClick={fetchAllRealData}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="Atualizar dados"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingInitial ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* PAINEL EXPLICATIVO PARA PRIMEIRO ACESSO ("MODO INICIANTE / MARIDO") */}
          {showWelcomeGuide && (
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-900 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300 uppercase">
                    <BookOpen className="w-4 h-4" />
                    BEM-VINDO! ENTENDA EM 1 MINUTO O QUE É ESTA PLATAFORMA E COMO OPERÁ-LA:
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    Como funciona esta máquina de vendas em Dólar (Mesmo se você nunca vendeu na internet e não fala inglês):
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWelcomeGuide(false)}
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 shrink-0"
                >
                  Fechar guia <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <div
                  onClick={() => setActiveTab(0)}
                  className="cursor-pointer rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 p-3.5 space-y-1 transition"
                >
                  <span className="text-emerald-400 font-extrabold block">
                    🔑 PASSO 0: Conectar IA
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Você cria sua chave na OpenAI seguindo nosso tutorial clique a clique e cola aqui. É ela que vai fazer todo o trabalho pesado em inglês por você.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab(1)}
                  className="cursor-pointer rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 p-3.5 space-y-1 transition"
                >
                  <span className="text-emerald-400 font-extrabold block">
                    📦 PASSO 1: Escolher Produto
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Você cola o link de um produto (E-book na Kiwify ou produto físico na Shopify) e descobre na hora quantas vendas por dia precisa para ganhar R$ 15.000+/mês.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab(2)}
                  className="cursor-pointer rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 p-3.5 space-y-1 transition"
                >
                  <span className="text-emerald-400 font-extrabold block">
                    ✍️ PASSO 2: Textos em Inglês
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Com 1 clique, o sistema escreve os roteiros de vídeo e os textos dos anúncios em inglês americano perfeito, com a tradução em português do lado!
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab(3)}
                  className="cursor-pointer rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 p-3.5 space-y-1 transition"
                >
                  <span className="text-emerald-400 font-extrabold block">
                    🎬 PASSO 3: Voz e Vídeo
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    O sistema gera a voz de um americano nativo lendo seu roteiro, junta com um vídeo e entrega o arquivo `.MP4` pronto para você baixar ou postar no TikTok.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab(4)}
                  className="cursor-pointer rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 p-3.5 space-y-1 transition"
                >
                  <span className="text-emerald-400 font-extrabold block">
                    🤖 PASSOS 4 & 5: Anúncios e Dólar
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    O robô vigia seus anúncios no Facebook (pausando se não vender) e mostra na Aba 5 cada venda em Dólar já convertida para Reais!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ABAS SUPERIORES POR MODALIDADE DE NEGÓCIO */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Escolha abaixo qual modalidade de venda em Dólar você quer operar (você pode alternar quando quiser):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              {SEGMENT_TABS.map((seg) => {
                const active = selectedSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => {
                      setSelectedSegment(seg.id);
                      if (seg.id === 'ADS_SCALE') {
                        setActiveTab(4);
                      }
                    }}
                    className={`text-left rounded-xl p-3 border transition ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm'
                        : 'bg-slate-950/70 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                        {seg.feeBadge}
                      </span>
                      {active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold">
                          Selecionado
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-extrabold text-white leading-snug">
                      {seg.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-normal">
                      {seg.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* CONTEÚDO DO MÓDULO ATIVO */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 0 && (
            <Module0Setup
              credentials={systemStatus?.credentials || []}
              onRefresh={fetchAllRealData}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 1 && (
            <Module1Products
              products={products}
              selectedSegment={selectedSegment}
              exchangeRateBrl={exchangeRateBrl}
              onRefresh={fetchAllRealData}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 2 && (
            <Module2Copywriting
              products={products}
              creatives={creatives}
              onRefresh={fetchAllRealData}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 3 && (
            <Module3VideoTikTok
              creatives={creatives}
              onRefresh={fetchAllRealData}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 4 && (
            <Module4TrafficBot
              campaigns={campaigns}
              products={products}
              logs={systemStatus?.recentLogs || []}
              isMetaConnected={isMetaConnected}
              cronSchedule={
                systemStatus?.cronState?.schedule || '*/30 * * * * (A cada 30 min)'
              }
              onRefresh={fetchAllRealData}
              onNavigateTab={setActiveTab}
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
                  source: 'economia.awesomeapi.com.br',
                  timestamp: new Date().toISOString(),
                }
              }
              onRefresh={fetchAllRealData}
            />
          )}

          {/* RODAPÉ GUIADO EM TODAS AS TELAS PARA INICIANTES */}
          <footer className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                <Database className="w-4 h-4" />
                PRÓXIMO PASSO DA SUA JORNADA (VOCÊ ESTÁ NO PASSO {activeTab} DE 5)
              </div>
              <p className="text-sm text-slate-200 max-w-2xl">
                {currentModuleMeta.footerExplanation}
              </p>
            </div>

            <button
              onClick={() => setActiveTab((activeTab + 1) % 6)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 transition shrink-0 shadow-lg shadow-emerald-950/60"
            >
              <span>{currentModuleMeta.nextStepLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
