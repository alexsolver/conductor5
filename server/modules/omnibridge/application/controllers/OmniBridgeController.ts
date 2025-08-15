
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

      // Get communication channels from tenant integrations
      const { storage } = await import('../../../storage-simple');
      
      try {
        // Get all integrations for the tenant
        const integrations = await storage.getTenantIntegrations(tenantId);
        console.log('📡 [OmniBridge] Found integrations:', integrations.length);

        // Filter for communication category
        const communicationChannels = integrations.filter((integration: any) => {
          const category = integration.category?.toLowerCase() || '';
          return category === 'comunicação' || category === 'communication' || category === 'comunicacao';
        });

        console.log('📡 [OmniBridge] Communication channels found:', communicationChannels.length);

        // Map to OmniBridge channel format
        const channels = communicationChannels.map((integration: any) => ({
          id: integration.id,
          name: integration.name,
          type: this.mapIntegrationType(integration.id),
          enabled: integration.enabled === true || integration.status === 'connected',
          icon: this.getChannelIcon(integration.id),
          description: integration.description || 'Canal de comunicação',
          status: integration.status || (integration.enabled ? 'connected' : 'disconnected'),
          messageCount: 0,
          lastMessage: integration.status === 'connected' ? 'Ativo' : 'Aguardando configuração',
          lastActivity: integration.status === 'connected' ? 'Recente' : 'Nunca',
          features: integration.features || []
        }));

        // If no channels found, provide default structure
        if (channels.length === 0) {
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
            }
          ];

          console.log('📡 [OmniBridge] Using default channels structure');
          
          res.json({
            success: true,
            data: defaultChannels,
            count: defaultChannels.length,
            message: 'Configure canais de comunicação no Workspace Admin → Integrações → Comunicação'
          });
          return;
        }

        console.log('✅ [OmniBridge] Returning channels:', channels.length);

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

  private mapIntegrationType(integrationId: string): 'email' | 'whatsapp' | 'telegram' | 'sms' | 'chat' {
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
    return 'chat';
  }

  private getChannelIcon(integrationId: string): string {
    const id = integrationId.toLowerCase();
    if (id.includes('email') || id.includes('gmail') || id.includes('outlook') || id.includes('imap')) {
      return 'Mail';
    }
    if (id.includes('whatsapp')) {
      return 'MessageSquare';
    }
    if (id.includes('telegram')) {
      return 'MessageCircle';
    }
    if (id.includes('sms') || id.includes('twilio')) {
      return 'Phone';
    }
    return 'MessageSquare';
  }

  async toggleChannel(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { channelId } = req.params;
      const { isEnabled } = req.body;
      
      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      if (typeof isEnabled !== 'boolean') {
        res.status(400).json({ error: 'isEnabled must be a boolean' });
        return;
      }

      const result = await this.toggleChannelUseCase.execute(channelId, tenantId, isEnabled);
      
      res.json({
        success: result,
        message: `Channel ${isEnabled ? 'enabled' : 'disabled'} successfully`
      });
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
