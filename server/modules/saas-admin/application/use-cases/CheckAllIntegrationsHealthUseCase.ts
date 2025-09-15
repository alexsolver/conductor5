// ===========================================================================================
// CHECK ALL INTEGRATIONS HEALTH USE CASE - SaaS Admin Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Application Layer → Use Cases e Controllers (NUNCA importar Infrastructure diretamente)

import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';
import { IIntegrationHealthChecker } from '../../domain/repositories/IIntegrationHealthChecker';
import { HealthCheckSummary, HealthCheckResult } from '../../domain/types/HealthTypes';

export class CheckAllIntegrationsHealthUseCase {
  constructor(
    private integrationRepository: IIntegrationRepository,
    private healthChecker: IIntegrationHealthChecker
  ) {}

  async execute(): Promise<{
    success: boolean;
    message: string;
    data: HealthCheckSummary;
  }> {
    try {
      console.log('[CHECK-ALL-INTEGRATIONS-HEALTH] Starting health check for all integrations');

      // Get all integrations
      const integrations = await this.integrationRepository.findAll();
      console.log(`[CHECK-ALL-INTEGRATIONS-HEALTH] Found ${integrations.length} integrations to check`);

      const results: HealthCheckResult[] = [];
      let connected = 0;
      let errors = 0;
      let disconnected = 0;

      // Check each integration that this health checker supports
      for (const integration of integrations) {
        try {
          console.log(`[CHECK-ALL-INTEGRATIONS-HEALTH] Checking integration: ${integration.id}`);

          if (!this.healthChecker.canCheck(integration.id)) {
            console.log(`[CHECK-ALL-INTEGRATIONS-HEALTH] Skipping ${integration.id} - not supported by this health checker`);
            // Create a "skipped" result for unsupported integrations
            const result: HealthCheckResult = {
              integrationId: integration.id,
              status: 'disconnected',
              message: 'Health checker does not support this integration',
              lastTested: new Date(),
              dataSource: 'unknown'
            };
            results.push(result);
            disconnected++;
            continue;
          }

          // Perform individual health check
          const startTime = Date.now();
          const healthResult = await this.healthChecker.checkHealth(integration.id, integration.config);
          const responseTime = Date.now() - startTime;

          const result: HealthCheckResult = {
            integrationId: integration.id,
            status: healthResult.status,
            message: healthResult.message,
            lastTested: healthResult.lastTested,
            dataSource: healthResult.dataSource,
            responseTime
          };

          results.push(result);

          // Update counters
          switch (healthResult.status) {
            case 'connected':
              connected++;
              break;
            case 'error':
              errors++;
              break;
            case 'disconnected':
              disconnected++;
              break;
          }

          // Update integration status and config in repository
          await this.integrationRepository.updateStatus(integration.id, healthResult.status);
          
          const updatedConfig = {
            ...integration.config,
            lastTested: healthResult.lastTested.toISOString(),
            lastError: healthResult.status === 'error' ? healthResult.message : null,
            lastDataSource: healthResult.dataSource || 'unknown'
          };
          
          await this.integrationRepository.updateConfig(integration.id, updatedConfig);

          console.log(`[CHECK-ALL-INTEGRATIONS-HEALTH] Completed ${integration.id}: ${healthResult.status}`);

        } catch (error) {
          console.error(`[CHECK-ALL-INTEGRATIONS-HEALTH] Error checking ${integration.id}:`, error);
          
          // Create error result
          const result: HealthCheckResult = {
            integrationId: integration.id,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error during health check',
            lastTested: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          
          results.push(result);
          errors++;

          // Update status as error
          try {
            await this.integrationRepository.updateStatus(integration.id, 'error');
          } catch (updateError) {
            console.error(`[CHECK-ALL-INTEGRATIONS-HEALTH] Failed to update status for ${integration.id}:`, updateError);
          }
        }
      }

      const summary: HealthCheckSummary = {
        totalChecked: integrations.length,
        connected,
        errors,
        disconnected,
        checkedAt: new Date(),
        results
      };

      console.log('[CHECK-ALL-INTEGRATIONS-HEALTH] Health check summary:', {
        totalChecked: summary.totalChecked,
        connected: summary.connected,
        errors: summary.errors,
        disconnected: summary.disconnected
      });

      return {
        success: true,
        message: `Health check completed for ${integrations.length} integrations`,
        data: summary
      };
    } catch (error) {
      console.error('[CHECK-ALL-INTEGRATIONS-HEALTH] Error during health check:', error);
      throw new Error(`Failed to check health for integrations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}