// ===========================================================================================
// INTEGRATION HEALTH SCHEDULER - SaaS Admin Infrastructure Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Infrastructure Layer → Serviços técnicos e agendamento

import { CheckAllIntegrationsHealthUseCase } from '../../application/use-cases/CheckAllIntegrationsHealthUseCase';

export class IntegrationHealthScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private readonly intervalMinutes: number;

  constructor(
    private checkAllIntegrationsHealthUseCase: CheckAllIntegrationsHealthUseCase,
    intervalMinutes: number = 15 // Default: 15 minutes
  ) {
    this.intervalMinutes = intervalMinutes;
  }

  start(): void {
    if (this.isRunning) {
      console.warn('[INTEGRATION-HEALTH-SCHEDULER] Scheduler is already running');
      return;
    }

    console.log(`[INTEGRATION-HEALTH-SCHEDULER] Starting health check scheduler (every ${this.intervalMinutes} minutes)`);

    // Execute immediately on start
    this.executeHealthCheck();

    // Schedule recurring health checks
    const intervalMs = this.intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.executeHealthCheck();
    }, intervalMs);

    this.isRunning = true;
    console.log(`[INTEGRATION-HEALTH-SCHEDULER] Scheduler started successfully`);
  }

  stop(): void {
    if (!this.isRunning) {
      console.warn('[INTEGRATION-HEALTH-SCHEDULER] Scheduler is not running');
      return;
    }

    console.log('[INTEGRATION-HEALTH-SCHEDULER] Stopping health check scheduler');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('[INTEGRATION-HEALTH-SCHEDULER] Scheduler stopped successfully');
  }

  getStatus(): {
    isRunning: boolean;
    intervalMinutes: number;
    nextCheckIn?: number; // seconds
  } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      // Note: We don't track exact next check time in this simple implementation
      nextCheckIn: this.isRunning ? this.intervalMinutes * 60 : undefined
    };
  }

  private async executeHealthCheck(): Promise<void> {
    try {
      console.log('[INTEGRATION-HEALTH-SCHEDULER] 🏥 Starting scheduled health check for all integrations');
      
      const startTime = Date.now();
      const result = await this.checkAllIntegrationsHealthUseCase.execute();
      const duration = Date.now() - startTime;

      console.log('[INTEGRATION-HEALTH-SCHEDULER] ✅ Scheduled health check completed:', {
        success: result.success,
        duration: `${duration}ms`,
        totalChecked: result.data.totalChecked,
        connected: result.data.connected,
        errors: result.data.errors,
        disconnected: result.data.disconnected,
        checkedAt: result.data.checkedAt
      });

      // Log any errors found
      if (result.data.errors > 0) {
        const errorResults = result.data.results.filter(r => r.status === 'error');
        console.warn('[INTEGRATION-HEALTH-SCHEDULER] ⚠️ Found integration errors:', 
          errorResults.map(r => ({ id: r.integrationId, error: r.message }))
        );
      }

    } catch (error) {
      console.error('[INTEGRATION-HEALTH-SCHEDULER] ❌ Error during scheduled health check:', error);
      
      // Log error details for troubleshooting
      if (error instanceof Error) {
        console.error('[INTEGRATION-HEALTH-SCHEDULER] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    }
  }

  // Method to trigger manual health check (for testing/debugging)
  async triggerManualCheck(): Promise<void> {
    console.log('[INTEGRATION-HEALTH-SCHEDULER] 🔧 Triggering manual health check');
    await this.executeHealthCheck();
  }
}