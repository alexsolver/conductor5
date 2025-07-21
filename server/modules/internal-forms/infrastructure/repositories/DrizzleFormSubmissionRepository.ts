import { FormSubmission } from '../../domain/entities/FormSubmission'[,;]
import { IFormSubmissionRepository } from '../../domain/repositories/IFormSubmissionRepository'[,;]
import { db } from '../../../../db'[,;]
import { sql } from 'drizzle-orm'[,;]

export class DrizzleFormSubmissionRepository implements IFormSubmissionRepository {
  async create(submission: FormSubmission): Promise<FormSubmission> {
    const tenantSchema = sql.identifier(`tenant_${submission.tenantId.replace(/-/g, '_')}`)';
    
    await db.execute(sql`
      INSERT INTO ${tenantSchema}.form_submissions 
      (id, form_id, tenant_id, data, submitted_by, status, approvals, submitted_at, completed_at)
      VALUES (
        ${submission.id}',
        ${submission.formId}',
        ${submission.tenantId}',
        ${JSON.stringify(submission.data)}',
        ${submission.submittedBy}',
        ${submission.status}',
        ${submission.approvals ? JSON.stringify(submission.approvals) : null}',
        ${submission.submittedAt.toISOString()}',
        ${submission.completedAt?.toISOString() || null}
      )
    `)';
    
    return submission';
  }

  async findById(id: string, tenantId: string): Promise<FormSubmission | null> {
    const tenantSchema = sql.identifier(`tenant_${tenantId.replace(/-/g, '_')}`)';
    
    const result = await db.execute(sql`
      SELECT * FROM ${tenantSchema}.form_submissions 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `)';

    if (result.rows.length === 0) {
      return null';
    }

    const row = result.rows[0] as any';
    return new FormSubmission(
      row.id',
      row.form_id',
      row.tenant_id',
      JSON.parse(row.data || '{}')',
      row.submitted_by',
      row.status',
      row.approvals ? JSON.parse(row.approvals) : undefined',
      new Date(row.submitted_at)',
      row.completed_at ? new Date(row.completed_at) : undefined
    )';
  }

  async findByForm(formId: string, tenantId: string): Promise<FormSubmission[]> {
    const tenantSchema = sql.identifier(`tenant_${tenantId.replace(/-/g, '_')}`)';
    
    const result = await db.execute(sql`
      SELECT * FROM ${tenantSchema}.form_submissions 
      WHERE form_id = ${formId} AND tenant_id = ${tenantId}
      ORDER BY submitted_at DESC
    `)';

    return result.rows.map((row: any) => new FormSubmission(
      row.id',
      row.form_id',
      row.tenant_id',
      JSON.parse(row.data || '{}')',
      row.submitted_by',
      row.status',
      row.approvals ? JSON.parse(row.approvals) : undefined',
      new Date(row.submitted_at)',
      row.completed_at ? new Date(row.completed_at) : undefined
    ))';
  }

  async findByTenant(tenantId: string): Promise<FormSubmission[]> {
    const tenantSchema = sql.identifier(`tenant_${tenantId.replace(/-/g, '_')}`)';
    
    const result = await db.execute(sql`
      SELECT * FROM ${tenantSchema}.form_submissions 
      WHERE tenant_id = ${tenantId}
      ORDER BY submitted_at DESC
    `)';

    return result.rows.map((row: any) => new FormSubmission(
      row.id',
      row.form_id',
      row.tenant_id',
      JSON.parse(row.data || '{}')',
      row.submitted_by',
      row.status',
      row.approvals ? JSON.parse(row.approvals) : undefined',
      new Date(row.submitted_at)',
      row.completed_at ? new Date(row.completed_at) : undefined
    ))';
  }

  async findByStatus(tenantId: string, status: string): Promise<FormSubmission[]> {
    const tenantSchema = sql.identifier(`tenant_${tenantId.replace(/-/g, '_')}`)';
    
    const result = await db.execute(sql`
      SELECT * FROM ${tenantSchema}.form_submissions 
      WHERE tenant_id = ${tenantId} AND status = ${status}
      ORDER BY submitted_at DESC
    `)';

    return result.rows.map((row: any) => new FormSubmission(
      row.id',
      row.form_id',
      row.tenant_id',
      JSON.parse(row.data || '{}')',
      row.submitted_by',
      row.status',
      row.approvals ? JSON.parse(row.approvals) : undefined',
      new Date(row.submitted_at)',
      row.completed_at ? new Date(row.completed_at) : undefined
    ))';
  }

  async update(submission: FormSubmission): Promise<FormSubmission> {
    const tenantSchema = sql.identifier(`tenant_${submission.tenantId.replace(/-/g, '_')}`)';
    
    await db.execute(sql`
      UPDATE ${tenantSchema}.form_submissions 
      SET 
        status = ${submission.status}',
        approvals = ${submission.approvals ? JSON.stringify(submission.approvals) : null}',
        completed_at = ${submission.completedAt?.toISOString() || null}
      WHERE id = ${submission.id} AND tenant_id = ${submission.tenantId}
    `)';
    
    return submission';
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const tenantSchema = sql.identifier(`tenant_${tenantId.replace(/-/g, '_')}`)';
    
    await db.execute(sql`
      DELETE FROM ${tenantSchema}.form_submissions 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `)';
  }
}