'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  Volume2,
  Video,
  Megaphone,
  ShoppingBag,
  Globe,
  BookOpen,
  Eye,
  EyeOff,
  Copy,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ApiCredentialData } from '@/types/autopilot';

interface Module0SetupProps {
  credentials: ApiCredentialData[];
  onRefresh: () => Promise<void>;
  onNavigateTab?: (tab: number) => void;
}

interface ProviderConfig {
  provider: string;
  title: string;
  priorityBadge: string;
  isMandatoryFirst: boolean;
  whatIsIt: string;
  whenToUse: string;
  docsUrl: string;
  docsLabel: string;
  stepByStepTutorial: string[];
  webhookEndpointPath?: string;
  fields: {
    apiKeyLabel?: string;
    apiKeyHelp?: string;
    apiKeyPlaceholder?: string;
    accountIdLabel?: string;
    accountIdHelp?: string;
    accountIdPlaceholder?: string;
    pixelIdLabel?: string;
    pixelIdHelp?: string;
    pixelIdPlaceholder?: string;
    webhookSecretLabel?: string;
    webhookSecretHelp?: string;
    webhookSecretPlaceholder?: string;
  };
  icon: React.ReactNode;
}

const PROVIDERS: ProviderConfig[] = [
  {
    provider: 'OPENAI',
    title: '1. Inteligência Artificial da OpenAI (Cérebro do Sistema)',
    priorityBadge: 'PASSO 1 OBRIGATÓRIO • COMECE POR AQUI (20%)',
    isMandatoryFirst: true,
    whatIsIt:
      'É o cérebro que lê páginas de produtos em inglês, descobre por que os americanos compram e escreve todos os seus anúncios e vídeos em inglês perfeito (com tradução em português para você ler).',
    whenToUse: 'Conectar agora mesmo antes de usar qualquer outra aba.',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'Abrir Site da OpenAI (Criar Chave)',
    stepByStepTutorial: [
      '1. Clique no botão verde "Abrir Site da OpenAI" ao lado e faça login (ou crie uma conta gratuita com seu Google).',
      '2. No menu esquerdo do site da OpenAI, clique em "API keys" (Chaves de API).',
      '3. Importante: Em "Settings > Billing", adicione pelo menos US$ 5 de crédito no cartão para a OpenAI liberar o modelo GPT-4o.',
      '4. Clique no botão "+ Create new secret key", dê o nome "Autopilot" e copie o código que começa com "sk-proj-...".',
      '5. Cole esse código no campo abaixo e clique em "Testar e Salvar Conexão".',
    ],
    fields: {
      apiKeyLabel: 'Código Secreto da OpenAI (Começa com sk-...)',
      apiKeyHelp: 'Cole aqui a chave que você copiou lá no site da OpenAI.',
      apiKeyPlaceholder: 'sk-proj-...',
    },
    icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
  },
  {
    provider: 'KIWIFY',
    title: '2. Kiwify Internacional (Para Vender E-books, Guias eCursos em Dólar)',
    priorityBadge: 'PARA INFOPRODUTOS • TAXA: 9.99% + US$ 0.80',
    isMandatoryFirst: false,
    whatIsIt:
      'A Kiwify permite criar produtos digitais (E-books, Protocolos em PDF, Cursos) no Brasil e vender em Dólar (US$) para os Estados Unidos e Europa, recebendo direto na sua conta.',
    whenToUse:
      'Conecte quando você criar seu produto na Kiwify e quiser que as vendas em Dólar apareçam automaticamente na Aba 5.',
    docsUrl: 'https://dashboard.kiwify.com.br/',
    docsLabel: 'Abrir Painel da Kiwify',
    webhookEndpointPath: '/api/webhooks/kiwify',
    stepByStepTutorial: [
      '1. Entre na sua conta em dashboard.kiwify.com.br e crie seu produto marcando a moeda "Dólar (USD)" ou habilitando vendas internacionais.',
      '2. No menu lateral da Kiwify, clique em "Apps" e depois em "Webhooks".',
      '3. Clique em "Criar Webhook" e dê o nome "Sistema Dólar Autopilot".',
      '4. No campo "URL do Webhook" lá na Kiwify, cole o Link de Notificação que aparece na caixinha azul aqui embaixo.',
      '5. Marque o evento "Compra aprovada". A Kiwify vai mostrar um "Token" (código de segurança). Copie esse Token da Kiwify, cole no campo abaixo e clique em "Testar e Salvar Conexão"!',
    ],
    fields: {
      webhookSecretLabel: 'Token do Webhook da Kiwify',
      webhookSecretHelp:
        'Código gerado pela Kiwify quando você cria o Webhook em Apps → Webhooks.',
      webhookSecretPlaceholder: 'Ex: kwf_sec_98a7s9d87a...',
    },
    icon: <Globe className="w-6 h-6 text-amber-400" />,
  },
  {
    provider: 'SHOPIFY',
    title: '3. Shopify EUA (Para Dropshipping de Produtos Físicos nos EUA)',
    priorityBadge: 'PARA PRODUTOS FÍSICOS • TAXA: 2.9% + US$ 0.30',
    isMandatoryFirst: false,
    whatIsIt:
      'Conecta sua loja virtual da Shopify configurada para os Estados Unidos (integrada com fornecedores como Zendrop ou CJ Dropshipping).',
    whenToUse:
      'Conecte se você for vender produtos físicos nos EUA. Se for vender apenas digitais na Kiwify, pode pular este cartão.',
    docsUrl: 'https://admin.shopify.com/',
    docsLabel: 'Abrir Painel da Shopify',
    webhookEndpointPath: '/api/webhooks/shopify',
    stepByStepTutorial: [
      '1. Abra o painel da sua loja Shopify e clique em "Settings" (Configurações, na engrenagem lá embaixo à esquerda).',
      '2. Para receber as vendas automaticamente: vá em "Settings → Notifications → Webhooks → Create webhook". Escolha o evento "Order payment", formato JSON, e cole o Link de Notificação abaixo.',
      '3. Copie o código de assinatura ("Webhook signing secret") que aparece no rodapé da tela da Shopify e cole no último campo abaixo.',
      '4. (Opcional) Se quiser conectar a API completa da loja, vá em "Settings → Apps and sales channels → Develop apps", crie um app, ative "read_orders" e "read_products", e cole o domínio da loja (ex: minhaloja.myshopify.com) e o Token "shpat_...".',
    ],
    fields: {
      accountIdLabel: 'Endereço da sua Loja Shopify (Opcional)',
      accountIdHelp: 'Exemplo: sua-loja-usa.myshopify.com',
      accountIdPlaceholder: 'sua-loja-usa.myshopify.com',
      apiKeyLabel: 'Token de Admin da Shopify (Opcional se usar só Webhook)',
      apiKeyHelp: 'Começa com shpat_...',
      apiKeyPlaceholder: 'shpat_...',
      webhookSecretLabel: 'Código Secreto do Webhook Shopify (Mais simples)',
      webhookSecretHelp:
        'Copiado em Settings → Notifications → Webhooks na sua Shopify.',
      webhookSecretPlaceholder: 'whsec_...',
    },
    icon: <ShoppingBag className="w-6 h-6 text-lime-400" />,
  },
  {
    provider: 'META_ADS',
    title: '4. Facebook Ads & Instagram Ads (Anúncios Pagos nos EUA)',
    priorityBadge: 'PARA ANUNCIAR NO FACEBOOK/INSTAGRAM • PASSO 4 (80%)',
    isMandatoryFirst: false,
    whatIsIt:
      'Conecta sua Conta de Anúncios do Facebook/Instagram para o nosso Robô da Aba 4 monitorar seus gastos, pausar anúncios ruins sozinho e aumentar o orçamento dos anúncios que estão vendendo.',
    whenToUse:
      'Conecte quando estiver pronto para colocar anúncios no ar no Facebook e Instagram.',
    docsUrl: 'https://developers.facebook.com/tools/explorer/',
    docsLabel: 'Abrir Gerador de Token do Facebook',
    stepByStepTutorial: [
      '1. Onde achar o ID da sua Conta de Anúncios (META_AD_ACCOUNT_ID): Abra seu Gerenciador de Anúncios do Facebook (adsmanager.facebook.com). Olhe no topo da tela ou no link do navegador onde aparece "act=123456789". Esse número é o seu ID!',
      '2. Onde achar o ID do seu Pixel (META_PIXEL_ID): No Gerenciador de Eventos do Facebook, copie o número de identificação do seu Pixel (Conjunto de Dados).',
      '3. Onde pegar o Token de Acesso (META_ACCESS_TOKEN): Clique no botão "Abrir Gerador de Token do Facebook" acima (ou em Configurações do Negócio → Usuários do Sistema → Gerar Token com permissões ads_management e ads_read).',
      '4. Copie o código que começa com "EAA...", cole abaixo junto com o número da sua conta e clique em "Testar e Salvar Conexão". O sistema vai buscar o nome real da sua conta no Facebook!',
    ],
    fields: {
      apiKeyLabel: '1. Token de Acesso do Facebook (Começa com EAA...)',
      apiKeyHelp:
        'Código de permissão gerado no Facebook Developers ou Usuários do Sistema.',
      apiKeyPlaceholder: 'EAABsbCS1iHgBO...',
      accountIdLabel: '2. Número da Conta de Anúncios (Ad Account ID)',
      accountIdHelp:
        'Apenas os números ou com act_ na frente (ex: act_1234567890).',
      accountIdPlaceholder: 'act_1234567890',
      pixelIdLabel: '3. Número do Pixel do Facebook (Opcional, para rastrear vendas)',
      pixelIdHelp:
        'Envia cada venda aprovada na Kiwify/Shopify direto para o algoritmo do Facebook.',
      pixelIdPlaceholder: '987654321012345',
    },
    icon: <Megaphone className="w-6 h-6 text-blue-400" />,
  },
  {
    provider: 'GOOGLE_ADS',
    title: '5. Google Ads & YouTube Ads (Anúncios na Pesquisa do Google e YouTube EUA)',
    priorityBadge: 'PARA ANUNCIAR NO GOOGLE / YOUTUBE',
    isMandatoryFirst: false,
    whatIsIt:
      'Guarda os dados da sua conta do Google Ads para você usar os Títulos e Descrições em inglês gerados na Aba 2 em campanhas de Pesquisa e YouTube Shorts nos EUA.',
    whenToUse: 'Conecte quando for criar campanhas no Google Ads.',
    docsUrl: 'https://ads.google.com/',
    docsLabel: 'Abrir Painel do Google Ads',
    stepByStepTutorial: [
      '1. Clique em "Abrir Painel do Google Ads" acima e acesse sua conta em ads.google.com.',
      '2. No canto superior direito da tela do Google Ads, você verá um número de 10 dígitos no formato "123-456-7890" (ID do Cliente). Copie esse número e cole no segundo campo abaixo.',
      '3. No primeiro campo abaixo, cole seu Token de Desenvolvedor/API do Google Ads (Ferramentas → Central de API) ou sua chave de identificação para ativar o módulo.',
      '4. Clique em "Testar e Salvar Conexão".',
    ],
    fields: {
      apiKeyLabel: '1. Token de Acesso / Developer Token do Google Ads',
      apiKeyHelp: 'Chave de API da sua conta Google Ads.',
      apiKeyPlaceholder: 'ya29.a0AfH6SM... ou dev_token',
      accountIdLabel: '2. ID do Cliente Google Ads (Formato 123-456-7890)',
      accountIdHelp:
        'Fica no canto superior direito da sua tela do Google Ads.',
      accountIdPlaceholder: '123-456-7890',
    },
    icon: <Search className="w-6 h-6 text-sky-400" />,
  },
  {
    provider: 'TIKTOK',
    title: '6. TikTok US & TikTok Shop (Publicação Automática de Vídeos)',
    priorityBadge: 'PARA POSTAR VÍDEOS NO TIKTOK • PASSO 4 (80%)',
    isMandatoryFirst: false,
    whatIsIt:
      'Permite publicar os vídeos prontos da Aba 3 diretamente na sua conta do TikTok com 1 clique. (Obs: Mesmo sem conectar isto, você pode baixar o vídeo .MP4 pronto na Aba 3 e postar pelo celular ou computador!).',
    whenToUse:
      'Opcional — Conecte se quiser que o botão "Publicar no TikTok US" envie o vídeo direto pela API oficial.',
    docsUrl: 'https://developers.tiktok.com/doc/content-posting-api-get-started',
    docsLabel: 'Abrir TikTok for Developers',
    stepByStepTutorial: [
      '1. Lembrete para Iniciantes: Você NÃO é obrigado a conectar a API do TikTok para criar vídeos! Na Aba 3 você pode gerar o vídeo e clicar em "Baixar Vídeo .MP4" para postar manualmente.',
      '2. Se quiser postagem 100% automática: acesse developers.tiktok.com, crie um App com o produto "Content Posting API" habilitado.',
      '3. Gere o "Access Token" da sua conta de criador (começa com "act....") e cole no campo abaixo.',
      '4. Clique em "Testar e Salvar Conexão".',
    ],
    fields: {
      apiKeyLabel: 'Token de Acesso do TikTok (TIKTOK_ACCESS_TOKEN)',
      apiKeyHelp: 'Token OAuth 2.0 gerado no portal TikTok Developers.',
      apiKeyPlaceholder: 'act.example_tiktok_token...',
    },
    icon: <Video className="w-6 h-6 text-pink-400" />,
  },
  {
    provider: 'ELEVENLABS',
    title: '7. ElevenLabs (Gerador de Voz de Americano Nativo em .MP3)',
    priorityBadge: 'PARA GERAR A VOZ DOS VÍDEOS NA ABA 3',
    isMandatoryFirst: false,
    whatIsIt:
      'Lê o roteiro em inglês criado na Aba 2 com uma voz humana ultra-realista de americano(a) nativo(a) e gera o arquivo de áudio .MP3 pronto.',
    whenToUse: 'Conecte antes de usar a Aba 3 (Fábrica de Vídeos).',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    docsLabel: 'Abrir ElevenLabs (Pegar Chave)',
    stepByStepTutorial: [
      '1. Clique em "Abrir ElevenLabs" acima e crie sua conta gratuita no site elevenlabs.io.',
      '2. No canto inferior esquerdo (ou no seu perfil), clique em "Profile + API key" (ou acesse direto o link do botão acima).',
      '3. Clique em "Create API Key", copie o código gerado e cole no campo abaixo.',
      '4. Clique em "Testar e Salvar Conexão". O sistema vai mostrar quantos caracteres gratuitos você tem disponíveis na sua conta!',
    ],
    fields: {
      apiKeyLabel: 'Chave de API da ElevenLabs (xi-api-key)',
      apiKeyHelp: 'Copiada em Profile → API Keys no site da ElevenLabs.',
      apiKeyPlaceholder: 'sk_...',
    },
    icon: <Volume2 className="w-6 h-6 text-purple-400" />,
  },
];

