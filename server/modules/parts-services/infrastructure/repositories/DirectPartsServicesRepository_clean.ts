import { pool } from "../../../../db";
import { PartsServicesRepository } from "../../domain/repositories/PartsServicesRepository";
import {
  type ActivityType,
  type Part,
  type ServiceKit,
  type Inventory,
  type Supplier,
  type InsertActivityType,
  type InsertPart,
  type InsertServiceKit,
  type InsertInventory,
  type InsertSupplier
} from "@shared/schema";

export class DirectPartsServicesRepository implements PartsServicesRepository {
  private getTenantSchema(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // ===== DASHBOARD & STATS =====
  async getDashboardStats(tenantId: string) {
    const schema = this.getTenantSchema(tenantId);
    
    const partsResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${schema}.parts WHERE tenant_id = $1 AND is_active = true`,
      [tenantId]
    );
    
    const suppliersResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${schema}.suppliers WHERE tenant_id = $1 AND is_active = true`,
      [tenantId]
    );
    
    const ordersResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${schema}.purchase_orders WHERE tenant_id = $1`,
      [tenantId]
    );
    
    const simulationsResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${schema}.budget_simulations WHERE tenant_id = $1`,
      [tenantId]
    );

    return {
      totalParts: parseInt(partsResult.rows[0].count) || 0,
      totalSuppliers: parseInt(suppliersResult.rows[0].count) || 0,
      totalOrders: parseInt(ordersResult.rows[0].count) || 0,
      totalSimulations: parseInt(simulationsResult.rows[0].count) || 0
    };
  }

  // ===== PARTS =====
  async createPart(tenantId: string, data: InsertPart): Promise<Part> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.parts (tenant_id, title, part_number, cost_price, sale_price, category, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, data.title, data.partNumber, data.costPrice, data.salePrice, data.category, true]
    );
    return result.rows[0];
  }

  async findParts(tenantId: string, filters?: any): Promise<Part[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.parts WHERE tenant_id = $1 AND is_active = true ORDER BY title LIMIT 50`,
      [tenantId]
    );
    return result.rows;
  }

  async findPartById(id: string, tenantId: string): Promise<Part | undefined> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.parts WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async updatePart(id: string, tenantId: string, data: Partial<InsertPart>): Promise<Part> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.parts SET title = $1, cost_price = $2, sale_price = $3, updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [data.title, data.costPrice, data.salePrice, id, tenantId]
    );
    return result.rows[0];
  }

  async deletePart(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.parts SET is_active = false WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount || 0) > 0;
  }

  // ===== SUPPLIERS =====
  async createSupplier(tenantId: string, data: InsertSupplier): Promise<Supplier> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.suppliers (tenant_id, name, email, phone, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, data.name, data.email, data.phone, true]
    );
    return result.rows[0];
  }

  async findSuppliers(tenantId: string, filters?: any): Promise<Supplier[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.suppliers WHERE tenant_id = $1 AND is_active = true ORDER BY name LIMIT 50`,
      [tenantId]
    );
    return result.rows;
  }

  async findSupplierById(id: string, tenantId: string): Promise<Supplier | undefined> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.suppliers WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async updateSupplier(id: string, tenantId: string, data: Partial<InsertSupplier>): Promise<Supplier> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.suppliers SET name = $1, email = $2, phone = $3, updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [data.name, data.email, data.phone, id, tenantId]
    );
    return result.rows[0];
  }

  async deleteSupplier(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.suppliers SET is_active = false WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount || 0) > 0;
  }

  // ===== PURCHASE ORDERS =====
  async findPurchaseOrders(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT po.*, s.name as supplier_name 
       FROM ${schema}.purchase_orders po
       LEFT JOIN ${schema}.suppliers s ON po.supplier_id = s.id
       WHERE po.tenant_id = $1 
       ORDER BY po.created_at DESC LIMIT 50`,
      [tenantId]
    );
    return result.rows;
  }

  // ===== BUDGET SIMULATIONS =====
  async findBudgetSimulations(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.budget_simulations 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC LIMIT 50`,
      [tenantId]
    );
    return result.rows;
  }

  // ===== PRICE LISTS =====
  async findPriceLists(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.price_lists_complete 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC LIMIT 50`,
      [tenantId]
    );
    return result.rows;
  }

  // ===== STUB METHODS FOR INTERFACE COMPLIANCE =====
  async createActivityType(data: InsertActivityType): Promise<ActivityType> {
    throw new Error("Not implemented yet");
  }

  async findActivityTypes(tenantId: string): Promise<ActivityType[]> {
    return [];
  }

  async findActivityTypeById(id: string, tenantId: string): Promise<ActivityType | null> {
    return null;
  }

  async updateActivityType(id: string, tenantId: string, data: Partial<InsertActivityType>): Promise<ActivityType | null> {
    return null;
  }

  async deleteActivityType(id: string, tenantId: string): Promise<boolean> {
    return false;
  }

  async createServiceKit(tenantId: string, data: InsertServiceKit): Promise<ServiceKit> {
    throw new Error("Not implemented yet");
  }

  async findServiceKits(tenantId: string, filters?: any): Promise<ServiceKit[]> {
    return [];
  }

  async findServiceKitById(id: string, tenantId: string): Promise<ServiceKit | undefined> {
    return undefined;
  }

  async updateServiceKit(id: string, tenantId: string, data: Partial<InsertServiceKit>): Promise<ServiceKit> {
    throw new Error("Not implemented yet");
  }

  async deleteServiceKit(id: string, tenantId: string): Promise<boolean> {
    return false;
  }

  async createInventory(tenantId: string, data: InsertInventory): Promise<Inventory> {
    throw new Error("Not implemented yet");
  }

  async findInventory(tenantId: string, filters?: any): Promise<Inventory[]> {
    return [];
  }

  async findInventoryById(id: string, tenantId: string): Promise<Inventory | undefined> {
    return undefined;
  }

  async updateInventory(id: string, tenantId: string, data: Partial<InsertInventory>): Promise<Inventory> {
    throw new Error("Not implemented yet");
  }

  async deleteInventory(id: string, tenantId: string): Promise<Inventory> {
    throw new Error("Not implemented yet");
  }

  async adjustInventoryQuantity(partId: string, tenantId: string, locationId: string, adjustment: number, reason: string): Promise<Inventory | undefined> {
    return undefined;
  }

  // Additional missing methods for interface compliance
  async findPartsByTenant(tenantId: string): Promise<Part[]> {
    return this.findParts(tenantId);
  }

  async findInventoryByPart(partId: string, tenantId: string): Promise<Inventory | undefined> {
    return undefined;
  }

  async findInventoriesByTenant(tenantId: string): Promise<Inventory[]> {
    return [];
  }

  async adjustStock(partId: string, tenantId: string, locationId: string, adjustment: number): Promise<Inventory | undefined> {
    return undefined;
  }

  // Additional stub methods as needed by the interface
  async findPartByPartNumber(partNumber: string, tenantId: string): Promise<Part | undefined> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.parts WHERE part_number = $1 AND tenant_id = $2`,
      [partNumber, tenantId]
    );
    return result.rows[0];
  }
}