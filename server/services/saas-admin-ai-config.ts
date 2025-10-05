// ========================================
// SAAS ADMIN AI CONFIGURATION SERVICE
// ========================================
// Manages AI provider API keys for SaaS Admin (global)

export interface SaaSAdminAIConfig {
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
  baseURL?: string;
}

export class SaaSAdminAIConfigService {
  private async getPool() {
    const { schemaManager } = await import('../db');
    return schemaManager.getPool();
  }

  /**
   * Get AI configuration from SaaS Admin (public.system_integrations)
   */
  async getSaaSAdminAIConfig(): Promise<SaaSAdminAIConfig> {
    try {
      const pool = await this.getPool();

      // Get all AI integrations from public schema
      const result = await pool.query(`
        SELECT integration_id, config
        FROM "public"."system_integrations"
        WHERE integration_id IN ('openai', 'deepseek', 'googleai')
      `);

      const config: SaaSAdminAIConfig = {};

      result.rows.forEach(row => {
        const integrationConfig = row.config || {};
        
        switch (row.integration_id) {
          case 'openai':
            config.openaiApiKey = integrationConfig.apiKey || integrationConfig.openaiApiKey;
            config.openaiModel = integrationConfig.openaiModel || integrationConfig.model || 'gpt-4o-mini';
            break;
          case 'deepseek':
            config.deepseekApiKey = integrationConfig.apiKey || integrationConfig.deepseekApiKey;
            config.deepseekModel = integrationConfig.deepseekModel || integrationConfig.model || 'deepseek-chat';
            break;
          case 'googleai':
            config.googleaiApiKey = integrationConfig.apiKey || integrationConfig.googleaiApiKey;
            config.googleaiModel = integrationConfig.googleaiModel || integrationConfig.model || 'gemini-2.0-flash-exp';
            break;
        }
      });

      return config;
    } catch (error) {
      console.error('Error fetching SaaS Admin AI config:', error);
      return {};
    }
  }

  /**
   * Get preferred AI provider for SaaS Admin
   * Priority: OpenAI > DeepSeek > Google AI > Fallback to env
   */
  async getPreferredAIProvider(): Promise<AIProviderConfig | null> {
    const config = await this.getSaaSAdminAIConfig();

    // Priority: OpenAI
    if (config.openaiApiKey) {
      return {
        apiKey: config.openaiApiKey,
        model: config.openaiModel || 'gpt-4o-mini',
        provider: 'openai'
        // No baseURL needed for OpenAI (uses default)
      };
    }

    // Fallback: DeepSeek
    if (config.deepseekApiKey) {
      return {
        apiKey: config.deepseekApiKey,
        model: config.deepseekModel || 'deepseek-chat',
        provider: 'deepseek',
        baseURL: 'https://api.deepseek.com'
      };
    }

    // Fallback: Google AI
    if (config.googleaiApiKey) {
      return {
        apiKey: config.googleaiApiKey,
        model: config.googleaiModel || 'gemini-2.0-flash-exp',
        provider: 'googleai',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai'
      };
    }

    // Use environment variable as final fallback
    if (process.env.OPENAI_API_KEY) {
      return {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
        provider: 'openai'
        // No baseURL needed for OpenAI (uses default)
      };
    }

    return null;
  }

  /**
   * Get specific provider config if configured
   */
  async getProviderConfig(provider: 'openai' | 'deepseek' | 'googleai'): Promise<{ apiKey: string; model: string } | null> {
    const config = await this.getSaaSAdminAIConfig();

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
let saasAdminAIConfigService: SaaSAdminAIConfigService | null = null;

export function getSaaSAdminAIConfigService(): SaaSAdminAIConfigService {
  if (!saasAdminAIConfigService) {
    saasAdminAIConfigService = new SaaSAdminAIConfigService();
  }
  return saasAdminAIConfigService;
}
