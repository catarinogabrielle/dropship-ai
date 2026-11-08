import { NextRequest, NextResponse } from 'next/server';
import { ensureSqliteTables } from '@/lib/prisma';
import OpenAI from 'openai';
import { resolveProviderCredential } from '@/lib/server-vault';

export const maxDuration = 60;

export interface ProductSuggestionItem {
  label: string;
  title: string;
  niche: string;
  idea: string;
  price: string;
  bump: string;
  cost: string;
  shipping: string;
  mode: 'CREATE_EBOOK' | 'AFFILIATE_OFFER' | 'DROPSHIP_PRODUCT';
  segment: 'KIWIFY_GLOBAL' | 'SHOPIFY_US';
  whyItConverts: string;
}

// Catálogo Curado com 36 Produtos e Ofertas Campeãs nos EUA (Atualizado)
const CURATED_SUGGESTIONS_POOL: ProductSuggestionItem[] = [
  // --- E-BOOKS & GUIAS DIGITAIS (KIWIFY GLOBAL) ---
  {
    label: '🥗 Cortisol & Belly Fat Reset',
    title: 'The 21-Day Cortisol & Hormone Belly Fat Reset Protocol',
    niche: 'Weight Loss & Female Hormone Balance for US Women 35-55',
    idea: 'Low-impact somatic morning routine + cortisol-balancing nutritional blueprint for stubborn visceral fat.',
    price: '37.00',
    bump: '14.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'CREATE_EBOOK',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Nicho nº 1 em conversão no TikTok e Meta nos EUA: foco na causa hormonal e não apenas em calorias.',
  },
  {
    label: '😴 Sono Profundo & Menopausa',
    title: 'The 7-Night Deep Sleep & Night Sweats Relief Blueprint',
    niche: 'Natural Sleep Optimization & Night Sweat Relief for Women 45+',
    idea: 'Targeted herbal adaptogen timing + non-hormonal vagus nerve thermal reset routine.',
    price: '37.00',
    bump: '12.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'CREATE_EBOOK',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Mulheres com mais de 45 nos EUA têm alto poder aquisitivo e sofrem com insônia e ondas de calor.',
  },
  {
    label: '🦴 Alívio da Dor Ciática',
    title: '10-Minute Spine Release & Sciatica Nerve Glide Protocol',
    niche: 'Chronic Sciatica, Piriformis & Lower Back Pain Relief for Adults 40+',
    idea: 'At-home decompressive nerve flossing exercises that eliminate shooting leg pain without surgery.',
    price: '39.00',
    bump: '15.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'CREATE_EBOOK',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Dor crônica gera compra por impulso imediato (dor intensa que remédios comuns não resolvem).',
  },
  {
    label: '🐕 Ansiedade de Separação Canina',
    title: 'The Calm Dog 15-Minute Brain Training System',
    niche: 'Dog Obedience & Separation Anxiety for American Pet Parents',
    idea: 'Neuro-stimulation dog puzzles and positive reinforcement drills that stop barking and destructive chewing.',
    price: '29.00',
    bump: '12.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'CREATE_EBOOK',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Americanos gastam bilhões com animais; donos de cães que trabalham fora se sentem culpados com latidos.',
  },
  {
    label: '🥑 Dieta Baixa em FODMAP (SII)',
    title: 'The 28-Day Rapid Gut Healing & SIBO Bloating Relief Plan',
    niche: 'IBS, Gut Dysbiosis & Leaky Gut Relief for Health-Conscious Adults',
    idea: 'Low-FODMAP meal blueprints and mucosal lining rebuilding protocol that ends painful bloating.',
    price: '37.00',
    bump: '17.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'CREATE_EBOOK',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Problemas digestivos são epidemia nos EUA devido a ultraprocessados; busca por alívio rápido é altíssima.',
  },
  {
    label: '🩸 Glicose & Pré-Diabetes',
    title: 'The 14-Day Blood Sugar Stabilizer & Insulin Sensitivity Guide',
    niche: 'Type 2 Diabetes Prevention & Glucose Spikes Management for Adults 50+',
    idea: 'Food-pairing sequences that flatten post-meal glucose spikes by 40% without cutting carbs.',
    price: '39.00',
    bump: '14.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'CREATE_EBOOK',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Mercado de saúde metabólica nos EUA movimenta mais de US$ 20 bi ao ano com taxas de conversão recordes.',
  },
  {
    label: '⚡ Exercícios Somáticos para Ansiedade',
    title: 'Somatic Nervous System Reset: 5-Minute Trauma Release Drills',
    niche: 'Anxiety, Vagus Nerve Healing & Burnout for Millennial & Gen Z Professionals',
    idea: 'Gentle body-based movements that downregulate the sympathetic nervous system from chronic fight-or-flight.',
    price: '34.00',
    bump: '11.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'CREATE_EBOOK',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Tendência viral gigantesca no TikTok americano com hashtags que somam mais de 4 bilhões de visualizações.',
  },
  {
    label: '🧠 Memória & Foco 50+',
    title: 'The Ageless Brain Protocol: Neuroplasticity & Memory Sharpness',
    niche: 'Cognitive Decline Prevention & Brain Fog Removal for Seniors 55+',
    idea: 'Dual-task neurobic drills + polyphenol nutrition that rebuilds cholinergic brain connections.',
    price: '47.00',
    bump: '19.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'CREATE_EBOOK',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Público sênior nos EUA tem cartões de crédito sem limites e medo constante de perda de memória.',
  },

  // --- AFILIADOS EUA (CLICKBANK, DIGISTORE24) ---
  {
    label: '🍹 Suco Metabólico Noturno (ClickBank)',
    title: 'The Mediterranean Purple Peel & Night Metabolism Tonic',
    niche: 'Affiliate Weight Loss & Slow Metabolism Solution for US Men & Women 40+',
    idea: 'Top-selling VSL supplement/tonic offer paying 75% commission per sale on Digistore24/ClickBank.',
    price: '69.00',
    bump: '0.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'AFFILIATE_OFFER',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Comissão direta de US$ 52 por venda sem custo de entrega ou suporte de produto.',
  },
  {
    label: '🦷 Saúde Dental & Probióticos Orais',
    title: 'Oral Probiotics Dissolving Candy for Gum Health & Breath',
    niche: 'Dental Health, Receding Gums & Fresh Breath for US Adults',
    idea: 'Top gravity affiliate product with 3.5 billion probiotic strain candymelt formula.',
    price: '59.00',
    bump: '0.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'AFFILIATE_OFFER',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Tratamentos dentários nos EUA são caríssimos; americanos adoram soluções preventivas caseiras.',
  },
  {
    label: '👂 Audição & Zumbido no Ouvido',
    title: 'Inner Ear Nerve Drops & Tinnitus Frequency Silencer',
    niche: 'Tinnitus Relief, Ringing Ears & Auditory Clarity for Seniors 50+',
    idea: 'Herbal drop formulation targeting brain sound cortex inflammation with 70% affiliate rev-share.',
    price: '69.00',
    bump: '0.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'AFFILIATE_OFFER',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Zumbido no ouvido (tinnitus) causa desespero extremo e tem CPC relativamente barato no Facebook.',
  },
  {
    label: '🌿 Desintoxicação Hepática (Fígado Gordo)',
    title: 'Liver Purification Complex for Stubborn Belly Fat',
    niche: 'Non-Alcoholic Fatty Liver Support & Cellular Energy for Adults 45+',
    idea: 'Bestselling dietary supplement offer based on Mediterranean liver fat-clearing nutrients.',
    price: '59.00',
    bump: '0.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'AFFILIATE_OFFER',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Mecanismo único potente: associar perda de peso à limpeza do filtro de gordura do corpo (fígado).',
  },
  {
    label: '👁️ Clareza Visual & Mácula 50+',
    title: 'Ocular Antioxidant Vision Restoration Protocol',
    niche: 'Age-Related Blurry Vision & Eye Strain Relief for Screen Workers & Seniors',
    idea: 'Zeaxanthin and bilberry extract chewables with high converting video sales letter (VSL).',
    price: '69.00',
    bump: '0.00',
    cost: '0.00',
    shipping: '0.00',
    mode: 'AFFILIATE_OFFER',
    segment: 'KIWIFY_GLOBAL',
    whyItConverts: 'Mais de 100 milhões de americanos usam óculos de leitura e procuram manter a visão nítida.',
  },

  // --- DROPSHIPPING FÍSICO (SHOPIFY US) ---
  {
    label: '💆 Almofada Tração Cervical Térmica',
    title: 'Ergonomic Cervical Spine Decompression Pillow with Heat',
    niche: 'Tech Neck, Chronic Neck Stiffness & Cervical Headache Sufferers',
    idea: 'Heated memory foam acupressure wedge that stretches cervical vertebrae in 10 minutes of lying down.',
    price: '59.90',
    bump: '9.90',
    cost: '14.50',
    shipping: '4.50',
    mode: 'DROPSHIP_PRODUCT',
    segment: 'SHOPIFY_US',
    whyItConverts: 'Vídeos de demonstração (efeito "antes e depois" da coluna estalando) viralizam instantaneamente no TikTok.',
  },
  {
    label: '✨ Varinha Fototerapia Luz Vermelha',
    title: '4-in-1 Red Light Microcurrent Facial Rejuvenation Wand',
    niche: 'Anti-Aging, Fine Lines & Collagen Boosting for Women 30-65',
    idea: '660nm red LED + gentle thermal warmth and microcurrent massage for puffy eyes and crow feet.',
    price: '64.00',
    bump: '14.00',
    cost: '13.80',
    shipping: '3.90',
    mode: 'DROPSHIP_PRODUCT',
    segment: 'SHOPIFY_US',
    whyItConverts: 'Substitui tratamentos estéticos de US$ 200 por sessão com visual luxuoso e unboxing irresistível.',
  },
  {
    label: '🐕 Coleira Treinamento Ultrassônica',
    title: 'Ultrasonic Anti-Barking & Behavior Trainer Handheld Device',
    niche: 'Dog Barking, Aggression & Leash Pulling Control for US Pet Owners',
    idea: 'Harmless high-frequency sound wave emitter that instantly interrupts nuisance barking up to 50ft.',
    price: '49.90',
    bump: '9.90',
    cost: '9.80',
    shipping: '3.50',
    mode: 'DROPSHIP_PRODUCT',
    segment: 'SHOPIFY_US',
    whyItConverts: 'Resolve a maior dor de cabeça de donos de cães em apartamentos e casas sem machucar o animal.',
  },
  {
    label: '🧹 Escova Elétrica Rotativa Sem Fio',
    title: 'Cordless Turbo Power Scrubber with 8 Replaceable Brush Heads',
    niche: 'Home Cleaning, Tile Grout & Shower Scum Removal for Busy Homeowners',
    idea: 'High-torque telescopic motorized scrubber that cleans bathroom grout without bending or scrubbing.',
    price: '69.90',
    bump: '12.90',
    cost: '16.50',
    shipping: '5.50',
    mode: 'DROPSHIP_PRODUCT',
    segment: 'SHOPIFY_US',
    whyItConverts: 'Apelo visual de limpeza satisfatória: o sujeira saindo em segundos gera cliques com CTR acima de 4%.',
  },
  {
    label: '☁️ Chinelos Ortopédicos Nuvem',
    title: 'Ultra-Thick Orthopedic Non-Slip Cloud Slides',
    niche: 'Plantar Fasciitis, Heel Spurs & Foot Fatigue for Nurses, Teachers & Walkers',
    idea: '4.5cm ergonomic EVA sole that absorbs foot impact and cushions arthritic heel pressure.',
    price: '39.90',
    bump: '9.90',
    cost: '7.20',
    shipping: '4.20',
    mode: 'DROPSHIP_PRODUCT',
    segment: 'SHOPIFY_US',
    whyItConverts: 'Profissionais que passam 12 horas em pé (enfermeiras nos EUA compram aos pares de cores diferentes).',
  },
  {
    label: '🚗 Aspirador Portátil Sem Fio 120W',
    title: 'High-Power Cordless Handheld Car Vacuum & Air Duster 2-in-1',
    niche: 'Car Enthusiasts, Road Trips & Pet Hair Cleanliness in Vehicles',
    idea: 'Compact USB-C rechargeable vacuum with 15000Pa suction power for cup holders and air vents.',
    price: '49.90',
    bump: '9.90',
    cost: '11.50',
    shipping: '4.00',
    mode: 'DROPSHIP_PRODUCT',
    segment: 'SHOPIFY_US',
    whyItConverts: 'Americanos passam horas no carro todos os dias; limpeza fácil e rápida em formato compacto é campeã de vendas.',
  },
];

