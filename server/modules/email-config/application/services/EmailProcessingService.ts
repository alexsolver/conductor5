
import { IEmailConfigRepository } from '../../domain/repositories/IEmailConfigRepository';
import { EmailProcessingRule, EmailResponseTemplate } from '../../domain/entities/EmailProcessingRule';
import { DrizzleEmailConfigRepository } from '../../infrastructure/repositories/DrizzleEmailConfigRepository';

interface IncomingEmail {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  receivedAt: Date;
}

interface ProcessingResult {
  success: boolean;
  action: string;
  ticketId?: string;
  responseTemplateId?: string;
  errorMessage?: string;
  ruleId?: string;
}

export class EmailProcessingService {
  private emailConfigRepo: IEmailConfigRepository;

  constructor() {
    this.emailConfigRepo = new DrizzleEmailConfigRepository();
  }

  async processIncomingEmail(tenantId: string, email: IncomingEmail): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // First, save the email to the inbox
      await this.saveEmailToInbox(tenantId, email);
      
      // Get active email rules sorted by priority
      const rules = await this.emailConfigRepo.getEmailRules(tenantId, { active: true });
      
      // Find the first matching rule
      const matchingRule = await this.findMatchingRule(rules, email);
      
      if (!matchingRule) {
        await this.logProcessing(tenantId, email, null, 'ignored', 'No matching rule found');
        return { success: true, action: 'ignored' };
      }

      // Process the email according to the rule
      const result = await this.executeRuleAction(tenantId, matchingRule, email);
      
      // Log the processing
      await this.logProcessing(
        tenantId, 
        email, 
        matchingRule.id, 
        result.action, 
        result.errorMessage,
        result.ticketId,
        result.responseTemplateId,
        Date.now() - startTime
      );

