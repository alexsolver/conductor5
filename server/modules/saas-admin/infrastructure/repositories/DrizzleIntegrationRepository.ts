// ===========================================================================================
// DRIZZLE INTEGRATION REPOSITORY - SaaS Admin Infrastructure Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Infrastructure Layer → Implementação técnica específica usando SQL direto para schema público

import { Integration, IntegrationConfig } from '../../domain/entities/Integration';
import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';

export class DrizzleIntegrationRepository implements IIntegrationRepository {

  // ✅ SEMPRE usar o padrão estabelecido (1qa.md line 52) - Seguindo padrão SQL direto para SaaS Admin
  private async getPool() {
    const { schemaManager } = await import('../../../../db');
    return schemaManager.getPool();
  }

  async findAll(): Promise<Integration[]> {
    try {
      console.log('[INTEGRATION-REPO] Fetching all integrations from PUBLIC schema (system_integrations)');

      // Definir integrações base disponíveis
      const baseIntegrations = [
        {
          id: 'openai',
          name: 'OpenAI',
          provider: 'OpenAI',
          description: 'AI language model integration',
          status: 'disconnected',
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'openweather',
          name: 'OpenWeather',
          provider: 'OpenWeather',
          description: 'Weather data integration',
          status: 'disconnected',
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          provider: 'DeepSeek',
          description: 'AI model integration',
          status: 'disconnected',
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const pool = await this.getPool();

      // Buscar configurações salvas
      const savedConfigs = await pool.query(`
        SELECT integration_id, config, status, updated_at 
        FROM "public"."system_integrations"
        ORDER BY integration_id
      `);

      // Mapear configurações para integrações base
      const integrations = baseIntegrations.map(baseIntegration => {
        const savedConfig = savedConfigs.rows.find(row => row.integration_id === baseIntegration.id);

        console.log(`[INTEGRATION-REPO] Processing ${baseIntegration.id}:`, {
          hasSavedConfig: !!savedConfig,
          savedConfigData: savedConfig?.config,
          hasApiKey: savedConfig?.config?.apiKey && savedConfig.config.apiKey.length > 0
        });

        if (savedConfig) {
          const hasApiKey = savedConfig.config?.apiKey && savedConfig.config.apiKey.length > 0;
          
          // ✅ Use saved status from DB, or fallback to computed status only if no saved status exists
          const finalStatus = savedConfig.status || (hasApiKey ? 'connected' : 'disconnected');
          
          const integration = {
            ...baseIntegration,
            status: finalStatus,
            config: savedConfig.config || {},
            updatedAt: new Date(savedConfig.updated_at),
            // ✅ Adicionar propriedades que o frontend espera
            apiKeyConfigured: hasApiKey,
            hasApiKey: () => hasApiKey,
            isActive: () => finalStatus === 'connected' && hasApiKey,
            isOpenWeatherIntegration: () => baseIntegration.id === 'openweather',
            canMakeRequest: () => finalStatus === 'connected' && hasApiKey,
            getLastTestedAt: () => savedConfig.config?.lastTested ? new Date(savedConfig.config.lastTested) : null,
            getApiKeyMasked: () => savedConfig.config?.apiKey ? `${savedConfig.config.apiKey.substring(0, 8)}...` : null,
            getLastError: () => savedConfig.config?.lastError || null,
            getDataSource: () => savedConfig.config?.lastDataSource || 'unknown'
          };

          console.log(`[INTEGRATION-REPO] ${baseIntegration.id} final result:`, {
            id: integration.id,
            status: integration.status,
            apiKeyConfigured: integration.apiKeyConfigured,
            hasConfigKeys: Object.keys(integration.config || {})
          });

          return integration;
        }

        const integration = {
          ...baseIntegration,
          // ✅ Propriedades padrão para integrações não configuradas
          apiKeyConfigured: false,
          hasApiKey: () => false,
          isActive: () => false,
          isOpenWeatherIntegration: () => baseIntegration.id === 'openweather',
          canMakeRequest: () => false,
          getLastTestedAt: () => null,
          getApiKeyMasked: () => null
        };

        console.log(`[INTEGRATION-REPO] ${baseIntegration.id} default result:`, {
          id: integration.id,
          status: integration.status,
          apiKeyConfigured: integration.apiKeyConfigured
        });

        return integration;
      });

      console.log('[INTEGRATION-REPO] Found integrations in PUBLIC schema:', integrations.length);
      return integrations;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error finding all integrations:', error);
      throw new Error('Failed to fetch integrations');
    }
  }

  async findById(integrationId: string): Promise<Integration | null> {
    try {
      const pool = await this.getPool();
      const result = await pool.query(`
        SELECT integration_id, name, provider, config, status, created_at, updated_at 
        FROM "public"."system_integrations" 
        WHERE integration_id = $1
      `, [integrationId]);

      if (result.rows[0]) {
        return {
          id: result.rows[0].integration_id,
          name: result.rows[0].name,
          provider: result.rows[0].provider,
          description: `${result.rows[0].provider} integration`,
          status: result.rows[0].status || 'disconnected',
          config: result.rows[0].config || {},
          createdAt: new Date(result.rows[0].created_at),
          updatedAt: new Date(result.rows[0].updated_at)
        };
      }

      return null;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error finding integration by ID:', error);
      throw new Error('Failed to fetch integration');
    }
  }

  async findByProvider(provider: string): Promise<Integration | null> {
    try {
      const pool = await this.getPool();
      const result = await pool.query(`
        SELECT integration_id, name, provider, config, status, created_at, updated_at 
        FROM "public"."system_integrations" 
        WHERE provider = $1
      `, [provider]);

      if (result.rows[0]) {
        return {
          id: result.rows[0].integration_id,
          name: result.rows[0].name,
          provider: result.rows[0].provider,
          description: `${result.rows[0].provider} integration`,
          status: result.rows[0].status || 'disconnected',
          config: result.rows[0].config || {},
          createdAt: new Date(result.rows[0].created_at),
          updatedAt: new Date(result.rows[0].updated_at)
        };
      }

      return null;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error finding integration by provider:', error);
      throw new Error('Failed to fetch integration');
    }
  }

  async create(integration: Integration): Promise<Integration> {
    try {
      console.log('[INTEGRATION-REPO] Creating integration:', {
        id: integration.id,
        provider: integration.provider,
        hasConfig: !!integration.config,
        configKeys: integration.config ? Object.keys(integration.config) : []
      });

      const pool = await this.getPool();

      // Create table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "public"."system_integrations" (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          integration_id VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          provider VARCHAR(255) NOT NULL,
          config JSONB,
          status VARCHAR(50) DEFAULT 'disconnected',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const result = await pool.query(`
        INSERT INTO "public"."system_integrations" 
        (integration_id, name, provider, config, status, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (integration_id) 
        DO UPDATE SET 
          config = $4,
          status = $5,
          updated_at = NOW()
        RETURNING *
      `, [
        integration.id,
        integration.name,
        integration.provider,
        JSON.stringify(integration.config),
        integration.status || 'disconnected'
      ]);

      return {
        id: result.rows[0].integration_id,
        name: result.rows[0].name,
        provider: result.rows[0].provider,
        description: integration.description,
        status: result.rows[0].status,
        config: result.rows[0].config || {},
        createdAt: new Date(result.rows[0].created_at),
        updatedAt: new Date(result.rows[0].updated_at)
      };
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error creating integration:', error);
      throw new Error('Failed to create integration');
    }
  }

  async update(integrationId: string, updates: Partial<Integration>): Promise<Integration | null> {
    try {
      const pool = await this.getPool();
      const result = await pool.query(`
        UPDATE "public"."system_integrations" 
        SET 
          name = COALESCE($2, name),
          provider = COALESCE($3, provider),
          config = COALESCE($4, config),
          status = COALESCE($5, status),
          updated_at = NOW()
        WHERE integration_id = $1
        RETURNING *
      `, [
        integrationId,
        updates.name,
        updates.provider,
        updates.config ? JSON.stringify(updates.config) : null,
        updates.status
      ]);

      if (result.rows[0]) {
        return {
          id: result.rows[0].integration_id,
          name: result.rows[0].name,
          provider: result.rows[0].provider,
          description: updates.description || 'Integration',
          status: result.rows[0].status,
          config: result.rows[0].config || {},
          createdAt: new Date(result.rows[0].created_at),
          updatedAt: new Date(result.rows[0].updated_at)
        };
      }

      return null;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error updating integration:', error);
      throw new Error('Failed to update integration');
    }
  }

  async delete(integrationId: string): Promise<boolean> {
    try {
      const pool = await this.getPool();
      const result = await pool.query(`
        DELETE FROM "public"."system_integrations" 
        WHERE integration_id = $1
      `, [integrationId]);

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error deleting integration:', error);
      throw new Error('Failed to delete integration');
    }
  }

  async getIntegrationConfig(integrationId: string): Promise<IntegrationConfig | null> {
    try {
      console.log(`[INTEGRATION-REPO] Getting configuration for integration: ${integrationId}`);
      const pool = await this.getPool();
      const result = await pool.query(`
        SELECT config FROM "public"."system_integrations" 
        WHERE integration_id = $1
      `, [integrationId]);

      if (result.rows[0]?.config) {
        console.log(`[INTEGRATION-REPO] Found configuration for ${integrationId}:`, {
          hasConfig: true,
          configKeys: Object.keys(result.rows[0].config)
        });
        return result.rows[0].config as IntegrationConfig;
      }

      console.log(`[INTEGRATION-REPO] No configuration found for ${integrationId}`);
      return null;
    } catch (error) {
      console.error(`[INTEGRATION-REPO] Error getting integration config for ${integrationId}:`, error);
      throw new Error('Failed to get integration configuration');
    }
  }

  async updateIntegrationStatus(provider: string, status: 'connected' | 'error' | 'disconnected'): Promise<void> {
    try {
      console.log(`[INTEGRATION-REPO] Updating ${provider} status to: ${status}`);
      const pool = await this.getPool();

      await pool.query(`
        UPDATE "public"."system_integrations" 
        SET status = $2, updated_at = NOW()
        WHERE integration_id = $1
      `, [provider, status]);

      console.log(`[INTEGRATION-REPO] Status updated successfully for ${provider}`);
    } catch (error) {
      console.error(`[INTEGRATION-REPO] Error updating integration status:`, error);
      throw error;
    }
  }

  async updateIntegrationConfig(integrationId: string, config: IntegrationConfig): Promise<void> {
    try {
      console.log(`[INTEGRATION-REPO] Updating configuration for integration: ${integrationId}`);
      const pool = await this.getPool();

      // Create table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "public"."system_integrations" (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          integration_id VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          provider VARCHAR(255) NOT NULL,
          config JSONB,
          status VARCHAR(50) DEFAULT 'disconnected',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const result = await pool.query(`
        INSERT INTO "public"."system_integrations" 
        (integration_id, name, provider, config, status, updated_at)
        VALUES ($1, $2, $3, $4, 'disconnected', NOW())
        ON CONFLICT (integration_id) 
        DO UPDATE SET 
          config = $4,
          updated_at = NOW()
        RETURNING *
      `, [
        integrationId,
        integrationId === 'openai' ? 'OpenAI' : integrationId === 'openweather' ? 'OpenWeather' : 'DeepSeek',
        integrationId === 'openai' ? 'OpenAI' : integrationId === 'openweather' ? 'OpenWeather' : 'DeepSeek',
        JSON.stringify(config)
      ]);

      console.log(`[INTEGRATION-REPO] Configuration updated successfully for ${integrationId}`);
    } catch (error) {
      console.error(`[INTEGRATION-REPO] Error updating integration config for ${integrationId}:`, error);
      throw new Error('Failed to update integration configuration');
    }
  }

  // Additional helper methods for SaaS Admin
  async findByStatus(status: 'connected' | 'error' | 'disconnected'): Promise<Integration[]> {
    try {
      const pool = await this.getPool();
      const result = await pool.query(`
        SELECT integration_id, name, provider, config, status, created_at, updated_at 
        FROM "public"."system_integrations" 
        WHERE status = $1
      `, [status]);

      return result.rows.map(row => ({
        id: row.integration_id,
        name: row.name,
        provider: row.provider,
        description: `${row.provider} integration`,
        status: row.status,
        config: row.config || {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error finding integrations by status:', error);
      throw new Error('Failed to fetch integrations by status');
    }
  }

  async getEnabledIntegrations(): Promise<Integration[]> {
    return this.findByStatus('connected');
  }

  // Métodos adicionais necessários pela interface
  async save(integration: Integration): Promise<Integration> {
    return this.create(integration);
  }

  async getOpenWeatherConfig(): Promise<Integration | null> {
    return this.findById('openweather');
  }

  async updateOpenWeatherApiKey(apiKey: string): Promise<Integration> {
    try {
      const pool = await this.getPool();
      const result = await pool.query(`
        INSERT INTO "public"."system_integrations" 
        (integration_id, name, provider, config, status, updated_at)
        VALUES ('openweather', 'OpenWeather', 'OpenWeather', $1, 'connected', NOW())
        ON CONFLICT (integration_id) 
        DO UPDATE SET 
          config = $1,
          status = 'connected',
          updated_at = NOW()
        RETURNING *
      `, [JSON.stringify({ apiKey })]);

      return {
        id: result.rows[0].integration_id,
        name: result.rows[0].name,
        provider: result.rows[0].provider,
        description: 'Weather data integration',
        status: result.rows[0].status,
        config: result.rows[0].config || {},
        createdAt: new Date(result.rows[0].created_at),
        updatedAt: new Date(result.rows[0].updated_at)
      };
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error updating OpenWeather API key:', error);
      throw new Error('Failed to update OpenWeather API key');
    }
  }

  async updateStatus(integrationId: string, status: 'connected' | 'error' | 'disconnected'): Promise<void> {
    return this.updateIntegrationStatus(integrationId, status);
  }

  async testConnection(integrationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const integration = await this.findById(integrationId);
      if (!integration) {
        return { success: false, message: 'Integration not found' };
      }

      const config = await this.getIntegrationConfig(integrationId);
      if (!config?.apiKey) {
        return { success: false, message: 'API Key not configured' };
      }

      return { success: true, message: 'Integration ready for testing' };
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error testing connection:', error);
      return { success: false, message: 'Connection test failed' };
    }
  }

  async updateConfig(integrationId: string, config: any): Promise<Integration | null> {
    try {
      const pool = await this.getPool();
      const result = await pool.query(`
        INSERT INTO "public"."system_integrations" 
        (integration_id, name, provider, config, status, updated_at)
        VALUES ($1, $1, $1, $2, 'connected', NOW())
        ON CONFLICT (integration_id) 
        DO UPDATE SET 
          config = $2,
          status = CASE WHEN $2::jsonb ? 'apiKey' THEN 'connected' ELSE 'disconnected' END,
          updated_at = NOW()
        RETURNING *
      `, [integrationId, JSON.stringify(config)]);

      if (result.rows[0]) {
        return {
          id: result.rows[0].integration_id,
          name: result.rows[0].name,
          provider: result.rows[0].provider,
          description: `${result.rows[0].provider} integration`,
          status: result.rows[0].status,
          config: result.rows[0].config || {},
          createdAt: new Date(result.rows[0].created_at),
          updatedAt: new Date(result.rows[0].updated_at)
        };
      }

      return null;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error updating integration config:', error);
      throw new Error('Failed to update integration configuration');
    }
  }
}