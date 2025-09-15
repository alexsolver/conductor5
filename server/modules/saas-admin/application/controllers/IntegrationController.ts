// ===========================================================================================
// INTEGRATION CONTROLLER - SaaS Admin Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Controllers Pattern - line 60-75 do 1qa.md

import { Request, Response } from 'express';
import { GetIntegrationsUseCase } from '../use-cases/GetIntegrationsUseCase';
import { UpdateOpenWeatherApiKeyUseCase, UpdateOpenWeatherApiKeyRequest } from '../use-cases/UpdateOpenWeatherApiKeyUseCase';
import { CheckIntegrationHealthUseCase } from '../use-cases/CheckIntegrationHealthUseCase';

// ✅ SEMPRE seguir este padrão (1qa.md line 60)
export class IntegrationController {
  constructor(
    private getIntegrationsUseCase: GetIntegrationsUseCase,
    private updateOpenWeatherApiKeyUseCase: UpdateOpenWeatherApiKeyUseCase,
    private checkIntegrationHealthUseCase?: CheckIntegrationHealthUseCase,
    private logger: any = console // Logger injection for compliance
  ) {}

  // GET /api/saas-admin/integrations
  async getAllIntegrations(req: Request, res: Response) {
    try {
      // Use Case execution only (1qa.md line 68)
      const result = await this.getIntegrationsUseCase.execute();
      res.json(result);
    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error getting integrations:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/saas-admin/integrations/openweather
  async getOpenWeatherIntegration(req: Request, res: Response) {
    try {
      // Use Case execution only (1qa.md line 68)
      const result = await this.getIntegrationsUseCase.executeGetOpenWeather();
      res.json(result);
    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error getting OpenWeather integration:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/saas-admin/integrations/status/:status
  async getIntegrationsByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      
      // Validate status parameter
      if (!['connected', 'error', 'disconnected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: connected, error, or disconnected'
        });
      }

      // Use Case execution only (1qa.md line 68)
      const result = await this.getIntegrationsUseCase.executeByStatus(
        status as 'connected' | 'error' | 'disconnected'
      );
      res.json(result);
    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error getting integrations by status:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/saas-admin/integrations/openweather/api-key
  async updateOpenWeatherApiKey(req: Request, res: Response) {
    try {
      const { apiKey, testConnection = false } = req.body;

      // Basic validation
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'API key is required and must be a string'
        });
      }

      const request: UpdateOpenWeatherApiKeyRequest = {
        apiKey: apiKey.trim(),
        testConnection: Boolean(testConnection)
      };

      // Use Case execution only (1qa.md line 68)
      const result = await this.updateOpenWeatherApiKeyUseCase.execute(request);
      
      // Log successful operation for audit
      this.logger.info('[INTEGRATION-CONTROLLER] OpenWeather API key updated successfully');
      
      res.json(result);
    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error updating OpenWeather API key:', error);
      
      // Handle validation errors vs system errors
      if (error instanceof Error && error.message.includes('required') || error instanceof Error && error.message.includes('characters')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/saas-admin/integrations/:integrationId/health-check
  async checkIntegrationHealth(req: Request, res: Response) {
    try {
      const { integrationId } = req.params;

      if (!integrationId) {
        return res.status(400).json({
          success: false,
          message: 'Integration ID is required'
        });
      }

      if (!this.checkIntegrationHealthUseCase) {
        return res.status(500).json({
          success: false,
          message: 'Health check service not available'
        });
      }

      this.logger.info(`[INTEGRATION-CONTROLLER] Starting health check for integration: ${integrationId}`);

      // Use Case execution only (1qa.md line 68)
      const result = await this.checkIntegrationHealthUseCase.execute(integrationId);
      
      this.logger.info(`[INTEGRATION-CONTROLLER] Health check completed for ${integrationId}:`, {
        status: result.data.status,
        responseTime: result.data.responseTime
      });
      
      res.json(result);
    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error checking integration health:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/saas-admin/integrations/:integrationId/test
  async testIntegrationConnection(req: Request, res: Response) {
    try {
      const { integrationId } = req.params;

      if (!integrationId) {
        return res.status(400).json({
          success: false,
          message: 'Integration ID is required'
        });
      }

      // For now, we'll use the repository directly since there's no specific use case
      // This could be moved to a dedicated use case if needed
      
      res.json({
        success: true,
        message: 'Test connection endpoint - implementation pending',
        data: { integrationId }
      });
    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error testing integration connection:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}