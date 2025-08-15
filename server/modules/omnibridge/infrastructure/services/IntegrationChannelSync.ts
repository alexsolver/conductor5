import crypto from 'crypto';
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

      // Get all tenant integrations
      const integrations = await this.storage.getTenantIntegrations(tenantId);
      console.log(`📊 [INTEGRATION-SYNC] Found ${integrations.length} integrations`);

      // Filter communication integrations only
      const communicationIntegrations = integrations.filter((integration: any) => 
        integration.category === 'Comunicação'
      );

      console.log(`📡 [INTEGRATION-SYNC] Found ${communicationIntegrations.length} communication integrations`);

      for (const integration of communicationIntegrations) {
        await this.syncIntegrationToChannel(tenantId, integration);
      }

      // ✅ TELEGRAM FIX: Force sync for Telegram specifically
      const telegramIntegration = integrations.find((i: any) => i.id === 'telegram');
      if (telegramIntegration) {
        console.log(`📱 [TELEGRAM-SYNC] Force syncing Telegram integration`);
        await this.syncTelegramChannel(tenantId, telegramIntegration);
      }

      console.log(`✅ [INTEGRATION-SYNC] Sync completed for tenant: ${tenantId}`);
    } catch (error) {
      console.error(`❌ [INTEGRATION-SYNC] Error syncing integrations:`, error);
      throw error;
    }
  }

  private async syncIntegrationToChannel(tenantId: string, integration: any): Promise<void> {
    try {
      console.log(`🔄 [INTEGRATION-SYNC] Syncing integration: ${integration.name}`);
      const channel = await this.mapIntegrationToChannel(integration, tenantId);
      await this.channelRepository.save(channel);
      console.log(`✅ [INTEGRATION-SYNC] Synced channel: ${channel.name} (${channel.type})`);
    } catch (error) {
      console.error(`❌ [INTEGRATION-SYNC] Failed to sync integration ${integration.name}:`, error);
      throw error;
    }
  }

  private async syncTelegramChannel(tenantId: string, telegramIntegration: any): Promise<void> {
    try {
      console.log(`📱 [TELEGRAM-SYNC] Processing Telegram integration`);

      // Check if channel already exists
      const existingChannels = await this.channelRepository.findByTenant(tenantId);
      const existingTelegram = existingChannels.find(c => c.integrationId === 'telegram');

      if (existingTelegram) {
        console.log(`📱 [TELEGRAM-SYNC] Updating existing Telegram channel`);

        // Update existing channel with current status
        const updatedChannel = Channel.create({
          id: existingTelegram.id,
          tenantId,
          integrationId: 'telegram',
          name: 'Telegram',
          type: 'social',
          status: telegramIntegration.configured && telegramIntegration.status === 'connected' ? 'active' : 'inactive',
          config: {
            botToken: '***',
            chatId: telegramIntegration.config?.telegramChatId || '',
            webhookUrl: telegramIntegration.config?.telegramWebhookUrl || '',
            webhookConfigured: telegramIntegration.config?.webhookConfigured || false
          },
          metadata: {
            category: 'Comunicação',
            features: ['Notificações em tempo real', 'Mensagens personalizadas', 'Integração com Bot API'],
            lastSync: new Date().toISOString(),
            configured: telegramIntegration.configured
          }
        });

        await this.channelRepository.update(updatedChannel);
      } else {
        console.log(`📱 [TELEGRAM-SYNC] Creating new Telegram channel`);

        // Create new Telegram channel
        const newChannel = Channel.create({
          id: crypto.randomUUID(),
          tenantId,
          integrationId: 'telegram',
          name: 'Telegram',
          type: 'social',
          status: telegramIntegration.configured && telegramIntegration.status === 'connected' ? 'active' : 'inactive',
          config: {
            botToken: '***',
            chatId: telegramIntegration.config?.telegramChatId || '',
            webhookUrl: telegramIntegration.config?.telegramWebhookUrl || '',
            webhookConfigured: telegramIntegration.config?.webhookConfigured || false
          },
          metadata: {
            category: 'Comunicação',
            features: ['Notificações em tempo real', 'Mensagens personalizadas', 'Integração com Bot API'],
            lastSync: new Date().toISOString(),
            configured: telegramIntegration.configured
          }
        });

        await this.channelRepository.save(newChannel);
      }

      console.log(`✅ [TELEGRAM-SYNC] Telegram channel synchronized successfully`);
    } catch (error) {
      console.error(`❌ [TELEGRAM-SYNC] Error syncing Telegram channel:`, error);
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