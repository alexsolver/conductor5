import { db } from '../../../../db';
import { eq, and, like, desc } from 'drizzle-orm';
import { suppliers, supplierCatalog } from '../../../../../shared/schema-master';
import type { Supplier } from '../../domain/entities';

export class SupplierRepository {

  async create(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const [supplier] = await db
      .insert(suppliers)
      .values({
        ...data,
        document: data.document || '', // Campo obrigatório conforme banco
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return supplier as Supplier;
  }

  async findById(id: string, tenantId: string): Promise<Supplier | null> {
    const [supplier] = await db
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
    let conditions = [eq(suppliers.tenantId, tenantId)];

    if (options?.search) {
      conditions.push(like(suppliers.name, `%${options.search}%`));
    }

    if (options?.active !== undefined) {
      conditions.push(eq(suppliers.active, options.active));
    }

    let query = db
      .select()
      .from(suppliers)
      .where(and(...conditions))
      .orderBy(desc(suppliers.createdAt));

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
    const [supplier] = await db
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
    const result = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));
    
    return (result.rowCount || 0) > 0;
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
    const [result] = await db
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
    return await db
      .select()
      .from(supplierCatalog)
      .where(and(eq(supplierCatalog.supplierId, supplierId), eq(supplierCatalog.tenantId, tenantId)))
      .orderBy(desc(supplierCatalog.createdAt));
  }

  async getStats(tenantId: string) {
    const totalSuppliers = await db
      .select({ count: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.tenantId, tenantId));

    const activeSuppliers = await db
      .select({ count: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.active, true)));

    return {
      total: totalSuppliers.length,
      active: activeSuppliers.length
    };
  }
}