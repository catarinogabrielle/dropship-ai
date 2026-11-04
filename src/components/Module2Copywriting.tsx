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
  HelpCircle,
} from 'lucide-react';
import { CreativeData, ProductData } from '@/types/autopilot';

interface Module2CopywritingProps {
  products: ProductData[];
  creatives: CreativeData[];
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: number) => void;
}

const ANGLE_DESCRIPTIONS: Record<string, { title: string; subtitle: string }> = {
  PAS_DIRECT: {
    title: 'Estilo 1: Direto na Dor e Solução (PAS_DIRECT)',
    subtitle:
      'Toca na dor principal do americano, mostra por que os métodos comuns falham e apresenta seu produto como solução imediata.',
  },
  UGC_STORYTELLING: {
    title: 'Estilo 2: Depoimento Natural estilo TikTok/Reels (UGC_STORYTELLING)',
    subtitle:
      'Parece uma pessoa comum nos EUA contando como descobriu o produto e mudou de rotina. Converte muito em vídeo curto.',
  },
  SHOCK_HOOK: {
    title: 'Estilo 3: Quebra de Padrão nos Primeiros 3 Segundos (SHOCK_HOOK)',
    subtitle:
      'Começa com uma frase curiosa ou impactante que faz a pessoa parar de rolar o feed do Facebook, Instagram ou TikTok.',
  },
};

