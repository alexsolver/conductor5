import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { TemplateEntity } from '../../domain/entities/Template';
import { db } from '../../../../db';
import { omnibridgeTemplates } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';

export class DrizzleTemplateRepository implements ITemplateRepository {
  async findById(id: string, tenantId: string): Promise<TemplateEntity | null> {
    try {
      const result = await db
        .select()
        .from(omnibridgeTemplates)
        .where(and(
          eq(omnibridgeTemplates.id, id),
          eq(omnibridgeTemplates.tenantId, tenantId)
        ))
        .limit(1);

      if (result.length === 0) return null;

      const template = result[0];
      return new TemplateEntity(
        template.id,
        template.name,
        template.content,
        template.category,
        template.tenantId,
        template.createdBy,
        template.description || undefined,
        template.subject || undefined,
        Array.isArray(template.variables) ? template.variables : [],
        template.isActive,
        template.usageCount,
        template.createdAt,
        template.updatedAt
      );
    } catch (error) {
      console.error('[DrizzleTemplateRepository] Error finding template by ID:', error);
      return null;
    }
  }

  async findByTenant(tenantId: string): Promise<TemplateEntity[]> {
    try {
      const result = await db
        .select()
        .from(omnibridgeTemplates)
        .where(eq(omnibridgeTemplates.tenantId, tenantId));

      return result.map(template => new TemplateEntity(
        template.id,
        template.name,
        template.content,
        template.category,
        template.tenantId,
        template.createdBy,
        template.description || undefined,
        template.subject || undefined,
        Array.isArray(template.variables) ? template.variables : [],
        template.isActive,
        template.usageCount,
        template.createdAt,
        template.updatedAt
      ));
    } catch (error) {
      console.error('[DrizzleTemplateRepository] Error finding templates by tenant:', error);
      return [];
    }
  }

  async findByCategory(category: string, tenantId: string): Promise<TemplateEntity[]> {
    try {
      const result = await db
        .select()
        .from(omnibridgeTemplates)
        .where(and(
          eq(omnibridgeTemplates.category, category),
          eq(omnibridgeTemplates.tenantId, tenantId)
        ));

      return result.map(template => new TemplateEntity(
        template.id,
        template.name,
        template.content,
        template.category,
        template.tenantId,
        template.createdBy,
        template.description || undefined,
        template.subject || undefined,
        Array.isArray(template.variables) ? template.variables : [],
        template.isActive,
        template.usageCount,
        template.createdAt,
        template.updatedAt
      ));
    } catch (error) {
      console.error('[DrizzleTemplateRepository] Error finding templates by category:', error);
      return [];
    }
  }

  async findActiveByTenant(tenantId: string): Promise<TemplateEntity[]> {
    try {
      const result = await db
        .select()
        .from(omnibridgeTemplates)
        .where(and(
          eq(omnibridgeTemplates.tenantId, tenantId),
          eq(omnibridgeTemplates.isActive, true)
        ));

      return result.map(template => new TemplateEntity(
        template.id,
        template.name,
        template.content,
        template.category,
        template.tenantId,
        template.createdBy,
        template.description || undefined,
        template.subject || undefined,
        Array.isArray(template.variables) ? template.variables : [],
        template.isActive,
        template.usageCount,
        template.createdAt,
        template.updatedAt
      ));
    } catch (error) {
      console.error('[DrizzleTemplateRepository] Error finding active templates:', error);
      return [];
    }
  }

  async create(template: TemplateEntity): Promise<TemplateEntity> {
    try {
      const templateData = {
        id: template.id,
        name: template.name,
        description: template.description,
        subject: template.subject,
        content: template.content,
        variables: template.variables,
        category: template.category,
        isActive: template.isActive,
        usageCount: template.usage_count,
        tenantId: template.tenantId,
        createdBy: template.createdBy,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      };

      await db.insert(omnibridgeTemplates).values(templateData);
      return template;
    } catch (error) {
      console.error('[DrizzleTemplateRepository] Error creating template:', error);
      throw new Error('Failed to create template');
    }
  }

  async update(template: TemplateEntity): Promise<TemplateEntity> {
    try {
      const updateData = {
        name: template.name,
        description: template.description,
        subject: template.subject,
        content: template.content,
        variables: template.variables,
        category: template.category,
        isActive: template.isActive,
        usageCount: template.usage_count,
        updatedAt: new Date()
      };

      await db
        .update(omnibridgeTemplates)
        .set(updateData)
        .where(and(
          eq(omnibridgeTemplates.id, template.id),
          eq(omnibridgeTemplates.tenantId, template.tenantId)
        ));

      return template;
    } catch (error) {
      console.error('[DrizzleTemplateRepository] Error updating template:', error);
      throw new Error('Failed to update template');
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      await db
        .delete(omnibridgeTemplates)
        .where(and(
          eq(omnibridgeTemplates.id, id),
          eq(omnibridgeTemplates.tenantId, tenantId)
        ));

      return true;
    } catch (error) {
      console.error('[DrizzleTemplateRepository] Error deleting template:', error);
      return false;
    }
  }

  async incrementUsage(id: string, tenantId: string): Promise<boolean> {
    try {
      await db
        .update(omnibridgeTemplates)
        .set({ 
          usageCount: sql`${omnibridgeTemplates.usageCount} + 1`,
          updatedAt: new Date()
        })
        .where(and(
          eq(omnibridgeTemplates.id, id),
          eq(omnibridgeTemplates.tenantId, tenantId)
        ));

      return true;
    } catch (error) {
      console.error('[DrizzleTemplateRepository] Error incrementing usage:', error);
      return false;
    }
  }
}