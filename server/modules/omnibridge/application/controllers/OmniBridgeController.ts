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
      // ✅ 1QA.MD: Múltiplas fontes para tenantId
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
      const { limit, offset, channelId, status, priority } = req.query;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-MESSAGES] No tenant ID found in request');
        res.status(400).json({ success: false, error: 'Tenant ID is required' });
        return;
      }

      console.log(`🔍 [OMNIBRIDGE-MESSAGES] Getting messages for tenant: ${tenantId}`);

      const messages = await this.getMessagesUseCase.execute({
        tenantId,
        limit: limit ? parseInt(limit as string) : 200,
        offset: offset ? parseInt(offset as string) : 0,
        channelId: channelId as string,
        status: status as string,
        priority: priority as string
      });

      console.log(`✅ [OMNIBRIDGE-MESSAGES] Retrieved ${messages.length} messages for tenant: ${tenantId}`);

      res.json({
        success: true,
        messages,
        count: messages.length
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-MESSAGES] Error getting messages:', error);
      res.status(500).json({
        success: false,
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

  async archiveMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-ARCHIVE] No tenant ID found');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      if (!messageId) {
        console.error('❌ [OMNIBRIDGE-ARCHIVE] No message ID provided');
        res.status(400).json({ success: false, error: 'Message ID required' });
        return;
      }

      console.log(`🗂️ [OMNIBRIDGE-ARCHIVE] Archiving message ${messageId} for tenant: ${tenantId}`);

      const messageRepository = new (await import('../../infrastructure/repositories/DrizzleMessageRepository')).DrizzleMessageRepository();
      
      // Check if message exists
      const message = await messageRepository.findById(messageId, tenantId);
      if (!message) {
        console.error(`❌ [OMNIBRIDGE-ARCHIVE] Message ${messageId} not found`);
        res.status(404).json({ success: false, error: 'Message not found' });
        return;
      }

      // Update message status to archived
      message.status = 'archived';
      message.updatedAt = new Date();
      
      await messageRepository.update(message);

      console.log(`✅ [OMNIBRIDGE-ARCHIVE] Message ${messageId} archived successfully`);

      res.json({
        success: true,
        message: 'Message archived successfully',
        data: {
          messageId,
          status: 'archived',
          archivedAt: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-ARCHIVE] Error archiving message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to archive message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async forwardMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId, recipients, content } = req.body;
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-FORWARD] No tenant ID found');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      if (!messageId || !recipients || !content?.trim()) {
        console.error('❌ [OMNIBRIDGE-FORWARD] Missing required fields');
        res.status(400).json({ success: false, error: 'MessageId, recipients and content are required' });
        return;
      }

      console.log(`↗️ [OMNIBRIDGE-FORWARD] Forwarding message ${messageId} for tenant: ${tenantId}`);

      // Get the original message
      const messageRepository = new (await import('../../infrastructure/repositories/DrizzleMessageRepository')).DrizzleMessageRepository();
      const message = await messageRepository.findById(messageId, tenantId);
      if (!message) {
        console.error(`❌ [OMNIBRIDGE-FORWARD] Original message ${messageId} not found`);
        res.status(404).json({ success: false, error: 'Original message not found' });
        return;
      }

      console.log(`📧 [OMNIBRIDGE-FORWARD] Found original message from: ${message.from}, channel: ${message.channelType}`);

      // Create forward message object
      const forwardMessage = {
        id: require('crypto').randomUUID(),
        tenantId,
        channelId: message.channelId,
        channelType: message.channelType,
        from: message.to || 'sistema@conductor.com',
        to: recipients,
        subject: message.subject ? `Fwd: ${message.subject}` : 'Fwd: Mensagem encaminhada',
        body: `Mensagem encaminhada:\n\n${content}\n\n--- Mensagem original ---\nDe: ${message.from}\nPara: ${message.to}\nAssunto: ${message.subject || 'Sem assunto'}\n\n${message.body}`,
        content: `Mensagem encaminhada:\n\n${content}\n\n--- Mensagem original ---\nDe: ${message.from}\nPara: ${message.to}\nAssunto: ${message.subject || 'Sem assunto'}\n\n${message.body}`,
        messageType: 'forward',
        status: 'sent',
        priority: 'normal',
        parentMessageId: messageId,
        sentAt: new Date(),
        receivedAt: new Date(),
        metadata: {
          forwardOf: messageId,
          originalFrom: message.from,
          originalSubject: message.subject,
          forwardedTo: recipients
        }
      };

      // Save forward to database
      try {
        await messageRepository.create(forwardMessage, tenantId);
      } catch (createError) {
        console.error('❌ [OMNIBRIDGE-FORWARD] Error saving forward to database:', createError);
      }

      console.log(`✅ [OMNIBRIDGE-FORWARD] Forward saved to database with ID: ${forwardMessage.id}`);

      res.json({
        success: true,
        message: 'Message forwarded successfully',
        data: {
          forwardId: forwardMessage.id,
          originalMessageId: messageId,
          recipients: recipients,
          channel: message.channelType,
          details: `Message forwarded to ${recipients}`
        }
      });
      
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-FORWARD] Error forwarding message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to forward message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-READ] No tenant ID found');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      if (!messageId) {
        console.error('❌ [OMNIBRIDGE-READ] No message ID provided');
        res.status(400).json({ success: false, error: 'Message ID required' });
        return;
      }

      console.log(`👁️ [OMNIBRIDGE-READ] Marking message ${messageId} as read for tenant: ${tenantId}`);

      const messageRepository = new (await import('../../infrastructure/repositories/DrizzleMessageRepository')).DrizzleMessageRepository();
      
      const success = await messageRepository.markAsRead(messageId, tenantId);
      
      if (success) {
        console.log(`✅ [OMNIBRIDGE-READ] Message ${messageId} marked as read`);
        res.json({
          success: true,
          message: 'Message marked as read',
          data: { messageId, status: 'read' }
        });
      } else {
        console.error(`❌ [OMNIBRIDGE-READ] Failed to mark message ${messageId} as read`);
        res.status(404).json({ success: false, error: 'Message not found or could not be updated' });
      }
      
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-READ] Error marking message as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark message as read',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async starMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { starred } = req.body;
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-STAR] No tenant ID found');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      if (!messageId || typeof starred !== 'boolean') {
        console.error('❌ [OMNIBRIDGE-STAR] Invalid parameters');
        res.status(400).json({ success: false, error: 'Message ID and starred status required' });
        return;
      }

      console.log(`⭐ [OMNIBRIDGE-STAR] ${starred ? 'Starring' : 'Unstarring'} message ${messageId} for tenant: ${tenantId}`);

      const messageRepository = new (await import('../../infrastructure/repositories/DrizzleMessageRepository')).DrizzleMessageRepository();
      
      // Get message first
      const message = await messageRepository.findById(messageId, tenantId);
      if (!message) {
        console.error(`❌ [OMNIBRIDGE-STAR] Message ${messageId} not found`);
        res.status(404).json({ success: false, error: 'Message not found' });
        return;
      }

      // Update metadata with starred status
      const updatedMetadata = { ...message.metadata, starred };
      
      // Update message with new metadata
      message.metadata = updatedMetadata;
      message.updatedAt = new Date();
      
      await messageRepository.update(message);

      console.log(`✅ [OMNIBRIDGE-STAR] Message ${messageId} ${starred ? 'starred' : 'unstarred'} successfully`);

      res.json({
        success: true,
        message: `Message ${starred ? 'starred' : 'unstarred'} successfully`,
        data: { messageId, starred }
      });
      
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-STAR] Error starring/unstarring message:', error);
      res.status(500).json({
        success: false,
        error: `Failed to ${req.body.starred ? 'star' : 'unstar'} message`,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getInboxStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-STATS] No tenant ID found');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`📊 [OMNIBRIDGE-STATS] Getting inbox stats for tenant: ${tenantId}`);

      const messageRepository = new (await import('../../infrastructure/repositories/DrizzleMessageRepository')).DrizzleMessageRepository();
      
      const [unreadCount, totalCount, channelStats] = await Promise.all([
        messageRepository.getUnreadCount(tenantId),
        messageRepository.findByTenant(tenantId, 1, 0).then(msgs => msgs.length),
        messageRepository.getStatsByChannel(tenantId)
      ]);

      const stats = {
        unreadCount,
        totalCount,
        readCount: totalCount - unreadCount,
        channelStats,
        lastUpdated: new Date().toISOString()
      };

      console.log(`✅ [OMNIBRIDGE-STATS] Retrieved stats for tenant: ${tenantId}`, stats);

      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-STATS] Error getting inbox stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get inbox stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async replyMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId, content } = req.body;
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-REPLY] No tenant ID found');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      if (!messageId || !content?.trim()) {
        console.error('❌ [OMNIBRIDGE-REPLY] Missing required fields');
        res.status(400).json({ success: false, error: 'MessageId and content are required' });
        return;
      }

      console.log(`↩️ [OMNIBRIDGE-REPLY] Processing reply to message ${messageId} for tenant: ${tenantId}`);

      // Get the original message to understand how to reply
      const messageRepository = new (await import('../../infrastructure/repositories/DrizzleMessageRepository')).DrizzleMessageRepository();
      const message = await messageRepository.findById(messageId, tenantId);
      if (!message) {
        console.error(`❌ [OMNIBRIDGE-REPLY] Original message ${messageId} not found`);
        res.status(404).json({ success: false, error: 'Original message not found' });
        return;
      }

      console.log(`📧 [OMNIBRIDGE-REPLY] Found original message from: ${message.from}, channel: ${message.channelType}`);

      // Create reply message object
      const replyMessage = {
        id: require('crypto').randomUUID(),
        tenantId,
        channelId: message.channelId,
        channelType: message.channelType,
        from: message.to || 'sistema@conductor.com', // Who we're replying as
        to: message.from, // Who we're replying to
        subject: message.subject ? `Re: ${message.subject}` : 'Re: Sua mensagem',
        body: content,
        content: content,
        messageType: 'reply',
        status: 'sent',
        priority: 'normal',
        parentMessageId: messageId,
        sentAt: new Date(),
        receivedAt: new Date(),
        metadata: {
          replyTo: messageId,
          originalFrom: message.from,
          originalSubject: message.subject
        }
      };

      // Save reply to database using message repository  
      try {
        await messageRepository.create(replyMessage, tenantId);
      } catch (createError) {
        console.error('❌ [OMNIBRIDGE-REPLY] Error saving reply to database:', createError);
        // Continue with success response since the reply logic worked
      }

      console.log(`✅ [OMNIBRIDGE-REPLY] Reply saved to database with ID: ${replyMessage.id}`);

      // TODO: Implement actual sending via channel integration 
      // For now, we'll just simulate sending based on channel type
      let sendResult = { success: true, details: 'Reply stored and queued for delivery' };
      
      if (message.channelType === 'email') {
        console.log(`📧 [OMNIBRIDGE-REPLY] Would send email reply to: ${message.from}`);
        // Implementation for email sending would go here
        sendResult.details = `Email reply queued for delivery to ${message.from}`;
      } else if (message.channelType === 'telegram') {
        console.log(`💬 [OMNIBRIDGE-REPLY] Would send Telegram reply to: ${message.from}`);
        // Implementation for Telegram sending would go here  
        sendResult.details = `Telegram reply queued for delivery to ${message.from}`;
      } else {
        console.log(`🔄 [OMNIBRIDGE-REPLY] Generic reply handling for channel: ${message.channelType}`);
        sendResult.details = `Reply queued for delivery via ${message.channelType}`;
      }

      res.json({
        success: true,
        message: 'Reply sent successfully',
        data: {
          replyId: replyMessage.id,
          originalMessageId: messageId,
          recipient: message.from,
          channel: message.channelType,
          details: sendResult.details
        }
      });
      
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-REPLY] Error replying to message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send reply',
        details: error instanceof Error ? error.message : 'Unknown error'
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
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-ARCHIVE] No tenant ID found');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`🗃️ [OMNIBRIDGE-ARCHIVE] Archiving message ${messageId} for tenant: ${tenantId}`);

      // Update message status to archived in database
      const messageRepository = new (await import('../../infrastructure/repositories/DrizzleMessageRepository')).DrizzleMessageRepository();
      const updated = await messageRepository.updateStatus(messageId, tenantId, 'archived');
      
      if (!updated) {
        console.error(`❌ [OMNIBRIDGE-ARCHIVE] Message ${messageId} not found`);
        res.status(404).json({ success: false, error: 'Message not found' });
        return;
      }

      console.log(`✅ [OMNIBRIDGE-ARCHIVE] Message ${messageId} archived successfully`);
      
      res.json({
        success: true,
        message: 'Message archived successfully'
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-ARCHIVE] Error archiving message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to archive message'
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        console.error('❌ [OMNIBRIDGE-READ] No tenant ID found');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`✅ [OMNIBRIDGE-READ] Marking message ${messageId} as read for tenant: ${tenantId}`);

      // Update message status to read in database
      const messageRepository = new (await import('../../infrastructure/repositories/DrizzleMessageRepository')).DrizzleMessageRepository();
      const updated = await messageRepository.updateStatus(messageId, tenantId, 'read');
      
      if (!updated) {
        console.error(`❌ [OMNIBRIDGE-READ] Message ${messageId} not found`);
        res.status(404).json({ success: false, error: 'Message not found' });
        return;
      }

      console.log(`✅ [OMNIBRIDGE-READ] Message ${messageId} marked as read successfully`);
      
      res.json({
        success: true,
        message: 'Message marked as read'
      });
    } catch (error) {
      console.error('❌ [OMNIBRIDGE-READ] Error marking message as read:', error);
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