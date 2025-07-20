import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { IEmailConfigRepository } from '../../domain/repositories/IEmailConfigRepository';
import { EmailProcessingRule, EmailResponseTemplate } from '../../domain/entities/EmailProcessingRule';
import { 
  emailProcessingRules,
  emailResponseTemplates,
  emailProcessingLogs
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

    console.log('DEBUG: About to execute Drizzle query...');
    return tenantDb
      .select()
      .from(emailProcessingRules)
      .where(and(...conditions))
      .orderBy(desc(emailProcessingRules.priority));
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
}