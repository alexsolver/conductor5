/**
 * Drizzle Channel Repository
 * Clean Architecture - Infrastructure Layer
 */
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { Channel } from '../../domain/entities/Channel';

export class DrizzleChannelRepository implements IChannelRepository {
  async findAll(tenantId: string): Promise<Channel[]> {
    try {
      const { storage } = await import('../../../../storage-simple');

      if (!tenantId) {
        console.error('Tenant ID is required for finding channels');
        return [];
      }

      let integrations = [];

      try {
        integrations = await storage.getTenantIntegrations(tenantId);
      } catch (storageError) {
        console.log(`Storage error, using empty array: ${storageError.message}`);
        integrations = [];
      }

      if (!integrations || !Array.isArray(integrations)) {
        console.log(`No integrations found for tenant ${tenantId}`);
        return [];
      }

      return integrations.map(integration => {
        // Check if IMAP email integration has proper configuration
        let isConnected = integration.status === 'connected' || integration.status === 'active';
        let isActive = integration.status !== 'disconnected';
        let errorCount = 0;
        let lastError = null;

        if (integration.id === 'imap-email') {
          const config = integration.config || {};
          const hasRequiredConfig = config.imapServer && config.emailAddress && config.password;

          if (!hasRequiredConfig) {
            isConnected = false;
            isActive = false;
            errorCount = 1;
            lastError = 'Configuração IMAP incompleta';
          } else {
            // If configuration exists, mark as connected
            isConnected = true;
            isActive = true;
            errorCount = 0;
            lastError = null;
          }
        }

        return new Channel(
          `channel-${integration.id}`,
          tenantId,
          integration.category?.toLowerCase() || 'unknown',
          integration.name,
          isActive,
          isConnected,
          0, // messageCount - will be calculated elsewhere
          errorCount,
          lastError,
          new Date().toISOString() // lastSync
        );
      });
    } catch (error) {
      console.error('Error finding channels:', error);
      return [];
    }
  }

  async findById(tenantId: string, id: string): Promise<Channel | null> {
    const channels = await this.findAll(tenantId);
    return channels.find(channel => channel.id === id) || null;
  }

  async findByType(tenantId: string, type: string): Promise<Channel[]> {
    try {
      const channels = await this.findAll(tenantId);
      return channels.filter(c => c.type === type);
    } catch (error) {
      console.error('Error finding channels by type:', error);
      return [];
    }
  }

  async findActive(tenantId: string): Promise<Channel[]> {
    try {
      const channels = await this.findAll(tenantId);
      return channels.filter(c => c.isActive);
    } catch (error) {
      console.error('Error finding active channels:', error);
      return [];
    }
  }

  async save(channel: Channel): Promise<Channel> {
    return channel;
  }

  async update(tenantId: string, id: string, updates: Partial<Channel>): Promise<Channel | null> {
    const channel = await this.findById(tenantId, id);
    if (!channel) return null;

    Object.assign(channel, updates);
    return channel;
  }

  async updateStatus(tenantId: string, id: string, isConnected: boolean, errorMessage?: string): Promise<void> {
    // Update integration status
  }

  async incrementMessageCount(tenantId: string, id: string): Promise<void> {
    // Could track message counts separately
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    return false; // Channels are derived from integrations
  }

  private mapIntegrationType(integrationId: string): 'email' | 'whatsapp' | 'telegram' | 'sms' {
    const id = integrationId.toLowerCase();
    if (id.includes('email') || id.includes('gmail') || id.includes('outlook') || id.includes('imap')) {
      return 'email';
    }
    if (id.includes('whatsapp')) {
      return 'whatsapp';
    }
    if (id.includes('telegram')) {
      return 'telegram';
    }
    if (id.includes('sms') || id.includes('twilio')) {
      return 'sms';
    }
    return 'email'; // default
  }
}