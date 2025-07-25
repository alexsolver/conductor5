import { eq, and, like, desc, asc } from 'drizzle-orm';
import { db } from '../../db';
import { items, suppliers, stockLocations, stockLevels, stockMovements } from '../../../shared/schema-parts-services';

interface ItemFilters {
  search?: string;
  type?: 'material' | 'service';
  active?: boolean;
  limit?: number;
  offset?: number;
}

interface SupplierFilters {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface LocationFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export class PartsServicesRepository {
  // ============================================
  // ITEMS OPERATIONS
  // ============================================

  async createItem(tenantId: string, itemData: any) {
    const [newItem] = await db.insert(items)
      .values({
        tenantId,
        name: itemData.name,
        type: itemData.type,
        description: itemData.description,
        integrationCode: itemData.integrationCode,
        measurementUnit: itemData.measurementUnit || 'UN',
        maintenancePlan: itemData.maintenancePlan,
        group: itemData.group,
        active: true
      })
      .returning();

    return newItem;
  }

  async getItems(tenantId: string, filters: ItemFilters = {}) {
    const conditions = [eq(items.tenantId, tenantId)];

    if (filters.search) {
      conditions.push(like(items.name, `%${filters.search}%`));
    }

    if (filters.type) {
      conditions.push(eq(items.type, filters.type));
    }

    if (filters.active !== undefined) {
      conditions.push(eq(items.active, filters.active));
    }

    const itemsList = await db.select()
      .from(items)
      .where(and(...conditions))
      .orderBy(desc(items.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    const total = await db.select()
      .from(items)
      .where(and(...conditions));

    return {
      items: itemsList,
      total: total.length,
      hasMore: (filters.offset || 0) + itemsList.length < total.length
    };
  }

  async getItemById(tenantId: string, itemId: string) {
    const [item] = await db.select()
      .from(items)
      .where(and(
        eq(items.tenantId, tenantId),
        eq(items.id, itemId)
      ));

    return item;
  }

  async updateItem(tenantId: string, itemId: string, updateData: any) {
    const [updatedItem] = await db.update(items)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(items.tenantId, tenantId),
        eq(items.id, itemId)
      ))
      .returning();

    return updatedItem;
  }

  async deleteItem(tenantId: string, itemId: string) {
    await db.delete(items)
      .where(and(
        eq(items.tenantId, tenantId),
        eq(items.id, itemId)
      ));

    return { success: true };
  }

  // ============================================
  // SUPPLIERS OPERATIONS
  // ============================================

  async createSupplier(tenantId: string, supplierData: any) {
    const [newSupplier] = await db.insert(suppliers)
      .values({
        tenantId,
        name: supplierData.name,
        supplierCode: supplierData.supplierCode,
        documentNumber: supplierData.documentNumber,
        email: supplierData.email,
        phone: supplierData.phone,
        status: 'active'
      })
      .returning();

    return newSupplier;
  }

  async getSuppliers(tenantId: string, filters: SupplierFilters = {}) {
    const conditions = [eq(suppliers.tenantId, tenantId)];

    if (filters.search) {
      conditions.push(like(suppliers.name, `%${filters.search}%`));
    }

    if (filters.status) {
      conditions.push(eq(suppliers.status, filters.status));
    }

    const suppliersList = await db.select()
      .from(suppliers)
      .where(and(...conditions))
      .orderBy(desc(suppliers.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    const total = await db.select()
      .from(suppliers)
      .where(and(...conditions));

    return {
      suppliers: suppliersList,
      total: total.length,
      hasMore: (filters.offset || 0) + suppliersList.length < total.length
    };
  }

  async getSupplierById(tenantId: string, supplierId: string) {
    const [supplier] = await db.select()
      .from(suppliers)
      .where(and(
        eq(suppliers.tenantId, tenantId),
        eq(suppliers.id, supplierId)
      ));

    return supplier;
  }

  async updateSupplier(tenantId: string, supplierId: string, updateData: any) {
    const [updatedSupplier] = await db.update(suppliers)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(suppliers.tenantId, tenantId),
        eq(suppliers.id, supplierId)
      ))
      .returning();

    return updatedSupplier;
  }

  async deleteSupplier(tenantId: string, supplierId: string) {
    await db.delete(suppliers)
      .where(and(
        eq(suppliers.tenantId, tenantId),
        eq(suppliers.id, supplierId)
      ));

    return { success: true };
  }

  // ============================================
  // STOCK LOCATIONS OPERATIONS
  // ============================================

  async createStockLocation(tenantId: string, locationData: any) {
    const [newLocation] = await db.insert(stockLocations)
      .values({
        tenantId,
        name: locationData.name,
        code: locationData.code,
        description: locationData.description,
        address: locationData.address,
        active: true
      })
      .returning();

    return newLocation;
  }

  async getStockLocations(tenantId: string, filters: LocationFilters = {}) {
    const conditions = [eq(stockLocations.tenantId, tenantId)];

    if (filters.search) {
      conditions.push(like(stockLocations.name, `%${filters.search}%`));
    }

    const locationsList = await db.select()
      .from(stockLocations)
      .where(and(...conditions))
      .orderBy(desc(stockLocations.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    const total = await db.select()
      .from(stockLocations)
      .where(and(...conditions));

    return {
      locations: locationsList,
      total: total.length,
      hasMore: (filters.offset || 0) + locationsList.length < total.length
    };
  }

  async getStockLocationById(tenantId: string, locationId: string) {
    const [location] = await db.select()
      .from(stockLocations)
      .where(and(
        eq(stockLocations.tenantId, tenantId),
        eq(stockLocations.id, locationId)
      ));

    return location;
  }

  async updateStockLocation(tenantId: string, locationId: string, updateData: any) {
    const [updatedLocation] = await db.update(stockLocations)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(stockLocations.tenantId, tenantId),
        eq(stockLocations.id, locationId)
      ))
      .returning();

    return updatedLocation;
  }

  async deleteStockLocation(tenantId: string, locationId: string) {
    await db.delete(stockLocations)
      .where(and(
        eq(stockLocations.tenantId, tenantId),
        eq(stockLocations.id, locationId)
      ));

    return { success: true };
  }

  // ============================================
  // DASHBOARD STATS
  // ============================================

  async getDashboardStats(tenantId: string) {
    try {
      const db = await getTenantDb(tenantId);

      console.log(`[PARTS-SERVICES] Fetching dashboard stats for tenant: ${tenantId}`);

      // Get total items count
      const totalItemsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(items)
        .where(eq(items.tenantId, tenantId));

      // Get total suppliers count  
      const totalSuppliersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(suppliers)
        .where(eq(suppliers.tenantId, tenantId));

      // Get total locations count
      const totalLocationsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(stockLocations)
        .where(eq(stockLocations.tenantId, tenantId));

      const stats = {
        totalItems: totalItemsResult[0]?.count || 0,
        totalSuppliers: totalSuppliersResult[0]?.count || 0,
        totalLocations: totalLocationsResult[0]?.count || 0,
        lowStockItems: 2, // Simulated for demo
        totalStockValue: 15750.50 // Simulated for demo
      };

      console.log(`[PARTS-SERVICES] Dashboard stats:`, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}