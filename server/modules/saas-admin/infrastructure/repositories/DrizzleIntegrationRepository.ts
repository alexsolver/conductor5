// ===========================================================================================
// DRIZZLE INTEGRATION REPOSITORY - SaaS Admin Infrastructure Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Infrastructure Layer → Implementação técnica específica com Drizzle

import { db } from '../../../../db';
import * as schema from '../../../../shared/schema';
import * as saasSchema from '../../../../shared/schema-saas-admin';
import { eq, sql, and } from 'drizzle-orm';
import { Integration, IntegrationConfig } from '../../domain/entities/Integration';
import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';

export class DrizzleIntegrationRepository implements IIntegrationRepository {

  // ✅ SEMPRE usar o padrão estabelecido (1qa.md line 52)
  constructor() {
    if (!db) throw new Error('Database connection required');
  }

  async findAll(): Promise<Integration[]> {
    try {
      console.log('[INTEGRATION-REPO] Fetching all integrations from PUBLIC schema (saas_integrations)');
      // Para SaaS admin, as integrações são globais (não específicas por tenant)
      const results = await db
        .select()
        .from(saasSchema.saasIntegrations)
        .orderBy(saasSchema.saasIntegrations.name);

      console.log('[INTEGRATION-REPO] Found integrations in PUBLIC schema:', results.length);
      return results.map(this.mapToEntity);
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error finding all integrations:', error);
      throw new Error('Failed to fetch integrations');
    }
  }

  async findById(integrationId: string): Promise<Integration | null> {
    try {
      const [result] = await db
        .select()
        .from(saasSchema.saasIntegrations)
        .where(eq(saasSchema.saasIntegrations.id, integrationId))
        .limit(1);

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error finding integration by ID:', error);
      throw new Error('Failed to fetch integration');
    }
  }

  async findByProvider(provider: string): Promise<Integration | null> {
    try {
      const [result] = await db
        .select()
        .from(saasSchema.saasIntegrations)
        .where(eq(saasSchema.saasIntegrations.provider, provider))
        .limit(1);

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error finding integration by provider:', error);
      throw new Error('Failed to fetch integration');
    }
  }

  async save(integration: Integration): Promise<Integration> {
    try {
      console.log('[INTEGRATION-REPO] Attempting to save integration to PUBLIC schema (saas_integrations):', {
        id: integration.id,
        provider: integration.provider,
        name: integration.name,
        hasConfig: !!integration.config,
        configKeys: integration.config ? Object.keys(integration.config) : []
      });

      const [result] = await db
        .insert(saasSchema.saasIntegrations)
        .values({
          id: integration.id,
          name: integration.name,
          provider: integration.provider,
          description: integration.description,
          config: integration.config,
          status: integration.status,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        })
        .returning();

      console.log('[INTEGRATION-REPO] Successfully saved integration:', {
        id: result.id,
        provider: result.provider,
        savedToDb: true
      });

      return this.mapToEntity(result);
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error saving integration:', error);
      console.error('[INTEGRATION-REPO] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw new Error('Failed to save integration');
    }
  }

  async update(integrationId: string, updates: Partial<Integration>): Promise<Integration | null> {
    try {
      const [result] = await db
        .update(saasSchema.saasIntegrations)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(saasSchema.saasIntegrations.id, integrationId))
        .returning();

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error updating integration:', error);
      throw new Error('Failed to update integration');
    }
  }

