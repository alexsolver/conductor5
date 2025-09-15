// ===========================================================================================
// INTEGRATION HEALTH SCHEDULER - Monitoring Infrastructure
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Infrastructure Layer → Scheduler para execução automática de health checks

import { DrizzleIntegrationRepository } from '../modules/saas-admin/infrastructure/repositories/DrizzleIntegrationRepository';
import { OpenWeatherHealthChecker } from '../modules/saas-admin/infrastructure/health-checkers/OpenWeatherHealthChecker';
import { CheckAllIntegrationsHealthUseCase } from '../modules/saas-admin/application/use-cases/CheckAllIntegrationsHealthUseCase';

export class IntegrationHealthScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly intervalMinutes: number;

  constructor(intervalMinutes: number = 15) {
    this.intervalMinutes = intervalMinutes;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[INTEGRATION-HEALTH-SCHEDULER] Scheduler is already running');
      return;
    }

    console.log(`[INTEGRATION-HEALTH-SCHEDULER] Starting scheduler with ${this.intervalMinutes} minute intervals`);

    // Run initial health check immediately
    await this.performHealthCheck();

    // Schedule periodic health checks with jitter to avoid exact timing conflicts
    const intervalMs = this.intervalMinutes * 60 * 1000;
    const jitterMs = Math.random() * 30 * 1000; // Up to 30 seconds jitter

    this.intervalId = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('[INTEGRATION-HEALTH-SCHEDULER] Error during scheduled health check:', error);
      }
    }, intervalMs + jitterMs);

    this.isRunning = true;
    console.log(`[INTEGRATION-HEALTH-SCHEDULER] ✅ Scheduler started successfully`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning || !this.intervalId) {
      console.log('[INTEGRATION-HEALTH-SCHEDULER] Scheduler is not running');
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    
    console.log('[INTEGRATION-HEALTH-SCHEDULER] ✅ Scheduler stopped successfully');
  }

  getStatus(): { running: boolean; intervalMinutes: number } {
    return {
      running: this.isRunning,
      intervalMinutes: this.intervalMinutes
    };
  }

  private async performHealthCheck(): Promise<void> {
    try {
      console.log('[INTEGRATION-HEALTH-SCHEDULER] 🔍 Starting scheduled health check');

      // Initialize dependencies
      const integrationRepository = new DrizzleIntegrationRepository();
      const healthChecker = new OpenWeatherHealthChecker();
      const checkAllIntegrationsUseCase = new CheckAllIntegrationsHealthUseCase(
        integrationRepository,
        healthChecker
      );

      // Execute health check
      const result = await checkAllIntegrationsUseCase.execute();

      console.log('[INTEGRATION-HEALTH-SCHEDULER] ✅ Scheduled health check completed:', {
        success: result.success,
        totalChecked: result.data.totalChecked,
        connected: result.data.connected,
        errors: result.data.errors,
        disconnected: result.data.disconnected,
        checkedAt: result.data.checkedAt
      });

      // Log individual integration results
      result.data.results.forEach(integration => {
        const statusIcon = integration.status === 'connected' ? '✅' : 
                          integration.status === 'error' ? '❌' : '⚪';
        
        console.log(`[INTEGRATION-HEALTH-SCHEDULER] ${statusIcon} ${integration.integrationId}: ${integration.status} - ${integration.message || 'OK'}`);
      });

    } catch (error) {
      console.error('[INTEGRATION-HEALTH-SCHEDULER] ❌ Failed to perform scheduled health check:', error);
      
      // Implement backoff strategy for repeated failures
      if (this.isRunning) {
        console.log('[INTEGRATION-HEALTH-SCHEDULER] ⚠️ Will retry on next scheduled interval');
      }
    }
  }
}

// Singleton instance for global scheduler management
let schedulerInstance: IntegrationHealthScheduler | null = null;

export async function startGlobalHealthScheduler(intervalMinutes: number = 15): Promise<void> {
  try {
    if (schedulerInstance) {
      console.log('[INTEGRATION-HEALTH-SCHEDULER] Global scheduler already exists');
      return;
    }

    schedulerInstance = new IntegrationHealthScheduler(intervalMinutes);
    await schedulerInstance.start();
    
    console.log('[INTEGRATION-HEALTH-SCHEDULER] 🚀 Global health scheduler initialized');
  } catch (error) {
    console.error('[INTEGRATION-HEALTH-SCHEDULER] ❌ Failed to start global scheduler:', error);
    throw error;
  }
}

export async function stopGlobalHealthScheduler(): Promise<void> {
  if (schedulerInstance) {
    await schedulerInstance.stop();
    schedulerInstance = null;
    console.log('[INTEGRATION-HEALTH-SCHEDULER] 🛑 Global health scheduler stopped');
  }
}

export function getGlobalSchedulerStatus(): { running: boolean; intervalMinutes: number } | null {
  return schedulerInstance ? schedulerInstance.getStatus() : null;
}