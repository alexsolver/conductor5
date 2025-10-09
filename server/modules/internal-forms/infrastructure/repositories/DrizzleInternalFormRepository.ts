
/**
 * Drizzle Internal Form Repository - Phase 10 Implementation
 * 
 * Implementação Drizzle para operações de persistência de Internal Forms
 * Segue padrões estabelecidos no 1qa.md para Clean Architecture
 * 
 * @module DrizzleInternalFormRepository
 * @version 1.0.0
 * @created 2025-09-24 - Phase 10 Clean Architecture Implementation
 */

import { Pool } from 'pg';
import { IInternalFormRepository, InternalFormFilters } from '../../domain/repositories/IInternalFormRepository';
import { InternalForm, FormSubmission, FormCategory } from '../../domain/entities/InternalForm';

export class DrizzleInternalFormRepository implements IInternalFormRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // Helper function to safely parse JSON fields
  // PostgreSQL returns JSONB as objects, not strings
  private safeJSONParse(value: any, fallback: any = []): any {
    if (value === null || value === undefined) {
      return fallback;
    }
    // If it's already an object/array, return it as-is
    if (typeof value === 'object') {
      return value;
    }
    // If it's a string, try to parse it
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  // ===== CRUD OPERATIONS =====
  
  async create(form: InternalForm): Promise<InternalForm> {
    console.log(`✅ [InternalFormRepository] Creating form for tenant: ${form.tenantId}`);
    console.log(`[InternalFormRepository] Form data:`, JSON.stringify(form, null, 2));
    
    const schemaName = this.getSchemaName(form.tenantId);
    console.log(`[InternalFormRepository] Using schema: ${schemaName}`);
    
    // ✅ 1QA.MD MULTITENANT: Always validate tenant_id
    if (!form.tenantId || form.tenantId.length !== 36) {
      throw new Error('Invalid tenant ID format - must be UUID v4');
    }

    const query = `
      INSERT INTO "${schemaName}".internal_forms (
        id, tenant_id, name, description, category, fields, actions,
        is_active, created_at, updated_at, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      form.id,
      form.tenantId,
      form.name,
      form.description || '',
      form.category,
      JSON.stringify(form.fields),
      JSON.stringify(form.actions),
      form.isActive,
      form.createdAt,
      form.updatedAt,
      form.createdBy,
      form.updatedBy
    ];

    console.log(`[InternalFormRepository] Executing query:`, query);
    console.log(`[InternalFormRepository] With values:`, values);

    try {
      const result = await this.pool.query(query, values);
      console.log(`[InternalFormRepository] Query result:`, result.rows[0]);
      
      if (result.rows.length === 0) {
        throw new Error('No rows returned from insert operation');
      }

      const row = result.rows[0];

      const createdForm = {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        description: row.description,
        category: row.category,
        fields: this.safeJSONParse(row.fields, []),
        actions: this.safeJSONParse(row.actions, []),
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by,
        updatedBy: row.updated_by
      };

      console.log(`✅ [InternalFormRepository] Form created successfully:`, createdForm);
      return createdForm;
    } catch (error) {
      console.error(`❌ [InternalFormRepository] Error creating form:`, error);
      throw error;
    }
  }

  async findById(id: string, tenantId: string): Promise<InternalForm | null> {
    console.log(`🔍 [InternalFormRepository] Finding form by ID: ${id} for tenant: ${tenantId}`);
    
    const schemaName = this.getSchemaName(tenantId);
    
    const query = `
      SELECT * FROM "${schemaName}".internal_forms
      WHERE id = $1 AND tenant_id = $2 AND is_active = true
    `;

    const result = await this.pool.query(query, [id, tenantId]);
    
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      category: row.category,
      fields: this.safeJSONParse(row.fields, []),
      actions: this.safeJSONParse(row.actions, []),
      isActive: row.is_active,
      isTemplate: row.is_template || false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  async findAll(filters: InternalFormFilters): Promise<InternalForm[]> {
    console.log(`🔍 [InternalFormRepository] Finding all forms for tenant: ${filters.tenantId}`, filters);
    
    const schemaName = this.getSchemaName(filters.tenantId);
    
    // ✅ 1QA.MD: Always filter by tenant_id AND is_active = true by default
    let whereConditions = ['tenant_id = $1', 'is_active = true'];
    let queryParams = [filters.tenantId];
    let paramIndex = 2;

    if (filters.category) {
      whereConditions.push(`category = $${paramIndex}`);
      queryParams.push(filters.category);
      paramIndex++;
    }

    // Only override is_active filter if explicitly provided
    if (filters.isActive === false) {
      // Remove the default is_active = true condition and add the explicit one
      whereConditions = whereConditions.filter(c => !c.includes('is_active'));
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(String(filters.isActive));
      paramIndex++;
    }

    if (filters.search) {
      whereConditions.push(`(
        LOWER(name) LIKE LOWER($${paramIndex}) OR
        LOWER(description) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.createdBy) {
      whereConditions.push(`created_by = $${paramIndex}`);
      queryParams.push(filters.createdBy);
      paramIndex++;
    }

    if (filters.isTemplate !== undefined) {
      whereConditions.push(`is_template = $${paramIndex}`);
      queryParams.push(String(filters.isTemplate));
      paramIndex++;
    }

    const query = `
      SELECT * FROM "${schemaName}".internal_forms
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    console.log(`🔍 [InternalFormRepository] Query: ${query}`, queryParams);

    const result = await this.pool.query(query, queryParams);

    console.log(`✅ [InternalFormRepository] Found ${result.rows.length} active forms`);

    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      category: row.category,
      fields: this.safeJSONParse(row.fields, []),
      actions: this.safeJSONParse(row.actions, []),
      isActive: row.is_active,
      isTemplate: row.is_template || false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      updatedBy: row.updated_by
    }));
  }

  async findByActionType(actionType: string, tenantId: string): Promise<InternalForm[]> {
    console.log(`🔍 [InternalFormRepository] Finding forms by action type: ${actionType} for tenant: ${tenantId}`);
    
    const schemaName = this.getSchemaName(tenantId);
    
    // Query forms where the actions array contains the specific action type
    const query = `
      SELECT * FROM "${schemaName}".internal_forms
      WHERE tenant_id = $1
        AND is_active = true
        AND actions @> $2::jsonb
      ORDER BY created_at DESC
    `;

    // Convert actionType to JSONB array format for comparison
    const actionTypeJson = JSON.stringify([actionType]);
    
    const result = await this.pool.query(query, [tenantId, actionTypeJson]);

    console.log(`✅ [InternalFormRepository] Found ${result.rows.length} forms for action type: ${actionType}`);

    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      category: row.category,
      fields: this.safeJSONParse(row.fields, []),
      actions: this.safeJSONParse(row.actions, []),
      isActive: row.is_active,
      isTemplate: row.is_template || false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      updatedBy: row.updated_by
    }));
  }

  async update(id: string, tenantId: string, updateData: Partial<InternalForm>): Promise<InternalForm | null> {
    console.log(`🔄 [InternalFormRepository] Updating form: ${id} for tenant: ${tenantId}`);
    
    const schemaName = this.getSchemaName(tenantId);
    
    const setClause = [];
    const queryParams = [];
    let paramIndex = 1;

    if (updateData.name) {
      setClause.push(`name = $${paramIndex}`);
      queryParams.push(updateData.name);
      paramIndex++;
    }

    if (updateData.description !== undefined) {
      setClause.push(`description = $${paramIndex}`);
      queryParams.push(updateData.description);
      paramIndex++;
    }

    if (updateData.category) {
      setClause.push(`category = $${paramIndex}`);
      queryParams.push(updateData.category);
      paramIndex++;
    }

    if (updateData.fields) {
      setClause.push(`fields = $${paramIndex}`);
      queryParams.push(JSON.stringify(updateData.fields));
      paramIndex++;
    }

    if (updateData.actions) {
      setClause.push(`actions = $${paramIndex}`);
      queryParams.push(JSON.stringify(updateData.actions));
      paramIndex++;
    }

    if (updateData.isActive !== undefined) {
      setClause.push(`is_active = $${paramIndex}`);
      queryParams.push(updateData.isActive);
      paramIndex++;
    }

    if (updateData.updatedBy) {
      setClause.push(`updated_by = $${paramIndex}`);
      queryParams.push(updateData.updatedBy);
      paramIndex++;
    }

    setClause.push(`updated_at = $${paramIndex}`);
    queryParams.push(new Date());
    paramIndex++;

    queryParams.push(id, tenantId);

    const query = `
      UPDATE "${schemaName}".internal_forms
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await this.pool.query(query, queryParams);
    
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      category: row.category,
      fields: this.safeJSONParse(row.fields, []),
      actions: this.safeJSONParse(row.actions, []),
      isActive: row.is_active,
      isTemplate: row.is_template || false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    console.log(`🗑️ [InternalFormRepository] Soft-deleting form: ${id} for tenant: ${tenantId}`);
    
    const schemaName = this.getSchemaName(tenantId);
    
    const query = `
      UPDATE "${schemaName}".internal_forms
      SET is_active = false, updated_at = $1
      WHERE id = $2 AND tenant_id = $3
    `;

    const result = await this.pool.query(query, [new Date(), id, tenantId]);
    return (result.rowCount || 0) > 0;
  }

  // ===== SUBMISSION OPERATIONS =====

  async createSubmission(submission: FormSubmission): Promise<FormSubmission> {
    console.log(`✅ [InternalFormRepository] Creating submission for form: ${submission.formId}`);
    
    const schemaName = this.getSchemaName(submission.tenantId);
    
    const query = `
      INSERT INTO "${schemaName}".internal_form_submissions (
        id, form_id, tenant_id, submitted_by, submitted_at, data, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      submission.id,
      submission.formId,
      submission.tenantId,
      submission.submittedBy,
      submission.submittedAt,
      JSON.stringify(submission.data),
      submission.status
    ];

    const result = await this.pool.query(query, values);
    const row = result.rows[0];

    return {
      ...row,
      data: this.safeJSONParse(row.data, {}),
      submittedAt: new Date(row.submitted_at),
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : undefined
    };
  }

  async findSubmissions(formId: string, tenantId: string): Promise<FormSubmission[]> {
    console.log(`🔍 [InternalFormRepository] Finding submissions for form: ${formId}`);
    
    const schemaName = this.getSchemaName(tenantId);
    
    const query = `
      SELECT 
        s.*,
        CONCAT(u.first_name, ' ', u.last_name) as submitted_by_name,
        u.email as submitted_by_email,
        ai.name as ai_agent_name
      FROM "${schemaName}".internal_form_submissions s
      LEFT JOIN "${schemaName}".users u ON s.submitted_by = u.id
      LEFT JOIN "${schemaName}".omnibridge_ai_agents ai ON s.submitted_by = ai.id
      WHERE s.form_id = $1 AND s.tenant_id = $2
      ORDER BY s.submitted_at DESC
    `;

    const result = await this.pool.query(query, [formId, tenantId]);

    return result.rows.map(row => ({
      id: row.id,
      formId: row.form_id,
      tenantId: row.tenant_id,
      submittedBy: row.submitted_by,
      submittedByName: row.ai_agent_name || row.submitted_by_name || row.submitted_by_email || row.submitted_by,
      submittedAt: new Date(row.submitted_at),
      data: this.safeJSONParse(row.data, {}),
      status: row.status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : undefined,
      rejectionReason: row.rejection_reason
    }));
  }

  async findAllSubmissions(tenantId: string): Promise<FormSubmission[]> {
    console.log(`🔍 [InternalFormRepository] Finding all submissions for tenant: ${tenantId}`);
    
    const schemaName = this.getSchemaName(tenantId);
    
    const query = `
      SELECT 
        s.*,
        CONCAT(u.first_name, ' ', u.last_name) as submitted_by_name,
        u.email as submitted_by_email,
        ai.name as ai_agent_name
      FROM "${schemaName}".internal_form_submissions s
      LEFT JOIN "${schemaName}".users u ON s.submitted_by = u.id
      LEFT JOIN "${schemaName}".omnibridge_ai_agents ai ON s.submitted_by = ai.id
      WHERE s.tenant_id = $1 AND s.action_id IS NULL
      ORDER BY s.submitted_at DESC
    `;

    const result = await this.pool.query(query, [tenantId]);

    return result.rows.map(row => ({
      id: row.id,
      formId: row.form_id,
      tenantId: row.tenant_id,
      submittedBy: row.submitted_by,
      submittedByName: row.ai_agent_name || row.submitted_by_name || row.submitted_by_email || row.submitted_by,
      submittedAt: new Date(row.submitted_at),
      data: this.safeJSONParse(row.data, {}),
      status: row.status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : undefined,
      rejectionReason: row.rejection_reason
    }));
  }

  // ===== CATEGORY OPERATIONS =====

  async getCategories(tenantId: string): Promise<FormCategory[]> {
    console.log(`🔍 [InternalFormRepository] Getting categories for tenant: ${tenantId}`);
    
    const schemaName = this.getSchemaName(tenantId);
    
    const query = `
      SELECT * FROM "${schemaName}".internal_form_categories
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY name
    `;

    const result = await this.pool.query(query, [tenantId]);

    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      isActive: row.is_active
    }));
  }

  async createCategory(category: FormCategory): Promise<FormCategory> {
    console.log(`✅ [InternalFormRepository] Creating category for tenant: ${category.tenantId}`);
    
    const schemaName = this.getSchemaName(category.tenantId);
    
    const query = `
      INSERT INTO "${schemaName}".internal_form_categories (
        id, tenant_id, name, icon, color, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      category.id,
      category.tenantId,
      category.name,
      category.icon,
      category.color,
      category.isActive
    ];

    const result = await this.pool.query(query, values);
    const row = result.rows[0];

    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      isActive: row.is_active
    };
  }
}
