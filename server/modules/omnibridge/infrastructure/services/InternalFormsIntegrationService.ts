import { Pool } from 'pg';
import { InternalForm, FormSubmission } from '../../../internal-forms/domain/entities/InternalForm';
import { randomUUID } from 'crypto';

export class InternalFormsIntegrationService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  private safeJSONParse(value: any, fallback: any = []): any {
    if (value === null || value === undefined) {
      return fallback;
    }
    if (typeof value === 'object') {
      return value;
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  async getFormById(formId: string, tenantId: string): Promise<InternalForm | null> {
    const schemaName = this.getSchemaName(tenantId);
    
    const query = `
      SELECT * FROM "${schemaName}".internal_forms
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1
    `;

    const result = await this.pool.query(query, [formId, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

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
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  async getFormsByTenant(tenantId: string): Promise<InternalForm[]> {
    const schemaName = this.getSchemaName(tenantId);
    
    const query = `
      SELECT * FROM "${schemaName}".internal_forms
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY name
    `;

    const result = await this.pool.query(query, [tenantId]);

    return result.rows.map(row => ({
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
    }));
  }

  async createSubmission(
    formId: string,
    tenantId: string,
    submittedBy: string,
    data: Record<string, any>
  ): Promise<FormSubmission> {
    const schemaName = this.getSchemaName(tenantId);
    const id = randomUUID();
    const now = new Date();

    const query = `
      INSERT INTO "${schemaName}".form_submissions (
        id, form_id, tenant_id, submitted_by, submitted_at, data, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      id,
      formId,
      tenantId,
      submittedBy,
      now,
      JSON.stringify(data),
      'submitted'
    ];

    const result = await this.pool.query(query, values);
    const row = result.rows[0];

    return {
      id: row.id,
      formId: row.form_id,
      tenantId: row.tenant_id,
      submittedBy: row.submitted_by,
      submittedAt: new Date(row.submitted_at),
      data: this.safeJSONParse(row.data, {}),
      status: row.status
    };
  }

  async executeFormActions(formId: string, tenantId: string, submissionData: Record<string, any>): Promise<void> {
    const form = await this.getFormById(formId, tenantId);
    
    if (!form || !form.actions || form.actions.length === 0) {
      return;
    }

    console.log(`🔄 [InternalFormsIntegration] Executing ${form.actions.length} actions for form ${formId}`);

    for (const action of form.actions) {
      try {
        switch (action.type) {
          case 'ticket':
            console.log(`🎫 [InternalFormsIntegration] Would create ticket with data:`, submissionData);
            break;
          case 'email':
            console.log(`📧 [InternalFormsIntegration] Would send email notification`);
            break;
          case 'webhook':
            console.log(`🔗 [InternalFormsIntegration] Would call webhook:`, action.config);
            break;
          case 'approval':
            console.log(`✅ [InternalFormsIntegration] Would initiate approval flow`);
            break;
          default:
            console.log(`⚠️ [InternalFormsIntegration] Unknown action type: ${action.type}`);
        }
      } catch (error) {
        console.error(`❌ [InternalFormsIntegration] Error executing action ${action.type}:`, error);
      }
    }
  }
}
