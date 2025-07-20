import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { IEmailConfigRepository } from '../../domain/repositories/IEmailConfigRepository';
import { EmailProcessingRule, EmailResponseTemplate } from '../../domain/entities/EmailProcessingRule';
import { 
  emailProcessingRules,
  emailResponseTemplates,
  emailProcessingLogs,
  emailInboxMessages,
  emailSignatures
} from '../../../../../shared/schema/email-config';
import { schemaManager } from '../../../../db';

export class DrizzleEmailConfigRepository implements IEmailConfigRepository {
  
  async createEmailRule(tenantId: string, rule: Omit<EmailProcessingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailProcessingRule> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const insertedRule = await tenantDb.insert(emailProcessingRules).values({
      ...rule,
      tenantId,
    }).returning();
    
    return insertedRule[0];
  }

  async getEmailRules(tenantId: string, options?: { active?: boolean }): Promise<EmailProcessingRule[]> {
    console.log('DEBUG: DrizzleEmailConfigRepository.getEmailRules called with tenantId:', tenantId);
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    console.log('DEBUG: Got tenant database connection');
    
    // Set search path explicitly before any operations
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    console.log('DEBUG: Explicitly set search path to:', schemaName);
    
    // Verify search path was set correctly
    const verifyPath = await tenantDb.execute(sql`SHOW search_path`);
    console.log('DEBUG: Verified search path:', verifyPath);
    
    let conditions = [eq(emailProcessingRules.tenantId, tenantId)];
    
    if (options?.active !== undefined) {
      conditions.push(eq(emailProcessingRules.isActive, options.active));
    }

    // Use direct SQL for better compatibility with search_path
    const result = await tenantDb.execute(sql`
      SELECT * FROM email_processing_rules 
      WHERE tenant_id = ${tenantId}
      ${options?.active !== undefined ? sql`AND is_active = ${options.active}` : sql``}
      ORDER BY priority DESC
    `);
    
    // Convert SQL results to proper TypeScript format
    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      priority: row.priority,
      isActive: row.is_active,
      fromEmailPattern: row.from_email_pattern,
      subjectPattern: row.subject_pattern,
      bodyPattern: row.body_pattern,
      attachmentRequired: row.attachment_required,
      actionType: row.action_type,
      defaultCategory: row.default_category,
      defaultPriority: row.default_priority,
      defaultUrgency: row.default_urgency,
      defaultStatus: row.default_status,
      defaultAssigneeId: row.default_assignee_id,
      defaultAssignmentGroup: row.default_assignment_group,
      autoResponseEnabled: row.auto_response_enabled,
      autoResponseTemplateId: row.auto_response_template_id,
      autoResponseDelay: row.auto_response_delay,
      extractTicketNumber: row.extract_ticket_number,
      createDuplicateTickets: row.create_duplicate_tickets,
      notifyAssignee: row.notify_assignee,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getEmailRuleById(tenantId: string, ruleId: string): Promise<EmailProcessingRule | null> {
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const result = await tenantDb
      .select()
      .from(emailProcessingRules)
      .where(
        and(
          eq(emailProcessingRules.tenantId, tenantId),
          eq(emailProcessingRules.id, ruleId)
        )
      );

    return result[0] || null;
  }

  async updateEmailRule(tenantId: string, ruleId: string, updates: Partial<EmailProcessingRule>): Promise<EmailProcessingRule | null> {
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb
      .update(emailProcessingRules)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(emailProcessingRules.tenantId, tenantId),
          eq(emailProcessingRules.id, ruleId)
        )
      )
      .returning();

