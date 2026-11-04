'use client';

import React, { useState } from 'react';
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
  ArrowRight,
  Wand2,
  BookOpen,
  Download,
  Link as LinkIcon,
  Award,
  ShoppingBag,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ProductData, SegmentType } from '@/types/autopilot';

interface Module1ProductsProps {
  products: ProductData[];
  selectedSegment: SegmentType;
  exchangeRateBrl: number;
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: number) => void;
}

const US_HOT_NICHES = [
  {
    label: '🥗 Emagrecimento & Keto Reset (EUA)',
    niche: 'Weight Loss & 21-Day Metabolic Keto Reset for American Women 35+',
    idea: '21-Day Cortisol & Belly Fat Reset Protocol (Digital Guide + Meal Plan)',
    price: '37.00',
    bump: '14.00',
  },
  {
    label: '🐕 Adestramento de Cães em Casa',
    niche: 'Dog Obedience & Stop Barking At-Home Training Protocol',
    idea: 'The 15-Minute Calm Dog Brain Training System for US Pet Owners',
    price: '29.00',
    bump: '12.00',
  },
  {
    label: '🧘‍♀️ Alívio de Dor nas Costas & Nervo Ciático',
    niche: 'Sciatica & Lower Back Pain 10-Minute Daily Relief Routine',
    idea: 'Spine Release At-Home Mobility Protocol (No Equipment Needed)',
    price: '39.00',
    bump: '15.00',
  },
  {
    label: '😴 Sono Profundo & Menopausa Natural',
    niche: 'Natural Deep Sleep & Hormone Balance Protocol for Women 40+',
    idea: 'The 7-Night Deep Sleep & Night Sweat Relief Blueprint',
    price: '37.00',
    bump: '14.00',
  },
  {
    label: '📦 Gadget Físico: Corretor Postural / Massageador Cervical',
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

  // Alterna entre "GERADOR IA DE PRODUTO / AFILIADO" vs "COLAR LINK EXISTENTE"
  const [inputTab, setInputTab] = useState<'AI_GENERATOR' | 'URL_SCRAPER'>('AI_GENERATOR');

  // Estado do Gerador IA de Produtos / Afiliados / Dropshipping
  const [genMode, setGenMode] = useState<'CREATE_EBOOK' | 'AFFILIATE_OFFER' | 'DROPSHIP_PRODUCT'>(
    'CREATE_EBOOK'
  );
  const [niche, setNiche] = useState(US_HOT_NICHES[0].niche);
  const [productIdea, setProductIdea] = useState(US_HOT_NICHES[0].idea);
  const [affiliateLink, setAffiliateLink] = useState('');

  // Estado do Scraper de Link
  const [sourceUrl, setSourceUrl] = useState('');

  // Estado Financeiro compartilhado com a Calculadora
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
  const [showWhereToFindGuide, setShowWhereToFindGuide] = useState<boolean>(true);

  // Calculo em tempo real na interface
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
  const breakevenRoas = breakevenCpaUsd > 0 ? +(aovUsd / breakevenCpaUsd).toFixed(2) : 9.99;
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
    <div className="space-y-8">
      {/* GUIA COMPLETO: ONDE CONSEGUIR PRODUTOS PARA VENDER SEM ESTOQUE E GANHAR COMISSÃO EM DÓLAR */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1">
              <Award className="w-3.5 h-3.5" />
              NÃO TEM PRODUTO? VEJA AS 3 FORMAS DE VENDER SEM ESTOQUE E GANHAR EM DÓLAR
            </span>
            <h2 className="text-xl font-extrabold text-white">
              Onde Conseguir Produtos para Ganhar Comissão em Dólar (Ou Criar o Seu em 1 Clique)
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowWhereToFindGuide(!showWhereToFindGuide)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-bold text-amber-300 hover:text-white shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            {showWhereToFindGuide ? 'Esconder Sites Parceiros' : 'Ver Sites Onde Pegar Produtos'}
            {showWhereToFindGuide ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {showWhereToFindGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Caminho 1: Afiliado Internacional */}
            <div className="rounded-xl bg-slate-950/90 border border-amber-500/30 p-4 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold text-[11px] inline-block">
                  OPÇÃO A • GANHAR COMISSÃO (AFILIADO EUA)
                </span>
                <h3 className="text-sm font-extrabold text-white">
                  1. Vender Produtos Prontos na Digistore24 ou ClickBank (Comissão de 50% a 85% em Dólar)
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Você se cadastra grátis, escolhe um produto que já existe nos EUA, clica em{' '}
                  <strong>&ldquo;Promote Now&rdquo;</strong> e ganha seu link de comissão. Se o produto custa US$ 100 e paga 70%, você ganha <strong>US$ 70 (~R$ 380) por venda</strong> sem ter produto e sem entregar nada!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                <a
                  href="https://www.digistore24.com/en/home/marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 px-3 py-1.5 font-bold text-amber-300"
                >
                  Abrir Digistore24 Marketplace <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.clickbank.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-bold text-slate-200"
                >
                  Abrir ClickBank <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Caminho 2: Gerador IA de E-book Próprio */}
            <div className="rounded-xl bg-slate-950/90 border border-emerald-500/30 p-4 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] inline-block">
                  OPÇÃO B • CRIAR E-BOOK COM NOSSA IA (90% DE LUCRO)
                </span>
                <h3 className="text-sm font-extrabold text-white">
                  2. Nossa IA Cria o E-book/Guia Completo em Inglês Agora para Você Vender na Kiwify!
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Não quer dividir comissão com ninguém? Use o <strong>Gerador IA abaixo</strong>! Ele escreve o guia/protocolo em inglês completo em 15 segundos. Você baixa o arquivo, cadastra na <strong>Kiwify Internacional</strong> e fica com <strong>90% do valor em Dólar</strong>!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                <a
                  href="https://dashboard.kiwify.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 px-3 py-1.5 font-bold text-emerald-300"
                >
                  Abrir Kiwify (Cadastrar Produto) <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Caminho 3: Dropshipping Físico EUA */}
            <div className="rounded-xl bg-slate-950/90 border border-cyan-500/30 p-4 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-extrabold text-[11px] inline-block">
                  OPÇÃO C • DROPSHIPPING FÍSICO SEM ESTOQUE
                </span>
                <h3 className="text-sm font-extrabold text-white">
                  3. Pegar Produtos Físicos em Galpões nos EUA (CJ Dropshipping & Zendrop)
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Você escolhe um produto físico na <strong>CJ Dropshipping</strong> ou <strong>Zendrop</strong>, coloca na sua loja por US$ 59, e quando o americano compra de você, o fornecedor cobra US$ 15 e envia direto para a casa do cliente!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                <a
                  href="https://cjdropshipping.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 px-3 py-1.5 font-bold text-cyan-300"
                >
                  Abrir CJ Dropshipping US <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.zendrop.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-bold text-slate-200"
                >
                  Abrir Zendrop <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SELETOR DE MODO: GERADOR IA DE PRODUTO DO ZERO vs COLAR LINK EXISTENTE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setInputTab('AI_GENERATOR')}
          className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
            inputTab === 'AI_GENERATOR'
              ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg'
              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Wand2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-extrabold text-white">
              OPÇÃO 1: Não tenho link — Quero que a IA Crie o Produto ou Oferta Agora
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Escolha um nicho campeão nos EUA e a IA cria o E-book/Protocolo inteiro em inglês (ou estrutura sua oferta de Afiliado/Dropshipping) com 1 clique!
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setInputTab('URL_SCRAPER')}
          className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
            inputTab === 'URL_SCRAPER'
              ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg'
              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <LinkIcon className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-extrabold text-white">
              OPÇÃO 2: Já peguei um Link (Digistore24, ClickBank, CJ, Shopify ou Site)
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Cole o link da página do produto que você escolheu para o sistema ler a página inteira, extrair as dores e preparar seus anúncios!
            </p>
          </div>
        </button>
      </div>

      {/* ÁREA PRINCIPAL: FORMULÁRIO ESCOLHIDO + CALCULADORA DE LUCRO EM TEMPO REAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {inputTab === 'AI_GENERATOR' ? (
          <form
            onSubmit={handleGenerateProductWithAi}
            className="lg:col-span-7 rounded-2xl border border-emerald-500/40 bg-slate-900/85 p-6 space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Gerador IA de Produtos & Ofertas em Dólar (Sem Estoque)
                </h3>
                <p className="text-xs text-slate-400">
                  Escolha abaixo como você quer ganhar dinheiro com este produto:
                </p>
              </div>
            </div>

            {/* Escolha dos 3 modelos sem estoque */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setGenMode('CREATE_EBOOK');
                  setSegment('KIWIFY_GLOBAL');
                  setCostUsd('0.00');
                  setShippingUsd('0.00');
                }}
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  genMode === 'CREATE_EBOOK'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                📘 1. Criar E-book/Protocolo Próprio (90% Lucro na Kiwify)
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
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  genMode === 'AFFILIATE_OFFER'
                    ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                🤝 2. Vender como Afiliado (Ganhar Comissão ClickBank/Digistore)
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
                className={`p-3 rounded-xl border text-left text-xs transition ${
                  genMode === 'DROPSHIP_PRODUCT'
                    ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                📦 3. Dropshipping Físico EUA (Fornecedor CJ/Zendrop)
              </button>
            </div>

            {/* Botões de Nichos Prontos que Mais Vendem nos EUA */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-300 block">
                🔥 Clique em uma ideia campeã nos EUA abaixo (ou escreva a sua):
              </span>
              <div className="flex flex-wrap gap-2">
                {US_HOT_NICHES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNiche(item.niche);
                      setProductIdea(item.idea);
                      setPriceUsd(item.price);
                      setOrderBumpUsd(item.bump);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Nicho / Mercado nos EUA
                </label>
                <input
                  type="text"
                  required
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Nome ou Ideia do Produto / Oferta
                </label>
                <input
                  type="text"
                  required
                  value={productIdea}
                  onChange={(e) => setProductIdea(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {genMode === 'AFFILIATE_OFFER' && (
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  Seu Link de Afiliado da Digistore24 / ClickBank / Kiwify (Opcional — pode colocar depois)
                </label>
                <input
                  type="url"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  placeholder="Ex: https://www.digistore24.com/redir/123456/seu_usuario/"
                  className="w-full rounded-xl bg-slate-950 border border-amber-500/40 px-3.5 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  {genMode === 'AFFILIATE_OFFER'
                    ? 'Sua Comissão (US$)'
                    : 'Preço Venda (US$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Extra Checkout (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={orderBumpUsd}
                  onChange={(e) => setOrderBumpUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Custo Fornecedor (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costUsd}
                  onChange={(e) => setCostUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Meta Mensal (US$)
                </label>
                <input
                  type="number"
                  step="100"
                  value={monthlyProfitGoalUsd}
                  onChange={(e) => setMonthlyProfitGoalUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/60 border border-red-500/40 p-3.5 text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-3.5 text-sm font-extrabold text-white transition shadow-lg shadow-emerald-950/50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando Produto Completo em Inglês no GPT-4o (~12s)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {genMode === 'CREATE_EBOOK'
                    ? 'Criar Meu E-book/Protocolo Completo em Inglês & Salvar no Sistema'
                    : genMode === 'AFFILIATE_OFFER'
                    ? 'Estruturar Oferta de Afiliado em Dólar & Salvar no Sistema'
                    : 'Estruturar Produto de Dropshipping EUA & Salvar no Sistema'}
                </>
              )}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleIngestUrlProduct}
            className="lg:col-span-7 rounded-2xl border border-cyan-500/40 bg-slate-900/85 p-6 space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Importar Link de Produto (Digistore24, ClickBank, CJ Dropshipping ou Loja)
                </h3>
                <p className="text-xs text-slate-400">
                  Cole o link da página de vendas do produto para o sistema extrair tudo automaticamente:
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                1. Cole aqui o Link (URL) da Página do Produto ou Oferta de Afiliado
              </label>
              <input
                type="url"
                required
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Ex: https://www.digistore24.com/... ou link do produto na CJ / Shopify"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Preço / Comissão (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Extra Checkout (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={orderBumpUsd}
                  onChange={(e) => setOrderBumpUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Custo Fornecedor (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costUsd}
                  onChange={(e) => setCostUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Frete EUA (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={shippingUsd}
                  onChange={(e) => setShippingUsd(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/60 border border-red-500/40 p-3.5 text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-5 py-3.5 text-sm font-extrabold text-white transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lendo o Link e Extraindo Inteligência no GPT-4o...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Importar Link, Analisar com IA & Salvar Produto
                </>
              )}
            </button>
          </form>
        )}

        {/* Calculadora Explicada em Linguagem Simples (USD & BRL) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-extrabold text-white">
                Quanto Você Ganha por Venda (Em Dólar e Real)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Câmbio Comercial ao vivo:{' '}
              <strong className="text-emerald-300">
                1 Dólar = R$ {exchangeRateBrl.toFixed(2)}
              </strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-xs font-bold text-slate-300 block">
                  💰 Valor por Venda / Comissão
                </span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">
                  US$ {aovUsd.toFixed(2)}
                </span>
                <span className="text-xs text-emerald-400 font-semibold block">
                  = R$ {(aovUsd * exchangeRateBrl).toFixed(2)}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-xs font-bold text-slate-300 block">
                  🏦 Taxa Plataforma ({feePercent}%)
                </span>
                <span className="text-xl font-extrabold text-amber-400 mt-0.5 block">
                  -US$ {gatewayFeeUsd.toFixed(2)}
                </span>
                <span className="text-xs text-amber-300/80 block">
                  = -R$ {(gatewayFeeUsd * exchangeRateBrl).toFixed(2)}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-xs font-bold text-slate-300 block">
                  🛑 Sobram Antes do Anúncio
                </span>
                <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">
                  US$ {breakevenCpaUsd.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 block">
                  = R$ {(breakevenCpaUsd * exchangeRateBrl).toFixed(2)}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-cyan-500/30 p-3.5">
                <span className="text-xs font-bold text-cyan-300 block">
                  🎯 Seu Lucro Limpo (Pagando Anúncio)
                </span>
                <span className="text-xl font-extrabold text-cyan-400 mt-0.5 block">
                  US$ {netProfitPerSaleUsd.toFixed(2)}
                </span>
                <span className="text-xs text-emerald-300 font-bold block">
                  = R$ {(netProfitPerSaleUsd * exchangeRateBrl).toFixed(2)} limpos/venda
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/40 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-emerald-200">
              <span>Sua Meta Mensal:</span>
              <strong className="text-white">
                US$ {numGoalUsd.toLocaleString('en-US')} (R${' '}
                {(numGoalUsd * exchangeRateBrl).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                /mês)
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-300 pt-1 border-t border-emerald-500/20">
              <span>Vendas por dia necessárias:</span>
              <strong className="text-sm text-white bg-emerald-600/40 px-2.5 py-0.5 rounded-lg">
                Apenas {salesPerDayRequired} vendas/dia
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Produtos Reais Salvos no Banco de Dados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            Meus Produtos Prontos para Vender ({products.length})
          </h3>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">
              Você ainda não gerou nem importou nenhum produto
            </h4>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1">
              Basta clicar em uma das ideias prontas no quadro acima e apertar o botão verde{' '}
              <strong>&ldquo;Criar Meu E-book/Protocolo Completo em Inglês & Salvar no Sistema&rdquo;</strong>!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
              const isExpanded = expandedDeliverableId === prod.id;

              return (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {avatar.productCreationMode === 'AFFILIATE_OFFER'
                            ? 'AFILIADO EM DÓLAR'
                            : avatar.productCreationMode === 'CREATE_EBOOK'
                            ? 'PRODUTO PRÓPRIO GERADO PELA IA'
                            : prod.segment}
                        </span>
                        <a
                          href={prod.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1 truncate max-w-md"
                        >
                          {prod.sourceUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <h4 className="text-lg font-extrabold text-white">
                        {prod.title}{' '}
                        {avatar.titlePt && (
                          <span className="text-sm font-normal text-slate-400">
                            ({avatar.titlePt})
                          </span>
                        )}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {hasDeliverable && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadDeliverable(
                              prod.title,
                              avatar.deliverableContentMarkdown
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 px-3.5 py-2 text-xs font-extrabold text-amber-300 transition"
                        >
                          <Download className="w-4 h-4" />
                          Baixar Arquivo do E-book (.MD / Texto)
                        </button>
                      )}

                      <button
                        onClick={() => onNavigateTab(2)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold text-white transition"
                      >
                        <Sparkles className="w-4 h-4" />
                        Criar Anúncios para este Produto (Ir para Aba 2) →
                      </button>

                      <button
                        onClick={() => handleDelete(prod.id)}
                        disabled={deletingId === prod.id}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition"
                        title="Excluir produto do banco"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Instrução de Onde Hospedar / Vender */}
                  {avatar.whereToFindOrHostPt && (
                    <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3.5 text-xs text-emerald-200">
                      <strong>📍 Como colocar este produto para vender:</strong>{' '}
                      {avatar.whereToFindOrHostPt}
                    </div>
                  )}

                  {/* Conteúdo Completo do E-book Gerado pela IA (Expansível) */}
                  {hasDeliverable && (
                    <div className="rounded-xl bg-slate-950 border border-amber-500/30 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                          <FileText className="w-4 h-4" />
                          CONTEÚDO COMPLETO DO SEU PRODUTO DIGITAL EM INGLÊS (PRONTO PARA VENDER NA KIWIFY)
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDeliverableId(isExpanded ? null : prod.id)
                          }
                          className="text-xs font-bold text-cyan-300 hover:underline inline-flex items-center gap-1"
                        >
                          {isExpanded
                            ? 'Recolher Conteúdo do E-book'
                            : '📖 Clique para Ler o E-book/Protocolo Gerado'}
                        </button>
                      </div>

                      {isExpanded && (
                        <pre className="whitespace-pre-wrap text-xs text-slate-200 bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto font-sans leading-relaxed">
                          {avatar.deliverableContentMarkdown}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Métricas Financeiras Reais do Produto */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Valor / Comissão</span>
                      <span className="text-sm font-bold text-white">${prodAov.toFixed(2)}</span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Taxa Plataforma</span>
                      <span className="text-sm font-bold text-amber-400">
                        {prod.gatewayFeePercent}% + ${prod.gatewayFeeFixedUsd.toFixed(2)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Máximo p/ Anúncio</span>
                      <span className="text-sm font-bold text-emerald-400">
                        ${prod.breakevenCpaUsd.toFixed(2)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">ROAS Mínimo</span>
                      <span className="text-sm font-bold text-white">{prod.breakevenRoas}x</span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Gasto Ideal/Venda</span>
                      <span className="text-sm font-bold text-cyan-400">
                        ${prod.targetCpaUsd.toFixed(2)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Lucro Limpo em R$</span>
                      <span className="text-sm font-bold text-emerald-300">
                        R$ {(prodNetPerSale * exchangeRateBrl).toFixed(2)}/venda
                      </span>
                    </div>
                  </div>

                  {/* Inteligência Extraída pelo GPT-4o */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        👤 Quem Compra nos EUA
                      </h5>
                      <p className="text-xs text-slate-300">
                        <strong>Perfil:</strong> {avatar.demographics || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-300">
                        <strong>Desejos:</strong> {avatar.psychographics || 'N/A'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        🔑 Mecanismo Único da Oferta
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {prod.uniqueMechanism || 'Extraído da oferta.'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                        🔥 5 Dores Reais do Cliente (EN / PT)
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {pains.map((p: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <span>
                              {typeof p === 'string'
                                ? p
                                : `${p.painEn} — (${p.painPt || ''})`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