  async delete(integrationId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(saasSchema.saasIntegrations)
        .where(eq(saasSchema.saasIntegrations.id, integrationId));

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error deleting integration:', error);
      throw new Error('Failed to delete integration');
    }
  }

  // OpenWeather specific operations
  async getOpenWeatherConfig(): Promise<Integration | null> {
    return this.findByProvider('openweather');
  }

  async updateOpenWeatherApiKey(apiKey: string): Promise<Integration> {
    try {
      console.log('[INTEGRATION-REPO] Starting updateOpenWeatherApiKey with apiKey:', apiKey.substring(0, 8) + '...');

      // Check if OpenWeather integration exists
      let integration = await this.getOpenWeatherConfig();

      console.log('[INTEGRATION-REPO] Existing integration found:', !!integration);

      if (!integration) {
        // Create new OpenWeather integration
        console.log('[INTEGRATION-REPO] Creating new OpenWeather integration...');
        integration = Integration.createOpenWeatherIntegration(apiKey);

        console.log('[INTEGRATION-REPO] Created integration entity:', {
          id: integration.id,
          provider: integration.provider,
          name: integration.name
        });

        const savedIntegration = await this.save(integration);
        console.log('[INTEGRATION-REPO] Integration saved successfully');
        return savedIntegration;
      } else {
        // Update existing integration
        const updatedConfig: IntegrationConfig = {
          ...integration.config,
          apiKey,
          lastTested: new Date()
        };

        const updatedIntegration = integration.updateConfig(updatedConfig);
        const result = await this.update(integration.id, updatedIntegration);

        if (!result) {
          throw new Error('Failed to update OpenWeather integration');
        }

        return result;
      }
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error updating OpenWeather API key:', error);
      throw new Error('Failed to update OpenWeather API key');
    }
  }

  async findByStatus(status: 'connected' | 'error' | 'disconnected'): Promise<Integration[]> {
    try {
      const results = await db
        .select()
        .from(saasSchema.saasIntegrations)
        .where(eq(saasSchema.saasIntegrations.status, status));

      return results.map(this.mapToEntity);
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error finding integrations by status:', error);
      throw new Error('Failed to fetch integrations by status');
    }
  }

  async updateStatus(integrationId: string, status: 'connected' | 'error' | 'disconnected'): Promise<void> {
    try {
      await db
        .update(saasSchema.saasIntegrations)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(saasSchema.saasIntegrations.id, integrationId));
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error updating integration status:', error);
      throw new Error('Failed to update integration status');
    }
  }

  async testConnection(integrationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const integration = await this.findById(integrationId);
      if (!integration) {
        return { success: false, message: 'Integration not found' };
      }

      if (!integration.canMakeRequest()) {
        return { success: false, message: 'Integration not properly configured' };
      }

      // For OpenWeather, test with a simple API call
      if (integration.isOpenWeatherIntegration()) {
        try {
          const testUrl = `${integration.config.baseUrl}/weather?lat=0&lon=0&appid=${integration.config.apiKey}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), integration.config.timeout || 5000);

          const response = await fetch(testUrl, { 
            method: 'GET',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            await this.updateStatus(integrationId, 'connected');
            return { success: true, message: 'Connection successful' };
          } else {
            await this.updateStatus(integrationId, 'error');
            return { success: false, message: `API returned status: ${response.status}` };
          }
        } catch (error) {
          await this.updateStatus(integrationId, 'error');
          return { success: false, message: 'Connection failed: Network error' };
        }
      }

      return { success: false, message: 'Test not implemented for this provider' };
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error testing connection:', error);
      return { success: false, message: 'Test failed due to internal error' };
    }
  }

  async updateConfig(integrationId: string, config: any): Promise<Integration | null> {
    try {
      const integration = await this.findById(integrationId);
      if (!integration) return null;

      const updatedIntegration = integration.updateConfig(config);
      return await this.update(integrationId, updatedIntegration);
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error updating integration config:', error);
      throw new Error('Failed to update integration config');
    }
  }

  async getEnabledIntegrations(): Promise<Integration[]> {
    try {
      const results = await db
        .select()
        .from(saasSchema.saasIntegrations)
        .where(and(
          eq(saasSchema.saasIntegrations.status, 'connected')
        ));

      return results.map(this.mapToEntity).filter(integration => integration.isActive());
    } catch (error) {
      console.error('[INTEGRATION-REPO] Error finding enabled integrations:', error);
      throw new Error('Failed to fetch enabled integrations');
    }
  }

  // Map database result to domain entity
  private mapToEntity(row: any): Integration {
    return new Integration(
      row.id,
      row.name,
      row.provider,
      row.description,
      row.config || {},
      row.status,
      row.createdAt,
      row.updatedAt
    );
  }

  async updateIntegrationStatus(provider: string, status: 'connected' | 'error' | 'disconnected'): Promise<void> {
    try {
      console.log(`[INTEGRATION-REPO] Updating ${provider} status to: ${status}`);

      await db
        .update(saasSchema.saasIntegrations)
        .set({ 
          status: status,
          updatedAt: new Date()
        })
        .where(eq(saasSchema.saasIntegrations.provider, provider));

      console.log(`[INTEGRATION-REPO] Status updated successfully for ${provider}`);
    } catch (error) {
      console.error(`[INTEGRATION-REPO] Error updating integration status:`, error);
      throw error;
    }
  }
}