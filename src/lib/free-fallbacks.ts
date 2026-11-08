export interface ProductFallbackInput {
  mode: string;
  niche: string;
  productIdea: string;
  affiliateNetwork?: string;
  segment: string;
  priceUsd: number;
  orderBumpUsd: number;
}

export interface GeneratedProductPayload {
  title: string;
  titlePt: string;
  uniqueMechanism: string;
  avatarProfile: {
    demographics: string;
    psychographics: string;
    usBuyingTriggers: string;
    orderBumpSuggestionEn: string;
    orderBumpSuggestionPt: string;
    productCreationMode: string;
    whereToFindOrHostPt: string;
    deliverableContentMarkdown: string;
  };
  painPoints: Array<{ painEn: string; painPt: string }>;
}

export interface CreativeGenerationItem {
  angle: string;
  hookEn: string;
  bodyEn: string;
  ctaEn: string;
  metaPrimaryText: string;
  metaHeadline: string;
  googleHeadlines: string[];
  googleDescriptions: string[];
  orderBumpCopyEn: string;
  translationPt: string;
}

function cleanKeyword(text: string, fallback: string): string {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}

function toCleanTitleCase(text: string): string {
  const smallWords = new Set(['and', 'or', 'for', 'the', 'of', 'in', 'to', 'with', 'at', 'by']);
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && smallWords.has(lower)) return lower;
      return word
        .split('-')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
        .join('-');
    })
    .join(' ');
}

