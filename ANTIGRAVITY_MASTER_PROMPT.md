# PROMPT MESTRE DE PRODUÇÃO PARA O ANTIGRAVITY (100% REAL • ZERO DADOS FALSOS/ESTÁTICOS)

Copie todo o bloco abaixo e cole diretamente no **Antigravity**. Este prompt foi engenheirado com travas explícitas (**Strict No-Mock Policy**) para obrigar o Antigravity a construir um sistema Full-Stack 100% dinâmico, conectado a banco de dados real, APIs oficiais e câmbio em tempo real — proibindo qualquer dado fictício, array estático ou simulação falsa.

## COPIE E COLE O TEXTO ABAIXO NO ANTIGRAVITY:

```
Você é um Arquiteto de Software Sênior Full-Stack e Engenheiro de Sistemas de Produção. Quero que você desenvolva, crie todos os arquivos, configure o banco de dados e execute um sistema SaaS completo chamado **"US Dollar AI Commerce Autopilot (Production Edition)"** utilizando **Next.js 15 (App Router, TypeScript estrito, Tailwind CSS, Shadcn/UI, Lucide Icons)**, **Prisma ORM (PostgreSQL ou SQLite local com persistência real em disco)** e **BullMQ / Node-Cron** no backend.

---

### ⚠️ REGRA INEGOCIÁVEL DE ENGENHARIA (PROIBIDO DADOS FALSOS, MOCKS OU ESTÁTICOS):
1. **ZERO DADOS FALSOS OU HARDCODED**: É estritamente proibido criar arrays estáticos de exemplo (`MOCK_PRODUCTS`, `FAKE_CAMPAIGNS`, `DUMMY_METRICS`), números inventados no frontend (`$10,420`, `2.84x`) ou funções que retornem `setTimeout` fingindo chamadas de API.
2. **100% BANCO DE DADOS E APIS REAIS**: Todo número exibido em qualquer card, gráfico ou tabela do sistema DEVE vir exclusivamente de consultas reais ao banco de dados via Prisma (`prisma.product.findMany`, `prisma.sale.aggregate`, `prisma.campaign.findMany`) alimentadas por chamadas HTTP reais às APIs oficiais.
3. **EMPTY STATES HONESTOS E GUIADOS**: Quando o banco de dados estiver vazio ou uma API ainda não estiver conectada, exiba um *Empty State* limpo e profissional com um botão de ação real (ex.: *"Nenhuma campanha sincronizada ainda — Clique aqui para conectar seu Token da Meta Ads e importar suas campanhas reais"*).
4. **COTAÇÃO DO DÓLAR EM TEMPO REAL**: Busque a cotação real `USD -> BRL` via API pública (`GET https://economia.awesomeapi.com.br/json/last/USD-BRL` ou `https://open.er-api.com/v6/latest/USD`) no backend e use o valor real para converter os lucros líquidos de USD para BRL.

---

### 1. DESIGN DE INTERFACE: MENU LATERAL GUIADO + ABAS POR SEGMENTO (PARA INICIANTES)

Construa uma interface moderna, limpa e intuitiva para quem está começando do zero e quer seguir um passo a passo claro:
- **Menu de Navegação Lateral Esquerdo (Sidebar Persistente)**:
  - Exibe uma **Barra de Progresso Real de Ativação (0% a 100%)** calculada dinamicamente no banco de dados conforme o usuário conclui os passos reais:
    1. `(20%)` Pelo menos 1 Chave de IA (`OPENAI_API_KEY`) validada com sucesso no banco.
    2. `(40%)` Pelo menos 1 Produto real extraído e salvo no banco de dados.
    3. `(60%)` Pelo menos 1 Roteiro/Copy em inglês gerado pela IA e salvo no banco.
    4. `(80%)` Conta de TikTok ou Meta Ads autenticada e testada com sucesso.
    5. `(100%)` Robô de monitoramento (Cron/Worker) ativo e Webhook de vendas configurado.
  - Links de navegação numerados na Sidebar:
    - `0. 🚀 Passo a Passo do Zero (Setup & Conexões de API)`
    - `1. 📦 Meus Produtos & Calculadora Real (USD/BRL)`
    - `2. ✍️ Gerador IA de Copywriting & Ofertas (OpenAI Real)`
    - `3. 🎬 Fábrica de Vídeos (ElevenLabs/FFmpeg) & Auto-Post TikTok`
    - `4. 🤖 Robô de Tráfego Pago (Meta Ads & Google Ads Real)`
    - `5. 💰 Vendas em Dólar & Webhooks (Kiwify Global & Shopify US)`
