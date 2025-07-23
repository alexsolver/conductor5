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

  // =====================================================
  // MÓDULO 1: GESTÃO DE PEÇAS AVANÇADA
  // =====================================================

  // Categorias de peças
  async createPartCategory(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.part_categories (tenant_id, name, description, parent_category_id, hierarchy_level)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, data.name, data.description, data.parentCategoryId, data.hierarchyLevel || 1]
    );
    return result.rows[0];
  }

  async findPartCategories(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.part_categories WHERE tenant_id = $1 AND is_active = true ORDER BY hierarchy_level, name`,
      [tenantId]
    );
    return result.rows;
  }

  // Especificações técnicas
  async createPartSpecification(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.part_specifications (tenant_id, part_id, length_mm, width_mm, height_mm, weight_kg, voltage_min, voltage_max, power_watts, operating_temp_min, operating_temp_max, material_composition)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, data.partId, data.lengthMm, data.widthMm, data.heightMm, data.weightKg, data.voltageMin, data.voltageMax, data.powerWatts, data.operatingTempMin, data.operatingTempMax, JSON.stringify(data.materialComposition)]
    );
    return result.rows[0];
  }

  async findPartSpecifications(tenantId: string, partId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.part_specifications WHERE tenant_id = $1 AND part_id = $2`,
      [tenantId, partId]
    );
    return result.rows;
  }

  // Códigos de identificação
  async createPartIdentification(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.part_identification (tenant_id, part_id, internal_code, manufacturer_code, supplier_code, barcode_ean13, qr_code, rfid_tag)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, data.partId, data.internalCode, data.manufacturerCode, data.supplierCode, data.barcodeEan13, data.qrCode, data.rfidTag]
    );
    return result.rows[0];
  }

  // =====================================================
  // MÓDULO 2: CONTROLE DE ESTOQUE MULTI-LOCALIZAÇÃO
  // =====================================================

  // Localizações de estoque
  async createStockLocation(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.stock_locations (tenant_id, location_code, location_name, location_type, address, city, state, postal_code, latitude, longitude, is_main_warehouse)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, data.locationCode, data.locationName, data.locationType, data.address, data.city, data.state, data.postalCode, data.latitude, data.longitude, data.isMainWarehouse || false]
    );
    return result.rows[0];
  }

  async findStockLocations(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `SELECT * FROM ${schema}.stock_locations WHERE tenant_id = $1 AND is_active = true ORDER BY location_name`,
      [tenantId]
    );
    return result.rows;
  }

  // Inventário multi-localização
  async createInventoryMultiLocation(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.inventory_multi_location (tenant_id, part_id, location_id, current_quantity, minimum_stock, maximum_stock, reorder_point, unit_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, data.partId, data.locationId, data.currentQuantity, data.minimumStock, data.maximumStock, data.reorderPoint, data.unitCost]
    );
    return result.rows[0];
  }

  async findInventoryByLocation(tenantId: string, locationId?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT iml.*, p.title as part_name, p.internal_code, sl.location_name 
                 FROM ${schema}.inventory_multi_location iml 
                 LEFT JOIN ${schema}.parts p ON iml.part_id = p.id 
                 LEFT JOIN ${schema}.stock_locations sl ON iml.location_id = sl.id 
                 WHERE iml.tenant_id = $1`;
    const params = [tenantId];
    
    if (locationId) {
      query += ` AND iml.location_id = $${params.length + 1}`;
      params.push(locationId);
    }
    
    query += ` ORDER BY sl.location_name, p.title`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Movimentações de estoque detalhadas
  async createStockMovementDetailed(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const movementNumber = `MOV-${Date.now()}`;
    
    const result = await pool.query(
      `INSERT INTO ${schema}.stock_movements (tenant_id, part_id, location_id, movement_number, movement_type, movement_subtype, quantity, unit_cost, total_cost, source_location_id, destination_location_id, lot_number, serial_number, reference_document_type, reference_document_number, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [tenantId, data.partId, data.locationId, movementNumber, data.movementType, data.movementSubtype, data.quantity, data.unitCost, data.totalCost, data.sourceLocationId, data.destinationLocationId, data.lotNumber, data.serialNumber, data.referenceDocumentType, data.referenceDocumentNumber, data.notes, data.createdBy]
    );
    return result.rows[0];
  }

  // Reservas de estoque
  async createStockReservation(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const reservationNumber = `RES-${Date.now()}`;
    
    const result = await pool.query(
      `INSERT INTO ${schema}.stock_reservations (tenant_id, part_id, location_id, reservation_number, reservation_type, reference_id, reserved_quantity, remaining_quantity, expiry_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [tenantId, data.partId, data.locationId, reservationNumber, data.reservationType, data.referenceId, data.reservedQuantity, data.reservedQuantity, data.expiryDate, data.createdBy]
    );
    return result.rows[0];
  }

  async findStockReservations(tenantId: string, status?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT sr.*, p.title as part_name, sl.location_name 
                 FROM ${schema}.stock_reservations sr 
                 LEFT JOIN ${schema}.parts p ON sr.part_id = p.id 
                 LEFT JOIN ${schema}.stock_locations sl ON sr.location_id = sl.id 
                 WHERE sr.tenant_id = $1`;
    const params = [tenantId];
    
    if (status) {
      query += ` AND sr.status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ` ORDER BY sr.reservation_date DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // =====================================================
  // MÓDULO 3: GESTÃO DE FORNECEDORES AVANÇADA
  // =====================================================

  // Catálogo de produtos dos fornecedores
  async createSupplierCatalogItem(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.supplier_catalog (tenant_id, supplier_id, part_id, supplier_part_number, supplier_description, unit_price, minimum_order_quantity, lead_time_days, price_valid_until, is_preferred)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [tenantId, data.supplierId, data.partId, data.supplierPartNumber, data.supplierDescription, data.unitPrice, data.minimumOrderQuantity, data.leadTimeDays, data.priceValidUntil, data.isPreferred || false]
    );
    return result.rows[0];
  }

  async findSupplierCatalog(tenantId: string, supplierId?: string, partId?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT sc.*, s.name as supplier_name, p.title as part_name 
                 FROM ${schema}.supplier_catalog sc 
                 LEFT JOIN ${schema}.suppliers s ON sc.supplier_id = s.id 
                 LEFT JOIN ${schema}.parts p ON sc.part_id = p.id 
                 WHERE sc.tenant_id = $1 AND sc.is_active = true`;
    const params = [tenantId];
    
    if (supplierId) {
      query += ` AND sc.supplier_id = $${params.length + 1}`;
      params.push(supplierId);
    }
    
    if (partId) {
      query += ` AND sc.part_id = $${params.length + 1}`;
      params.push(partId);
    }
    
    query += ` ORDER BY sc.is_preferred DESC, sc.unit_price ASC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Histórico de compras
  async createPurchaseHistory(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.purchase_history (tenant_id, supplier_id, part_id, purchase_order_number, invoice_number, purchase_date, delivery_date, ordered_quantity, delivered_quantity, unit_price, total_value, quality_rating, delivery_rating, service_rating, observations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [tenantId, data.supplierId, data.partId, data.purchaseOrderNumber, data.invoiceNumber, data.purchaseDate, data.deliveryDate, data.orderedQuantity, data.deliveredQuantity, data.unitPrice, data.totalValue, data.qualityRating, data.deliveryRating, data.serviceRating, data.observations]
    );
    return result.rows[0];
  }

  // Avaliação de performance dos fornecedores
  async createSupplierPerformance(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.supplier_performance (tenant_id, supplier_id, evaluation_period_start, evaluation_period_end, quality_score, on_time_delivery_rate, price_competitiveness, responsiveness_score, overall_score, performance_tier, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, data.supplierId, data.evaluationPeriodStart, data.evaluationPeriodEnd, data.qualityScore, data.onTimeDeliveryRate, data.priceCompetitiveness, data.responsivenessScore, data.overallScore, data.performanceTier, data.createdBy]
    );
    return result.rows[0];
  }

  async findSupplierPerformance(tenantId: string, supplierId?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT sp.*, s.name as supplier_name 
                 FROM ${schema}.supplier_performance sp 
                 LEFT JOIN ${schema}.suppliers s ON sp.supplier_id = s.id 
                 WHERE sp.tenant_id = $1`;
    const params = [tenantId];
    
    if (supplierId) {
      query += ` AND sp.supplier_id = $${params.length + 1}`;
      params.push(supplierId);
    }
    
    query += ` ORDER BY sp.evaluation_period_end DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // =====================================================
  // MÓDULO 4: PLANEJAMENTO E COMPRAS
  // =====================================================

  // Análise de demanda
  async createDemandAnalysis(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.demand_analysis (tenant_id, part_id, analysis_period, period_start, period_end, total_consumption, average_monthly_consumption, peak_consumption, minimum_consumption, forecasted_demand_next_month, forecasted_demand_next_quarter)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, data.partId, data.analysisPeriod, data.periodStart, data.periodEnd, data.totalConsumption, data.averageMonthlyConsumption, data.peakConsumption, data.minimumConsumption, data.forecastedDemandNextMonth, data.forecastedDemandNextQuarter]
    );
    return result.rows[0];
  }

  async findDemandAnalysis(tenantId: string, partId?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT da.*, p.title as part_name 
                 FROM ${schema}.demand_analysis da 
                 LEFT JOIN ${schema}.parts p ON da.part_id = p.id 
                 WHERE da.tenant_id = $1`;
    const params = [tenantId];
    
    if (partId) {
      query += ` AND da.part_id = $${params.length + 1}`;
      params.push(partId);
    }
    
    query += ` ORDER BY da.period_end DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Ordens de compra avançadas
  async createPurchaseOrderAdvanced(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const poNumber = data.poNumber || `PO-${Date.now()}`;
    
    const result = await pool.query(
      `INSERT INTO ${schema}.purchase_orders (tenant_id, po_number, po_type, priority, supplier_id, status, required_date, subtotal, tax_amount, shipping_cost, total_amount, payment_terms, delivery_terms, internal_notes, requires_approval, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [tenantId, poNumber, data.poType || 'standard', data.priority || 'normal', data.supplierId, data.status || 'draft', data.requiredDate, data.subtotal, data.taxAmount, data.shippingCost, data.totalAmount, data.paymentTerms, data.deliveryTerms, data.internalNotes, data.requiresApproval !== false, data.createdBy]
    );
    return result.rows[0];
  }

  async findPurchaseOrdersAdvanced(tenantId: string, status?: string, supplierId?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT po.*, s.name as supplier_name 
                 FROM ${schema}.purchase_orders po 
                 LEFT JOIN ${schema}.suppliers s ON po.supplier_id = s.id 
                 WHERE po.tenant_id = $1 AND po.is_active = true`;
    const params = [tenantId];
    
    if (status) {
      query += ` AND po.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (supplierId) {
      query += ` AND po.supplier_id = $${params.length + 1}`;
      params.push(supplierId);
    }
    
    query += ` ORDER BY po.order_date DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async approvePurchaseOrder(tenantId: string, poId: string, approvedBy: string): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.purchase_orders 
       SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = $1 
       WHERE tenant_id = $2 AND id = $3 RETURNING *`,
      [approvedBy, tenantId, poId]
    );
    return result.rows[0];
  }

  // =====================================================
  // MÓDULOS 5-11: IMPLEMENTAÇÃO SISTEMÁTICA COMPLETA
  // =====================================================

  // ===== MÓDULO 5: INTEGRAÇÃO COM SERVIÇOS =====
  async createServiceIntegration(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.service_integrations 
       (tenant_id, service_name, service_type, endpoint_url, authentication_type, 
        configuration, status, last_sync, error_count) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, data.serviceName, data.serviceType, data.endpointUrl, 
       data.authenticationType, JSON.stringify(data.configuration), 
       data.status || 'active', data.lastSync, data.errorCount || 0]
    );
    return result.rows[0];
  }

  async findServiceIntegrations(tenantId: string, serviceType?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT * FROM ${schema}.service_integrations 
                 WHERE tenant_id = $1 AND is_active = true`;
    const params = [tenantId];
    
    if (serviceType) {
      query += ` AND service_type = $${params.length + 1}`;
      params.push(serviceType);
    }
    
    query += ` ORDER BY service_name`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async createWorkOrderIntegration(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.work_order_integrations 
       (tenant_id, work_order_id, service_id, integration_type, external_id, 
        sync_status, last_sync, sync_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, data.workOrderId, data.serviceId, data.integrationType, 
       data.externalId, data.syncStatus || 'pending', data.lastSync, 
       JSON.stringify(data.syncData)]
    );
    return result.rows[0];
  }

  // ===== MÓDULO 6: LOGÍSTICA E DISTRIBUIÇÃO =====
  async createTransfer(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const transferNumber = data.transferNumber || `TRF-${Date.now()}`;
    
    const result = await pool.query(
      `INSERT INTO ${schema}.transfers 
       (tenant_id, transfer_number, transfer_type, source_location_id, 
        destination_location_id, status, requested_date, carrier, tracking_number, 
        shipping_cost, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, transferNumber, data.transferType, data.sourceLocationId, 
       data.destinationLocationId, data.status || 'draft', data.requestedDate, 
       data.carrier, data.trackingNumber, data.shippingCost, data.notes, data.createdBy]
    );
    return result.rows[0];
  }

  async findTransfers(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT t.*, sl.name as source_location_name, dl.name as destination_location_name
                 FROM ${schema}.transfers t
                 LEFT JOIN ${schema}.stock_locations sl ON t.source_location_id = sl.id
                 LEFT JOIN ${schema}.stock_locations dl ON t.destination_location_id = dl.id
                 WHERE t.tenant_id = $1`;
    const params = [tenantId];
    
    if (filters?.status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    if (filters?.transferType) {
      query += ` AND t.transfer_type = $${params.length + 1}`;
      params.push(filters.transferType);
    }
    
    query += ` ORDER BY t.requested_date DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async createReturn(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const returnNumber = data.returnNumber || `RET-${Date.now()}`;
    
    const result = await pool.query(
      `INSERT INTO ${schema}.returns 
       (tenant_id, return_number, return_type, customer_id, supplier_id, 
        work_order_id, reason, description, status, action, request_date, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, returnNumber, data.returnType, data.customerId, data.supplierId, 
       data.workOrderId, data.reason, data.description, data.status || 'pending', 
       data.action, data.requestDate, data.createdBy]
    );
    return result.rows[0];
  }

  // ===== MÓDULO 7: CONTROLE DE ATIVOS =====
  async createAssetComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const assetNumber = data.assetNumber || `AST-${Date.now()}`;
    
    const result = await pool.query(
      `INSERT INTO ${schema}.assets 
       (tenant_id, asset_number, name, description, parent_asset_id, asset_level, 
        category, subcategory, type, brand, model, serial_number, manufacturing_date, 
        current_location_id, coordinates, status, condition, acquisition_cost, 
        current_value, depreciation_rate, operating_hours, kilometers, cycle_count, 
        warranty_start_date, warranty_end_date, qr_code, rfid_tag, barcode, 
        assigned_to, custodian, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
               $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31) RETURNING *`,
      [tenantId, assetNumber, data.name, data.description, data.parentAssetId, 
       data.assetLevel || 1, data.category, data.subcategory, data.type, data.brand, 
       data.model, data.serialNumber, data.manufacturingDate, data.currentLocationId, 
       JSON.stringify(data.coordinates), data.status || 'active', data.condition || 'good',
       data.acquisitionCost, data.currentValue, data.depreciationRate, 
       data.operatingHours || 0, data.kilometers || 0, data.cycleCount || 0,
       data.warrantyStartDate, data.warrantyEndDate, data.qrCode, data.rfidTag, 
       data.barcode, data.assignedTo, data.custodian, data.createdBy]
    );
    return result.rows[0];
  }

  async createAssetMaintenance(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.asset_maintenance 
       (tenant_id, asset_id, maintenance_type, work_order_id, scheduled_date, 
        start_date, completed_date, description, work_performed, technician_id, 
        labor_hours, labor_cost, parts_cost, total_cost, operating_hours_at_maintenance, 
        kilometers_at_maintenance, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [tenantId, data.assetId, data.maintenanceType, data.workOrderId, data.scheduledDate,
       data.startDate, data.completedDate, data.description, data.workPerformed, 
       data.technicianId, data.laborHours, data.laborCost, data.partsCost, 
       data.totalCost, data.operatingHoursAtMaintenance, data.kilometersAtMaintenance, 
       data.status || 'planned', data.createdBy]
    );
    return result.rows[0];
  }

  async createAssetMovement(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.asset_movements 
       (tenant_id, asset_id, movement_type, from_location_id, to_location_id, 
        from_user_id, to_user_id, movement_date, expected_return_date, 
        actual_return_date, reason, notes, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [tenantId, data.assetId, data.movementType, data.fromLocationId, 
       data.toLocationId, data.fromUserId, data.toUserId, data.movementDate, 
       data.expectedReturnDate, data.actualReturnDate, data.reason, data.notes, 
       data.status || 'active', data.createdBy]
    );
    return result.rows[0];
  }

  // ===== MÓDULO 8: LISTA DE PREÇOS UNITÁRIOS (LPU) =====
  async createPriceListComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const code = data.code || `PL-${Date.now()}`;
    
    const result = await pool.query(
      `INSERT INTO ${schema}.price_lists 
       (tenant_id, code, name, description, version, previous_version_id, 
        customer_id, contract_id, cost_center_id, valid_from, valid_to, 
        review_period, next_review_date, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [tenantId, code, data.name, data.description, data.version, data.previousVersionId,
       data.customerId, data.contractId, data.costCenterId, data.validFrom, 
       data.validTo, data.reviewPeriod, data.nextReviewDate, data.status || 'draft', 
       data.createdBy]
    );
    return result.rows[0];
  }

  async createPriceListItem(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.price_list_items 
       (tenant_id, price_list_id, item_type, item_id, item_code, item_description, 
        unit_price, currency, unit, cost_price, margin, markup, scale_discounts, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [tenantId, data.priceListId, data.itemType, data.itemId, data.itemCode, 
       data.itemDescription, data.unitPrice, data.currency || 'BRL', data.unit || 'UN',
       data.costPrice, data.margin, data.markup, JSON.stringify(data.scaleDiscounts), 
       data.notes]
    );
    return result.rows[0];
  }

  // ===== MÓDULO 9: FUNCIONALIDADES AVANÇADAS DE PREÇO =====
  async createPricingTable(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.pricing_tables 
       (tenant_id, name, description, customer_segment, region, channel, 
        version, valid_from, valid_to, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, data.name, data.description, data.customerSegment, data.region,
       data.channel, data.version, data.validFrom, data.validTo, 
       data.status || 'draft', data.createdBy]
    );
    return result.rows[0];
  }

  async createPricingRule(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.pricing_rules 
       (tenant_id, pricing_table_id, rule_name, rule_type, conditions, 
        action_type, action_value, priority) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, data.pricingTableId, data.ruleName, data.ruleType, 
       JSON.stringify(data.conditions), data.actionType, data.actionValue, 
       data.priority || 1]
    );
    return result.rows[0];
  }

  async createPriceHistory(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.price_histories 
       (tenant_id, item_type, item_id, old_price, new_price, price_change_percentage, 
        change_reason, notes, effective_date, changed_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [tenantId, data.itemType, data.itemId, data.oldPrice, data.newPrice, 
       data.priceChangePercentage, data.changeReason, data.notes, 
       data.effectiveDate, data.changedBy]
    );
    return result.rows[0];
  }

  // ===== MÓDULO 10: COMPLIANCE E AUDITORIA =====
  async createAuditLogComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.audit_logs 
       (tenant_id, table_name, record_id, action, old_values, new_values, 
        changed_fields, user_id, user_agent, ip_address, session_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, data.tableName, data.recordId, data.action, 
       JSON.stringify(data.oldValues), JSON.stringify(data.newValues), 
       data.changedFields, data.userId, data.userAgent, data.ipAddress, 
       data.sessionId]
    );
    return result.rows[0];
  }

  async createCertification(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.certifications 
       (tenant_id, name, type, issuing_body, certificate_number, scope, 
        applicable_to_asset_type, applicable_to_part_type, issued_date, 
        expiration_date, reminder_date, document_path, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [tenantId, data.name, data.type, data.issuingBody, data.certificateNumber,
       data.scope, data.applicableToAssetType, data.applicableToPartType, 
       data.issuedDate, data.expirationDate, data.reminderDate, data.documentPath,
       data.status || 'active', data.createdBy]
    );
    return result.rows[0];
  }

  async createComplianceAlert(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.compliance_alerts 
       (tenant_id, alert_type, severity, title, description, reference_type, 
        reference_id, alert_date, due_date, status, assigned_to, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, data.alertType, data.severity || 'medium', data.title, 
       data.description, data.referenceType, data.referenceId, data.alertDate, 
       data.dueDate, data.status || 'open', data.assignedTo, data.createdBy]
    );
    return result.rows[0];
  }

  // ===== MÓDULO 11: DIFERENCIAIS AVANÇADOS =====
  async createBudgetSimulation(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.budget_simulations 
       (tenant_id, name, description, customer_id, price_list_id, simulation_date, 
        subtotal, discount_amount, tax_amount, total_amount, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, data.name, data.description, data.customerId, data.priceListId,
       data.simulationDate, data.subtotal || 0, data.discountAmount || 0, 
       data.taxAmount || 0, data.totalAmount || 0, data.status || 'draft', 
       data.createdBy]
    );
    return result.rows[0];
  }

  async createDashboardConfig(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.dashboard_configs 
       (tenant_id, user_id, dashboard_type, layout, filters, is_default) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, data.userId, data.dashboardType, JSON.stringify(data.layout),
       JSON.stringify(data.filters), data.isDefault || false]
    );
    return result.rows[0];
  }

  async createIntegrationApi(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.integration_apis 
       (tenant_id, name, type, endpoint, method, auth_type, auth_config, 
        field_mapping, is_active, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [tenantId, data.name, data.type, data.endpoint, data.method || 'POST',
       data.authType, JSON.stringify(data.authConfig), 
       JSON.stringify(data.fieldMapping), data.isActive !== false, data.createdBy]
    );
    return result.rows[0];
  }

  async createOfflineSync(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.offline_sync 
       (tenant_id, user_id, table_name, record_id, action, data, status, sync_attempts) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, data.userId, data.tableName, data.recordId, data.action,
       JSON.stringify(data.data), data.status || 'pending', data.syncAttempts || 0]
    );
    return result.rows[0];
  }

  // =====================================================
  // MÉTODOS DE BUSCA PARA TODOS OS MÓDULOS
  // =====================================================

  async findServiceIntegrationsAdvanced(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT * FROM ${schema}.service_integrations WHERE tenant_id = $1 AND is_active = true`;
    const params = [tenantId];
    
    if (filters?.serviceType) {
      query += ` AND service_type = $${params.length + 1}`;
      params.push(filters.serviceType);
    }
    
    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    query += ` ORDER BY service_name`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async findBudgetSimulations(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT bs.*, c.name as customer_name 
                 FROM ${schema}.budget_simulations bs
                 LEFT JOIN ${schema}.customers c ON bs.customer_id = c.id
                 WHERE bs.tenant_id = $1`;
    const params = [tenantId];
    
    if (filters?.status) {
      query += ` AND bs.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    if (filters?.customerId) {
      query += ` AND bs.customer_id = $${params.length + 1}`;
      params.push(filters.customerId);
    }
    
    query += ` ORDER BY bs.simulation_date DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async findComplianceAlerts(tenantId: string, filters?: any): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    let query = `SELECT * FROM ${schema}.compliance_alerts WHERE tenant_id = $1`;
    const params = [tenantId];
    
    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    if (filters?.severity) {
      query += ` AND severity = $${params.length + 1}`;
      params.push(filters.severity);
    }
    
    query += ` ORDER BY alert_date DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }
}