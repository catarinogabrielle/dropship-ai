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
  HelpCircle,
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
  cronSchedule,
  onRefresh,
  onNavigateTab,
}: Module4TrafficBotProps) {
  const [syncing, setSyncing] = useState(false);
  const [runningBot, setRunningBot] = useState(false);
  const [showAdsGuide, setShowAdsGuide] = useState(true);
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
        body: JSON.stringify({ productId: selectedProductId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          text:
            data.error ||
            'Erro ao buscar seus anúncios no Facebook. Verifique se você conectou o Facebook Ads na Aba 0.',
        });
      } else {
        setStatusMsg({
          type: 'success',
          text: `Sincronização concluída! ${data.syncedCount} conjuntos de anúncios foram trazidos da sua conta do Facebook Ads.`,
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
          text: `Verificação concluída! ${data.evaluatedCount} campanhas analisadas • ${actions.length} ajustes feitos automaticamente no Facebook Ads.`,
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
      body: JSON.stringify({ campaignId, productId }),
    });
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Tutorial Passo a Passo de Como Anunciar nos EUA e Usar o Robô */}
      <div className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase">
            <HelpCircle className="w-4 h-4" />
            COMO USAR ESTA TELA (PASSO 4 — COLOCAR ANÚNCIOS NO AR E DEIXAR O ROBÔ CUIDAR DO SEU DINHEIRO)
          </div>
          <button
            type="button"
            onClick={() => setShowAdsGuide(!showAdsGuide)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showAdsGuide
              ? 'Esconder Tutorial de Facebook & Google Ads'
              : '📖 Abrir Tutorial: Como subir anúncio no Facebook/Google Ads'}
            {showAdsGuide ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {showAdsGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-1.5">
              <strong className="text-blue-300 block text-sm">
                1️⃣ Como criar seu anúncio no Facebook Ads:
              </strong>
              <p>
                Abra seu{' '}
                <a
                  href="https://adsmanager.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline inline-flex items-center gap-0.5"
                >
                  Gerenciador de Anúncios <ExternalLink className="w-3 h-3" />
                </a>
                , clique em <strong>Criar → Vendas</strong>. Em &ldquo;Localização&rdquo;, escolha{' '}
                <strong>Estados Unidos</strong>. Suba o vídeo `.MP4` que você baixou na Aba 3 e cole os textos em inglês da Aba 2!
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-1.5">
              <strong className="text-cyan-300 block text-sm">
                2️⃣ Como criar no Google Ads / YouTube:
              </strong>
              <p>
                Abra seu{' '}
                <a
                  href="https://ads.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline inline-flex items-center gap-0.5"
                >
                  Google Ads <ExternalLink className="w-3 h-3" />
                </a>
                , crie uma campanha de <strong>Vendas (Pesquisa ou Performance Max)</strong> para os <strong>Estados Unidos (Idioma Inglês)</strong> e cole os Títulos de 30 letras e Descrições de 90 letras da Aba 2.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-1.5">
              <strong className="text-emerald-300 block text-sm">
                3️⃣ O que o nosso Robô faz sozinho aqui:
              </strong>
              <p>
                Depois que seu anúncio estiver rodando no Facebook Ads, clique em{' '}
                <strong>&ldquo;Buscar Meus Anúncios do Facebook&rdquo;</strong> abaixo. De 30 em 30 minutos o robô olha seus resultados: se gastar demais sem vender, ele <strong>PAUSA</strong> para você não perder dinheiro; se vender bem, ele <strong>AUMENTA +20%</strong>!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cabeçalho do Robô + Controles de Sincronização e Execução */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Bot className="w-3.5 h-3.5" />
                ROBÔ PROTETOR DE ORÇAMENTO ATIVO
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Clock className="w-3 h-3" />
                Vigiando automaticamente a cada 30 minutos
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Painel de Controle dos Seus Anúncios (Facebook & Instagram Ads)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Vincule cada anúncio ao produto correspondente para o Robô saber qual é a sua Meta de Gasto por Venda (CPA Alvo).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {products.length > 0 && (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white"
              >
                <option value="">Vincular ao Produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (Meta CPA: US$ {p.targetCpaUsd})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleSyncMetaAds}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2.5 text-xs font-extrabold text-white transition"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando Anúncios no Facebook...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  1. Buscar Meus Anúncios do Facebook
                </>
              )}
            </button>

            <button
              onClick={handleRunAutopilotNow}
              disabled={runningBot || campaigns.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-xs font-extrabold text-white transition"
            >
              {runningBot ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando e Ajustando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  2. Rodar Verificação do Robô Agora
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cards das 3 Regras Automáticas Explicadas em Português Claro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl bg-slate-950 border border-rose-500/30 p-4 space-y-1">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs uppercase">
              <ShieldAlert className="w-4 h-4" />
              Regra 1: Proteção Contra Prejuízo (Stop-Loss)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Se um anúncio fizer <strong>0 vendas</strong> e já tiver gastado{' '}
              <strong>1,5x o valor da sua Meta de Gasto (CPA Alvo)</strong>, o robô{' '}
              <strong className="text-rose-300">PAUSA o anúncio sozinho</strong> lá no seu Facebook para proteger seu dinheiro.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 border border-amber-500/30 p-4 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase">
              <Activity className="w-4 h-4" />
              Regra 2: Detector de Anúncio Fraco (Fadiga)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Se o anúncio já apareceu para mais de <strong>1.500 pessoas</strong> nos EUA, mas menos de{' '}
              <strong>1% clicou (CTR &lt; 1%)</strong>, o robô{' '}
              <strong className="text-amber-300">PAUSA o anúncio</strong> e avisa para você testar outro vídeo da Aba 3.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-4 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase">
              <TrendingUp className="w-4 h-4" />
              Regra 3: Multiplicador de Lucro (+20% Orçamento)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Se o anúncio já fez <strong>3 ou mais vendas hoje</strong> e está devolvendo mais de{' '}
              <strong>2,5x o valor investido (ROAS &ge; 2.5)</strong>, o robô{' '}
              <strong className="text-emerald-300">aumenta o orçamento diário em +20%</strong> para vender ainda mais!
            </p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`rounded-xl px-4 py-3 text-xs flex items-center gap-2 border ${
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

      {/* Tabela de Campanhas Reais ou Empty State Guiado */}
      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center">
          <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">
            Nenhum anúncio importado da sua conta ainda
          </h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1 mb-4">
            {isMetaConnected
              ? 'Sua conta do Facebook Ads já está conectada! Clique no botão azul "1. Buscar Meus Anúncios do Facebook" acima para trazer suas campanhas para cá.'
              : 'Para o robô monitorar seus anúncios, primeiro conecte sua conta do Facebook Ads no Cartão nº 4 da Aba 0.'}
          </p>
          {!isMetaConnected ? (
            <button
              onClick={() => onNavigateTab(0)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-extrabold text-white transition"
            >
              Ir para Aba 0: Conectar Minha Conta do Facebook Ads
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSyncMetaAds}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-white transition"
            >
              Buscar Meus Anúncios Agora
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/85 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Seus Conjuntos de Anúncios Sincronizados ({campaigns.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4">Nome do Anúncio</th>
                  <th className="py-3 px-3">Produto Vendido</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Orçamento/Dia</th>
                  <th className="py-3 px-3">Gasto Hoje</th>
                  <th className="py-3 px-3">Pessoas / % Cliques</th>
                  <th className="py-3 px-3">Retenção Vídeo</th>
                  <th className="py-3 px-3">Vendas</th>
                  <th className="py-3 px-3">Custo/Venda</th>
                  <th className="py-3 px-3">Multiplicador (ROAS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{camp.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ID: {camp.externalAdSetId}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={camp.productId || ''}
                        onChange={(e) => handleLinkProduct(camp.id, e.target.value)}
                        className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="">Escolher produto...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} (Meta: ${p.targetCpaUsd})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {camp.status === 'ACTIVE' ? 'ATIVO' : 'PAUSADO'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      US$ {camp.dailyBudgetUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-amber-300">
                      US$ {camp.spendUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {camp.impressions.toLocaleString()} ({camp.ctr.toFixed(2)}%)
                    </td>
                    <td className="py-3 px-3 text-cyan-300 font-semibold">
                      {camp.hookRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      {camp.purchases} (US$ {camp.revenueUsd.toFixed(2)})
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      US$ {camp.cpaUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-300">
                      {camp.roas.toFixed(2)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diário de Ações do Robô (AutomationLog) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">
          Diário de Atividades do Robô (Tudo o que o sistema fez por você)
        </h3>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500">
            Nenhuma atividade registrada ainda. Assim que você testar conexões ou sincronizar anúncios, o histórico aparecerá aqui.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[11px]">
                    Status {log.httpStatus || 200}
                  </span>
                  <span className="font-semibold text-white">
                    [{log.module}] {log.action}
                  </span>
                  {log.targetId && (
                    <span className="text-slate-400 font-mono">({log.targetId})</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
