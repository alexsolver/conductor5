
// ETAPA 6: MÓDULOS ENTERPRISE AVANÇADOS - REPOSITORY
import { eq, and, desc, asc, gte, lte, isNull, isNotNull, inArray, sql } from 'drizzle-orm';
import { db } from '../../../../db';

// Schema imports for Etapa 6
interface AssetEnterprise {
  id: string;
  tenantId: string;
  assetNumber: string;
  name: string;
  description?: string;
  parentAssetId?: string;
  assetLevel: number;
  category: string;
  subcategory?: string;
  assetType?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  manufacturingDate?: Date;
  currentLocationId?: string;
  coordinates?: any;
  status: string;
  conditionRating: string;
  acquisitionCost?: number;
  currentValue?: number;
  operatingHours: number;
  kilometers: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  qrCode?: string;
  rfidTag?: string;
  assignedTo?: string;
  custodian?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

interface PriceListEnterprise {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  version: string;
  previousVersionId?: string;
  isCurrentVersion: boolean;
  customerId?: string;
  contractId?: string;
  validFrom: Date;
  validTo?: Date;
  reviewPeriod?: string;
  nextReviewDate?: Date;
  status: string;
  approvalWorkflow?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

interface AuditTrailEnterprise {
  id: string;
  tenantId: string;
  tableName: string;
  recordId: string;
  action: string;
  oldValues?: any;
  newValues?: any;
  changedFields?: string[];
  userId: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  sensitivityLevel: string;
  requiresRetention: boolean;
  complianceTags?: string[];
  timestamp: Date;
}

interface ComplianceAlert {
  id: string;
  tenantId: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  complianceDomain?: string;
  impactAssessment?: string;
  recommendedActions?: string[];
  alertDate: Date;
  dueDate?: Date;
  assignedTo?: string;
  status: string;
  resolutionNotes?: string;
  resolvedDate?: Date;
  resolvedBy?: string;
  createdAt: Date;
  createdBy?: string;
}

interface MobileDevice {
  id: string;
  tenantId: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  lastKnownLocation?: any;
  connectivityStatus: string;
  permissions?: any;
  allowedModules?: string[];
  isActive: boolean;
  lastSeen: Date;
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PartsServicesRepositoryEtapa6 {
  // ===== CONTROLE DE ATIVOS ENTERPRISE =====
  
  async getAssetsEnterprise(tenantId: string): Promise<{ success: boolean; data?: AssetEnterprise[]; error?: string }> {
    try {
      const assets = await db.execute(sql`
        SELECT 
          id, tenant_id as "tenantId", asset_number as "assetNumber", name, description,
          parent_asset_id as "parentAssetId", asset_level as "assetLevel", category, subcategory,
          asset_type as "assetType", brand, model, serial_number as "serialNumber",
          manufacturing_date as "manufacturingDate", current_location_id as "currentLocationId",
          coordinates, status, condition_rating as "conditionRating",
          acquisition_cost as "acquisitionCost", current_value as "currentValue",
          operating_hours as "operatingHours", kilometers,
          last_maintenance_date as "lastMaintenanceDate", next_maintenance_date as "nextMaintenanceDate",
          qr_code as "qrCode", rfid_tag as "rfidTag", assigned_to as "assignedTo", custodian,
          is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
        FROM assets_enterprise 
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY created_at DESC
      `);

      return { success: true, data: assets.rows as AssetEnterprise[] };
    } catch (error) {
      console.error('Error fetching assets enterprise:', error);
      return { success: false, error: 'Erro ao buscar ativos' };
    }
  }

  async createAssetEnterprise(tenantId: string, assetData: Partial<AssetEnterprise>): Promise<{ success: boolean; data?: AssetEnterprise; error?: string }> {
    try {
      const result = await db.execute(sql`
        INSERT INTO assets_enterprise (
          tenant_id, asset_number, name, description, category, subcategory,
          asset_type, brand, model, serial_number, manufacturing_date,
          current_location_id, status, condition_rating, acquisition_cost,
          current_value, assigned_to, custodian, created_by
        ) VALUES (
          ${tenantId}, ${assetData.assetNumber}, ${assetData.name}, ${assetData.description},
          ${assetData.category}, ${assetData.subcategory}, ${assetData.assetType},
          ${assetData.brand}, ${assetData.model}, ${assetData.serialNumber},
          ${assetData.manufacturingDate}, ${assetData.currentLocationId}, ${assetData.status || 'active'},
          ${assetData.conditionRating || 'good'}, ${assetData.acquisitionCost},
          ${assetData.currentValue}, ${assetData.assignedTo}, ${assetData.custodian}, ${assetData.createdBy}
        )
        RETURNING *
      `);

      return { success: true, data: result.rows[0] as AssetEnterprise };
    } catch (error) {
      console.error('Error creating asset enterprise:', error);
      return { success: false, error: 'Erro ao criar ativo' };
    }
  }

  async getAssetMaintenanceHistory(tenantId: string, assetId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const history = await db.execute(sql`
        SELECT 
          id, asset_id as "assetId", maintenance_type as "maintenanceType",
          scheduled_date as "scheduledDate", start_date as "startDate", 
          completed_date as "completedDate", description, work_performed as "workPerformed",
          technician_id as "technicianId", labor_hours as "laborHours",
          labor_cost as "laborCost", parts_cost as "partsCost", total_cost as "totalCost",
          status, created_at as "createdAt"
        FROM asset_maintenance_history 
        WHERE tenant_id = ${tenantId} AND asset_id = ${assetId}
        ORDER BY created_at DESC
      `);

      return { success: true, data: history.rows };
    } catch (error) {
      console.error('Error fetching asset maintenance history:', error);
      return { success: false, error: 'Erro ao buscar histórico de manutenção' };
    }
  }

