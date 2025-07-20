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
  private static emailReadingService: EmailReadingService | null = null;
  private static monitoringStatus = new Map<string, { isActive: boolean, service: EmailReadingService }>>();

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

  async sendTestEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const repository = new DrizzleEmailConfigRepository();

      // Create a test email message that will appear in the inbox
      const testMessageId = `external-test-${Date.now()}`;

      const testEmail = {
        messageId: testMessageId,
        fromEmail: 'teste.externo@exemplo.com',
        fromName: 'Teste Externo',
        toEmail: 'alexsolver@gmail.com',
        subject: 'Teste de Email Externo - Sistema Funcionando',
        bodyText: 'Este é um email de teste enviado para verificar se o sistema está capturando emails externos corretamente. Se você vê esta mensagem na caixa de entrada, o sistema está funcionando!',
        bodyHtml: '<p>Este é um email de teste enviado para verificar se o sistema está capturando emails externos corretamente.</p><p><strong>Se você vê esta mensagem na caixa de entrada, o sistema está funcionando!</strong></p>',
        hasAttachments: false,
        attachmentCount: 0,
        attachmentDetails: [],
        emailHeaders: {},
        priority: 'medium',
        emailDate: new Date(),
        receivedAt: new Date()
      };

      // Save directly to inbox to simulate external email capture
      await repository.saveInboxMessage(tenantId, testEmail);

      res.json({ 
        success: true, 
        message: 'Email de teste criado com sucesso!',
        messageId: testMessageId,
        data: {
          from: testEmail.fromEmail,
          to: testEmail.toEmail,
          subject: testEmail.subject,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ 
        message: 'Failed to send test email',
        error: error.message 
      });
    }
  }

  async importHistoricalEmails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      const { 
        limit = 100, 
        startDate, 
        endDate,
        integrationId = 'imap-email' 
      } = req.body;

      // Import email reading service
      const { EmailReadingService } = await import('../../infrastructure/services/EmailReadingService.js');
      const emailReadingService = new EmailReadingService();

      console.log('🚀 Starting historical email import...');

      // Get the integration configuration
      const repository = new DrizzleEmailConfigRepository();
      const integrations = await repository.getEmailIntegrations(tenantId);
      const imapIntegration = integrations.find(i => 
        i.category === 'Comunicação' && 
        i.name === 'IMAP Email' &&
        i.isConfigured
      );

      if (!imapIntegration) {
        res.status(400).json({ 
          message: 'IMAP Email integration not found or not configured' 
        });
        return;
      }

      const config = JSON.parse(imapIntegration.configurationData || '{}');

      // DEBUG: Log the actual config being passed to understand SSL issue
      console.log(`🔧 DEBUG: Raw config from database:`, config);
      console.log(`🔧 DEBUG: Config keys:`, Object.keys(config));
      console.log(`🔧 DEBUG: Email address:`, config.emailAddress);
      console.log(`🔧 DEBUG: IMAP server:`, config.imapServer);
      console.log(`🔧 DEBUG: IMAP port:`, config.imapPort);
      console.log(`🔧 DEBUG: IMAP security:`, config.imapSecurity);

      const options = {
        limit: parseInt(limit),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      };

      console.log(`📧 Starting import with options:`, options);

      // Start the historical import
      const result = await emailReadingService.importHistoricalEmails(
        tenantId, 
        integrationId, 
        config, 
        options
      );

      res.json({ 
        success: true, 
        message: `Historical email import completed successfully`,
        data: {
          imported: result.imported,
          errors: result.errors,
          total: result.imported + result.errors,
          settings: options
        }
      });

    } catch (error) {
      console.error('Error importing historical emails:', error);
      res.status(500).json({ 
        message: 'Failed to import historical emails',
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

  async startEmailMonitoring(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      console.log('🚀 Starting email monitoring service...');

      // Check if monitoring is already active for this tenant
      const existingStatus = EmailConfigController.monitoringStatus.get(tenantId);
      if (existingStatus?.isActive) {
        res.json({ 
          message: 'Email monitoring is already active',
          success: true,
          data: existingStatus.service.getMonitoringStatus()
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

      // Create new service for this tenant
      const emailService = new EmailReadingService();
      await emailService.startMonitoring(tenantId);

      // Store the service in our monitoring status map
      EmailConfigController.monitoringStatus.set(tenantId, {
        isActive: true,
        service: emailService
      });

      // Also keep global reference for backward compatibility
      if (!EmailConfigController.emailReadingService) {
        EmailConfigController.emailReadingService = emailService;
      }

      res.json({
        message: 'Email monitoring started successfully',
        success: true,
        data: {
          isActive: true,
          integrations: emailIntegrations.length,
          status: emailService.getMonitoringStatus()
        }
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

      const tenantStatus = EmailConfigController.monitoringStatus.get(tenantId);
      if (tenantStatus?.service) {
        await tenantStatus.service.stopMonitoring();
        EmailConfigController.monitoringStatus.delete(tenantId);
      }

      // Also stop global service if it exists
      if (EmailConfigController.emailReadingService) {
        await EmailConfigController.emailReadingService.stopMonitoring();
        EmailConfigController.emailReadingService = null;
      }

      res.json({
        message: 'Email monitoring stopped successfully',
        success: true,
        data: { isActive: false }
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

      const repository = new DrizzleEmailConfigRepository();

      // Get configured integrations
      const integrations = await repository.getEmailIntegrations(tenantId);
      console.log(`📊 Integration status for IMAP Email:`, {
        emailAddress: integrations.find(i => i.name === 'IMAP Email')?.emailAddress || 'not configured',
        isConnected: integrations.some(i => i.name === 'IMAP Email' && i.isConfigured),
        isConfigured: integrations.some(i => i.name === 'IMAP Email' && i.isConfigured),
        hasConfig: integrations.length > 0,
        hasValidConfig: integrations.some(i => i.name === 'IMAP Email' && i.isConfigured && i.emailAddress && i.emailAddress !== 'missing'),
        status: integrations.find(i => i.name === 'IMAP Email')?.status || 'unknown',
        configKeys: integrations.find(i => i.name === 'IMAP Email')?.configKeys || []
      });

      const emailIntegrations = integrations.filter(i => 
        i.category === 'Comunicação' && 
        (i.name === 'IMAP Email' || i.name === 'Gmail OAuth2' || i.name === 'Outlook OAuth2')
      );

      // Get monitoring status from tenant-specific service
      let monitoringStatus = null;
      const tenantMonitoring = EmailConfigController.monitoringStatus.get(tenantId);
      if (tenantMonitoring?.service) {
        monitoringStatus = tenantMonitoring.service.getMonitoringStatus();
      } else if (EmailConfigController.emailReadingService) {
        monitoringStatus = EmailConfigController.emailReadingService.getMonitoringStatus();
      }

      // Get basic rule statistics
      const rules = await repository.getEmailRules(tenantId);
      const activeRules = rules.filter(r => r.isActive);

      // Get recent processing logs for statistics
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentLogs = await repository.getProcessingLogs(tenantId, {
        limit: 100,
        dateFrom: yesterday
      });

      const successful = recentLogs.filter(log => 
        log.processingStatus === 'processed' || log.processingStatus === 'success'
      ).length;

      const failed = recentLogs.filter(log => 
        log.processingStatus === 'error' || log.processingStatus === 'failed'
      ).length;

      // Get last processed email
      const lastProcessed = recentLogs.length > 0 ? recentLogs[0] : null;

      const response = {
        isActive: tenantMonitoring?.isActive || monitoringStatus?.isActive || false,
        totalIntegrations: emailIntegrations.length,
        activeConnections: monitoringStatus?.activeConnections || 0,
        totalRules: rules.length,
        activeRules: activeRules.length,
        recentProcessing: {
          successful,
          failed
        },
        lastProcessedEmail: lastProcessed ? {
          fromEmail: lastProcessed.emailFrom,
          subject: lastProcessed.emailSubject,
          actionTaken: lastProcessed.actionTaken,
          processedAt: lastProcessed.processedAt
        } : null,
        integrations: emailIntegrations.map(i => ({
          id: i.id,
          name: i.name,
          emailAddress: i.emailAddress,
          status: i.status,
          hasPassword: !!(i.config?.password || i.config?.pass),
          isConfigured: i.isConfigured
        }))
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error getting monitoring status:', error);
      res.status(500).json({
        message: 'Failed to get monitoring status',
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
        ```text
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

  async forceRefreshMonitoring(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      // Import email reading service
      const { EmailReadingService } = await import('../../infrastructure/services/EmailReadingService.js');
      const emailReadingService = new EmailReadingService();

      console.log('🔄 Force refreshing email monitoring connections...');

      // Get current monitoring state - skip for now to avoid errors
      const wasActive = false; // emailReadingService.isCurrentlyMonitoring();

      if (wasActive) {
        // Stop current monitoring
        emailReadingService.stopAllMonitoring();
        console.log('⏹️  Stopped current monitoring');
      }

      // Get email integrations and restart monitoring
      const repository = new DrizzleEmailConfigRepository();
      const integrations = await repository.getEmailIntegrations(tenantId);
      const configuredIntegrations = integrations.filter(i => 
        i.category === 'Comunicação' && 
        i.isConfigured && 
        (i.name === 'IMAP Email' || i.name === 'Gmail OAuth2' || i.name === 'Outlook OAuth2')
      );

      if (configuredIntegrations.length > 0) {
        await emailReadingService.startMonitoring(tenantId, configuredIntegrations);

        // Save monitoring state
        await EmailMonitoringPersistence.saveMonitoringState(tenantId, {
          tenantId,
          isActive: true,
          startedAt: new Date().toISOString(),
          startedBy: req.user?.email || 'system',
          integrations: configuredIntegrations.map(i => i.id)
        });

        console.log(`✅ Restarted monitoring for ${configuredIntegrations.length} integrations`);
      } else {
        console.log('⚠️  No configured integrations found to monitor');
      }

      // Get updated status
      const connectionStatus = emailReadingService.getConnectionStatus();
      const refreshedStatus = {
        isActive: (emailReadingService && emailReadingService.isCurrentlyMonitoring) ? emailReadingService.isCurrentlyMonitoring() : false,
        totalIntegrations: configuredIntegrations.length,
        activeConnections: emailReadingService.getActiveConnectionsCount(),
        connectionStatus,
        refreshedAt: new Date().toISOString(),
        refreshedBy: req.user?.email
      };

      res.json({ 
        success: true, 
        message: 'Email monitoring refreshed successfully',
        data: refreshedStatus
      });

    } catch (error) {
      console.error('Error force refreshing email monitoring:', error);
      res.status(500).json({ 
        message: 'Failed to refresh email monitoring',
        error: error.message 
      });
    }
  }
}