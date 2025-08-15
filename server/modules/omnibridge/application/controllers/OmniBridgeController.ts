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
      // ✅ TELEGRAM FIX: Múltiplas fontes para tenantId
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-CHANNELS] No tenant ID found in request');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`🔍 [OMNIBRIDGE-CHANNELS] Getting channels for tenant: ${tenantId}`);

      // ✅ TELEGRAM FIX: Force sync integrations to channels first
      try {
        const { IntegrationChannelSync } = await import('../../../omnibridge/infrastructure/services/IntegrationChannelSync');
        const { storage } = await import('../../../../storage-simple');
        const { DrizzleChannelRepository } = await import('../../../omnibridge/infrastructure/repositories/DrizzleChannelRepository');

        const channelRepository = new DrizzleChannelRepository();
        const syncService = new IntegrationChannelSync(channelRepository, storage);
        await syncService.syncIntegrationsToChannels(tenantId);
        console.log('✅ [OMNIBRIDGE-CONTROLLER] Auto-sync completed successfully');
      } catch (syncError) {
        console.warn('⚠️ [OMNIBRIDGE-CONTROLLER] Auto-sync failed, continuing with existing channels:', syncError);
      }

      const channels = await this.getChannelsUseCase.execute(tenantId);
      console.log(`✅ [OMNIBRIDGE-CONTROLLER] Retrieved ${channels.length} channels for tenant: ${tenantId}`);

      res.json({ success: true, data: channels });
    } catch (error) {
      console.error('[OMNIBRIDGE-CONTROLLER] Error getting channels:', error);
      res.status(500).json({ success: false, error: 'Failed to get channels' });
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
      // ✅ TELEGRAM FIX: Múltiplas fontes para tenantId
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
      const { limit, offset, channelId, status, priority } = req.query;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-MESSAGES] No tenant ID found in request');
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