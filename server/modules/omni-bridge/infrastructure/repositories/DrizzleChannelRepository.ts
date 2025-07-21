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

      // Get actual message count for email integrations
      let actualEmailCount = 0;
      if (emailsTableExists) {
        try {
          const emails = await storage.getEmailInboxMessages(tenantId);
          actualEmailCount = emails.length;
        } catch (error) {
          console.log('Error getting email count:', error.message);
        }
      }

      // Filter integrations to show only Communication category
      const communicationIntegrations = integrations.filter(integration => 
        integration.category === 'Comunicação' || integration.category === 'communication'
      );

      const channels: Channel[] = communicationIntegrations.map(integration => {
        let isActive = false;
        let isConnected = false;
        let errorCount = 0;
        let lastError = null;
        let messageCount = 0;

        // Determine channel type from integration
        const channelType = this.mapIntegrationType(integration.id);

        // Check if integration has valid configuration
        const hasConfig = integration.config && Object.keys(integration.config).length > 0;

        // Special handling for IMAP Email integration
        if (integration.id === 'imap-email') {
          // Check if has valid IMAP configuration
          const hasValidImapConfig = integration.config && 
            typeof integration.config === 'object' &&
            integration.config.emailAddress && 
            integration.config.password && 
            integration.config.imapServer &&
            integration.config.configured === true;

          console.log(`📧 IMAP Integration Debug:`, {
            id: integration.id,
            status: integration.status,
            hasConfig: !!integration.config,
            configKeys: integration.config ? Object.keys(integration.config) : [],
            hasValidImapConfig,
            emailsTableExists
          });

          if (hasValidImapConfig && emailsTableExists) {
            // Valid configuration and table exists
            isActive = true;
            isConnected = integration.status === 'connected' || integration.status === 'active';
            errorCount = 0;
            lastError = null;
            messageCount = actualEmailCount;
          } else if (hasValidImapConfig && !emailsTableExists) {
            // Valid config but table missing
            isActive = true;
            isConnected = false;
            errorCount = 1;
            lastError = 'Tabela de emails não encontrada';
          } else if (!hasValidImapConfig && emailsTableExists) {
            // Table exists but config missing/invalid
            isActive = true;
            isConnected = false;
            errorCount = 1;
            lastError = 'Configuração IMAP necessária';
          } else {
            // No valid config and no table
            isActive = true;
            isConnected = false;
            errorCount = 1;
            lastError = 'Configuração IMAP necessária';
          }
        } else {
          // For other integrations - make them more visible
          if (integration.status === 'connected' && hasConfig) {
            isActive = true;
            isConnected = true;
            errorCount = 0;
            lastError = null;
          } else if (integration.status === 'disconnected') {
            isActive = true; // Show as active but disconnected
            isConnected = false;
            errorCount = 0;
            lastError = 'Integração desconectada';
          } else if (!hasConfig) {
            isActive = true; // Show as active but needs config
            isConnected = false;
            errorCount = 1;
            lastError = 'Configuração necessária';
          }
        }

        const channel = new Channel(
          `ch-${integration.id}`,
          tenantId,
          channelType,
          integration.name,
          isActive,
          isConnected,
          integration.config || {},
          0, // rateLimit - pode ser configurado posteriormente
          integration.lastSync ? new Date(integration.lastSync) : null,
          messageCount,
          errorCount,
          lastError,
          integration.createdAt ? new Date(integration.createdAt) : new Date(),
          integration.updatedAt ? new Date(integration.updatedAt) : new Date()
        );

        console.log(`📋 Creating channel: ${integration.id}`, {
          name: integration.name,
          type: channelType,
          isActive,
          isConnected,
          messageCount,
          errorCount,
          lastError,
          hasConfig,
          status: integration.status
        });

        return channel;
      });

      console.log(`DrizzleChannelRepository: Found ${channels.length} communication channels for tenant ${tenantId} (filtered from ${integrations.length} total integrations)`);
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

  private mapIntegrationType(integrationId: string): 'email' | 'whatsapp' | 'slack' | 'webhook' {
    const id = integrationId.toLowerCase();
    if (id.includes('email') || id.includes('gmail') || id.includes('outlook') || id.includes('imap') || id.includes('smtp')) {
      return 'email';
    }
    if (id.includes('whatsapp')) {
      return 'whatsapp';
    }
    if (id.includes('slack')) {
      return 'slack';
    }
    if (id.includes('sms') || id.includes('twilio')) {
      return 'webhook';
    }
    return 'email'; // default for communication integrations
  }
}