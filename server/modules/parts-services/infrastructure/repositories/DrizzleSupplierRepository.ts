import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { schemaManager } from '../../../../db';
import { suppliers } from '../../../../../shared/schema-parts-services';
import { ISupplierRepository, SupplierFilters } from '../../domain/repositories/ISupplierRepository';
import { Supplier, CreateSupplierEntity, UpdateSupplierEntity } from '../../domain/entities/Supplier';

export class DrizzleSupplierRepository implements ISupplierRepository {
  async create(tenantId: string, data: CreateSupplierEntity): Promise<Supplier> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        ...data,
        tenantId,
      })
      .returning();

    return Supplier.fromEntity({
      ...newSupplier,
      createdAt: newSupplier.createdAt,
      updatedAt: newSupplier.updatedAt,
    });
  }

  async findById(tenantId: string, id: string): Promise<Supplier | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const result = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, id)))
      .limit(1);

    if (result.length === 0) return null;

    return Supplier.fromEntity({
      ...result[0],
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
    });
  }

  async findAll(tenantId: string, filters?: SupplierFilters): Promise<Supplier[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const conditions = [eq(suppliers.tenantId, tenantId)];

    if (filters?.active !== undefined) {
      conditions.push(eq(suppliers.active, filters.active));
    }

    if (filters?.city) {
      conditions.push(eq(suppliers.city, filters.city));
    }

    if (filters?.state) {
      conditions.push(eq(suppliers.state, filters.state));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(suppliers.name, `%${filters.search}%`),
          ilike(suppliers.documentNumber, `%${filters.search}%`),
          ilike(suppliers.email, `%${filters.search}%`)
        )!
      );
    }

    let query = db
      .select()
      .from(suppliers)
      .where(and(...conditions));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;

    return results.map(supplier => Supplier.fromEntity({
      ...supplier,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    }));
  }

  async update(tenantId: string, id: string, data: UpdateSupplierEntity): Promise<Supplier> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, id)))
      .returning();

    return Supplier.fromEntity({
      ...updatedSupplier,
      createdAt: updatedSupplier.createdAt,
      updatedAt: updatedSupplier.updatedAt,
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    await db
      .delete(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, id)));
  }

  async findByDocumentNumber(tenantId: string, documentNumber: string): Promise<Supplier | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const result = await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.tenantId, tenantId),
        eq(suppliers.documentNumber, documentNumber)
      ))
      .limit(1);

    if (result.length === 0) return null;

    return Supplier.fromEntity({
      ...result[0],
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
    });
  }

  async findByEmail(tenantId: string, email: string): Promise<Supplier | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const result = await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.tenantId, tenantId),
        eq(suppliers.email, email)
      ))
      .limit(1);

    if (result.length === 0) return null;

    return Supplier.fromEntity({
      ...result[0],
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
    });
  }

  async search(tenantId: string, query: string): Promise<Supplier[]> {
    return this.findAll(tenantId, { search: query });
  }

  async findActiveSuppliers(tenantId: string): Promise<Supplier[]> {
    return this.findAll(tenantId, { active: true });
  }

  async getTotalCount(tenantId: string): Promise<number> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(eq(suppliers.tenantId, tenantId));

    return Number(result[0].count);
  }

  async getActiveCount(tenantId: string): Promise<number> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.active, true)));

    return Number(result[0].count);
  }
}