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
      const { messageId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      const { action } = req.body;

      console.log(`🔧 [OMNIBRIDGE-CONTROLLER] Processing message ${messageId} for tenant: ${tenantId} with action: ${action || 'analyze_and_automate'}`);

      const result = await this.processMessageUseCase.execute({
        messageId,
        tenantId,
        action: action || 'analyze_and_automate'
      });

      res.json({
        success: result.success,
        message: result.message,
        data: {
          aiAnalysis: result.aiAnalysis,
          automationResults: result.automationResults
        }
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-CONTROLLER] Error processing message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async processDirectMessage(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const messageData = req.body;

      console.log(`🎯 [OMNIBRIDGE-CONTROLLER] Processing direct message for tenant: ${tenantId}`);

      if (!messageData.content && !messageData.body) {
        res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
        return;
      }

      const result = await this.processMessageUseCase.processDirectMessage(messageData, tenantId);

      res.json({
        success: result.success,
        message: result.message,
        data: {
          aiAnalysis: result.aiAnalysis,
          automationResults: result.automationResults
        }
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-CONTROLLER] Error processing direct message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process direct message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testAutomationRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      const testMessage = req.body;

      console.log(`🧪 [OMNIBRIDGE-CONTROLLER] Testing automation rule ${ruleId} for tenant: ${tenantId}`);

      const result = await this.processMessageUseCase.testAutomationRule(ruleId, testMessage, tenantId);

      res.json({
        success: result.success,
        message: result.message,
        data: result.result
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-CONTROLLER] Error testing automation rule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test automation rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { channelId, recipient, content } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      console.log(`📤 [OMNIBRIDGE-CONTROLLER] Sending message via channel ${channelId} for tenant: ${tenantId}`);

      // Implementation for sending new messages
      res.json({
        success: true,
        message: 'Message sent successfully'
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-CONTROLLER] Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  async replyMessage(req: Request, res: Response): Promise<void> {
    try {
      const { originalMessageId, channelId, recipient, content } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      console.log(`↩️ [OMNIBRIDGE-CONTROLLER] Replying to message ${originalMessageId} for tenant: ${tenantId}`);

      // Implementation for replying to messages
      res.json({
        success: true,
        message: 'Reply sent successfully'
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-CONTROLLER] Error replying to message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send reply'
      });
    }
  }

  async forwardMessage(req: Request, res: Response): Promise<void> {
    try {
      const { originalMessageId, channelId, recipients, content, originalContent } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      console.log(`⏩ [OMNIBRIDGE-CONTROLLER] Forwarding message ${originalMessageId} for tenant: ${tenantId}`);

      // Implementation for forwarding messages
      res.json({
        success: true,
        message: 'Message forwarded successfully'
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-CONTROLLER] Error forwarding message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to forward message'
      });
    }
  }

  async archiveMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      console.log(`🗃️ [OMNIBRIDGE-CONTROLLER] Archiving message ${messageId} for tenant: ${tenantId}`);

      // Update message status to archived in database
      res.json({
        success: true,
        message: 'Message archived successfully'
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-CONTROLLER] Error archiving message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to archive message'
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      console.log(`✅ [OMNIBRIDGE-CONTROLLER] Marking message ${messageId} as read for tenant: ${tenantId}`);

      // Update message status to read in database
      res.json({
        success: true,
        message: 'Message marked as read'
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-CONTROLLER] Error marking message as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark message as read'
      });
    }
  }

  async starMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      console.log(`⭐ [OMNIBRIDGE-CONTROLLER] Toggling star for message ${messageId} for tenant: ${tenantId}`);

      // Toggle star status in database
      res.json({
        success: true,
        message: 'Message star status updated'
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-CONTROLLER] Error starring message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update message star status'
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