      return result;

    } catch (error) {
      console.error('Error processing email:', error);
      
      // Still try to save the email to inbox even if processing fails
      try {
        await this.saveEmailToInbox(tenantId, email);
      } catch (inboxError) {
        console.error('Error saving failed email to inbox:', inboxError);
      }
      
      await this.logProcessing(
        tenantId, 
        email, 
        null, 
        'failed', 
        error.message,
        undefined,
        undefined,
        Date.now() - startTime
      );

      return { 
        success: false, 
        action: 'failed', 
        errorMessage: error.message 
      };
    }
  }

  private async findMatchingRule(rules: EmailProcessingRule[], email: IncomingEmail): Promise<EmailProcessingRule | null> {
    for (const rule of rules) {
      if (await this.doesEmailMatchRule(rule, email)) {
        return rule;
      }
    }
    return null;
  }

  private async doesEmailMatchRule(rule: EmailProcessingRule, email: IncomingEmail): Promise<boolean> {
    try {
      // Check email pattern
      if (rule.fromEmailPattern) {
        const emailRegex = new RegExp(rule.fromEmailPattern, 'i');
        if (!emailRegex.test(email.from)) {
          return false;
        }
      }

      // Check subject pattern
      if (rule.subjectPattern) {
        const subjectRegex = new RegExp(rule.subjectPattern, 'i');
        if (!subjectRegex.test(email.subject)) {
          return false;
        }
      }

      // Check body pattern
      if (rule.bodyPattern) {
        const bodyRegex = new RegExp(rule.bodyPattern, 'i');
        if (!bodyRegex.test(email.body)) {
          return false;
        }
      }

      // Check attachment requirement
      if (rule.attachmentRequired && email.attachments.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error checking rule ${rule.id}:`, error);
      return false;
    }
  }

  private async executeRuleAction(tenantId: string, rule: EmailProcessingRule, email: IncomingEmail): Promise<ProcessingResult> {
    switch (rule.actionType) {
      case 'create_ticket':
        return await this.createTicketFromEmail(tenantId, rule, email);
      
      case 'update_ticket':
        return await this.updateTicketFromEmail(tenantId, rule, email);
      
      case 'auto_respond':
        return await this.sendAutoResponse(tenantId, rule, email);
      
      case 'forward':
        return await this.forwardEmail(tenantId, rule, email);
      
      case 'ignore':
        return { success: true, action: 'ignored', ruleId: rule.id };
      
      default:
        throw new Error(`Unknown action type: ${rule.actionType}`);
    }
  }

  private async createTicketFromEmail(tenantId: string, rule: EmailProcessingRule, email: IncomingEmail): Promise<ProcessingResult> {
    try {
      // Extract ticket number if enabled
      let ticketNumber = null;
      if (rule.extractTicketNumber) {
        ticketNumber = this.extractTicketNumber(email.subject);
      }

      // Check for duplicate tickets if not allowed
      if (!rule.createDuplicateTickets && ticketNumber) {
        // Here you would check if a ticket with this number already exists
        // For now, we'll skip this check
      }

      // Create ticket data
      const ticketData = {
        title: email.subject,
        description: email.body,
        customerId: await this.findOrCreateCustomer(tenantId, email.from),
        category: rule.defaultCategory,
        priority: rule.defaultPriority,
        urgency: rule.defaultUrgency,
        status: rule.defaultStatus,
        assigneeId: rule.defaultAssigneeId,
        assignmentGroup: rule.defaultAssignmentGroup,
        source: 'email',
        sourceData: {
          messageId: email.messageId,
          fromEmail: email.from,
          toEmail: email.to,
          originalSubject: email.subject
        }
      };

      // Here you would call your ticket creation service
      const ticketId = await this.createTicketRecord(tenantId, ticketData);

      // Handle attachments
      if (email.attachments.length > 0) {
        await this.attachEmailAttachments(tenantId, ticketId, email.attachments);
      }

      // Send auto-response if enabled
      let responseTemplateId = null;
      if (rule.autoResponseEnabled && rule.autoResponseTemplateId) {
        responseTemplateId = await this.sendDelayedAutoResponse(
          tenantId, 
          rule.autoResponseTemplateId, 
          email, 
          ticketId,
          rule.autoResponseDelay
        );
      }

      // Notify assignee if enabled
      if (rule.notifyAssignee && rule.defaultAssigneeId) {
        await this.notifyAssignee(tenantId, rule.defaultAssigneeId, ticketId);
      }

      return {
        success: true,
        action: 'create_ticket',
        ticketId,
        responseTemplateId,
        ruleId: rule.id
      };

    } catch (error) {
      console.error('Error creating ticket from email:', error);
      return {
        success: false,
        action: 'failed',
        errorMessage: error.message,
        ruleId: rule.id
      };
    }
  }

  private async updateTicketFromEmail(tenantId: string, rule: EmailProcessingRule, email: IncomingEmail): Promise<ProcessingResult> {
    // Extract ticket number from subject
    const ticketNumber = this.extractTicketNumber(email.subject);
    
    if (!ticketNumber) {
      return {
        success: false,
        action: 'failed',
        errorMessage: 'No ticket number found in subject',
        ruleId: rule.id
      };
    }

    try {
      // Find the ticket by number
      const ticketId = await this.findTicketByNumber(tenantId, ticketNumber);
      
      if (!ticketId) {
        // If ticket not found, optionally create a new one
        if (rule.createDuplicateTickets) {
          return await this.createTicketFromEmail(tenantId, rule, email);
        } else {
          return {
            success: false,
            action: 'failed',
            errorMessage: `Ticket ${ticketNumber} not found`,
            ruleId: rule.id
          };
        }
      }

      // Add the email as a comment/update to the ticket
      await this.addEmailCommentToTicket(tenantId, ticketId, email);

      return {
        success: true,
        action: 'update_ticket',
        ticketId,
        ruleId: rule.id
      };

    } catch (error) {
      console.error('Error updating ticket from email:', error);
      return {
        success: false,
        action: 'failed',
        errorMessage: error.message,
        ruleId: rule.id
      };
    }
  }

  private async sendAutoResponse(tenantId: string, rule: EmailProcessingRule, email: IncomingEmail): Promise<ProcessingResult> {
    try {
      const responseTemplateId = await this.sendDelayedAutoResponse(
        tenantId,
        rule.autoResponseTemplateId || 'default',
        email,
        null,
        rule.autoResponseDelay
      );

      return {
        success: true,
        action: 'auto_respond',
        responseTemplateId,
        ruleId: rule.id
      };

    } catch (error) {
      console.error('Error sending auto response:', error);
      return {
        success: false,
        action: 'failed',
        errorMessage: error.message,
        ruleId: rule.id
      };
    }
  }

  private async forwardEmail(tenantId: string, rule: EmailProcessingRule, email: IncomingEmail): Promise<ProcessingResult> {
    try {
      // Here you would implement email forwarding logic
      // For now, we'll just log it
      console.log(`Forwarding email ${email.messageId} according to rule ${rule.id}`);

      return {
        success: true,
        action: 'forward',
        ruleId: rule.id
      };

    } catch (error) {
      console.error('Error forwarding email:', error);
      return {
        success: false,
        action: 'failed',
        errorMessage: error.message,
        ruleId: rule.id
      };
    }
  }

  // Helper methods (these would need to be implemented based on your system)
  private extractTicketNumber(subject: string): string | null {
    const match = subject.match(/#(\d+)/);
    return match ? match[1] : null;
  }

  private async findOrCreateCustomer(tenantId: string, email: string): Promise<string> {
    // Implementation would depend on your customer management system
    // For now, return a valid UUID placeholder
    return '550e8400-e29b-41d4-a716-446655440000';
  }

  private async createTicketRecord(tenantId: string, ticketData: any): Promise<string> {
    // Implementation would call your ticket creation service
    // For now, return a valid UUID placeholder
    return '550e8400-e29b-41d4-a716-446655440001';
  }

  private async saveEmailToInbox(tenantId: string, email: IncomingEmail): Promise<string> {
    // Extract priority from subject/content
    const priority = this.determinePriority(email.subject, email.body);
    
    // Generate message ID if not provided
    const messageId = email.messageId || `test-${Date.now()}`;
    
    // Extract from name if provided
    const fromName = email.fromName || email.from.split('@')[0];
    
    return await this.emailConfigRepo.saveInboxMessage(tenantId, {
      messageId,
      threadId: undefined,
      fromEmail: email.from,
      fromName,
      toEmail: email.to || 'suporte@conductor.com',
      ccEmails: [],
      bccEmails: [],
      subject: email.subject,
      bodyText: email.body,
      bodyHtml: `<p>${email.body.replace(/\n/g, '<br>')}</p>`,
      hasAttachments: email.attachments && email.attachments.length > 0,
      attachmentCount: email.attachments ? email.attachments.length : 0,
      attachmentDetails: email.attachments || [],
      emailHeaders: {},
      priority,
      emailDate: new Date(),
      receivedAt: email.receivedAt || new Date()
    });
  }

  private determinePriority(subject: string, body: string): string {
    const text = (subject + ' ' + body).toLowerCase();
    
    if (text.includes('urgente') || text.includes('crítico') || text.includes('emergency')) {
      return 'high';
    } else if (text.includes('orçamento') || text.includes('comercial') || text.includes('vendas')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private async attachEmailAttachments(tenantId: string, ticketId: string, attachments: any[]): Promise<void> {
    // Implementation would handle file uploads
  }

  private async sendDelayedAutoResponse(
    tenantId: string, 
    templateId: string, 
    email: IncomingEmail, 
    ticketId: string | null,
    delay: number
  ): Promise<string> {
    // Implementation would handle template processing and email sending
    return templateId;
  }

  private async notifyAssignee(tenantId: string, assigneeId: string, ticketId: string): Promise<void> {
    // Implementation would send notification to assignee
  }

  private async findTicketByNumber(tenantId: string, ticketNumber: string): Promise<string | null> {
    // Implementation would search for ticket by number
    return null;
  }

  private async addEmailCommentToTicket(tenantId: string, ticketId: string, email: IncomingEmail): Promise<void> {
    // Implementation would add email as comment to ticket
  }

  private async logProcessing(
    tenantId: string,
    email: IncomingEmail,
    ruleId: string | null,
    actionTaken: string,
    errorMessage?: string,
    ticketId?: string,
    responseTemplateId?: string,
    processingTime?: number
  ): Promise<void> {
    const logData = {
      messageId: email.messageId,
      fromEmail: email.from,
      toEmail: email.to,
      subject: email.subject,
      receivedAt: email.receivedAt,
      ruleId,
      actionTaken,
      ticketId,
      responseTemplateId,
      processingStatus: errorMessage ? 'failed' : 'processed',
      errorMessage,
      processingTime,
      emailContent: {
        subject: email.subject,
        body: email.body.substring(0, 1000), // Truncate for storage
        attachmentCount: email.attachments.length
      },
      extractedData: {}
    };

    await this.emailConfigRepo.logEmailProcessing(tenantId, logData);
  }
}
