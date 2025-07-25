import { eq, and, desc, asc, ilike, sql, inArray } from "drizzle-orm";
import { db } from "../../db";
import { 
  items, 
  stockLocations, 
  stockLevels, 
  suppliers,
  type Item,
  type InsertItem,
  type StockLocation,
  type InsertStockLocation,
  type StockLevel,
  type InsertStockLevel,
  type Supplier,
  type InsertSupplier
} from "../../../shared/schema";

export class PartsServicesRepository {
  
  // ============================================
  // ITEMS MANAGEMENT
  // ============================================
  
  async createItem(tenantId: string, data: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values({
      ...data,
      tenantId,
      updatedAt: new Date()
    }).returning();
    return item;
  }

  async getItems(tenantId: string, filters?: {
    search?: string;
    type?: string;
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Item[]; total: number }> {
    // Build where conditions
    let whereConditions = [eq(items.tenantId, tenantId)];
    
    if (filters?.search) {
      whereConditions.push(
        sql`${items.title} ILIKE ${`%${filters.search}%`} OR 
            ${items.internalCode} ILIKE ${`%${filters.search}%`} OR 
            ${items.manufacturerCode} ILIKE ${`%${filters.search}%`}`
      );
    }
    
    if (filters?.type) {
      whereConditions.push(eq(items.type, filters.type));
    }
    
    if (filters?.category) {
      whereConditions.push(eq(items.category, filters.category));
    }
    
    if (filters?.status) {
      whereConditions.push(eq(items.status, filters.status));
    }
    
    // Get total count
    const countQuery = db.select({ count: sql`count(*)` }).from(items).where(and(...whereConditions));
    const [{ count }] = await countQuery;
    
    // Build main query
    let query = db.select().from(items).where(and(...whereConditions));
    
    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    const itemsList = await query.orderBy(desc(items.createdAt));
    
    return {
      items: itemsList,
      total: Number(count)
    };
  }

  async getItemById(tenantId: string, id: string): Promise<Item | null> {
    const [item] = await db.select()
      .from(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)));
    return item || null;
  }

  async updateItem(tenantId: string, id: string, data: Partial<InsertItem>): Promise<Item | null> {
    const [item] = await db.update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)))
      .returning();
    return item || null;
  }

  async deleteItem(tenantId: string, id: string): Promise<boolean> {
    const result = await db.delete(items)
      .where(and(eq(items.id, id), eq(items.tenantId, tenantId)));
    return (result.rowCount || 0) > 0;
  }

  // ============================================
  // ITEM LINKS MANAGEMENT
  // ============================================
  
  async createItemLink(tenantId: string, data: InsertItemLink): Promise<ItemLink> {
    const [link] = await db.insert(itemLinks).values({
      ...data,
      tenantId,
      updatedAt: new Date()
    }).returning();
    return link;
  }

  async getItemLinks(tenantId: string, itemId: string): Promise<ItemLink[]> {
    return await db.select()
      .from(itemLinks)
      .where(and(
        eq(itemLinks.tenantId, tenantId),
        eq(itemLinks.sourceItemId, itemId),
        eq(itemLinks.isActive, true)
      ))
      .orderBy(asc(itemLinks.priority));
  }

  async deleteItemLink(tenantId: string, id: string): Promise<boolean> {
    const result = await db.delete(itemLinks)
      .where(and(eq(itemLinks.id, id), eq(itemLinks.tenantId, tenantId)));
    return (result.rowCount || 0) > 0;
  }

  // ============================================
  // ITEM ATTACHMENTS MANAGEMENT
  // ============================================
  
  async createItemAttachment(tenantId: string, data: InsertItemAttachment): Promise<ItemAttachment> {
    const [attachment] = await db.insert(itemAttachments).values({
      ...data,
      tenantId,
      updatedAt: new Date()
    }).returning();
    return attachment;
  }

  async getItemAttachments(tenantId: string, itemId: string): Promise<ItemAttachment[]> {
    return await db.select()
      .from(itemAttachments)
      .where(and(
        eq(itemAttachments.tenantId, tenantId),
        eq(itemAttachments.itemId, itemId)
      ))
      .orderBy(desc(itemAttachments.createdAt));
  }

  async deleteItemAttachment(tenantId: string, id: string): Promise<boolean> {
    const result = await db.delete(itemAttachments)
      .where(and(eq(itemAttachments.id, id), eq(itemAttachments.tenantId, tenantId)));
    return (result.rowCount || 0) > 0;
  }

  // ============================================
  // STOCK LOCATIONS MANAGEMENT
  // ============================================
  
  async createStockLocation(tenantId: string, data: InsertStockLocation): Promise<StockLocation> {
    const [location] = await db.insert(stockLocations).values({
      ...data,
      tenantId,
      updatedAt: new Date()
    }).returning();
    return location;
  }

  async getStockLocations(tenantId: string): Promise<StockLocation[]> {
    return await db.select()
      .from(stockLocations)
      .where(and(eq(stockLocations.tenantId, tenantId), eq(stockLocations.isActive, true)))
      .orderBy(asc(stockLocations.name));
  }

  async getStockLocationById(tenantId: string, id: string): Promise<StockLocation | null> {
    const [location] = await db.select()
      .from(stockLocations)
      .where(and(eq(stockLocations.id, id), eq(stockLocations.tenantId, tenantId)));
    return location || null;
  }

  async updateStockLocation(tenantId: string, id: string, data: Partial<InsertStockLocation>): Promise<StockLocation | null> {
    const [location] = await db.update(stockLocations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(stockLocations.id, id), eq(stockLocations.tenantId, tenantId)))
      .returning();
    return location || null;
  }

  // ============================================
  // STOCK LEVELS MANAGEMENT
  // ============================================
  
  async getStockLevels(tenantId: string, filters?: {
    itemId?: string;
    locationId?: string;
    lowStock?: boolean;
  }): Promise<StockLevel[]> {
    let whereConditions = [eq(stockLevels.tenantId, tenantId)];
    
    if (filters?.itemId) {
      whereConditions.push(eq(stockLevels.itemId, filters.itemId));
    }
    
    if (filters?.locationId) {
      whereConditions.push(eq(stockLevels.locationId, filters.locationId));
    }
    
    if (filters?.lowStock) {
      whereConditions.push(sql`${stockLevels.currentStock} <= ${stockLevels.minimumStock}`);
    }
    
    return await db.select().from(stockLevels).where(and(...whereConditions));
  }

  async updateStockLevel(tenantId: string, itemId: string, locationId: string, data: Partial<InsertStockLevel>): Promise<StockLevel> {
    // Try to update existing record first
    const [existing] = await db.update(stockLevels)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(stockLevels.tenantId, tenantId),
        eq(stockLevels.itemId, itemId),
        eq(stockLevels.locationId, locationId)
      ))
      .returning();
    
    if (existing) {
      return existing;
    }
    
    // If no existing record, create new one
    const [newLevel] = await db.insert(stockLevels).values({
      tenantId,
      itemId,
      locationId,
      ...data,
      updatedAt: new Date()
    }).returning();
    
    return newLevel;
  }

  // ============================================
  // STOCK MOVEMENTS MANAGEMENT
  // ============================================
  
  async createStockMovement(tenantId: string, data: InsertStockMovement): Promise<StockMovement> {
    return await db.transaction(async (tx) => {
      // Create movement record
      const [movement] = await tx.insert(stockMovements).values({
        ...data,
        tenantId
      }).returning();
      
      // Update stock levels
      await this.updateStockAfterMovement(tx, tenantId, movement);
      
      return movement;
    });
  }

  private async updateStockAfterMovement(tx: any, tenantId: string, movement: StockMovement): Promise<void> {
    const { itemId, locationId, movementType, quantity } = movement;
    
    // Get current stock level
    const [currentLevel] = await tx.select()
      .from(stockLevels)
      .where(and(
        eq(stockLevels.tenantId, tenantId),
        eq(stockLevels.itemId, itemId),
        eq(stockLevels.locationId, locationId)
      ));
    
    let newCurrentStock = currentLevel?.currentStock || 0;
    let newAvailableStock = currentLevel?.availableStock || 0;
    
    // Apply movement based on type
    switch (movementType) {
      case 'in':
        newCurrentStock += Number(quantity);
        newAvailableStock += Number(quantity);
        break;
      case 'out':
        newCurrentStock -= Number(quantity);
        newAvailableStock -= Number(quantity);
        break;
      case 'adjustment':
        newCurrentStock = Number(quantity);
        newAvailableStock = Number(quantity);
        break;
      case 'transfer':
        // For transfers, this is handled separately for from/to locations
        if (movement.fromLocationId === locationId) {
          newCurrentStock -= Number(quantity);
          newAvailableStock -= Number(quantity);
        } else if (movement.toLocationId === locationId) {
          newCurrentStock += Number(quantity);
          newAvailableStock += Number(quantity);
        }
        break;
    }
    
    // Update or create stock level record
    if (currentLevel) {
      await tx.update(stockLevels)
        .set({
          currentStock: newCurrentStock.toString(),
          availableStock: newAvailableStock.toString(),
          lastMovementAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(stockLevels.tenantId, tenantId),
          eq(stockLevels.itemId, itemId),
          eq(stockLevels.locationId, locationId)
        ));
    } else {
      await tx.insert(stockLevels).values({
        tenantId,
        itemId,
        locationId,
        currentStock: newCurrentStock.toString(),
        availableStock: newAvailableStock.toString(),
        lastMovementAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async getStockMovements(tenantId: string, filters?: {
    itemId?: string;
    locationId?: string;
    movementType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ movements: StockMovement[]; total: number }> {
    let whereConditions = [eq(stockMovements.tenantId, tenantId)];
    
    if (filters?.itemId) {
      whereConditions.push(eq(stockMovements.itemId, filters.itemId));
    }
    
    if (filters?.locationId) {
      whereConditions.push(eq(stockMovements.locationId, filters.locationId));
    }
    
    if (filters?.movementType) {
      whereConditions.push(eq(stockMovements.movementType, filters.movementType));
    }
    
    // Get total count
    const countQuery = db.select({ count: sql`count(*)` }).from(stockMovements).where(and(...whereConditions));
    const [{ count }] = await countQuery;
    
    // Build main query
    let query = db.select().from(stockMovements).where(and(...whereConditions));
    
    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    const movements = await query.orderBy(desc(stockMovements.createdAt));
    
    return {
      movements,
      total: Number(count)
    };
  }

  // ============================================
  // SUPPLIERS MANAGEMENT
  // ============================================
  
  async createSupplier(tenantId: string, data: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values({
      ...data,
      tenantId,
      updatedAt: new Date()
    }).returning();
    return supplier;
  }

  async getSuppliers(tenantId: string, filters?: {
    search?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ suppliers: Supplier[]; total: number }> {
    let whereConditions = [eq(suppliers.tenantId, tenantId)];
    
    if (filters?.search) {
      whereConditions.push(
        sql`${suppliers.name} ILIKE ${`%${filters.search}%`} OR 
            ${suppliers.supplierCode} ILIKE ${`%${filters.search}%`} OR 
            ${suppliers.documentNumber} ILIKE ${`%${filters.search}%`}`
      );
    }
    
    if (filters?.status) {
      whereConditions.push(eq(suppliers.status, filters.status));
    }
    
    if (filters?.category) {
      whereConditions.push(eq(suppliers.category, filters.category));
    }
    
    // Get total count
    const countQuery = db.select({ count: sql`count(*)` }).from(suppliers).where(and(...whereConditions));
    const [{ count }] = await countQuery;
    
    // Build main query
    let query = db.select().from(suppliers).where(and(...whereConditions));
    
    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    const suppliersList = await query.orderBy(asc(suppliers.name));
    
    return {
      suppliers: suppliersList,
      total: Number(count)
    };
  }

  async getSupplierById(tenantId: string, id: string): Promise<Supplier | null> {
    const [supplier] = await db.select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));
    return supplier || null;
  }

  async updateSupplier(tenantId: string, id: string, data: Partial<InsertSupplier>): Promise<Supplier | null> {
    const [supplier] = await db.update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
      .returning();
    return supplier || null;
  }

  async deleteSupplier(tenantId: string, id: string): Promise<boolean> {
    const result = await db.delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));
    return (result.rowCount || 0) > 0;
  }

  // ============================================
  // SUPPLIER CATALOG MANAGEMENT
  // ============================================
  
  async createSupplierCatalogItem(tenantId: string, data: InsertSupplierCatalog): Promise<SupplierCatalog> {
    const [catalogItem] = await db.insert(supplierCatalog).values({
      ...data,
      tenantId,
      updatedAt: new Date()
    }).returning();
    return catalogItem;
  }

  async getSupplierCatalog(tenantId: string, supplierId?: string, itemId?: string): Promise<SupplierCatalog[]> {
    let whereConditions = [eq(supplierCatalog.tenantId, tenantId), eq(supplierCatalog.isActive, true)];
    
    if (supplierId) {
      whereConditions.push(eq(supplierCatalog.supplierId, supplierId));
    }
    
    if (itemId) {
      whereConditions.push(eq(supplierCatalog.itemId, itemId));
    }
    
    return await db.select().from(supplierCatalog).where(and(...whereConditions));
  }

  async updateSupplierCatalogItem(tenantId: string, id: string, data: Partial<InsertSupplierCatalog>): Promise<SupplierCatalog | null> {
    const [catalogItem] = await db.update(supplierCatalog)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(supplierCatalog.id, id), eq(supplierCatalog.tenantId, tenantId)))
      .returning();
    return catalogItem || null;
  }

  async deleteSupplierCatalogItem(tenantId: string, id: string): Promise<boolean> {
    const result = await db.delete(supplierCatalog)
      .where(and(eq(supplierCatalog.id, id), eq(supplierCatalog.tenantId, tenantId)));
    return (result.rowCount || 0) > 0;
  }

  // ============================================
  // DASHBOARD AND STATISTICS
  // ============================================
  
  async getDashboardStats(tenantId: string): Promise<{
    totalItems: number;
    totalSuppliers: number;
    totalLocations: number;
    lowStockItems: number;
    totalStockValue: number;
    recentMovements: number;
  }> {
    // Execute all queries in parallel
    const [
      totalItemsResult,
      totalSuppliersResult,
      totalLocationsResult,
      lowStockResult,
      stockValueResult,
      recentMovementsResult
    ] = await Promise.all([
      db.select({ count: sql`count(*)` }).from(items).where(and(eq(items.tenantId, tenantId), eq(items.active, true))),
      db.select({ count: sql`count(*)` }).from(suppliers).where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.status, "active"))),
      db.select({ count: sql`count(*)` }).from(stockLocations).where(and(eq(stockLocations.tenantId, tenantId), eq(stockLocations.isActive, true))),
      db.select({ count: sql`count(*)` }).from(stockLevels).where(and(eq(stockLevels.tenantId, tenantId), sql`${stockLevels.currentStock} <= ${stockLevels.minimumStock}`)),
      db.select({ 
        value: sql`sum(CAST(${stockLevels.currentStock} AS DECIMAL) * CAST(${stockLevels.averageCost} AS DECIMAL))` 
      }).from(stockLevels).where(eq(stockLevels.tenantId, tenantId)),
      db.select({ count: sql`count(*)` }).from(stockMovements).where(and(
        eq(stockMovements.tenantId, tenantId),
        sql`${stockMovements.createdAt} >= NOW() - INTERVAL '30 days'`
      ))
    ]);

    return {
      totalItems: Number(totalItemsResult[0]?.count || 0),
      totalSuppliers: Number(totalSuppliersResult[0]?.count || 0),
      totalLocations: Number(totalLocationsResult[0]?.count || 0),
      lowStockItems: Number(lowStockResult[0]?.count || 0),
      totalStockValue: Number(stockValueResult[0]?.value || 0),
      recentMovements: Number(recentMovementsResult[0]?.count || 0)
    };
  }
}