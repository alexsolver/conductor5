// ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATE REPOSITORY PADRONIZADO
import { db, ticketTemplates, TicketTemplate, InsertTicketTemplate } from '@shared/schema-master';
import { eq, and, desc, asc, isNull, or } from 'drizzle-orm';

export class TicketTemplateRepository {
  // ✅ 1QA.MD: Removendo dependência de schemaManager - usando db direto

  async getTemplatesByCompany(tenantId: string, customerCompanyId?: string): Promise<TicketTemplate[]> {
    try {

      let whereConditions;

      if (customerCompanyId === 'all' || customerCompanyId === undefined || customerCompanyId === null) {
        // Show only global templates when no specific company is selected
        whereConditions = and(
          eq(ticketTemplates.tenantId, tenantId),
          eq(ticketTemplates.isGlobal, true),
          eq(ticketTemplates.isActive, true)
        );
      } else {
        // Show global templates + company-specific templates
        const companyConditions = or(
          eq(ticketTemplates.isGlobal, true), // Global templates available to all
          and(
            eq(ticketTemplates.isGlobal, false),
            eq(ticketTemplates.companyId, customerCompanyId)
          )
        );

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
          desc(ticketTemplates.isGlobal), // Global templates first
          asc(ticketTemplates.sortOrder),
          desc(ticketTemplates.usageCount),
          asc(ticketTemplates.name)
        );
    } catch (error) {
      console.error('Error fetching templates by company:', error);
      return [];
    }
  }

  async getGlobalTemplates(tenantId: string): Promise<TicketTemplate[]> {
    try {
      return await db
        .select()
        .from(ticketTemplates)
        .where(
          and(
            eq(ticketTemplates.tenantId, tenantId),
            eq(ticketTemplates.isGlobal, true),
            eq(ticketTemplates.isActive, true)
          )
        )
        .orderBy(
          asc(ticketTemplates.sortOrder),
          desc(ticketTemplates.usageCount),
          asc(ticketTemplates.name)
        );
    } catch (error) {
      console.error('Error fetching global templates:', error);
      return [];
    }
  }

  async getCompanySpecificTemplates(tenantId: string, companyId: string): Promise<TicketTemplate[]> {
    try {
      return await db
        .select()
        .from(ticketTemplates)
        .where(
          and(
            eq(ticketTemplates.tenantId, tenantId),
            eq(ticketTemplates.isGlobal, false),
            eq(ticketTemplates.companyId, companyId),
            eq(ticketTemplates.isActive, true)
          )
        )
        .orderBy(
          asc(ticketTemplates.sortOrder),
          desc(ticketTemplates.usageCount),
          asc(ticketTemplates.name)
        );
    } catch (error) {
      console.error('Error fetching company-specific templates:', error);
      return [];
    }
  }

  async getTemplateById(tenantId: string, templateId: string): Promise<TicketTemplate | null> {
    try {
      const results = await db
        .select()
        .from(ticketTemplates)
        .where(
          and(
            eq(ticketTemplates.tenantId, tenantId),
            eq(ticketTemplates.id, templateId)
          )
        )
        .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      return null;
    }
  }