function deriveShortTopic(niche: string, rawProductIdea: string): string {
  const src = cleanKeyword(rawProductIdea || niche, 'Natural Daily Reset');
  const trimmed = src.split(/\s+(?:—|–|\+|-)\s+|[(:]/)[0].trim();
  const sliced = trimmed.length <= 52 ? trimmed : trimmed.slice(0, 52).replace(/\s+\S*$/, '').trim();
  return toCleanTitleCase(sliced || 'Natural Daily Reset');
}

export function buildFreeProductFallback(
  input: ProductFallbackInput
): GeneratedProductPayload {
  const mode = input.mode || 'CREATE_EBOOK';
  const niche = cleanKeyword(input.niche, 'US Health & Everyday Wellness Adults 35+');
  const rawIdea = cleanKeyword(input.productIdea, '');
  const idea = rawIdea || 'Practical step-by-step daily reset blueprint';
  const topic = deriveShortTopic(niche, rawIdea);
  const bumpUsd = Number(input.orderBumpUsd || 14).toFixed(2);
  const price = Number(input.priceUsd || 37).toFixed(2);

  const isPet = /dog|pet|bark|puppy|cat|canin/i.test(`${niche} ${idea}`);
  const isSkinOrBeauty = /skin|face|anti-aging|led|red light|collagen|beauty|beleza/i.test(
    `${niche} ${idea}`
  );
  const isDropship = mode === 'DROPSHIP_PRODUCT';
  const isAffiliate = mode === 'AFFILIATE_OFFER';

  const hasDayPrefix = /\b\d+[\s-]day\b/i.test(topic);
  const title = isAffiliate
    ? `${topic} — Official US Rapid Results Offer`
    : isDropship
    ? `Pro-Relief ${topic} (Ergonomic US Edition)`
    : hasDayPrefix
    ? `The ${topic}: Complete At-Home Action Blueprint`
    : `The 21-Day ${topic}: Simple At-Home Protocol`;

  const titlePt = isAffiliate
    ? `Oferta Afiliado EUA: ${topic}`
    : isDropship
    ? `Produto Físico EUA: ${topic}`
    : `Protocolo Prático de 21 Dias: ${topic}`;

  const uniqueMechanism = isPet
    ? `The 3-Step Micro-Cue Calm Conditioning Method (Método de Condicionamento Calmo em 3 Passos sem punição, voltado para donos americanos)`
    : isDropship
    ? `Dual-Action Targeted Relief Engineering (Engenharia de alívio imediato em casa que evita consultas caras nos EUA)`
    : `The 7-Minute Daily Cellular & Habit Sequence (Sequência diária de 7 minutos que ataca a causa raiz sem dietas radicais ou rotinas complicadas)`;

  const demographics = isPet
    ? 'US Pet Owners aged 28-62, suburban households ($60k+ income), frustrated by barking/anxiety while working.'
    : isSkinOrBeauty
    ? 'US Women aged 32-65, health & skincare buyers looking for non-invasive results at home instead of $300 clinic visits.'
    : 'US Adults aged 35-64 ($55k+ household income), busy professionals & parents tired of expensive temporary fixes.';

  const psychographics = isPet
    ? 'Loves their dog like family, feels guilty hearing whining/barking on camera, wants a humane peaceful home fast.'
    : 'Exhausted by conflicting advice online, wants a clear step-by-step system they can start tonight in 10 minutes without feeling overwhelmed.';

  const usBuyingTriggers =
    mode === 'AFFILIATE_OFFER'
      ? 'Zero effort fulfillment, compelling video story, 60-day money-back guarantee removes all buyer hesitation.'
      : isDropship
      ? 'Instant visual "before vs after" demo + massive savings vs medical bills or salon appointments ($200+ in the US).'
      : 'Low impulse digital price ($' +
        price +
        '), instant PDF download on phone/Kindle, zero shipping wait, risk-free 30-day satisfaction promise.';

  const whereToFindOrHostPt = isAffiliate
    ? `1. Crie conta GRATUITA na Digistore24 ou ClickBank (não paga nada para se cadastrar). 2. Procure uma oferta no nicho "${topic}" e pegue seu HopLink/Link de Afiliado. 3. Cadastre os vídeos da Aba 3 grátis no TikTok, Instagram Reels e YouTube Shorts colocando seu link na bio para começar a vender sem investir em anúncios.`
    : isDropship
    ? `1. Cadastre este produto usando fornecedores americanos gratuitos na CJ Dropshipping ou Zendrop (paga o produto só depois que o cliente pagar você!). 2. Use Shopify (teste de US$ 1) ou página gratuita para receber pedidos. 3. Divulgue primeiro com vídeos orgânicos gratuitos da Aba 3 no TikTok e Reels antes de pagar anúncios.`
    : `1. Você NÃO precisa gastar dinheiro para vender este E-book: baixe o texto pronto em Markdown abaixo, cole no Google Docs ou Canva (grátis) e exporte como PDF bonito. 2. Crie conta grátis na Kiwify (taxa cobrada só quando vender!), faça upload do PDF com venda em Dólar (US$ ${price}) e Order Bump (US$ ${bumpUsd}). 3. Crie anúncios/vídeos gratuitos na Aba 2 e Aba 3 e poste de graça no TikTok US, Reels e Shorts para fazer suas primeiras vendas sem gastar com tráfego pago.`;

  const orderBumpSuggestionEn = isDropship
    ? `Express US Priority Protection + 21-Day Companion Care Guide PDF ($${bumpUsd})`
    : `Quick-Start 7-Day Printable Tracker + Emergency Checklist PDF ($${bumpUsd})`;
  const orderBumpSuggestionPt = isDropship
    ? `Guia Rápido de Uso em PDF + Garantia Estendida Prioritária ($${bumpUsd})`
    : `Checklist Imprimível de 7 Dias + Plano Acelerador em PDF ($${bumpUsd})`;

  const painPoints = isPet
    ? [
        {
          painEn: 'Exhausted from non-stop barking or whining every time you grab your keys or take a Zoom call.',
          painPt: 'Exausto com latidos e choros sem parar toda vez que pega as chaves ou faz chamada de vídeo.',
        },
        {
          painEn: 'Worried neighbors or HOA complaints will force an expensive trainer or painful shock collar.',
          painPt: 'Medo de reclamações de vizinhos ou gastar fortunas com adestrador ou coleiras dolorosas.',
        },
        {
          painEn: 'Guilt seeing scratched doors and stressed pets on your home security camera while you work.',
          painPt: 'Culpa ao ver portas arranhadas e o cachorro ansioso pela câmera enquanto trabalha.',
        },
        {
          painEn: 'Tried YouTube obedience tips and expensive treats that stopped working after two days.',
          painPt: 'Já tentou vídeos do YouTube e petiscos caros que pararam de funcionar em dois dias.',
        },
        {
          painEn: 'Needs a gentle 10-minute indoor routine any busy owner can follow consistently.',
          painPt: 'Precisa de uma rotina gentil de 10 minutos em casa fácil de seguir na correria do dia.',
        },
      ]
    : [
        {
          painEn: `Waking up frustrated every morning feeling stuck despite trying mainstream ${topic} advice.`,
          painPt: `Acordar frustrado toda manhã sentindo que nada funciona apesar de já ter tentado dicas comuns de ${topic}.`,
        },
        {
          painEn: 'Overwhelmed by complicated schedules, expensive prescriptions, or unrealistic 90-minute routines.',
          painPt: 'Sobrecarregado com rotinas complicadas, gastos altos e métodos impossíveis de manter no dia a dia.',
        },
        {
          painEn: 'Quietly losing confidence and energy during work, family evenings, or social plans.',
          painPt: 'Perdendo energia e autoconfiança no trabalho, com a família e em momentos sociais.',
        },
        {
          painEn: 'Skeptical of flashy promises after wasting hundreds of dollars on gimmicks that never lasted.',
          painPt: 'Desconfiado de promessas milagrosas após gastar dinheiro com soluções que só funcionam por 3 dias.',
        },
        {
          painEn: 'Wants one clear, science-backed 10-minute daily plan that delivers visible relief starting Week 1.',
          painPt: 'Quer um plano diário simples de 10 minutos que mostre resultados reais já na primeira semana.',
        },
      ];

  const deliverableContentMarkdown = `# ${title}

> **Target Audience:** ${niche}
> **Core Concept:** ${idea}
> **Recommended Digital / Offer Price:** $${price} USD (+ $${bumpUsd} Order Bump)

---

## Welcome & How to Use This Blueprint

Most people in the United States struggle with **${topic}** not because they lack willpower, but because mainstream advice ignores the daily biological & behavioral triggers that keep the problem alive.

Over the next 5 short, actionable modules, you will apply the **${uniqueMechanism}** in just 7 to 15 minutes per day—without expensive equipment, starvation, or complex guesswork.

---

## Module 1: Understanding the Hidden Root Trigger

Before fixing the symptoms, you need to interrupt the stress-feedback loop behind **${topic}**:

- **The 3 Silent Saboteurs:** Late-day overstimulation, inconsistent recovery windows, and fighting symptoms instead of resetting the underlying signal.
- **Today's Action Step (3 Minutes):** Complete the 48-hour baseline audit below before changing anything else:
  1. Write down the exact time of day your symptoms or frustration peak.
  2. Circle which two daily triggers happen right before that spike.
  3. Commit to one 10-minute protected reset window on your phone calendar.

### Day 1 Quick Checklist
- [ ] Identified peak daily friction window
- [ ] Removed top #1 friction trigger from evening routine
- [ ] Set a recurring 10-minute morning reminder

---

## Module 2: The 7-Minute Core Reset Routine

This simple daily sequence creates immediate momentum during **Days 1 to 7**:

1. **Minute 0–2 (Decompression Prime):** Slow nasal breathing (4 seconds inhale, 6 seconds exhale) or calm environment cueing to signal safety to the nervous system.
2. **Minute 2–5 (Targeted Alignment):** Follow the focused micro-action directly tailored to **${idea}**—gentle consistency beats intense weekend sessions every single time.
3. **Minute 5–7 (Lock-In Anchor):** Pair the habit immediately with an existing daily anchor (morning coffee, brushing teeth, or unlocking your front door).

**Pro Tip:** Do NOT aim for perfection on Day 1. Consistency at 70% effort for 14 straight days outperforms 100% effort for 3 days.

---

## Module 3: Daily Schedule & Rapid Optimization Matrix

| Time Window | Focus Action (2–5 Min) | Expected Outcome |
| :--- | :--- | :--- |
| **Morning (First 20 Min)** | Core 7-Minute Reset Sequence | Sets steady baseline for the next 8 hours |
| **Midday Slump (2:00 PM)** | 90-Second Micro Check-In | Prevents afternoon relapse or rebound stress |
| **Evening Shutdown (8:30 PM)** | Wind-Down Signal & Tomorrow Prep | Protects overnight recovery & next-day ease |

---

## Module 4: Troubleshooting Plateaus & Bad Days

Even the best protocols hit busy days, travel weeks, or unexpected setbacks. When life gets chaotic:

- **The "Never Miss Twice" Rule:** Missing one day never ruins progress; use the compressed 2-minute emergency version on travel/busy days so momentum stays intact.
- **Common Mistake #1:** Trying to double the intensity after skipping a day—always return gently at normal pace.
- **Common Mistake #2:** Judging progress by hour-to-hour fluctuations instead of comparing Week 1 vs Week 3 averages.

---

## Module 5: Your 21-Day Consolidation & Next Steps

By Day 21, this protocol turns from a "checklist" into your effortless automatic baseline:

1. **Week 1 Goal:** Build automatic timing without skipping two consecutive days.
2. **Week 2 Goal:** Notice measurable relief, calmer daily rhythm, and higher confidence.
3. **Week 3 Goal:** Lock in your personalized maintenance schedule (3 to 5x/week) for permanent results.

### Exclusive Bonus Action Summary
Stay consistent with the **${orderBumpSuggestionEn}** companion sheet to cut your learning curve in half and keep all progress tracked on a single page.

---
*Ready for Commercial Distribution in the US Market (PDF / Kiwify Global / Digistore24 Bonus)*`;

  return {
    title,
    titlePt,
    uniqueMechanism,
    avatarProfile: {
      demographics,
      psychographics,
      usBuyingTriggers,
      orderBumpSuggestionEn,
      orderBumpSuggestionPt,
      productCreationMode: mode,
      whereToFindOrHostPt,
      deliverableContentMarkdown,
    },
    painPoints,
  };
}

export function buildFreeCreativesFallback(params: {
  title: string;
  segment: string;
  priceUsd: number;
  orderBumpUsd: number;
  uniqueMechanism: string;
  painPoints: Array<{ painEn?: string; painPt?: string } | string>;
}): CreativeGenerationItem[] {
  const title = cleanKeyword(params.title, '21-Day US Reset Protocol').slice(0, 55);
  const shortName = title.split(/[-:(]/)[0].trim().slice(0, 26) || 'US Reset Guide';
  const rawMech = cleanKeyword(
    params.uniqueMechanism,
    'simple 7-minute daily reset method'
  )
    .replace(/\([^)]*\)/g, '')
    .trim();
  const mech = rawMech.slice(0, 70);

  const firstPainObj = params.painPoints?.[0];
  const pain1En =
    typeof firstPainObj === 'string'
      ? firstPainObj
      : firstPainObj?.painEn || 'waking up frustrated trying solutions that never last';
  const pain1Pt =
    typeof firstPainObj === 'string'
      ? firstPainObj
      : firstPainObj?.painPt || 'acordar frustrado com métodos caros que nunca funcionam';

  const priceStr = `$${Number(params.priceUsd || 37).toFixed(0)}`;
  const bumpStr = `$${Number(params.orderBumpUsd || 14).toFixed(0)}`;
  const isPhysical = params.segment === 'SHOPIFY_US';
  const guarantee = isPhysical ? 'Fast US Shipping & 30-Day Guarantee' : 'Instant Access & 30-Day Guarantee';

  return [
    {
      angle: 'PAS_DIRECT',
      hookEn: `If you're still struggling every week despite trying everything, pause and listen for 15 seconds.`,
      bodyEn: `Honestly, most people keep spinning their wheels because mainstream tips totally ignore the real root trigger. That's why ${shortName} uses the ${mech} to get real relief at home in under 10 minutes a day—without complicated rules or crazy expenses.`,
      ctaEn: `Tap the link below right now to get ${shortName} today and feel the difference for yourself.`,
      metaPrimaryText: `Tired of wasting money on solutions that barely work for 3 days?\n\nMeet ${title} — built around ${mech} so you finally get consistent results at home.\n\n✅ Takes just 7–10 minutes per day\n✅ Zero complicated steps or guesswork\n✅ Backed by our ${guarantee}\n\n👇 Tap "Learn More" now to claim yours today before this offer closes.`,
      metaHeadline: `Start ${shortName} Today (${priceStr})`,
      googleHeadlines: [
        `${shortName}`.slice(0, 30),
        `10-Min Daily US Solution`.slice(0, 30),
        `30-Day Risk-Free Access`.slice(0, 30),
      ],
      googleDescriptions: [
        `Simple daily ${shortName} method for real results at home. Instant start today!`.slice(0, 90),
        `Stop guessing and follow our proven step-by-step US blueprint with 30-day guarantee.`.slice(0, 90),
      ],
      orderBumpCopyEn: `YES! Add the Quick-Start 7-Day Action Checklist & Cheat Sheet for just ${bumpStr} (80% of US buyers add this to get results 2x faster).`,
      translationPt: `TRADUÇÃO DO ROTEIRO FALADO (PAS):\n"Se você ainda sofre toda semana mesmo já tendo tentado de tudo, pare e escute por 15 segundos. Honestamente, a maioria das pessoas fica andando em círculos porque dicas comuns ignoram o gatilho real (${pain1Pt}). É por isso que ${shortName} usa ${mech} para trazer alívio em menos de 10 minutos por dia, sem regras complicadas ou gastos altos. Toque no link abaixo agora para garantir o seu hoje."\n\n🎬 QUE VÍDEO USAR DE FUNDO:\nUse um vídeo vertical (9:16) do Pexels gratuito mostrando alguém cansado/pensativo nos primeiros 3 segundos e depois sorrindo, relaxado em casa ou usando o celular/produto.`,
    },
    {
      angle: 'UGC_STORYTELLING',
      hookEn: `Okay, I seriously wasn't gonna post this, but if you're dealing with the same daily headache I was, watch this.`,
      bodyEn: `For months I tried spending money on random stuff that didn't fix a thing. Then a friend in Texas showed me ${shortName}. Literally in the first week, following the ${mech} completely changed my routine—it's super simple and actually makes sense.`,
      ctaEn: `Click below to grab yours now while it's still discounted today.`,
      metaPrimaryText: `I honestly didn't believe this would work at first... 😅\n\nAfter dealing with ${pain1En.toLowerCase()}, I almost gave up.\n\nThen I tried ${title} using the ${mech}:\n✅ Super easy to follow on my own schedule\n✅ Noticeable shift within the very first week\n✅ ${guarantee}\n\n👉 Click below to check it out while today's deal is still live!`,
      metaHeadline: `Why Americans Love ${shortName}`,
      googleHeadlines: [
        `Honest Review: ${shortName}`.slice(0, 30),
        `Simple At-Home US Method`.slice(0, 30),
        `Get Started Today (${priceStr})`.slice(0, 30),
      ],
      googleDescriptions: [
        `See how everyday Americans are solving this in 10 minutes a day. Guaranteed!`.slice(0, 90),
        `Real story + step-by-step system inside ${shortName}. Tap to learn more.`.slice(0, 90),
      ],
      orderBumpCopyEn: `Upgrade my order for only ${bumpStr}: Include the Printable Daily Tracker & Troubleshooting Guide!`,
      translationPt: `TRADUÇÃO DO ROTEIRO FALADO (UGC / DEPOIMENTO):\n"Ok, eu realmente não ia postar isso, mas se você está lidando com a mesma dor de cabeça que eu tinha, assista. Por meses gastei dinheiro com coisas aleatórias que não resolviam nada. Até que um amigo nos EUA me mostrou o ${shortName}. Literalmente na primeira semana, seguir o método fez toda a diferença na minha rotina — é super simples. Clique abaixo para garantir o seu com desconto hoje."\n\n🎬 QUE VÍDEO USAR DE FUNDO:\nUse vídeo estilo "UGC / pessoa falando na câmera ou rotina matinal em apartamento americano" (disponível grátis no Pexels buscando 'morning routine vertical' ou 'happy woman lifestyle').`,
    },
    {
      angle: 'SHOCK_HOOK',
      hookEn: `Stop doing the exact same thing every morning if you actually want lasting relief this year.`,
      bodyEn: `Here's what nobody tells you—the old way only masks symptoms for a couple hours. Instead, ${shortName} works with the ${mech} in just a few minutes daily so your results finally stick without stress or crazy effort.`,
      ctaEn: `Hit the button below to get instant access and start tonight.`,
      metaPrimaryText: `⚠️ STOP repeating the old routine that keeps failing!\n\nMost people don't realize why common fixes wear off quickly. ${title} flips the script with ${mech}:\n\n✅ Fast 10-minute daily blueprint\n✅ Zero harsh routines or steep bills\n✅ ${guarantee}\n\n🔥 Tap below now to start tonight!`,
      metaHeadline: `The Secret Behind ${shortName}`,
      googleHeadlines: [
        `Stop Guessing — Try This`.slice(0, 30),
        `${shortName} Blueprint`.slice(0, 30),
        `Fast Relief Starts Today`.slice(0, 30),
      ],
      googleDescriptions: [
        `Discover why old methods fail and how ${shortName} delivers real daily results.`.slice(0, 90),
        `Instant digital & US access with 30-day guarantee. Claim your spot today!`.slice(0, 90),
      ],
      orderBumpCopyEn: `Fast-Track Add-On (${bumpStr}): Grab our Bonus Companion Toolkit & Quick Video Walkthrough right on this page!`,
      translationPt: `TRADUÇÃO DO ROTEIRO FALADO (GANCHO CURIOSO):\n"Pare de fazer a mesma coisa toda manhã se você realmente quer alívio duradouro este ano. Eis o que ninguém te conta — o jeito antigo só mascara os sintomas por algumas horas. Em vez disso, o ${shortName} funciona com um método prático em poucos minutos por dia para o resultado realmente durar. Toque no botão abaixo e comece hoje à noite."\n\n🎬 QUE VÍDEO USAR DE FUNDO:\nUse um corte dinâmico com movimento nos 3 primeiros segundos (pessoa parando algo ou mostrando algo visual forte, buscando no Pexels por 'lifestyle change vertical' ou 'close up hands').`,
    },
  ];
}

export function buildFreeSuggestionsFallback(
  mode: string,
  targetPlatform: string,
  nicheTheme: string
) {
  const theme = cleanKeyword(nicheTheme, 'US Health & Everyday Relief');
  const isPhysical = mode === 'DROPSHIP_PRODUCT' || targetPlatform === 'SHOPIFY_US';
  const isAffiliate = mode === 'AFFILIATE_OFFER';

  return [
    {
      label: `🔥 ${theme.slice(0, 22)} • Método Rápido`,
      title: `The 14-Day ${theme} Rapid Relief Blueprint`,
      niche: `${theme} for US Adults 35-60`,
      idea: `Step-by-step 10-minute daily habit reset tailored for ${theme}`,
      price: isPhysical ? '59.90' : isAffiliate ? '65.00' : '37.00',
      bump: isPhysical ? '9.90' : isAffiliate ? '0.00' : '14.00',
      cost: isPhysical ? '13.50' : '0.00',
      shipping: isPhysical ? '4.50' : '0.00',
      mode,
      segment: targetPlatform,
      whyItConverts: `Foca em alívio rápido em 10 min/dia no nicho ${theme}, com alto apelo de compra por impulso nos EUA.`,
    },
    {
      label: `⚡ Protocolo Anti-Estresse ${theme.slice(0, 14)}`,
      title: `Zero-Guesswork ${theme} Home System`,
      niche: `Busy Americans looking for fast relief in ${theme}`,
      idea: `Simple root-cause protocol eliminating daily frustration in ${theme}`,
      price: isPhysical ? '49.90' : isAffiliate ? '59.00' : '29.00',
      bump: isPhysical ? '9.90' : isAffiliate ? '0.00' : '12.00',
      cost: isPhysical ? '11.00' : '0.00',
      shipping: isPhysical ? '4.00' : '0.00',
      mode,
      segment: targetPlatform,
      whyItConverts: 'Promessa simples, ticket acessível em Dólar e fácil compreensão para TikTok/Reels.',
    },
    {
      label: `🌙 Rotina Noturna (${theme.slice(0, 16)})`,
      title: `The 7-Night Deep Recovery & ${theme} Guide`,
      niche: `Adults 40+ struggling at night with ${theme}`,
      idea: `Evening decompression sequence that works overnight for ${theme}`,
      price: isPhysical ? '64.00' : isAffiliate ? '69.00' : '39.00',
      bump: isPhysical ? '12.90' : isAffiliate ? '0.00' : '15.00',
      cost: isPhysical ? '14.20' : '0.00',
      shipping: isPhysical ? '4.50' : '0.00',
      mode,
      segment: targetPlatform,
      whyItConverts: 'Gatilho de resolver o problema enquanto descansa à noite tem altíssima taxa de clique.',
    },
    {
      label: `✅ Checklist 21 Dias (${theme.slice(0, 14)})`,
      title: `21-Day ${theme} Transformation Challenge`,
      niche: `US Beginners tired of complicated ${theme} programs`,
      idea: `Visual daily tracker and 5-minute action drills for ${theme}`,
      price: isPhysical ? '54.90' : isAffiliate ? '55.00' : '34.00',
      bump: isPhysical ? '9.90' : isAffiliate ? '0.00' : '11.00',
      cost: isPhysical ? '12.00' : '0.00',
      shipping: isPhysical ? '3.90' : '0.00',
      mode,
      segment: targetPlatform,
      whyItConverts: 'Formato de desafio de 21 dias cria sensação de meta alcançável e aumenta conversão.',
    },
    {
      label: `💎 Solução Completa ${theme.slice(0, 16)}`,
      title: `The Natural ${theme} Mastery Handbook`,
      niche: `Health & practical solution buyers in the US (${theme})`,
      idea: `Natural science-backed home approach replacing costly clinic visits for ${theme}`,
      price: isPhysical ? '69.90' : isAffiliate ? '72.00' : '47.00',
      bump: isPhysical ? '14.90' : isAffiliate ? '0.00' : '17.00',
      cost: isPhysical ? '15.80' : '0.00',
      shipping: isPhysical ? '4.90' : '0.00',
      mode,
      segment: targetPlatform,
      whyItConverts: 'Posicionamento "solução caseira que economiza US$ 200+ em consultas" converte muito nos EUA.',
    },
  ];
}
