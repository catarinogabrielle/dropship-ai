import { Worker, Queue } from 'bullmq';
import { prisma } from '../lib/prisma';
import { MetaAdsService } from '../services/meta-ads.service';
import { executeAutopilotRules, ensureAutopilotCronRunning } from '../services/autopilot-engine';

const metaService = new MetaAdsService();

export const autopilotQueue = new Queue('ads-autopilot-us', {
  connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
});

export const autopilotWorker = new Worker(
  'ads-autopilot-us',
  async (job) => {
    const {
      adSetId,
      targetCpaUsd,
      minRoasToScale = 2.5,
      currentDailyBudgetUsd,
      spendUsd,
      purchases,
      revenueUsd,
      impressions = 0,
      ctr = 1.5,
    } = job.data;

    // Regra 1: Stop-Loss Real (Gasto >= 1.5x CPA Alvo com 0 vendas)
    if (purchases === 0 && spendUsd >= targetCpaUsd * 1.5) {
      const apiRes = await metaService.updateAdSetBudgetOrStatus(adSetId, { status: 'PAUSED' });
      await prisma.automationLog.create({
        data: {
          module: 'BULLMQ_WORKER',
          action: 'STOP_LOSS_PAUSED',
          targetId: adSetId,
          httpStatus: apiRes.status,
          detailsJson: JSON.stringify(apiRes.data),
        },
      });
      return {
        action: 'PAUSED_STOP_LOSS',
        reason: `Spend ($${spendUsd}) exceeded 1.5x Target CPA ($${targetCpaUsd}) with 0 sales`,
      };
    }

    // Regra 2: Fadiga de Criativo Real (Impressoes >= 1500 e CTR < 1.0%)
    if (impressions >= 1500 && ctr < 1.0) {
      const apiRes = await metaService.updateAdSetBudgetOrStatus(adSetId, { status: 'PAUSED' });
      await prisma.automationLog.create({
        data: {
          module: 'BULLMQ_WORKER',
          action: 'CREATIVE_FATIGUE_PAUSED',
          targetId: adSetId,
          httpStatus: apiRes.status,
          detailsJson: JSON.stringify(apiRes.data),
        },
      });
      return {
        action: 'PAUSED_CREATIVE_FATIGUE',
        reason: `Impressions (${impressions}) >= 1500 with CTR (${ctr}%) < 1.0%`,
      };
    }

    // Regra 3: Escala Vertical Automatica (+20% orcamento se ROAS >= 2.5 e >= 3 vendas)
    const currentRoas = spendUsd > 0 ? revenueUsd / spendUsd : 0;
    if (purchases >= 3 && currentRoas >= minRoasToScale) {
      const newBudgetUsd = +(currentDailyBudgetUsd * 1.2).toFixed(2);
      const apiRes = await metaService.updateAdSetBudgetOrStatus(adSetId, {
        dailyBudgetCents: Math.round(newBudgetUsd * 100),
      });
      await prisma.automationLog.create({
        data: {
          module: 'BULLMQ_WORKER',
          action: 'VERTICAL_SCALE_20_PCT',
          targetId: adSetId,
          httpStatus: apiRes.status,
          detailsJson: JSON.stringify(apiRes.data),
        },
      });
      return { action: 'SCALED_BUDGET_20_PCT', newBudgetUsd, currentRoas };
    }

    return { action: 'MAINTAINED', currentRoas };
  },
  { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } }
);

// Inicializa o Cron de 30 minutos quando o worker e executado diretamente
if (require.main === module) {
  ensureAutopilotCronRunning();
  executeAutopilotRules().catch(console.error);
}
