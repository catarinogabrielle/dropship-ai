import { NextRequest, NextResponse } from 'next/server';
import { executeAutopilotRules, ensureAutopilotCronRunning } from '@/services/autopilot-engine';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import {
  ensureCredentialsFromVault,
  ensureProductsListFromVault,
} from '@/lib/server-vault';

export const maxDuration = 60;

async function handleAutopilotExecution(req?: NextRequest) {
  try {
    await ensureSqliteTables();
    if (req) {
      const body = await req.json().catch(() => ({}));
      if (body?._vaultCredentials) {
        await ensureCredentialsFromVault(body._vaultCredentials);
      }
      if (body?._vaultProducts) {
        await ensureProductsListFromVault(body._vaultProducts);
      }
    }

    const cronState = ensureAutopilotCronRunning();
    const result = await executeAutopilotRules();

    const [campaigns, logs] = await Promise.all([
      prisma.campaign.findMany({
        include: { product: true },
        orderBy: { lastSyncedAt: 'desc' },
      }),
      prisma.automationLog.findMany({
        where: {
          module: { in: ['META_ADS_SYNC', 'ADS_AUTOPILOT', 'ADS_AUTOPILOT_CRON', 'BULLMQ_WORKER'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    return NextResponse.json({
      ...result,
      cronState,
      campaigns,
      logs,
    });
  } catch (error: any) {
    const errDetails = error?.response?.data || { message: error.message };
    return NextResponse.json(
      {
        error:
          errDetails?.error?.message ||
          errDetails?.message ||
          error.message ||
          'Erro ao executar regras do Robo de Trafego Pago',
      },
      { status: 400 }
    );
  }
}

// Suporta GET (usado pelo Vercel Cron Jobs) e POST (usado pelo botao na interface)
export async function GET() {
  return handleAutopilotExecution();
}

export async function POST(req: NextRequest) {
  return handleAutopilotExecution(req);
}
