import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface OmniBridgeSettings {
  tenantId: string;
  channels: ChannelSettings[];
  filters: FilterSettings;
  search: SearchSettings;
  updatedAt: Date;
}

export interface ChannelSettings {
  id: string;
  type: string;
  enabled: boolean;
  syncFrequency: number;
  dailyLimit: number;
  hourlyLimit: number;
  workingHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  acceptedTypes: string[];
  maxMessageSize: number;
}

export interface FilterSettings {
  blacklistSenders: string[];
  whitelistSenders: string[];
  spamFilters: {
    enabled: boolean;
    confidenceThreshold: number;
    suspiciousKeywords: string[];
  };
  contentFilters: {
    maxLength: number;
    allowAttachments: boolean;
    allowedFileTypes: string[];
    blockSuspiciousLinks: boolean;
  };
}

export interface SearchSettings {
  timeRange: number;
  maxResultsPerChannel: number;
  priorityChannels: string[];
  autoArchiveAfter: number;
}

export class DrizzleOmniBridgeSettingsRepository {
  private async getTenantDb(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const tenantDb = drizzle(pool, { schema: { ...schema }, logger: false });

    // Ensure settings table exists
    await this.ensureSettingsTable(tenantId);

    return tenantDb;
  }

  private async ensureSettingsTable(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = 'omnibridge_settings'
        );
      `;

      const result = await pool.query(checkQuery, [schemaName]);

      if (!result.rows[0].exists) {
        console.log(`🔧 [OMNIBRIDGE-SETTINGS] Creating settings table for tenant: ${tenantId}`);

        const createQuery = `
          CREATE TABLE IF NOT EXISTS ${schemaName}.omnibridge_settings (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL,
            channels JSONB NOT NULL DEFAULT '[]'::jsonb,
            filters JSONB NOT NULL DEFAULT '{}'::jsonb,
            search JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          );
        `;

        await pool.query(createQuery);
        console.log(`✅ [OMNIBRIDGE-SETTINGS] Created settings table for tenant: ${tenantId}`);
      }
    } catch (error) {
      console.error(`❌ [OMNIBRIDGE-SETTINGS] Error ensuring settings table for tenant ${tenantId}:`, error);
    }
  }

  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  private getSettingsTable(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    // This is a simplified representation, in a real scenario you'd likely map this to your Drizzle schema
    return {
      ...schema.omnibridgeSettings,
      fullTable: `${schemaName}.omnibridge_settings`
    };
  }

  private getDefaultSettings(tenantId: string): OmniBridgeSettings {
    return {
      tenantId,
      channels: [
        {
          id: 'email',
          type: 'email',
          enabled: true,
          syncFrequency: 15,
          dailyLimit: 5000,
          hourlyLimit: 500,
          workingHours: {
            enabled: false,
            start: '09:00',
            end: '18:00',
            timezone: 'America/Sao_Paulo'
          },
          acceptedTypes: ['text', 'html', 'attachments'],
          maxMessageSize: 25
        },
        {
          id: 'telegram',
          type: 'telegram',
          enabled: true,
          syncFrequency: 1,
          dailyLimit: 10000,
          hourlyLimit: 1000,
          workingHours: {
            enabled: false,
            start: '09:00',
            end: '18:00',
            timezone: 'America/Sao_Paulo'
          },
          acceptedTypes: ['text', 'media', 'documents'],
          maxMessageSize: 20
        },
        {
          id: 'whatsapp',
          type: 'whatsapp',
          enabled: true,
          syncFrequency: 1,
          dailyLimit: 10000,
          hourlyLimit: 1000,
          workingHours: {
            enabled: false,
            start: '09:00',
            end: '18:00',
            timezone: 'America/Sao_Paulo'
          },
          acceptedTypes: ['text', 'media', 'documents'],
          maxMessageSize: 16
        },
        {
          id: 'sms',
          type: 'sms',
          enabled: false,
          syncFrequency: 5,
          dailyLimit: 1000,
          hourlyLimit: 100,
          workingHours: {
            enabled: true,
            start: '09:00',
            end: '18:00',
            timezone: 'America/Sao_Paulo'
          },
          acceptedTypes: ['text'],
          maxMessageSize: 1
        }
      ],
      filters: {
        blacklistSenders: [],
        whitelistSenders: [],
        spamFilters: {
          enabled: true,
          confidenceThreshold: 0.7,
          suspiciousKeywords: ['spam', 'scam', 'phishing', 'casino', 'bitcoin', 'lottery']
        },
        contentFilters: {
          maxLength: 10000,
          allowAttachments: true,
          allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'],
          blockSuspiciousLinks: true
        }
      },
      search: {
        timeRange: 30,
        maxResultsPerChannel: 1000,
        priorityChannels: ['whatsapp', 'telegram'],
        autoArchiveAfter: 90
      },
      updatedAt: new Date()
    };
  }

  async getSettings(tenantId: string): Promise<OmniBridgeSettings> {
    console.log(`🔍 [OMNIBRIDGE-SETTINGS] Getting settings for tenant: ${tenantId}`);

    const tenantDb = await this.getTenantDb(tenantId);
    const settingsTable = this.getSettingsTable(tenantId);

    try {
      const result = await tenantDb
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.tenantId, tenantId))
        .limit(1);

      if (result.length === 0) {
        console.log(`📄 [OMNIBRIDGE-SETTINGS] No settings found for tenant: ${tenantId}, creating defaults`);
        const defaultSettings = this.getDefaultSettings(tenantId);

        // Save default settings to database
        await tenantDb
          .insert(settingsTable)
          .values({
            id: randomUUID(),
            tenantId,
            channels: JSON.stringify(defaultSettings.channels),
            filters: JSON.stringify(defaultSettings.filters),
            search: JSON.stringify(defaultSettings.search),
            createdAt: new Date(),
            updatedAt: new Date()
          });

        console.log(`✅ [OMNIBRIDGE-SETTINGS] Created default settings for tenant: ${tenantId}`);
        return defaultSettings;
      }

      const row = result[0];
      const settings = {
        tenantId: row.tenantId,
        channels: typeof row.channels === 'string' ? JSON.parse(row.channels) : row.channels,
        filters: typeof row.filters === 'string' ? JSON.parse(row.filters) : row.filters,
        search: typeof row.search === 'string' ? JSON.parse(row.search) : row.search,
        updatedAt: row.updatedAt
      };

      console.log(`✅ [OMNIBRIDGE-SETTINGS] Retrieved settings for tenant: ${tenantId}`);
      return settings;
    } catch (error) {
      console.error(`❌ [OMNIBRIDGE-SETTINGS] Error getting settings for tenant ${tenantId}:`, error);
      console.log(`📄 [OMNIBRIDGE-SETTINGS] Returning default settings due to error`);
      return this.getDefaultSettings(tenantId);
    }
  }

  async updateSettings(tenantId: string, settings: Partial<OmniBridgeSettings>): Promise<OmniBridgeSettings> {
    console.log(`💾 [OMNIBRIDGE-SETTINGS] Updating settings for tenant: ${tenantId}`);
    console.log(`📝 [OMNIBRIDGE-SETTINGS] Settings data:`, JSON.stringify(settings, null, 2));

    const tenantDb = await this.getTenantDb(tenantId);
    const settingsTable = this.getSettingsTable(tenantId);

    try {
      // Check if settings exist
      const existing = await tenantDb
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.tenantId, tenantId))
        .limit(1);

      const updatedSettings = {
        tenantId,
        channels: settings.channels || this.getDefaultSettings(tenantId).channels,
        filters: settings.filters || this.getDefaultSettings(tenantId).filters,
        search: settings.search || this.getDefaultSettings(tenantId).search,
        updatedAt: new Date()
      };

      if (existing.length > 0) {
        // Update existing
        const result = await tenantDb
          .update(settingsTable)
          .set({
            channels: JSON.stringify(updatedSettings.channels),
            filters: JSON.stringify(updatedSettings.filters),
            search: JSON.stringify(updatedSettings.search),
            updatedAt: updatedSettings.updatedAt
          })
          .where(eq(settingsTable.tenantId, tenantId))
          .returning();

        console.log(`✅ [OMNIBRIDGE-SETTINGS] Updated existing settings for tenant: ${tenantId}`, result);
      } else {
        // Insert new
        const result = await tenantDb
          .insert(settingsTable)
          .values({
            id: randomUUID(),
            tenantId,
            channels: JSON.stringify(updatedSettings.channels),
            filters: JSON.stringify(updatedSettings.filters),
            search: JSON.stringify(updatedSettings.search),
            createdAt: updatedSettings.updatedAt,
            updatedAt: updatedSettings.updatedAt
          })
          .returning();

        console.log(`✅ [OMNIBRIDGE-SETTINGS] Created new settings for tenant: ${tenantId}`, result);
      }

      // Verify the save by retrieving the data
      const savedSettings = await this.getSettings(tenantId);
      console.log(`🔍 [OMNIBRIDGE-SETTINGS] Verified saved settings:`, savedSettings);

      return updatedSettings;
    } catch (error) {
      console.error(`❌ [OMNIBRIDGE-SETTINGS] Error updating settings for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async createSettings(tenantId: string, settings: OmniBridgeSettings): Promise<OmniBridgeSettings> {
    try {
      const tenantDb = await this.getTenantDb(tenantId);
      const settingsTable = this.getSettingsTable(tenantId);

      const result = await tenantDb.insert(schema.omnibridgeSettings)
        .values({
          id: randomUUID(),
          tenantId: settings.tenantId,
          channels: JSON.stringify(settings.channels),
          filters: JSON.stringify(settings.filters),
          search: JSON.stringify(settings.search),
          createdAt: new Date(),
          updatedAt: settings.updatedAt
        })
        .returning();

      return {
        tenantId: result[0].tenantId,
        channels: typeof result[0].channels === 'string' ? JSON.parse(result[0].channels) : result[0].channels,
        filters: typeof result[0].filters === 'string' ? JSON.parse(result[0].filters) : result[0].filters,
        search: typeof result[0].search === 'string' ? JSON.parse(result[0].search) : result[0].search,
        updatedAt: result[0].updatedAt
      };
    } catch (error) {
      console.error('❌ [SETTINGS-REPO] Error creating settings:', error);
      throw error;
    }
  }

  async resetToDefaults(tenantId: string): Promise<OmniBridgeSettings> {
    const defaultSettings = this.getDefaultSettings(tenantId);
    return await this.updateSettings(tenantId, defaultSettings);
  }
}