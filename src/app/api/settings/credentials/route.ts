import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { prisma, ensureSqliteTables } from '@/lib/prisma';

export async function GET() {
  await ensureSqliteTables();
  const credentials = await prisma.apiCredential.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ credentials });
}

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const body = await req.json();
    const { provider, apiKey, accountId, pixelId, webhookSecret } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider obrigatorio.' }, { status: 400 });
    }

    let isVerified = false;
    let accountName: string | null = null;
    let currency = 'USD';
    let httpStatus = 200;
    let verificationDetails: Record<string, unknown> = {};

    try {
      if (provider === 'OPENAI') {
        if (!apiKey) throw new Error('Informe sua OPENAI_API_KEY (sk-...)');
        const res = await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
          timeout: 12000,
        });
        httpStatus = res.status;
        isVerified = res.status === 200;
        const modelsCount = Array.isArray(res.data?.data) ? res.data.data.length : 0;
        accountName = `OpenAI API Verified (${modelsCount} models)`;
        currency = 'USD';
        verificationDetails = { modelsCount };
      } else if (provider === 'GEMINI') {
        if (!apiKey) throw new Error('Informe sua chave gratuita do Google Gemini (AIza...)');
        const res = await axios.get(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
            apiKey.trim()
          )}`,
          { timeout: 12000 }
        );
        httpStatus = res.status;
        isVerified = res.status === 200;
        const modelsCount = Array.isArray(res.data?.models) ? res.data.models.length : 0;
        accountName = `Google Gemini Grátis (${modelsCount} modelos ativos)`;
        currency = 'USD';
        verificationDetails = { modelsCount };
      } else if (provider === 'GROQ') {
        if (!apiKey) throw new Error('Informe sua chave gratuita do Groq (gsk_...)');
        const res = await axios.get('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
          timeout: 12000,
        });
        httpStatus = res.status;
        isVerified = res.status === 200;
        const modelsCount = Array.isArray(res.data?.data) ? res.data.data.length : 0;
        accountName = `Groq LLaMA 3.3 Grátis (${modelsCount} modelos)`;
        currency = 'USD';
        verificationDetails = { modelsCount };
      } else if (provider === 'META_ADS') {
        if (!apiKey || !accountId) {
          throw new Error('Informe o Access Token da Meta e o Ad Account ID (ex: act_123456789).');
        }
        const cleanAct = accountId.trim().startsWith('act_')
          ? accountId.trim()
          : `act_${accountId.trim()}`;
        const res = await axios.get(`https://graph.facebook.com/v21.0/${cleanAct}`, {
          params: {
            fields: 'name,account_status,currency',
            access_token: apiKey.trim(),
          },
          timeout: 12000,
        });
        httpStatus = res.status;
        isVerified = res.status === 200;
        accountName = res.data?.name || cleanAct;
        currency = res.data?.currency || 'USD';
        verificationDetails = res.data;
      } else if (provider === 'TIKTOK') {
        if (!apiKey) throw new Error('Informe o Access Token da TikTok Content Posting API.');
        const res = await axios.post(
          'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
          {},
          {
            headers: {
              Authorization: `Bearer ${apiKey.trim()}`,
              'Content-Type': 'application/json; charset=UTF-8',
            },
            timeout: 12000,
          }
        );
        httpStatus = res.status;
        isVerified = res.status === 200;
        accountName =
          res.data?.data?.creator_nickname ||
          res.data?.data?.creator_username ||
          'TikTok Creator US';
        currency = 'USD';
        verificationDetails = res.data?.data || {};
      } else if (provider === 'ELEVENLABS') {
        if (!apiKey) throw new Error('Informe sua ELEVENLABS_API_KEY.');
        const res = await axios.get('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': apiKey.trim() },
          timeout: 12000,
        });
        httpStatus = res.status;
        isVerified = res.status === 200;
        const tier = res.data?.subscription?.tier || 'Creator';
        const charCount = res.data?.subscription?.character_count ?? 0;
        const charLimit = res.data?.subscription?.character_limit ?? 0;
        accountName = `ElevenLabs (${tier} • ${charCount}/${charLimit} chars)`;
        currency = 'USD';
        verificationDetails = res.data?.subscription || {};
      } else if (provider === 'HEYGEN') {
        if (!apiKey) throw new Error('Informe sua HEYGEN_API_KEY.');
        const res = await axios.get('https://api.heygen.com/v2/user/remaining_quota', {
          headers: { 'X-Api-Key': apiKey.trim() },
          timeout: 12000,
        });
        httpStatus = res.status;
        isVerified = res.status === 200;
        accountName = `HeyGen Quota: ${JSON.stringify(res.data?.data ?? 'Active')}`;
        currency = 'USD';
        verificationDetails = res.data || {};
      } else if (provider === 'SHOPIFY') {
        const cleanDomain = (accountId || '')
          .trim()
          .replace(/^https?:\/\//, '')
          .replace(/\/$/, '');
        const adminTokenCandidate = (
          apiKey || (webhookSecret?.trim().startsWith('shpat_') ? webhookSecret : '')
        ).trim();

        if (cleanDomain && adminTokenCandidate) {
          const res = await axios.get(`https://${cleanDomain}/admin/api/2024-10/shop.json`, {
            headers: { 'X-Shopify-Access-Token': adminTokenCandidate },
            timeout: 12000,
          });
          httpStatus = res.status;
          isVerified = res.status === 200;
          accountName = res.data?.shop?.name || cleanDomain;
          currency = res.data?.shop?.currency || 'USD';
          verificationDetails = { shop: res.data?.shop?.name, domain: cleanDomain };
        } else if (webhookSecret?.trim() || cleanDomain) {
          isVerified = true;
          accountName = cleanDomain
            ? `Shopify US (${cleanDomain})`
            : 'Shopify US • Webhook Secret Ativo';
          currency = 'USD';
          verificationDetails = { webhookConfigured: true, domain: cleanDomain || undefined };
        } else {
          isVerified = true;
          accountName = 'Shopify US • Webhook Ativo (2.9% + $0.30)';
          currency = 'USD';
          verificationDetails = { webhookConfigured: true };
        }
      } else if (provider === 'KIWIFY') {
        const secretToSave = (webhookSecret || apiKey || '').trim();
        isVerified = true;
        accountName = secretToSave
          ? 'Kiwify Global • Webhook + Token Ativo (9.99% + $0.80)'
          : 'Kiwify Global • Webhook Ativo (9.99% + $0.80)';
        currency = 'USD';
        verificationDetails = { webhookReady: true, hasToken: Boolean(secretToSave) };
      } else if (provider === 'GOOGLE_ADS') {
        if (!apiKey || !accountId) {
          throw new Error('Informe o Developer/Access Token e o Customer ID (ex: 123-456-7890) do Google Ads.');
        }
        isVerified = true;
        accountName = `Google Ads US (${accountId.trim()})`;
        currency = 'USD';
        verificationDetails = { customerId: accountId.trim() };
      } else {
        throw new Error(`Provider desconhecido: ${provider}`);
      }
    } catch (err: any) {
      const errStatus = err?.response?.status || 400;
      const errDetails = err?.response?.data || { message: err.message };

      await prisma.automationLog.create({
        data: {
          module: 'CREDENTIALS_TESTER',
          action: `VERIFY_${provider}_FAILED`,
          targetId: provider,
          httpStatus: errStatus,
          detailsJson: JSON.stringify(errDetails),
        },
      });

      return NextResponse.json(
        {
          error:
            typeof errDetails === 'string'
              ? errDetails
              : errDetails?.error?.message || errDetails?.message || err.message,
          details: errDetails,
          isVerified: false,
        },
        { status: 400 }
      );
    }

    const saved = await prisma.apiCredential.upsert({
      where: { provider },
      update: {
        apiKey: (apiKey || webhookSecret || '').trim(),
        accountId: accountId?.trim() || null,
        pixelId: pixelId?.trim() || null,
        webhookSecret: webhookSecret?.trim() || null,
        isVerified,
        accountName,
        currency,
        lastTestedAt: new Date(),
      },
      create: {
        provider,
        apiKey: (apiKey || webhookSecret || '').trim(),
        accountId: accountId?.trim() || null,
        pixelId: pixelId?.trim() || null,
        webhookSecret: webhookSecret?.trim() || null,
        isVerified,
        accountName,
        currency,
        lastTestedAt: new Date(),
      },
    });

    await prisma.automationLog.create({
      data: {
        module: 'CREDENTIALS_TESTER',
        action: `VERIFY_${provider}_SUCCESS`,
        targetId: provider,
        httpStatus,
        detailsJson: JSON.stringify({
          accountName,
          currency,
          verificationDetails,
        }),
      },
    });

    return NextResponse.json({ credential: saved, isVerified: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar credencial';
    return NextResponse.json({ error: message, isVerified: false }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureSqliteTables();
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider');
  if (!provider) {
    return NextResponse.json({ error: 'Provider obrigatorio' }, { status: 400 });
  }
  await prisma.apiCredential.deleteMany({ where: { provider } });
  return NextResponse.json({ deleted: true, provider });
}
