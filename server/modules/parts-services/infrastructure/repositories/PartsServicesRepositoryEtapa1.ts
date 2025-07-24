
import { getTenantDb } from "../../../../db-tenant";
import { eq, and, desc, ilike, count, sql } from "drizzle-orm";
import { 
  parts, 
  suppliers, 
  stockLocations, 
  inventoryMultiLocation 
} from "../../../../../shared/schema-parts-services-unified";

export interface LocationData {
  location_code: string;
  location_name: string;
  location_type: 'warehouse' | 'store' | 'truck' | 'customer';
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  is_main_warehouse?: boolean;
  allows_negative_stock?: boolean;
}

export interface InventoryData {
  part_id: string;
  location_id: string;
  current_quantity?: number;
  minimum_stock?: number;
  maximum_stock?: number;
  reorder_point?: number;
  safety_stock?: number;
  unit_cost?: number;
}

export class PartsServicesRepositoryEtapa1 {
  
  // ===== LOCALIZAÇÕES DE ESTOQUE =====
  async createStockLocation(tenantId: string, data: LocationData) {
    const db = getTenantDb(tenantId);
    const [location] = await db
      .insert(stockLocations)
      .values({ ...data, tenantId })
      .returning();
    return location;
  }

  async findStockLocations(tenantId: string) {
    const db = getTenantDb(tenantId);
    return await db
      .select()
      .from(stockLocations)
      .where(and(
        eq(stockLocations.tenantId, tenantId),
        eq(stockLocations.is_active, true)
      ))
      .orderBy(stockLocations.location_name);
  }

  async findStockLocationById(id: string, tenantId: string) {
    const db = getTenantDb(tenantId);
    const [location] = await db
      .select()
      .from(stockLocations)
      .where(and(
        eq(stockLocations.id, id),
        eq(stockLocations.tenantId, tenantId)
      ));
    return location;
  }

  async updateStockLocation(id: string, tenantId: string, data: Partial<LocationData>) {
    const db = getTenantDb(tenantId);
    const [location] = await db
      .update(stockLocations)
      .set({ ...data, updated_at: new Date() })
      .where(and(
        eq(stockLocations.id, id),
        eq(stockLocations.tenantId, tenantId)
      ))
      .returning();
    return location;
  }

  async deleteStockLocation(id: string, tenantId: string) {
    const db = getTenantDb(tenantId);
    const [location] = await db
      .update(stockLocations)
      .set({ is_active: false, updated_at: new Date() })
      .where(and(
        eq(stockLocations.id, id),
        eq(stockLocations.tenantId, tenantId)
      ))
      .returning();
    return !!location;
  }

  // ===== INVENTÁRIO MULTI-LOCALIZAÇÃO =====
  async createInventoryPosition(tenantId: string, data: InventoryData) {
    const db = getTenantDb(tenantId);
    
    // Calcular available_quantity e total_value
    const available_quantity = (data.current_quantity || 0) - 0; // Sem reservas por enquanto
    const total_value = (data.current_quantity || 0) * (data.unit_cost || 0);
    
    const [inventory] = await db
      .insert(inventoryMultiLocation)
      .values({ 
        ...data, 
        tenantId,
        available_quantity,
        total_value
      })
      .returning();
    return inventory;
  }

  async findInventoryByLocation(tenantId: string, locationId?: string) {
    const db = getTenantDb(tenantId);
    
    const query = db
      .select({
        id: inventoryMultiLocation.id,
        part_id: inventoryMultiLocation.part_id,
        location_id: inventoryMultiLocation.location_id,
        current_quantity: inventoryMultiLocation.current_quantity,
        available_quantity: inventoryMultiLocation.available_quantity,
        minimum_stock: inventoryMultiLocation.minimum_stock,
        maximum_stock: inventoryMultiLocation.maximum_stock,
        unit_cost: inventoryMultiLocation.unit_cost,
        total_value: inventoryMultiLocation.total_value,
        part_title: parts.title,
        part_code: parts.internal_code,
        location_name: stockLocations.location_name,
        location_code: stockLocations.location_code
      })
      .from(inventoryMultiLocation)
      .leftJoin(parts, eq(inventoryMultiLocation.part_id, parts.id))
      .leftJoin(stockLocations, eq(inventoryMultiLocation.location_id, stockLocations.id))
      .where(eq(inventoryMultiLocation.tenantId, tenantId));
    
    if (locationId) {
      query.where(and(
        eq(inventoryMultiLocation.tenantId, tenantId),
        eq(inventoryMultiLocation.location_id, locationId)
      ));
    }
    
    return await query.orderBy(parts.title);
  }