- **Abas Superiores por Segmento de Operação**:
  - Permita filtrar e operar o sistema por 4 segmentos reais:
    1. **Kiwify Internacional (Infoprodutos & Protocolos em USD)** — Taxa real configurada em `9.99% + US$ 0.80`.
    2. **Dropshipping Físico EUA (Shopify US + Zendrop/CJ)** — Taxa real configurada em `2.9% + US$ 0.30`.
    3. **TikTok Shop US & Orgânico Viral** — Taxa real configurada em `6.0%`.
    4. **Facebook Ads & Google Ads (Escala Automática)**.
- **Rodapé Guiado em Todas as Telas**: No final de cada aba, inclua um card explicativo simples para iniciantes indicando o que acabou de ser salvo no banco e um botão **"Avançar para o Próximo Passo →"**.

---

### 2. ESQUEMA DO BANCO DE DADOS REAL (`prisma/schema.prisma`)

Implemente e rode a migração real (`npx prisma db push`) com as seguintes tabelas:
- `ApiCredential`: Armazena no banco as credenciais inseridas pelo usuário na interface (`provider`: `'OPENAI' | 'ELEVENLABS' | 'HEYGEN' | 'TIKTOK' | 'META_ADS' | 'GOOGLE_ADS' | 'KIWIFY' | 'SHOPIFY'`, `apiKey`, `accountId`, `pixelId`, `webhookSecret`, `isVerified: Boolean`, `lastTestedAt: DateTime`).
- `Product`: Armazena produtos reais (`id`, `title`, `sourceUrl`, `segment`, `rawScrapedText`, `costUsd`, `priceUsd`, `orderBumpUsd`, `shippingUsd`, `gatewayFeePercent`, `gatewayFeeFixedUsd`, `breakevenCpaUsd`, `breakevenRoas`, `targetCpaUsd`, `avatarProfileJson`, `painPointsJson`, `uniqueMechanism`, `createdAt`).
- `Creative`: Armazena copys e vídeos reais gerados (`id`, `productId`, `angle`, `hookEn`, `bodyEn`, `ctaEn`, `metaPrimaryText`, `metaHeadline`, `googleHeadlinesJson`, `orderBumpCopyEn`, `translationPt`, `audioFilePath`, `videoFilePath`, `tiktokPublishId`, `metaCreativeId`, `status`, `createdAt`).
- `Campaign`: Armazena campanhas sincronizadas das APIs reais de anúncios (`id`, `productId`, `platform`, `externalCampaignId`, `externalAdSetId`, `name`, `dailyBudgetUsd`, `spendUsd`, `impressions`, `clicks`, `videoP25Watched`, `hookRate`, `ctr`, `purchases`, `revenueUsd`, `cpaUsd`, `roas`, `status`, `lastSyncedAt`).
- `Sale`: Armazena vendas reais recebidas via Webhook (`id`, `productId`, `platform`, `externalOrderId`, `customerEmailHash`, `customerCountry`, `grossUsd`, `gatewayFeeUsd`, `netUsd`, `exchangeRateBrl`, `netBrl`, `capiSent: Boolean`, `status`, `createdAt`).
- `AutomationLog`: Registra cada execução real do robô e chamadas de API (`id`, `module`, `action`, `targetId`, `httpStatus`, `detailsJson`, `createdAt`).

---

### 3. IMPLEMENTAÇÃO REAL DOS 6 MÓDULOS DE BACKEND (ROTAS DE API E SERVIÇOS)