  async createTemplate(template: InsertTicketTemplate): Promise<TicketTemplate> {
    try {
      // Handle null, undefined, or 'null' string values for companyId
      const processedTemplate = {
        ...template,
        companyId: template.companyId === 'null' || template.companyId === undefined || template.companyId === null ? null : template.companyId,
        isGlobal: template.companyId === 'null' || template.companyId === undefined || template.companyId === null ? true : false,
        defaultType: template.defaultType || 'support',
        defaultPriority: template.defaultPriority || 'medium',
        defaultStatus: template.defaultStatus || 'open',
        defaultCategory: template.defaultCategory || template.category || 'Geral',
        isActive: template.isActive ?? true,
        sortOrder: template.sortOrder ?? 0,
        customFields: template.customFields || {},
        autoAssignmentRules: template.autoAssignmentRules || {},
        slaOverride: template.slaOverride || {}
      };

      const results = await db
        .insert(ticketTemplates)
        .values(processedTemplate)
        .returning();

      return results[0];
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(tenantId: string, templateId: string, updates: Partial<InsertTicketTemplate>): Promise<TicketTemplate | null> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(tenantId);

    const setClause = [];
    const values = [tenantId, templateId];
    let paramIndex = 3;

    if (updates.name !== undefined) {
      setClause.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClause.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.category !== undefined) {
      setClause.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }

    if (setClause.length === 0) {
      return await this.getTemplateById(tenantId, templateId);
    }

    setClause.push(`updated_at = NOW()`);

    const query = `
      UPDATE "${schemaName}".ticket_templates 
      SET ${setClause.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteTemplate(tenantId: string, templateId: string): Promise<boolean> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(tenantId);

    const query = `
      DELETE FROM "${schemaName}".ticket_templates 
      WHERE tenant_id = $1 AND id = $2
    `;

    const result = await pool.query(query, [tenantId, templateId]);
    return result.rowCount > 0;
  }

  async incrementUsage(tenantId: string, templateId: string): Promise<void> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(tenantId);

    const query = `
      UPDATE "${schemaName}".ticket_templates 
      SET usage_count = usage_count + 1, last_used_at = NOW()
      WHERE tenant_id = $1 AND id = $2
    `;

    await pool.query(query, [tenantId, templateId]);
  }

  async getTemplateStats(tenantId: string, customerCompanyId?: string): Promise<any> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(tenantId);

    // Handle null, undefined, or 'null' string values
    const companyId = customerCompanyId === 'null' || customerCompanyId === undefined || customerCompanyId === null ? null : customerCompanyId;

    let whereClause = 'WHERE tenant_id = $1';
    const values = [tenantId];

    if (companyId !== null) {
      whereClause += ' AND (company_id = $2 OR company_id IS NULL)';
      values.push(companyId);
    }

    const query = `
      SELECT 
        COUNT(*) as total_templates,
        COUNT(CASE WHEN is_active THEN 1 END) as active_templates,
        AVG(usage_count) as avg_usage,
        MAX(usage_count) as max_usage,
        category,
        COUNT(*) as category_count
      FROM "${schemaName}".ticket_templates 
      ${whereClause}
      GROUP BY ROLLUP(category)
      ORDER BY category_count DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  async searchTemplates(
    tenantId: string, 
    customerCompanyId: string | undefined,
    searchQuery: string,
    category?: string
  ): Promise<TicketTemplate[]> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(tenantId);

    let whereClause = `
      WHERE tenant_id = $1 
      AND (company_id = $2 OR company_id IS NULL)
      AND is_active = true
      AND (name ILIKE $3 OR description ILIKE $3)
    `;

    const values = [tenantId, customerCompanyId, `%${searchQuery}%`];

    if (category) {
      whereClause += ' AND category = $4';
      values.push(category);
    }

    const query = `
      SELECT * FROM "${schemaName}".ticket_templates ${whereClause}
      ORDER BY usage_count DESC, name ASC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getPopularTemplates(tenantId: string, customerCompanyId?: string, limit: number = 10): Promise<TicketTemplate[]> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(tenantId);

    let whereClause = 'WHERE tenant_id = $1';
    const values = [tenantId, limit];

    if (customerCompanyId) {
      whereClause += ' AND (company_id = $3 OR company_id IS NULL)';
      values.push(customerCompanyId);
    }

    const query = `
      SELECT * FROM "${schemaName}".ticket_templates 
      ${whereClause}
      AND is_active = true
      AND usage_count > 0
      ORDER BY usage_count DESC, last_used_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getTemplateCategories(tenantId: string, customerCompanyId?: string): Promise<string[]> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(tenantId);

    // Handle null, undefined, or 'null' string values
    const companyId = customerCompanyId === 'null' || customerCompanyId === undefined || customerCompanyId === null ? null : customerCompanyId;

    let whereClause = 'WHERE tenant_id = $1';
    const values = [tenantId];

    if (companyId !== null) {
      whereClause += ' AND (company_id = $2 OR company_id IS NULL)';
      values.push(companyId);
    }

    const query = `
      SELECT DISTINCT category FROM "${schemaName}".ticket_templates 
      ${whereClause}
      AND is_active = true
      ORDER BY category
    `;

    const result = await pool.query(query, values);
    return result.rows.map(row => row.category);
  }
}