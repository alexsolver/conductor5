// ========================================
// TENANT AI CONFIGURATION SERVICE
// ========================================
// Manages AI provider API keys per tenant

import type { StorageSimple } from '../storage-simple';

export interface TenantAIConfig {
  openaiApiKey?: string;
  openaiModel?: string;
  deepseekApiKey?: string;
  deepseekModel?: string;
  googleaiApiKey?: string;
  googleaiModel?: string;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  provider: 'openai' | 'deepseek' | 'googleai';
}

export class TenantAIConfigService {
  private storage: StorageSimple;

  constructor(storage: StorageSimple) {
    this.storage = storage;
  }

  /**
   * Get AI configuration for a tenant
   */
  async getTenantAIConfig(tenantId: string): Promise<TenantAIConfig> {
    try {
      // Get all integrations for the tenant
      const integrations = await this.storage.getTenantIntegrations(tenantId);

      const config: TenantAIConfig = {};

      // Extract OpenAI config
      const openaiIntegration = integrations.find(i => i.id === 'openai');
      if (openaiIntegration?.config) {
        config.openaiApiKey = openaiIntegration.config.openaiApiKey;
        config.openaiModel = openaiIntegration.config.openaiModel || 'gpt-4o-mini';
      }

      // Extract DeepSeek config
      const deepseekIntegration = integrations.find(i => i.id === 'deepseek');
      if (deepseekIntegration?.config) {
        config.deepseekApiKey = deepseekIntegration.config.deepseekApiKey;
        config.deepseekModel = deepseekIntegration.config.deepseekModel || 'deepseek-chat';
      }

      // Extract Google AI config
      const googleaiIntegration = integrations.find(i => i.id === 'googleai');
      if (googleaiIntegration?.config) {
        config.googleaiApiKey = googleaiIntegration.config.googleaiApiKey;
        config.googleaiModel = googleaiIntegration.config.googleaiModel || 'gemini-2.0-flash-exp';
      }

      return config;
    } catch (error) {
      console.error('Error fetching tenant AI config:', error);
      return {};
    }
  }

  /**
   * Get preferred AI provider for a tenant
   * Priority: OpenAI > DeepSeek > Google AI > Fallback to env
   */
  async getPreferredAIProvider(tenantId: string): Promise<AIProviderConfig | null> {
    const config = await this.getTenantAIConfig(tenantId);

    // Priority: OpenAI
    if (config.openaiApiKey) {
      return {
        apiKey: config.openaiApiKey,
        model: config.openaiModel || 'gpt-4o-mini',
        provider: 'openai'
      };
    }

    // Fallback: DeepSeek
    if (config.deepseekApiKey) {
      return {
        apiKey: config.deepseekApiKey,
        model: config.deepseekModel || 'deepseek-chat',
        provider: 'deepseek'
      };
    }

    // Fallback: Google AI
    if (config.googleaiApiKey) {
      return {
        apiKey: config.googleaiApiKey,
        model: config.googleaiModel || 'gemini-2.0-flash-exp',
        provider: 'googleai'
      };
    }

    // Use environment variable as final fallback
    if (process.env.OPENAI_API_KEY) {
      return {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
        provider: 'openai'
      };
    }

    return null;
  }

  /**
   * Get specific provider config if configured
   */
  async getProviderConfig(tenantId: string, provider: 'openai' | 'deepseek' | 'googleai'): Promise<{ apiKey: string; model: string } | null> {
    const config = await this.getTenantAIConfig(tenantId);

    switch (provider) {
      case 'openai':
        if (config.openaiApiKey) {
          return {
            apiKey: config.openaiApiKey,
            model: config.openaiModel || 'gpt-4o-mini'
          };
        }
        break;
      case 'deepseek':
        if (config.deepseekApiKey) {
          return {
            apiKey: config.deepseekApiKey,
            model: config.deepseekModel || 'deepseek-chat'
          };
        }
        break;
      case 'googleai':
        if (config.googleaiApiKey) {
          return {
            apiKey: config.googleaiApiKey,
            model: config.googleaiModel || 'gemini-2.0-flash-exp'
          };
        }
        break;
    }

    // Fallback to environment if specific provider not configured
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      return {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini'
      };
    }

    return null;
  }
}

// Export singleton instance
let tenantAIConfigService: TenantAIConfigService | null = null;

export function getTenantAIConfigService(storage: StorageSimple): TenantAIConfigService {
  if (!tenantAIConfigService) {
    tenantAIConfigService = new TenantAIConfigService(storage);
  }
  return tenantAIConfigService;
}
