import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { pool } from '../../../../db';
import {
  parts,
  inventory,
  stockMovements,
  suppliers,
  supplierCatalog,
  purchaseOrders,
  purchaseOrderItems,
  serviceKits,
  serviceKitItems,
  priceLists,
  priceListItems,
  quotations,
  quotationItems,
  assets,
  assetMaintenanceHistory,
  supplierEvaluations,
  partsAuditLog,
  type InsertPart,
  type Part,
  type InsertInventory,
  type Inventory,
  type InsertStockMovement,
  type StockMovement,
  type InsertSupplier,
  type InsertAsset,
  type Asset,
  type InsertQuotation,
  type Quotation,
  type InsertPriceList,
  type PriceList,
  type InsertSupplierEvaluation,
  type SupplierEvaluation,
  type InsertPartsAuditLog,
  type PartsAuditLog
} from "@shared/schema";
import { PartsServicesRepository } from "../../domain/repositories/PartsServicesRepository";
import {
  type ActivityType,
  type ServiceKit,
  type InsertActivityType,
  type InsertServiceKit,
  type Inventory,
  type Supplier,
  type InsertInventory,
  type InsertSupplier
} from "@shared/schema";

// Pool importado do db.ts centralizado

// Type definitions for compatibility
interface InsertActivityType {
  tenantId: string;
  name: string;
  description?: string;
  category?: string;
  duration?: number;
  color?: string;
  isActive?: boolean;
}

interface ActivityType {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category?: string;
  duration?: number;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertPart {
  title: string;
  partNumber: string;
  costPrice: number;
  salePrice: number;
  category: string;
}

interface Part {
  id: string;
  title: string;
  partNumber: string;
  costPrice: number;
  salePrice: number;
  category: string;
  isActive: boolean;
}

interface InsertInventory {
  tenantId: string;
  partId: string;
  location: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
}

interface Inventory {
  id: string;
  tenantId: string;
  partId: string;
  location: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
}

interface InsertSupplier {
  tenantId: string;
  name: string;
  contactName?: string;
  email: string;
  phone: string;
  address: string;
}

interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactName?: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
}

interface PartsServicesRepository {
  // Basic CRUD methods
  createActivityType(data: InsertActivityType): Promise<ActivityType>;
  findActivityTypes(tenantId: string): Promise<ActivityType[]>;
  findActivityTypeById(id: string, tenantId: string): Promise<ActivityType | null>;
  createPart(tenantId: string, data: InsertPart): Promise<Part>;
  findParts(tenantId: string): Promise<Part[]>;
  createInventory(data: InsertInventory): Promise<Inventory>;
  findInventory(tenantId: string): Promise<Inventory[]>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  findSuppliers(tenantId: string): Promise<Supplier[]>;
  getDashboardStats(tenantId: string): Promise<any>;
  createInventoryEntry(tenantId: string, data: any): Promise<any>;

  // Complete methods for all 11 modules
  findServiceIntegrationsComplete(tenantId: string): Promise<any[]>;
  findTransfersComplete(tenantId: string): Promise<any[]>;
  findAssetsComplete(tenantId: string): Promise<any[]>;
  findPriceListsComplete(tenantId: string): Promise<any[]>;
  findPricingTablesComplete(tenantId: string): Promise<any[]>;
  findAuditLogsComplete(tenantId: string): Promise<any[]>;
  findBudgetSimulationsComplete(tenantId: string): Promise<any[]>;
  findPurchaseOrdersComplete(tenantId: string): Promise<any[]>;

  // Create methods for all modules
  createPurchaseOrderComplete(tenantId: string, data: any): Promise<any>;
  createServiceIntegrationComplete(tenantId: string, data: any): Promise<any>;
  createWorkOrderIntegrationComplete(tenantId: string, data: any): Promise<any>;
  createTransferComplete(tenantId: string, data: any): Promise<any>;
  createReturnComplete(tenantId: string, data: any): Promise<any>;
  createAssetComplete(tenantId: string, data: any): Promise<any>;
  createAssetMaintenanceComplete(tenantId: string, data: any): Promise<any>;
  createAssetMovementComplete(tenantId: string, data: any): Promise<any>;
  createPriceListComplete(tenantId: string, data: any): Promise<any>;
  createPriceListItemComplete(tenantId: string, data: any): Promise<any>;
  createPricingTableComplete(tenantId: string, data: any): Promise<any>;
  createPricingRuleComplete(tenantId: string, data: any): Promise<any>;
  createPriceHistoryComplete(tenantId: string, data: any): Promise<any>;
  createAuditLogComplete(tenantId: string, data: any): Promise<any>;
  createCertificationComplete(tenantId: string, data: any): Promise<any>;
  createComplianceAlertComplete(tenantId: string, data: any): Promise<any>;
  createBudgetSimulationComplete(tenantId: string, data: any): Promise<any>;
  createDashboardConfigComplete(tenantId: string, data: any): Promise<any>;
  createIntegrationApiComplete(tenantId: string, data: any): Promise<any>;
  createOfflineSyncComplete(tenantId: string, data: any): Promise<any>;
}

