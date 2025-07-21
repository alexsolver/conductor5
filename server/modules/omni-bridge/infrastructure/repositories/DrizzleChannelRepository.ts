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

      // Buscar integrações do tenant
      const integrations = await storage.getTenantIntegrations(tenantId);

      if (!integrations || !Array.isArray(integrations)) {
        console.log('No integrations found, returning empty array');
        return [];
      }

      // Check if emails table exists for IMAP integration
      let emailsTableExists = false;
      try {
        const emails = await storage.getEmailInboxMessages(tenantId);
        emailsTableExists = true;
      } catch (error) {
        if (error.message.includes('does not exist')) {
          emailsTableExists = false;
        }
      }

      const channels: Channel[] = integrations.map(integration => {
        let isActive = integration.status === 'connected' || integration.status === 'active';
        let isConnected = integration.configured && integration.status !== 'disconnected';
        let errorCount = 0;
        let lastError = null;

        // Special handling for IMAP Email integration
        if (integration.id === 'imap-email') {
          // Se a integração está configurada e conectada, marcar como ativa
          if (integration.status === 'connected' && integration.config) {
            isActive = true;
            isConnected = true;
            errorCount = 0;
            lastError = null;
          } else if (!emailsTableExists && integration.status !== 'connected') {
            isActive = false;
            isConnected = false;
            errorCount = 1;
            lastError = 'Configuração IMAP incompleta';
          }
        }

        return new Channel(
          `ch-${integration.id}`,
          integration.category as 'email' | 'whatsapp' | 'slack' | 'webhook',
          integration.name,
          isActive,
          isConnected,
          0, // messageCount - will be updated later if needed
          errorCount,
          lastError,
          new Date() // lastSync
        );
      });

      console.log(`DrizzleChannelRepository: Found ${channels.length} channels for tenant ${tenantId}`);
      return channels;
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