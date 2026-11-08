import OpenAI from 'openai';
import { resolveProviderCredential, VaultCredentialInput } from '@/lib/server-vault';

export interface FreeAiGenerationOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  vaultCredentials?: Record<string, VaultCredentialInput> | VaultCredentialInput[] | null;
  temperature?: number;
  maxTokens?: number;
  validate?: (parsed: any) => boolean;
  fallbackBuilder: () => T;
}

export interface FreeAiGenerationResult<T> {
  data: T;
  engineUsed: string;
  isFreeMode: boolean;
  fallbackNotice?: string;
}

export function extractJsonFromLlm(rawText: string): any {
  const cleaned = (rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned) {
    throw new Error('Resposta vazia da IA.');
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstObj = cleaned.indexOf('{');
    const firstArr = cleaned.indexOf('[');
    let start = -1;
    let end = -1;

    if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
      start = firstArr;
      end = cleaned.lastIndexOf(']');
    } else if (firstObj !== -1) {
      start = firstObj;
      end = cleaned.lastIndexOf('}');
    }

    if (start !== -1 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      return JSON.parse(slice);
    }

    throw new Error('Resposta nao contem JSON valido.');
  }
}

function isQuotaOrBillingError(errMsg: string): boolean {
  return /429|quota|billing|credit|insufficient|payment|balance|rate limit|unauthorized|401|402|403/i.test(
    errMsg || ''
  );
}

