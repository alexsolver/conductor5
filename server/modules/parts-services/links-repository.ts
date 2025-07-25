import { eq, and, desc } from "drizzle-orm";
import db from "../../db";
import { 
  itemLinks, 
  itemCustomerLinks, 
  itemSupplierLinks, 
  itemAttachments,
  serviceKits,
  serviceKitItems 
} from "../../../shared/schema-parts-services-links";

export class PartsServicesLinksRepository {
  
  // ============================================
  // VÍNCULOS ITEM-ITEM
  // ============================================
  
  async createItemLink(tenantId: string, data: any) {
    const [link] = await db.insert(itemLinks).values({
      tenantId,
      ...data
    }).returning();
    return link;
  }
  
  async getItemLinks(tenantId: string, itemId: string) {
    return await db.select()
      .from(itemLinks)
      .where(and(
        eq(itemLinks.tenantId, tenantId),
        eq(itemLinks.parentItemId, itemId),
        eq(itemLinks.isActive, true)
      ))
      .orderBy(desc(itemLinks.createdAt));
  }
  
  async deleteItemLink(tenantId: string, linkId: string) {
    const db = getTenantDb(tenantId);
    await db.update(itemLinks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(itemLinks.tenantId, tenantId),
        eq(itemLinks.id, linkId)
      ));
  }
  
  // ============================================
  // VÍNCULOS ITEM-CLIENTE
  // ============================================
  
  async createItemCustomerLink(tenantId: string, data: any) {
    const db = getTenantDb(tenantId);
    const [link] = await db.insert(itemCustomerLinks).values({
      tenantId,
      ...data
    }).returning();
    return link;
  }
  
  async getItemCustomerLinks(tenantId: string, itemId: string) {
    const db = getTenantDb(tenantId);
    return await db.select()
      .from(itemCustomerLinks)
      .where(and(
        eq(itemCustomerLinks.tenantId, tenantId),
        eq(itemCustomerLinks.itemId, itemId),
        eq(itemCustomerLinks.isActive, true)
      ))
      .orderBy(desc(itemCustomerLinks.createdAt));
  }
  
  async updateItemCustomerLink(tenantId: string, linkId: string, data: any) {
    const db = getTenantDb(tenantId);
    const [updated] = await db.update(itemCustomerLinks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(itemCustomerLinks.tenantId, tenantId),
        eq(itemCustomerLinks.id, linkId)
      ))
      .returning();
    return updated;
  }
  
  async deleteItemCustomerLink(tenantId: string, linkId: string) {
    const db = getTenantDb(tenantId);
    await db.update(itemCustomerLinks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(itemCustomerLinks.tenantId, tenantId),
        eq(itemCustomerLinks.id, linkId)
      ));
  }
  
  // ============================================
  // VÍNCULOS ITEM-FORNECEDOR
  // ============================================
  
  async createItemSupplierLink(tenantId: string, data: any) {
    const db = getTenantDb(tenantId);
    const [link] = await db.insert(itemSupplierLinks).values({
      tenantId,
      ...data
    }).returning();
    return link;
  }
  
  async getItemSupplierLinks(tenantId: string, itemId: string) {
    const db = getTenantDb(tenantId);
    return await db.select()
      .from(itemSupplierLinks)
      .where(and(
        eq(itemSupplierLinks.tenantId, tenantId),
        eq(itemSupplierLinks.itemId, itemId),
        eq(itemSupplierLinks.isActive, true)
      ))
      .orderBy(desc(itemSupplierLinks.createdAt));
  }
  
  async updateItemSupplierLink(tenantId: string, linkId: string, data: any) {
    const db = getTenantDb(tenantId);
    const [updated] = await db.update(itemSupplierLinks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(itemSupplierLinks.tenantId, tenantId),
        eq(itemSupplierLinks.id, linkId)
      ))
      .returning();
    return updated;
  }
  
  // ============================================
  // ANEXOS (UPLOAD DE ARQUIVOS)
  // ============================================
  
  async createItemAttachment(tenantId: string, data: any) {
    const [attachment] = await db.insert(itemAttachments).values({
      tenantId,
      ...data
    }).returning();
    return attachment;
  }
  
  async getItemAttachments(tenantId: string, itemId: string) {
    return await db.select()
      .from(itemAttachments)
      .where(and(
        eq(itemAttachments.tenantId, tenantId),
        eq(itemAttachments.itemId, itemId),
        eq(itemAttachments.isActive, true)
      ))
      .orderBy(desc(itemAttachments.uploadedAt));
  }
  
  async deleteItemAttachment(tenantId: string, attachmentId: string) {
    const db = getTenantDb(tenantId);
    await db.update(itemAttachments)
      .set({ isActive: false })
      .where(and(
        eq(itemAttachments.tenantId, tenantId),
        eq(itemAttachments.id, attachmentId)
      ));
  }
  
  // ============================================
  // KITS DE SERVIÇO
  // ============================================
  
  async createServiceKit(tenantId: string, data: any) {
    const db = getTenantDb(tenantId);
    const [kit] = await db.insert(serviceKits).values({
      tenantId,
      ...data
    }).returning();
    return kit;
  }
  
  async getServiceKits(tenantId: string) {
    const db = getTenantDb(tenantId);
    return await db.select()
      .from(serviceKits)
      .where(and(
        eq(serviceKits.tenantId, tenantId),
        eq(serviceKits.isActive, true)
      ))
      .orderBy(desc(serviceKits.createdAt));
  }
  
  async addItemToKit(tenantId: string, data: any) {
    const db = getTenantDb(tenantId);
    const [kitItem] = await db.insert(serviceKitItems).values({
      tenantId,
      ...data
    }).returning();
    return kitItem;
  }
  
  async getKitItems(tenantId: string, kitId: string) {
    const db = getTenantDb(tenantId);
    return await db.select()
      .from(serviceKitItems)
      .where(and(
        eq(serviceKitItems.tenantId, tenantId),
        eq(serviceKitItems.kitId, kitId),
        eq(serviceKitItems.isActive, true)
      ));
  }
}