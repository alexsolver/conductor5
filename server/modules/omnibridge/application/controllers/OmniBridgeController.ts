import { Request, Response } from 'express';
import { GetChannelsUseCase } from '../use-cases/GetChannelsUseCase';
import { ToggleChannelUseCase } from '../use-cases/ToggleChannelUseCase';
import { GetMessagesUseCase } from '../use-cases/GetMessagesUseCase';
import { ProcessMessageUseCase } from '../use-cases/ProcessMessageUseCase';

export class OmniBridgeController {
  constructor(
    private getChannelsUseCase: GetChannelsUseCase,
    private toggleChannelUseCase: ToggleChannelUseCase,
    private getMessagesUseCase: GetMessagesUseCase,
    private processMessageUseCase: ProcessMessageUseCase
  ) {}

  async getChannels(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      console.log('🔍 [OmniBridge] Getting channels for tenant:', tenantId);

      // Get communication channels from tenant integrations using the correct storage method
      const { storage } = await import('../../../storage-simple');

      try {
        // Get all integrations for the tenant
        const integrations = await storage.getTenantIntegrations(tenantId);
        console.log('📡 [OmniBridge] Found total integrations:', integrations.length);

        // Return all integrations without filtering
        const communicationChannels = integrations.map((integration: any) => {
          console.log(`📡 [OmniBridge] Including integration: ${integration.name} (category: ${integration.category || 'N/A'})`);
          return integration;
        });

        console.log('📡 [OmniBridge] Communication channels found:', communicationChannels.length);

        // Map to OmniBridge channel format with improved type detection
        const channels = communicationChannels.map((integration: any) => {
          const channelType = this.mapIntegrationType(integration.id, integration.name);
          const channelIcon = this.getChannelIcon(integration.id, integration.name);

          return {
            id: integration.id,
            name: integration.name,
            type: channelType,
            enabled: integration.enabled === true || integration.status === 'connected',
            icon: channelIcon,
            description: integration.description || 'Canal de comunicação',
            status: integration.status || (integration.enabled ? 'connected' : 'disconnected'),
            messageCount: 0,
            lastMessage: integration.status === 'connected' ? 'Ativo' : 'Aguardando configuração',
            lastActivity: integration.status === 'connected' ? 'Recente' : 'Nunca',
            features: integration.features || this.getDefaultFeatures(channelType)
          };
        });

        if (channels.length === 0) {
          // Return default channels structure if no integrations found
          const defaultChannels = [
            {
              id: 'email-imap-default',
              name: 'Email IMAP',
              type: 'email',
              enabled: false,
              icon: 'Mail',
              description: 'Configure sua conexão de email IMAP no Workspace Admin → Integrações → Comunicação',
              status: 'not_configured',
              messageCount: 0,
              lastMessage: 'Não configurado',
              lastActivity: 'Nunca',
              features: ['Auto-criação de tickets', 'Sincronização de emails']
            },
            {
              id: 'whatsapp-default',
              name: 'WhatsApp Business',
              type: 'whatsapp',
              enabled: false,
              icon: 'MessageSquare',
              description: 'Configure sua integração WhatsApp no Workspace Admin → Integrações → Comunicação',
              status: 'not_configured',
              messageCount: 0,
              lastMessage: 'Não configurado',
              lastActivity: 'Nunca',
              features: ['Mensagens automáticas', 'Templates WhatsApp']
            },
            {
              id: 'telegram-default',
              name: 'Telegram Bot',
              type: 'telegram',
              enabled: false,
              icon: 'MessageCircle',
              description: 'Configure seu bot Telegram no Workspace Admin → Integrações → Comunicação',
              status: 'not_configured',
              messageCount: 0,
              lastMessage: 'Não configurado',
              lastActivity: 'Nunca',
              features: ['Bot automatizado', 'Notificações']
            }
          ];

          console.log('📡 [OmniBridge] No communication channels found, using default structure');
          console.log('📡 [OmniBridge] Available integration categories:', integrations.map(i => i.category));

          res.json({
            success: true,
            data: defaultChannels,
            count: defaultChannels.length,
            message: 'Configure canais de comunicação no Workspace Admin → Integrações → Comunicação'
          });
          return;
        }

        console.log('✅ [OmniBridge] Returning channels:', channels.length);
        channels.forEach(channel => {
          console.log(`✅ [OmniBridge] Channel: ${channel.name} (${channel.type}) - Status: ${channel.status}`);
        });

        res.json({
          success: true,
          data: channels,
          count: channels.length
        });

      } catch (storageError) {
        console.error('❌ [OmniBridge] Storage error:', storageError);
        res.status(500).json({
          error: 'Failed to get channels from storage',
          message: storageError instanceof Error ? storageError.message : 'Storage error'
        });
      }
    } catch (error) {
      console.error('[OmniBridge] Error getting channels:', error);
      res.status(500).json({
        error: 'Failed to get channels',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private mapIntegrationType(integrationId: string, integrationName: string): 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat' {
    const id = integrationId.toLowerCase();
    const name = integrationName.toLowerCase();

    if (id.includes('email') || id.includes('gmail') || id.includes('outlook') || id.includes('imap') || name.includes('email') || name.includes('mail')) {
      return 'email';
    }
    if (id.includes('whatsapp') || name.includes('whatsapp')) {
      return 'whatsapp';
    }
    if (id.includes('telegram') || name.includes('telegram')) {
      return 'telegram';
    }
    if (id.includes('sms') || id.includes('twilio') || name.includes('sms')) {
      return 'sms';
    }
    if (name.includes('chat') || name.includes('slack') || name.includes('discord') || name.includes('messenger')) {
      return 'chat';
    }
    return 'chat';
  }

  private getChannelIcon(integrationId: string, integrationName: string): string {
    const id = integrationId.toLowerCase();
    const name = integrationName.toLowerCase();

    if (id.includes('email') || id.includes('gmail') || id.includes('outlook') || id.includes('imap') || name.includes('email') || name.includes('mail')) {
      return 'Mail';
    }
    if (id.includes('whatsapp') || name.includes('whatsapp')) {
      return 'MessageSquare';
    }
    if (id.includes('telegram') || name.includes('telegram')) {
      return 'MessageCircle';
    }
    if (id.includes('sms') || id.includes('twilio') || name.includes('sms')) {
      return 'Phone';
    }
    if (name.includes('chat') || name.includes('slack') || name.includes('discord') || name.includes('messenger')) {
      return 'MessageSquare';
    }
    return 'MessageSquare';
  }

  private getDefaultFeatures(channelType: string): string[] {
    switch (channelType) {
      case 'email':
        return ['Auto-criação de tickets', 'Sincronização de emails'];
      case 'whatsapp':
        return ['Mensagens automáticas', 'Templates WhatsApp'];
      case 'telegram':
        return ['Bot automatizado', 'Notificações'];
      case 'sms':
        return ['Envio de SMS', 'Confirmação de entrega'];
      case 'chat':
        return ['Atendimento em tempo real', 'Histórico de conversas'];
      default:
        return [];
    }
  }

  async toggleChannel(req: Request, res: Response): Promise<void> {
    try {
      const { channelId } = req.params;
      const { enabled } = req.body;
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      console.log(`🔄 [OmniBridge] Toggling channel ${channelId} to ${enabled ? 'enabled' : 'disabled'} for tenant ${tenantId}`);

      // Use the storage to update the integration status
      const { storage } = await import('../../../storage-simple');

      try {
        // Update the integration status
        await storage.updateIntegrationStatus(tenantId, channelId, enabled);

        console.log(`✅ [OmniBridge] Channel ${channelId} successfully ${enabled ? 'enabled' : 'disabled'}`);

        res.json({
          success: true,
          data: {
            channelId,
            enabled,
            status: enabled ? 'connected' : 'disconnected'
          },
          message: `Canal ${enabled ? 'ativado' : 'desativado'} com sucesso`
        });
      } catch (storageError) {
        console.error('❌ [OmniBridge] Storage error while toggling channel:', storageError);
        res.status(500).json({
          error: 'Failed to update channel status',
          message: storageError instanceof Error ? storageError.message : 'Storage error'
        });
      }
    } catch (error) {
      console.error('[OmniBridge] Error toggling channel:', error);
      res.status(500).json({
        error: 'Failed to toggle channel',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { limit, offset, channelId, status, priority } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      const messages = await this.getMessagesUseCase.execute({
        tenantId,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        channelId: channelId as string,
        status: status as string,
        priority: priority as string
      });

      res.json({
        success: true,
        messages,
        count: messages.length
      });
    } catch (error) {
      console.error('[OmniBridge] Error getting messages:', error);
      res.status(500).json({
        error: 'Failed to get messages',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async processMessage(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { messageId } = req.params;
      const { action } = req.body;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      if (!['read', 'processed'].includes(action)) {
        res.status(400).json({ error: 'Invalid action. Must be "read" or "processed"' });
        return;
      }

      const result = await this.processMessageUseCase.execute(messageId, tenantId, action);

      res.json({
        success: result,
        message: `Message marked as ${action} successfully`
      });
    } catch (error) {
      console.error('[OmniBridge] Error processing message:', error);
      res.status(500).json({
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getInboxStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      // Para implementação futura - obter estatísticas do inbox
      res.json({
        success: true,
        stats: {
          totalMessages: 0,
          unreadMessages: 0,
          channelStats: []
        }
      });
    } catch (error) {
      console.error('[OmniBridge] Error getting inbox stats:', error);
      res.status(500).json({
        error: 'Failed to get inbox stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}