import crypto from 'crypto';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import type { Channel } from '../../domain/entities/Channel';

export class IntegrationChannelSync {
  constructor(
    private channelRepository: IChannelRepository,
    private storage: any
  ) {}

  async syncIntegrationsToChannels(tenantId: string): Promise<void> {
    try {
      console.log(`🔄 [INTEGRATION-SYNC] Starting sync for tenant: ${tenantId}`);

      // Get integrations from storage
      const integrations = await this.storage.getTenantIntegrations(tenantId);

      // Filter communication integrations with broader criteria
      const communicationIntegrations = integrations.filter((integration: any) => {
        const category = integration.category?.toLowerCase() || '';
        const name = integration.name?.toLowerCase() || '';

        // Check category or name for communication-related terms
        return category.includes('comunicaç') || category.includes('communication') || 
               name.includes('email') || name.includes('whatsapp') || name.includes('telegram') ||
               name.includes('sms') || name.includes('chat') || name.includes('imap') ||
               name.includes('smtp') || name.includes('gmail') || name.includes('outlook');
      });

      console.log(`📡 [INTEGRATION-SYNC] Found ${communicationIntegrations.length} communication integrations`);

      // Get existing channels to avoid duplicates
      const existingChannels = await this.channelRepository.findByTenant(tenantId);
      console.log(`📋 [INTEGRATION-SYNC] Found ${existingChannels.length} existing channels`);

      // Sync each integration to a channel
      for (const integration of communicationIntegrations) {
        // Check if channel already exists
        const existingChannel = existingChannels.find(ch => ch.integrationId === integration.id);

        if (!existingChannel) {
          await this.syncIntegrationToChannel(tenantId, integration);
        } else {
          // Update existing channel status
          await this.updateExistingChannel(tenantId, integration, existingChannel);
        }
      }

      console.log(`✅ [INTEGRATION-SYNC] Sync completed for tenant: ${tenantId}`);
    } catch (error) {
      console.error('[INTEGRATION-SYNC] Error syncing integrations:', error);
      throw error;
    }
  }

  private async syncIntegrationToChannel(tenantId: string, integration: any): Promise<void> {
    try {
      console.log(`🔗 [CHANNEL-SYNC] Syncing integration: ${integration.name} (${integration.id})`);

      const channelType = this.mapIntegrationToChannelType(integration);
      const channelIcon = this.mapIntegrationToIcon(integration);

      const channelData = {
        id: integration.id,
        tenantId,
        integrationId: integration.id,
        name: integration.name,
        type: channelType,
        status: integration.status === 'connected' || integration.enabled ? 'active' : 'inactive',
        config: integration.config || {},
        features: integration.features || [],
        description: integration.description || `Canal ${channelType}`,
        icon: channelIcon,
        lastSync: new Date(),
        metrics: {
          totalMessages: 0,
          unreadMessages: 0,
          lastActivity: null
        },
        metadata: {
          originalIntegration: integration.id,
          syncedAt: new Date().toISOString(),
          category: integration.category
        }
      };

      // Create or update channel
      await this.channelRepository.createOrUpdate(channelData);

      console.log(`✅ [CHANNEL-SYNC] Channel synced: ${integration.name}`);
    } catch (error) {
      console.error(`❌ [CHANNEL-SYNC] Error syncing ${integration.name}:`, error);
    }
  }

  private async updateExistingChannel(tenantId: string, integration: any, existingChannel: any): Promise<void> {
    try {
      console.log(`🔄 [CHANNEL-UPDATE] Updating existing channel: ${integration.name}`);

      const updatedData = {
        ...existingChannel,
        status: integration.status === 'connected' || integration.enabled ? 'active' : 'inactive',
        name: integration.name,
        config: integration.config || existingChannel.config,
        features: integration.features || existingChannel.features,
        description: integration.description || existingChannel.description,
        lastSync: new Date(),
        metadata: {
          ...existingChannel.metadata,
          syncedAt: new Date().toISOString(),
          category: integration.category
        }
      };

      await this.channelRepository.update(existingChannel.id, updatedData, tenantId);

      console.log(`✅ [CHANNEL-UPDATE] Channel updated: ${integration.name}`);
    } catch (error) {
      console.error(`❌ [CHANNEL-UPDATE] Error updating ${integration.name}:`, error);
    }
  }

  private mapIntegrationToChannelType(integration: any): string {
    const name = integration.name?.toLowerCase() || '';
    const id = integration.id?.toLowerCase() || '';
    const description = integration.description?.toLowerCase() || '';

    // Check in name, id, and description
    const text = `${name} ${id} ${description}`;

    if (text.includes('email') || text.includes('imap') || text.includes('smtp') || 
        text.includes('gmail') || text.includes('outlook') || text.includes('mail')) {
      return 'email';
    }
    if (text.includes('whatsapp') || text.includes('whats')) {
      return 'whatsapp';
    }
    if (text.includes('telegram')) {
      return 'telegram';
    }
    if (text.includes('sms') || text.includes('twilio') || text.includes('texto')) {
      return 'sms';
    }
    if (text.includes('chat') || text.includes('messaging')) {
      return 'chat';
    }

    return 'chat';
  }

  private mapIntegrationToIcon(integration: any): string {
    const type = this.mapIntegrationToChannelType(integration);

    switch (type) {
      case 'email': return 'Mail';
      case 'whatsapp': return 'MessageSquare';
      case 'telegram': return 'MessageCircle';
      case 'sms': return 'Phone';
      case 'chat': return 'MessageSquare';
      default: return 'MessageSquare';
    }
  }
}