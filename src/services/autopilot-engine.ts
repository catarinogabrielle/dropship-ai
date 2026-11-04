import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '@/lib/prisma';
import { MetaAdsService } from '@/services/meta-ads.service';

const globalForCron = global as unknown as {
  autopilotCronTask?: ScheduledTask;
  autopilotCronStarted?: boolean;
  lastCronRunAt?: string;
};

export interface AutopilotExecutionItem {
  campaignId: string;
  externalAdSetId: string;
  campaignName: string;
  action: 'STOP_LOSS_PAUSED' | 'CREATIVE_FATIGUE_PAUSED' | 'VERTICAL_SCALE_20_PCT' | 'NO_ACTION';
  reason: string;
  httpStatus: number;
}

/**
 * Executa as 3 regras reais de gestao de trafego pago em todas as campanhas ativas:
 * 1. Stop-Loss Real: purchases === 0 && spendUsd >= product.targetCpaUsd * 1.5 -> PAUSED
 * 2. Fadiga de Criativo Real: impressions >= 1500 && ctr < 1.0 -> PAUSED
 * 3. Escala Vertical Real (+20%): purchases >= 3 && roas >= 2.5 -> daily_budget * 1.20
 */
export async function executeAutopilotRules(): Promise<{
  evaluatedCount: number;
  actionsTaken: AutopilotExecutionItem[];
  timestamp: string;
}> {
  const metaService = new MetaAdsService();
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: 'ACTIVE' },
    include: { product: true },
  });

  const firstProduct = await prisma.product.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  const actionsTaken: AutopilotExecutionItem[] = [];

  for (const campaign of activeCampaigns) {
    const linkedProduct = campaign.product || firstProduct;
    const targetCpaUsd = linkedProduct?.targetCpaUsd || 25.0;

    // 1. Stop-Loss Real: purchases === 0 e spendUsd >= product.targetCpaUsd * 1.5
    if (campaign.purchases === 0 && campaign.spendUsd >= targetCpaUsd * 1.5) {
      const apiRes = await metaService.updateAdSetBudgetOrStatus(campaign.externalAdSetId, {
        status: 'PAUSED',
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'PAUSED', lastSyncedAt: new Date() },
      });

      const reason = `Stop-Loss: Gasto ($${campaign.spendUsd.toFixed(2)}) atingiu >= 1.5x CPA Alvo ($${(
        targetCpaUsd * 1.5
      ).toFixed(2)}) com 0 vendas.`;

      await prisma.automationLog.create({
        data: {
          module: 'ADS_AUTOPILOT',
          action: 'STOP_LOSS_PAUSED',
          targetId: campaign.externalAdSetId,
          httpStatus: apiRes.status,
          detailsJson: JSON.stringify({
            campaignName: campaign.name,
            spendUsd: campaign.spendUsd,
            targetCpaUsd,
            reason,
            metaResponse: apiRes.data,
          }),
        },
      });

      actionsTaken.push({
        campaignId: campaign.id,
        externalAdSetId: campaign.externalAdSetId,
        campaignName: campaign.name,
        action: 'STOP_LOSS_PAUSED',
        reason,
        httpStatus: apiRes.status,
      });
      continue;
    }

    // 2. Fadiga de Criativo Real: impressions >= 1500 e ctr < 1.0
    if (campaign.impressions >= 1500 && campaign.ctr < 1.0) {
      const apiRes = await metaService.updateAdSetBudgetOrStatus(campaign.externalAdSetId, {
        status: 'PAUSED',
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'PAUSED', lastSyncedAt: new Date() },
      });

      const reason = `Fadiga de Criativo: ${campaign.impressions} impressoes (>= 1500) com CTR de ${campaign.ctr.toFixed(
        2
      )}% (< 1.0%).`;

      await prisma.automationLog.create({
        data: {
          module: 'ADS_AUTOPILOT',
          action: 'CREATIVE_FATIGUE_PAUSED',
          targetId: campaign.externalAdSetId,
          httpStatus: apiRes.status,
          detailsJson: JSON.stringify({
            campaignName: campaign.name,
            impressions: campaign.impressions,
            ctr: campaign.ctr,
            reason,
            metaResponse: apiRes.data,
          }),
        },
      });

      actionsTaken.push({
        campaignId: campaign.id,
        externalAdSetId: campaign.externalAdSetId,
        campaignName: campaign.name,
        action: 'CREATIVE_FATIGUE_PAUSED',
        reason,
        httpStatus: apiRes.status,
      });
      continue;
    }

    // 3. Escala Vertical Real (+20%): purchases >= 3 e roas >= 2.5
    if (campaign.purchases >= 3 && campaign.roas >= 2.5) {
      const newDailyBudgetUsd = +(campaign.dailyBudgetUsd * 1.2).toFixed(2);
      const newBudgetCents = Math.round(newDailyBudgetUsd * 100);

      const apiRes = await metaService.updateAdSetBudgetOrStatus(campaign.externalAdSetId, {
        dailyBudgetCents: newBudgetCents,
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { dailyBudgetUsd: newDailyBudgetUsd, lastSyncedAt: new Date() },
      });

      const reason = `Escala Vertical (+20%): ${campaign.purchases} compras e ROAS ${campaign.roas.toFixed(
        2
      )}x (>= 2.5x). Orcamento elevado de $${campaign.dailyBudgetUsd.toFixed(2)} para $${newDailyBudgetUsd.toFixed(2)}.`;

      await prisma.automationLog.create({
        data: {
          module: 'ADS_AUTOPILOT',
          action: 'VERTICAL_SCALE_20_PCT',
          targetId: campaign.externalAdSetId,
          httpStatus: apiRes.status,
          detailsJson: JSON.stringify({
            campaignName: campaign.name,
            oldBudgetUsd: campaign.dailyBudgetUsd,
            newDailyBudgetUsd,
            newBudgetCents,
            purchases: campaign.purchases,
            roas: campaign.roas,
            reason,
            metaResponse: apiRes.data,
          }),
        },
      });

      actionsTaken.push({
        campaignId: campaign.id,
        externalAdSetId: campaign.externalAdSetId,
        campaignName: campaign.name,
        action: 'VERTICAL_SCALE_20_PCT',
        reason,
        httpStatus: apiRes.status,
      });
      continue;
    }

    actionsTaken.push({
      campaignId: campaign.id,
      externalAdSetId: campaign.externalAdSetId,
      campaignName: campaign.name,
      action: 'NO_ACTION',
      reason: `Dentro dos parametros (Gasto: $${campaign.spendUsd.toFixed(2)}, Compras: ${
        campaign.purchases
      }, ROAS: ${campaign.roas.toFixed(2)}x, CTR: ${campaign.ctr.toFixed(2)}%).`,
      httpStatus: 200,
    });
  }

  const nowIso = new Date().toISOString();
  globalForCron.lastCronRunAt = nowIso;

  await prisma.automationLog.create({
    data: {
      module: 'ADS_AUTOPILOT',
      action: 'AUTOPILOT_CYCLE_COMPLETED',
      targetId: 'ALL_ACTIVE_CAMPAIGNS',
      httpStatus: 200,
      detailsJson: JSON.stringify({
        evaluatedCount: activeCampaigns.length,
        actionsCount: actionsTaken.filter((a) => a.action !== 'NO_ACTION').length,
        timestamp: nowIso,
      }),
    },
  });

  return {
    evaluatedCount: activeCampaigns.length,
    actionsTaken,
    timestamp: nowIso,
  };
}

/**
 * Inicializa o agendamento Node-Cron de 30 em 30 minutos no servidor
 */
export function ensureAutopilotCronRunning() {
  if (!globalForCron.autopilotCronStarted) {
    globalForCron.autopilotCronTask = cron.schedule('*/30 * * * *', async () => {
      try {
        const metaCred = await prisma.apiCredential.findUnique({ where: { provider: 'META_ADS' } });
        if (metaCred?.isVerified) {
          const metaService = new MetaAdsService();
          await metaService.syncAllAdSets();
          await executeAutopilotRules();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.automationLog.create({
          data: {
            module: 'ADS_AUTOPILOT_CRON',
            action: 'CRON_ERROR',
            httpStatus: 500,
            detailsJson: JSON.stringify({ error: message }),
          },
        });
      }
    });
    globalForCron.autopilotCronStarted = true;
  }

  return {
    isCronActive: Boolean(globalForCron.autopilotCronStarted),
    schedule: '*/30 * * * * (A cada 30 minutos)',
    lastRunAt: globalForCron.lastCronRunAt || null,
  };
}
