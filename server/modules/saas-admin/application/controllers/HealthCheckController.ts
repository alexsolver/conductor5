// ===========================================================================================
// HEALTH CHECK CONTROLLER - SaaS Admin Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Application Layer → Controllers (NUNCA importar Infrastructure diretamente)

import { Request, Response } from 'express';
import { CheckIntegrationHealthUseCase } from '../use-cases/CheckIntegrationHealthUseCase';
import { CheckAllIntegrationsHealthUseCase } from '../use-cases/CheckAllIntegrationsHealthUseCase';

export class HealthCheckController {
  constructor(
    private checkIntegrationHealthUseCase: CheckIntegrationHealthUseCase,
    private checkAllIntegrationsHealthUseCase: CheckAllIntegrationsHealthUseCase,
    private logger: any = console // Logger injection for compliance
  ) {}

  // POST /api/saas-admin/integrations/:id/health-check
  async checkSingleIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Integration ID is required'
        });
      }

      console.log(`[HEALTH-CHECK-CONTROLLER] Starting health check for integration: ${id}`);

      // Use Case execution only (1qa.md line 68)
      const result = await this.checkIntegrationHealthUseCase.execute(id);
      
      console.log(`[HEALTH-CHECK-CONTROLLER] Health check completed for ${id}: ${result.data.status}`);
      
      res.json(result);
    } catch (error) {
      this.logger.error(`[HEALTH-CHECK-CONTROLLER] Error checking integration ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to check integration health',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/saas-admin/integrations/health-check-all
  async checkAllIntegrations(req: Request, res: Response) {
    try {
      console.log('[HEALTH-CHECK-CONTROLLER] Starting health check for all integrations');

      // Use Case execution only (1qa.md line 68)
      const result = await this.checkAllIntegrationsHealthUseCase.execute();
      
      console.log(`[HEALTH-CHECK-CONTROLLER] Health check completed for all integrations: ${result.data.totalChecked} checked`);
      
      res.json(result);
    } catch (error) {
      this.logger.error('[HEALTH-CHECK-CONTROLLER] Error checking all integrations:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to check all integrations health',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}