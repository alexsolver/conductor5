import { eq, and, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { IInternalFormSubmissionRepository } from '../../domain/repositories/IInternalFormSubmissionRepository';
import { 
  InternalFormSubmission, 
  InsertInternalFormSubmission,
  internalFormSubmissions 
} from '@shared/schema';
import * as schema from '@shared/schema';

export class DrizzleInternalFormSubmissionRepository implements IInternalFormSubmissionRepository {
  
  private async getDb(tenantId: string) {
    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${tenantSchema}`,
      ssl: false,
    });
    return drizzle({ client: pool, schema });
  }
  
  async create(submission: InsertInternalFormSubmission): Promise<InternalFormSubmission> {
    const db = await this.getDb(submission.tenantId);
    
    const [created] = await db
      .insert(internalFormSubmissions)
      .values(submission)
      .returning();
    
    return created;
  }

  async findById(id: string, tenantId: string): Promise<InternalFormSubmission | null> {
    const db = await this.getDb(tenantId);
    
    const [submission] = await db
      .select()
      .from(internalFormSubmissions)
      .where(
        and(
          eq(internalFormSubmissions.id, id),
          eq(internalFormSubmissions.tenantId, tenantId)
        )
      )
      .limit(1);
    
    return submission || null;
  }

  async findByFormId(formId: string, tenantId: string): Promise<InternalFormSubmission[]> {
    const db = await this.getDb(tenantId);
    
    const submissions = await db
      .select()
      .from(internalFormSubmissions)
      .where(
        and(
          eq(internalFormSubmissions.formId, formId),
          eq(internalFormSubmissions.tenantId, tenantId)
        )
      )
      .orderBy(desc(internalFormSubmissions.submittedAt));
    
    return submissions;
  }

  async findByTicketId(ticketId: string, tenantId: string): Promise<InternalFormSubmission[]> {
    const db = await this.getDb(tenantId);
    
    const submissions = await db
      .select()
      .from(internalFormSubmissions)
      .where(
        and(
          eq(internalFormSubmissions.ticketId, ticketId),
          eq(internalFormSubmissions.tenantId, tenantId)
        )
      )
      .orderBy(desc(internalFormSubmissions.submittedAt));
    
    return submissions;
  }

  async updateStatus(
    id: string,
    status: 'submitted' | 'in_approval' | 'approved' | 'rejected',
    tenantId: string,
    userId?: string,
    reason?: string
  ): Promise<void> {
    const db = await this.getDb(tenantId);
    
    const updateData: any = { status };
    
    if (status === 'approved' && userId) {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    } else if (status === 'rejected' && userId) {
      updateData.rejectedBy = userId;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = reason;
    }
    
    await db
      .update(internalFormSubmissions)
      .set(updateData)
      .where(
        and(
          eq(internalFormSubmissions.id, id),
          eq(internalFormSubmissions.tenantId, tenantId)
        )
      );
  }
}
