// ===========================================================================================
// GET INTEGRATIONS USE CASE - SaaS Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Application Layer → Use Cases e Controllers (NUNCA importar Infrastructure diretamente)

import { Integration } from '../../domain/entities/Integration';
import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';

export class GetIntegrationsUseCase {
  constructor(
    private integrationRepository: IIntegrationRepository
  ) {}

  async execute(): Promise<{
    success: boolean;
    message: string;
    integrations: Integration[];
  }> {
    try {
      const integrations = await this.integrationRepository.findAll();

      return {
        success: true,
        message: 'Integrations retrieved successfully',
        integrations
      };
    } catch (error) {
      console.error('[GET-INTEGRATIONS-USECASE] Error:', error);
      throw new Error('Failed to get integrations');
    }
  }

  async executeByStatus(status: 'connected' | 'error' | 'disconnected'): Promise<{
    success: boolean;
    message: string;
    data: Integration[];
  }> {
    try {
      const integrations = await this.integrationRepository.findByStatus(status);

      return {
        success: true,
        message: `Integrations with status '${status}' retrieved successfully`,
        data: integrations
      };
    } catch (error) {
      console.error('[GET-INTEGRATIONS-BY-STATUS-USECASE] Error:', error);
      throw new Error(`Failed to retrieve integrations with status '${status}'`);
    }
  }

  async executeGetOpenWeather(): Promise<{
    success: boolean;
    message: string;
    data: Integration | null;
  }> {
    try {
      console.log('[GET-INTEGRATIONS-USE-CASE] Getting OpenWeather integration');

      const integration = await this.integrationRepository.findById('openweather');

      if (!integration) {
        console.log('[GET-INTEGRATIONS-USE-CASE] OpenWeather integration not found, creating default');

        // Return default OpenWeather integration structure
        return {
          success: true,
          data: {
            id: 'openweather',
            name: 'OpenWeather',
            provider: 'OpenWeather',
            description: 'Weather data integration',
            status: 'disconnected',
            apiKeyConfigured: false,
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
      }

      console.log('[GET-INTEGRATIONS-USE-CASE] Found OpenWeather integration:', {
        id: integration.id,
        status: integration.status,
        hasConfig: !!integration.config,
        configKeys: integration.config ? Object.keys(integration.config) : [],
        configData: integration.config
      });

      // Check if API key is configured
      const hasApiKey = integration.config?.apiKey && integration.config.apiKey.length >= 30;

      const result = {
        success: true,
        message: 'OpenWeather integration retrieved successfully',
        data: {
          id: integration.id,
          name: integration.name,
          provider: integration.provider,
          description: integration.description || 'Weather data integration',
          status: hasApiKey ? 'connected' : 'disconnected',
          apiKeyConfigured: hasApiKey,
          config: integration.config || {},
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        }
      };

      console.log('[GET-INTEGRATIONS-USE-CASE] Returning OpenWeather result:', {
        hasApiKey,
        status: result.data.status,
        configKeys: Object.keys(result.data.config),
        apiKeyPreview: result.data.config?.apiKey ? result.data.config.apiKey.substring(0, 8) + '...' : 'none'
      });

      return result;
    } catch (error) {
      console.error('[GET-INTEGRATIONS-USE-CASE] Error getting OpenWeather integration:', error);
      throw new Error('Failed to get OpenWeather integration');
    }
  }

  async executeGetSendGrid(): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      console.log('[GET-INTEGRATIONS-USE-CASE] Getting SendGrid integration');

      const integrations = await this.integrationRepository.findAll();
      const sendGridIntegration = integrations.find(integration => integration.id === 'sendgrid');

      if (!sendGridIntegration) {
        return {
          success: false,
          message: 'SendGrid integration not found'
        };
      }

      console.log('[GET-INTEGRATIONS-USE-CASE] SendGrid integration found');

      return {
        success: true,
        message: 'SendGrid integration retrieved successfully',
        data: sendGridIntegration
      };
    } catch (error) {
      console.error('[GET-INTEGRATIONS-USE-CASE] Error getting SendGrid integration:', error);
      return {
        success: false,
        message: 'Failed to get SendGrid integration'
      };
    }
  }
}