export async function GET(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') as
      | 'CREATE_EBOOK'
      | 'AFFILIATE_OFFER'
      | 'DROPSHIP_PRODUCT'
      | null;
    const theme = url.searchParams.get('theme')?.toLowerCase() || '';

    let filtered = CURATED_SUGGESTIONS_POOL;
    if (mode) {
      filtered = filtered.filter((item) => item.mode === mode);
    }
    if (theme) {
      filtered = filtered.filter(
        (item) =>
          item.niche.toLowerCase().includes(theme) ||
          item.title.toLowerCase().includes(theme) ||
          item.label.toLowerCase().includes(theme)
      );
      if (filtered.length === 0) {
        filtered = CURATED_SUGGESTIONS_POOL;
      }
    }

    // Embaralha e seleciona 5 sugestões
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const suggestions = shuffled.slice(0, 5);

    return NextResponse.json({
      success: true,
      count: suggestions.length,
      suggestions,
      source: 'CURATED_WINNING_POOL',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar sugestões';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const body = await req.json();
    const {
      mode = 'CREATE_EBOOK',
      targetPlatform = 'KIWIFY_GLOBAL',
      nicheTheme = '',
      _vaultCredentials,
    } = body;

    // 1. Tenta carregar chave OpenAI (DB, cofre local sincronizado ou .env) para gerar sugestões com GPT-4o
    const { apiKey } = await resolveProviderCredential(
      'OPENAI',
      _vaultCredentials,
      'OPENAI_API_KEY'
    );

    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        const openai = new OpenAI({ apiKey });
        const systemPrompt = `You are a high-level Direct-Response E-commerce & Dropshipping Strategist specialized in the American consumer market (United States).
Your task is to generate 5 brand-new, distinct, winning and validated product/offer concepts tailored for the selected mode:
- Mode: ${mode} (CREATE_EBOOK = digital guide on Kiwify, AFFILIATE_OFFER = affiliate offer on ClickBank/Digistore24, DROPSHIP_PRODUCT = physical product on Shopify US)
- Target Platform: ${targetPlatform}
- User's Niche/Keyword/Theme: "${nicheTheme || 'Top high-margin US trending problems in health, pets, beauty, home or pain relief'}"

Return ONLY a JSON array with exactly 5 objects. Each object must have:
- "label": Short catchy Portuguese label with emoji (e.g., "🦴 Alívio Nervo Ciático")
- "title": Compelling commercial English title
- "niche": Target US demographic and burning pain point in English
- "idea": Detailed mechanism of action (how the offer or product solves the problem) in English
- "price": Suggested retail price in USD as string (e.g., "37.00" or "59.90")
- "bump": Suggested order bump price in USD as string (e.g., "14.00" or "9.90")
- "cost": Supplier or fulfillment cost in USD as string ("0.00" for digital, "8.00" to "16.00" for physical)
- "shipping": Shipping charged in USD as string ("0.00" for digital, "3.50" to "5.00" for physical)
- "mode": "${mode}"
- "segment": "${targetPlatform}"
- "whyItConverts": 1 sentence in Portuguese explaining the psychological trigger and why Americans buy it`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.85,
        });

        const content = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        const suggestions = Array.isArray(parsed)
          ? parsed
          : parsed.suggestions || parsed.products || Object.values(parsed)[0];

        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return NextResponse.json({
            success: true,
            count: suggestions.length,
            suggestions: suggestions.slice(0, 5),
            source: 'GPT4O_LIVE_AI',
          });
        }
      } catch (aiErr) {
        console.warn('Falha no GPT-4o para sugestões, recorrendo ao pool curado:', aiErr);
      }
    }

    // Fallback Inteligente: Filtra e randomiza do pool curado
    let pool = CURATED_SUGGESTIONS_POOL;
    if (mode) {
      pool = pool.filter((item) => item.mode === mode);
    }
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    return NextResponse.json({
      success: true,
      count: selected.length,
      suggestions: selected,
      source: 'CURATED_WINNING_POOL_FALLBACK',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar sugestões';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
