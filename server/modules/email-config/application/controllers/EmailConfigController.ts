
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { ManageEmailRulesUseCase } from '../use-cases/ManageEmailRulesUseCase';
import { ManageEmailTemplatesUseCase } from '../use-cases/ManageEmailTemplatesUseCase';
import { DrizzleEmailConfigRepository } from '../../infrastructure/repositories/DrizzleEmailConfigRepository';
import { 
  insertEmailProcessingRuleSchema,
  updateEmailProcessingRuleSchema,
  insertEmailResponseTemplateSchema,
  updateEmailResponseTemplateSchema
} from '../../../../../shared/schema/email-config';

export class EmailConfigController {
  private emailRulesUseCase: ManageEmailRulesUseCase;
  private emailTemplatesUseCase: ManageEmailTemplatesUseCase;

  constructor() {
    const repository = new DrizzleEmailConfigRepository();
    this.emailRulesUseCase = new ManageEmailRulesUseCase(repository);
    this.emailTemplatesUseCase = new ManageEmailTemplatesUseCase(repository);
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

      const validatedData = insertEmailProcessingRuleSchema.parse(req.body);
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
}
