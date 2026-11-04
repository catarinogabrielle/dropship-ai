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
  HelpCircle,
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
    <div className="space-y-6">
      {/* Guia Passo a Passo para Iniciantes sobre como Receber as Vendas */}
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
          <HelpCircle className="w-4 h-4" />
          COMO USAR ESTA TELA (PASSO 5 — CONECTAR SEU CHECKOUT E ACOMPANHAR SEU LUCRO EM DÓLAR E REAL)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
            <strong className="text-white block mb-1">
              1️⃣ Copie o Link de Notificação abaixo:
            </strong>
            Clique em <strong>&ldquo;Copiar Link da Kiwify&rdquo;</strong> (se você vende infoprodutos) ou <strong>&ldquo;Copiar Link da Shopify&rdquo;</strong> (se você faz Dropshipping físico).
          </div>
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
            <strong className="text-white block mb-1">
              2️⃣ Cole lá na sua conta da Kiwify / Shopify:
            </strong>
            Sempre que um americano comprar seu produto em Dólar, a Kiwify/Shopify avisa este link automaticamente no mesmo segundo.
          </div>
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
            <strong className="text-white block mb-1">
              3️⃣ Conversão em Reais + Aviso ao Facebook:
            </strong>
            O sistema desconta a taxa da plataforma, converte seu lucro para Reais pelo dólar do minuto e avisa o Pixel do Facebook (CAPI) para encontrar mais compradores parecidos!
          </div>
        </div>
      </div>

      {/* Cards de Receita e Lucro Líquido Real (100% Banco de Dados + Câmbio Real) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
          <span className="text-xs font-bold text-slate-400 block">
            Total Vendido Bruto (Em Dólar)
          </span>
          <span className="text-2xl font-extrabold text-white mt-1 block">
            US$ {summary.grossUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary.count} vendas aprovadas registradas
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
          <span className="text-xs font-bold text-slate-400 block">
            Taxas da Plataforma Descontadas
          </span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
            -US$ {summary.gatewayFeeUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Kiwify (9.99% + $0.80) • Shopify (2.9% + $0.30)
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/85 p-5">
          <span className="text-xs font-bold text-emerald-300 block">
            Seu Dinheiro Limpo em Dólar
          </span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
            US$ {summary.netUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Valor que entra na sua conta após taxas
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/70 to-slate-900 p-5">
          <span className="text-xs font-bold text-emerald-200 block">
            Seu Dinheiro Convertido em Reais (R$)
          </span>
          <span className="text-2xl font-extrabold text-white mt-1 block">
            R$ {summary.liveConvertedNetBrl.toFixed(2)}
          </span>
          <span className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Dólar Agora: R$ {exchange.rate.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Configuração Passo a Passo dos Links de Webhook */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Opção A: Para quem vende na Kiwify Internacional
            </span>
            <a
              href="https://dashboard.kiwify.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-amber-300 hover:underline inline-flex items-center gap-1"
            >
              Abrir Kiwify <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <h3 className="text-base font-extrabold text-white">
            Link para Colar na Kiwify (Apps &rarr; Webhooks)
          </h3>
          <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
            <li>Clique em <strong>&ldquo;Copiar Link da Kiwify&rdquo;</strong> abaixo.</li>
            <li>No painel da Kiwify, clique em <strong>Apps &rarr; Webhooks &rarr; Criar Webhook</strong>.</li>
            <li>Cole este link no campo &ldquo;URL do Webhook&rdquo; e marque <strong>&ldquo;Compra aprovada&rdquo;</strong>.</li>
          </ol>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={kiwifyWebhookUrl}
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs font-mono text-emerald-300"
            />
            <button
              onClick={() => handleCopy(kiwifyWebhookUrl, 'kiwify')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-white transition shrink-0"
            >
              {copiedEndpoint === 'kiwify' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Link da Kiwify
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-500/20 text-lime-300 border border-lime-500/30">
              Opção B: Para quem vende na Shopify EUA
            </span>
            <a
              href="https://admin.shopify.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-lime-300 hover:underline inline-flex items-center gap-1"
            >
              Abrir Shopify <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <h3 className="text-base font-extrabold text-white">
            Link para Colar na Shopify (Settings &rarr; Notifications)
          </h3>
          <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
            <li>Clique em <strong>&ldquo;Copiar Link da Shopify&rdquo;</strong> abaixo.</li>
            <li>Na sua Shopify, vá em <strong>Settings &rarr; Notifications &rarr; Webhooks</strong>.</li>
            <li>Clique em <strong>Create webhook</strong>, escolha <strong>Order payment</strong> e cole este link.</li>
          </ol>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={shopifyWebhookUrl}
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs font-mono text-emerald-300"
            />
            <button
              onClick={() => handleCopy(shopifyWebhookUrl, 'shopify')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-lime-600 hover:bg-lime-500 px-4 py-2.5 text-xs font-extrabold text-white transition shrink-0"
            >
              {copiedEndpoint === 'shopify' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Link da Shopify
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Vendas Reais Recebidas via Webhook */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Suas Vendas Reais em Dólar ({sales.length})
            </h3>
          </div>
          <button
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="p-10 text-center">
            <Webhook className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-base font-bold text-white">
              Aguardando sua primeira venda em Dólar
            </h4>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1">
              Assim que você colar o link acima na sua Kiwify ou Shopify e realizar uma venda aprovada, ela aparecerá automaticamente aqui com o valor exato em Dólar e em Reais!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4">Código do Pedido</th>
                  <th className="py-3 px-3">Plataforma</th>
                  <th className="py-3 px-3">País do Cliente</th>
                  <th className="py-3 px-3">Valor Pago (USD)</th>
                  <th className="py-3 px-3">Taxa Descontada</th>
                  <th className="py-3 px-3">Seu Lucro (USD)</th>
                  <th className="py-3 px-3">Dólar do Dia</th>
                  <th className="py-3 px-3">Seu Lucro em Reais</th>
                  <th className="py-3 px-3">Aviso ao Facebook</th>
                  <th className="py-3 px-3">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {sale.externalOrderId}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium">
                        {sale.platform}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-300">
                      {sale.customerCountry}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      US$ {sale.grossUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-amber-400">
                      -US$ {sale.gatewayFeeUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      US$ {sale.netUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      R$ {sale.exchangeRateBrl.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-300">
                      R$ {sale.netBrl.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      {sale.capiSent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <ShieldCheck className="w-3 h-3" />
                          Pixel Avisado
                        </span>
                      ) : (
                        <span className="text-slate-500">Registrado</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
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
