
import { Request, Response } from 'express';
import { GetChannelsUseCase } from '../use-cases/GetChannelsUseCase';
import { ToggleChannelUseCase } from '../use-cases/ToggleChannelUseCase';
import { GetMessagesUseCase } from '../use-cases/GetMessagesUseCase';
import { ProcessMessageUseCase } from '../use-cases/ProcessMessageUseCase';

export class OmniBridgeController {
  private integrationSync: any;

  constructor(
    private getChannelsUseCase: GetChannelsUseCase,
    private toggleChannelUseCase: ToggleChannelUseCase,
    private getMessagesUseCase: GetMessagesUseCase,
    private processMessageUseCase: ProcessMessageUseCase
  ) {
    this.initIntegrationSync();
  }

  private async initIntegrationSync() {
    const { default: IntegrationChannelSync } = await import('../../infrastructure/services/IntegrationChannelSync');
    this.integrationSync = new IntegrationChannelSync();
  }

  async getChannels(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || (req as any).user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      console.log(`🔍 [OmniBridge] Getting channels for tenant: ${tenantId}`);

      // Sincronizar integrações configuradas como canais
      const channels = await this.integrationSync.syncIntegrationsToChannels(tenantId);

      res.json({
        success: true,
        channels,
        count: channels.length,
        message: `Found ${channels.length} configured communication channels`
      });
    } catch (error) {
      console.error('[OmniBridge] Error getting channels:', error);
      res.status(500).json({
        error: 'Failed to get channels',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async toggleChannel(req: Request, res: Response): Promise<void> {
    try {
      const { channelId } = req.params;
      const { enabled } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string || (req as any).user?.tenantId;

      if (!tenantId || !channelId) {
        res.status(400).json({ error: 'Tenant ID and Channel ID are required' });
        return;
      }

      console.log(`🔄 [OmniBridge] Toggling channel ${channelId} to ${enabled} for tenant ${tenantId}`);

      // Validar integração antes de ativar
      if (enabled) {
        const validation = await this.integrationSync.validateIntegrationForOmniBridge(tenantId, channelId);
        
        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            message: 'Canal não pode ser ativado devido a problemas de configuração',
            errors: validation.errors,
            recommendations: validation.recommendations
          });
          return;
        }
      }

      const result = await this.integrationSync.toggleChannel(tenantId, channelId, enabled);

      if (result) {
        res.json({
          success: true,
          message: `Canal ${channelId} ${enabled ? 'ativado' : 'desativado'} com sucesso`,
          channelId,
          enabled
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Falha ao alterar status do canal'
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
