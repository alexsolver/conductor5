// ===========================================================================================
// INTEGRATION ENTITY - SaaS Admin Domain Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Domain Layer → Entidades e regras de negócio puras (NUNCA importar Application/Infrastructure)

export interface IntegrationConfig {
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  maxRequests?: number;
  rateLimit?: number;
  timeout?: number;
  retryAttempts?: number;
  lastTested?: Date;
  additionalSettings?: Record<string, any>;
}

export class Integration {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly provider: string,
    public readonly description: string,
    public readonly config: IntegrationConfig,
    public readonly status: 'connected' | 'error' | 'disconnected',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Domain Business Rules
  public isActive(): boolean {
    return this.config.enabled && this.status === 'connected';
  }

  public hasApiKey(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 0;
  }

  public isOpenWeatherIntegration(): boolean {
    return this.provider.toLowerCase() === 'openweather';
  }

  public canMakeRequest(): boolean {
    return this.isActive() && this.hasApiKey();
  }

  // Factory method for OpenWeather integration
  public static createOpenWeatherIntegration(apiKey: string): Integration {
    return new Integration(
      'openweather',
      'OpenWeather API',
      'openweather',
      'Serviço de dados meteorológicos para o mapa interativo',
      {
        apiKey,
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        enabled: true,
        maxRequests: 1000,
        rateLimit: 60,
        timeout: 5000,
        retryAttempts: 3
      },
      apiKey ? 'connected' : 'disconnected'
    );
  }

  // Update configuration following immutability principle
  public updateConfig(newConfig: Partial<IntegrationConfig>): Integration {
    const updatedConfig: IntegrationConfig = {
      ...this.config,
      ...newConfig
    };

    const newStatus = this.determineStatus(updatedConfig);

    return new Integration(
      this.id,
      this.name,
      this.provider,
      this.description,
      updatedConfig,
      newStatus,
      this.createdAt,
      new Date()
    );
  }

  private determineStatus(config: IntegrationConfig): 'connected' | 'error' | 'disconnected' {
    if (!config.enabled) return 'disconnected';
    if (!config.apiKey) return 'disconnected';
    
    // For OpenWeather, basic validation
    if (this.isOpenWeatherIntegration()) {
      return config.apiKey.length >= 30 ? 'connected' : 'error';
    }
    
    return 'connected';
  }

  // Validate API key format for different providers
  public validateApiKey(): { valid: boolean; message?: string } {
    if (!this.config.apiKey) {
      return { valid: false, message: 'API key is required' };
    }

    if (this.isOpenWeatherIntegration()) {
      if (this.config.apiKey.length < 30) {
        return { valid: false, message: 'OpenWeather API key must be at least 30 characters' };
      }
    }

    return { valid: true };
  }
}