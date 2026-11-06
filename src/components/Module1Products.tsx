'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Calculator,
  Globe,
  Loader2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Wand2,
  BookOpen,
  Download,
  Link as LinkIcon,
  ShoppingBag,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { ProductData, SegmentType } from '@/types/autopilot';
import { ProductSuggestionItem } from '@/app/api/products/suggestions/route';

interface Module1ProductsProps {
  products: ProductData[];
  selectedSegment: SegmentType;
  exchangeRateBrl: number;
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: number) => void;
}

const US_HOT_NICHES = [
  {
    label: '🥗 Keto Reset 21 Dias',
    niche: 'Weight Loss & 21-Day Metabolic Keto Reset for American Women 35+',
    idea: '21-Day Cortisol & Belly Fat Reset Protocol (Digital Guide + Meal Plan)',
    price: '37.00',
    bump: '14.00',
  },
  {
    label: '🐕 Adestramento Canino',
    niche: 'Dog Obedience & Stop Barking At-Home Training Protocol',
    idea: 'The 15-Minute Calm Dog Brain Training System for US Pet Owners',
    price: '29.00',
    bump: '12.00',
  },
  {
    label: '🧘‍♀️ Alívio Nervo Ciático',
    niche: 'Sciatica & Lower Back Pain 10-Minute Daily Relief Routine',
    idea: 'Spine Release At-Home Mobility Protocol (No Equipment Needed)',
    price: '39.00',
    bump: '15.00',
  },
  {
    label: '😴 Sono & Menopausa',
    niche: 'Natural Deep Sleep & Hormone Balance Protocol for Women 40+',
    idea: 'The 7-Night Deep Sleep & Night Sweat Relief Blueprint',
    price: '37.00',
    bump: '14.00',
  },
  {
    label: '📦 Gadget Postura / Pescoço',
    niche: 'Smart Neck Massager & Posture Relief Device (US Dropshipping)',
    idea: 'Ergonomic Heated Neck & Shoulder Decompression Pillow',
    price: '59.90',
    bump: '9.90',
  },
];

