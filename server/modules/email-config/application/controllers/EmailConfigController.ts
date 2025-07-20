
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { ManageEmailRulesUseCase } from '../use-cases/ManageEmailRulesUseCase';
import { ManageEmailTemplatesUseCase } from '../use-cases/ManageEmailTemplatesUseCase';
import { EmailProcessingService } from '../services/EmailProcessingService';
import { DrizzleEmailConfigRepository } from '../../infrastructure/repositories/DrizzleEmailConfigRepository';
import { EmailMonitoringPersistence } from '../../infrastructure/services/EmailMonitoringPersistence';
import { 
  insertEmailProcessingRuleSchema,
  updateEmailProcessingRuleSchema,
  insertEmailResponseTemplateSchema,
  updateEmailResponseTemplateSchema
} from '../../../../../shared/schema/email-config';

export class EmailConfigController {
  private emailRulesUseCase: ManageEmailRulesUseCase;
  private emailTemplatesUseCase: ManageEmailTemplatesUseCase;
  private emailProcessingService: EmailProcessingService;

  constructor() {
    const repository = new DrizzleEmailConfigRepository();
    this.emailRulesUseCase = new ManageEmailRulesUseCase(repository);
    this.emailTemplatesUseCase = new ManageEmailTemplatesUseCase(repository);
    this.emailProcessingService = new EmailProcessingService();
  }

  // ========== EMAIL PROCESSING RULES ==========

