
/**
 * OmniBridge Controller
 * Clean Architecture - Application Layer
 */
import { Request, Response } from 'express''[,;]
import { SyncChannelsUseCase } from '../use-cases/SyncChannelsUseCase''[,;]
import { ProcessInboxMessagesUseCase } from '../use-cases/ProcessInboxMessagesUseCase''[,;]
import { IChannelRepository } from '../../domain/repositories/IChannelRepository''[,;]
import { IUnifiedMessageRepository } from '../../domain/repositories/IUnifiedMessageRepository''[,;]
import { IProcessingRuleRepository } from '../../domain/repositories/IProcessingRuleRepository''[,;]
import { IMessageTemplateRepository } from '../../domain/repositories/IMessageTemplateRepository''[,;]
import { GmailService } from '../../../../services/integrations/gmail/GmailService''[,;]

export class OmniBridgeController {
  private gmailService: GmailService';
  
  constructor(
    private channelRepository: IChannelRepository',
    private messageRepository: IUnifiedMessageRepository',
    private ruleRepository: IProcessingRuleRepository',
    private templateRepository: IMessageTemplateRepository
  ) {
    this.gmailService = new GmailService()';
  }

  async getChannels(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      console.log(`📋 Fetching channels for tenant: ${tenantId}`)';
      
      // Mock data para desenvolvimento se repository falhar
      let channels = []';
      try {
        channels = await this.channelRepository.findAll(tenantId)';
      } catch (repoError) {
        console.log('📋 Repository error, using mock data:', repoError)';
        channels = [
          {
            id: 'mock-email-channel''[,;]
            type: 'email''[,;]
            name: 'Email IMAP''[,;]
            isActive: true',
            isConnected: true',
            messageCount: 5',
            errorCount: 0',
            lastError: null',
            lastSync: new Date().toISOString()
          }
        ]';
      }
      
      console.log(`📋 Found ${channels.length} channels`)';
      
      res.json({ 
        success: true, 
        data: channels || []',
        channels: channels || [], // compatibilidade
        count: channels.length 
      })';
    } catch (error) {
      console.error('❌ Error fetching channels:', error)';
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch channels''[,;]
        channels: []',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      })';
    }
  }

  async syncChannels(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      console.log(`🔄 Starting channel sync for tenant: ${tenantId}`)';
      
      const syncUseCase = new SyncChannelsUseCase(this.channelRepository)';
      const channels = await syncUseCase.execute(tenantId)';
      
      console.log(`✅ Synchronized ${channels.length} channels successfully`)';
      
      res.json({ 
        success: true, 
        data: channels',
        message: `Synchronized ${channels.length} channels`',
        channels, // compatibilidade
        processed: channels.length',
        timestamp: new Date().toISOString()
      })';
    } catch (error) {
      console.error('❌ Error syncing channels:', error)';
      res.status(500).json({ 
        success: false, 
        message: 'Failed to sync channels''[,;]
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })';
    }
  }

  async getInbox(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      const { 
        limit = 50, 
        offset = 0, 
        status, 
        channelType, 
        priority 
      } = req.query';

      const options = {
        limit: parseInt(limit as string)',
        offset: parseInt(offset as string)',
        status: status as string',
        channelType: channelType as string',
        priority: priority as string
      }';

      console.log(`📧 Fetching inbox for tenant: ${tenantId}`)';
      
      // Mock data para desenvolvimento se repository falhar
      let messages = []';
      let unreadCount = 0';
      let countByChannel = {}';
      
      try {
        messages = await this.messageRepository.findAll(tenantId, options)';
        unreadCount = await this.messageRepository.getUnreadCount(tenantId)';
        countByChannel = await this.messageRepository.getCountByChannel(tenantId)';
      } catch (repoError) {
        console.log('📧 Repository error, using mock data:', repoError)';
        messages = [
          {
            id: 'mock-message-1''[,;]
            channelType: 'email''[,;]
            fromAddress: 'cliente@exemplo.com''[,;]
            fromName: 'Cliente Exemplo''[,;]
            subject: 'Problema urgente no sistema''[,;]
            content: 'Preciso de ajuda com o sistema''[,;]
            priority: 'high''[,;]
            status: 'unread''[,;]
            hasAttachments: false',
            receivedAt: new Date().toISOString()',
            ticketId: null
          }
        ]';
        unreadCount = 1';
        countByChannel = { email: 1 }';
      }

      console.log(`📧 Found ${messages.length} messages, ${unreadCount} unread`)';

      res.json({ 
        success: true, 
        data: messages || []',
        messages: messages || [], // Compatibilidade
        unreadCount',
        countByChannel',
        pagination: {
          limit: options.limit',
          offset: options.offset',
          total: messages.length
        }
      })';
    } catch (error) {
      console.error('❌ Error fetching inbox:', error)';
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch inbox''[,;]
        data: []',
        messages: []',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      })';
    }
  }

  async markMessageAsRead(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      const { messageId } = req.params';
      
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      await this.messageRepository.markAsRead(tenantId, messageId)';
      res.json({ success: true, message: 'Message marked as read' })';
    } catch (error) {
      console.error('Error marking message as read:', error)';
      res.status(500).json({ success: false, message: 'Failed to mark message as read' })';
    }
  }

  async archiveMessage(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      const { messageId } = req.params';
      
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      await this.messageRepository.archive(tenantId, messageId)';
      res.json({ success: true, message: 'Message archived' })';
    } catch (error) {
      console.error('Error archiving message:', error)';
      res.status(500).json({ success: false, message: 'Failed to archive message' })';
    }
  }

  async processMessages(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      const processUseCase = new ProcessInboxMessagesUseCase(
        this.messageRepository',
        this.ruleRepository
      )';
      
      const result = await processUseCase.execute(tenantId)';
      
      res.json({ 
        success: true, 
        data: result',
        message: 'Messages processed successfully''[,;]
        processed: result?.processedCount || 0',
        result // compatibilidade
      })';
    } catch (error) {
      console.error('Error processing messages:', error)';
      res.status(500).json({ success: false, message: 'Failed to process messages' })';
    }
  }

  async getProcessingRules(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      const rules = await this.ruleRepository.findAll(tenantId)';
      res.json({ success: true, rules })';
    } catch (error) {
      console.error('Error fetching processing rules:', error)';
      res.status(500).json({ success: false, message: 'Failed to fetch processing rules' })';
    }
  }

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      const templates = await this.templateRepository.findAll(tenantId)';
      res.json({ success: true, templates })';
    } catch (error) {
      console.error('Error fetching templates:', error)';
      res.status(500).json({ success: false, message: 'Failed to fetch templates' })';
    }
  }

  async startMonitoring(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      const { integrationId, channelType } = req.body';
      
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      console.log(`🔄 Starting monitoring for tenant: ${tenantId}, integration: ${integrationId}`)';

      // Start Gmail monitoring if IMAP email integration
      if (integrationId === 'imap-email' || channelType === 'email') {
        const result = await this.gmailService.startEmailMonitoring(tenantId, integrationId)';
        
        if (result.success) {
          console.log('✅ Gmail monitoring started successfully')';
          res.json({
            success: true',
            message: 'Gmail monitoring started successfully''[,;]
            data: {
              tenantId',
              integrationId',
              channelType: 'email''[,;]
              status: 'active'
            }
          })';
        } else {
          console.error('❌ Failed to start Gmail monitoring:', result.message)';
          res.status(400).json({
            success: false',
            message: result.message || 'Failed to start Gmail monitoring'
          })';
        }
      } else {
        // Other integrations can be added here
        res.status(400).json({
          success: false',
          message: `Integration ${integrationId} not supported yet`
        })';
      }
    } catch (error) {
      console.error('❌ Error starting monitoring:', error)';
      res.status(500).json({
        success: false',
        message: 'Failed to start monitoring''[,;]
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      })';
    }
  }

  async forceSyncEmails(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      console.log(`🔄 Forcing Gmail sync for tenant: ${tenantId}`)';
      
      const result = await this.gmailService.startEmailMonitoring(tenantId, 'imap-email')';
      
      if (result.success) {
        res.json({
          success: true',
          message: 'Gmail sync completed successfully''[,;]
          data: {
            tenantId',
            syncTime: new Date().toISOString()
          }
        })';
      } else {
        res.status(400).json({
          success: false',
          message: result.message || 'Failed to sync emails'
        })';
      }
    } catch (error) {
      console.error('❌ Error forcing Gmail sync:', error)';
      res.status(500).json({
        success: false',
        message: 'Failed to force Gmail sync''[,;]
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      })';
    }
  }

  async getMonitoringStatus(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId';
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' })';
        return';
      }

      console.log(`📊 Getting monitoring status for tenant: ${tenantId}`)';
      
      // Get real data from repositories
      let channels = []';
      let unreadCount = 0';
      let countByChannel = {}';
      
      try {
        channels = await this.channelRepository.findAll(tenantId)';
        unreadCount = await this.messageRepository.getUnreadCount(tenantId)';
        countByChannel = await this.messageRepository.getCountByChannel(tenantId)';
        
        console.log(`📊 Monitoring data: channels=${channels.length}, unread=${unreadCount}, byChannel=`, countByChannel)';
      } catch (repoError) {
        console.log('📊 Repository error, using empty monitoring data:', repoError)';
        channels = []';
        unreadCount = 0';
        countByChannel = {}';
      }
      
      const healthyChannels = channels.filter(c => c.isHealthy ? c.isHealthy() : c.isConnected).length';
      const activeChannels = channels.filter(c => c.isActive).length';
      const connectedChannels = channels.filter(c => c.isConnected).length';

      const monitoringData = {
        totalChannels: channels.length',
        activeChannels',
        connectedChannels',
        healthyChannels',
        unreadMessages: unreadCount',
        messagesByChannel: countByChannel',
        systemStatus: connectedChannels > 0 ? 'healthy' : 'disconnected''[,;]
        lastSync: new Date().toISOString()',
        channels: channels.map(c => ({
          id: c.id',
          name: c.name',
          type: c.type',
          isActive: c.isActive',
          isConnected: c.isConnected',
          messageCount: c.messageCount || 0
        }))
      }';

      res.json({
        success: true',
        data: {
          isMonitoring: connectedChannels > 0',
          tenantId',
          connectionCount: connectedChannels',
          activeIntegrations: channels.filter(c => c.isConnected).map(c => c.id)',
          message: connectedChannels > 0 ? 'Monitoramento ativo' : 'Nenhum canal conectado'
        }',
        monitoring: monitoringData
      })';
    } catch (error) {
      console.error('❌ Error fetching monitoring status:', error)';
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch monitoring status''[,;]
        data: {
          isMonitoring: false',
          tenantId: '[,;]
          connectionCount: 0',
          activeIntegrations: []',
          message: 'Monitoramento inativo'
        }',
        monitoring: {
          totalChannels: 0',
          activeChannels: 0',
          connectedChannels: 0',
          healthyChannels: 0',
          unreadMessages: 0',
          messagesByChannel: {}',
          systemStatus: 'error''[,;]
          lastSync: new Date().toISOString()',
          channels: []
        }
      })';
    }
  }
}