#### MÓDULO 0: Central de Credenciais & Testador de APIs Reais (`/api/settings/credentials`)
- Crie uma tela onde o usuário cola suas chaves (`OPENAI_API_KEY`, `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `TIKTOK_ACCESS_TOKEN`, `ELEVENLABS_API_KEY`, `KIWIFY_WEBHOOK_SECRET`, etc.) e salva no banco de dados (`ApiCredential`).
- Ao clicar em **"Testar Conexão"** em cada integração, dispare uma requisição real de verificação:
  - **OpenAI**: `GET https://api.openai.com/v1/models` com `Authorization: Bearer {key}`.
  - **Meta Ads**: `GET https://graph.facebook.com/v21.0/act_{ad_account_id}?fields=name,account_status,currency&access_token={token}`.
  - **TikTok API**: `POST https://open.tiktokapis.com/v2/post/publish/creator_info/query/` com `Authorization: Bearer {token}`.
  - **ElevenLabs**: `GET https://api.elevenlabs.io/v1/user` com `xi-api-key: {key}`.
- Salve `isVerified = true` apenas se a API externa responder `200 OK` e mostre na tela o nome real da conta conectada e a moeda (`USD`).

#### MÓDULO 1: Scraper Real de Produto & Cérebro IA (`POST /api/products/ingest`)
- Recebe a `sourceUrl` real colada pelo usuário, o segmento (`KIWIFY_GLOBAL`, `SHOPIFY_US`, `TIKTOK_SHOP`), preço de venda em USD e custo em USD.
- Faz o download real do HTML da URL usando `axios` / `cheerio` (ou `playwright`), extraindo `<title>`, meta tags, descrições de produto e textos de avaliações.
- Envia o texto real extraído para a API oficial da OpenAI (`POST https://api.openai.com/v1/chat/completions`, modelo `gpt-4o`, usando `response_format: { type: "json_object" }`) para extrair e estruturar:
  - Público-alvo comprador nos EUA (`avatarProfileJson`),
  - As 5 dores reais mencionadas na página (`painPointsJson`),
  - O mecanismo único do produto (`uniqueMechanism`),
  - Sugestão de entregável complementar / Order Bump em inglês.
- Calcula com matemática exata os indicadores financeiros (AOV, Taxa exata do gateway escolhido, Margem Bruta, Breakeven CPA, Breakeven ROAS e Vendas/Dia necessárias para atingir a meta mensal de lucro líquido definida pelo usuário) e grava tudo na tabela `Product`.

#### MÓDULO 2: Gerador Real de Copywriting e Criativos via OpenAI (`POST /api/creatives/generate`)
- Consulta o registro real do `Product` no Prisma.
- Chama a API da OpenAI (`gpt-4o`) para gerar 3 estruturas completas de campanha em inglês nativo americano (com tradução fiel em português):
  1. `PAS_DIRECT` (Problem-Agitate-Solution),
  2. `UGC_STORYTELLING` (Review conversacional nativo de TikTok US),
  3. `SHOCK_HOOK` (Quebra de padrão nos primeiros 3 segundos).
- Persiste os roteiros, textos de Facebook Ads (`Primary Text`, `Headline`, `Description`), títulos de Google Ads (respeitando o limite estrito de 30 e 90 caracteres) e copy de Order Bump no banco (`Creative`) e exibe na interface com edição inline e salvamento real no banco.

#### MÓDULO 3: Pipeline Real de Áudio/Vídeo & Publicação no TikTok (`POST /api/video/render` e `POST /api/tiktok/publish`)
- **Geração de Voz Real**: Envia o roteiro em inglês (`hookEn + bodyEn + ctaEn`) para a API da ElevenLabs (`POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`) e salva o arquivo `.mp3` real em `/public/generated/audio/{creativeId}.mp3`, exibindo um player `<audio controls>` real na tela.
- **Renderização de Vídeo Real**: Permite fazer upload real de arquivos `.mp4` brutos (`multipart/form-data` salvos em `/public/uploads/`) e usa `ffmpeg` (ou API da HeyGen/Creatomate se configurada) para combinar o vídeo com a locução `.mp3` gerada, salvando o `.mp4` final e exibindo em um player `<video controls>` real.
- **Publicação Oficial no TikTok**: Quando o usuário clicar em **"Publicar no TikTok US"**, execute a chamada real para `POST https://open.tiktokapis.com/v2/post/publish/video/init/` enviando o vídeo e gravando o `publish_id` retornado pelo TikTok no banco de dados.

#### MÓDULO 4: Sincronizador e Robô Autônomo de Tráfego Pago (`POST /api/ads/sync` e Worker de 30 Minutos)
- **Sincronização Real (`POST /api/ads/sync`)**:
  - Consulta na Graph API oficial da Meta (`GET https://graph.facebook.com/v21.0/act_{ad_account_id}/adsets?fields=id,name,daily_budget,status,insights.date_preset(today){spend,impressions,clicks,ctr,actions,action_values,video_p25_watched_actions}`) todos os conjuntos de anúncios reais da conta do usuário.
  - Calcula as métricas reais:
    - `hookRate = (video_p25_watched_actions / impressions) * 100`
    - `cpaUsd = purchases > 0 ? spend / purchases : spend`
    - `roas = spend > 0 ? revenue / spend : 0`
  - Faz `upsert` de cada conjunto real na tabela `Campaign` do Prisma.
- **Motor de Regras Automáticas (Execução Real via Cron a cada 30 min ou botão "Executar Agora")**:
  - Percorre os registros ativos da tabela `Campaign` e compara com os parâmetros reais do `Product` vinculado:
    - **Stop-Loss Real**: Se `purchases === 0` e `spendUsd >= product.targetCpaUsd * 1.5`, envia `POST https://graph.facebook.com/v21.0/{externalAdSetId}` com `status=PAUSED`, atualiza o banco e grava o retorno HTTP da Meta em `AutomationLog`.
    - **Fadiga de Criativo Real**: Se `impressions >= 1500` e `ctr < 1.0`, pausa o conjunto via API da Meta e registra o alerta.
    - **Escala Vertical Real (+20%)**: Se `purchases >= 3` e `roas >= 2.5`, envia `POST https://graph.facebook.com/v21.0/{externalAdSetId}` aumentando `daily_budget` em 20% (em centavos de dólar) e grava no `AutomationLog`.

#### MÓDULO 5: Webhooks Reais de Vendas em Dólar + Server-Side Meta CAPI (`POST /api/webhooks/kiwify` e `POST /api/webhooks/shopify`)
- Recebe os payloads reais de vendas aprovadas (`order_status === 'paid'`) enviados pela Kiwify Internacional ou pela Shopify US.
- Calcula a taxa real da plataforma (`9.99% + $0.80` para Kiwify Global em USD; `2.9% + $0.30` para Shopify US), busca a cotação atual do dólar e salva a venda real na tabela `Sale`.
- Dispara imediatamente uma requisição `POST https://graph.facebook.com/v21.0/{pixel_id}/events` (Meta Conversions API Server-Side) enviando o evento `Purchase` com hash SHA-256 do e-mail do comprador e valor em `USD`, marcando `capiSent = true` no banco.

---

### 4. COMO VOCÊ DEVE CONSTRUIR E ENTREGAR AGORA:
1. Inicialize o projeto Next.js 15 com TypeScript, Tailwind CSS e Prisma (`sqlite` apontando para `file:./production.db` no `.env` inicial para não exigir servidor externo antes de rodar, mas 100% persistente em disco).
2. Crie o schema do Prisma, rode `npx prisma generate` e `npx prisma db push`.
3. Implemente todas as rotas de API reais em `src/app/api/...` sem nenhum dado estático ou mockado.
4. Construa o frontend completo com Sidebar de Progresso Real, Abas por Segmento, Guia Passo a Passo de Ativação na Aba 0 (com os links diretos para o usuário gerar suas chaves na OpenAI, Meta Developers, TikTok Developers e Kiwify) e tabelas/gráficos conectados via `fetch` real ao banco de dados.
5. Inicie o servidor e verifique se todas as páginas compilam sem erros de TypeScript.

```

## O Que Vai Acontecer Quando Você Colar Esse Prompt no Antigravity

1. **Banco de Dados Limpo e 100% Real**: O sistema vai abrir na **Aba 0 (Setup & Conexões de API)** com a barra de progresso em `0%`, sem nenhum número falso na tela.

2. **Validação de Chaves com Ping Real**: Quando você colar sua chave da OpenAI, da [Meta Marketing API](https://developers.facebook.com/documentation/ads-commerce/marketing-api) ou da [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started) e clicar em **"Testar Conexão"**, o sistema fará uma chamada verdadeira aos servidores deles para confirmar que sua conta está ativa.

3. **Extração, Geração e Vendas Reais**: Cada produto colado, cada copy/áudio gerado e cada venda recebida pelo webhook da [Kiwify Internacional](https://ajuda.kiwify.com.br/pt-br/article/o-checkout-funciona-fora-do-brasil-1cdb1ri/) ou [Zendrop](https://www.zendrop.com/) / Shopify ficará gravada no banco de dados `production.db` da sua máquina, alimentando os gráficos com os seus números reais.