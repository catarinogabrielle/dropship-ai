'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Loader2,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Video,
  Copy,
} from 'lucide-react';
import { CreativeData, ProductData } from '@/types/autopilot';
import {
  getClientCredentialsPayload,
  removeCreativeFromVault,
  saveCreativesToVault,
} from '@/lib/storage-persistence';

interface Module2CopywritingProps {
  products: ProductData[];
  creatives: CreativeData[];
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: number) => void;
  onCreativesUpdated?: (creatives: CreativeData[]) => void;
}

const ANGLE_META: Record<string, { badge: string; title: string; subtitle: string }> = {
  PAS_DIRECT: {
    badge: 'PAS • Direto na Dor',
    title: 'Dor, Agitação e Mecanismo Único',
    subtitle: 'Foca no problema principal e apresenta o produto como alívio imediato.',
  },
  UGC_STORYTELLING: {
    badge: 'UGC • Depoimento Natural',
    title: 'Relato em 1ª Pessoa (Estilo TikTok/Reels)',
    subtitle: 'Simula um cliente americano contando como descobriu o produto.',
  },
  SHOCK_HOOK: {
    badge: 'HOOK • Quebra de Padrão',
    title: 'Gancho de Curiosidade nos 3s Iniciais',
    subtitle: 'Ideal para parar o feed no Facebook, Instagram e TikTok Shop.',
  },
};