    return result[0] || null;
  }

  async deleteEmailRule(tenantId: string, ruleId: string): Promise<boolean> {
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb
      .delete(emailProcessingRules)
      .where(
        and(
          eq(emailProcessingRules.tenantId, tenantId),
          eq(emailProcessingRules.id, ruleId)
        )
      );

    return result.rowCount > 0;
  }

  async createResponseTemplate(tenantId: string, template: Omit<EmailResponseTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailResponseTemplate> {
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const insertedTemplate = await tenantDb.insert(emailResponseTemplates).values({
      ...template,
      tenantId,
    }).returning();
    
    return insertedTemplate[0];
  }

  async getResponseTemplates(tenantId: string, options?: { type?: string; active?: boolean }): Promise<EmailResponseTemplate[]> {
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    let conditions = [eq(emailResponseTemplates.tenantId, tenantId)];
    
    if (options?.type) {
      conditions.push(eq(emailResponseTemplates.templateType, options.type));
    }
    
    if (options?.active !== undefined) {
      conditions.push(eq(emailResponseTemplates.isActive, options.active));
    }

    return tenantDb
      .select()
      .from(emailResponseTemplates)
      .where(and(...conditions))
      .orderBy(desc(emailResponseTemplates.createdAt));
  }

  async getResponseTemplateById(tenantId: string, templateId: string): Promise<EmailResponseTemplate | null> {
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb
      .select()
      .from(emailResponseTemplates)
      .where(
        and(
          eq(emailResponseTemplates.tenantId, tenantId),
          eq(emailResponseTemplates.id, templateId)
        )
      );

    return result[0] || null;
  }

  async updateResponseTemplate(tenantId: string, templateId: string, updates: Partial<EmailResponseTemplate>): Promise<EmailResponseTemplate | null> {
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const result = await tenantDb
      .update(emailResponseTemplates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(emailResponseTemplates.tenantId, tenantId),
          eq(emailResponseTemplates.id, templateId)
        )
      )
      .returning();

    return result[0] || null;
  }

  async deleteResponseTemplate(tenantId: string, templateId: string): Promise<boolean> {
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const result = await tenantDb
      .delete(emailResponseTemplates)
      .where(
        and(
          eq(emailResponseTemplates.tenantId, tenantId),
          eq(emailResponseTemplates.id, templateId)
        )
      );

    return result.rowCount > 0;
  }

  // Email Processing Logs Methods
  async logEmailProcessing(tenantId: string, log: {
    messageId: string;
    fromEmail: string;
    toEmail: string;
    subject?: string;
    receivedAt: Date;
    ruleId?: string;
    actionTaken: string;
    ticketId?: string;
    responseTemplateId?: string;
    processingStatus?: string;
    errorMessage?: string;
    processingTime?: number;
    emailContent?: any;
    extractedData?: any;
  }): Promise<void> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    await tenantDb.insert(emailProcessingLogs).values({
      ...log,
      tenantId,
      processedAt: new Date(),
      emailContent: log.emailContent ? JSON.stringify(log.emailContent) : null,
      extractedData: log.extractedData ? JSON.stringify(log.extractedData) : null,
    });
  }

  async getProcessingLogs(tenantId: string, options?: { limit?: number; offset?: number; status?: string; dateFrom?: Date; dateTo?: Date }): Promise<any[]> {
    
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    let conditions = [eq(emailProcessingLogs.tenantId, tenantId)];
    
    if (options?.status) {
      conditions.push(eq(emailProcessingLogs.processingStatus, options.status));
    }
    
    if (options?.dateFrom) {
      conditions.push(gte(emailProcessingLogs.processedAt, options.dateFrom));
    }
    
    if (options?.dateTo) {
      conditions.push(lte(emailProcessingLogs.processedAt, options.dateTo));
    }

    let query = tenantDb
      .select()
      .from(emailProcessingLogs)
      .where(and(...conditions))
      .orderBy(desc(emailProcessingLogs.processedAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return query;
  }

  // Inbox Messages Methods
  async getInboxMessages(tenantId: string, options?: { 
    limit?: number; 
    offset?: number; 
    unreadOnly?: boolean; 
    processed?: boolean;
    priority?: string;
  }): Promise<any[]> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb.execute(sql`
      SELECT * FROM email_inbox_messages 
      WHERE tenant_id = ${tenantId}
      ${options?.unreadOnly ? sql`AND is_read = false` : sql``}
      ${options?.processed !== undefined ? sql`AND is_processed = ${options.processed}` : sql``}
      ${options?.priority ? sql`AND priority = ${options.priority}` : sql``}
      ORDER BY received_at DESC
      ${options?.limit ? sql`LIMIT ${options.limit}` : sql``}
      ${options?.offset ? sql`OFFSET ${options.offset}` : sql``}
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      messageId: row.message_id,
      threadId: row.thread_id,
      fromEmail: row.from_email,
      fromName: row.from_name,
      toEmail: row.to_email,
      ccEmails: row.cc_emails,
      bccEmails: row.bcc_emails,
      subject: row.subject,
      bodyText: row.body_text,
      bodyHtml: row.body_html,
      hasAttachments: row.has_attachments,
      attachmentCount: row.attachment_count,
      attachmentDetails: row.attachment_details || [],
      emailHeaders: row.email_headers || {},
      priority: row.priority,
      isRead: row.is_read,
      isProcessed: row.is_processed,
      ruleMatched: row.rule_matched,
      ticketCreated: row.ticket_created,
      emailDate: row.email_date,
      receivedAt: row.received_at,
      processedAt: row.processed_at
    }));
  }

  async getInboxMessageById(tenantId: string, messageId: string): Promise<any | null> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb.execute(sql`
      SELECT * FROM email_inbox_messages 
      WHERE tenant_id = ${tenantId} AND id = ${messageId}
    `);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      messageId: row.message_id,
      threadId: row.thread_id,
      fromEmail: row.from_email,
      fromName: row.from_name,
      toEmail: row.to_email,
      ccEmails: row.cc_emails,
      bccEmails: row.bcc_emails,
      subject: row.subject,
      bodyText: row.body_text,
      bodyHtml: row.body_html,
      hasAttachments: row.has_attachments,
      attachmentCount: row.attachment_count,
      attachmentDetails: row.attachment_details || [],
      emailHeaders: row.email_headers || {},
      priority: row.priority,
      isRead: row.is_read,
      isProcessed: row.is_processed,
      ruleMatched: row.rule_matched,
      ticketCreated: row.ticket_created,
      emailDate: row.email_date,
      receivedAt: row.received_at,
      processedAt: row.processed_at
    };
  }

  async markInboxMessageAsRead(tenantId: string, messageId: string): Promise<boolean> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    // Set search path explicitly for this tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb.execute(sql`
      UPDATE email_inbox_messages 
      SET is_read = true 
      WHERE tenant_id = ${tenantId} AND id = ${messageId}
    `);
    
    return result.rowCount > 0;
  }

  // Email Processing Logs Methods
  async getProcessingLogs(tenantId: string, options?: { 
    limit?: number; 
    offset?: number; 
    ruleId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb.execute(sql`
      SELECT 
        epl.*,
        epr.name as rule_name
      FROM email_processing_logs epl
      LEFT JOIN email_processing_rules epr ON epl.rule_id = epr.id
      WHERE epl.tenant_id = ${tenantId}
      ${options?.ruleId ? sql`AND epl.rule_id = ${options.ruleId}` : sql``}
      ${options?.status ? sql`AND epl.processing_status = ${options.status}` : sql``}
      ${options?.dateFrom ? sql`AND epl.processed_at >= ${options.dateFrom.toISOString()}` : sql``}
      ${options?.dateTo ? sql`AND epl.processed_at <= ${options.dateTo.toISOString()}` : sql``}
      ORDER BY epl.processed_at DESC
      ${options?.limit ? sql`LIMIT ${options.limit}` : sql``}
      ${options?.offset ? sql`OFFSET ${options.offset}` : sql``}
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      messageId: row.message_id,
      emailFrom: row.email_from,
      emailSubject: row.email_subject,
      processedAt: row.processed_at,
      ruleId: row.rule_id,
      ruleName: row.rule_name,
      actionTaken: row.action_taken,
      ticketId: row.ticket_id,
      processingStatus: row.processing_status,
      errorMessage: row.error_message,
      processingTimeMs: row.processing_time_ms,
      metadata: row.metadata || {}
    }));
  }

  async createProcessingLog(tenantId: string, logData: any): Promise<any> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb.execute(sql`
      INSERT INTO email_processing_logs 
      (tenant_id, message_id, email_from, email_subject, processed_at, rule_id, action_taken, ticket_id, processing_status, error_message, processing_time_ms, metadata)
      VALUES (${tenantId}, ${logData.messageId}, ${logData.emailFrom}, ${logData.emailSubject}, ${logData.processedAt || new Date().toISOString()}, 
              ${logData.ruleId}, ${logData.actionTaken}, ${logData.ticketId}, ${logData.processingStatus || 'processed'}, 
              ${logData.errorMessage}, ${logData.processingTimeMs}, ${JSON.stringify(logData.metadata || {})})
      RETURNING *
    `);
    
    return result.rows[0];
  }

  // Email Signatures Methods
  async getEmailSignatures(tenantId: string, options?: { 
    supportGroup?: string; 
    active?: boolean;
  }): Promise<any[]> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb.execute(sql`
      SELECT * FROM email_signatures 
      WHERE tenant_id = ${tenantId}
      ${options?.supportGroup ? sql`AND support_group = ${options.supportGroup}` : sql``}
      ${options?.active !== undefined ? sql`AND is_active = ${options.active}` : sql``}
      ORDER BY support_group, is_default DESC, name
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      supportGroup: row.support_group,
      signatureHtml: row.signature_html,
      signatureText: row.signature_text,
      isDefault: row.is_default,
      isActive: row.is_active,
      contactName: row.contact_name,
      contactTitle: row.contact_title,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      companyName: row.company_name,
      companyWebsite: row.company_website,
      companyAddress: row.company_address,
      logoUrl: row.logo_url,
      brandColors: row.brand_colors || {},
      socialLinks: row.social_links || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async createEmailSignature(tenantId: string, signatureData: any): Promise<any> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb.execute(sql`
      INSERT INTO email_signatures 
      (tenant_id, name, description, support_group, signature_html, signature_text, is_default, is_active,
       contact_name, contact_title, contact_phone, contact_email, company_name, company_website, 
       company_address, logo_url, brand_colors, social_links)
      VALUES (${tenantId}, ${signatureData.name}, ${signatureData.description}, ${signatureData.supportGroup},
              ${signatureData.signatureHtml}, ${signatureData.signatureText}, ${signatureData.isDefault || false}, 
              ${signatureData.isActive !== false}, ${signatureData.contactName}, ${signatureData.contactTitle},
              ${signatureData.contactPhone}, ${signatureData.contactEmail}, ${signatureData.companyName},
              ${signatureData.companyWebsite}, ${signatureData.companyAddress}, ${signatureData.logoUrl},
              ${JSON.stringify(signatureData.brandColors || {})}, ${JSON.stringify(signatureData.socialLinks || {})})
      RETURNING *
    `);
    
    return result.rows[0];
  }

  async updateEmailSignature(tenantId: string, signatureId: string, signatureData: any): Promise<any> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const setParts = [];
    const values = [];
    
    if (signatureData.name !== undefined) {
      setParts.push('name = $' + (values.length + 1));
      values.push(signatureData.name);
    }
    if (signatureData.description !== undefined) {
      setParts.push('description = $' + (values.length + 1));
      values.push(signatureData.description);
    }
    if (signatureData.supportGroup !== undefined) {
      setParts.push('support_group = $' + (values.length + 1));
      values.push(signatureData.supportGroup);
    }
    if (signatureData.signatureHtml !== undefined) {
      setParts.push('signature_html = $' + (values.length + 1));
      values.push(signatureData.signatureHtml);
    }
    if (signatureData.signatureText !== undefined) {
      setParts.push('signature_text = $' + (values.length + 1));
      values.push(signatureData.signatureText);
    }
    if (signatureData.isDefault !== undefined) {
      setParts.push('is_default = $' + (values.length + 1));
      values.push(signatureData.isDefault);
    }
    if (signatureData.isActive !== undefined) {
      setParts.push('is_active = $' + (values.length + 1));
      values.push(signatureData.isActive);
    }
    
    setParts.push('updated_at = NOW()');
    
    const result = await tenantDb.execute(sql`
      UPDATE email_signatures 
      SET ${sql.raw(setParts.join(', '))}
      WHERE tenant_id = ${tenantId} AND id = ${signatureId}
      RETURNING *
    `);
    
    return result.rows[0];
  }

  async deleteEmailSignature(tenantId: string, signatureId: string): Promise<boolean> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb.execute(sql`
      DELETE FROM email_signatures 
      WHERE tenant_id = ${tenantId} AND id = ${signatureId}
    `);
    
    return result.rowCount > 0;
  }

  // Email Integrations Methods
  async getEmailIntegrations(tenantId: string): Promise<any[]> {
    try {
      console.debug('DrizzleEmailConfigRepository.getEmailIntegrations called with tenantId:', tenantId);
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
      
      const result = await tenantDb.execute(sql`
        SELECT id, name, description, category, icon, status, config, features, created_at, updated_at
        FROM integrations 
        WHERE tenant_id = ${tenantId}
        AND (category = 'Comunicação' OR name ILIKE '%email%' OR name ILIKE '%smtp%' OR name ILIKE '%imap%')
        ORDER BY 
          CASE 
            WHEN status = 'connected' THEN 0 
            ELSE 1 
          END,
          name
      `);
      
      return result.rows.map(row => {
        const config = row.config || {};
        const emailAddress = config.emailAddress || config.username || config.email || '';
        const hasPassword = !!(config.password || config.pass);
        const isConfigured = row.status === 'connected' && emailAddress && hasPassword;
        
        console.log(`📧 Integration ${row.name}:`, {
          status: row.status,
          emailAddress: emailAddress || 'missing',
          hasPassword,
          isConfigured,
          configKeys: Object.keys(config)
        });
        
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          category: row.category,
          icon: row.icon,
          status: row.status,
          config: config,
          configurationData: JSON.stringify(config), // Add this for compatibility
          features: row.features || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          isConfigured: isConfigured,
          emailAddress: emailAddress,
          serverHost: config.imapServer || config.serverHost || 'imap.gmail.com',
          serverPort: config.imapPort || config.serverPort || 993,
          useSSL: config.useSSL !== false,
          lastSync: config.lastUpdated ? new Date(config.lastUpdated) : null
        };
      });
    } catch (error) {
      console.error('Error fetching email integrations:', error);
      throw error;
    }
  }

  async saveInboxMessage(tenantId: string, message: {
    messageId: string;
    threadId?: string;
    fromEmail: string;
    fromName?: string;
    toEmail: string;
    ccEmails?: string[];
    bccEmails?: string[];
    subject: string;
    bodyText: string;
    bodyHtml?: string;
    hasAttachments?: boolean;
    attachmentCount?: number;
    attachmentDetails?: any[];
    emailHeaders?: Record<string, any>;
    priority?: string;
    emailDate: Date;
    receivedAt: Date;
  }): Promise<string> {
    const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
    
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
    
    const result = await tenantDb.execute(sql`
      INSERT INTO email_inbox_messages 
      (tenant_id, message_id, thread_id, from_email, from_name, to_email, cc_emails, bcc_emails,
       subject, body_text, body_html, has_attachments, attachment_count, attachment_details,
       email_headers, priority, email_date, received_at, is_read, is_processed)
      VALUES (${tenantId}, ${message.messageId}, ${message.threadId || null}, ${message.fromEmail}, 
              ${message.fromName || null}, ${message.toEmail}, ${JSON.stringify(message.ccEmails || [])}, 
              ${JSON.stringify(message.bccEmails || [])}, ${message.subject}, ${message.bodyText}, 
              ${message.bodyHtml || null}, ${message.hasAttachments || false}, ${message.attachmentCount || 0}, 
              ${JSON.stringify(message.attachmentDetails || [])}, ${JSON.stringify(message.emailHeaders || {})}, 
              ${message.priority || 'medium'}, ${message.emailDate.toISOString()}, ${message.receivedAt.toISOString()}, 
              false, false)
      RETURNING id
    `);
    
    return result.rows[0].id;
  }

  async getIntegrationConfig(tenantId: string, integrationId: string): Promise<any> {
    console.log(`⚙️ Getting integration config for tenant ${tenantId}, integration ${integrationId}`);
    
    try {
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      
      // Set search path explicitly before any operations
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);
      
      const result = await tenantDb.execute(sql`
        SELECT config FROM integrations 
        WHERE tenant_id = ${tenantId} AND id = ${integrationId}
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        console.log(`⚠️ No integration config found for ${integrationId}`);
        return null;
      }

      const configData = result.rows[0].config;
      let config = {};
      
      if (configData) {
        try {
          // Handle case where config might already be an object
          if (typeof configData === 'string') {
            config = JSON.parse(configData);
          } else if (typeof configData === 'object') {
            config = configData;
          }
        } catch (error) {
          console.error(`❌ Failed to parse config data:`, error);
          console.log(`Raw config data:`, configData);
          config = {};
        }
      }
      
      console.log(`✅ Found integration config: ${config.emailAddress || 'no email'}`);
      return config;
    } catch (error) {
      console.error(`❌ Error getting integration config:`, error);
      throw error;
    }
  }
}