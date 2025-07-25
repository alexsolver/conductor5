import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { items, itemAttachments, itemLinks, itemCustomerLinks, itemSupplierLinks } from '../../../../../shared/schema-materials-services';
import type { Item } from '../../domain/entities';

export class ItemRepository {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async create(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const [item] = await this.db
      .insert(items)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return item as Item;
  }

  async findById(id: string, tenantId: string): Promise<Item | null> {
    const [item] = await this.db
      .select()
      .from(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .limit(1);
    
    return item as Item || null;
  }

  async findByTenant(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    search?: string;
    type?: string;
    status?: string;
    active?: boolean;
  }): Promise<Item[]> {
    let query = this.db
      .select()
      .from(items)
      .where(eq(items.tenantId, tenantId));

    if (options?.search) {
      query = query.where(
        and(
          eq(items.tenantId, tenantId),
          like(items.name, `%${options.search}%`)
        )
      );
    }

    if (options?.type) {
      query = query.where(
        and(
          eq(items.tenantId, tenantId),
          eq(items.type, options.type as any)
        )
      );
    }

    if (options?.status) {
      query = query.where(
        and(
          eq(items.tenantId, tenantId),
          eq(items.status, options.status as any)
        )
      );
    }

    if (options?.active !== undefined) {
      query = query.where(
        and(
          eq(items.tenantId, tenantId),
          eq(items.active, options.active)
        )
      );
    }

    query = query.orderBy(desc(items.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const result = await query;
    return result as Item[];
  }

  async update(id: string, tenantId: string, data: Partial<Item>): Promise<Item | null> {
    const [item] = await this.db
      .update(items)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .returning();
    
    return item as Item || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)));
    
    return result.rowCount > 0;
  }

  async addAttachment(itemId: string, tenantId: string, attachment: {
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
    createdBy?: string;
  }) {
    const [result] = await this.db
      .insert(itemAttachments)
      .values({
        itemId,
        tenantId,
        ...attachment,
        createdAt: new Date()
      })
      .returning();
    
    return result;
  }

  async getAttachments(itemId: string, tenantId: string) {
    return await this.db
      .select()
      .from(itemAttachments)
      .where(and(eq(itemAttachments.itemId, itemId), eq(itemAttachments.tenantId, tenantId)))
      .orderBy(desc(itemAttachments.createdAt));
  }

  async addItemLink(linkData: {
    tenantId: string;
    itemId: string;
    linkedItemId: string;
    relationship: string;
    createdBy?: string;
  }) {
    const [result] = await this.db
      .insert(itemLinks)
      .values({
        ...linkData,
        linkType: 'item_item' as any,
        createdAt: new Date()
      })
      .returning();
    
    return result;
  }

  async addCustomerLink(linkData: {
    tenantId: string;
    itemId: string;
    customerId: string;
    alias?: string;
    sku?: string;
    barcode?: string;
    qrCode?: string;
    isAsset?: boolean;
    createdBy?: string;
  }) {
    const [result] = await this.db
      .insert(itemCustomerLinks)
      .values({
        ...linkData,
        createdAt: new Date()
      })
      .returning();
    
    return result;
  }

  async addSupplierLink(linkData: {
    tenantId: string;
    itemId: string;
    supplierId: string;
    partNumber?: string;
    description?: string;
    qrCode?: string;
    barcode?: string;
    unitPrice?: number;
    createdBy?: string;
  }) {
    const [result] = await this.db
      .insert(itemSupplierLinks)
      .values({
        ...linkData,
        createdAt: new Date()
      })
      .returning();
    
    return result;
  }

  async getItemLinks(itemId: string, tenantId: string) {
    return await this.db
      .select()
      .from(itemLinks)
      .where(and(eq(itemLinks.itemId, itemId), eq(itemLinks.tenantId, tenantId)))
      .orderBy(desc(itemLinks.createdAt));
  }

  async getCustomerLinks(itemId: string, tenantId: string) {
    return await this.db
      .select()
      .from(itemCustomerLinks)
      .where(and(eq(itemCustomerLinks.itemId, itemId), eq(itemCustomerLinks.tenantId, tenantId)))
      .orderBy(desc(itemCustomerLinks.createdAt));
  }

  async getSupplierLinks(itemId: string, tenantId: string) {
    return await this.db
      .select()
      .from(itemSupplierLinks)
      .where(and(eq(itemSupplierLinks.itemId, itemId), eq(itemSupplierLinks.tenantId, tenantId)))
      .orderBy(desc(itemSupplierLinks.createdAt));
  }

  async getStats(tenantId: string) {
    const totalItems = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(eq(items.tenantId, tenantId));

    const activeItems = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.active, true)));

    const itemsByType = await this.db
      .select({
        type: items.type,
        count: sql<number>`count(*)`
      })
      .from(items)
      .where(eq(items.tenantId, tenantId))
      .groupBy(items.type);

    return {
      total: totalItems[0]?.count || 0,
      active: activeItems[0]?.count || 0,
      byType: itemsByType
    };
  }
}