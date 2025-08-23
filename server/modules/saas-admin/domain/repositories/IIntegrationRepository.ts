// ===========================================================================================
// INTEGRATION REPOSITORY INTERFACE - SaaS Admin Domain Layer  
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Domain Layer → Interface para inversão de dependência (NUNCA importar Infrastructure)

import { Integration } from '../entities/Integration';

export interface IIntegrationRepository {
  // Basic CRUD operations
  findAll(): Promise<Integration[]>;
  findById(integrationId: string): Promise<Integration | null>;
  findByProvider(provider: string): Promise<Integration | null>;
  save(integration: Integration): Promise<Integration>;
  update(integrationId: string, integration: Partial<Integration>): Promise<Integration | null>;
  delete(integrationId: string): Promise<boolean>;

  // OpenWeather specific operations
  getOpenWeatherConfig(): Promise<Integration | null>;
  updateOpenWeatherApiKey(apiKey: string): Promise<Integration>;
  
  // Status and health operations
  findByStatus(status: 'connected' | 'error' | 'disconnected'): Promise<Integration[]>;
  updateStatus(integrationId: string, status: 'connected' | 'error' | 'disconnected'): Promise<void>;
  testConnection(integrationId: string): Promise<{ success: boolean; message: string }>;
  
  // Configuration operations
  updateConfig(integrationId: string, config: any): Promise<Integration | null>;
  getEnabledIntegrations(): Promise<Integration[]>;
}