import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { Channel } from '../../domain/entities/Channel';

export class IntegrationChannelSync {
  constructor(
    private channelRepository: IChannelRepository,
    private storage: any
  ) {}

  async syncIntegrationsToChannels(tenantId: string): Promise<void> {
    try {
      console.log(`🔄 [INTEGRATION-SYNC] Starting sync for tenant: ${tenantId}`);

      // Get integrations from Workspace Admin
      const integrations = await this.storage.getTenantIntegrations(tenantId);

      // Filter communication integrations
      const communicationIntegrations = integrations.filter((integration: any) => {
        const category = integration.category?.toLowerCase() || '';
        return category === 'comunicação' || category === 'communication';
      });

      console.log(`📡 [INTEGRATION-SYNC] Found ${communicationIntegrations.length} communication integrations`);

      // Convert integrations to channels
      for (const integration of communicationIntegrations) {
        const channel = await this.mapIntegrationToChannel(integration, tenantId);
        await this.channelRepository.save(channel);
      }

      console.log(`✅ [INTEGRATION-SYNC] Sync completed for tenant: ${tenantId}`);
    } catch (error) {
      console.error(`❌ [INTEGRATION-SYNC] Error syncing for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  private async mapIntegrationToChannel(integration: any, tenantId: string): Promise<Channel> {
    const channelType = this.getChannelType(integration.id);
    const icon = this.getChannelIcon(integration.id);

    return {
      id: integration.id,
      tenantId,
      name: integration.name,
      type: channelType,
      status: integration.status === 'connected' ? 'active' : 'inactive',
      config: integration.config || {},
      features: integration.features || [],
      description: integration.description,
      icon,
      lastSync: new Date(),
      metrics: {
        totalMessages: 0,
        unreadMessages: 0,
        errorRate: 0,
        uptime: 100
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private getChannelType(integrationId: string): string {
    const typeMap: Record<string, string> = {
      'email-imap': 'email',
      'gmail-oauth2': 'email',
      'outlook-oauth2': 'email',
      'whatsapp-business': 'whatsapp',
      'telegram-bot': 'telegram',
      'twilio-sms': 'sms',
      'slack': 'slack'
    };
    return typeMap[integrationId] || 'generic';
  }

  private getChannelIcon(integrationId: string): string {
    const iconMap: Record<string, string> = {
      'email-imap': 'Mail',
      'gmail-oauth2': 'Mail',
      'outlook-oauth2': 'Mail',
      'whatsapp-business': 'MessageSquare',
      'telegram-bot': 'MessageCircle',
      'twilio-sms': 'Phone',
      'slack': 'MessageCircle'
    };
    return iconMap[integrationId] || 'Settings';
  }
}