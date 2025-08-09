
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { fieldLayouts } from '../../../../../shared/schema-master';
import { FieldLayout } from '../../domain/entities/FieldLayout';
import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';

export class DrizzleFieldLayoutRepository implements IFieldLayoutRepository {
  async save(fieldLayout: FieldLayout): Promise<void> {
    await db.insert(fieldLayouts).values({
      id: fieldLayout.id,
      tenantId: fieldLayout.tenantId,
      name: fieldLayout.name,
      layout: fieldLayout.layout,
      isActive: fieldLayout.isActive,
      createdAt: fieldLayout.createdAt,
      updatedAt: fieldLayout.updatedAt
    });
  }

  async findById(id: string): Promise<FieldLayout | null> {
    const result = await db
      .select()
      .from(fieldLayouts)
      .where(eq(fieldLayouts.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const data = result[0];
    return new FieldLayout({
      id: data.id,
      tenantId: data.tenantId,
      name: data.name,
      layout: data.layout,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  }

  async findByTenantId(tenantId: string): Promise<FieldLayout[]> {
    const results = await db
      .select()
      .from(fieldLayouts)
      .where(eq(fieldLayouts.tenantId, tenantId));

    return results.map(data => new FieldLayout({
      id: data.id,
      tenantId: data.tenantId,
      name: data.name,
      layout: data.layout,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }));
  }

  async update(id: string, updates: Partial<FieldLayout>): Promise<void> {
    await db
      .update(fieldLayouts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fieldLayouts.id, id));
  }

  async delete(id: string): Promise<void> {
    await db
      .delete(fieldLayouts)
      .where(eq(fieldLayouts.id, id));
  }
}