class DirectPartsServicesRepository implements PartsServicesRepository {
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

  // ===== PARTS =====
  async createPart(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    // Validação de entrada
    if (!data.internal_code || !data.manufacturer_code || !data.title) {
      throw new Error('Campos obrigatórios não preenchidos');
    }

    // Validação de duplicatas por código interno
    try {
      const duplicateCheck = await pool.query(
        `SELECT id FROM ${schema}.parts 
         WHERE tenant_id = $1 AND internal_code = $2 AND is_active = true`,
        [tenantId, data.internal_code]
      );
      
      if (duplicateCheck.rows.length > 0) {
        throw new Error('Já existe uma peça ativa com este código interno');
      }
    } catch (error: any) {
      if (error.message.includes('código interno')) {
        throw error;
      }
      // Log mas não falha por erro de verificação
      console.warn('Error checking for duplicates:', error);
    }

    // Validação de preços
    const costPrice = parseFloat(data.cost_price) || 0;
    const salePrice = parseFloat(data.sale_price) || 0;
    
    if (costPrice < 0 || salePrice < 0) {
      throw new Error('Preços não podem ser negativos');
    }
    
    if (salePrice <= costPrice && salePrice > 0) {
      throw new Error('Preço de venda deve ser maior que o preço de custo');
    }

    // Gerar part_number automaticamente se não fornecido
    const partNumber = data.part_number || `PN-${Date.now()}`;
    
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.parts (
          tenant_id, part_number, internal_code, manufacturer_code, title, description, 
          cost_price, sale_price, margin_percentage, abc_classification,
          weight_kg, material, voltage, power_watts, category, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()) RETURNING *`,
        [
          tenantId,
          partNumber,
          data.internal_code, 
          data.manufacturer_code, 
          data.title, 
          data.description || '',
          costPrice,
          salePrice,
          parseFloat(data.margin_percentage) || 0,
          data.abc_classification || 'B',
          data.weight_kg ? parseFloat(data.weight_kg) : null,
          data.material || null,
          data.voltage || null,
          data.power_watts ? parseFloat(data.power_watts) : null,
          data.category || 'Geral',
          true
        ]
      );
      
      return result.rows[0];
    } catch (error: any) {
      console.error('Error creating part:', error);
      if (error.code === '23505') {
        throw new Error('Código interno já existe');
      }
      throw new Error('Erro ao criar peça');
    }
  }

  async findParts(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `SELECT 
          id,
          tenant_id as "tenantId",
          part_number as "partNumber",
          internal_code,
          manufacturer_code,
          title,
          COALESCE(description, '') as description,
          COALESCE(category, 'Geral') as category,
          COALESCE(cost_price, 0) as cost_price, 
          COALESCE(sale_price, 0) as sale_price,
          COALESCE(margin_percentage, 0) as margin_percentage,
          COALESCE(abc_classification, 'B') as abc_classification,
          weight_kg,
          material,
          voltage,
          power_watts,
          COALESCE(is_active, true) as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
         FROM ${schema}.parts 
         WHERE tenant_id = $1 AND COALESCE(is_active, true) = true 
         ORDER BY title`,
        [tenantId]
      );
      
      return result.rows.map(row => ({
        ...row,
        cost_price: parseFloat(row.cost_price) || 0,
        sale_price: parseFloat(row.sale_price) || 0,
        margin_percentage: parseFloat(row.margin_percentage) || 0,
        weight_kg: row.weight_kg ? parseFloat(row.weight_kg) : null,
        power_watts: row.power_watts ? parseFloat(row.power_watts) : null
      }));
    } catch (error) {
      console.error('Error finding parts:', error);
      return [];
    }
  }

  // ===== INVENTORY =====
  async createInventory(data: InsertInventory): Promise<Inventory> {
    const schema = this.getTenantSchema(data.tenantId);
    const result = await pool.query(
      `INSERT INTO ${schema}.inventory (tenant_id, part_id, location, current_stock, min_stock, max_stock, unit_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.tenantId, data.partId, data.location, data.currentStock, data.minStock, data.maxStock, data.unitCost]
    );
    return result.rows[0];
  }

  async findInventory(tenantId: string): Promise<Inventory[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `SELECT 
          id,
          tenant_id as "tenantId",
          part_id as "partId",
          location,
          current_stock as "currentStock",
          minimum_stock as "minStock",
          maximum_stock as "maxStock",
          COALESCE(unit_cost, 0) as "unitCost",
          created_at as "createdAt",
          updated_at as "updatedAt"
         FROM ${schema}.inventory 
         WHERE tenant_id = $1 
         ORDER BY created_at DESC`,
        [tenantId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error finding inventory:', error);
      return [];
    }
  }

  // ===== SUPPLIERS =====
  async createSupplier(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    // Validação de entrada
    if (!data.supplier_code || !data.name || !data.trade_name || !data.email) {
      throw new Error('Campos obrigatórios não preenchidos');
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Email inválido');
    }

    // Validação de duplicatas por código
    try {
      const duplicateCodeCheck = await pool.query(
        `SELECT id FROM ${schema}.suppliers 
         WHERE tenant_id = $1 AND supplier_code = $2 AND is_active = true`,
        [tenantId, data.supplier_code]
      );
      
      if (duplicateCodeCheck.rows.length > 0) {
        throw new Error('Já existe um fornecedor ativo com este código');
      }

      // Validação de duplicatas por email
      const duplicateEmailCheck = await pool.query(
        `SELECT id FROM ${schema}.suppliers 
         WHERE tenant_id = $1 AND email = $2 AND is_active = true`,
        [tenantId, data.email]
      );
      
      if (duplicateEmailCheck.rows.length > 0) {
        throw new Error('Já existe um fornecedor ativo com este email');
      }
    } catch (error: any) {
      if (error.message.includes('fornecedor ativo')) {
        throw error;
      }
      // Log mas não falha por erro de verificação
      console.warn('Error checking for duplicates:', error);
    }

    // Validação de CNPJ se fornecido
    if (data.document_number) {
      const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
      if (!cnpjRegex.test(data.document_number)) {
        throw new Error('Formato de CNPJ inválido');
      }
    }

    // Validação de lead time
    const leadTimeDays = parseInt(data.lead_time_days) || 7;
    if (leadTimeDays < 1 || leadTimeDays > 365) {
      throw new Error('Prazo de entrega deve estar entre 1 e 365 dias');
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.suppliers (
          tenant_id, supplier_code, name, trade_name, document_number,
          contact_name, email, phone, address, city, state, country, 
          payment_terms, lead_time_days, supplier_type, 
          quality_rating, delivery_rating, price_rating, overall_rating,
          is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW()) RETURNING *`,
        [
          tenantId,
          data.supplier_code,
          data.name,
          data.trade_name,
          data.document_number || '',
          data.contact_name || '',
          data.email,
          data.phone || '',
          data.address || '',
          data.city || '',
          data.state || '',
          data.country || 'Brasil',
          data.payment_terms || 'A vista',
          leadTimeDays,
          data.supplier_type || 'regular',
          4.0, // Rating padrão
          4.0,
          4.0,
          4.0,
          true
        ]
      );
      
      return result.rows[0];
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      if (error.code === '23505') {
        throw new Error('Código ou email do fornecedor já existe');
      }
      throw new Error('Erro ao criar fornecedor');
    }
  }

  async findSuppliers(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `SELECT 
          id,
          tenant_id as "tenantId",
          supplier_code,
          name,
          trade_name,
          document_number,
          contact_name,
          email,
          COALESCE(phone, '') as phone,
          COALESCE(address, '') as address,
          city,
          state,
          COALESCE(country, 'Brasil') as country,
          payment_terms,
          COALESCE(lead_time_days, 7) as lead_time_days,
          COALESCE(supplier_type, 'regular') as supplier_type,
          COALESCE(quality_rating, 4.0) as quality_rating,
          COALESCE(delivery_rating, 4.0) as delivery_rating,
          COALESCE(price_rating, 4.0) as price_rating,
          COALESCE(overall_rating, 4.0) as overall_rating,
          COALESCE(is_active, true) as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
         FROM ${schema}.suppliers
         WHERE tenant_id = $1 AND COALESCE(is_active, true) = true 
         ORDER BY name`,
        [tenantId]
      );
      
      return result.rows.map(row => ({
        ...row,
        quality_rating: parseFloat(row.quality_rating) || 0,
        delivery_rating: parseFloat(row.delivery_rating) || 0,
        price_rating: parseFloat(row.price_rating) || 0,
        overall_rating: parseFloat(row.overall_rating) || 0,
        lead_time_days: parseInt(row.lead_time_days) || 7
      }));
    } catch (error) {
      console.error('Error finding suppliers:', error);
      return [];
    }
  }

  // =====================================================
  // MÉTODOS COMPLETE PARA TODOS OS 11 MÓDULOS
  // =====================================================

  // Módulo 5: Integração com Serviços
  async findServiceIntegrationsComplete(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `SELECT * FROM ${schema}.service_integrations WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.log('Service integrations table might not exist yet, returning empty array');
      return [];
    }
  }

  // Módulo 6: Logística
  async findTransfersComplete(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `SELECT * FROM ${schema}.transfers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.log('Transfers table might not exist yet, returning empty array');
      return [];
    }
  }

  // Módulo 7: Controle de Ativos
  async findAssetsComplete(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `SELECT * FROM ${schema}.assets WHERE tenant_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 50`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.log('Assets table might not exist yet, returning empty array');
      return [];
    }
  }

  // Módulo 8: Lista de Preços (LPU)
  async findPriceListsComplete(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `SELECT * FROM ${schema}.price_lists WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.log('Price lists table might not exist yet, returning empty array');
      return [];
    }
  }

  // Módulo 9: Funcionalidades Avançadas de Preço
  async findPricingTablesComplete(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `SELECT * FROM ${schema}.pricing_tables WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.log('Pricing tables table might not exist yet, returning empty array');
      return [];
    }
  }

  // Módulo 10: Compliance e Auditoria
  async findAuditLogsComplete(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `SELECT * FROM ${schema}.audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.log('Audit logs table might not exist yet, returning empty array');
      return [];
    }
  }

  // Módulo 11: Diferenciais Avançados
  async findBudgetSimulationsComplete(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `SELECT * FROM ${schema}.budget_simulations WHERE tenant_id = $1 ORDER BY simulation_date DESC LIMIT 50`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.log('Budget simulations table might not exist yet, returning empty array');
      return [];
    }
  }

  // =====================================================
  // MÉTODOS COMPLETE OBRIGATÓRIOS PARA O CONTROLLER
  // =====================================================

  // MÓDULO 4: Purchase Orders
  async findPurchaseOrdersComplete(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `SELECT * FROM ${schema}.purchase_orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.log('Purchase orders table might not exist yet, returning empty array');
      return [];
    }
  }

  async createPurchaseOrderComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.purchase_orders (tenant_id, po_number, supplier_id, status, total_amount)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.poNumber || 'PO-' + Date.now(), data.supplierId, data.status || 'draft', data.totalAmount || 0]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Purchase order creation failed:', error);
      return null;
    }
  }

  // MÓDULO 5: Service Integrations
  async createServiceIntegrationComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.service_integrations (tenant_id, service_name, service_type, endpoint_url, authentication_type, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [tenantId, data.serviceName || 'Serviço ' + Date.now(), data.serviceType || 'API', data.endpointUrl, data.authType || 'API_KEY', data.status || 'active', data.createdBy]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Service integration creation failed:', error);
      return null;
    }
  }

  async createWorkOrderIntegrationComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.work_order_integrations (tenant_id, work_order_id, integration_id, sync_status)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [tenantId, data.workOrderId, data.integrationId, data.syncStatus || 'pending']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Work order integration creation failed:', error);
      return null;
    }
  }

  // MÓDULO 6: Logistics
  async createTransferComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.transfers (tenant_id, transfer_number, transfer_type, from_location, to_location, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.transferNumber || 'TRF-' + Date.now(), data.transferType || 'internal', data.fromLocation, data.toLocation, data.status || 'pending']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Transfer creation failed:', error);
      return null;
    }
  }

  async createReturnComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.returns (tenant_id, return_number, reason, status, requested_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.returnNumber || 'RET-' + Date.now(), data.reason, data.status || 'pending', data.requestedBy]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Return creation failed:', error);
      return null;
    }
  }

  // MÓDULO 7: Assets
  async createAssetComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.assets (tenant_id, asset_number, name, description, asset_type, manufacturer, model, serial_number, location, status, value)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [tenantId, data.asset_number || 'AST-' + Date.now(), data.name, data.description, data.asset_type, data.manufacturer, data.model, data.serial_number, data.location, data.status || 'operational', data.value || 0]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Asset creation failed:', error);
      return null;
    }
  }

  async createAssetMaintenanceComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.asset_maintenance (tenant_id, asset_id, maintenance_type, scheduled_date, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.assetId, data.maintenanceType || 'preventive', data.scheduledDate, data.status || 'scheduled']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Asset maintenance creation failed:', error);
      return null;
    }
  }

  async createAssetMovementComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.asset_movements (tenant_id, asset_id, from_location, to_location, movement_date, reason)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.assetId, data.fromLocation, data.toLocation, data.movementDate || new Date(), data.reason]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Asset movement creation failed:', error);
      return null;
    }
  }

  // MÓDULO 8: Price Lists
  async createPriceListComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.price_lists (tenant_id, name, version, valid_from, valid_until, customer_type, region, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [tenantId, data.name, data.version || '1.0', data.validFrom || new Date(), data.validUntil, data.customerType, data.region, data.createdBy]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Price list creation failed:', error);
      return null;
    }
  }

  async createPriceListItemComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.price_list_items (tenant_id, price_list_id, item_code, description, unit_price)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.priceListId, data.itemCode, data.description, data.unitPrice]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Price list item creation failed:', error);
      return null;
    }
  }

  // MÓDULO 9: Pricing Tables
  async createPricingTableComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.pricing_tables (tenant_id, name, table_type, rules, is_active)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.name, data.tableType || 'standard', JSON.stringify(data.rules || {}), data.isActive !== false]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Pricing table creation failed:', error);
      return null;
    }
  }

  async createPricingRuleComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.pricing_rules (tenant_id, rule_name, condition, action, priority)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.ruleName, JSON.stringify(data.condition || {}), JSON.stringify(data.action || {}), data.priority || 1]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Pricing rule creation failed:', error);
      return null;
    }
  }

  async createPriceHistoryComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.price_history (tenant_id, item_id, old_price, new_price, change_reason, changed_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.itemId, data.oldPrice, data.newPrice, data.changeReason, data.changedBy]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Price history creation failed:', error);
      return null;
    }
  }

  // MÓDULO 10: Compliance
  async createAuditLogComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.audit_logs (tenant_id, action, table_name, record_id, user_id, changes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.action, data.tableName, data.recordId, data.userId, JSON.stringify(data.changes || {})]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Audit log creation failed:', error);
      return null;
    }
  }

  async createCertificationComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.certifications (tenant_id, name, issuer, valid_from, valid_until, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.name, data.issuer, data.validFrom, data.validUntil, data.status || 'active']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Certification creation failed:', error);
      return null;
    }
  }

  async createComplianceAlertComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.compliance_alerts (tenant_id, alert_type, severity, message, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.alertType, data.severity || 'medium', data.message, data.status || 'active']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Compliance alert creation failed:', error);
      return null;
    }
  }

  // MÓDULO 11: Budget Simulations
  async createBudgetSimulationComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.budget_simulations (tenant_id, simulation_name, total_budget, status, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.simulationName, data.totalBudget || 0, data.status || 'draft', data.createdBy]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Budget simulation creation failed:', error);
      return null;
    }
  }

  async createDashboardConfigComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.dashboard_configs (tenant_id, config_name, layout_config, user_id, is_default)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.configName, JSON.stringify(data.layoutConfig || {}), data.userId, data.isDefault || false]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Dashboard config creation failed:', error);
      return null;
    }
  }

  async createIntegrationApiComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.integration_apis (tenant_id, name, endpoint, method, auth_type, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.name, data.endpoint, data.method || 'POST', data.authType || 'API_KEY', data.isActive !== false]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Integration API creation failed:', error);
      return null;
    }
  }

  async createOfflineSyncComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.offline_sync (tenant_id, user_id, table_name, record_id, action, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.userId, data.tableName, data.recordId, data.action, data.status || 'pending']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Offline sync creation failed:', error);
      return null;
    }
  }

  // =====================================================
  // TODOS OS MÉTODOS COMPLETE PARA OS 11 MÓDULOS
  // =====================================================

  // MÓDULO 5: Integração com Serviços (Service Integrations)
  async createServiceIntegration(tenantId: string, data: any): Promise<any> {
    return this.createServiceIntegrationComplete(tenantId, data);
  }

  async createWorkOrderIntegration(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.work_order_integrations (tenant_id, work_order_id, integration_id, sync_status)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [tenantId, data.workOrderId, data.integrationId, data.syncStatus || 'pending']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Work order integration creation failed:', error);
      return null;
    }
  }

  // MÓDULO 6: Logística (Transfers & Returns)
  async createTransfer(tenantId: string, data: any): Promise<any> {
    return this.createTransferComplete(tenantId, data);
  }

  async createTransferComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.transfers (tenant_id, transfer_number, transfer_type, from_location, to_location, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.transferNumber || 'TRF-' + Date.now(), data.transferType || 'internal', data.fromLocation, data.toLocation, data.status || 'pending']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Transfer creation failed:', error);
      return null;
    }
  }

  async createReturn(tenantId: string, data: any): Promise<any> {
    return this.createReturnComplete(tenantId, data);
  }

  async createReturnComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.returns (tenant_id, return_number, reason, status, requested_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.returnNumber || 'RET-' + Date.now(), data.reason, data.status || 'pending', data.requestedBy]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Return creation failed:', error);
      return null;
    }
  }

  // MÓDULO 7: Controle de Ativos (Assets)
  async createAssetMaintenance(tenantId: string, data: any): Promise<any> {
    return this.createAssetMaintenanceComplete(tenantId, data);
  }

  async createAssetMaintenanceComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.asset_maintenance (tenant_id, asset_id, maintenance_type, scheduled_date, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.assetId, data.maintenanceType || 'preventive', data.scheduledDate, data.status || 'scheduled']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Asset maintenance creation failed:', error);
      return null;
    }
  }

  async createAssetMovement(tenantId: string, data: any): Promise<any> {
    return this.createAssetMovementComplete(tenantId, data);
  }

  async createAssetMovementComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.asset_movements (tenant_id, asset_id, from_location, to_location, movement_date, reason)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.assetId, data.fromLocation, data.toLocation, data.movementDate || new Date(), data.reason]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Asset movement creation failed:', error);
      return null;
    }
  }

  // MÓDULO 8: Lista de Preços (LPU)
  async createPriceListItem(tenantId: string, data: any): Promise<any> {
    return this.createPriceListItemComplete(tenantId, data);
  }

  async createPriceListItemComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.price_list_items (tenant_id, price_list_id, item_code, description, unit_price)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.priceListId, data.itemCode, data.description, data.unitPrice]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Price list item creation failed:', error);
      return null;
    }
  }

  // MÓDULO 9: Funcionalidades Avançadas de Preço
  async createPricingTable(tenantId: string, data: any): Promise<any> {
    return this.createPricingTableComplete(tenantId, data);
  }

  async createPricingTableComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.pricing_tables (tenant_id, name, table_type, rules, is_active)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.name, data.tableType || 'standard', JSON.stringify(data.rules || {}), data.isActive !== false]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Pricing table creation failed:', error);
      return null;
    }
  }

  async createPricingRule(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.pricing_rules (tenant_id, rule_name, condition, action, priority)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.ruleName, JSON.stringify(data.condition || {}), JSON.stringify(data.action || {}), data.priority || 1]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Pricing rule creation failed:', error);
      return null;
    }
  }

  async createPriceHistory(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.price_history (tenant_id, item_id, old_price, new_price, change_reason, changed_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.itemId, data.oldPrice, data.newPrice, data.changeReason, data.changedBy]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Price history creation failed:', error);
      return null;
    }
  }

  // MÓDULO 10: Compliance e Auditoria  
  async createAuditLog(tenantId: string, data: any): Promise<any> {
    return this.createAuditLogComplete(tenantId, data);
  }

  async createAuditLogComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.audit_logs (tenant_id, action, table_name, record_id, user_id, changes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.action, data.tableName, data.recordId, data.userId, JSON.stringify(data.changes || {})]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Audit log creation failed:', error);
      return null;
    }
  }

  async createCertification(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.certifications (tenant_id, name, issuer, valid_from, valid_until, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.name, data.issuer, data.validFrom, data.validUntil, data.status || 'active']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Certification creation failed:', error);
      return null;
    }
  }

  async createComplianceAlert(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.compliance_alerts (tenant_id, alert_type, severity, message, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.alertType, data.severity || 'medium', data.message, data.status || 'active']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Compliance alert creation failed:', error);
      return null;
    }
  }

  // MÓDULO 11: Diferenciais Avançados
  async createBudgetSimulation(tenantId: string, data: any): Promise<any> {
    return this.createBudgetSimulationComplete(tenantId, data);
  }

  async createBudgetSimulationComplete(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.budget_simulations (tenant_id, simulation_name, total_budget, status, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.simulationName, data.totalBudget || 0, data.status || 'draft', data.createdBy]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Budget simulation creation failed:', error);
      return null;
    }
  }

  async createDashboardConfig(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.dashboard_configs (tenant_id, config_name, layout_config, user_id, is_default)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, data.configName, JSON.stringify(data.layoutConfig || {}), data.userId, data.isDefault || false]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Dashboard config creation failed:', error);
      return null;
    }
  }

  async createIntegrationApi(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.integration_apis (tenant_id, name, endpoint, method, auth_type, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.name, data.endpoint, data.method || 'POST', data.authType || 'API_KEY', data.isActive !== false]
      );
      return result.rows[0];
    } catch (error) {
      console.log('Integration API creation failed:', error);
      return null;
    }
  }

  async createOfflineSync(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.offline_sync (tenant_id, user_id, table_name, record_id, action, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tenantId, data.userId, data.tableName, data.recordId, data.action, data.status || 'pending']
      );
      return result.rows[0];
    } catch (error) {
      console.log('Offline sync creation failed:', error);
      return null;
    }
  }

  // ===== CRUD METHODS FOR PARTS =====
  async updatePart(id: string, tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `UPDATE ${schema}.parts SET 
          internal_code = $3,
          manufacturer_code = $4,
          title = $5,
          description = $6,
          cost_price = $7,
          sale_price = $8,
          margin_percentage = $9,
          abc_classification = $10,
          weight_kg = $11,
          material = $12,
          voltage = $13,
          power_watts = $14,
          category = $15,
          updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND is_active = true
         RETURNING *`,
        [
          id, tenantId, data.internal_code, data.manufacturer_code, data.title,
          data.description, parseFloat(data.cost_price) || 0, parseFloat(data.sale_price) || 0,
          parseFloat(data.margin_percentage) || 0, data.abc_classification || 'B',
          data.weight_kg ? parseFloat(data.weight_kg) : null, data.material,
          data.voltage, data.power_watts ? parseFloat(data.power_watts) : null,
          data.category || 'Geral'
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating part:', error);
      throw new Error('Erro ao atualizar peça');
    }
  }

  async deletePart(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `UPDATE ${schema}.parts SET is_active = false, updated_at = NOW() 
         WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting part:', error);
      return false;
    }
  }

  // ===== CRUD METHODS FOR SUPPLIERS =====
  async updateSupplier(id: string, tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `UPDATE ${schema}.suppliers SET 
          supplier_code = $3,
          name = $4,
          trade_name = $5,
          document_number = $6,
          contact_name = $7,
          email = $8,
          phone = $9,
          address = $10,
          city = $11,
          state = $12,
          country = $13,
          payment_terms = $14,
          lead_time_days = $15,
          supplier_type = $16,
          updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND is_active = true
         RETURNING *`,
        [
          id, tenantId, data.supplier_code, data.name, data.trade_name,
          data.document_number, data.contact_name, data.email, data.phone,
          data.address, data.city, data.state, data.country || 'Brasil',
          data.payment_terms, parseInt(data.lead_time_days) || 7, data.supplier_type || 'regular'
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw new Error('Erro ao atualizar fornecedor');
    }
  }

  async deleteSupplier(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `UPDATE ${schema}.suppliers SET is_active = false, updated_at = NOW() 
         WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return false;
    }
  }

  // ===== CRUD METHODS FOR INVENTORY =====
  async updateInventory(id: string, tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `UPDATE ${schema}.inventory SET 
          location = $3,
          current_stock = $4,
          minimum_stock = $5,
          maximum_stock = $6,
          unit_cost = $7,
          updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [
          id, tenantId, data.location, parseInt(data.currentStock) || 0,
          parseInt(data.minStock) || 0, parseInt(data.maxStock) || 0,
          parseFloat(data.unitCost) || 0
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw new Error('Erro ao atualizar estoque');
    }
  }

  async deleteInventory(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `DELETE FROM ${schema}.inventory WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting inventory:', error);
      return false;
    }
  }

  async createInventoryEntry(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `INSERT INTO ${schema}.inventory (
          tenant_id, part_id, location, current_stock, minimum_stock, maximum_stock, 
          unit_cost, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
        [
          tenantId, data.partId, data.location || 'Estoque Principal',
          parseInt(data.currentStock) || 0, parseInt(data.minStock) || 5,
          parseInt(data.maxStock) || 100, parseFloat(data.unitCost) || 0
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating inventory entry:', error);
      throw new Error('Erro ao criar entrada de estoque');
    }
  }

  // ===== DASHBOARD STATS =====
  async getDashboardStats(tenantId: string): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      // Verificar se as tabelas existem antes de consultar
      const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name IN ('parts', 'suppliers', 'inventory', 'purchase_orders', 'budget_simulations')
      `;
      
      const tablesResult = await pool.query(tableCheckQuery, [schema]);
      const existingTables = tablesResult.rows.map(row => row.table_name);
      
      const stats = {
        totalParts: 0,
        totalSuppliers: 0,
        totalInventory: 0,
        totalOrders: 0,
        totalSimulations: 0,
        totalStockValue: 0,
        lastUpdated: new Date().toISOString()
      };

      // Get parts count com tratamento de erro
      if (existingTables.includes('parts')) {
        try {
          const partsResult = await pool.query(
            `SELECT COUNT(*) as count FROM ${schema}.parts WHERE tenant_id = $1 AND is_active = true`,
            [tenantId]
          );
          stats.totalParts = parseInt(partsResult.rows[0]?.count || 0);
        } catch (error) {
          console.error('Error counting parts:', error);
        }
      }

      // Get suppliers count com tratamento de erro
      if (existingTables.includes('suppliers')) {
        try {
          const suppliersResult = await pool.query(
            `SELECT COUNT(*) as count FROM ${schema}.suppliers WHERE tenant_id = $1 AND is_active = true`,
            [tenantId]
          );
          stats.totalSuppliers = parseInt(suppliersResult.rows[0]?.count || 0);
        } catch (error) {
          console.error('Error counting suppliers:', error);
        }
      }

      // Get inventory count com tratamento de erro
      if (existingTables.includes('inventory')) {
        try {
          const inventoryResult = await pool.query(
            `SELECT COUNT(*) as count FROM ${schema}.inventory WHERE tenant_id = $1`,
            [tenantId]
          );
          stats.totalInventory = parseInt(inventoryResult.rows[0]?.count || 0);
          
          // Calculate total stock value
          const stockValueResult = await pool.query(
            `SELECT COALESCE(SUM(current_stock * unit_cost), 0) as total_value 
             FROM ${schema}.inventory WHERE tenant_id = $1`,
            [tenantId]
          );
          stats.totalStockValue = parseFloat(stockValueResult.rows[0]?.total_value || 0);
        } catch (error) {
          console.error('Error calculating inventory stats:', error);
        }
      }

      // Get purchase orders count com tratamento de erro
      if (existingTables.includes('purchase_orders')) {
        try {
          const ordersResult = await pool.query(
            `SELECT COUNT(*) as count FROM ${schema}.purchase_orders WHERE tenant_id = $1`,
            [tenantId]
          );
          stats.totalOrders = parseInt(ordersResult.rows[0]?.count || 0);
        } catch (error) {
          console.error('Error counting purchase orders:', error);
        }
      }

      // Get simulations count com tratamento de erro
      if (existingTables.includes('budget_simulations')) {
        try {
          const simulationsResult = await pool.query(
            `SELECT COUNT(*) as count FROM ${schema}.budget_simulations WHERE tenant_id = $1`,
            [tenantId]
          );
          stats.totalSimulations = parseInt(simulationsResult.rows[0]?.count || 0);
        } catch (error) {
          console.error('Error counting budget simulations:', error);
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new Error('Erro ao obter estatísticas do dashboard');
    }
  }

  async createInventoryEntry(tenantId: string, data: any): Promise<any> {
    return this.createInventory({ tenantId, ...data });
  }

  // Métodos adicionais para compatibilidade
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

  // ===== CRUD METHODS FOR PARTS =====
  async updatePart(id: string, tenantId: string, data: any): Promise<any | null> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      // Validar se a peça existe
      const existingPart = await pool.query(
        `SELECT id FROM ${schema}.parts WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );

      if (existingPart.rows.length === 0) {
        return null;
      }

      // Construir query dinamicamente baseada nos campos fornecidos
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (data.title) {
        updateFields.push(`title = $${paramIndex++}`);
        values.push(data.title);
      }
      if (data.internal_code) {
        updateFields.push(`internal_code = $${paramIndex++}`);
        values.push(data.internal_code);
      }
      if (data.manufacturer_code) {
        updateFields.push(`manufacturer_code = $${paramIndex++}`);
        values.push(data.manufacturer_code);
      }
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.cost_price !== undefined) {
        updateFields.push(`cost_price = $${paramIndex++}`);
        values.push(parseFloat(data.cost_price));
      }
      if (data.sale_price !== undefined) {
        updateFields.push(`sale_price = $${paramIndex++}`);
        values.push(parseFloat(data.sale_price));
      }
      if (data.margin_percentage !== undefined) {
        updateFields.push(`margin_percentage = $${paramIndex++}`);
        values.push(parseFloat(data.margin_percentage));
      }
      if (data.abc_classification) {
        updateFields.push(`abc_classification = $${paramIndex++}`);
        values.push(data.abc_classification);
      }
      if (data.category) {
        updateFields.push(`category = $${paramIndex++}`);
        values.push(data.category);
      }

      if (updateFields.length === 0) {
        return existingPart.rows[0];
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(id, tenantId);

      const query = `
        UPDATE ${schema}.parts 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating part:', error);
      throw new Error('Erro ao atualizar peça');
    }
  }

  async deletePart(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.parts SET is_active = false WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount > 0;
  }

  // ===== CRUD METHODS FOR SUPPLIERS =====
  async updateSupplier(id: string, tenantId: string, data: any): Promise<any | null> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      // Validar se o fornecedor existe
      const existingSupplier = await pool.query(
        `SELECT id FROM ${schema}.suppliers WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );

      if (existingSupplier.rows.length === 0) {
        return null;
      }

      // Construir query dinamicamente
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (data.name) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.trade_name) {
        updateFields.push(`trade_name = $${paramIndex++}`);
        values.push(data.trade_name);
      }
      if (data.contact_name !== undefined) {
        updateFields.push(`contact_name = $${paramIndex++}`);
        values.push(data.contact_name);
      }
      if (data.email) {
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new Error('Email inválido');
        }
        updateFields.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      if (data.phone !== undefined) {
        updateFields.push(`phone = $${paramIndex++}`);
        values.push(data.phone);
      }
      if (data.address !== undefined) {
        updateFields.push(`address = $${paramIndex++}`);
        values.push(data.address);
      }
      if (data.city !== undefined) {
        updateFields.push(`city = $${paramIndex++}`);
        values.push(data.city);
      }
      if (data.state !== undefined) {
        updateFields.push(`state = $${paramIndex++}`);
        values.push(data.state);
      }
      if (data.payment_terms !== undefined) {
        updateFields.push(`payment_terms = $${paramIndex++}`);
        values.push(data.payment_terms);
      }
      if (data.lead_time_days !== undefined) {
        updateFields.push(`lead_time_days = $${paramIndex++}`);
        values.push(parseInt(data.lead_time_days));
      }
      if (data.supplier_type) {
        updateFields.push(`supplier_type = $${paramIndex++}`);
        values.push(data.supplier_type);
      }

      if (updateFields.length === 0) {
        return existingSupplier.rows[0];
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(id, tenantId);

      const query = `
        UPDATE ${schema}.suppliers 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw new Error('Erro ao atualizar fornecedor');
    }
  }

  async deleteSupplier(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.suppliers SET is_active = false WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount > 0;
  }

  // ===== CRUD METHODS FOR INVENTORY =====
  async updateInventory(id: string, tenantId: string, data: Partial<InsertInventory>): Promise<Inventory | null> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `UPDATE ${schema}.inventory SET 
       location = COALESCE($1, location),
       current_stock = COALESCE($2, current_stock),
       min_stock = COALESCE($3, min_stock),
       max_stock = COALESCE($4, max_stock),
       unit_cost = COALESCE($5, unit_cost),
       updated_at = NOW()
       WHERE id = $6 AND tenant_id = $7 RETURNING *`,
      [data.location, data.currentStock, data.minStock, data.maxStock, data.unitCost, id, tenantId]
    );
    return result.rows[0] || null;
  }

  async deleteInventory(id: string, tenantId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    const result = await pool.query(
      `DELETE FROM ${schema}.inventory WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount > 0;
  }
}

export { DirectPartsServicesRepository };