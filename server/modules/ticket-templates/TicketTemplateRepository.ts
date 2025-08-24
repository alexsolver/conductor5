// ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATE REPOSITORY PADRONIZADO
import { db, sql, ticketTemplates, TicketTemplate, InsertTicketTemplate } from '@shared/schema';
import { eq, and, desc, asc, isNull, or } from 'drizzle-orm';

export class TicketTemplateRepository {
  // ✅ 1QA.MD: Removendo dependência de schemaManager - usando db direto

  async getTemplatesByCompany(
    tenantId: string, 
    customerCompanyId?: string, 
    includePublic: boolean = true
  ): Promise<TicketTemplate[]> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Drizzle ORM query with proper tenant isolation
      const companyId = customerCompanyId === 'null' || customerCompanyId === undefined || customerCompanyId === null ? null : customerCompanyId;
      
      let whereConditions;
      
      if (companyId === null) {
        // Show all public templates when no specific company
        whereConditions = and(
          eq(ticketTemplates.tenantId, tenantId),
          isNull(ticketTemplates.companyId),
          eq(ticketTemplates.isActive, true)
        );
      } else {
        // Show company-specific + public templates
        const companyConditions = includePublic 
          ? or(
              eq(ticketTemplates.companyId, companyId),
              isNull(ticketTemplates.companyId)
            )
          : eq(ticketTemplates.companyId, companyId);

        whereConditions = and(
          eq(ticketTemplates.tenantId, tenantId),
          companyConditions,
          eq(ticketTemplates.isActive, true)
        );
      }
      
