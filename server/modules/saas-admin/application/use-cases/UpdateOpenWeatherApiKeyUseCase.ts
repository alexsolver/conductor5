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

      // Update the OpenWeather API key
      const updatedIntegration = await this.integrationRepository.updateOpenWeatherApiKey(request.apiKey.trim());

      // Test connection if requested
      if (request.testConnection) {
        const testResult = await this.integrationRepository.testConnection(updatedIntegration.id);
        
        if (!testResult.success) {
          console.warn('[UPDATE-OPENWEATHER-USECASE] Connection test failed:', testResult.message);
          // Still return success since the API key was saved, but include warning
          return {
            success: true,
            message: `API key updated successfully, but connection test failed: ${testResult.message}`,
            data: updatedIntegration
          };
        }
      }

      return {
        success: true,
        message: 'OpenWeather API key updated successfully',
        data: updatedIntegration
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