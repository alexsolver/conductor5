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
        console.log(`No integrations found for tenant ${tenantId}`);
        return [];
      }

      const channels: Channel[] = [];

      for (const integration of integrations) {
        let isConnected = false;
        let isActive = false;
        let messageCount = 0;
        let lastSync = null;
        let lastError = null;
        let errorCount = 0;

        // Verificar status específico por tipo de integração
        if (integration.id === 'imap-email') {
          // Verificar se há configuração IMAP válida
          const config = integration.config;
          if (config && config.emailAddress && config.password && config.imapServer) {
            // Verificar status da integração na base de dados
            isConnected = integration.status === 'connected';
            isActive = integration.status === 'connected';

            // Se estiver conectado, verificar mensagens
            if (isConnected) {
              try {
                // Verificar se existe método getEmailInboxMessages
                if (typeof storage.getEmailInboxMessages === 'function') {
                  const messages = await storage.getEmailInboxMessages(tenantId);
                  messageCount = messages ? messages.length : 0;
                } else {
                  // Fallback: buscar diretamente na tabela emails
                  const db = storage.getDatabase(tenantId);
                  const emailsQuery = `SELECT COUNT(*) as count FROM emails WHERE tenant_id = $1`;
                  const result = await db.query(emailsQuery, [tenantId]);
                  messageCount = result.rows[0]?.count || 0;
                }
                lastSync = new Date().toISOString();
              } catch (error) {
                console.log(`Error fetching messages for IMAP: ${error.message}`);
                errorCount = 1;
                lastError = error.message;
                // Manter como conectado mesmo com erro de mensagens
                isConnected = true;
                isActive = true;
              }
            }
          } else {
            // Configuração incompleta
            isConnected = false;
            isActive = false;
            lastError = 'Configuração IMAP incompleta';
            errorCount = 1;
          }
        }

        channels.push(
          new Channel(
            integration.id,
            tenantId,
            this.mapIntegrationType(integration.id),
            integration.name,
            isActive,
            isConnected,
            integration.config || {},
            100, // default rate limit
            integration.lastSync ? new Date(integration.lastSync) : null,
            messageCount, // message count - could be retrieved from email_inbox_messages
            errorCount, // error count
            lastError || integration.errorMessage || null,
            new Date(integration.createdAt),
            new Date(integration.updatedAt)
          )
        );
      }

      return channels.filter(channel => channel.type !== null);
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