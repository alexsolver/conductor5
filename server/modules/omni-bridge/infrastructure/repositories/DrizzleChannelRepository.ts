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

      // Get channels from integrations
      const integrations = await storage.getTenantIntegrations(tenantId);

      return integrations.map(integration => {
        const isConnected = integration.status === 'connected';
        const isActive = integration.isActive !== false && isConnected; // Ativo se não for explicitamente false E estiver conectado
        
        return new Channel(
          integration.id,
          tenantId,
          this.mapIntegrationType(integration.id),
          integration.name,
          isActive,
          isConnected,
          integration.config || {},
          100, // default rate limit
          integration.lastSync ? new Date(integration.lastSync) : null,
          0, // message count - could be retrieved from email_inbox_messages
          0, // error count
          integration.errorMessage || null,
          new Date(integration.createdAt),
          new Date(integration.updatedAt)
        );
      }).filter(channel => channel.type !== null);
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