export default function Module2Copywriting({
  products,
  creatives,
  onRefresh,
  onNavigateTab,
  onCreativesUpdated,
}: Module2CopywritingProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [activeAngleFilter, setActiveAngleFilter] = useState<string>('ALL');
  const [generating, setGenerating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationSuccessMsg, setGenerationSuccessMsg] = useState<string | null>(null);
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<CreativeData>>>({});

  useEffect(() => {
    if (products.length > 0 && (!selectedProductId || !products.some((p) => p.id === selectedProductId))) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerate = async () => {
    if (!selectedProductId) {
      setError('Selecione um produto antes de gerar as campanhas.');
      return;
    }
    setGenerating(true);
    setError(null);
    setGenerationSuccessMsg(null);

    try {
      const selectedProduct = products.find((p) => p.id === selectedProductId);
      const res = await fetch('/api/creatives/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          _vaultCredentials: getClientCredentialsPayload(),
          _vaultProduct: selectedProduct,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Falha ao gerar estruturas de copy em inglês.');
      } else {
        if (Array.isArray(data.creatives) && data.creatives.length > 0) {
          saveCreativesToVault(data.creatives);
          onCreativesUpdated?.(data.creatives);
        }
        const engineLabel = data.aiEngineUsed || 'IA Gratuita ($0.00)';
        setGenerationSuccessMsg(
          data.fallbackNotice
            ? `${data.fallbackNotice} Motor usado: ${engineLabel}`
            : `3 campanhas em inglês geradas com sucesso ($0.00) via ${engineLabel}!`
        );
        await onRefresh();
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com /api/creatives/generate');
    } finally {
      setGenerating(false);
    }
  };

  const getFieldVal = (c: CreativeData, field: keyof CreativeData): string => {
    if (edits[c.id] && edits[c.id][field] !== undefined) {
      return String(edits[c.id][field] || '');
    }
    return String(c[field] || '');
  };

  const setFieldVal = (id: string, field: keyof CreativeData, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveInline = async (c: CreativeData) => {
    setSavingId(c.id);
    setSavedNoticeId(null);
    try {
      const linkedProduct = c.product || products.find((p) => p.id === c.productId);
      const payload = {
        id: c.id,
        hookEn: getFieldVal(c, 'hookEn'),
        bodyEn: getFieldVal(c, 'bodyEn'),
        ctaEn: getFieldVal(c, 'ctaEn'),
        metaPrimaryText: getFieldVal(c, 'metaPrimaryText'),
        metaHeadline: getFieldVal(c, 'metaHeadline'),
        googleHeadlinesJson: getFieldVal(c, 'googleHeadlinesJson'),
        orderBumpCopyEn: getFieldVal(c, 'orderBumpCopyEn'),
        translationPt: getFieldVal(c, 'translationPt'),
        _vaultCreative: { ...c, videoFilePath: null, audioFilePath: null },
        _vaultProduct: linkedProduct,
      };

      const res = await fetch('/api/creatives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.creative) {
          saveCreativesToVault([data.creative]);
          onCreativesUpdated?.([data.creative]);
        }
        setSavedNoticeId(c.id);
        await onRefresh();
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteCreative = async (id: string) => {
    await fetch(`/api/creatives?id=${id}`, { method: 'DELETE' });
    removeCreativeFromVault(id);
    await onRefresh();
  };

  const filteredCreatives = creatives.filter((c) => {
    if (activeAngleFilter === 'ALL') return true;
    return c.angle === activeAngleFilter;
  });

  return (
    <div className="space-y-5">
      {/* BARRA DE COMANDO COMPACTA */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Gerador de Copy & Roteiros Nativos (EUA • Grátis)
          </h2>
          <p className="text-xs text-slate-400">
            Gera 3 ângulos de venda em inglês americano a R$ 0,00 (com tradução em português e dica de vídeo ao lado).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full sm:w-auto sm:min-w-[240px] rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {products.length === 0 ? (
              <option value="">Cadastre um produto na Aba 1 primeiro</option>
            ) : (
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} (US$ {p.priceUsd})
                </option>
              ))
            )}
          </select>

          <button
            onClick={handleGenerate}
            disabled={generating || products.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 sm:py-2 text-xs font-extrabold text-white transition shadow-lg shadow-emerald-950/50 shrink-0"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Gerando 3 Campanhas Grátis (~10s)...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Gerar 3 Campanhas em Inglês (Grátis)
              </>
            )}
          </button>
        </div>
      </div>

      {generationSuccessMsg && (
        <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/40 p-3 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{generationSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-950/60 border border-red-500/40 p-3 text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FILTRO DE ÂNGULOS (SE HOUVER CRIATIVOS) */}
      {creatives.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'ALL', label: `Todos (${creatives.length})` },
              { id: 'PAS_DIRECT', label: '1. Direto na Dor (PAS)' },
              { id: 'UGC_STORYTELLING', label: '2. Depoimento (UGC)' },
              { id: 'SHOCK_HOOK', label: '3. Gancho Curioso (Hook)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveAngleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeAngleFilter === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab(3)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 px-3.5 py-2 sm:py-1.5 text-xs font-extrabold text-purple-300 transition shrink-0"
          >
            <Video className="w-3.5 h-3.5" />
            Ir para Aba 3 (Locução & Vídeo) →
          </button>
        </div>
      )}

      {/* LISTA DE CAMPANHAS */}
      {creatives.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white">Nenhuma campanha gerada ainda</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {products.length === 0
              ? 'Crie ou importe um produto no Passo 1 para liberar o gerador de copy.'
              : 'Selecione seu produto acima e clique em "Gerar 3 Campanhas em Inglês (Grátis)".'}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => onNavigateTab(1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition"
            >
              Ir para o Passo 1 (Produtos)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCreatives.map((creative) => {
            let googleObj: { headlines?: string[]; descriptions?: string[] } = {
              headlines: [],
              descriptions: [],
            };
            try {
              googleObj = JSON.parse(getFieldVal(creative, 'googleHeadlinesJson') || '{}');
            } catch {}

            const angleMeta = ANGLE_META[creative.angle] || {
              badge: creative.angle,
              title: creative.angle,
              subtitle: 'Campanha em inglês americano.',
            };

            const fullVideoScript = `${getFieldVal(creative, 'hookEn')} ${getFieldVal(
              creative,
              'bodyEn'
            )} ${getFieldVal(creative, 'ctaEn')}`;

            return (
              <div
                key={creative.id}
                className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-5 space-y-4"
              >
                {/* Cabeçalho do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {angleMeta.badge}
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      {creative.product?.title}
                    </span>
                    <span className="text-xs text-slate-500 hidden md:inline">
                      — {angleMeta.subtitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSaveInline(creative)}
                      disabled={savingId === creative.id}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-emerald-300 transition"
                    >
                      {savingId === creative.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Salvar
                    </button>

                    <button
                      onClick={() => handleDeleteCreative(creative.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition"
                      title="Excluir campanha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {savedNoticeId === creative.id && (
                  <div className="rounded-lg bg-emerald-950/50 border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Salvo no banco de dados!
                  </div>
                )}

                {/* Roteiro de Vídeo Falado (3 Colunas Compactas) */}
                <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-400">
                      🎙️ Roteiro Falado para Vídeo (Usado na Aba 3)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(fullVideoScript, `script_${creative.id}`)
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-200 transition"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedKey === `script_${creative.id}` ? 'Copiado!' : 'Copiar Roteiro'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        1. Hook (0–3s)
                      </label>
                      <textarea
                        rows={2}
                        value={getFieldVal(creative, 'hookEn')}
                        onChange={(e) => setFieldVal(creative.id, 'hookEn', e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        2. Corpo (História & Mecanismo)
                      </label>
                      <textarea
                        rows={2}
                        value={getFieldVal(creative, 'bodyEn')}
                        onChange={(e) => setFieldVal(creative.id, 'bodyEn', e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        3. Chamada Final (CTA)
                      </label>
                      <textarea
                        rows={2}
                        value={getFieldVal(creative, 'ctaEn')}
                        onChange={(e) => setFieldVal(creative.id, 'ctaEn', e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Meta Ads, Google Ads e Tradução em 2 Colunas Limpas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Coluna Esquerda: Meta Ads */}
                  <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-blue-400">
                        📢 Facebook & Instagram Ads
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            getFieldVal(creative, 'metaPrimaryText'),
                            `meta_p_${creative.id}`
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedKey === `meta_p_${creative.id}` ? 'Copiado!' : 'Copiar Texto'}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={getFieldVal(creative, 'metaPrimaryText')}
                      onChange={(e) =>
                        setFieldVal(creative.id, 'metaPrimaryText', e.target.value)
                      }
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2 text-xs text-white"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Headline (Título do Botão)
                        </label>
                        <input
                          type="text"
                          value={getFieldVal(creative, 'metaHeadline')}
                          onChange={(e) =>
                            setFieldVal(creative.id, 'metaHeadline', e.target.value)
                          }
                          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-300 mb-1">
                          Order Bump (Checkout)
                        </label>
                        <input
                          type="text"
                          value={getFieldVal(creative, 'orderBumpCopyEn')}
                          onChange={(e) =>
                            setFieldVal(creative.id, 'orderBumpCopyEn', e.target.value)
                          }
                          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Tradução PT-BR + Google Ads */}
                  <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3.5 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-emerald-300 block mb-1">
                        🇧🇷 Tradução em Português (Para Conferência)
                      </span>
                      <textarea
                        rows={3}
                        value={getFieldVal(creative, 'translationPt')}
                        onChange={(e) =>
                          setFieldVal(creative.id, 'translationPt', e.target.value)
                        }
                        className="w-full rounded-lg bg-slate-900 border border-emerald-500/20 p-2 text-xs text-emerald-100"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(googleObj.headlines || []).slice(0, 3).map((h, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleCopyText(h, `gh_${creative.id}_${i}`)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                          title="Clique para copiar título do Google Ads"
                        >
                          <span className="truncate max-w-[150px]">{h}</span>
                          <Copy className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
