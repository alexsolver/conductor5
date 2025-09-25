
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../../../../shared/schema';
import { eq, and } from 'drizzle-orm';

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
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
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
    try {
      const tenantDb = await this.getTenantDb(tenantId);

      // Check if settings exist
      const existing = await tenantDb.select()
        .from(schema.omnibridgeSettings)
        .where(eq(schema.omnibridgeSettings.tenantId, tenantId))
        .limit(1);

      if (existing.length === 0) {
        // Create default settings
        const defaultSettings = this.getDefaultSettings(tenantId);
        await this.createSettings(tenantId, defaultSettings);
        return defaultSettings;
      }

      return {
        tenantId: existing[0].tenantId,
        channels: existing[0].channels as ChannelSettings[],
        filters: existing[0].filters as FilterSettings,
        search: existing[0].search as SearchSettings,
        updatedAt: existing[0].updatedAt
      };
    } catch (error) {
      console.error('❌ [SETTINGS-REPO] Error getting settings:', error);
      // Return defaults on error
      return this.getDefaultSettings(tenantId);
    }
  }

  async updateSettings(tenantId: string, settings: Partial<OmniBridgeSettings>): Promise<OmniBridgeSettings> {
    try {
      const tenantDb = await this.getTenantDb(tenantId);

      const updateData = {
        channels: settings.channels,
        filters: settings.filters,
        search: settings.search,
        updatedAt: new Date()
      };

      const result = await tenantDb.update(schema.omnibridgeSettings)
        .set(updateData)
        .where(eq(schema.omnibridgeSettings.tenantId, tenantId))
        .returning();

      if (result.length === 0) {
        // Settings don't exist, create them
        return await this.createSettings(tenantId, { 
          tenantId, 
          ...updateData 
        } as OmniBridgeSettings);
      }

      return {
        tenantId: result[0].tenantId,
        channels: result[0].channels as ChannelSettings[],
        filters: result[0].filters as FilterSettings,
        search: result[0].search as SearchSettings,
        updatedAt: result[0].updatedAt
      };
    } catch (error) {
      console.error('❌ [SETTINGS-REPO] Error updating settings:', error);
      throw error;
    }
  }

  async createSettings(tenantId: string, settings: OmniBridgeSettings): Promise<OmniBridgeSettings> {
    try {
      const tenantDb = await this.getTenantDb(tenantId);

      const result = await tenantDb.insert(schema.omnibridgeSettings)
        .values({
          tenantId: settings.tenantId,
          channels: settings.channels,
          filters: settings.filters,
          search: settings.search,
          createdAt: new Date(),
          updatedAt: settings.updatedAt
        })
        .returning();

      return {
        tenantId: result[0].tenantId,
        channels: result[0].channels as ChannelSettings[],
        filters: result[0].filters as FilterSettings,
        search: result[0].search as SearchSettings,
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