export default function Module1Products({
  products,
  selectedSegment,
  exchangeRateBrl,
  onRefresh,
  onNavigateTab,
}: Module1ProductsProps) {
  const effectiveSegment =
    selectedSegment === 'ADS_SCALE' ? 'KIWIFY_GLOBAL' : selectedSegment;

  const [inputTab, setInputTab] = useState<'AI_GENERATOR' | 'URL_SCRAPER'>('AI_GENERATOR');
  const [genMode, setGenMode] = useState<'CREATE_EBOOK' | 'AFFILIATE_OFFER' | 'DROPSHIP_PRODUCT'>(
    'CREATE_EBOOK'
  );
  const [niche, setNiche] = useState(US_HOT_NICHES[0].niche);
  const [productIdea, setProductIdea] = useState(US_HOT_NICHES[0].idea);
  const [affiliateLink, setAffiliateLink] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const [segment, setSegment] = useState<string>(effectiveSegment);
  const [priceUsd, setPriceUsd] = useState<string>('37.00');
  const [costUsd, setCostUsd] = useState<string>('0.00');
  const [orderBumpUsd, setOrderBumpUsd] = useState<string>('14.00');
  const [shippingUsd, setShippingUsd] = useState<string>('0.00');
  const [monthlyProfitGoalUsd, setMonthlyProfitGoalUsd] = useState<string>('3000');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedDeliverableId, setExpandedDeliverableId] = useState<string | null>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [showWhereToFindGuide, setShowWhereToFindGuide] = useState<boolean>(false);

  // ESTADOS PARA GERADOR DINÂMICO DE SUGESTÕES & IA
  const [dynamicSuggestions, setDynamicSuggestions] = useState<ProductSuggestionItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [showAiCustomBox, setShowAiCustomBox] = useState<boolean>(false);
  const [customAiKeyword, setCustomAiKeyword] = useState<string>('');
  const [suggestionFeedback, setSuggestionFeedback] = useState<string | null>(null);

  const fetchDynamicSuggestions = async (mode: string = genMode, theme: string = '') => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `/api/products/suggestions?mode=${mode}${theme ? `&theme=${encodeURIComponent(theme)}` : ''}`
      );
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setDynamicSuggestions(data.suggestions);
      }
    } catch {
      // Ignora erro
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleGenerateAiIdeas = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/products/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: genMode,
          targetPlatform: segment,
          nicheTheme: customAiKeyword,
        }),
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setDynamicSuggestions(data.suggestions);
        setShowAiCustomBox(false);
        setSuggestionFeedback('Novas 5 ideias de produtos geradas com sucesso!');
        setTimeout(() => setSuggestionFeedback(null), 4000);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleApplySuggestion = (item: ProductSuggestionItem) => {
    setNiche(item.niche);
    setProductIdea(item.idea);
    setPriceUsd(item.price);
    setOrderBumpUsd(item.bump);
    setCostUsd(item.cost || '0.00');
    setShippingUsd(item.shipping || '0.00');
    if (item.segment) {
      setSegment(item.segment);
    }
    setSuggestionFeedback(`Ideia carregada: "${item.label}"! Campos e calculadora atualizados.`);
    setTimeout(() => setSuggestionFeedback(null), 4000);
  };

  useEffect(() => {
    fetchDynamicSuggestions(genMode);
  }, [genMode]);

  const numPrice = parseFloat(priceUsd) || 0;
  const numCost = parseFloat(costUsd) || 0;
  const numBump = parseFloat(orderBumpUsd) || 0;
  const numShipping = parseFloat(shippingUsd) || 0;
  const numGoalUsd = parseFloat(monthlyProfitGoalUsd) || 3000;

  const aovUsd = +(numPrice + numBump).toFixed(2);
  const isAffiliateMode = inputTab === 'AI_GENERATOR' && genMode === 'AFFILIATE_OFFER';

  const feePercent = isAffiliateMode
    ? 0
    : segment === 'KIWIFY_GLOBAL'
    ? 9.99
    : segment === 'TIKTOK_SHOP'
    ? 6.0
    : 2.9;
  const feeFixed = isAffiliateMode
    ? 0
    : segment === 'KIWIFY_GLOBAL'
    ? 0.8
    : segment === 'TIKTOK_SHOP'
    ? 0.0
    : 0.3;

  const gatewayFeeUsd = isAffiliateMode
    ? 0
    : +(aovUsd * (feePercent / 100) + feeFixed).toFixed(2);
  const breakevenCpaUsd = +(aovUsd - numCost - numShipping - gatewayFeeUsd).toFixed(2);
  const targetCpaUsd = +(breakevenCpaUsd * 0.65).toFixed(2);
  const netProfitPerSaleUsd = +(breakevenCpaUsd - targetCpaUsd).toFixed(2);
  const salesPerDayRequired =
    netProfitPerSaleUsd > 0 ? +((numGoalUsd / netProfitPerSaleUsd) / 30).toFixed(1) : 0;

  const handleGenerateProductWithAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: genMode,
          niche,
          productIdea,
          affiliateLink,
          segment,
          priceUsd: numPrice,
          costUsd: numCost,
          orderBumpUsd: numBump,
          shippingUsd: numShipping,
          monthlyProfitGoalUsd: numGoalUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao gerar produto com Inteligência Artificial.');
      } else {
        if (data.product?.id) {
          setExpandedDeliverableId(data.product.id);
        }
        await onRefresh();
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao chamar /api/products/generate');
    } finally {
      setLoading(false);
    }
  };

  const handleIngestUrlProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/products/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl,
          segment,
          priceUsd: numPrice,
          costUsd: numCost,
          orderBumpUsd: numBump,
          shippingUsd: numShipping,
          monthlyProfitGoalUsd: numGoalUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao extrair e analisar link do produto.');
      } else {
        setSourceUrl('');
        await onRefresh();
      }
    } catch (err: any) {
      setError(err.message || 'Falha na requisição para /api/products/ingest');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDeliverable = (title: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ebook_completo.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      await onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* BARRA COMPACTA: SELETOR DE MODO + BOTÃO DE SITES PARCEIROS */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-3.5 sm:p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Toggle: Gerador IA vs Importar Link */}
          <div className="grid grid-cols-2 sm:inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setInputTab('AI_GENERATOR')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition ${
                inputTab === 'AI_GENERATOR'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Criar Produto c/ IA</span>
            </button>
            <button
              type="button"
              onClick={() => setInputTab('URL_SCRAPER')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition ${
                inputTab === 'URL_SCRAPER'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Importar Link</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowWhereToFindGuide(!showWhereToFindGuide)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-300 transition"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {showWhereToFindGuide
                ? 'Ocultar Sites Parceiros'
                : 'Onde pegar produtos prontos? (Digistore24, ClickBank, CJ)'}
            </span>
            {showWhereToFindGuide ? (
              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            )}
          </button>
        </div>

        {/* GAVETA EXPANSÍVEL: ONDE PEGAR PRODUTOS */}
        {showWhereToFindGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
            <div className="rounded-xl bg-slate-950/90 border border-amber-500/25 p-3.5 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-400">
                  1. Afiliado EUA (50% a 85% comissão)
                </span>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  Cadastre-se grátis, escolha um produto validado nos EUA e ganhe até US$ 70 por venda sem precisar de estoque.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://www.digistore24.com/en/home/marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-300 hover:bg-amber-500/25"
                >
                  Digistore24 <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.clickbank.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 font-bold text-slate-200 hover:bg-slate-700"
                >
                  ClickBank <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/90 border border-emerald-500/25 p-3.5 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-400">
                  2. E-book Próprio via IA (90% lucro)
                </span>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  Gere o guia completo em inglês abaixo com 1 clique, baixe o arquivo e venda em Dólar na Kiwify Internacional.
                </p>
              </div>
              <div>
                <a
                  href="https://dashboard.kiwify.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300 hover:bg-emerald-500/25"
                >
                  Abrir Kiwify <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/90 border border-cyan-500/25 p-3.5 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-cyan-400">
                  3. Dropshipping Físico nos EUA (Shopify ou Wix)
                </span>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  Venda produtos físicos na Shopify ou no <strong>Wix Stores</strong> sem estoque; fornecedores enviam direto dos EUA.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://cjdropshipping.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 font-bold text-cyan-300 hover:bg-cyan-500/25"
                >
                  CJ Dropshipping <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.modalyst.co/wix-dropshipping/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 font-bold text-slate-200 hover:bg-slate-700"
                >
                  Modalyst (Wix) <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.zendrop.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 font-bold text-slate-200 hover:bg-slate-700"
                >
                  Zendrop <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GRID PRINCIPAL: FORMULÁRIO (7 COLUNAS) + CALCULADORA COMPACTA (5 COLUNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {inputTab === 'AI_GENERATOR' ? (
          <form
            onSubmit={handleGenerateProductWithAi}
            className="lg:col-span-7 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 space-y-4"
          >
            {/* Seletor de Modalidade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setGenMode('CREATE_EBOOK');
                  setSegment('KIWIFY_GLOBAL');
                  setCostUsd('0.00');
                  setShippingUsd('0.00');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  genMode === 'CREATE_EBOOK'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📘 E-book Próprio (90%)
              </button>

              <button
                type="button"
                onClick={() => {
                  setGenMode('AFFILIATE_OFFER');
                  setSegment('KIWIFY_GLOBAL');
                  setPriceUsd('65.00');
                  setOrderBumpUsd('0.00');
                  setCostUsd('0.00');
                  setShippingUsd('0.00');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  genMode === 'AFFILIATE_OFFER'
                    ? 'bg-amber-500/15 border-amber-500/60 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🤝 Afiliado EUA (Comissão)
              </button>

              <button
                type="button"
                onClick={() => {
                  setGenMode('DROPSHIP_PRODUCT');
                  setSegment('SHOPIFY_US');
                  setPriceUsd('59.90');
                  setOrderBumpUsd('9.90');
                  setCostUsd('14.50');
                  setShippingUsd('4.50');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  genMode === 'DROPSHIP_PRODUCT'
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📦 Dropshipping Físico
              </button>
            </div>

            {/* CENTRAL DINÂMICA DE SUGESTÕES & GERADOR DE IDEIAS */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Sugestões Campeãs nos EUA (clique para preencher):
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fetchDynamicSuggestions(genMode)}
                    disabled={loadingSuggestions}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200 transition disabled:opacity-50"
                    title="Embaralha e busca 5 novas sugestões validadas"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                    Sortear Mais (+5)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAiCustomBox(!showAiCustomBox)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-[11px] font-bold text-white transition shadow-sm"
                  >
                    <Wand2 className="w-3 h-3" />
                    {showAiCustomBox ? 'Fechar IA' : 'Gerar com IA'}
                  </button>
                </div>
              </div>

              {/* CAIXA DE BUSCA / PROMPT CUSTOMIZADO DE IA */}
              {showAiCustomBox && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/40 space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={customAiKeyword}
                      onChange={(e) => setCustomAiKeyword(e.target.value)}
                      placeholder="Tema ou nicho (ex: pet, dores na coluna, emagrecimento, beleza, gadgets)..."
                      className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleGenerateAiIdeas()}
                      disabled={loadingSuggestions}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 shrink-0"
                    >
                      {loadingSuggestions ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3" />
                          Criar 5 Ideias com IA
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    A IA vai inventar 5 ofertas prontas com mecanismo único, preços calculados e público nos EUA.
                  </span>
                </div>
              )}

              {/* NOTIFICAÇÃO DE FEEDBACK */}
              {suggestionFeedback && (
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {suggestionFeedback}
                </div>
              )}

              {/* PÍLULAS DE SUGESTÕES */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(dynamicSuggestions.length > 0 ? dynamicSuggestions : US_HOT_NICHES).map(
                  (item: any, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (item.whyItConverts) {
                          handleApplySuggestion(item);
                        } else {
                          setNiche(item.niche);
                          setProductIdea(item.idea);
                          setPriceUsd(item.price);
                          setOrderBumpUsd(item.bump);
                          setSuggestionFeedback(`Ideia carregada: "${item.label}"!`);
                          setTimeout(() => setSuggestionFeedback(null), 3000);
                        }
                      }}
                      className="group px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-[11px] font-semibold text-slate-200 transition flex items-center gap-1.5 text-left"
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] font-mono px-1 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                        ${item.price}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nicho / Público nos EUA
                </label>
                <input
                  type="text"
                  required
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nome ou Ideia da Oferta
                </label>
                <input
                  type="text"
                  required
                  value={productIdea}
                  onChange={(e) => setProductIdea(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {genMode === 'DROPSHIP_PRODUCT' && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 p-2.5">
                <span className="text-[11px] font-bold text-slate-300">
                  Qual loja física você ou seu parceiro usa?
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSegment('SHOPIFY_US')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      segment === 'SHOPIFY_US'
                        ? 'bg-lime-500/20 text-lime-300 border border-lime-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Shopify US
                  </button>
                  <button
                    type="button"
                    onClick={() => setSegment('WIX_US')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      segment === 'WIX_US'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Wix Stores US
                  </button>
                </div>
              </div>
            )}

            {genMode === 'AFFILIATE_OFFER' && (
              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1">
                  Link de Afiliado (Digistore24 / ClickBank / Kiwify — opcional)
                </label>
                <input
                  type="url"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  placeholder="https://www.digistore24.com/redir/..."
                  className="w-full rounded-xl bg-slate-950 border border-amber-500/40 px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {genMode === 'AFFILIATE_OFFER' ? 'Comissão (US$)' : 'Preço (US$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Order Bump (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={orderBumpUsd}
                  onChange={(e) => setOrderBumpUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Custo Prod. (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costUsd}
                  onChange={(e) => setCostUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Meta Mês (US$)
                </label>
                <input
                  type="number"
                  step="100"
                  value={monthlyProfitGoalUsd}
                  onChange={(e) => setMonthlyProfitGoalUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/60 border border-red-500/40 p-3 text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-3 text-xs font-extrabold text-white transition shadow-lg shadow-emerald-950/50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando Produto & Inteligência com GPT-4o (~12s)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {genMode === 'CREATE_EBOOK'
                    ? 'Gerar E-book Completo em Inglês & Salvar'
                    : genMode === 'AFFILIATE_OFFER'
                    ? 'Estruturar Oferta de Afiliado & Salvar'
                    : 'Estruturar Produto Dropshipping & Salvar'}
                </>
              )}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleIngestUrlProduct}
            className="lg:col-span-7 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                URL da Página do Produto (Digistore24, ClickBank, CJ, Shopify ou VSL)
              </label>
              <input
                type="url"
                required
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Preço / Comissão ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Order Bump ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={orderBumpUsd}
                  onChange={(e) => setOrderBumpUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Custo Fornecedor ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costUsd}
                  onChange={(e) => setCostUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Frete EUA ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={shippingUsd}
                  onChange={(e) => setShippingUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/60 border border-red-500/40 p-3 text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-5 py-3 text-xs font-extrabold text-white transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extraindo Página & Analisando no GPT-4o...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Importar Link & Salvar Produto
                </>
              )}
            </button>
          </form>
        )}

        {/* Simulador Financeiro Compacto */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">Simulador de Lucro por Venda</h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                US$ 1 = R$ {exchangeRateBrl.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-slate-950 border border-slate-800/90 p-3">
                <span className="text-[11px] text-slate-400 block">Faturamento / Venda</span>
                <span className="text-base font-extrabold text-white mt-0.5 block">
                  US$ {aovUsd.toFixed(2)}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  R$ {(aovUsd * exchangeRateBrl).toFixed(2)}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800/90 p-3">
                <span className="text-[11px] text-slate-400 block">Taxa ({feePercent}%)</span>
                <span className="text-base font-extrabold text-amber-400 mt-0.5 block">
                  -US$ {gatewayFeeUsd.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500">
                  -R$ {(gatewayFeeUsd * exchangeRateBrl).toFixed(2)}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800/90 p-3">
                <span className="text-[11px] text-slate-400 block">Teto p/ Anúncio (CPA)</span>
                <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
                  US$ {breakevenCpaUsd.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500">
                  R$ {(breakevenCpaUsd * exchangeRateBrl).toFixed(2)}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-cyan-500/30 p-3">
                <span className="text-[11px] text-cyan-300 font-semibold block">
                  Lucro Líquido / Venda
                </span>
                <span className="text-base font-extrabold text-cyan-400 mt-0.5 block">
                  US$ {netProfitPerSaleUsd.toFixed(2)}
                </span>
                <span className="text-[11px] text-emerald-300 font-bold">
                  R$ {(netProfitPerSaleUsd * exchangeRateBrl).toFixed(2)} limpos
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-200 block">
                Para lucrar <strong>US$ {numGoalUsd.toLocaleString('en-US')}/mês</strong> (R${' '}
                {(numGoalUsd * exchangeRateBrl).toLocaleString('pt-BR', {
                  maximumFractionDigits: 0,
                })}
                ):
              </span>
            </div>
            <span className="text-xs font-extrabold text-white bg-emerald-600/50 border border-emerald-400/40 px-2.5 py-1 rounded-lg shrink-0">
              {salesPerDayRequired} vendas/dia
            </span>
          </div>
        </div>
      </div>

      {/* LISTA DE PRODUTOS SALVOS */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          Produtos Cadastrados ({products.length})
        </h3>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
            <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              Nenhum produto salvo ainda. Use o gerador acima para criar seu primeiro produto em segundos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((prod) => {
              let avatar: any = {};
              let pains: any[] = [];
              try {
                avatar = JSON.parse(prod.avatarProfileJson || '{}');
              } catch {}
              try {
                pains = JSON.parse(prod.painPointsJson || '[]');
              } catch {}

              const prodAov = +(prod.priceUsd + prod.orderBumpUsd).toFixed(2);
              const prodNetPerSale = +(prod.breakevenCpaUsd - prod.targetCpaUsd).toFixed(2);
              const hasDeliverable = Boolean(avatar.deliverableContentMarkdown);
              const isEbookExpanded = expandedDeliverableId === prod.id;
              const isDetailsExpanded = expandedDetailsId === prod.id;

              return (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {avatar.productCreationMode === 'AFFILIATE_OFFER'
                            ? 'AFILIADO EUA'
                            : avatar.productCreationMode === 'CREATE_EBOOK'
                            ? 'E-BOOK IA'
                            : prod.segment}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          US$ {prodAov.toFixed(2)} • Lucro: R${' '}
                          {(prodNetPerSale * exchangeRateBrl).toFixed(2)}/venda
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-white truncate">
                        {prod.title}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {hasDeliverable && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDeliverableId(isEbookExpanded ? null : prod.id)
                            }
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-amber-300 transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {isEbookExpanded ? 'Ocultar E-book' : 'Ler E-book'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadDeliverable(
                                prod.title,
                                avatar.deliverableContentMarkdown
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-bold text-amber-300 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Baixar (.MD)
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDetailsId(isDetailsExpanded ? null : prod.id)
                        }
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                      >
                        {isDetailsExpanded ? 'Menos detalhes' : 'Público & Dores'}
                        {isDetailsExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => onNavigateTab(2)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-extrabold text-white transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Criar Anúncios →
                      </button>

                      <button
                        onClick={() => handleDelete(prod.id)}
                        disabled={deletingId === prod.id}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* E-book Gerado (Expansível) */}
                  {hasDeliverable && isEbookExpanded && (
                    <div className="rounded-xl bg-slate-950 border border-amber-500/30 p-3.5 space-y-2">
                      <div className="text-[11px] font-bold text-amber-300">
                        CONTEÚDO COMPLETO DO E-BOOK EM INGLÊS:
                      </div>
                      <pre className="whitespace-pre-wrap text-xs text-slate-200 bg-slate-900 p-3.5 rounded-lg border border-slate-800 max-h-80 overflow-y-auto font-sans leading-relaxed">
                        {avatar.deliverableContentMarkdown}
                      </pre>
                    </div>
                  )}

                  {/* Detalhes de Inteligência e Métricas (Expansível) */}
                  {isDetailsExpanded && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-3">
                      {avatar.whereToFindOrHostPt && (
                        <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/25 p-3 text-xs text-emerald-200">
                          <strong>📍 Como vender:</strong> {avatar.whereToFindOrHostPt}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                          <span className="font-bold text-emerald-400 block mb-1">
                            👤 Público Comprador (EUA)
                          </span>
                          <p className="text-slate-300">{avatar.demographics || 'N/A'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                          <span className="font-bold text-cyan-400 block mb-1">
                            🔑 Mecanismo Único
                          </span>
                          <p className="text-slate-300">{prod.uniqueMechanism}</p>
                        </div>
                        <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                          <span className="font-bold text-rose-400 block mb-1">
                            🔥 Principais Dores
                          </span>
                          <ul className="space-y-1 text-slate-300">
                            {pains.slice(0, 3).map((p: any, idx: number) => (
                              <li key={idx} className="flex items-start gap-1">
                                <CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                                <span>{typeof p === 'string' ? p : p.painEn}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
