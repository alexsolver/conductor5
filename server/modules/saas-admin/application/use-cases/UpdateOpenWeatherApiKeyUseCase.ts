// ===========================================================================================
// UPDATE OPENWEATHER API KEY USE CASE - SaaS Admin Application Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Application Layer → Use Cases e Controllers (NUNCA importar Infrastructure diretamente)

import { Integration } from '../../domain/entities/Integration';
import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';

export interface UpdateOpenWeatherApiKeyRequest {
  apiKey: string;
  testConnection?: boolean;
}

export class UpdateOpenWeatherApiKeyUseCase {
  constructor(
    private integrationRepository: IIntegrationRepository
  ) {}

  async execute(request: UpdateOpenWeatherApiKeyRequest): Promise<{
    success: boolean;
    message: string;
    data: Integration;
  }> {
    try {
      // Validate API key format
      if (!request.apiKey || request.apiKey.trim().length === 0) {
        throw new Error('API key is required');
      }

      if (request.apiKey.length < 32) {
        throw new Error('OpenWeather API key must be at least 32 characters long');
      }

      // Create configuration object
      const config = {
        apiKey: request.apiKey,
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        enabled: true,
        maxRequests: 1000,
        rateLimit: 60,
        timeout: 5000,
        retryAttempts: 3,
        lastUpdated: new Date().toISOString()
      };

      // Update the integration configuration
      await this.integrationRepository.updateIntegrationConfig('openweather', config);

      // Update integration status to connected since we have a valid API key
      await this.integrationRepository.updateIntegrationStatus('openweather', 'connected');

      console.log('✅ [UPDATE-OPENWEATHER-USE-CASE] API key updated successfully');

      return {
        success: true,
        message: 'OpenWeather API key updated successfully',
        data: {
          id: 'openweather',
          status: 'connected',
          apiKeyConfigured: true,
          config: config,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[UPDATE-OPENWEATHER-USECASE] Error:', error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to update OpenWeather API key');
    }
  }
}