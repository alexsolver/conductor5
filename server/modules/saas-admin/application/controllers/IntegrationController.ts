// ===========================================================================================
// INTEGRATION CONTROLLER - SaaS Admin Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Controllers Pattern - line 60-75 do 1qa.md

import { Request, Response } from 'express';
import { GetIntegrationsUseCase } from '../use-cases/GetIntegrationsUseCase';
import { UpdateOpenWeatherApiKeyUseCase, UpdateOpenWeatherApiKeyRequest } from '../use-cases/UpdateOpenWeatherApiKeyUseCase';
import { UpdateSendGridApiKeyUseCase, UpdateSendGridApiKeyRequest } from '../use-cases/UpdateSendGridApiKeyUseCase';

// ✅ SEMPRE seguir este padrão (1qa.md line 60)
export class IntegrationController {
  constructor(
    private getIntegrationsUseCase: GetIntegrationsUseCase,
    private updateOpenWeatherApiKeyUseCase: UpdateOpenWeatherApiKeyUseCase,
    private updateSendGridApiKeyUseCase?: UpdateSendGridApiKeyUseCase,
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

  // GET /api/saas-admin/integrations/sendgrid
  async getSendGridIntegration(req: Request, res: Response) {
    try {
      // Use Case execution only (1qa.md line 68)
      const result = await this.getIntegrationsUseCase.executeGetSendGrid();
      res.json(result);
    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error getting SendGrid integration:', error);
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

  // PUT /api/saas-admin/integrations/sendgrid/api-key
  async updateSendGridApiKey(req: Request, res: Response) {
    try {
      const { apiKey, fromEmail, testConnection = false } = req.body;

      // Basic validation
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'API key is required and must be a string'
        });
      }

      const request: UpdateSendGridApiKeyRequest = {
        apiKey: apiKey.trim(),
        fromEmail: fromEmail?.trim(),
        testConnection: Boolean(testConnection)
      };

      // Use Case execution only (1qa.md line 68)
      const result = await this.updateSendGridApiKeyUseCase.execute(request);
      
      // Log successful operation for audit
      this.logger.info('[INTEGRATION-CONTROLLER] SendGrid API key updated successfully');
      
      res.json(result);
    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error updating SendGrid API key:', error);
      
      // Handle validation errors vs system errors
      if (error instanceof Error && (error.message.includes('required') || error.message.includes('characters') || error.message.includes('format'))) {
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

  // POST /api/saas-admin/integrations/openweather/test
  async testOpenWeatherConnection(req: Request, res: Response) {
    try {
      this.logger.info('[INTEGRATION-CONTROLLER] Testing OpenWeather connection');
      
      // Get the OpenWeather configuration
      const openWeatherConfig = await this.getIntegrationsUseCase.executeGetOpenWeather();
      
      if (!openWeatherConfig.data?.config?.apiKey) {
        return res.status(400).json({
          success: false,
          message: 'OpenWeather API key not configured'
        });
      }

      // Test the API with a simple request
      const testUrl = `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${openWeatherConfig.data.config.apiKey}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          res.json({
            success: true,
            message: 'OpenWeather API connection successful',
            responseTime: Date.now() - Date.now()
          });
        } else {
          res.json({
            success: false,
            message: `OpenWeather API returned status ${response.status}`,
            error: response.statusText
          });
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        res.json({
          success: false,
          message: 'Failed to connect to OpenWeather API',
          error: fetchError.message
        });
      }

    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error testing OpenWeather connection:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/saas-admin/integrations/sendgrid/test
  async testSendGridConnection(req: Request, res: Response) {
    try {
      this.logger.info('[INTEGRATION-CONTROLLER] Testing SendGrid connection');
      
      // Get the SendGrid configuration
      const sendGridConfig = await this.getIntegrationsUseCase.executeGetSendGrid();
      
      if (!sendGridConfig.data?.config?.apiKey) {
        return res.status(400).json({
          success: false,
          message: 'SendGrid API key not configured'
        });
      }

      // Test the API with a simple request to validate API key
      const testUrl = 'https://api.sendgrid.com/v3/user/account';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const startTime = Date.now();
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sendGridConfig.data.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          res.json({
            success: true,
            message: 'SendGrid API connection successful',
            responseTime: responseTime,
            result: {
              status: 'connected',
              account: data.type || 'verified'
            }
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          res.json({
            success: false,
            message: `SendGrid API returned status ${response.status}`,
            error: errorData.message || response.statusText
          });
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        res.json({
          success: false,
          message: 'Failed to connect to SendGrid API',
          error: fetchError.message
        });
      }

    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error testing SendGrid connection:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/saas-admin/integrations/openai/test
  async testOpenAIConnection(req: Request, res: Response) {
    try {
      this.logger.info('[INTEGRATION-CONTROLLER] Testing OpenAI connection');
      
      // Get the OpenAI configuration
      const openAIConfig = await this.getIntegrationsUseCase.executeGetOpenAI();
      
      if (!openAIConfig.data?.config?.apiKey) {
        return res.status(400).json({
          success: false,
          message: 'OpenAI API key not configured'
        });
      }

      // Test the API with a simple request
      const testUrl = 'https://api.openai.com/v1/models';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const startTime = Date.now();
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openAIConfig.data.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          res.json({
            success: true,
            message: 'OpenAI API connection successful',
            responseTime: responseTime,
            result: {
              status: 'connected',
              modelsCount: data.data?.length || 0
            }
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          res.json({
            success: false,
            message: `OpenAI API returned status ${response.status}`,
            error: errorData.error?.message || response.statusText
          });
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        res.json({
          success: false,
          message: 'Failed to connect to OpenAI API',
          error: fetchError.message
        });
      }

    } catch (error) {
      this.logger.error('[INTEGRATION-CONTROLLER] Error testing OpenAI connection:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}