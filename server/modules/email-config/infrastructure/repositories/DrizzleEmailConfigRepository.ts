
import { eq, and, desc, sql } from 'drizzle-orm';
import { IEmailConfigRepository } from '../../domain/repositories/IEmailConfigRepository';
import { EmailProcessingRule, EmailResponseTemplate } from '../../domain/entities/EmailProcessingRule';
import { 
  emailProcessingRules,
  emailResponseTemplates,
  emailProcessingLogs
} from '../../../../../shared/schema/email-config';
import { getStorage } from '../../../../storage-simple';

export class DrizzleEmailConfigRepository implements IEmailConfigRepository {
  
  async createEmailRule(tenantId: string, rule: Omit<EmailProcessingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailProcessingRule> {
    const storage = await getStorage();
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    const insertedRule = await storage.db.insert(emailProcessingRules).values({
      ...rule,
      tenantId,
    }).returning();
    
    return insertedRule[0];
  }

  async getEmailRules(tenantId: string, options?: { active?: boolean }): Promise<EmailProcessingRule[]> {
    const storage = await getStorage();
    
    let query = storage.db
      .select()
      .from(emailProcessingRules)
      .where(eq(emailProcessingRules.tenantId, tenantId));

    if (options?.active !== undefined) {
      query = query.where(
        and(
          eq(emailProcessingRules.tenantId, tenantId),
          eq(emailProcessingRules.isActive, options.active)
        )
      );
    }

    return query.orderBy(desc(emailProcessingRules.priority));
  }

  async getEmailRuleById(tenantId: string, ruleId: string): Promise<EmailProcessingRule | null> {
    const storage = await getStorage();
    
    const result = await storage.db
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
    const storage = await getStorage();
    
    const result = await storage.db
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
    const storage = await getStorage();
    
    const result = await storage.db
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
    const storage = await getStorage();
    
    const insertedTemplate = await storage.db.insert(emailResponseTemplates).values({
      ...template,
      tenantId,
    }).returning();
    
    return insertedTemplate[0];
  }

  async getResponseTemplates(tenantId: string, options?: { type?: string; active?: boolean }): Promise<EmailResponseTemplate[]> {
    const storage = await getStorage();
    
    let conditions = [eq(emailResponseTemplates.tenantId, tenantId)];
    
    if (options?.type) {
      conditions.push(eq(emailResponseTemplates.templateType, options.type));
    }
    
    if (options?.active !== undefined) {
      conditions.push(eq(emailResponseTemplates.isActive, options.active));
    }

    return storage.db
      .select()
      .from(emailResponseTemplates)
      .where(and(...conditions))
      .orderBy(desc(emailResponseTemplates.createdAt));
  }

  async getResponseTemplateById(tenantId: string, templateId: string): Promise<EmailResponseTemplate | null> {
    const storage = await getStorage();
    
    const result = await storage.db
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
    const storage = await getStorage();
    
    const result = await storage.db
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
    const storage = await getStorage();
    
    const result = await storage.db
      .delete(emailResponseTemplates)
      .where(
        and(
          eq(emailResponseTemplates.tenantId, tenantId),
          eq(emailResponseTemplates.id, templateId)
        )
      );

    return result.rowCount > 0;
  }

  async logEmailProcessing(tenantId: string, log: any): Promise<void> {
    const storage = await getStorage();
    
    await storage.db.insert(emailProcessingLogs).values({
      ...log,
      tenantId,
    });
  }

  async getProcessingLogs(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]> {
    const storage = await getStorage();
    
    let conditions = [eq(emailProcessingLogs.tenantId, tenantId)];
    
    if (options?.status) {
      conditions.push(eq(emailProcessingLogs.processingStatus, options.status));
    }
    
    if (options?.dateFrom) {
      conditions.push(sql`${emailProcessingLogs.receivedAt} >= ${options.dateFrom}`);
    }
    
    if (options?.dateTo) {
      conditions.push(sql`${emailProcessingLogs.receivedAt} <= ${options.dateTo}`);
    }

    return storage.db
      .select()
      .from(emailProcessingLogs)
      .where(and(...conditions))
      .orderBy(desc(emailProcessingLogs.receivedAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);
  }
}