export default function Module0Setup({
  credentials,
  onRefresh,
  onNavigateTab,
}: Module0SetupProps) {
  const [formState, setFormState] = useState<
    Record<
      string,
      {
        apiKey: string;
        accountId: string;
        pixelId: string;
        webhookSecret: string;
      }
    >
  >({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState<Record<string, boolean>>({
    OPENAI: true,
    KIWIFY: true,
    META_ADS: true,
  });
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    Record<string, { type: 'success' | 'error'; message: string }>
  >({});

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const getSavedCred = (provider: string) =>
    credentials.find((c) => c.provider === provider);

  const handleFieldChange = (
    provider: string,
    field: 'apiKey' | 'accountId' | 'pixelId' | 'webhookSecret',
    value: string
  ) => {
    const existing = getSavedCred(provider);
    setFormState((prev) => ({
      ...prev,
      [provider]: {
        apiKey: prev[provider]?.apiKey ?? existing?.apiKey ?? '',
        accountId: prev[provider]?.accountId ?? existing?.accountId ?? '',
        pixelId: prev[provider]?.pixelId ?? existing?.pixelId ?? '',
        webhookSecret: prev[provider]?.webhookSecret ?? existing?.webhookSecret ?? '',
        [field]: value,
      },
    }));
  };

  const handleCopyWebhook = (path: string, provider: string) => {
    const fullUrl = `${origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedWebhook(provider);
    setTimeout(() => setCopiedWebhook(null), 2500);
  };

  const handleTestAndSave = async (provider: string) => {
    setTestingProvider(provider);
    setFeedback((prev) => {
      const copy = { ...prev };
      delete copy[provider];
      return copy;
    });

    const existing = getSavedCred(provider);
    const values = {
      apiKey: formState[provider]?.apiKey ?? existing?.apiKey ?? '',
      accountId: formState[provider]?.accountId ?? existing?.accountId ?? '',
      pixelId: formState[provider]?.pixelId ?? existing?.pixelId ?? '',
      webhookSecret: formState[provider]?.webhookSecret ?? existing?.webhookSecret ?? '',
    };

    try {
      const res = await fetch('/api/settings/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          ...values,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.isVerified) {
        setFeedback((prev) => ({
          ...prev,
          [provider]: {
            type: 'error',
            message:
              data.error ||
              'Não foi possível validar esse código. Confira o tutorial passo a passo acima e tente novamente.',
          },
        }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [provider]: {
            type: 'success',
            message: `Conectado com sucesso! Conta reconhecida: ${data.credential?.accountName} (${data.credential?.currency})`,
          },
        }));
        await onRefresh();
      }
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [provider]: {
          type: 'error',
          message: err.message || 'Erro de rede ao testar conexão.',
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const isOpenAiConnected = Boolean(getSavedCred('OPENAI')?.isVerified);

  return (
    <div className="space-y-6">
      {/* Guia Rápido para Quem Está Entrando Pela Primeira Vez */}
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <ShieldCheck className="w-4 h-4" />
              PASSO 0 • CENTRAL DE CONEXÕES EXPLICADA PASSO A PASSO
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Como Conectar Suas Contas (Sem Precisar Entender de Programação)
            </h2>
            <p className="text-sm text-slate-300 max-w-4xl leading-relaxed">
              Para o sistema trabalhar para você, ele precisa se conectar às suas contas oficiais.{' '}
              <strong className="text-emerald-300">
                Você NÃO precisa conectar tudo agora!
              </strong>{' '}
              Para começar a testar o sistema hoje mesmo, conecte apenas o{' '}
              <strong className="text-white underline decoration-emerald-400">
                Cartão nº 1 (OpenAI)
              </strong>
              . Depois, conforme avançar nas próximas abas, você volta aqui e conecta a Kiwify, o Facebook Ads ou o Google Ads seguindo o tutorial de cada cartão.
            </p>
          </div>

          {isOpenAiConnected && onNavigateTab && (
            <button
              onClick={() => onNavigateTab(1)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition shrink-0 shadow-lg shadow-emerald-950"
            >
              <CheckCircle2 className="w-5 h-5" />
              OpenAI já conectada! Ir para o Passo 1 →
            </button>
          )}
        </div>
      </div>

      {/* Lista de Cartões de Configuração com Tutoriais Clique a Clique */}
      <div className="grid grid-cols-1 gap-6">
        {PROVIDERS.map((cfg) => {
          const saved = getSavedCred(cfg.provider);
          const current = formState[cfg.provider] || {
            apiKey: saved?.apiKey || '',
            accountId: saved?.accountId || '',
            pixelId: saved?.pixelId || '',
            webhookSecret: saved?.webhookSecret || '',
          };
          const isTesting = testingProvider === cfg.provider;
          const fb = feedback[cfg.provider];
          const tutorialOpen = Boolean(showTutorial[cfg.provider]);
          const secretVisible = Boolean(showSecret[cfg.provider]);

          return (
            <div
              key={cfg.provider}
              className={`rounded-2xl border p-6 transition-all ${
                saved?.isVerified
                  ? 'border-emerald-500/50 bg-slate-900/95 shadow-lg shadow-emerald-950/20'
                  : cfg.isMandatoryFirst
                  ? 'border-amber-500/50 bg-slate-900/90'
                  : 'border-slate-800 bg-slate-900/70'
              }`}
            >
              {/* Cabeçalho do Cartão */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                    {cfg.icon}
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1 ${
                        cfg.isMandatoryFirst
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {cfg.priorityBadge}
                    </span>
                    <h3 className="text-lg font-extrabold text-white">{cfg.title}</h3>
                    <p className="text-sm text-slate-300 mt-1">{cfg.whatIsIt}</p>
                    <p className="text-xs text-emerald-400 font-medium mt-1">
                      💡 <strong>Quando conectar:</strong> {cfg.whenToUse}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {saved?.isVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <CheckCircle2 className="w-4 h-4" />
                      CONTA CONECTADA ({saved.currency || 'USD'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      <XCircle className="w-4 h-4" />
                      Ainda não conectado
                    </span>
                  )}

                  <a
                    href={cfg.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-bold text-emerald-300 transition"
                  >
                    {cfg.docsLabel}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Botão e Caixa do Tutorial Passo a Passo (Clique a Clique) */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowTutorial((prev) => ({
                      ...prev,
                      [cfg.provider]: !prev[cfg.provider],
                    }))
                  }
                  className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 border border-cyan-500/30 rounded-lg px-3.5 py-2 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  {tutorialOpen
                    ? 'Esconder Tutorial Passo a Passo'
                    : '📖 Ver Tutorial Passo a Passo: Onde clicar para pegar o código'}
                  {tutorialOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {tutorialOpen && (
                  <div className="mt-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 p-4 space-y-2">
                    <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                      Siga estes passos simples na tela do site oficial:
                    </div>
                    <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
                      {cfg.stepByStepTutorial.map((stepText, idx) => (
                        <li
                          key={idx}
                          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80"
                        >
                          {stepText}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Se o provedor usa Link de Webhook (Kiwify / Shopify), mostra o Link pronto para copiar */}
              {cfg.webhookEndpointPath && (
                <div className="mt-4 rounded-xl bg-blue-950/30 border border-blue-500/30 p-4 space-y-2">
                  <label className="block text-xs font-bold text-blue-300">
                    🔗 Seu Link de Notificação de Vendas (Copie este link e cole lá no painel da{' '}
                    {cfg.provider === 'KIWIFY' ? 'Kiwify' : 'Shopify'}):
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${origin}${cfg.webhookEndpointPath}`}
                      className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-emerald-300"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyWebhook(cfg.webhookEndpointPath!, cfg.provider)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition shrink-0"
                    >
                      {copiedWebhook === cfg.provider ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Link Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar Link de Webhook
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Campos de Preenchimento */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {cfg.fields.apiKeyLabel && (
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-white">
                        {cfg.fields.apiKeyLabel}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowSecret((prev) => ({
                            ...prev,
                            [cfg.provider]: !prev[cfg.provider],
                          }))
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        {secretVisible ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Ocultar código
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Mostrar código
                          </>
                        )}
                      </button>
                    </div>
                    {cfg.fields.apiKeyHelp && (
                      <p className="text-[11px] text-slate-400 mb-1.5">
                        {cfg.fields.apiKeyHelp}
                      </p>
                    )}
                    <input
                      type={secretVisible ? 'text' : 'password'}
                      value={current.apiKey}
                      onChange={(e) =>
                        handleFieldChange(cfg.provider, 'apiKey', e.target.value)
                      }
                      placeholder={cfg.fields.apiKeyPlaceholder}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {cfg.fields.accountIdLabel && (
                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      {cfg.fields.accountIdLabel}
                    </label>
                    {cfg.fields.accountIdHelp && (
                      <p className="text-[11px] text-slate-400 mb-1.5">
                        {cfg.fields.accountIdHelp}
                      </p>
                    )}
                    <input
                      type="text"
                      value={current.accountId}
                      onChange={(e) =>
                        handleFieldChange(cfg.provider, 'accountId', e.target.value)
                      }
                      placeholder={cfg.fields.accountIdPlaceholder}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {cfg.fields.pixelIdLabel && (
                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      {cfg.fields.pixelIdLabel}
                    </label>
                    {cfg.fields.pixelIdHelp && (
                      <p className="text-[11px] text-slate-400 mb-1.5">
                        {cfg.fields.pixelIdHelp}
                      </p>
                    )}
                    <input
                      type="text"
                      value={current.pixelId}
                      onChange={(e) =>
                        handleFieldChange(cfg.provider, 'pixelId', e.target.value)
                      }
                      placeholder={cfg.fields.pixelIdPlaceholder}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {cfg.fields.webhookSecretLabel && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-white mb-1">
                      {cfg.fields.webhookSecretLabel}
                    </label>
                    {cfg.fields.webhookSecretHelp && (
                      <p className="text-[11px] text-slate-400 mb-1.5">
                        {cfg.fields.webhookSecretHelp}
                      </p>
                    )}
                    <input
                      type={secretVisible ? 'text' : 'password'}
                      value={current.webhookSecret}
                      onChange={(e) =>
                        handleFieldChange(
                          cfg.provider,
                          'webhookSecret',
                          e.target.value
                        )
                      }
                      placeholder={cfg.fields.webhookSecretPlaceholder}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Status da Conta Conectada */}
              {saved?.isVerified && saved.accountName && (
                <div className="mt-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 px-4 py-3 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    ✅ Conta verificada e salva no banco de dados:{' '}
                    <strong className="text-white">{saved.accountName}</strong> (Moeda:{' '}
                    {saved.currency})
                  </span>
                  {saved.lastTestedAt && (
                    <span className="text-emerald-400">
                      Último teste: {new Date(saved.lastTestedAt).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
              )}

              {fb && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 text-xs flex items-start gap-2 border ${
                    fb.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-red-950/60 border-red-500/50 text-red-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fb.message}</span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end">
                <button
                  onClick={() => handleTestAndSave(cfg.provider)}
                  disabled={isTesting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-2.5 text-xs font-extrabold text-white transition shadow-md shadow-emerald-950/50"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testando Conexão nos Servidores Oficiais...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Testar e Salvar Conexão no Sistema
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
