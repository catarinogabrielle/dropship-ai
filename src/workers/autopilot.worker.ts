import { executeAutopilotRules, ensureAutopilotCronRunning } from '../services/autopilot-engine';

/**
 * Worker 100% Gratuito (Sem Redis / Sem custos extras)
 * Usa Node-Cron + Vercel Cron + Banco SQLite/Prisma integrado.
 */
if (require.main === module) {
  ensureAutopilotCronRunning();
  executeAutopilotRules().catch(console.error);
}
