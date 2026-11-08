'use client';

import React, { useState } from 'react';
import {
  Bot,
  RefreshCw,
  Play,
  ShieldAlert,
  TrendingUp,
  Activity,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  ExternalLink,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CampaignData,
  ProductData,
  AutomationLogData,
} from '@/types/autopilot';
import { getClientCredentialsPayload } from '@/lib/storage-persistence';

interface Module4TrafficBotProps {
  campaigns: CampaignData[];
  products: ProductData[];
  logs: AutomationLogData[];
  isMetaConnected: boolean;
  cronSchedule: string;
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: number) => void;
}

export default function Module4TrafficBot({
  campaigns,
  products,
  logs,
  isMetaConnected,
  onRefresh,
  onNavigateTab,
}: Module4TrafficBotProps) {
  const [syncing, setSyncing] = useState(false);
  const [runningBot, setRunningBot] = useState(false);
  const [showAdsGuide, setShowAdsGuide] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSyncMetaAds = async () => {
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/ads/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId || undefined,
          _vaultCredentials: getClientCredentialsPayload(),
          _vaultProducts: products,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          text:
            data.error ||
            'Erro ao buscar anúncios. Verifique se o Facebook Ads está conectado na Aba 0.',
        });
      } else {
        setStatusMsg({
          type: 'success',
          text: `Sincronizado! ${data.syncedCount} conjuntos de anúncios importados do Facebook Ads.`,
        });
        await onRefresh();
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Falha ao chamar /api/ads/sync',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRunAutopilotNow = async () => {
    setRunningBot(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/ads/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _vaultCredentials: getClientCredentialsPayload(),
          _vaultProducts: products,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          text: data.error || 'Erro ao executar regras do Robô de Tráfego Pago.',
        });
      } else {
        const actions = (data.actionsTaken || []).filter(
          (a: any) => a.action !== 'NO_ACTION'
        );
        setStatusMsg({
          type: 'success',
          text: `Verificação concluída: ${data.evaluatedCount} campanhas analisadas • ${actions.length} ajustes aplicados.`,
        });
        await onRefresh();
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Erro ao chamar /api/ads/autopilot',
      });
    } finally {
      setRunningBot(false);
    }
  };

  const handleLinkProduct = async (campaignId: string, productId: string) => {
    await fetch('/api/ads/sync', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        productId,
        _vaultCredentials: getClientCredentialsPayload(),
        _vaultProducts: products,
      }),
    });
    await onRefresh();
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await fetch('/api/ads/sync', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        status: nextStatus,
        _vaultCredentials: getClientCredentialsPayload(),
        _vaultProducts: products,
      }),
    });
    await onRefresh();
  };

  return (
    <div className="space-y-5">
      {/* AVISO ESTRATÉGIA R$ 0,00 (TRÁFEGO ORGÂNICO ANTES DE ANUNCIAR) */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 text-xs">
          <strong className="text-emerald-300 font-extrabold block">
            💡 Sem dinheiro para anúncios pagos agora? Não precisa usar esta aba ainda!
          </strong>
          <p className="text-slate-300 leading-relaxed">
            Para vender com <strong className="text-white">R$ 0,00 de investimento</strong>, baixe seus vídeos <strong className="text-white">.MP4</strong> prontos na <strong className="text-cyan-300">Aba 3</strong> e poste de graça todos os dias no TikTok EUA, Instagram Reels e YouTube Shorts com o link na bio. Só volte para o Robô de Meta Ads quando já tiver lucro em Dólar para escalar!
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab(3)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-white transition shrink-0"
        >
          Voltar para Aba 3 (Vídeos Grátis)
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* BARRA DE CONTROLE COMPACTA */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                Robô Protetor de Orçamento (Meta Ads)
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Clock className="w-3 h-3" />
                Ciclo automático: 30m
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pausa conjuntos sem vendas acima do teto de gasto e escala +20% conjuntos com ROAS &ge; 2.5x.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdsGuide(!showAdsGuide)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-2 text-xs font-bold text-cyan-300 transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {showAdsGuide ? 'Ocultar Guia' : 'Como subir anúncios?'}
              {showAdsGuide ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {products.length > 0 && (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
              >
                <option value="">Vincular produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (CPA: US$ {p.targetCpaUsd})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleSyncMetaAds}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3.5 py-2 text-xs font-extrabold text-white transition"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sincronizar Facebook Ads
                </>
              )}
            </button>

            <button
              onClick={handleRunAutopilotNow}
              disabled={runningBot || campaigns.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3.5 py-2 text-xs font-extrabold text-white transition"
            >
              {runningBot ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Avaliando...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Executar Robô Agora
                </>
              )}
            </button>
          </div>
        </div>

        {/* Gaveta de Tutorial (Oculta por padrão) */}
        {showAdsGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-1">
              <strong className="text-blue-300 block">1. Subir no Facebook Ads:</strong>
              <p>
                No{' '}
                <a
                  href="https://adsmanager.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline inline-flex items-center gap-0.5"
                >
                  Gerenciador <ExternalLink className="w-3 h-3" />
                </a>
                , crie uma campanha de <strong>Vendas</strong> para os <strong>Estados Unidos</strong> usando o vídeo da Aba 3 e a copy da Aba 2.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block">2. Subir no Google Ads:</strong>
              <p>
                No{' '}
                <a
                  href="https://ads.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline inline-flex items-center gap-0.5"
                >
                  Google Ads <ExternalLink className="w-3 h-3" />
                </a>
                , crie uma campanha de Pesquisa/PMax para os EUA colando os títulos de 30 caracteres da Aba 2.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-1">
              <strong className="text-emerald-300 block">3. Monitoramento Automático:</strong>
              <p>
                Clique em <strong>Sincronizar Facebook Ads</strong>. O robô buscará seus conjuntos e aplicará as 3 regras de proteção abaixo a cada 30m.
              </p>
            </div>
          </div>
        )}

        {/* Resumo Compacto das 3 Regras */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="rounded-xl bg-slate-950/90 border border-rose-500/25 p-3 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-rose-300 block">Stop-Loss (Pausa Prejuízo)</strong>
              <span className="text-slate-400">
                0 vendas com gasto &ge; 1.5x CPA Alvo &rarr; Pausa AdSet.
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/90 border border-amber-500/25 p-3 flex items-start gap-2.5">
            <Activity className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-amber-300 block">Detector de Fadiga</strong>
              <span className="text-slate-400">
                &gt;1.500 impressões e CTR &lt; 1.0% &rarr; Pausa AdSet.
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/90 border border-emerald-500/25 p-3 flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-emerald-300 block">Escala Automática (+20%)</strong>
              <span className="text-slate-400">
                &ge;3 vendas e ROAS &ge; 2.5x &rarr; Aumenta orçamento +20%.
              </span>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/60 border-red-500/40 text-red-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* TABELA DE CAMPANHAS OU EMPTY STATE */}
      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
          <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white">
            Nenhum conjunto de anúncios sincronizado
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {isMetaConnected
              ? 'Clique em "Sincronizar Facebook Ads" acima para importar seus conjuntos ativos.'
              : 'Conecte primeiro sua conta do Facebook Ads no Passo 0.'}
          </p>
          {!isMetaConnected ? (
            <button
              onClick={() => onNavigateTab(0)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-extrabold text-white transition"
            >
              Ir para Passo 0 (Conectar Facebook Ads)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSyncMetaAds}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold text-white transition"
            >
              Sincronizar Agora
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Conjuntos de Anúncios ({campaigns.length})
            </h3>
          </div>

          {/* VISÃO EM CARDS NO CELULAR (< 768px) */}
          <div className="md:hidden divide-y divide-slate-800/70">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate">{camp.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {camp.externalAdSetId}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      camp.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {camp.status === 'ACTIVE' ? 'ATIVO' : 'PAUSADO'}
                  </span>
                </div>

                <select
                  value={camp.productId || ''}
                  onChange={(e) => handleLinkProduct(camp.id, e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="">Vincular produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (Meta CPA: ${p.targetCpaUsd})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-lg bg-slate-950 p-2 border border-slate-800/80">
                    <span className="text-slate-500 block">Gasto / Dia</span>
                    <span className="font-bold text-amber-300">
                      ${camp.spendUsd.toFixed(2)} / ${camp.dailyBudgetUsd.toFixed(0)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2 border border-slate-800/80">
                    <span className="text-slate-500 block">Vendas</span>
                    <span className="font-bold text-emerald-400">
                      {camp.purchases} (${camp.revenueUsd.toFixed(0)})
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2 border border-slate-800/80">
                    <span className="text-slate-500 block">ROAS / CTR</span>
                    <span className="font-bold text-cyan-300">
                      {camp.roas.toFixed(2)}x • {camp.ctr.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TABELA COMPLETA NO TABLET E DESKTOP (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-4">Conjunto (AdSet)</th>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Orçamento</th>
                  <th className="py-2.5 px-3">Gasto</th>
                  <th className="py-2.5 px-3">Impr. / CTR</th>
                  <th className="py-2.5 px-3">Hook 3s</th>
                  <th className="py-2.5 px-3">Vendas</th>
                  <th className="py-2.5 px-3">CPA</th>
                  <th className="py-2.5 px-3">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-white">{camp.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {camp.externalAdSetId}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={camp.productId || ''}
                        onChange={(e) => handleLinkProduct(camp.id, e.target.value)}
                        className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="">Vincular...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} (${p.targetCpaUsd})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(camp.id, camp.status)}
                        title="Clique para pausar ou ativar este conjunto"
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                      >
                        {camp.status === 'ACTIVE' ? 'ATIVO' : 'PAUSADO'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      ${camp.dailyBudgetUsd.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-amber-300">
                      ${camp.spendUsd.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {camp.impressions.toLocaleString()} ({camp.ctr.toFixed(2)}%)
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-semibold">
                      {camp.hookRate.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      {camp.purchases} (${camp.revenueUsd.toFixed(2)})
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      ${camp.cpaUsd.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-300">
                      {camp.roas.toFixed(2)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HISTÓRICO DE AUTOMAÇÃO COMPACTO */}
      {logs.length > 0 && (
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 space-y-2.5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Histórico Recente de Execuções ({logs.length})
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {logs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="rounded-lg bg-slate-950 border border-slate-800/80 px-3 py-1.5 text-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-[10px]">
                    {log.httpStatus || 200}
                  </span>
                  <span className="font-semibold text-slate-200 truncate">
                    [{log.module}] {log.action}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