async function callGeminiFree(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<any> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError: Error = new Error('Falha no Gemini');

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey.trim()
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(22000),
        }
      );

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Gemini HTTP ${res.status}: ${errBody.slice(0, 180)}`);
      }

      const json = await res.json();
      const text =
        json?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p?.text || '')
          .join('\n') || '';
      return extractJsonFromLlm(text);
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError;
}

async function callOpenAiCompatible(params: {
  baseURL?: string;
  exactUrl?: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  useJsonFormat: boolean;
  timeoutMs: number;
}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (params.apiKey) {
    headers.Authorization = `Bearer ${params.apiKey.trim()}`;
  }

  const endpoint =
    params.exactUrl ||
    `${(params.baseURL || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`;

  const body: Record<string, any> = {
    model: params.model,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userPrompt },
    ],
  };

  if (params.useJsonFormat) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(params.timeoutMs),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 220)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || '';
  return extractJsonFromLlm(content);
}

/**
 * Motor Inteligente Gratuito-Primeiro:
 * Tenta OpenAI (se tiver saldo) -> Gemini (Grátis) -> Groq (Grátis) ->
 * Cloud Gratuita Sem Chave (OVH LLaMA 3.3 / Qwen / GPT-OSS -> Pollinations) ->
 * Fallback Arquiteto Direct-Response Offline ($0.00 garantido, nunca trava o usuário).
 */
export async function generateStructuredJsonWithFallback<T>(
  opts: FreeAiGenerationOptions<T>
): Promise<FreeAiGenerationResult<T>> {
  const temperature = opts.temperature ?? 0.7;
  const maxTokens = opts.maxTokens ?? 3200;
  const validate = opts.validate ?? ((p: any) => Boolean(p && typeof p === 'object'));

  const [openaiCred, geminiCred, groqCred] = await Promise.all([
    resolveProviderCredential('OPENAI', opts.vaultCredentials, 'OPENAI_API_KEY'),
    resolveProviderCredential('GEMINI', opts.vaultCredentials, 'GEMINI_API_KEY'),
    resolveProviderCredential('GROQ', opts.vaultCredentials, 'GROQ_API_KEY'),
  ]);

  let openAiSkippedReason = '';

  // 1. OpenAI (Pago — usa somente se usuário inseriu chave e tiver créditos)
  if (openaiCred.apiKey) {
    try {
      const client = new OpenAI({
        apiKey: openaiCred.apiKey,
        timeout: 15000,
      });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o',
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: opts.systemPrompt },
          { role: 'user', content: opts.userPrompt },
        ],
      });
      const parsed = extractJsonFromLlm(completion.choices[0]?.message?.content || '');
      if (validate(parsed)) {
        return {
          data: parsed as T,
          engineUsed: 'OpenAI GPT-4o',
          isFreeMode: false,
        };
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      openAiSkippedReason = isQuotaOrBillingError(msg)
        ? 'Sua conta OpenAI está sem créditos pagos (erro 429/cota), por isso ativamos o Modo 100% Gratuito automaticamente.'
        : 'OpenAI indisponível no momento — gerando via IA Gratuita ($0.00).';
    }
  }

  // 2. Google Gemini Free Tier (Sem Cartão de Crédito)
  if (geminiCred.apiKey) {
    try {
      const parsed = await callGeminiFree(
        geminiCred.apiKey,
        opts.systemPrompt,
        opts.userPrompt,
        temperature,
        maxTokens
      );
      if (validate(parsed)) {
        return {
          data: parsed as T,
          engineUsed: 'Google Gemini 2.5 Flash (Grátis $0)',
          isFreeMode: true,
          fallbackNotice: openAiSkippedReason || undefined,
        };
      }
    } catch (err) {
      console.warn('Gemini free fallback continue:', err);
    }
  }

  // 3. Groq Free Tier (LLaMA 3.3 70B — Sem Cartão)
  if (groqCred.apiKey) {
    try {
      const parsed = await callOpenAiCompatible({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: groqCred.apiKey,
        model: 'llama-3.3-70b-versatile',
        systemPrompt: opts.systemPrompt,
        userPrompt: opts.userPrompt,
        temperature,
        maxTokens,
        useJsonFormat: true,
        timeoutMs: 15000,
      });
      if (validate(parsed)) {
        return {
          data: parsed as T,
          engineUsed: 'Groq LLaMA 3.3 70B (Grátis $0)',
          isFreeMode: true,
          fallbackNotice: openAiSkippedReason || undefined,
        };
      }
    } catch (err) {
      console.warn('Groq free fallback continue:', err);
    }
  }

  // 4. IA Cloud Gratuita Sem Chave em Corrida Paralela (máx 9.5s total para nunca dar timeout na Vercel)
  const strictJsonSystem = `${opts.systemPrompt}\n\nIMPORTANT: Return ONLY a valid raw JSON object/array with NO markdown code blocks and NO commentary.`;
  const keylessCandidates = [
    {
      baseURL: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
      model: 'Qwen3.8-27B',
      label: 'Qwen 3.8 27B (IA Cloud Grátis $0)',
    },
    {
      baseURL: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
      model: 'Meta-Llama-3_3-70B-Instruct',
      label: 'Meta LLaMA 3.3 70B (IA Cloud Grátis $0)',
    },
    {
      exactUrl: 'https://text.pollinations.ai/openai',
      model: 'openai',
      label: 'Pollinations OpenAI-Text (Grátis $0)',
    },
  ];

  try {
    const winner = await Promise.any(
      keylessCandidates.map(async (c) => {
        const parsed = await callOpenAiCompatible({
          baseURL: c.baseURL,
          exactUrl: c.exactUrl,
          apiKey: '',
          model: c.model,
          systemPrompt: strictJsonSystem,
          userPrompt: opts.userPrompt,
          temperature,
          maxTokens: Math.min(maxTokens, 2400),
          useJsonFormat: false,
          timeoutMs: 9500,
        });
        if (!validate(parsed)) {
          throw new Error(`${c.model} retornou estrutura incompleta.`);
        }
        return { parsed: parsed as T, label: c.label };
      })
    );

    return {
      data: winner.parsed,
      engineUsed: winner.label,
      isFreeMode: true,
      fallbackNotice: openAiSkippedReason || undefined,
    };
  } catch {
    // Todas as nuvens sem chave ocupadas/lentas -> segue para Arquiteto Offline ($0.00 garantido)
  }

  // 5. Garantido 100% Gratuito Offline Direct-Response Architect (nunca falha)
  return {
    data: opts.fallbackBuilder(),
    engineUsed: 'Arquiteto Direct-Response Grátis ($0.00)',
    isFreeMode: true,
    fallbackNotice:
      openAiSkippedReason ||
      'Gerado pelo Motor Direct-Response Gratuito ($0.00). Dica: conecte uma chave grátis do Google Gemini ou Groq no Passo 0 para ter geração ilimitada com IA na nuvem!',
  };
}