  async updateInventoryQuantity(tenantId: string, partId: string, locationId: string, newQuantity: number, reason: string) {
    const db = getTenantDb(tenantId);
    
    // Buscar custo unitário atual
    const [currentInventory] = await db
      .select()
      .from(inventoryMultiLocation)
      .where(and(
        eq(inventoryMultiLocation.tenantId, tenantId),
        eq(inventoryMultiLocation.part_id, partId),
        eq(inventoryMultiLocation.location_id, locationId)
      ));
    
    const unitCost = currentInventory?.unit_cost || 0;
    const totalValue = newQuantity * Number(unitCost);
    
    const [updated] = await db
      .update(inventoryMultiLocation)
      .set({
        current_quantity: newQuantity,
        available_quantity: newQuantity, // Simplificado por enquanto
        total_value: totalValue,
        last_movement_date: new Date(),
        updated_at: new Date()
      })
      .where(and(
        eq(inventoryMultiLocation.tenantId, tenantId),
        eq(inventoryMultiLocation.part_id, partId),
        eq(inventoryMultiLocation.location_id, locationId)
      ))
      .returning();
    
    return updated;
  }

  // ===== ESTATÍSTICAS CONSOLIDADAS =====
  async getDashboardStatsEtapa1(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    const [partsCount] = await db
      .select({ count: count() })
      .from(parts)
      .where(and(eq(parts.tenantId, tenantId), eq(parts.is_active, true)));
    
    const [suppliersCount] = await db
      .select({ count: count() })
      .from(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.is_active, true)));
    
    const [locationsCount] = await db
      .select({ count: count() })
      .from(stockLocations)
      .where(and(eq(stockLocations.tenantId, tenantId), eq(stockLocations.is_active, true)));
    
    const [inventoryValue] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${inventoryMultiLocation.total_value}), 0)`,
        positions: count()
      })
      .from(inventoryMultiLocation)
      .where(eq(inventoryMultiLocation.tenantId, tenantId));
    
    return {
      totalParts: partsCount.count,
      totalSuppliers: suppliersCount.count,
      totalLocations: locationsCount.count,
      totalInventoryPositions: inventoryValue.positions,
      totalStockValue: Number(inventoryValue.total)
    };
  }

  // ===== ALERTAS DE ESTOQUE BAIXO =====
  async getLowStockAlerts(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    return await db
      .select({
        part_id: inventoryMultiLocation.part_id,
        location_id: inventoryMultiLocation.location_id,
        current_quantity: inventoryMultiLocation.current_quantity,
        minimum_stock: inventoryMultiLocation.minimum_stock,
        part_title: parts.title,
        part_code: parts.internal_code,
        location_name: stockLocations.location_name
      })
      .from(inventoryMultiLocation)
      .leftJoin(parts, eq(inventoryMultiLocation.part_id, parts.id))
      .leftJoin(stockLocations, eq(inventoryMultiLocation.location_id, stockLocations.id))
      .where(and(
        eq(inventoryMultiLocation.tenantId, tenantId),
        sql`${inventoryMultiLocation.current_quantity} <= ${inventoryMultiLocation.minimum_stock}`,
        sql`${inventoryMultiLocation.minimum_stock} > 0`
      ))
      .orderBy(parts.title);
  }
}
