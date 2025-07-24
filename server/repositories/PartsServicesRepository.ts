import { db } from '../db';
import { 
  items, 
  itemAttachments,
  itemLinks, 
  itemCustomerLinks,
  itemSupplierLinks,
  stockLocations,
  stockLevels,
  stockMovements,
  suppliers,
  serviceKits,
  serviceKitItems,
  priceLists,
  priceListItems,
  auditLogs,
  qualityCertifications,
  type Item,
  type InsertItem,
  type InsertItemAttachment,
  type InsertItemLink,
  type InsertItemCustomerLink,
  type InsertItemSupplierLink,
  type InsertStockLocation,
  type StockLocation,
  type InsertStockLevel,
  type StockLevel,
  type InsertStockMovement,
  type StockMovement,
  type InsertSupplier,
  type Supplier,
  type InsertServiceKit,
  type ServiceKit,
  type InsertServiceKitItem,
  type ServiceKitItem,
  type InsertPriceList,
  type PriceList,
  type InsertPriceListItem,
  type PriceListItem,
  type InsertAuditLog,
  type InsertQualityCertification,
  type QualityCertification
} from '@shared/schema';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';

export class PartsServicesRepository {
  
  // ========================================
  // ITEMS CORE OPERATIONS
  // ========================================
  
  async getItems(tenantId: string, filters?: {
    search?: string;
    type?: 'material' | 'service';
    group?: string;
    isActive?: boolean;
  }): Promise<Item[]> {
    let query = db.select().from(items).where(eq(items.tenantId, tenantId));
    
    if (filters?.search) {
      query = query.where(ilike(items.name, `%${filters.search}%`));
    }
    if (filters?.type) {
      query = query.where(eq(items.type, filters.type));
    }
    if (filters?.group) {
      query = query.where(eq(items.group, filters.group));
    }
    if (typeof filters?.isActive === 'boolean') {
      query = query.where(eq(items.isActive, filters.isActive));
    }
    
    return query.orderBy(desc(items.createdAt));
  }

  async createItem(data: InsertItem): Promise<Item> {
    const [result] = await db.insert(items).values(data).returning();
    return result;
  }

  async updateItem(id: string, tenantId: string, data: Partial<InsertItem>): Promise<Item | null> {
    const [result] = await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .returning();
    return result || null;
  }

