const { db, schemaManager } = require("../../../../db");
import { eq, and, like, desc, sql, or } from 'drizzle-orm';
import { items, itemAttachments, itemLinks, itemCustomerLinks, itemSupplierLinks } from '../../../../../shared/schema-materials-services';
import type { Item } from '../../domain/entities';

export class ItemRepository {

  async create(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values({
        ...data,
        maintenancePlan: data.maintenancePlan || null,
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
    const conditions = [eq(items.tenantId, tenantId)];

    if (options?.search) {
      conditions.push(
        or(
          like(items.name, `%${options.search}%`),
          like(items.description, `%${options.search}%`),
          like(items.integrationCode, `%${options.search}%`)
        )!
      );
    }

    if (options?.type && options.type !== 'all') {
      conditions.push(eq(items.type, options.type));
    }

    if (options?.status && options.status !== 'all') {
      conditions.push(eq(items.status, options.status as any));
    }

    if (options?.active !== undefined) {
      conditions.push(eq(items.active, options.active));
    }

    let query = this.db
      .select({
        id: items.id,
        tenantId: items.tenantId,
        active: items.active,
        type: items.type,
        name: items.name,
        integrationCode: items.integrationCode,
        description: items.description,
        measurementUnit: items.measurementUnit,
        maintenancePlan: items.maintenancePlan,
        defaultChecklist: items.defaultChecklist,
        status: items.status,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        createdBy: items.createdBy,
        updatedBy: items.updatedBy
      })
      .from(items)
      .where(and(...conditions))
      .orderBy(desc(items.createdAt));

    if (options?.limit && options?.offset) {
      query = query.limit(options.limit).offset(options.offset);
    } else if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query;
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
    
    return (result.rowCount || 0) > 0;
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