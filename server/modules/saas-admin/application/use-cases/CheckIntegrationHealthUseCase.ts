// ===========================================================================================
// CHECK INTEGRATION HEALTH USE CASE - SaaS Admin Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Application Layer → Use Cases e Controllers (NUNCA importar Infrastructure diretamente)

import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';
import { IIntegrationHealthChecker, HealthResult } from '../../domain/repositories/IIntegrationHealthChecker';
import { HealthCheckResult } from '../../domain/types/HealthTypes';

export class CheckIntegrationHealthUseCase {
  constructor(
    private integrationRepository: IIntegrationRepository,
    private healthChecker: IIntegrationHealthChecker
  ) {}

  async execute(integrationId: string): Promise<{
    success: boolean;
    message: string;
    data: HealthCheckResult;
  }> {
    try {
      console.log(`[CHECK-INTEGRATION-HEALTH] Starting health check for: ${integrationId}`);

      // Get integration config from repository
      const integration = await this.integrationRepository.findById(integrationId);
      
      if (!integration) {
        throw new Error(`Integration '${integrationId}' not found`);
      }

      if (!this.healthChecker.canCheck(integrationId)) {
        throw new Error(`Health checker does not support integration '${integrationId}'`);
      }

      // Perform health check
      const startTime = Date.now();
      const healthResult: HealthResult = await this.healthChecker.checkHealth(integrationId, integration.config);
      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        integrationId,
        status: healthResult.status,
        message: healthResult.message,
        lastTested: healthResult.lastTested,
        dataSource: healthResult.dataSource,
        responseTime
      };

      // Update integration status and last tested info in repository
      await this.integrationRepository.updateStatus(integrationId, healthResult.status);
      
      // Update config with health check info
      const updatedConfig = {
        ...integration.config,
        lastTested: healthResult.lastTested.toISOString(),
        lastError: healthResult.status === 'error' ? healthResult.message : null,
        lastDataSource: healthResult.dataSource || 'unknown'
      };
      
      await this.integrationRepository.updateConfig(integrationId, updatedConfig);

      console.log(`[CHECK-INTEGRATION-HEALTH] Health check completed for ${integrationId}:`, {
        status: result.status,
        responseTime: result.responseTime,
        dataSource: result.dataSource
      });

      return {
        success: true,
        message: `Health check completed for ${integrationId}`,
        data: result
      };
    } catch (error) {
      console.error(`[CHECK-INTEGRATION-HEALTH] Error checking ${integrationId}:`, error);
      throw new Error(`Failed to check health for integration '${integrationId}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}