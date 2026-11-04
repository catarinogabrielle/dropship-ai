import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export class MetaAdsService {
  private baseUrl = 'https://graph.facebook.com/v21.0';

  async getCredentials() {
    const cred = await prisma.apiCredential.findUnique({
      where: { provider: 'META_ADS' },
    });
    const accessToken = cred?.apiKey || process.env.META_ACCESS_TOKEN;
    const rawAccountId = cred?.accountId || process.env.META_AD_ACCOUNT_ID;
    const pixelId = cred?.pixelId || process.env.META_PIXEL_ID;

    if (!accessToken || !rawAccountId) {
      throw new Error(
        'Credenciais da Meta Ads (Access Token e Ad Account ID) nao configuradas. Conecte sua conta na Aba 0.'
      );
    }

    const adAccountId = rawAccountId.startsWith('act_') ? rawAccountId : `act_${rawAccountId}`;
    return { accessToken, adAccountId, pixelId };
  }

  /**
   * Atualiza status (ACTIVE | PAUSED) ou orcamento diario em centavos de dolar na Meta Graph API v21.0
   */
  async updateAdSetBudgetOrStatus(
    adSetId: string,
    action: { status?: 'ACTIVE' | 'PAUSED'; dailyBudgetCents?: number }
  ) {
    const { accessToken } = await this.getCredentials();
    const payload: Record<string, string | number> = { access_token: accessToken };
    if (action.status) payload.status = action.status;
    if (action.dailyBudgetCents !== undefined) payload.daily_budget = action.dailyBudgetCents;

    const res = await axios.post(`${this.baseUrl}/${adSetId}`, payload);
    return { status: res.status, data: res.data };
  }

  /**
   * Consulta todos os conjuntos de anuncios reais da conta e suas metricas do dia na Meta Graph API
   */
  async syncAllAdSets(defaultProductId?: string) {
    const { accessToken, adAccountId } = await this.getCredentials();

    const res = await axios.get(`${this.baseUrl}/${adAccountId}/adsets`, {
      params: {
        access_token: accessToken,
        fields:
          'id,name,campaign_id,daily_budget,status,insights.date_preset(today){spend,impressions,clicks,ctr,actions,action_values,video_p25_watched_actions}',
        limit: 100,
      },
    });

    const adsets = res.data?.data || [];
    const syncedCampaigns = [];

    for (const adset of adsets) {
      const insightsData = adset.insights?.data?.[0] || {};
      const spendUsd = parseFloat(insightsData.spend || '0');
      const impressions = parseInt(insightsData.impressions || '0', 10);
      const clicks = parseInt(insightsData.clicks || '0', 10);
      const ctr = parseFloat(insightsData.ctr || '0');

      // Extrai video_p25_watched_actions real
      const videoP25Arr = insightsData.video_p25_watched_actions || [];
      const videoP25Watched = videoP25Arr.reduce(
        (acc: number, item: { value?: string }) => acc + parseInt(item.value || '0', 10),
        0
      );

      // Extrai compras reais (purchase / offsite_conversion.fb_pixel_purchase)
      const actionsArr = insightsData.actions || [];
      const purchaseAction = actionsArr.find(
        (a: { action_type: string; value: string }) =>
          a.action_type === 'purchase' ||
          a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
          a.action_type === 'omni_purchase'
      );
      const purchases = purchaseAction ? parseInt(purchaseAction.value || '0', 10) : 0;

      // Extrai receita real em USD (action_values)
      const actionValuesArr = insightsData.action_values || [];
      const purchaseValueObj = actionValuesArr.find(
        (a: { action_type: string; value: string }) =>
          a.action_type === 'purchase' ||
          a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
          a.action_type === 'omni_purchase'
      );
      const revenueUsd = purchaseValueObj ? parseFloat(purchaseValueObj.value || '0') : 0;

      // Calculo das metricas reais exigidas
      const hookRate = impressions > 0 ? +((videoP25Watched / impressions) * 100).toFixed(2) : 0;
      const cpaUsd = purchases > 0 ? +(spendUsd / purchases).toFixed(2) : +spendUsd.toFixed(2);
      const roas = spendUsd > 0 ? +(revenueUsd / spendUsd).toFixed(2) : 0;
      const dailyBudgetUsd = adset.daily_budget ? +(parseInt(adset.daily_budget, 10) / 100).toFixed(2) : 0;

      const upserted = await prisma.campaign.upsert({
        where: { externalAdSetId: String(adset.id) },
        update: {
          externalCampaignId: adset.campaign_id ? String(adset.campaign_id) : null,
          name: adset.name || `AdSet ${adset.id}`,
          dailyBudgetUsd,
          spendUsd,
          impressions,
          clicks,
          videoP25Watched,
          hookRate,
          ctr,
          purchases,
          revenueUsd,
          cpaUsd,
          roas,
          status: adset.status || 'ACTIVE',
          lastSyncedAt: new Date(),
          ...(defaultProductId ? { productId: defaultProductId } : {}),
        },
        create: {
          productId: defaultProductId || null,
          platform: 'META_ADS',
          externalCampaignId: adset.campaign_id ? String(adset.campaign_id) : null,
          externalAdSetId: String(adset.id),
          name: adset.name || `AdSet ${adset.id}`,
          dailyBudgetUsd,
          spendUsd,
          impressions,
          clicks,
          videoP25Watched,
          hookRate,
          ctr,
          purchases,
          revenueUsd,
          cpaUsd,
          roas,
          status: adset.status || 'ACTIVE',
          lastSyncedAt: new Date(),
        },
      });

      syncedCampaigns.push(upserted);
    }

    await prisma.automationLog.create({
      data: {
        module: 'META_ADS_SYNC',
        action: 'SYNC_ADSETS',
        targetId: adAccountId,
        httpStatus: res.status,
        detailsJson: JSON.stringify({
          syncedCount: syncedCampaigns.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return syncedCampaigns;
  }

  /**
   * Dispara Server-Side Meta Conversions API (CAPI) para eventos Purchase em USD
   */
  async sendCapiPurchaseEvent(params: {
    orderId: string;
    customerEmail?: string;
    customerEmailHash?: string;
    grossUsd: number;
    customerCountry?: string;
    sourceUrl?: string;
  }) {
    const cred = await prisma.apiCredential.findUnique({
      where: { provider: 'META_ADS' },
    });
    const accessToken = cred?.apiKey || process.env.META_ACCESS_TOKEN;
    const pixelId = cred?.pixelId || process.env.META_PIXEL_ID;

    if (!accessToken || !pixelId) {
      return { sent: false, reason: 'META_PIXEL_ID ou META_ACCESS_TOKEN nao configurado' };
    }

    const emailHash =
      params.customerEmailHash ||
      (params.customerEmail
        ? crypto.createHash('sha256').update(params.customerEmail.trim().toLowerCase()).digest('hex')
        : undefined);

    const countryHash = params.customerCountry
      ? crypto.createHash('sha256').update(params.customerCountry.trim().toLowerCase()).digest('hex')
      : undefined;

    const eventPayload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: params.orderId,
          action_source: 'website',
          event_source_url: params.sourceUrl || undefined,
          user_data: {
            ...(emailHash ? { em: [emailHash] } : {}),
            ...(countryHash ? { country: [countryHash] } : {}),
          },
          custom_data: {
            currency: 'USD',
            value: params.grossUsd,
            order_id: params.orderId,
          },
        },
      ],
    };

    const res = await axios.post(`${this.baseUrl}/${pixelId}/events`, eventPayload, {
      params: { access_token: accessToken },
    });

    await prisma.automationLog.create({
      data: {
        module: 'META_CAPI',
        action: 'PURCHASE_EVENT_DISPATCHED',
        targetId: params.orderId,
        httpStatus: res.status,
        detailsJson: JSON.stringify(res.data),
      },
    });

    return { sent: res.status === 200, httpStatus: res.status, response: res.data };
  }
}
