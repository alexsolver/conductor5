import { eq, and, like, isNotNull, desc } from "drizzle-orm";
import { db } from "../db";
import {
  items,
  itemAttachments,
  itemLinks,
  itemCustomerLinks,
  itemSupplierLinks,
  customerCompanies,
  users,
  type Item,
  type InsertItem,
  type ItemAttachment,
  type InsertItemAttachment,
  type ItemLink,
  type InsertItemLink,
  type ItemCustomerLink,
  type InsertItemCustomerLink,
  type ItemSupplierLink,
  type InsertItemSupplierLink,
} from "@shared/schema";

export class ItemsRepository {
  // Items CRUD
  async createItem(data: InsertItem & { createdById: string }) {
    const [item] = await db
      .insert(items)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return item;
  }

  async getItems(tenantId: string, filters?: {
    type?: string;
    group?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const conditions = [eq(items.tenantId, tenantId)];

    if (filters?.type) {
      conditions.push(eq(items.type, filters.type));
    }

    if (filters?.group) {
      conditions.push(eq(items.group, filters.group));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(items.isActive, filters.isActive));
    }

    if (filters?.search) {
      conditions.push(
        like(items.name, `%${filters.search}%`)
      );
    }

    return await db
      .select()
      .from(items)
      .where(and(...conditions))
      .orderBy(desc(items.createdAt));
  }

  async getItemById(id: string, tenantId: string) {
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)));
    return item;
  }

  async updateItem(id: string, tenantId: string, data: Partial<InsertItem> & { updatedById: string }) {
    const [item] = await db
      .update(items)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .returning();
    return item;
  }

  async deleteItem(id: string, tenantId: string) {
    await db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)));
  }

  // Item Attachments CRUD
  async createItemAttachment(data: InsertItemAttachment & { createdById: string }) {
    const [attachment] = await db
      .insert(itemAttachments)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return attachment;
  }

  async getItemAttachments(itemId: string, tenantId: string) {
    return await db
      .select()
      .from(itemAttachments)
      .where(and(eq(itemAttachments.itemId, itemId), eq(itemAttachments.tenantId, tenantId)))
      .orderBy(desc(itemAttachments.createdAt));
  }

  async deleteItemAttachment(id: string, tenantId: string) {
    await db
      .delete(itemAttachments)
      .where(and(eq(itemAttachments.id, id), eq(itemAttachments.tenantId, tenantId)));
  }

  // Item Links CRUD
  async createItemLink(data: InsertItemLink & { createdById: string }) {
    const [link] = await db
      .insert(itemLinks)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return link;
  }

  async getItemLinks(itemId: string, tenantId: string) {
    return await db
      .select({
        id: itemLinks.id,
        linkType: itemLinks.linkType,
        quantity: itemLinks.quantity,
        description: itemLinks.description,
        createdAt: itemLinks.createdAt,
        childItem: {
          id: items.id,
          name: items.name,
          type: items.type,
          integrationCode: items.integrationCode,
        },
      })
      .from(itemLinks)
      .innerJoin(items, eq(itemLinks.childItemId, items.id))
      .where(and(eq(itemLinks.parentItemId, itemId), eq(itemLinks.tenantId, tenantId)))
      .orderBy(desc(itemLinks.createdAt));
  }

  async deleteItemLink(id: string, tenantId: string) {
    await db
      .delete(itemLinks)
      .where(and(eq(itemLinks.id, id), eq(itemLinks.tenantId, tenantId)));
  }

  // Item Customer Links CRUD
  async createItemCustomerLink(data: InsertItemCustomerLink & { createdById: string }) {
    const [link] = await db
      .insert(itemCustomerLinks)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return link;
  }

  async getItemCustomerLinks(itemId: string, tenantId: string) {
    return await db
      .select({
        id: itemCustomerLinks.id,
        nickname: itemCustomerLinks.nickname,
        sku: itemCustomerLinks.sku,
        barcode: itemCustomerLinks.barcode,
        qrCode: itemCustomerLinks.qrCode,
        isAsset: itemCustomerLinks.isAsset,
        createdAt: itemCustomerLinks.createdAt,
        customerCompany: {
          id: customerCompanies.id,
          name: customerCompanies.name,
          tradeName: customerCompanies.tradeName,
        },
      })
      .from(itemCustomerLinks)
      .innerJoin(customerCompanies, eq(itemCustomerLinks.customerCompanyId, customerCompanies.id))
      .where(and(eq(itemCustomerLinks.itemId, itemId), eq(itemCustomerLinks.tenantId, tenantId)))
      .orderBy(desc(itemCustomerLinks.createdAt));
  }

  async updateItemCustomerLink(id: string, tenantId: string, data: Partial<InsertItemCustomerLink> & { updatedById: string }) {
    const [link] = await db
      .update(itemCustomerLinks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(itemCustomerLinks.id, id), eq(itemCustomerLinks.tenantId, tenantId)))
      .returning();
    return link;
  }

  async deleteItemCustomerLink(id: string, tenantId: string) {
    await db
      .delete(itemCustomerLinks)
      .where(and(eq(itemCustomerLinks.id, id), eq(itemCustomerLinks.tenantId, tenantId)));
  }

  // Item Supplier Links CRUD
  async createItemSupplierLink(data: InsertItemSupplierLink & { createdById: string }) {
    const [link] = await db
      .insert(itemSupplierLinks)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return link;
  }

  async getItemSupplierLinks(itemId: string, tenantId: string) {
    return await db
      .select()
      .from(itemSupplierLinks)
      .where(and(eq(itemSupplierLinks.itemId, itemId), eq(itemSupplierLinks.tenantId, tenantId)))
      .orderBy(desc(itemSupplierLinks.createdAt));
  }

  async updateItemSupplierLink(id: string, tenantId: string, data: Partial<InsertItemSupplierLink> & { updatedById: string }) {
    const [link] = await db
      .update(itemSupplierLinks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(itemSupplierLinks.id, id), eq(itemSupplierLinks.tenantId, tenantId)))
      .returning();
    return link;
  }

  async deleteItemSupplierLink(id: string, tenantId: string) {
    await db
      .delete(itemSupplierLinks)
      .where(and(eq(itemSupplierLinks.id, id), eq(itemSupplierLinks.tenantId, tenantId)));
  }

  // Statistics and Analytics
  async getItemsStats(tenantId: string) {
    const totalItems = await db
      .select({ count: items.id })
      .from(items)
      .where(eq(items.tenantId, tenantId));

    const activeItems = await db
      .select({ count: items.id })
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.isActive, true)));

    const materialItems = await db
      .select({ count: items.id })
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.type, 'material')));

    const serviceItems = await db
      .select({ count: items.id })
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.type, 'service')));

    return {
      total: totalItems.length,
      active: activeItems.length,
      materials: materialItems.length,
      services: serviceItems.length,
    };
  }
}