      return await db
        .select()
        .from(ticketTemplates)
        .where(whereConditions)
        .orderBy(
          asc(ticketTemplates.sortOrder),
          desc(ticketTemplates.usageCount),
          asc(ticketTemplates.name)
        );
    } catch (error) {
      console.error('Error fetching templates by company:', error);
      return [];
    }
  }

  async getTemplateById(tenantId: string, templateId: string): Promise<TicketTemplate | null> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Using Drizzle ORM with proper tenant isolation
      const templates = await db
        .select()
        .from(ticketTemplates)
        .where(and(
          eq(ticketTemplates.tenantId, tenantId),
          eq(ticketTemplates.id, templateId)
        ))
        .limit(1);
        
      return templates[0] || null;
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      return null;
    }
  }

  async createTemplate(template: InsertTicketTemplate): Promise<TicketTemplate> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Handle company ID properly
      const companyId = template.companyId === 'null' || template.companyId === undefined || template.companyId === null ? null : template.companyId;
      
      // ✅ 1QA.MD COMPLIANCE: Using Drizzle ORM for insert
      const newTemplate = {
        ...template,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      };
      
      const result = await db
        .insert(ticketTemplates)
        .values(newTemplate)
        .returning();
        
      return result[0];
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(tenantId: string, templateId: string, updates: Partial<InsertTicketTemplate>): Promise<TicketTemplate | null> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Using Drizzle ORM for update
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      const result = await db
        .update(ticketTemplates)
        .set(updateData)
        .where(and(
          eq(ticketTemplates.tenantId, tenantId),
          eq(ticketTemplates.id, templateId)
        ))
        .returning();
        
      return result[0] || null;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  async deleteTemplate(tenantId: string, templateId: string): Promise<boolean> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Using Drizzle ORM for delete
      const result = await db
        .delete(ticketTemplates)
        .where(and(
          eq(ticketTemplates.tenantId, tenantId),
          eq(ticketTemplates.id, templateId)
        ));
        
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  async incrementUsage(tenantId: string, templateId: string): Promise<void> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Using Drizzle ORM for increment
      await db
        .update(ticketTemplates)
        .set({
          usageCount: sql`usage_count + 1`,
          lastUsedAt: new Date()
        })
        .where(and(
          eq(ticketTemplates.tenantId, tenantId),
          eq(ticketTemplates.id, templateId)
        ));
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  }

  async getTemplateStats(tenantId: string, customerCompanyId?: string): Promise<any> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Using Drizzle ORM for stats query
      const companyId = customerCompanyId === 'null' || customerCompanyId === undefined || customerCompanyId === null ? null : customerCompanyId;
      
      let whereConditions = [eq(ticketTemplates.tenantId, tenantId)];
      
      if (companyId !== null) {
        whereConditions.push(
          or(
            eq(ticketTemplates.companyId, companyId),
            isNull(ticketTemplates.companyId)
          )
        );
      }
      
      // Get basic stats
      const stats = await db
        .select({
          totalTemplates: sql`COUNT(*)`.as('total_templates'),
          activeTemplates: sql`COUNT(CASE WHEN is_active THEN 1 END)`.as('active_templates'),
          avgUsage: sql`COALESCE(AVG(usage_count), 0)`.as('avg_usage'),
          maxUsage: sql`COALESCE(MAX(usage_count), 0)`.as('max_usage')
        })
        .from(ticketTemplates)
        .where(and(...whereConditions));
        
      return stats;
    } catch (error) {
      console.error('Error fetching template stats:', error);
      return [];
    }
  }

  async searchTemplates(
    tenantId: string, 
    customerCompanyId: string | undefined,
    searchQuery: string,
    category?: string
  ): Promise<TicketTemplate[]> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Using Drizzle ORM for search
      const companyId = customerCompanyId === 'null' || customerCompanyId === undefined || customerCompanyId === null ? null : customerCompanyId;
      
      let whereConditions = [
        eq(ticketTemplates.tenantId, tenantId),
        eq(ticketTemplates.isActive, true),
        or(
          sql`name ILIKE ${`%${searchQuery}%`}`,
          sql`description ILIKE ${`%${searchQuery}%`}`
        )
      ];
      
      if (companyId !== null) {
        whereConditions.push(
          or(
            eq(ticketTemplates.companyId, companyId),
            isNull(ticketTemplates.companyId)
          )
        );
      }
      
      if (category) {
        whereConditions.push(eq(ticketTemplates.category, category));
      }
      
      return await db
        .select()
        .from(ticketTemplates)
        .where(and(...whereConditions))
        .orderBy(
          desc(ticketTemplates.usageCount),
          asc(ticketTemplates.name)
        );
    } catch (error) {
      console.error('Error searching templates:', error);
      return [];
    }
  }

  async getPopularTemplates(tenantId: string, customerCompanyId?: string, limit: number = 10): Promise<TicketTemplate[]> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Using Drizzle ORM for popular templates
      const companyId = customerCompanyId === 'null' || customerCompanyId === undefined || customerCompanyId === null ? null : customerCompanyId;
      
      let whereConditions = [
        eq(ticketTemplates.tenantId, tenantId),
        eq(ticketTemplates.isActive, true),
        sql`usage_count > 0`
      ];
      
      if (companyId !== null) {
        whereConditions.push(
          or(
            eq(ticketTemplates.companyId, companyId),
            isNull(ticketTemplates.companyId)
          )
        );
      }
      
      return await db
        .select()
        .from(ticketTemplates)
        .where(and(...whereConditions))
        .orderBy(
          desc(ticketTemplates.usageCount),
          desc(ticketTemplates.lastUsedAt)
        )
        .limit(limit);
    } catch (error) {
      console.error('Error fetching popular templates:', error);
      return [];
    }
  }

  async getTemplateCategories(tenantId: string, customerCompanyId?: string): Promise<string[]> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Using Drizzle ORM for categories query
      const companyId = customerCompanyId === 'null' || customerCompanyId === undefined || customerCompanyId === null ? null : customerCompanyId;
      
      let whereConditions = [
        eq(ticketTemplates.tenantId, tenantId),
        eq(ticketTemplates.isActive, true)
      ];
      
      if (companyId !== null) {
        whereConditions.push(
          or(
            eq(ticketTemplates.companyId, companyId),
            isNull(ticketTemplates.companyId)
          )
        );
      }
      
      const result = await db
        .selectDistinct({ category: ticketTemplates.category })
        .from(ticketTemplates)
        .where(and(...whereConditions))
        .orderBy(asc(ticketTemplates.category));
        
      return result.map(row => row.category).filter(Boolean);
    } catch (error) {
      console.error('Error fetching template categories:', error);
      return [];
    }
  }
}