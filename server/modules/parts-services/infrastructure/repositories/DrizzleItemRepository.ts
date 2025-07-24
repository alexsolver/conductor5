import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { schemaManager } from '../../../../db';
import { items } from '../../../../../shared/schema-parts-services';
import { IItemRepository, ItemFilters } from '../../domain/repositories/IItemRepository';
import { Item, CreateItemEntity, UpdateItemEntity } from '../../domain/entities/Item';

export class DrizzleItemRepository implements IItemRepository {
  async create(tenantId: string, data: CreateItemEntity): Promise<Item> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const [newItem] = await db
      .insert(items)
      .values({
        ...data,
        tenantId,
      })
      .returning();

    return Item.fromEntity({
      ...newItem,
      createdAt: newItem.createdAt,
      updatedAt: newItem.updatedAt,
    });
  }

  async findById(tenantId: string, id: string): Promise<Item | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const result = await db
      .select()
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.id, id)))
      .limit(1);

    if (result.length === 0) return null;

    return Item.fromEntity({
      ...result[0],
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
    });
  }

  async findAll(tenantId: string, filters?: ItemFilters): Promise<Item[]> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    let query = db.select().from(items).where(eq(items.tenantId, tenantId));

    // Aplicar filtros
    const conditions = [eq(items.tenantId, tenantId)];

    if (filters?.active !== undefined) {
      conditions.push(eq(items.active, filters.active));
    }

    if (filters?.type) {
      conditions.push(eq(items.type, filters.type));
    }

    if (filters?.group) {
      conditions.push(eq(items.group, filters.group));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(items.name, `%${filters.search}%`),
          ilike(items.description, `%${filters.search}%`),
          ilike(items.integrationCode, `%${filters.search}%`)
        )!
      );
    }

    query = query.where(and(...conditions));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;

    return results.map(item => Item.fromEntity({
      ...item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async update(tenantId: string, id: string, data: UpdateItemEntity): Promise<Item> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const [updatedItem] = await db
      .update(items)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(items.tenantId, tenantId), eq(items.id, id)))
      .returning();

    return Item.fromEntity({
      ...updatedItem,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    await db
      .delete(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.id, id)));
  }

  async findByType(tenantId: string, type: 'Material' | 'Serviço'): Promise<Item[]> {
    return this.findAll(tenantId, { type });
  }

  async findByGroup(tenantId: string, group: string): Promise<Item[]> {
    return this.findAll(tenantId, { group });
  }

  async findByIntegrationCode(tenantId: string, integrationCode: string): Promise<Item | null> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const result = await db
      .select()
      .from(items)
      .where(and(
        eq(items.tenantId, tenantId),
        eq(items.integrationCode, integrationCode)
      ))
      .limit(1);

    if (result.length === 0) return null;

    return Item.fromEntity({
      ...result[0],
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
    });
  }

  async search(tenantId: string, query: string): Promise<Item[]> {
    return this.findAll(tenantId, { search: query });
  }

  async findActiveItems(tenantId: string): Promise<Item[]> {
    return this.findAll(tenantId, { active: true });
  }

  async countByType(tenantId: string): Promise<{ materials: number; services: number }> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const results = await db
      .select({
        type: items.type,
        count: sql<number>`count(*)`,
      })
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.active, true)))
      .groupBy(items.type);

    const counts = { materials: 0, services: 0 };
    
    results.forEach(result => {
      if (result.type === 'Material') {
        counts.materials = Number(result.count);
      } else if (result.type === 'Serviço') {
        counts.services = Number(result.count);
      }
    });

    return counts;
  }

  async getTotalCount(tenantId: string): Promise<number> {
    const { db } = await schemaManager.getTenantDb(tenantId);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(eq(items.tenantId, tenantId));

    return Number(result[0].count);
  }
}