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

  // ===== STOCK MOVEMENTS =====
  async createStockMovement(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.stock_movements (tenant_id, part_id, location_id, movement_type, quantity, reference_document, notes, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, data.partId, data.locationId, data.movementType, data.quantity, data.referenceDocument, data.notes, data.createdById]
    );
    return result.rows[0];
  }

  async findStockMovements(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT sm.*, p.title as part_title, p.part_number 
                 FROM ${schema}.stock_movements sm 
                 LEFT JOIN ${schema}.parts p ON sm.part_id = p.id 
                 WHERE sm.tenant_id = $1`;
    const params = [tenantId];
    
    if (filters?.partId) {
      query += ` AND sm.part_id = $${params.length + 1}`;
      params.push(filters.partId);
    }
    
    if (filters?.movementType) {
      query += ` AND sm.movement_type = $${params.length + 1}`;
      params.push(filters.movementType);
    }
    
    query += ` ORDER BY sm.created_at DESC LIMIT 100`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // ===== QUOTATIONS =====
  async createQuotation(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.quotations (tenant_id, quotation_number, supplier_id, status, valid_until, total_value, currency, notes, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, data.quotationNumber, data.supplierId, data.status, data.validUntil, data.totalValue, data.currency, data.notes, data.createdById]
    );
    return result.rows[0];
  }

  async findQuotations(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT q.*, s.name as supplier_name 
                 FROM ${schema}.quotations q 
                 LEFT JOIN ${schema}.suppliers s ON q.supplier_id = s.id 
                 WHERE q.tenant_id = $1`;
    const params = [tenantId];
    
    if (filters?.status) {
      query += ` AND q.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    query += ` ORDER BY q.created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateQuotationStatus(id: string, tenantId: string, status: string): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.quotations SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );
    return result.rows[0];
  }

  // ===== QUOTATION ITEMS =====
  async createQuotationItem(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.quotation_items (tenant_id, quotation_id, part_id, requested_quantity, unit_price, total_price, lead_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, data.quotationId, data.partId, data.requestedQuantity, data.unitPrice, data.totalPrice, data.leadTime, data.notes]
    );
    return result.rows[0];
  }

  async findQuotationItems(quotationId: string, tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT qi.*, p.title as part_title, p.part_number 
       FROM ${schema}.quotation_items qi 
       LEFT JOIN ${schema}.parts p ON qi.part_id = p.id 
       WHERE qi.quotation_id = $1 AND qi.tenant_id = $2`,
      [quotationId, tenantId]
    );
    return result.rows;
  }

  // ===== PURCHASE ORDERS =====
  async createPurchaseOrder(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.purchase_orders (tenant_id, po_number, supplier_id, quotation_id, status, expected_delivery, total_value, currency, payment_terms, delivery_address, notes, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, data.poNumber, data.supplierId, data.quotationId, data.status, data.expectedDelivery, data.totalValue, data.currency, data.paymentTerms, data.deliveryAddress, data.notes, data.createdById]
    );
    return result.rows[0];
  }

  async findPurchaseOrders(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT po.*, s.name as supplier_name 
                 FROM ${schema}.purchase_orders po 
                 LEFT JOIN ${schema}.suppliers s ON po.supplier_id = s.id 
                 WHERE po.tenant_id = $1`;
    const params = [tenantId];
    
    if (filters?.status) {
      query += ` AND po.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    query += ` ORDER BY po.created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async updatePurchaseOrderStatus(id: string, tenantId: string, status: string): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.purchase_orders SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );
    return result.rows[0];
  }

  // ===== ASSETS =====
  async createAsset(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.assets (tenant_id, asset_code, asset_name, description, category, brand, model, serial_number, location_id, status, acquisition_date, warranty_expiry, specifications, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [tenantId, data.assetCode, data.assetName, data.description, data.category, data.brand, data.model, data.serialNumber, data.locationId, data.status, data.acquisitionDate, data.warrantyExpiry, JSON.stringify(data.specifications), data.createdById]
    );
    return result.rows[0];
  }

  async findAssets(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT * FROM ${schema}.assets WHERE tenant_id = $1`;
    const params = [tenantId];
    
    if (filters?.category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(filters.category);
    }
    
    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    query += ` ORDER BY asset_name ASC LIMIT 50`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateAssetStatus(id: string, tenantId: string, status: string): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.assets SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );
    return result.rows[0];
  }

  // ===== PRICE LISTS =====
  async createPriceList(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.price_lists (tenant_id, name, version, valid_from, valid_to, customer_id, contract_id, cost_center, currency, status, is_active, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, data.name, data.version, data.validFrom, data.validTo, data.customerId, data.contractId, data.costCenter, data.currency, data.status, data.isActive, data.createdById]
    );
    return result.rows[0];
  }

  async findPriceLists(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT * FROM ${schema}.price_lists WHERE tenant_id = $1`;
    const params = [tenantId];
    
    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    if (filters?.isActive !== undefined) {
      query += ` AND is_active = $${params.length + 1}`;
      params.push(filters.isActive);
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // ===== SUPPLIER EVALUATIONS =====
  async createSupplierEvaluation(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.supplier_evaluations (tenant_id, supplier_id, evaluation_period_start, evaluation_period_end, quality_score, delivery_score, price_score, service_score, overall_score, comments, evaluator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, data.supplierId, data.evaluationPeriodStart, data.evaluationPeriodEnd, data.qualityScore, data.deliveryScore, data.priceScore, data.serviceScore, data.overallScore, data.comments, data.evaluatorId]
    );
    return result.rows[0];
  }

  async findSupplierEvaluations(tenantId: string, supplierId?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT se.*, s.name as supplier_name 
                 FROM ${schema}.supplier_evaluations se 
                 LEFT JOIN ${schema}.suppliers s ON se.supplier_id = s.id 
                 WHERE se.tenant_id = $1`;
    const params = [tenantId];
    
    if (supplierId) {
      query += ` AND se.supplier_id = $${params.length + 1}`;
      params.push(supplierId);
    }
    
    query += ` ORDER BY se.created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // ===== AUDIT LOGS =====
  async createAuditLog(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.parts_audit_log (tenant_id, table_name, record_id, action, old_values, new_values, user_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, data.tableName, data.recordId, data.action, JSON.stringify(data.oldValues), JSON.stringify(data.newValues), data.userId, data.ipAddress, data.userAgent]
    );
    return result.rows[0];
  }

  async findAuditLogs(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT * FROM ${schema}.parts_audit_log WHERE tenant_id = $1`;
    const params = [tenantId];
    
    if (filters?.tableName) {
      query += ` AND table_name = $${params.length + 1}`;
      params.push(filters.tableName);
    }
    
    if (filters?.recordId) {
      query += ` AND record_id = $${params.length + 1}`;
      params.push(filters.recordId);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT 100`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // ===== DASHBOARD STATS =====
  async getDashboardStats(tenantId: string): Promise<any> {
    try {
      const schema = this.getTenantSchema(tenantId);
      
      // Stats básicos usando queries SQL diretas
      const partsCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${schema}.parts WHERE tenant_id = $1`,
        [tenantId]
      );

      const suppliersCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${schema}.suppliers WHERE tenant_id = $1`,
        [tenantId]
      );

      const inventoryCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${schema}.inventory WHERE tenant_id = $1`,
        [tenantId]
      );

      const serviceKitsCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${schema}.service_kits WHERE tenant_id = $1`,
        [tenantId]
      );

      // Itens em ponto de reposição
      const lowStockResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${schema}.inventory 
         WHERE tenant_id = $1 AND current_quantity <= reorder_point`,
        [tenantId]
      );

      // Valor total do estoque
      const totalStockValueResult = await pool.query(
        `SELECT COALESCE(SUM(current_quantity * unit_cost), 0) as total 
         FROM ${schema}.inventory WHERE tenant_id = $1`,
        [tenantId]
      );

      return {
        totalParts: parseInt(partsCountResult.rows[0]?.count || '0'),
        totalSuppliers: parseInt(suppliersCountResult.rows[0]?.count || '0'),
        totalInventoryItems: parseInt(inventoryCountResult.rows[0]?.count || '0'),
        totalServiceKits: parseInt(serviceKitsCountResult.rows[0]?.count || '0'),
        lowStockItems: parseInt(lowStockResult.rows[0]?.count || '0'),
        totalStockValue: parseFloat(totalStockValueResult.rows[0]?.total || '0')
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}