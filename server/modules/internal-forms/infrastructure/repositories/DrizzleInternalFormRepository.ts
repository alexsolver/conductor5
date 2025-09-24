
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

  // ===== CRUD OPERATIONS =====
  
  async create(form: InternalForm): Promise<InternalForm> {
    console.log(`✅ [InternalFormRepository] Creating form for tenant: ${form.tenantId}`);
    
    const schemaName = this.getSchemaName(form.tenantId);
    
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
      form.description,
      form.category,
      JSON.stringify(form.fields),
      JSON.stringify(form.actions),
      form.isActive,
      form.createdAt,
      form.updatedAt,
      form.createdBy,
      form.updatedBy
    ];

    const result = await this.pool.query(query, values);
    const row = result.rows[0];

    return {
      ...row,
      fields: JSON.parse(row.fields || '[]'),
      actions: JSON.parse(row.actions || '[]'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
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
      fields: JSON.parse(row.fields || '[]'),
      actions: JSON.parse(row.actions || '[]'),
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  async findAll(filters: InternalFormFilters): Promise<InternalForm[]> {
    console.log(`🔍 [InternalFormRepository] Finding all forms for tenant: ${filters.tenantId}`, filters);
    
    const schemaName = this.getSchemaName(filters.tenantId);
    
    let whereConditions = ['tenant_id = $1'];
    let queryParams = [filters.tenantId];
    let paramIndex = 2;

    if (filters.category) {
      whereConditions.push(`category = $${paramIndex}`);
      queryParams.push(filters.category);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(filters.isActive);
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

    const query = `
      SELECT * FROM "${schemaName}".internal_forms
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, queryParams);

    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      category: row.category,
      fields: JSON.parse(row.fields || '[]'),
      actions: JSON.parse(row.actions || '[]'),
      isActive: row.is_active,
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
      WHERE id = $${paramIndex - 1} AND tenant_id = $${paramIndex}
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
      fields: JSON.parse(row.fields || '[]'),
      actions: JSON.parse(row.actions || '[]'),
      isActive: row.is_active,
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
      data: JSON.parse(row.data || '{}'),
      submittedAt: new Date(row.submitted_at),
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : undefined
    };
  }

  async findSubmissions(formId: string, tenantId: string): Promise<FormSubmission[]> {
    console.log(`🔍 [InternalFormRepository] Finding submissions for form: ${formId}`);
    
    const schemaName = this.getSchemaName(tenantId);
    
    const query = `
      SELECT * FROM "${schemaName}".internal_form_submissions
      WHERE form_id = $1 AND tenant_id = $2
      ORDER BY submitted_at DESC
    `;

    const result = await this.pool.query(query, [formId, tenantId]);

    return result.rows.map(row => ({
      id: row.id,
      formId: row.form_id,
      tenantId: row.tenant_id,
      submittedBy: row.submitted_by,
      submittedAt: new Date(row.submitted_at),
      data: JSON.parse(row.data || '{}'),
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
      SELECT * FROM "${schemaName}".internal_form_submissions
      WHERE tenant_id = $1
      ORDER BY submitted_at DESC
    `;

    const result = await this.pool.query(query, [tenantId]);

    return result.rows.map(row => ({
      id: row.id,
      formId: row.form_id,
      tenantId: row.tenant_id,
      submittedBy: row.submitted_by,
      submittedAt: new Date(row.submitted_at),
      data: JSON.parse(row.data || '{}'),
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