  async createEmailRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        res.status(400).json({ message: 'Tenant ID and User ID are required' });
        return;
      }

      const validatedData = insertEmailProcessingRuleSchema.parse({
        ...req.body,
        tenantId
      });
      const rule = await this.emailRulesUseCase.createRule(tenantId, userId, validatedData);
      
      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      console.error('Error creating email rule:', error);
      res.status(500).json({ 
        message: 'Failed to create email rule',
        error: error.message 
      });
    }
  }

  async getEmailRules(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const activeOnly = req.query.active === 'true';
      const rules = await this.emailRulesUseCase.getRules(tenantId, activeOnly);
      
      res.json({ success: true, data: rules });
    } catch (error) {
      console.error('Error fetching email rules:', error);
      res.status(500).json({ 
        message: 'Failed to fetch email rules',
        error: error.message 
      });
    }
  }

  async getEmailRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { ruleId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const rule = await this.emailRulesUseCase.getRule(tenantId, ruleId);
      
      if (!rule) {
        res.status(404).json({ message: 'Email rule not found' });
        return;
      }
      
      res.json({ success: true, data: rule });
    } catch (error) {
      console.error('Error fetching email rule:', error);
      res.status(500).json({ 
        message: 'Failed to fetch email rule',
        error: error.message 
      });
    }
  }

  async updateEmailRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { ruleId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const validatedData = updateEmailProcessingRuleSchema.parse(req.body);
      const rule = await this.emailRulesUseCase.updateRule(tenantId, ruleId, validatedData);
      
      if (!rule) {
        res.status(404).json({ message: 'Email rule not found' });
        return;
      }
      
      res.json({ success: true, data: rule });
    } catch (error) {
      console.error('Error updating email rule:', error);
      res.status(500).json({ 
        message: 'Failed to update email rule',
        error: error.message 
      });
    }
  }

  async deleteEmailRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { ruleId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const deleted = await this.emailRulesUseCase.deleteRule(tenantId, ruleId);
      
      if (!deleted) {
        res.status(404).json({ message: 'Email rule not found' });
        return;
      }
      
      res.json({ success: true, message: 'Email rule deleted successfully' });
    } catch (error) {
      console.error('Error deleting email rule:', error);
      res.status(500).json({ 
        message: 'Failed to delete email rule',
        error: error.message 
      });
    }
  }

  async testEmailRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { ruleId } = req.params;
      const { from, subject, body, hasAttachment } = req.body;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const result = await this.emailRulesUseCase.testRule(tenantId, ruleId, {
        from,
        subject,
        body,
        hasAttachment: hasAttachment || false
      });
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error testing email rule:', error);
      res.status(500).json({ 
        message: 'Failed to test email rule',
        error: error.message 
      });
    }
  }

  // ========== EMAIL RESPONSE TEMPLATES ==========

  async createEmailTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        res.status(400).json({ message: 'Tenant ID and User ID are required' });
        return;
      }

      const validatedData = insertEmailResponseTemplateSchema.parse(req.body);
      const template = await this.emailTemplatesUseCase.createTemplate(tenantId, userId, validatedData);
      
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ 
        message: 'Failed to create email template',
        error: error.message 
      });
    }
  }

  async getEmailTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const type = req.query.type as string;
      const activeOnly = req.query.active === 'true';
      const templates = await this.emailTemplatesUseCase.getTemplates(tenantId, type, activeOnly);
      
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ 
        message: 'Failed to fetch email templates',
        error: error.message 
      });
    }
  }

  async getEmailTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { templateId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const template = await this.emailTemplatesUseCase.getTemplate(tenantId, templateId);
      
      if (!template) {
        res.status(404).json({ message: 'Email template not found' });
        return;
      }
      
      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error fetching email template:', error);
      res.status(500).json({ 
        message: 'Failed to fetch email template',
        error: error.message 
      });
    }
  }

  async updateEmailTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { templateId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const validatedData = updateEmailResponseTemplateSchema.parse(req.body);
      const template = await this.emailTemplatesUseCase.updateTemplate(tenantId, templateId, validatedData);
      
      if (!template) {
        res.status(404).json({ message: 'Email template not found' });
        return;
      }
      
      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ 
        message: 'Failed to update email template',
        error: error.message 
      });
    }
  }

  async deleteEmailTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { templateId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const deleted = await this.emailTemplatesUseCase.deleteTemplate(tenantId, templateId);
      
      if (!deleted) {
        res.status(404).json({ message: 'Email template not found' });
        return;
      }
      
      res.json({ success: true, message: 'Email template deleted successfully' });
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ 
        message: 'Failed to delete email template',
        error: error.message 
      });
    }
  }

  async renderEmailTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { templateId } = req.params;
      const variables = req.body.variables || {};
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const rendered = await this.emailTemplatesUseCase.renderTemplate(tenantId, templateId, variables);
      
      res.json({ success: true, data: rendered });
    } catch (error) {
      console.error('Error rendering email template:', error);
      res.status(500).json({ 
        message: 'Failed to render email template',
        error: error.message 
      });
    }
  }

  async getAvailableVariables(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const variables = await this.emailTemplatesUseCase.getAvailableVariables();
      res.json({ success: true, data: variables });
    } catch (error) {
      console.error('Error fetching available variables:', error);
      res.status(500).json({ 
        message: 'Failed to fetch available variables',
        error: error.message 
      });
    }
  }

  // ========== EMAIL MONITORING CONTROL ==========

  async startEmailMonitoring(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      // Import email reading service
      const { emailReadingService } = await import('../../infrastructure/services/EmailReadingService');

      // Check if monitoring is already active
      if (emailReadingService.isCurrentlyMonitoring()) {
        res.status(400).json({ 
          message: 'Email monitoring is already active' 
        });
        return;
      }

      // Check if there are configured email integrations
      const repository = new DrizzleEmailConfigRepository();
      const integrations = await repository.getEmailIntegrations(tenantId);
      const emailIntegrations = integrations.filter(i => 
        i.category === 'Comunicação' && 
        i.isConfigured && 
        (i.name === 'IMAP Email' || i.name === 'Gmail OAuth2' || i.name === 'Outlook OAuth2')
      );
      
      if (emailIntegrations.length === 0) {
        res.status(400).json({ 
          message: 'No configured email integrations found. Please configure at least one email integration in Workspace Admin → Integrações.' 
        });
        return;
      }

      // Start email monitoring service
      await emailReadingService.startMonitoring(tenantId);

      const monitoringConfig = {
        isActive: true,
        totalIntegrations: emailIntegrations.length,
        activeConnections: emailReadingService.getActiveConnectionsCount(),
        startedAt: new Date().toISOString(),
        startedBy: req.user?.email,
        integrations: emailIntegrations.map(i => ({
          name: i.name,
          emailAddress: JSON.parse(i.configurationData || '{}').emailAddress || 'Not configured'
        }))
      };

      // Save monitoring state
      await EmailMonitoringPersistence.saveMonitoringState(tenantId, {
        tenantId,
        isActive: true,
        startedAt: new Date().toISOString(),
        startedBy: req.user?.email || 'unknown',
        integrations: emailIntegrations.map(i => i.id)
      });

      res.json({ 
        success: true, 
        message: 'Email monitoring started successfully. The system will now check for new emails every 5 minutes.',
        data: monitoringConfig
      });

    } catch (error) {
      console.error('Error starting email monitoring:', error);
      res.status(500).json({ 
        message: 'Failed to start email monitoring',
        error: error.message 
      });
    }
  }

  async stopEmailMonitoring(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      // Import email reading service
      const { emailReadingService } = await import('../../infrastructure/services/EmailReadingService');

      // Check if monitoring is active
      if (!emailReadingService.isCurrentlyMonitoring()) {
        res.status(400).json({ 
          message: 'Email monitoring is not currently active' 
        });
        return;
      }

      // Stop email monitoring service
      await emailReadingService.stopMonitoring();

      const monitoringConfig = {
        isActive: false,
        activeConnections: 0,
        stoppedAt: new Date().toISOString(),
        stoppedBy: req.user?.email
      };

      res.json({ 
        success: true, 
        message: 'Email monitoring stopped successfully',
        data: monitoringConfig
      });

    } catch (error) {
      console.error('Error stopping email monitoring:', error);
      res.status(500).json({ 
        message: 'Failed to stop email monitoring',
        error: error.message 
      });
    }
  }

  async getEmailMonitoringStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      // Import email reading service
      const { emailReadingService } = await import('../../infrastructure/services/EmailReadingService');

      // Get monitoring status and statistics
      const repository = new DrizzleEmailConfigRepository();
      const integrations = await repository.getEmailIntegrations(tenantId);
      const emailIntegrations = integrations.filter(i => 
        i.category === 'Comunicação' && 
        i.isConfigured && 
        (i.name === 'IMAP Email' || i.name === 'Gmail OAuth2' || i.name === 'Outlook OAuth2')
      );

      const recentLogs = await repository.getProcessingLogs(tenantId, {
        limit: 10,
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      });

      const connectionStatus = emailReadingService.getConnectionStatus();

      const status = {
        isActive: emailReadingService.isCurrentlyMonitoring(),
        totalIntegrations: emailIntegrations.length,
        activeConnections: emailReadingService.getActiveConnectionsCount(),
        connectionStatus,
        recentProcessing: {
          last24Hours: recentLogs.length,
          successful: recentLogs.filter(log => log.processingStatus === 'success').length,
          failed: recentLogs.filter(log => log.processingStatus === 'error').length
        },
        lastProcessedEmail: recentLogs[0] || null,
        integrations: emailIntegrations.map(i => {
          const configData = i.configurationData ? JSON.parse(i.configurationData) : (i.config || {});
          const emailAddress = configData.emailAddress || configData.username || configData.email || i.emailAddress || '';
          const isConnected = connectionStatus[i.id] || false;
          
          console.log(`📊 Integration status for ${i.name}:`, {
            emailAddress: emailAddress || 'Not configured',
            isConnected,
            isConfigured: i.isConfigured,
            hasConfig: !!configData,
            configKeys: Object.keys(configData)
          });
          
          return {
            id: i.id,
            name: i.name,
            emailAddress: emailAddress || 'Not configured',
            isConnected: isConnected
          };
        })
      };

      res.json({ success: true, data: status });

    } catch (error) {
      console.error('Error getting email monitoring status:', error);
      res.status(500).json({ 
        message: 'Failed to get email monitoring status',
        error: error.message 
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

      const { 
        limit = 50, 
        offset = 0, 
        status, 
        dateFrom, 
        dateTo 
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        status: status as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      const repository = new DrizzleEmailConfigRepository();
      const logs = await repository.getProcessingLogs(tenantId, options);

      res.json({ success: true, data: logs });

    } catch (error) {
      console.error('Error fetching processing logs:', error);
      res.status(500).json({ 
        message: 'Failed to fetch processing logs',
        error: error.message 
      });
    }
  }

  async processTestEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { from, subject, body, attachments = [] } = req.body;

      if (!from || !subject || !body) {
        res.status(400).json({ message: 'from, subject, and body are required' });
        return;
      }

      const testEmail = {
        messageId: `test-${Date.now()}`,
        from,
        to: 'support@example.com',
        subject,
        body,
        bodyHtml: body,
        attachments: attachments || [],
        receivedAt: new Date()
      };

      const result = await this.emailProcessingService.processIncomingEmail(tenantId, testEmail);

      res.json({ 
        success: true, 
        message: 'Test email processed successfully',
        data: result
      });

    } catch (error) {
      console.error('Error processing test email:', error);
      res.status(500).json({ 
        message: 'Failed to process test email',
        error: error.message 
      });
    }
  }

  // ========== EMAIL INBOX MESSAGES ==========

  async getInboxMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { 
        limit = 20, 
        offset = 0, 
        unreadOnly, 
        processed,
        priority 
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        unreadOnly: unreadOnly === 'true',
        processed: processed === 'true' ? true : processed === 'false' ? false : undefined,
        priority: priority as string
      };

      const repository = new DrizzleEmailConfigRepository();
      const messages = await repository.getInboxMessages(tenantId, options);

      res.json({ success: true, data: messages });

    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      res.status(500).json({ 
        message: 'Failed to fetch inbox messages',
        error: error.message 
      });
    }
  }

  async getInboxMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { messageId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const repository = new DrizzleEmailConfigRepository();
      const message = await repository.getInboxMessageById(tenantId, messageId);

      if (!message) {
        res.status(404).json({ message: 'Inbox message not found' });
        return;
      }

      res.json({ success: true, data: message });

    } catch (error) {
      console.error('Error fetching inbox message:', error);
      res.status(500).json({ 
        message: 'Failed to fetch inbox message',
        error: error.message 
      });
    }
  }

  async markInboxMessageAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { messageId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const repository = new DrizzleEmailConfigRepository();
      const updated = await repository.markInboxMessageAsRead(tenantId, messageId);

      if (!updated) {
        res.status(404).json({ message: 'Inbox message not found' });
        return;
      }

      res.json({ success: true, message: 'Message marked as read' });

    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ 
        message: 'Failed to mark message as read',
        error: error.message 
      });
    }
  }

  async createRuleFromInboxMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { messageId } = req.params;
      
      if (!tenantId || !userId) {
        res.status(400).json({ message: 'Tenant ID and User ID are required' });
        return;
      }

      const repository = new DrizzleEmailConfigRepository();
      const message = await repository.getInboxMessageById(tenantId, messageId);

      if (!message) {
        res.status(404).json({ message: 'Inbox message not found' });
        return;
      }

      // Create rule from message data with customizations
      const ruleData = {
        ...req.body, // Allow customizations from frontend
        tenantId,
        name: req.body.name || `Rule for ${message.fromEmail}`,
        description: req.body.description || `Auto-created from email: ${message.subject}`,
        fromEmailPattern: req.body.fromEmailPattern || message.fromEmail,
        subjectPattern: req.body.subjectPattern || message.subject,
        bodyPattern: req.body.bodyPattern || (message.bodyText ? message.bodyText.substring(0, 100) : ''),
        priority: req.body.priority || parseInt(message.priority === 'high' ? '10' : message.priority === 'medium' ? '5' : '1'),
        attachmentRequired: req.body.attachmentRequired !== undefined ? req.body.attachmentRequired : message.hasAttachments,
        actionType: req.body.actionType || 'create_ticket',
        defaultCategory: req.body.defaultCategory || '',
        defaultPriority: req.body.defaultPriority || message.priority === 'high' ? 'high' : message.priority === 'low' ? 'low' : 'medium',
        defaultUrgency: req.body.defaultUrgency || message.priority === 'high' ? 'high' : 'medium',
        defaultStatus: req.body.defaultStatus || 'open',
        autoResponseEnabled: req.body.autoResponseEnabled || false,
        extractTicketNumber: req.body.extractTicketNumber !== undefined ? req.body.extractTicketNumber : true,
        createDuplicateTickets: req.body.createDuplicateTickets !== undefined ? req.body.createDuplicateTickets : false,
        notifyAssignee: req.body.notifyAssignee !== undefined ? req.body.notifyAssignee : true,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      };

      const validatedData = insertEmailProcessingRuleSchema.parse(ruleData);
      const rule = await this.emailRulesUseCase.createRule(tenantId, userId, validatedData);
      
      res.status(201).json({ 
        success: true, 
        data: rule,
        message: 'Email rule created successfully from inbox message'
      });

    } catch (error) {
      console.error('Error creating rule from inbox message:', error);
      res.status(500).json({ 
        message: 'Failed to create rule from inbox message',
        error: error.message 
      });
    }
  }

  // ========== EMAIL SIGNATURES ==========

  async getEmailSignatures(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { supportGroup, active } = req.query;

      const options = {
        supportGroup: supportGroup as string,
        active: active === 'true' ? true : active === 'false' ? false : undefined
      };

      const repository = new DrizzleEmailConfigRepository();
      const signatures = await repository.getEmailSignatures(tenantId, options);

      res.json({ success: true, data: signatures });

    } catch (error) {
      console.error('Error fetching email signatures:', error);
      res.status(500).json({ 
        message: 'Failed to fetch email signatures',
        error: error.message 
      });
    }
  }

  async createEmailSignature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const signatureData = {
        ...req.body,
        tenantId
      };

      if (!signatureData.name || !signatureData.supportGroup) {
        res.status(400).json({ message: 'name and supportGroup are required' });
        return;
      }

      const repository = new DrizzleEmailConfigRepository();
      const signature = await repository.createEmailSignature(tenantId, signatureData);

      res.status(201).json({ 
        success: true, 
        data: signature,
        message: 'Email signature created successfully'
      });

    } catch (error) {
      console.error('Error creating email signature:', error);
      res.status(500).json({ 
        message: 'Failed to create email signature',
        error: error.message 
      });
    }
  }

  async updateEmailSignature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { signatureId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const repository = new DrizzleEmailConfigRepository();
      const signature = await repository.updateEmailSignature(tenantId, signatureId, req.body);

      if (!signature) {
        res.status(404).json({ message: 'Email signature not found' });
        return;
      }

      res.json({ 
        success: true, 
        data: signature,
        message: 'Email signature updated successfully'
      });

    } catch (error) {
      console.error('Error updating email signature:', error);
      res.status(500).json({ 
        message: 'Failed to update email signature',
        error: error.message 
      });
    }
  }

  async deleteEmailSignature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { signatureId } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const repository = new DrizzleEmailConfigRepository();
      const deleted = await repository.deleteEmailSignature(tenantId, signatureId);

      if (!deleted) {
        res.status(404).json({ message: 'Email signature not found' });
        return;
      }

      res.json({ 
        success: true, 
        message: 'Email signature deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting email signature:', error);
      res.status(500).json({ 
        message: 'Failed to delete email signature',
        error: error.message 
      });
    }
  }

  async getEmailIntegrations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const repository = new DrizzleEmailConfigRepository();
      const integrations = await repository.getEmailIntegrations(tenantId);

      res.json({ 
        success: true, 
        data: integrations,
        message: 'Email integrations retrieved successfully'
      });

    } catch (error) {
      console.error('Error fetching email integrations:', error);
      res.status(500).json({ 
        message: 'Failed to fetch email integrations',
        error: error.message 
      });
    }
  }
}
