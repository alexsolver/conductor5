
import { IEmailConfigRepository } from '../../domain/repositories/IEmailConfigRepository';
import { EmailResponseTemplate } from '../../domain/entities/EmailProcessingRule';

export class ManageEmailTemplatesUseCase {
  constructor(private emailConfigRepo: IEmailConfigRepository) {}

  async createTemplate(tenantId: string, userId: string, templateData: Omit<EmailResponseTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<EmailResponseTemplate> {
    // Validate template data
    this.validateTemplateData(templateData);
    
    return this.emailConfigRepo.createResponseTemplate(tenantId, {
      ...templateData,
      tenantId,
      createdBy: userId,
    });
  }

  async getTemplates(tenantId: string, type?: string, activeOnly: boolean = false): Promise<EmailResponseTemplate[]> {
    return this.emailConfigRepo.getResponseTemplates(tenantId, { type, active: activeOnly });
  }

  async getTemplate(tenantId: string, templateId: string): Promise<EmailResponseTemplate | null> {
    return this.emailConfigRepo.getResponseTemplateById(tenantId, templateId);
  }

  async updateTemplate(tenantId: string, templateId: string, updates: Partial<EmailResponseTemplate>): Promise<EmailResponseTemplate | null> {
    if (updates.subject || updates.bodyHtml || updates.bodyText) {
      this.validateTemplateContent(updates);
    }
    
    return this.emailConfigRepo.updateResponseTemplate(tenantId, templateId, updates);
  }

  async deleteTemplate(tenantId: string, templateId: string): Promise<boolean> {
    return this.emailConfigRepo.deleteResponseTemplate(tenantId, templateId);
  }

  async renderTemplate(tenantId: string, templateId: string, variables: Record<string, any>): Promise<{
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
  }> {
    const template = await this.emailConfigRepo.getResponseTemplateById(tenantId, templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    return {
      subject: this.replaceVariables(template.subject, variables),
      bodyHtml: template.bodyHtml ? this.replaceVariables(template.bodyHtml, variables) : undefined,
      bodyText: template.bodyText ? this.replaceVariables(template.bodyText, variables) : undefined,
    };
  }

  async getAvailableVariables(): Promise<string[]> {
    return [
      '{{ticket_number}}',
      '{{ticket_subject}}',
      '{{ticket_priority}}',
      '{{ticket_status}}',
      '{{customer_name}}',
      '{{customer_email}}',
      '{{assignee_name}}',
      '{{company_name}}',
      '{{current_date}}',
      '{{current_time}}',
      '{{resolution_details}}',
      '{{next_action}}',
      '{{sla_deadline}}',
      '{{ticket_url}}',
      '{{portal_url}}'
    ];
  }

  private validateTemplateData(templateData: any): void {
    if (!templateData.name || templateData.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (!templateData.subject || templateData.subject.trim().length === 0) {
      throw new Error('Template subject is required');
    }

    if (!templateData.bodyHtml && !templateData.bodyText) {
      throw new Error('Template must have either HTML or text body');
    }

    this.validateTemplateContent(templateData);
  }

  private validateTemplateContent(data: any): void {
    const fields = ['subject', 'bodyHtml', 'bodyText'];
    
    for (const field of fields) {
      if (data[field]) {
        // Check for balanced template variables
        const openBraces = (data[field].match(/\{\{/g) || []).length;
        const closeBraces = (data[field].match(/\}\}/g) || []).length;
        
        if (openBraces !== closeBraces) {
          throw new Error(`Unbalanced template variables in ${field}`);
        }
      }
    }
  }

  private replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;
    
    // Replace each variable
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(pattern, String(value || ''));
    }
    
    // Add default values for common variables
    result = result.replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString());
    result = result.replace(/\{\{current_time\}\}/g, new Date().toLocaleTimeString());
    
    return result;
  }
}