  // ===== LPU ENTERPRISE COM VERSIONAMENTO =====
  
  async getPriceListsEnterprise(tenantId: string): Promise<{ success: boolean; data?: PriceListEnterprise[]; error?: string }> {
    try {
      const priceLists = await db.execute(sql`
        SELECT 
          id, tenant_id as "tenantId", code, name, description, version,
          previous_version_id as "previousVersionId", is_current_version as "isCurrentVersion",
          customer_id as "customerId", contract_id as "contractId",
          valid_from as "validFrom", valid_to as "validTo", review_period as "reviewPeriod",
          next_review_date as "nextReviewDate", status, approval_workflow as "approvalWorkflow",
          is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt",
          created_by as "createdBy", approved_by as "approvedBy", approved_at as "approvedAt"
        FROM price_lists_enterprise 
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY created_at DESC
      `);

      return { success: true, data: priceLists.rows as PriceListEnterprise[] };
    } catch (error) {
      console.error('Error fetching price lists enterprise:', error);
      return { success: false, error: 'Erro ao buscar listas de preços' };
    }
  }

  async createPriceListEnterprise(tenantId: string, priceListData: Partial<PriceListEnterprise>): Promise<{ success: boolean; data?: PriceListEnterprise; error?: string }> {
    try {
      const result = await db.execute(sql`
        INSERT INTO price_lists_enterprise (
          tenant_id, code, name, description, version, customer_id, contract_id,
          valid_from, valid_to, review_period, next_review_date, status, created_by
        ) VALUES (
          ${tenantId}, ${priceListData.code}, ${priceListData.name}, ${priceListData.description},
          ${priceListData.version || '1.0'}, ${priceListData.customerId}, ${priceListData.contractId},
          ${priceListData.validFrom}, ${priceListData.validTo}, ${priceListData.reviewPeriod},
          ${priceListData.nextReviewDate}, ${priceListData.status || 'draft'}, ${priceListData.createdBy}
        )
        RETURNING *
      `);

      return { success: true, data: result.rows[0] as PriceListEnterprise };
    } catch (error) {
      console.error('Error creating price list enterprise:', error);
      return { success: false, error: 'Erro ao criar lista de preços' };
    }
  }

  async getPriceListItems(tenantId: string, priceListId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const items = await db.execute(sql`
        SELECT 
          id, price_list_id as "priceListId", item_type as "itemType", item_id as "itemId",
          item_code as "itemCode", item_description as "itemDescription",
          base_price as "basePrice", currency, usd_price as "usdPrice", eur_price as "eurPrice",
          unit, minimum_quantity as "minimumQuantity", cost_price as "costPrice",
          margin_percentage as "marginPercentage", markup_percentage as "markupPercentage",
          quantity_discounts as "quantityDiscounts", notes, technical_specs as "technicalSpecs",
          is_active as "isActive", created_at as "createdAt"
        FROM price_list_items_enterprise 
        WHERE tenant_id = ${tenantId} AND price_list_id = ${priceListId} AND is_active = true
        ORDER BY item_description ASC
      `);

      return { success: true, data: items.rows };
    } catch (error) {
      console.error('Error fetching price list items:', error);
      return { success: false, error: 'Erro ao buscar itens da lista de preços' };
    }
  }

  // ===== MOTOR DE PREÇOS AVANÇADO =====
  
