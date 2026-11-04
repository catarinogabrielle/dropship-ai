'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Webhook,
  Copy,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { SaleData, ExchangeInfo } from '@/types/autopilot';

interface Module5SalesWebhooksProps {
  sales: SaleData[];
  exchange: ExchangeInfo;
  summary: {
    count: number;
    grossUsd: number;
    gatewayFeeUsd: number;
    netUsd: number;
    netBrl: number;
    liveConvertedNetBrl: number;
  };
  onRefresh: () => Promise<void>;
}

export default function Module5SalesWebhooks({
  sales,
  exchange,
  summary,
  onRefresh,
}: Module5SalesWebhooksProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <div className="space-y-5">
      {/* 4 KPI CARDS FINANCEIROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Faturamento Bruto (USD)
          </span>
          <span className="text-xl font-extrabold text-white mt-1 block">
            US$ {summary.grossUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {summary.count} vendas aprovadas
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Taxas de Checkout
          </span>
          <span className="text-xl font-extrabold text-amber-400 mt-1 block">
            -US$ {summary.gatewayFeeUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Kiwify (9.99%+$0.80) • Shopify (2.9%+$0.30)
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/75 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
            Lucro Líquido (USD)
          </span>
          <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
            US$ {summary.netUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Líquido após taxas da plataforma
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block">
            Lucro Convertido em Reais
          </span>
          <span className="text-xl font-extrabold text-white mt-1 block">
            R$ {summary.liveConvertedNetBrl.toFixed(2)}
          </span>
          <span className="text-[11px] text-emerald-300 mt-0.5 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            Cotação: R$ {exchange.rate.toFixed(2)}
          </span>
        </div>
      </div>

      {/* LINKS DE WEBHOOK COMPACTOS (KIWIFY & SHOPIFY) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-amber-300 block">
                Webhook Kiwify Internacional
              </span>
              <span className="text-[11px] text-slate-400">
                Cole em: Kiwify &rarr; Apps &rarr; Webhooks (Evento: Compra aprovada)
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

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={kiwifyWebhookUrl}
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-emerald-300"
            />
            <button
              onClick={() => handleCopy(kiwifyWebhookUrl, 'kiwify')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-white transition shrink-0"
            >
              {copiedEndpoint === 'kiwify' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar URL
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-lime-300 block">
                Webhook Shopify US
              </span>
              <span className="text-[11px] text-slate-400">
                Cole em: Settings &rarr; Notifications &rarr; Webhooks (Order payment)
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

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shopifyWebhookUrl}
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-emerald-300"
            />
            <button
              onClick={() => handleCopy(shopifyWebhookUrl, 'shopify')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-lime-600 hover:bg-lime-500 px-3.5 py-2 text-xs font-extrabold text-white transition shrink-0"
            >
              {copiedEndpoint === 'shopify' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar URL
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
            Atualizar
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="p-8 text-center">
            <Webhook className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">Nenhuma venda registrada ainda</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Assim que a Kiwify ou Shopify disparar o webhook de pagamento aprovado, o pedido aparecerá aqui convertido em Dólar e Reais.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
        )}
      </div>
    </div>
  );
}
