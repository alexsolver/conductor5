import { TicketTemplate, InsertTicketTemplate } from '../../../shared/schema';

export class TicketTemplateRepository {
  constructor(private schemaManager: any) {}

  async getTemplatesByCompany(
    tenantId: string, 
    customerCompanyId?: string, 
    includePublic: boolean = true
  ): Promise<TicketTemplate[]> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(tenantId);
    
    // Handle null, undefined, or 'null' string values
    const companyId = customerCompanyId === 'null' || customerCompanyId === undefined || customerCompanyId === null ? null : customerCompanyId;
    
    let query: string;
    let params: any[];
    
    if (companyId === null) {
      // Show all public templates when no specific company
      query = `
        SELECT * FROM "${schemaName}".ticket_templates 
        WHERE tenant_id = $1 
        AND (customer_company_id IS NULL OR is_public = true)
        AND is_active = true
        ORDER BY sort_order ASC, usage_count DESC, name ASC
      `;
      params = [tenantId];
    } else {
      // Show company-specific + public templates
      query = `
        SELECT * FROM "${schemaName}".ticket_templates 
        WHERE tenant_id = $1 
        AND (
          customer_company_id = $2 
          ${includePublic ? 'OR customer_company_id IS NULL' : ''}
        )
        AND is_active = true
        ORDER BY sort_order ASC, usage_count DESC, name ASC
      `;
      params = [tenantId, companyId];
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTemplateById(tenantId: string, templateId: string): Promise<TicketTemplate | null> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(tenantId);
    
    const query = `
      SELECT * FROM "${schemaName}".ticket_templates 
      WHERE tenant_id = $1 AND id = $2
    `;
    
    const result = await pool.query(query, [tenantId, templateId]);
    return result.rows[0] || null;
  }

  async createTemplate(template: InsertTicketTemplate): Promise<TicketTemplate> {
    const pool = this.schemaManager.getPool();
    const schemaName = this.schemaManager.getSchemaName(template.tenantId);
    
    // Handle null, undefined, or 'null' string values for customerCompanyId
    const companyId = template.customerCompanyId === 'null' || template.customerCompanyId === undefined || template.customerCompanyId === null ? null : template.customerCompanyId;
    
    const query = `
      INSERT INTO "${schemaName}".ticket_templates (
        tenant_id, customer_company_id, name, description, category, subcategory,
        default_title, default_description, default_type, default_priority, 
        default_status, default_category, default_urgency, default_impact,
        default_assignee_id, default_assignment_group, default_department,
        required_fields, optional_fields, hidden_fields, custom_fields,
        auto_assignment_rules, sla_override, is_active, is_public, 
        sort_order, created_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      ) RETURNING *
    `;

    const values = [
      template.tenantId,
      companyId, // Use the processed companyId instead of original
      template.name,
      template.description,
      template.category,
      template.subcategory,
      template.defaultTitle,
      template.defaultDescription,
      template.defaultType,
      template.defaultPriority,
      template.defaultStatus,
      template.defaultCategory,
      template.defaultUrgency,
      template.defaultImpact,
      template.defaultAssigneeId,
      template.defaultAssignmentGroup,
      template.defaultDepartment,
      template.requiredFields,
      template.optionalFields,
      template.hiddenFields,
      JSON.stringify(template.customFields || {}),
      JSON.stringify(template.autoAssignmentRules || {}),
      JSON.stringify(template.slaOverride || {}),
      template.isActive ?? true,
      template.isPublic ?? true,
      template.sortOrder ?? 0,
      template.createdById
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
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
      whereClause += ' AND (customer_company_id = $2 OR customer_company_id IS NULL)';
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
      AND (customer_company_id = $2 OR customer_company_id IS NULL)
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
      whereClause += ' AND (customer_company_id = $3 OR customer_company_id IS NULL)';
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
      whereClause += ' AND (customer_company_id = $2 OR customer_company_id IS NULL)';
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