  async getPricingRulesEngine(tenantId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const rules = await db.execute(sql`
        SELECT 
          id, rule_name as "ruleName", rule_type as "ruleType", priority,
          conditions, action_type as "actionType", action_value as "actionValue",
          max_discount_percentage as "maxDiscountPercentage", valid_from as "validFrom",
          valid_to as "validTo", applies_to_item_types as "appliesToItemTypes",
          applies_to_customers as "appliesToCustomers", is_active as "isActive",
          created_at as "createdAt"
        FROM pricing_rules_engine 
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY priority ASC, created_at DESC
      `);

      return { success: true, data: rules.rows };
    } catch (error) {
      console.error('Error fetching pricing rules engine:', error);
      return { success: false, error: 'Erro ao buscar regras de preços' };
    }
  }

  async createPriceSimulation(tenantId: string, simulationData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await db.execute(sql`
        INSERT INTO price_simulations (
          tenant_id, simulation_name, description, customer_id, price_list_id, currency,
          scenario_data, applied_rules, original_total, discounted_total, total_discount,
          discount_percentage, status, created_by
        ) VALUES (
          ${tenantId}, ${simulationData.simulationName}, ${simulationData.description},
          ${simulationData.customerId}, ${simulationData.priceListId}, ${simulationData.currency || 'BRL'},
          ${JSON.stringify(simulationData.scenarioData)}, ${JSON.stringify(simulationData.appliedRules)},
          ${simulationData.originalTotal}, ${simulationData.discountedTotal}, ${simulationData.totalDiscount},
          ${simulationData.discountPercentage}, ${simulationData.status || 'draft'}, ${simulationData.createdBy}
        )
        RETURNING *
      `);

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error creating price simulation:', error);
      return { success: false, error: 'Erro ao criar simulação de preços' };
    }
  }

  // ===== COMPLIANCE E AUDITORIA =====
  
  async getAuditTrailsEnterprise(tenantId: string, filters?: any): Promise<{ success: boolean; data?: AuditTrailEnterprise[]; error?: string }> {
    try {
      let whereClause = `tenant_id = ${tenantId}`;
      
      if (filters?.tableName) {
        whereClause += ` AND table_name = '${filters.tableName}'`;
      }
      if (filters?.userId) {
        whereClause += ` AND user_id = '${filters.userId}'`;
      }
      if (filters?.sensitivityLevel) {
        whereClause += ` AND sensitivity_level = '${filters.sensitivityLevel}'`;
      }
      if (filters?.dateFrom) {
        whereClause += ` AND timestamp >= '${filters.dateFrom}'`;
      }
      if (filters?.dateTo) {
        whereClause += ` AND timestamp <= '${filters.dateTo}'`;
      }

      const auditTrails = await db.execute(sql`
        SELECT 
          id, tenant_id as "tenantId", table_name as "tableName", record_id as "recordId",
          action, old_values as "oldValues", new_values as "newValues", changed_fields as "changedFields",
          user_id as "userId", user_role as "userRole", ip_address as "ipAddress",
          user_agent as "userAgent", session_id as "sessionId", sensitivity_level as "sensitivityLevel",
          requires_retention as "requiresRetention", compliance_tags as "complianceTags",
          timestamp
        FROM audit_trails_enterprise 
        WHERE ${sql.raw(whereClause)}
        ORDER BY timestamp DESC
        LIMIT 1000
      `);

      return { success: true, data: auditTrails.rows as AuditTrailEnterprise[] };
    } catch (error) {
      console.error('Error fetching audit trails enterprise:', error);
      return { success: false, error: 'Erro ao buscar trilhas de auditoria' };
    }
  }

  async getComplianceAlerts(tenantId: string): Promise<{ success: boolean; data?: ComplianceAlert[]; error?: string }> {
    try {
      const alerts = await db.execute(sql`
        SELECT 
          id, tenant_id as "tenantId", alert_type as "alertType", severity, title, description,
          reference_type as "referenceType", reference_id as "referenceId",
          compliance_domain as "complianceDomain", impact_assessment as "impactAssessment",
          recommended_actions as "recommendedActions", alert_date as "alertDate",
          due_date as "dueDate", assigned_to as "assignedTo", status,
          resolution_notes as "resolutionNotes", resolved_date as "resolvedDate",
          resolved_by as "resolvedBy", created_at as "createdAt", created_by as "createdBy"
        FROM compliance_alerts_enterprise 
        WHERE tenant_id = ${tenantId}
        ORDER BY 
          CASE severity 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
          END ASC,
          created_at DESC
      `);

      return { success: true, data: alerts.rows as ComplianceAlert[] };
    } catch (error) {
      console.error('Error fetching compliance alerts:', error);
      return { success: false, error: 'Erro ao buscar alertas de compliance' };
    }
  }

  async getCertifications(tenantId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const certifications = await db.execute(sql`
        SELECT 
          id, name, type, issuing_body as "issuingBody", certificate_number as "certificateNumber",
          scope, applicable_to_asset_types as "applicableToAssetTypes",
          applicable_to_part_types as "applicableToPartTypes",
          issued_date as "issuedDate", expiration_date as "expirationDate",
          reminder_days_before as "reminderDaysBefore", document_path as "documentPath",
          status, is_active as "isActive", created_at as "createdAt"
        FROM certifications_enterprise 
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY expiration_date ASC
      `);

      return { success: true, data: certifications.rows };
    } catch (error) {
      console.error('Error fetching certifications:', error);
      return { success: false, error: 'Erro ao buscar certificações' };
    }
  }

  // ===== MOBILE E OFFLINE =====
  
  async getMobileDevices(tenantId: string, userId?: string): Promise<{ success: boolean; data?: MobileDevice[]; error?: string }> {
    try {
      let whereClause = `tenant_id = ${tenantId}`;
      if (userId) {
        whereClause += ` AND user_id = '${userId}'`;
      }

      const devices = await db.execute(sql`
        SELECT 
          id, tenant_id as "tenantId", user_id as "userId", device_id as "deviceId",
          device_name as "deviceName", device_type as "deviceType", device_model as "deviceModel",
          os_version as "osVersion", app_version as "appVersion", 
          last_known_location as "lastKnownLocation", connectivity_status as "connectivityStatus",
          permissions, allowed_modules as "allowedModules", is_active as "isActive",
          last_seen as "lastSeen", registration_date as "registrationDate",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM mobile_device_registrations 
        WHERE ${sql.raw(whereClause)} AND is_active = true
        ORDER BY last_seen DESC
      `);

      return { success: true, data: devices.rows as MobileDevice[] };
    } catch (error) {
      console.error('Error fetching mobile devices:', error);
      return { success: false, error: 'Erro ao buscar dispositivos móveis' };
    }
  }

  async getOfflineSyncQueue(tenantId: string, userId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const syncQueue = await db.execute(sql`
        SELECT 
          id, table_name as "tableName", record_id as "recordId", operation,
          data, device_id as "deviceId", local_timestamp as "localTimestamp",
          server_timestamp as "serverTimestamp", sync_status as "syncStatus",
          sync_attempts as "syncAttempts", last_sync_attempt as "lastSyncAttempt",
          sync_error as "syncError", conflict_resolution as "conflictResolution",
          conflict_data as "conflictData", created_at as "createdAt"
        FROM offline_sync_queue 
        WHERE tenant_id = ${tenantId} AND user_id = ${userId}
        ORDER BY server_timestamp DESC
        LIMIT 100
      `);

      return { success: true, data: syncQueue.rows };
    } catch (error) {
      console.error('Error fetching offline sync queue:', error);
      return { success: false, error: 'Erro ao buscar fila de sincronização' };
    }
  }

  // ===== DASHBOARD STATS ETAPA 6 =====
  
  async getDashboardStatsEtapa6(tenantId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const stats = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM assets_enterprise WHERE tenant_id = ${tenantId} AND is_active = true) as total_assets,
          (SELECT COUNT(*) FROM assets_enterprise WHERE tenant_id = ${tenantId} AND status = 'maintenance') as assets_in_maintenance,
          (SELECT COUNT(*) FROM price_lists_enterprise WHERE tenant_id = ${tenantId} AND is_current_version = true) as active_price_lists,
          (SELECT COUNT(*) FROM compliance_alerts_enterprise WHERE tenant_id = ${tenantId} AND status = 'open') as open_compliance_alerts,
          (SELECT COUNT(*) FROM certifications_enterprise WHERE tenant_id = ${tenantId} AND status = 'active') as active_certifications,
          (SELECT COUNT(*) FROM mobile_device_registrations WHERE tenant_id = ${tenantId} AND is_active = true) as registered_devices,
          (SELECT COUNT(*) FROM offline_sync_queue WHERE tenant_id = ${tenantId} AND sync_status = 'pending') as pending_sync_items,
          (SELECT AVG(CASE condition_rating 
            WHEN 'excellent' THEN 5 
            WHEN 'good' THEN 4 
            WHEN 'fair' THEN 3 
            WHEN 'poor' THEN 2 
            WHEN 'critical' THEN 1 
            ELSE 0 END) 
          FROM assets_enterprise WHERE tenant_id = ${tenantId} AND is_active = true) as avg_asset_condition
      `);

      return { success: true, data: stats.rows[0] };
    } catch (error) {
      console.error('Error fetching dashboard stats etapa 6:', error);
      return { success: false, error: 'Erro ao buscar estatísticas do dashboard' };
    }
  }
}
