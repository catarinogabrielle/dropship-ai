'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ExternalLink,
  Copy,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Webhook,
  ArrowUpRight,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Check,
} from 'lucide-react';
import { SaleData, ExchangeInfo } from '@/types/autopilot';

interface Module5SalesWebhooksProps {
  sales: SaleData[];
  summary: {
    grossUsd: number;
    gatewayFeeUsd: number;
    netUsd: number;
    liveConvertedNetBrl: number;
    count: number;
  };
  exchange: ExchangeInfo | {
    rate: number;
    source: string;
    updatedAt?: string;
    timestamp?: string;
  };
  onRefresh: () => Promise<void>;
}

export default function Module5SalesWebhooks({
  sales,
  summary,
  exchange,
  onRefresh,
}: Module5SalesWebhooksProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [testingWebhooks, setTestingWebhooks] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [expandedGuide, setExpandedGuide] = useState<string | null>('kiwify');

  const [webhookHealth, setWebhookHealth] = useState<
    Record<string, { ok: boolean; statusText: string; latencyMs: number }>
  >({});

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const kiwifyWebhookUrl = `${origin}/api/webhooks/kiwify`;
  const shopifyWebhookUrl = `${origin}/api/webhooks/shopify`;

  const handleCopy = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedEndpoint(key);
    setTimeout(() => setCopiedEndpoint(null), 2500);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestWebhooks = async () => {
    setTestingWebhooks(true);
    const endpoints = [
      { key: 'kiwify', path: '/api/webhooks/kiwify' },
      { key: 'shopify', path: '/api/webhooks/shopify' },
    ];

    const results: Record<string, { ok: boolean; statusText: string; latencyMs: number }> = {};

    for (const ep of endpoints) {
      const start = Date.now();
      try {
        const res = await fetch(ep.path, { method: 'GET' });
        const latencyMs = Date.now() - start;
        results[ep.key] = {
          ok: res.ok,
          statusText: res.ok ? '200 OK • Online' : `Erro HTTP ${res.status}`,
          latencyMs,
        };
      } catch (err: any) {
        results[ep.key] = {
          ok: false,
          statusText: 'Inacessível',
          latencyMs: Date.now() - start,
        };
      }
    }

    setWebhookHealth(results);
    setTestingWebhooks(false);
  };

  // Testa automaticamente na primeira carga
  useEffect(() => {
    handleTestWebhooks();
  }, []);

  return (
    <div className="space-y-5">
      {/* 4 KPI CARDS FINANCEIROS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-3.5 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Bruto (USD)
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-white mt-1 block">
            US$ {summary.grossUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {summary.count} vendas registradas
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-3.5 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Taxas Checkout
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-amber-400 mt-1 block">
            -US$ {summary.gatewayFeeUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            Kiwify / Shopify
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/75 p-3.5 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-300 block truncate">
            Líquido (USD)
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-1 block">
            US$ {summary.netUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
            Livre de taxas de cartão
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-3.5 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-200 block truncate">
            Líquido em R$
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-white mt-1 block">
            R$ {summary.liveConvertedNetBrl.toFixed(2)}
          </span>
          <span className="text-[11px] text-emerald-300 mt-0.5 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 shrink-0" />
            US$ 1 = R$ {exchange.rate.toFixed(2)} (Banco Central)
          </span>
        </div>
      </div>

      {/* GUIA DIDÁTICO: O QUE É UM WEBHOOK & COMO FUNCIONA */}
      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                O que é um Webhook e para que servem estes links?
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Explicação Simples
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Entenda como sua loja avisa este robô em tempo real sem você precisar fazer nada manualmente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTestWebhooks}
              disabled={testingWebhooks}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${testingWebhooks ? 'animate-spin' : ''}`} />
              {testingWebhooks ? 'Testando...' : 'Verificar Status dos Webhooks'}
            </button>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={showExplanation ? 'Ocultar Explicação' : 'Exibir Explicação'}
            >
              {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showExplanation && (
          <div className="space-y-4 pt-2 border-t border-slate-800/80 text-xs">
            {/* FLUXO VISUAL EM 4 ETAPAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3" /> 1. Venda nos EUA
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Um cliente americano compra seu produto (E-book ou Físico) na Kiwify Internacional ou Shopify US.
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1">
                  <Webhook className="w-3 h-3" /> 2. Disparo Automático
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  A plataforma envia imediatamente um pacote de dados para o link de webhook correspondente abaixo.
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> 3. Cálculo de Lucro Líquido
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  O robô desconta a taxa de checkout, converte o Dólar em Reais na cotação do dia e salva na tabela.
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 4. Otimização no Meta Ads
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  O robô dispara o evento CAPI para o Pixel do Facebook/Instagram com hash do e-mail para baratear seus anúncios.
                </p>
              </div>
            </div>

            {/* SELETORES DE TUTORIAL PASSO A PASSO */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 block">
                Onde colar cada link na sua plataforma? (Clique para ver o tutorial):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedGuide(expandedGuide === 'kiwify' ? null : 'kiwify')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    expandedGuide === 'kiwify'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  📘 Passo a Passo Kiwify
                  {expandedGuide === 'kiwify' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedGuide(expandedGuide === 'shopify' ? null : 'shopify')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    expandedGuide === 'shopify'
                      ? 'bg-lime-500/20 border-lime-500 text-lime-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 Passo a Passo Shopify
                  {expandedGuide === 'shopify' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {expandedGuide === 'kiwify' && (
                <div className="rounded-xl bg-slate-950 border border-amber-500/30 p-3.5 space-y-1.5 text-slate-300">
                  <p className="font-bold text-amber-300 text-xs">Configurando o Webhook na Kiwify:</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                    <li>Entre no painel da <strong>Kiwify</strong> e clique em <strong>Apps &rarr; Webhooks</strong>.</li>
                    <li>Clique no botão verde <strong>&quot;Criar Webhook&quot;</strong>.</li>
                    <li>No campo <strong>Nome</strong>, digite: <code className="text-amber-300 font-mono">Autopilot Dólar IA</code>.</li>
                    <li>No campo <strong>URL do Webhook</strong>, cole a URL do Kiwify abaixo.</li>
                    <li>Em <strong>Eventos</strong>, marque a caixa: <strong>&quot;Compra aprovada&quot;</strong>.</li>
                    <li>Clique em <strong>Salvar</strong>. Pronto! Cada venda aprovada será computada automaticamente.</li>
                  </ol>
                </div>
              )}

              {expandedGuide === 'shopify' && (
                <div className="rounded-xl bg-slate-950 border border-lime-500/30 p-3.5 space-y-1.5 text-slate-300">
                  <p className="font-bold text-lime-300 text-xs">Configurando o Webhook na Shopify:</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                    <li>Entre no painel da sua loja <strong>Shopify</strong> e clique em <strong>Settings (Configurações)</strong> no canto inferior esquerdo.</li>
                    <li>Clique em <strong>Notifications (Notificações)</strong> &rarr; role até o final da página até <strong>Webhooks</strong>.</li>
                    <li>Clique em <strong>&quot;Create webhook&quot; (Criar webhook)</strong>.</li>
                    <li>Em <strong>Event (Evento)</strong>, selecione: <code className="text-lime-300 font-mono">Order payment (Pagamento do pedido)</code>.</li>
                    <li>Em <strong>Format (Formato)</strong>, selecione: <strong>JSON</strong>.</li>
                    <li>No campo <strong>URL</strong>, cole a URL da Shopify abaixo e clique em <strong>Save (Salvar)</strong>.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2 CARDS DE WEBHOOKS (KIWIFY & SHOPIFY) - URL TOTALMENTE VISÍVEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CARD KIWIFY */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-amber-300 block">
                  Webhook Kiwify Internacional
                </span>
                {webhookHealth.kiwify && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      webhookHealth.kiwify.ok
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {webhookHealth.kiwify.ok ? (
                      <>
                        <Check className="w-2.5 h-2.5" /> 200 OK
                      </>
                    ) : (
                      'Erro'
                    )}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Taxa: 9.99% + US$ 0.80 • Produtos Digitais & E-books
              </span>
            </div>
            <a
              href="https://dashboard.kiwify.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-amber-300 hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Abrir Kiwify <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 break-all select-all leading-relaxed">
              {kiwifyWebhookUrl}
            </div>

            <button
              onClick={() => handleCopy(kiwifyWebhookUrl, 'kiwify')}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 py-2 text-xs font-extrabold text-white transition shadow-sm"
            >
              {copiedEndpoint === 'kiwify' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  URL Copiada com Sucesso!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Link Kiwify
                </>
              )}
            </button>
          </div>
        </div>

        {/* CARD SHOPIFY */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-lime-300 block">
                  Webhook Shopify US
                </span>
                {webhookHealth.shopify && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      webhookHealth.shopify.ok
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {webhookHealth.shopify.ok ? (
                      <>
                        <Check className="w-2.5 h-2.5" /> 200 OK
                      </>
                    ) : (
                      'Erro'
                    )}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Taxa: 2.9% + US$ 0.30 • Dropshipping Físico EUA
              </span>
            </div>
            <a
              href="https://admin.shopify.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-lime-300 hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Abrir Shopify <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 break-all select-all leading-relaxed">
              {shopifyWebhookUrl}
            </div>

            <button
              onClick={() => handleCopy(shopifyWebhookUrl, 'shopify')}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-lime-600 hover:bg-lime-500 py-2 text-xs font-extrabold text-white transition shadow-sm"
            >
              {copiedEndpoint === 'shopify' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  URL Copiada com Sucesso!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Link Shopify
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TABELA DE VENDAS REAIS */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Vendas Recebidas em Tempo Real ({sales.length})
            </h3>
          </div>
          <button
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar Vendas
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="p-8 text-center">
            <Webhook className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">Nenhuma venda recebida ainda</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Assim que a Kiwify Internacional ou a Shopify US disparar o webhook de compra aprovada, a venda aparecerá nesta tabela automaticamente convertida em Dólar e Reais.
            </p>
          </div>
        ) : (
          <>
            {/* VISÃO EM CARDS NO CELULAR (< 768px) */}
            <div className="md:hidden divide-y divide-slate-800/70">
              {sales.map((sale) => (
                <div key={sale.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">
                      #{sale.externalOrderId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] font-bold">
                      {sale.platform} • {sale.customerCountry}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Bruto</span>
                      <span className="font-bold text-white">${sale.grossUsd.toFixed(2)}</span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Líquido USD</span>
                      <span className="font-bold text-emerald-400">${sale.netUsd.toFixed(2)}</span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Líquido R$</span>
                      <span className="font-bold text-emerald-300">R$ {sale.netBrl.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(sale.createdAt).toLocaleString('pt-BR')}</span>
                    {sale.capiSent && (
                      <span className="text-emerald-400 font-semibold">CAPI Enviado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* TABELA NO TABLET E DESKTOP (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-4">Pedido</th>
                    <th className="py-2.5 px-3">Plataforma</th>
                    <th className="py-2.5 px-3">País</th>
                    <th className="py-2.5 px-3">Bruto (USD)</th>
                    <th className="py-2.5 px-3">Taxa</th>
                    <th className="py-2.5 px-3">Líquido (USD)</th>
                    <th className="py-2.5 px-3">Câmbio</th>
                    <th className="py-2.5 px-3">Líquido (R$)</th>
                    <th className="py-2.5 px-3">Meta CAPI</th>
                    <th className="py-2.5 px-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-white">
                        {sale.externalOrderId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium text-[11px]">
                          {sale.platform}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">
                        {sale.customerCountry}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        ${sale.grossUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-amber-400">
                        -${sale.gatewayFeeUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        ${sale.netUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        R$ {sale.exchangeRateBrl.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-300">
                        R$ {sale.netBrl.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        {sale.capiSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            Enviado
                          </span>
                        ) : (
                          <span className="text-slate-500">Salvo</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(sale.createdAt).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
