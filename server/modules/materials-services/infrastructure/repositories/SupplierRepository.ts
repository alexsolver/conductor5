import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, like, desc } from 'drizzle-orm';
import { suppliers, supplierCatalog } from '../../../../../shared/schema-materials-services';
import type { Supplier } from '../../domain/entities';

export class SupplierRepository {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async create(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const [supplier] = await this.db
      .insert(suppliers)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return supplier as Supplier;
  }

  async findById(id: string, tenantId: string): Promise<Supplier | null> {
    const [supplier] = await this.db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
      .limit(1);
    
    return supplier as Supplier || null;
  }

  async findByTenant(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    search?: string;
    active?: boolean;
  }): Promise<Supplier[]> {
    let query = this.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.tenantId, tenantId));

    if (options?.search) {
      query = query.where(
        and(
          eq(suppliers.tenantId, tenantId),
          like(suppliers.name, `%${options.search}%`)
        )
      );
    }

    if (options?.active !== undefined) {
      query = query.where(
        and(
          eq(suppliers.tenantId, tenantId),
          eq(suppliers.isActive, options.active)
        )
      );
    }

    query = query.orderBy(desc(suppliers.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const result = await query;
    return result as Supplier[];
  }

  async update(id: string, tenantId: string, data: Partial<Supplier>): Promise<Supplier | null> {
    const [supplier] = await this.db
      .update(suppliers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
      .returning();
    
    return supplier as Supplier || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));
    
    return result.rowCount > 0;
  }

  async addCatalogItem(data: {
    tenantId: string;
    supplierId: string;
    itemId: string;
    supplierItemCode?: string;
    supplierDescription?: string;
    unitPrice?: number;
    currency?: string;
    leadTime?: number;
    minimumOrderQuantity?: number;
    validFrom?: Date;
    validTo?: Date;
  }) {
    const [result] = await this.db
      .insert(supplierCatalog)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return result;
  }

  async getCatalog(supplierId: string, tenantId: string) {
    return await this.db
      .select()
      .from(supplierCatalog)
      .where(and(eq(supplierCatalog.supplierId, supplierId), eq(supplierCatalog.tenantId, tenantId)))
      .orderBy(desc(supplierCatalog.createdAt));
  }

  async getStats(tenantId: string) {
    const totalSuppliers = await this.db
      .select({ count: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.tenantId, tenantId));

    const activeSuppliers = await this.db
      .select({ count: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.isActive, true)));

    return {
      total: totalSuppliers.length,
      active: activeSuppliers.length
    };
  }
}