export default function Module2Copywriting({
  products,
  creatives,
  onRefresh,
  onNavigateTab,
}: Module2CopywritingProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [generating, setGenerating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Estado local para edicao inline de cada criativo
  const [edits, setEdits] = useState<Record<string, Partial<CreativeData>>>({});

  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
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
      setError('Selecione um produto salvo na caixinha antes de gerar.');
      return;
    }
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/creatives/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Falha ao gerar estruturas de copy na OpenAI.');
      } else {
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
      };

      const res = await fetch('/api/creatives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSavedNoticeId(c.id);
        await onRefresh();
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteCreative = async (id: string) => {
    await fetch(`/api/creatives?id=${id}`, { method: 'DELETE' });
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Guia Explicativo para Iniciantes */}
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
          <HelpCircle className="w-4 h-4" />
          COMO USAR ESTA TELA (PASSO 2 — CRIAR OS ANÚNCIOS E ROTEIROS EM INGLÊS SEM FALAR INGLÊS)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
            <strong className="text-white block mb-1">
              1️⃣ Escolha o produto e clique no botão verde:
            </strong>
            A Inteligência Artificial vai escrever <strong>3 campanhas completas em inglês nativo dos EUA</strong> baseadas no produto que você cadastrou na Aba 1.
          </div>
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
            <strong className="text-white block mb-1">
              2️⃣ Confira a Tradução em Português ao lado:
            </strong>
            Cada cartão mostra o texto em inglês (que vai para os americanos) e uma caixa com a <strong>Tradução Fiel em Português</strong> para você saber exatamente o que está escrito.
          </div>
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
            <strong className="text-white block mb-1">
              3️⃣ Copie para seus Anúncios ou Gere a Voz:
            </strong>
            Use os botões <strong>&ldquo;Copiar Texto&rdquo;</strong> para colar no seu anúncio do Facebook/Google ou clique em <strong>&ldquo;Ir para Fábrica de Vídeo&rdquo;</strong> para fazer a voz americana falar esse roteiro!
          </div>
        </div>
      </div>

      {/* Barra de Geração OpenAI Real */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              MÓDULO 2 • GERADOR AUTOMÁTICO DE TEXTOS DE VENDAS EM INGLÊS
            </span>
            <h2 className="text-xl font-extrabold text-white">
              Criar Roteiros de Vídeo, Anúncios de Facebook e Títulos do Google Ads
            </h2>
            <p className="text-xs text-slate-400">
              Selecione abaixo o produto que você salvou na Aba 1 e clique no botão verde:
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Qual produto você quer divulgar?
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white min-w-[270px] focus:outline-none focus:border-emerald-500"
              >
                {products.length === 0 ? (
                  <option value="">Nenhum produto salvo ainda na Aba 1</option>
                ) : (
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (US$ {p.priceUsd})
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || products.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-2.5 text-sm font-extrabold text-white transition shadow-lg shadow-emerald-950/50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Escrevendo 3 Campanhas em Inglês (~12s)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar 3 Campanhas em Inglês Agora
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-950/60 border border-red-500/40 p-3.5 text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Empty State se não houver criativos */}
      {creatives.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">
            Nenhum roteiro ou anúncio gerado ainda
          </h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1 mb-4">
            {products.length === 0
              ? 'Você precisa primeiro cadastrar pelo menos 1 produto na Aba 1 para que a Inteligência Artificial saiba o que vender.'
              : 'Clique no botão verde "Gerar 3 Campanhas em Inglês Agora" acima para criar seus textos!'}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => onNavigateTab(1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition"
            >
              Voltar para Aba 1 e Cadastrar Meu Primeiro Produto
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {creatives.map((creative) => {
            let googleObj: { headlines?: string[]; descriptions?: string[] } = {
              headlines: [],
              descriptions: [],
            };
            try {
              googleObj = JSON.parse(getFieldVal(creative, 'googleHeadlinesJson') || '{}');
            } catch {}

            const angleMeta = ANGLE_DESCRIPTIONS[creative.angle] || {
              title: creative.angle,
              subtitle: 'Campanha gerada em inglês nativo americano.',
            };

            const fullVideoScript = `${getFieldVal(creative, 'hookEn')} ${getFieldVal(
              creative,
              'bodyEn'
            )} ${getFieldVal(creative, 'ctaEn')}`;

            return (
              <div
                key={creative.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {angleMeta.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        Produto: <strong className="text-white">{creative.product?.title}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{angleMeta.subtitle}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onNavigateTab(3)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-extrabold text-white transition"
                    >
                      <Video className="w-4 h-4" />
                      Transformar em Voz e Vídeo (Ir para Aba 3) →
                    </button>

                    <button
                      onClick={() => handleSaveInline(creative)}
                      disabled={savingId === creative.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-emerald-300 transition"
                    >
                      {savingId === creative.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Salvar Alterações
                    </button>

                    <button
                      onClick={() => handleDeleteCreative(creative.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition"
                      title="Apagar esta campanha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {savedNoticeId === creative.id && (
                  <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/40 px-4 py-2.5 text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Alterações salvas com sucesso no banco de dados!
                  </div>
                )}

                {/* BLOCO 1: Roteiro Falado do Vídeo (Usado automaticamente na Aba 3) */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                        🎙️ PARTE 1: Fala do Vídeo em Inglês (A Voz Americana da Aba 3 vai ler isto)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Dividido em: Gancho Inicial (3 segundos) + Explicação do Produto + Chamada para Comprar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(fullVideoScript, `script_${creative.id}`)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white transition shrink-0"
                    >
                      {copiedKey === `script_${creative.id}` ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Roteiro Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Roteiro Completo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white mb-1">
                        1. Início do Vídeo (Primeiros 3 Segundos)
                      </label>
                      <textarea
                        rows={3}
                        value={getFieldVal(creative, 'hookEn')}
                        onChange={(e) => setFieldVal(creative.id, 'hookEn', e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white mb-1">
                        2. Meio do Vídeo (História e Benefício)
                      </label>
                      <textarea
                        rows={3}
                        value={getFieldVal(creative, 'bodyEn')}
                        onChange={(e) => setFieldVal(creative.id, 'bodyEn', e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white mb-1">
                        3. Final do Vídeo (Mandando Clicar no Link)
                      </label>
                      <textarea
                        rows={3}
                        value={getFieldVal(creative, 'ctaEn')}
                        onChange={(e) => setFieldVal(creative.id, 'ctaEn', e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* BLOCO 2: Textos para colar no Facebook Ads, Google Ads e Tradução em Português */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                      📢 PARTE 2: Textos para Colar no Facebook Ads & Instagram Ads
                    </h4>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-white">
                          Texto Principal do Anúncio (Primary Text)
                        </label>
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
                          {copiedKey === `meta_p_${creative.id}` ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={getFieldVal(creative, 'metaPrimaryText')}
                        onChange={(e) =>
                          setFieldVal(creative.id, 'metaPrimaryText', e.target.value)
                        }
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-white">
                          Título do Botão no Facebook Ads (Headline)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              getFieldVal(creative, 'metaHeadline'),
                              `meta_h_${creative.id}`
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedKey === `meta_h_${creative.id}` ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={getFieldVal(creative, 'metaHeadline')}
                        onChange={(e) =>
                          setFieldVal(creative.id, 'metaHeadline', e.target.value)
                        }
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-amber-300">
                          Texto da Caixinha de Oferta Extra (Order Bump na Kiwify/Shopify)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              getFieldVal(creative, 'orderBumpCopyEn'),
                              `bump_${creative.id}`
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedKey === `bump_${creative.id}` ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={getFieldVal(creative, 'orderBumpCopyEn')}
                        onChange={(e) =>
                          setFieldVal(creative.id, 'orderBumpCopyEn', e.target.value)
                        }
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Google Ads + Tradução em Português */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                      🔍 PARTE 3: Títulos para Google Ads & Tradução em Português
                    </h4>

                    <div className="space-y-1.5 text-xs">
                      <span className="text-slate-300 font-bold block">
                        Títulos Curtos para Google Ads (Até 30 letras):
                      </span>
                      {(googleObj.headlines || []).map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                        >
                          <span className="text-white">{h}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-400 font-mono">
                              {h.length}/30
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(h, `gh_${creative.id}_${i}`)
                              }
                              className="text-[11px] text-cyan-300 hover:text-white"
                            >
                              {copiedKey === `gh_${creative.id}_${i}` ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      ))}

                      <span className="text-slate-300 font-bold block pt-1">
                        Descrições para Google Ads (Até 90 letras):
                      </span>
                      {(googleObj.descriptions || []).map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                        >
                          <span className="text-white truncate mr-2">{d}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-cyan-400 font-mono">
                              {d.length}/90
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(d, `gd_${creative.id}_${i}`)
                              }
                              className="text-[11px] text-cyan-300 hover:text-white"
                            >
                              {copiedKey === `gd_${creative.id}_${i}` ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <label className="block text-xs font-bold text-emerald-300 mb-1">
                        🇧🇷 Tradução Completa em Português (Para você ler e entender o anúncio):
                      </label>
                      <textarea
                        rows={4}
                        value={getFieldVal(creative, 'translationPt')}
                        onChange={(e) =>
                          setFieldVal(creative.id, 'translationPt', e.target.value)
                        }
                        className="w-full rounded-lg bg-slate-900 border border-emerald-500/30 p-2.5 text-xs text-emerald-100 focus:outline-none focus:border-emerald-500"
                      />
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
