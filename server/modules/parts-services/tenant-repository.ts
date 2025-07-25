import { sql } from "drizzle-orm";
import { db } from "../../db";

export class TenantPartsServicesRepository {
  private getTenantSchema(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
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
    const schemaName = this.getTenantSchema(tenantId);

    try {
      // Get total items
      const totalItemsResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM ${sql.identifier(schemaName)}.items 
        WHERE active = true
      `);

      // Get total suppliers
      const totalSuppliersResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM ${sql.identifier(schemaName)}.suppliers 
        WHERE status = 'active'
      `);

      // Get total locations
      const totalLocationsResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM ${sql.identifier(schemaName)}.stock_locations 
        WHERE is_active = true
      `);

      // Get low stock items
      const lowStockResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM ${sql.identifier(schemaName)}.stock_levels 
        WHERE current_quantity <= minimum_stock
      `);

      // Get total stock value
      const stockValueResult = await db.execute(sql`
        SELECT COALESCE(SUM(current_quantity * average_cost), 0) as value 
        FROM ${sql.identifier(schemaName)}.stock_levels 
        WHERE average_cost IS NOT NULL
      `);

      return {
        totalItems: Number(totalItemsResult.rows[0]?.count || 0),
        totalSuppliers: Number(totalSuppliersResult.rows[0]?.count || 0),
        totalLocations: Number(totalLocationsResult.rows[0]?.count || 0),
        lowStockItems: Number(lowStockResult.rows[0]?.count || 0),
        totalStockValue: Number(stockValueResult.rows[0]?.value || 0),
        recentMovements: 0 // Will implement when we have movements table
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // ============================================
  // ITEMS MANAGEMENT
  // ============================================
  
  async getItems(tenantId: string, filters?: {
    search?: string;
    category?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const schemaName = this.getTenantSchema(tenantId);
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    try {
      let whereClause = sql`WHERE i.tenant_id = ${tenantId}`;

      if (filters?.search) {
        whereClause = sql`${whereClause} AND (i.title ILIKE ${`%${filters.search}%`} OR i.internal_code ILIKE ${`%${filters.search}%`})`;
      }

      if (filters?.category) {
        whereClause = sql`${whereClause} AND i.category = ${filters.category}`;
      }

      if (filters?.type) {
        whereClause = sql`${whereClause} AND i.type = ${filters.type}`;
      }

      if (filters?.status) {
        whereClause = sql`${whereClause} AND i.status = ${filters.status}`;
      }

      const result = await db.execute(sql`
        SELECT 
          i.id,
          i.tenant_id,
          i.title,
          i.description,
          i.type,
          i.category,
          i.subcategory,
          i.internal_code,
          i.manufacturer_code,
          i.supplier_code,
          i.barcode,
          i.sku,
          i.manufacturer,
          i.model,
          i.specifications,
          i.technical_details,
          i.cost_price,
          i.sale_price,
          i.currency,
          i.unit,
          i.abc_classification,
          i.criticality,
          i.status,
          i.active,
          i.created_at,
          i.updated_at,
          i.created_by,
          i.updated_by,
          i.tags,
          i.custom_fields,
          i.notes
        FROM ${sql.identifier(schemaName)}.items i
        ${whereClause}
        ORDER BY i.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  async createItem(tenantId: string, data: any): Promise<any> {
    const schemaName = this.getTenantSchema(tenantId);

    try {
      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.items (
          tenant_id, title, description, type, category, subcategory,
          internal_code, manufacturer_code, supplier_code, barcode, sku,
          manufacturer, model, specifications, technical_details,
          cost_price, sale_price, currency, unit, abc_classification,
          criticality, status, active, created_at, updated_at,
          created_by, updated_by, tags, custom_fields, notes
        ) VALUES (
          ${tenantId}, ${data.title}, ${data.description}, ${data.type}, ${data.category}, ${data.subcategory},
          ${data.internalCode}, ${data.manufacturerCode}, ${data.supplierCode}, ${data.barcode}, ${data.sku},
          ${data.manufacturer}, ${data.model}, ${JSON.stringify(data.specifications)}, ${data.technicalDetails},
          ${data.costPrice}, ${data.salePrice}, ${data.currency || 'BRL'}, ${data.unit || 'UN'}, ${data.abcClassification},
          ${data.criticality}, ${data.status || 'active'}, true, NOW(), NOW(),
          ${data.createdBy}, ${data.updatedBy}, ${JSON.stringify(data.tags)}, ${JSON.stringify(data.customFields)}, ${data.notes}
        )
        RETURNING *
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  // ============================================
  // SUPPLIERS MANAGEMENT
  // ============================================
  
  async getSuppliers(tenantId: string, filters?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const schemaName = this.getTenantSchema(tenantId);
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    try {
      let whereClause = sql`WHERE s.tenant_id = ${tenantId}`;

      if (filters?.search) {
        whereClause = sql`${whereClause} AND (s.name ILIKE ${`%${filters.search}%`} OR s.supplier_code ILIKE ${`%${filters.search}%`})`;
      }

      if (filters?.status) {
        whereClause = sql`${whereClause} AND s.status = ${filters.status}`;
      }

      const result = await db.execute(sql`
        SELECT 
          s.id,
          s.tenant_id,
          s.name,
          s.supplier_code,
          s.trade_name,
          s.document_number,
          s.document_type,
          s.email,
          s.phone,
          s.website,
          s.address,
          s.city,
          s.state,
          s.country,
          s.zip_code,
          s.payment_terms,
          s.delivery_time,
          s.minimum_order,
          s.currency,
          s.category,
          s.rating,
          s.notes,
          s.status,
          s.created_at,
          s.updated_at,
          s.created_by,
          s.updated_by,
          s.custom_fields
        FROM ${sql.identifier(schemaName)}.suppliers s
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  async createSupplier(tenantId: string, data: any): Promise<any> {
    const schemaName = this.getTenantSchema(tenantId);

    try {
      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.suppliers (
          tenant_id, name, supplier_code, trade_name, document_number, email, phone,
          website, address, city, state, country, zip_code,
          payment_terms, delivery_time, minimum_order, currency, category,
          rating, notes, status, created_at, updated_at,
          created_by, updated_by
        ) VALUES (
          ${tenantId}, ${data.name}, ${data.supplier_code}, ${data.trade_name}, ${data.document_number}, ${data.email}, ${data.phone},
          ${data.website}, ${data.address}, ${data.city}, ${data.state}, ${data.country}, ${data.zip_code},
          ${data.payment_terms}, ${data.delivery_time}, ${data.minimum_order}, ${data.currency}, ${data.category},
          ${data.rating}, ${data.notes}, ${data.status || 'active'}, NOW(), NOW(),
          ${data.created_by}, ${data.updated_by}
        )
        RETURNING *
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  // ============================================
  // STOCK LEVELS MANAGEMENT
  // ============================================
  
  async getStockLevels(tenantId: string, filters?: {
    itemId?: string;
    locationId?: string;
    lowStock?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const schemaName = this.getTenantSchema(tenantId);
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    try {
      let whereClause = sql`WHERE sl.tenant_id = ${tenantId}`;

      if (filters?.itemId) {
        whereClause = sql`${whereClause} AND sl.item_id = ${filters.itemId}`;
      }

      if (filters?.locationId) {
        whereClause = sql`${whereClause} AND sl.location_id = ${filters.locationId}`;
      }

      if (filters?.lowStock) {
        whereClause = sql`${whereClause} AND sl.current_quantity <= sl.minimum_stock`;
      }

      const result = await db.execute(sql`
        SELECT 
          sl.id,
          sl.tenant_id,
          sl.item_id,
          sl.location_id,
          sl.current_quantity,
          sl.minimum_stock,
          sl.maximum_stock,
          sl.reorder_point,
          sl.safety_stock,
          sl.average_cost,
          sl.last_cost,
          sl.total_value,
          sl.last_movement_date,
          sl.last_count_date,
          sl.created_at,
          sl.updated_at,
          i.title as item_title,
          i.internal_code as item_code,
          loc.name as location_name,
          loc.code as location_code
        FROM ${sql.identifier(schemaName)}.stock_levels sl
        LEFT JOIN ${sql.identifier(schemaName)}.items i ON sl.item_id = i.id
        LEFT JOIN ${sql.identifier(schemaName)}.stock_locations loc ON sl.location_id = loc.id
        ${whereClause}
        ORDER BY sl.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      throw error;
    }
  }

  // ============================================
  // STOCK LOCATIONS MANAGEMENT
  // ============================================
  
  async getStockLocations(tenantId: string, filters?: {
    search?: string;
    parentId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const schemaName = this.getTenantSchema(tenantId);
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    try {
      let whereClause = sql`WHERE loc.tenant_id = ${tenantId}`;

      if (filters?.search) {
        whereClause = sql`${whereClause} AND (loc.name ILIKE ${`%${filters.search}%`} OR loc.code ILIKE ${`%${filters.search}%`})`;
      }

      // Note: parent_location_id column does not exist in current schema
      // if (filters?.parentId) {
      //   whereClause = sql`${whereClause} AND loc.parent_location_id = ${filters.parentId}`;
      // }

      if (filters?.isActive !== undefined) {
        whereClause = sql`${whereClause} AND loc.is_active = ${filters.isActive}`;
      }

      const result = await db.execute(sql`
        SELECT 
          loc.id,
          loc.tenant_id,
          loc.name,
          loc.code,
          loc.description,
          loc.type,
          loc.address,
          loc.coordinates,
          loc.capacity,
          loc.is_active,
          loc.allow_negative_stock,
          loc.requires_approval,
          loc.created_at,
          loc.updated_at,
          loc.created_by,
          loc.updated_by
        FROM ${sql.identifier(schemaName)}.stock_locations loc
        ${whereClause}
        ORDER BY loc.location_path, loc.name
        LIMIT ${limit} OFFSET ${offset}
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching stock locations:', error);
      throw error;
    }
  }
}

export const tenantPartsServicesRepository = new TenantPartsServicesRepository();