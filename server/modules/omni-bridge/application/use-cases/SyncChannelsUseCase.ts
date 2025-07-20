
/**
 * Sync Channels Use Case
 * Clean Architecture - Application Layer
 */
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { Channel } from '../../domain/entities/Channel';

export class SyncChannelsUseCase {
  constructor(
    private channelRepository: IChannelRepository
  ) {}

  async execute(tenantId: string): Promise<Channel[]> {
    // Get existing integrations and sync them to channels
    const { storage } = await import('../../../../storage-simple');
    const integrations = await storage.getTenantIntegrations(tenantId);
    
    const channels: Channel[] = [];
    
    for (const integration of integrations) {
      const channelType = this.mapIntegrationType(integration.id);
      if (!channelType) continue;
      
      const existingChannel = await this.channelRepository.findById(tenantId, integration.id);
      
      if (existingChannel) {
        // Update existing channel
        const updatedChannel = await this.channelRepository.update(tenantId, integration.id, {
          isActive: integration.isActive || false,
          isConnected: integration.status === 'connected',
          configuration: integration.config || {},
          lastError: integration.errorMessage || null,
          updatedAt: new Date()
        });
        if (updatedChannel) channels.push(updatedChannel);
      } else {
        // Create new channel
        const newChannel = new Channel(
          integration.id,
          tenantId,
          channelType,
          integration.name,
          integration.isActive || false,
          integration.status === 'connected',
          integration.config || {},
          100, // default rate limit
          integration.lastSync ? new Date(integration.lastSync) : null,
          0, // message count
          0, // error count
          integration.errorMessage || null,
          new Date(),
          new Date()
        );
        
        const savedChannel = await this.channelRepository.save(newChannel);
        channels.push(savedChannel);
      }
    }
    
    return channels;
  }
  
  private mapIntegrationType(integrationId: string): 'email' | 'whatsapp' | 'telegram' | 'sms' | null {
    if (integrationId.includes('email') || integrationId.includes('gmail') || integrationId.includes('outlook') || integrationId.includes('imap')) {
      return 'email';
    }
    if (integrationId.includes('whatsapp')) {
      return 'whatsapp';
    }
    if (integrationId.includes('telegram')) {
      return 'telegram';
    }
    if (integrationId.includes('sms') || integrationId.includes('twilio')) {
      return 'sms';
    }
    return null;
  }
}
