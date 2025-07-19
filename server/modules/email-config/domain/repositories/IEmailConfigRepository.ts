
import { EmailProcessingRule, EmailResponseTemplate } from '../entities/EmailProcessingRule';

export interface IEmailConfigRepository {
  // Email Processing Rules
  createEmailRule(tenantId: string, rule: Omit<EmailProcessingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailProcessingRule>;
  getEmailRules(tenantId: string, options?: { active?: boolean }): Promise<EmailProcessingRule[]>;
  getEmailRuleById(tenantId: string, ruleId: string): Promise<EmailProcessingRule | null>;
  updateEmailRule(tenantId: string, ruleId: string, updates: Partial<EmailProcessingRule>): Promise<EmailProcessingRule | null>;
  deleteEmailRule(tenantId: string, ruleId: string): Promise<boolean>;
  
  // Email Response Templates
  createResponseTemplate(tenantId: string, template: Omit<EmailResponseTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailResponseTemplate>;
  getResponseTemplates(tenantId: string, options?: { type?: string; active?: boolean }): Promise<EmailResponseTemplate[]>;
  getResponseTemplateById(tenantId: string, templateId: string): Promise<EmailResponseTemplate | null>;
  updateResponseTemplate(tenantId: string, templateId: string, updates: Partial<EmailResponseTemplate>): Promise<EmailResponseTemplate | null>;
  deleteResponseTemplate(tenantId: string, templateId: string): Promise<boolean>;
  
  // Email Processing Logs
  logEmailProcessing(tenantId: string, log: {
    messageId: string;
    fromEmail: string;
    toEmail: string;
    subject?: string;
    receivedAt: Date;
    ruleId?: string;
    actionTaken: string;
    ticketId?: string;
    responseTemplateId?: string;
    processingStatus: string;
    errorMessage?: string;
    processingTime?: number;
    emailContent?: Record<string, any>;
    extractedData?: Record<string, any>;
  }): Promise<void>;
  
  getProcessingLogs(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]>;
}
