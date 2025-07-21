
import { eq, and } from 'drizzle-orm''[,;]
import { db } from '../../../../db''[,;]
import { internalForms } from '../../../../../shared/schema''[,;]
import { InternalForm } from '../../domain/entities/InternalForm''[,;]
import { IInternalFormRepository } from '../../domain/repositories/IInternalFormRepository''[,;]

export class DrizzleInternalFormRepository implements IInternalFormRepository {
  async create(form: InternalForm): Promise<InternalForm> {
    const [result] = await db.insert(internalForms).values({
      id: form.id,
      tenantId: form.tenantId,
      name: form.name,
      description: form.description,
      category: form.category,
      fields: JSON.stringify(form.fields),
      actions: JSON.stringify(form.actions),
      approvalFlow: form.approvalFlow ? JSON.stringify(form.approvalFlow) : null,
      isActive: form.isActive,
      createdBy: form.createdBy,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt
    }).returning();

    return this.mapToEntity(result);
  }

  async findById(id: string, tenantId: string): Promise<InternalForm | null> {
    const [result] = await db
      .select()
      .from(internalForms)
      .where(and(eq(internalForms.id, id), eq(internalForms.tenantId, tenantId)));

    return result ? this.mapToEntity(result) : null;
  }

  async findByTenant(tenantId: string): Promise<InternalForm[]> {
    const results = await db
      .select()
      .from(internalForms)
      .where(eq(internalForms.tenantId, tenantId));

    return results.map(this.mapToEntity);
  }

  async findByCategory(tenantId: string, category: string): Promise<InternalForm[]> {
    const results = await db
      .select()
      .from(internalForms)
      .where(and(
        eq(internalForms.tenantId, tenantId),
        eq(internalForms.category, category)
      ));

    return results.map(this.mapToEntity);
  }

  async update(form: InternalForm): Promise<InternalForm> {
    const [result] = await db
      .update(internalForms)
      .set({
        name: form.name,
        description: form.description,
        category: form.category,
        fields: JSON.stringify(form.fields),
        actions: JSON.stringify(form.actions),
        approvalFlow: form.approvalFlow ? JSON.stringify(form.approvalFlow) : null,
        isActive: form.isActive,
        updatedAt: new Date()
      })
      .where(and(eq(internalForms.id, form.id), eq(internalForms.tenantId, form.tenantId)))
      .returning();

    return this.mapToEntity(result);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await db
      .delete(internalForms)
      .where(and(eq(internalForms.id, id), eq(internalForms.tenantId, tenantId)));
  }

  async findActive(tenantId: string): Promise<InternalForm[]> {
    const results = await db
      .select()
      .from(internalForms)
      .where(and(
        eq(internalForms.tenantId, tenantId),
        eq(internalForms.isActive, true)
      ));

    return results.map(this.mapToEntity);
  }

  private mapToEntity(data: any): InternalForm {
    return new InternalForm(
      data.id,
      data.tenantId,
      data.name,
      data.description,
      data.category,
      JSON.parse(data.fields),
      JSON.parse(data.actions),
      data.approvalFlow ? JSON.parse(data.approvalFlow) : undefined,
      data.isActive,
      data.createdBy,
      data.createdAt,
      data.updatedAt
    );
  }
}
