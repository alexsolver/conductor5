// ===========================================================================================
// GET INTEGRATIONS USE CASE - SaaS Admin Application Layer
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
    data: Integration[];
  }> {
    try {
      const integrations = await this.integrationRepository.findAll();
      
      return {
        success: true,
        message: 'Integrations retrieved successfully',
        data: integrations
      };
    } catch (error) {
      console.error('[GET-INTEGRATIONS-USECASE] Error:', error);
      throw new Error('Failed to retrieve integrations');
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
      const openWeatherIntegration = await this.integrationRepository.getOpenWeatherConfig();
      
      return {
        success: true,
        message: 'OpenWeather integration retrieved successfully',
        data: openWeatherIntegration
      };
    } catch (error) {
      console.error('[GET-OPENWEATHER-USECASE] Error:', error);
      throw new Error('Failed to retrieve OpenWeather integration');
    }
  }
}