  async deleteItem(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  // ========================================
  // STOCK CONTROL OPERATIONS
  // ========================================
  
  async getStockLocations(tenantId: string): Promise<StockLocation[]> {
    return db.select().from(stockLocations)
      .where(eq(stockLocations.tenantId, tenantId))
      .orderBy(stockLocations.name);
  }

  async createStockLocation(data: InsertStockLocation): Promise<StockLocation> {
    const [result] = await db.insert(stockLocations).values(data).returning();
    return result;
  }

  async getStockLevels(tenantId: string, itemId?: string, locationId?: string): Promise<StockLevel[]> {
    let query = db.select().from(stockLevels).where(eq(stockLevels.tenantId, tenantId));
    
    if (itemId) {
      query = query.where(eq(stockLevels.itemId, itemId));
    }
    if (locationId) {
      query = query.where(eq(stockLevels.locationId, locationId));
    }
    
    return query.orderBy(stockLevels.currentQuantity);
  }

  async createStockLevel(data: InsertStockLevel): Promise<StockLevel> {
    const [result] = await db.insert(stockLevels).values(data).returning();
    return result;
  }

  async updateStockLevel(id: string, tenantId: string, data: Partial<InsertStockLevel>): Promise<StockLevel | null> {
    const [result] = await db
      .update(stockLevels)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(stockLevels.id, id), eq(stockLevels.tenantId, tenantId)))
      .returning();
    return result || null;
  }

  async getStockMovements(tenantId: string, filters?: {
    itemId?: string;
    locationId?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<StockMovement[]> {
    let query = db.select().from(stockMovements).where(eq(stockMovements.tenantId, tenantId));
    
    if (filters?.itemId) {
      query = query.where(eq(stockMovements.itemId, filters.itemId));
    }
    if (filters?.locationId) {
      query = query.where(eq(stockMovements.locationId, filters.locationId));
    }
    if (filters?.type) {
      query = query.where(eq(stockMovements.type, filters.type as any));
    }
    
    return query.orderBy(desc(stockMovements.movementDate));
  }

  async createStockMovement(data: InsertStockMovement): Promise<StockMovement> {
    const [result] = await db.insert(stockMovements).values(data).returning();
    return result;
  }

  // ========================================
  // SUPPLIERS OPERATIONS
  // ========================================
  
  async getSuppliers(tenantId: string, filters?: {
    search?: string;
    category?: string;
    isActive?: boolean;
    isApproved?: boolean;
  }): Promise<Supplier[]> {
    let query = db.select().from(suppliers).where(eq(suppliers.tenantId, tenantId));
    
    if (filters?.search) {
      query = query.where(ilike(suppliers.name, `%${filters.search}%`));
    }
    if (filters?.category) {
      query = query.where(eq(suppliers.category, filters.category));
    }
    if (typeof filters?.isActive === 'boolean') {
      query = query.where(eq(suppliers.isActive, filters.isActive));
    }
    if (typeof filters?.isApproved === 'boolean') {
      query = query.where(eq(suppliers.isApproved, filters.isApproved));
    }
    
    return query.orderBy(suppliers.name);
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [result] = await db.insert(suppliers).values(data).returning();
    return result;
  }

  async updateSupplier(id: string, tenantId: string, data: Partial<InsertSupplier>): Promise<Supplier | null> {
    const [result] = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
      .returning();
    return result || null;
  }

  async deleteSupplier(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));
    return result.rowCount > 0;
  }

  // ========================================
  // SERVICE INTEGRATION OPERATIONS
  // ========================================
  
  async getServiceKits(tenantId: string, filters?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }): Promise<ServiceKit[]> {
    let query = db.select().from(serviceKits).where(eq(serviceKits.tenantId, tenantId));
    
    if (filters?.search) {
      query = query.where(ilike(serviceKits.name, `%${filters.search}%`));
    }
    if (filters?.type) {
      query = query.where(eq(serviceKits.type, filters.type as any));
    }
    if (typeof filters?.isActive === 'boolean') {
      query = query.where(eq(serviceKits.isActive, filters.isActive));
    }
    
    return query.orderBy(serviceKits.name);
  }

  async createServiceKit(data: InsertServiceKit): Promise<ServiceKit> {
    const [result] = await db.insert(serviceKits).values(data).returning();
    return result;
  }

  async updateServiceKit(id: string, tenantId: string, data: Partial<InsertServiceKit>): Promise<ServiceKit | null> {
    const [result] = await db
      .update(serviceKits)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(serviceKits.id, id), eq(serviceKits.tenantId, tenantId)))
      .returning();
    return result || null;
  }

  async getServiceKitItems(tenantId: string, serviceKitId?: string): Promise<ServiceKitItem[]> {
    let query = db.select().from(serviceKitItems).where(eq(serviceKitItems.tenantId, tenantId));
    
    if (serviceKitId) {
      query = query.where(eq(serviceKitItems.serviceKitId, serviceKitId));
    }
    
    return query.orderBy(serviceKitItems.createdAt);
  }

  async createServiceKitItem(data: InsertServiceKitItem): Promise<ServiceKitItem> {
    const [result] = await db.insert(serviceKitItems).values(data).returning();
    return result;
  }

  // ========================================
  // PRICE LISTS OPERATIONS (LPU)
  // ========================================
  
  async getPriceLists(tenantId: string, filters?: {
    search?: string;
    status?: string;
    customerCompanyId?: string;
  }): Promise<PriceList[]> {
    let query = db.select().from(priceLists).where(eq(priceLists.tenantId, tenantId));
    
    if (filters?.search) {
      query = query.where(ilike(priceLists.name, `%${filters.search}%`));
    }
    if (filters?.status) {
      query = query.where(eq(priceLists.status, filters.status as any));
    }
    if (filters?.customerCompanyId) {
      query = query.where(eq(priceLists.customerCompanyId, filters.customerCompanyId));
    }
    
    return query.orderBy(desc(priceLists.createdAt));
  }

  async createPriceList(data: InsertPriceList): Promise<PriceList> {
    const [result] = await db.insert(priceLists).values(data).returning();
    return result;
  }

  async getPriceListItems(tenantId: string, priceListId?: string): Promise<PriceListItem[]> {
    let query = db.select().from(priceListItems).where(eq(priceListItems.tenantId, tenantId));
    
    if (priceListId) {
      query = query.where(eq(priceListItems.priceListId, priceListId));
    }
    
    return query.orderBy(priceListItems.createdAt);
  }

  async createPriceListItem(data: InsertPriceListItem): Promise<PriceListItem> {
    const [result] = await db.insert(priceListItems).values(data).returning();
    return result;
  }

  // ========================================
  // COMPLIANCE OPERATIONS
  // ========================================
  
  async createAuditLog(data: InsertAuditLog): Promise<void> {
    await db.insert(auditLogs).values(data);
  }

  async getQualityCertifications(tenantId: string, filters?: {
    search?: string;
    type?: string;
    status?: string;
  }): Promise<QualityCertification[]> {
    let query = db.select().from(qualityCertifications).where(eq(qualityCertifications.tenantId, tenantId));
    
    if (filters?.search) {
      query = query.where(ilike(qualityCertifications.name, `%${filters.search}%`));
    }
    if (filters?.type) {
      query = query.where(eq(qualityCertifications.type, filters.type as any));
    }
    if (filters?.status) {
      query = query.where(eq(qualityCertifications.status, filters.status as any));
    }
    
    return query.orderBy(desc(qualityCertifications.createdAt));
  }

  async createQualityCertification(data: InsertQualityCertification): Promise<QualityCertification> {
    const [result] = await db.insert(qualityCertifications).values(data).returning();
    return result;
  }

  // ========================================
  // DASHBOARD STATISTICS
  // ========================================
  
  async getDashboardStats(tenantId: string) {
    const [itemsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.isActive, true)));

    const [suppliersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.isActive, true)));

    const [locationsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockLocations)
      .where(and(eq(stockLocations.tenantId, tenantId), eq(stockLocations.isActive, true)));

    const [serviceKitsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceKits)
      .where(and(eq(serviceKits.tenantId, tenantId), eq(serviceKits.isActive, true)));

    return {
      totalItems: itemsCount.count,
      totalSuppliers: suppliersCount.count,
      totalLocations: locationsCount.count,
      totalServiceKits: serviceKitsCount.count
    };
  }
}