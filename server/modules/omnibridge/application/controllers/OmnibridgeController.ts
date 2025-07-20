// =====================================================
// OMNIBRIDGE CONTROLLER
// REST API controller for unified communication management
// =====================================================

import { Request, Response } from 'express';
import { DrizzleOmnibridgeRepository } from '../../infrastructure/repositories/DrizzleOmnibridgeRepository';
import { 
  insertOmnibridgeChannelSchema, 
  updateOmnibridgeChannelSchema,
  insertOmnibridgeProcessingRuleSchema,
  updateOmnibridgeProcessingRuleSchema,
  insertOmnibridgeResponseTemplateSchema,
  updateOmnibridgeResponseTemplateSchema,
  insertOmnibridgeSignatureSchema,
  updateOmnibridgeSignatureSchema
} from '@shared/schema';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

export class OmnibridgeController {
  private repository: DrizzleOmnibridgeRepository;

  constructor() {
    this.repository = new DrizzleOmnibridgeRepository();
  }

  // =====================================================
  // COMMUNICATION CHANNELS
  // =====================================================

  async getChannels(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { 
        channelType, 
        isActive, 
        isMonitoring, 
        healthStatus 
      } = req.query;

      const channels = await this.repository.getChannels(tenantId, {
        channelType: channelType as any,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isMonitoring: isMonitoring === 'true' ? true : isMonitoring === 'false' ? false : undefined,
        healthStatus: healthStatus as string
      });

      console.log(`📡 OmniBridge channels API Response:`, {
        success: true,
        dataLength: channels.length,
        firstChannel: channels[0] || null
      });

      res.json({ success: true, data: channels });
    } catch (error) {
      console.error('Error fetching OmniBridge channels:', error);
      res.status(500).json({ 
        message: 'Failed to fetch communication channels',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createChannel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const validatedData = insertOmnibridgeChannelSchema.parse(req.body);
      const channel = await this.repository.createChannel(tenantId, validatedData);

      res.status(201).json({ success: true, data: channel });
    } catch (error) {
      console.error('Error creating communication channel:', error);
      res.status(500).json({ 
        message: 'Failed to create communication channel',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getChannelById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { channelId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const channel = await this.repository.getChannelById(tenantId, channelId);
      if (!channel) {
        res.status(404).json({ message: 'Channel not found' });
        return;
      }

      res.json({ success: true, data: channel });
    } catch (error) {
      console.error('Error fetching channel:', error);
      res.status(500).json({ 
        message: 'Failed to fetch channel',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateChannel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { channelId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const validatedData = updateOmnibridgeChannelSchema.parse(req.body);
      const channel = await this.repository.updateChannel(tenantId, channelId, validatedData);

      if (!channel) {
        res.status(404).json({ message: 'Channel not found' });
        return;
      }

      res.json({ success: true, data: channel });
    } catch (error) {
      console.error('Error updating channel:', error);
      res.status(500).json({ 
        message: 'Failed to update channel',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteChannel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { channelId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const deleted = await this.repository.deleteChannel(tenantId, channelId);
      if (!deleted) {
        res.status(404).json({ message: 'Channel not found' });
        return;
      }

      res.json({ success: true, message: 'Channel deleted successfully' });
    } catch (error) {
      console.error('Error deleting channel:', error);
      res.status(500).json({ 
        message: 'Failed to delete channel',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // =====================================================
  // UNIFIED INBOX
  // =====================================================

  async getInboxMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { 
        channelId,
        channelType,
        direction,
        priority,
        isRead,
        isProcessed,
        isArchived,
        needsResponse,
        fromDate,
        toDate,
        limit,
        offset,
        search
      } = req.query;

      const messages = await this.repository.getInboxMessages(tenantId, {
        channelId: channelId as string,
        channelType: channelType as any,
        direction: direction as any,
        priority: priority as any,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        isProcessed: isProcessed === 'true' ? true : isProcessed === 'false' ? false : undefined,
        isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
        needsResponse: needsResponse === 'true' ? true : needsResponse === 'false' ? false : undefined,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        search: search as string
      });

      console.log(`📬 OmniBridge inbox API Response:`, {
        success: true,
        dataLength: messages.length,
        firstMessage: messages[0] || null
      });

      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      res.status(500).json({ 
        message: 'Failed to fetch inbox messages',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getInboxMessageById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { messageId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const message = await this.repository.getInboxMessageById(tenantId, messageId);
      if (!message) {
        res.status(404).json({ message: 'Message not found' });
        return;
      }

      res.json({ success: true, data: message });
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({ 
        message: 'Failed to fetch message',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async markMessageAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { messageId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      await this.repository.markMessageAsRead(tenantId, messageId);
      res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ 
        message: 'Failed to mark message as read',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async archiveMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { messageId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      await this.repository.archiveMessage(tenantId, messageId);
      res.json({ success: true, message: 'Message archived successfully' });
    } catch (error) {
      console.error('Error archiving message:', error);
      res.status(500).json({ 
        message: 'Failed to archive message',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async searchMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { query, channelType, fromDate, toDate } = req.body;

      if (!query) {
        res.status(400).json({ message: 'Search query is required' });
        return;
      }

      const messages = await this.repository.searchMessages(tenantId, query, {
        channelType: channelType as any,
        dateRange: fromDate && toDate ? { 
          from: new Date(fromDate), 
          to: new Date(toDate) 
        } : undefined
      });

      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ 
        message: 'Failed to search messages',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { channelId } = req.query;
      const count = await this.repository.getUnreadMessagesCount(tenantId, channelId as string);

      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ 
        message: 'Failed to fetch unread count',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // =====================================================
  // PROCESSING RULES
  // =====================================================

  async getProcessingRules(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { isActive, channelType, actionType, priority } = req.query;

      const rules = await this.repository.getProcessingRules(tenantId, {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        channelType: channelType as any,
        actionType: actionType as string,
        priority: priority ? parseInt(priority as string) : undefined
      });

      res.json({ success: true, data: rules });
    } catch (error) {
      console.error('Error fetching processing rules:', error);
      res.status(500).json({ 
        message: 'Failed to fetch processing rules',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createProcessingRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const validatedData = insertOmnibridgeProcessingRuleSchema.parse(req.body);
      const rule = await this.repository.createProcessingRule(tenantId, validatedData);

      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      console.error('Error creating processing rule:', error);
      res.status(500).json({ 
        message: 'Failed to create processing rule',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateProcessingRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { ruleId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const validatedData = updateOmnibridgeProcessingRuleSchema.parse(req.body);
      const rule = await this.repository.updateProcessingRule(tenantId, ruleId, validatedData);

      if (!rule) {
        res.status(404).json({ message: 'Processing rule not found' });
        return;
      }

      res.json({ success: true, data: rule });
    } catch (error) {
      console.error('Error updating processing rule:', error);
      res.status(500).json({ 
        message: 'Failed to update processing rule',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteProcessingRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { ruleId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const deleted = await this.repository.deleteProcessingRule(tenantId, ruleId);
      if (!deleted) {
        res.status(404).json({ message: 'Processing rule not found' });
        return;
      }

      res.json({ success: true, message: 'Processing rule deleted successfully' });
    } catch (error) {
      console.error('Error deleting processing rule:', error);
      res.status(500).json({ 
        message: 'Failed to delete processing rule',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // =====================================================
  // RESPONSE TEMPLATES
  // =====================================================

  async getResponseTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { templateType, category, channelType, isActive, languageCode } = req.query;

      const templates = await this.repository.getResponseTemplates(tenantId, {
        templateType: templateType as string,
        category: category as string,
        channelType: channelType as any,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        languageCode: languageCode as string
      });

      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching response templates:', error);
      res.status(500).json({ 
        message: 'Failed to fetch response templates',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createResponseTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const validatedData = insertOmnibridgeResponseTemplateSchema.parse(req.body);
      const template = await this.repository.createResponseTemplate(tenantId, validatedData);

      res.status(201).json({ success: true, data: template });
    } catch (error) {
      console.error('Error creating response template:', error);
      res.status(500).json({ 
        message: 'Failed to create response template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // =====================================================
  // TEAM SIGNATURES
  // =====================================================

  async getSignatures(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { supportGroup, isActive, isDefault } = req.query;

      const signatures = await this.repository.getSignatures(tenantId, {
        supportGroup: supportGroup as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isDefault: isDefault === 'true' ? true : isDefault === 'false' ? false : undefined
      });

      res.json({ success: true, data: signatures });
    } catch (error) {
      console.error('Error fetching signatures:', error);
      res.status(500).json({ 
        message: 'Failed to fetch signatures',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // =====================================================
  // ANALYTICS AND MONITORING
  // =====================================================

  async getChannelAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { from, to, channelId, channelType, groupBy } = req.query;

      if (!from || !to) {
        res.status(400).json({ message: 'Date range (from and to) is required' });
        return;
      }

      const analytics = await this.repository.getAnalytics(tenantId, {
        from: new Date(from as string),
        to: new Date(to as string),
        channelId: channelId as string,
        channelType: channelType as any,
        groupBy: groupBy as any
      });

      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error('Error fetching channel analytics:', error);
      res.status(500).json({ 
        message: 'Failed to fetch channel analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDashboardMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { from, to } = req.query;

      if (!from || !to) {
        res.status(400).json({ message: 'Date range (from and to) is required' });
        return;
      }

      const metrics = await this.repository.getDashboardMetrics(tenantId, {
        from: new Date(from as string),
        to: new Date(to as string)
      });

      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ 
        message: 'Failed to fetch dashboard metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProcessingLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { channelId, channelType, processingStatus, fromDate, toDate, limit, offset } = req.query;

      const logs = await this.repository.getProcessingLogs(tenantId, {
        channelId: channelId as string,
        channelType: channelType as any,
        processingStatus: processingStatus as any,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({ success: true, data: logs });
    } catch (error) {
      console.error('Error fetching processing logs:', error);
      res.status(500).json({ 
        message: 'Failed to fetch processing logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async performHealthCheck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const healthCheck = await this.repository.performHealthCheck(tenantId);
      res.json({ success: true, data: healthCheck });
    } catch (error) {
      console.error('Error performing health check:', error);
      res.status(500).json({ 
        message: 'Failed to perform health check',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}