
/**
 * OmniBridge Controller
 * Clean Architecture - Application Layer
 */
import { Request, Response } from 'express';
import { SyncChannelsUseCase } from '../use-cases/SyncChannelsUseCase';
import { ProcessInboxMessagesUseCase } from '../use-cases/ProcessInboxMessagesUseCase';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { IUnifiedMessageRepository } from '../../domain/repositories/IUnifiedMessageRepository';
import { IProcessingRuleRepository } from '../../domain/repositories/IProcessingRuleRepository';
import { IMessageTemplateRepository } from '../../domain/repositories/IMessageTemplateRepository';

export class OmniBridgeController {
  constructor(
    private channelRepository: IChannelRepository,
    private messageRepository: IUnifiedMessageRepository,
    private ruleRepository: IProcessingRuleRepository,
    private templateRepository: IMessageTemplateRepository
  ) {}

  async getChannels(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const channels = await this.channelRepository.findAll(tenantId);
      res.json({ success: true, channels });
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch channels' });
    }
  }

  async syncChannels(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      console.log(`🔄 Starting channel sync for tenant: ${tenantId}`);
      
      const syncUseCase = new SyncChannelsUseCase(this.channelRepository);
      const channels = await syncUseCase.execute(tenantId);
      
      console.log(`✅ Synchronized ${channels.length} channels successfully`);
      
      res.json({ 
        success: true, 
        message: `Synchronized ${channels.length} channels`,
        channels,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error syncing channels:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to sync channels',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getInbox(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const { 
        limit = 50, 
        offset = 0, 
        status, 
        channelType, 
        priority 
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        status: status as string,
        channelType: channelType as string,
        priority: priority as string
      };

      const messages = await this.messageRepository.findAll(tenantId, options);
      const unreadCount = await this.messageRepository.getUnreadCount(tenantId);
      const countByChannel = await this.messageRepository.getCountByChannel(tenantId);

      res.json({ 
        success: true, 
        messages,
        unreadCount,
        countByChannel,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: messages.length
        }
      });
    } catch (error) {
      console.error('Error fetching inbox:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch inbox' });
    }
  }

  async markMessageAsRead(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { messageId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      await this.messageRepository.markAsRead(tenantId, messageId);
      res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark message as read' });
    }
  }

  async archiveMessage(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { messageId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      await this.messageRepository.archive(tenantId, messageId);
      res.json({ success: true, message: 'Message archived' });
    } catch (error) {
      console.error('Error archiving message:', error);
      res.status(500).json({ success: false, message: 'Failed to archive message' });
    }
  }

  async processMessages(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const processUseCase = new ProcessInboxMessagesUseCase(
        this.messageRepository,
        this.ruleRepository
      );
      
      const result = await processUseCase.execute(tenantId);
      
      res.json({ 
        success: true, 
        message: 'Messages processed successfully',
        result 
      });
    } catch (error) {
      console.error('Error processing messages:', error);
      res.status(500).json({ success: false, message: 'Failed to process messages' });
    }
  }

  async getProcessingRules(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const rules = await this.ruleRepository.findAll(tenantId);
      res.json({ success: true, rules });
    } catch (error) {
      console.error('Error fetching processing rules:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch processing rules' });
    }
  }

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const templates = await this.templateRepository.findAll(tenantId);
      res.json({ success: true, templates });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch templates' });
    }
  }

  async getMonitoringStatus(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const channels = await this.channelRepository.findAll(tenantId);
      const unreadCount = await this.messageRepository.getUnreadCount(tenantId);
      const countByChannel = await this.messageRepository.getCountByChannel(tenantId);
      
      const healthyChannels = channels.filter(c => c.isHealthy()).length;
      const activeChannels = channels.filter(c => c.isActive).length;
      const connectedChannels = channels.filter(c => c.isConnected).length;

      res.json({
        success: true,
        monitoring: {
          totalChannels: channels.length,
          activeChannels,
          connectedChannels,
          healthyChannels,
          unreadMessages: unreadCount,
          messagesByChannel: countByChannel,
          systemStatus: healthyChannels === activeChannels ? 'healthy' : 'degraded',
          lastSync: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching monitoring status:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch monitoring status' });
    }
  }
}
