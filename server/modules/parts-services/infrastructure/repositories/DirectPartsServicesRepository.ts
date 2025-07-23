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

  // ===== ACTIVITY TYPES =====
  async createActivityType(data: InsertActivityType): Promise<ActivityType> {
    const schema = this.getTenantSchema(data.tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.activity_types (tenant_id, name, description, category, duration, color, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.tenantId, data.name, data.description, data.category, data.duration, data.color, data.isActive]
    );
    return result.rows[0];
  }

  async findActivityTypes(tenantId: string): Promise<ActivityType[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.activity_types WHERE tenant_id = $1 AND is_active = true ORDER BY name`,
      [tenantId]
    );
    return result.rows;
  }

  async findActivityTypeById(id: string, tenantId: string): Promise<ActivityType | null> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.activity_types WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async updateActivityType(id: string, tenantId: string, data: Partial<InsertActivityType>): Promise<ActivityType | null> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.activity_types SET name = $1, description = $2, updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4 RETURNING *`,
      [data.name, data.description, id, tenantId]
    );
    return result.rows[0] || null;
  }

  async deleteActivityType(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.activity_types SET is_active = false WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount > 0;
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

  async findPartByPartNumber(partNumber: string, tenantId: string): Promise<Part | undefined> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.parts WHERE part_number = $1 AND tenant_id = $2`,
      [partNumber, tenantId]
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
    return result.rowCount > 0;
  }

  async getPartsCount(tenantId: string): Promise<number> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${schema}.parts WHERE tenant_id = $1 AND is_active = true`,
      [tenantId]
    );
    return parseInt(result.rows[0].count);
  }

  // ===== SERVICE KITS =====
  async createServiceKit(tenantId: string, data: InsertServiceKit): Promise<ServiceKit> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.service_kits (tenant_id, kit_name, description, sale_price, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, data.kitName, data.description, data.salePrice, true]
    );
    return result.rows[0];
  }

  async findServiceKits(tenantId: string, filters?: any): Promise<ServiceKit[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.service_kits WHERE tenant_id = $1 AND is_active = true ORDER BY kit_name LIMIT 50`,
      [tenantId]
    );
    return result.rows;
  }

  async findServiceKitById(id: string, tenantId: string): Promise<ServiceKit | undefined> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.service_kits WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async updateServiceKit(id: string, tenantId: string, data: Partial<InsertServiceKit>): Promise<ServiceKit> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.service_kits SET kit_name = $1, description = $2, sale_price = $3, updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [data.kitName, data.description, data.salePrice, id, tenantId]
    );
    return result.rows[0];
  }

  async deleteServiceKit(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.service_kits SET is_active = false WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount > 0;
  }

  async getServiceKitsCount(tenantId: string): Promise<number> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${schema}.service_kits WHERE tenant_id = $1 AND is_active = true`,
      [tenantId]
    );
    return parseInt(result.rows[0].count);
  }

  // ===== INVENTORY =====
  async createInventory(tenantId: string, data: InsertInventory): Promise<Inventory> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.inventory (tenant_id, part_id, current_stock, minimum_stock, maximum_stock)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, data.partId, data.currentStock, data.minimumStock, data.maximumStock]
    );
    return result.rows[0];
  }

  async findInventory(tenantId: string, filters?: any): Promise<Inventory[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.inventory WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [tenantId]
    );
    return result.rows;
  }

  async findInventoryById(id: string, tenantId: string): Promise<Inventory | undefined> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.inventory WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async updateInventory(id: string, tenantId: string, data: Partial<InsertInventory>): Promise<Inventory> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.inventory SET current_stock = $1, minimum_stock = $2, updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4 RETURNING *`,
      [data.currentStock, data.minimumStock, id, tenantId]
    );
    return result.rows[0];
  }

  async deleteInventory(id: string, tenantId: string): Promise<Inventory> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `DELETE FROM ${schema}.inventory WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async adjustInventoryQuantity(partId: string, tenantId: string, locationId: string, adjustment: number, reason: string): Promise<Inventory | undefined> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.inventory SET current_stock = current_stock + $1, updated_at = NOW()
       WHERE part_id = $2 AND tenant_id = $3 RETURNING *`,
      [adjustment, partId, tenantId]
    );
    return result.rows[0];
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
    return result.rowCount > 0;
  }

  async getSuppliersCount(tenantId: string): Promise<number> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${schema}.suppliers WHERE tenant_id = $1 AND is_active = true`,
      [tenantId]
    );
    return parseInt(result.rows[0].count);
  }
}