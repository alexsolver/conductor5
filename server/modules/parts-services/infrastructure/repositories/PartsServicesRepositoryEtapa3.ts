
import { getTenantDb } from "../../../../db-tenant";
import { eq, and, desc, ilike, count, sql, gte, lte, isNull, or } from "drizzle-orm";
import { 
  parts, 
  stockLocations, 
  inventoryMultiLocation,
  stockMovements 
} from "../../../../../shared/schema-parts-services-unified";

// Interfaces para Etapa 3
export interface AutomatedTransferRule {
  rule_name: string;
  source_location_id: string;
  destination_location_id: string;
  part_id?: string;
  trigger_type: 'LOW_STOCK' | 'OVERSTOCK' | 'SCHEDULED' | 'DEMAND_FORECAST';
  minimum_trigger_quantity?: number;
  maximum_trigger_quantity?: number;
  transfer_quantity_type: 'FIXED' | 'PERCENTAGE' | 'AUTO_CALCULATE';
  transfer_quantity?: number;
  transfer_percentage?: number;
  schedule_type?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  is_active?: boolean;
}

export interface DemandForecast {
  part_id: string;
  location_id: string;
  forecast_date: string;
  period_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  predicted_demand: number;
  confidence_level: number;
  calculation_method: string;
}

export interface StockAlert {
  part_id: string;
  location_id: string;
  alert_type: 'LOW_STOCK' | 'OVERSTOCK' | 'EXPIRING' | 'OBSOLETE' | 'ZERO_STOCK';
  alert_priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threshold_value?: number;
  message: string;
  auto_create_purchase_order?: boolean;
  notification_emails?: string[];
}

export interface WarehouseCapacity {
  location_id: string;
  total_area_m2?: number;
  usable_area_m2?: number;
  max_volume_m3?: number;
  current_volume_m3?: number;
  max_weight_kg?: number;
  current_weight_kg?: number;
  capacity_utilization_percentage?: number;
}

export interface TransitTracking {
  movement_id: string;
  carrier_name?: string;
  tracking_number?: string;
  transport_type: 'TRUCK' | 'VAN' | 'COURIER' | 'INTERNAL';
  source_location_id: string;
  destination_location_id: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'CANCELLED';
  estimated_departure?: string;
  estimated_arrival?: string;
  notes?: string;
}

export class PartsServicesRepositoryEtapa3 {

  // ===== TRANSFERÊNCIAS AUTOMATIZADAS =====
  async createAutomatedTransferRule(tenantId: string, userId: string, data: AutomatedTransferRule) {
    const db = getTenantDb(tenantId);
    
    const [rule] = await db.execute(sql`
      INSERT INTO automated_transfers (
        tenant_id, rule_name, source_location_id, destination_location_id,
        part_id, trigger_type, minimum_trigger_quantity, maximum_trigger_quantity,
        transfer_quantity_type, transfer_quantity, transfer_percentage,
        schedule_type, is_active, created_by
      )
      VALUES (
        ${tenantId}, ${data.rule_name}, ${data.source_location_id}, ${data.destination_location_id},
        ${data.part_id || null}, ${data.trigger_type}, ${data.minimum_trigger_quantity || 0}, 
        ${data.maximum_trigger_quantity || null}, ${data.transfer_quantity_type}, 
        ${data.transfer_quantity || null}, ${data.transfer_percentage || null},
        ${data.schedule_type || null}, ${data.is_active ?? true}, ${userId}
      )
      RETURNING *
    `);

    return rule;
  }

  async getAutomatedTransferRules(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    const rules = await db.execute(sql`
      SELECT 
        at.*,
        sl_source.location_name as source_location_name,
        sl_dest.location_name as destination_location_name,
        p.title as part_title,
        p.internal_code as part_code
      FROM automated_transfers at
      LEFT JOIN stock_locations sl_source ON at.source_location_id = sl_source.id
      LEFT JOIN stock_locations sl_dest ON at.destination_location_id = sl_dest.id
      LEFT JOIN parts p ON at.part_id = p.id
      WHERE at.tenant_id = ${tenantId}
      ORDER BY at.created_at DESC
    `);

    return rules.rows;
  }

  async executeAutomatedTransfers(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    // Buscar regras ativas que devem ser executadas
    const activeRules = await db.execute(sql`
      SELECT * FROM automated_transfers 
      WHERE tenant_id = ${tenantId} 
        AND is_active = true 
        AND trigger_type = 'LOW_STOCK'
    `);

    const results = [];

    for (const rule of activeRules.rows) {
      // Verificar se há peças com estoque baixo que atendem aos critérios
      const lowStockItems = await db.execute(sql`
        SELECT 
          iml.part_id,
          iml.location_id,
          iml.current_quantity,
          iml.minimum_stock,
          p.title as part_title
        FROM inventory_multi_location iml
        JOIN parts p ON iml.part_id = p.id
        WHERE iml.tenant_id = ${tenantId}
          AND iml.location_id = ${rule.destination_location_id}
          AND iml.current_quantity <= iml.minimum_stock
          AND (${rule.part_id} IS NULL OR iml.part_id = ${rule.part_id})
      `);

      for (const item of lowStockItems.rows) {
        // Verificar se há estoque disponível na origem
        const sourceStock = await db.execute(sql`
          SELECT current_quantity, available_quantity
          FROM inventory_multi_location
          WHERE tenant_id = ${tenantId}
            AND part_id = ${item.part_id}
            AND location_id = ${rule.source_location_id}
            AND available_quantity >= ${rule.transfer_quantity || 10}
        `);

        if (sourceStock.rows.length > 0) {
          // Criar movimentação de transferência automática
          const transferResult = await this.createAutomaticTransfer(
            tenantId,
            item.part_id,
            rule.source_location_id,
            rule.destination_location_id,
            rule.transfer_quantity || 10,
            `Transferência automática - Regra: ${rule.rule_name}`
          );

          results.push({
            rule_id: rule.id,
            part_id: item.part_id,
            part_title: item.part_title,
            quantity_transferred: rule.transfer_quantity || 10,
            success: true
          });
        }
      }
    }

    return results;
  }

  private async createAutomaticTransfer(
    tenantId: string, 
    partId: string, 
    sourceLocationId: string, 
    destinationLocationId: string, 
    quantity: number, 
    notes: string
  ) {
    const db = getTenantDb(tenantId);
    
    // Gerar número único para a movimentação
    const movementNumber = `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const [movement] = await db.execute(sql`
      INSERT INTO stock_movements (
        tenant_id, part_id, location_id, movement_number, movement_type,
        movement_subtype, quantity, source_location_id, destination_location_id,
        status, approval_status, notes, created_by
      )
      VALUES (
        ${tenantId}, ${partId}, ${destinationLocationId}, ${movementNumber}, 'TRANSFER',
        'AUTO_REBALANCE', ${quantity}, ${sourceLocationId}, ${destinationLocationId},
        'COMPLETED', 'APPROVED', ${notes}, ${tenantId}
      )
      RETURNING *
    `);

    return movement;
  }

  // ===== PREVISÃO DE DEMANDA =====
  async generateDemandForecast(tenantId: string, partId: string, locationId: string, forecastDate: string) {
    const db = getTenantDb(tenantId);
    
    // Usar função SQL para calcular previsão
    const forecast = await db.execute(sql`
      SELECT * FROM calculate_demand_forecast(
        ${tenantId}, ${partId}, ${locationId}, ${forecastDate}::DATE, 'DAILY'
      )
    `);

    if (forecast.rows.length > 0) {
      const result = forecast.rows[0];
      
      // Salvar previsão no banco
      await db.execute(sql`
        INSERT INTO demand_forecasts (
          tenant_id, part_id, location_id, forecast_date, period_type,
          predicted_demand, confidence_level, historical_average,
          calculation_method, data_points_used
        )
        VALUES (
          ${tenantId}, ${partId}, ${locationId}, ${forecastDate}::DATE, 'DAILY',
          ${result.predicted_demand}, ${result.confidence_level}, ${result.historical_average},
          'MOVING_AVERAGE', 30
        )
        ON CONFLICT (tenant_id, part_id, location_id, forecast_date, period_type)
        DO UPDATE SET
          predicted_demand = EXCLUDED.predicted_demand,
          confidence_level = EXCLUDED.confidence_level,
          updated_at = NOW()
      `);
    }

    return forecast.rows[0] || null;
  }

  async getDemandForecasts(tenantId: string, filters: any = {}) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE df.tenant_id = '${tenantId}'`;
    
    if (filters.partId) {
      whereClause += ` AND df.part_id = '${filters.partId}'`;
    }
    
    if (filters.locationId) {
      whereClause += ` AND df.location_id = '${filters.locationId}'`;
    }
    
    if (filters.dateFrom) {
      whereClause += ` AND df.forecast_date >= '${filters.dateFrom}'`;
    }

    const forecasts = await db.execute(sql.raw(`
      SELECT 
        df.*,
        p.title as part_title,
        p.internal_code as part_code,
        sl.location_name
      FROM demand_forecasts df
      JOIN parts p ON df.part_id = p.id
      JOIN stock_locations sl ON df.location_id = sl.id
      ${whereClause}
      ORDER BY df.forecast_date DESC, df.created_at DESC
    `));

    return forecasts.rows;
  }

  // ===== ALERTAS DE ESTOQUE =====
  async getStockAlerts(tenantId: string, filters: any = {}) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE sa.tenant_id = '${tenantId}'`;
    
    if (filters.status) {
      whereClause += ` AND sa.status = '${filters.status}'`;
    }
    
    if (filters.alertType) {
      whereClause += ` AND sa.alert_type = '${filters.alertType}'`;
    }

    const alerts = await db.execute(sql.raw(`
      SELECT 
        sa.*,
        p.title as part_title,
        p.internal_code as part_code,
        sl.location_name,
        iml.current_quantity,
        iml.minimum_stock,
        iml.maximum_stock
      FROM stock_alerts sa
      JOIN parts p ON sa.part_id = p.id
      JOIN stock_locations sl ON sa.location_id = sl.id
      LEFT JOIN inventory_multi_location iml ON sa.part_id = iml.part_id AND sa.location_id = iml.location_id
      ${whereClause}
      ORDER BY 
        CASE sa.alert_priority 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END,
        sa.created_at DESC
    `));

    return alerts.rows;
  }

  async acknowledgeAlert(tenantId: string, alertId: string, userId: string) {
    const db = getTenantDb(tenantId);
    
    const [alert] = await db.execute(sql`
      UPDATE stock_alerts 
      SET 
        status = 'ACKNOWLEDGED',
        acknowledged_at = NOW(),
        acknowledged_by = ${userId}
      WHERE id = ${alertId} AND tenant_id = ${tenantId}
      RETURNING *
    `);

    return alert;
  }

  // ===== CAPACIDADES DE ARMAZÉM =====
  async updateWarehouseCapacity(tenantId: string, data: WarehouseCapacity) {
    const db = getTenantDb(tenantId);
    
    const [capacity] = await db.execute(sql`
      INSERT INTO warehouse_capacities (
        tenant_id, location_id, total_area_m2, usable_area_m2,
        max_volume_m3, current_volume_m3, max_weight_kg, current_weight_kg,
        capacity_utilization_percentage
      )
      VALUES (
        ${tenantId}, ${data.location_id}, ${data.total_area_m2 || null}, ${data.usable_area_m2 || null},
        ${data.max_volume_m3 || null}, ${data.current_volume_m3 || 0}, 
        ${data.max_weight_kg || null}, ${data.current_weight_kg || 0},
        ${data.capacity_utilization_percentage || 0}
      )
      ON CONFLICT (tenant_id, location_id)
      DO UPDATE SET
        total_area_m2 = EXCLUDED.total_area_m2,
        usable_area_m2 = EXCLUDED.usable_area_m2,
        max_volume_m3 = EXCLUDED.max_volume_m3,
        current_volume_m3 = EXCLUDED.current_volume_m3,
        max_weight_kg = EXCLUDED.max_weight_kg,
        current_weight_kg = EXCLUDED.current_weight_kg,
        capacity_utilization_percentage = EXCLUDED.capacity_utilization_percentage,
        updated_at = NOW()
      RETURNING *
    `);

    return capacity;
  }

  async getWarehouseCapacities(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    const capacities = await db.execute(sql`
      SELECT 
        wc.*,
        sl.location_name,
        sl.location_code,
        sl.location_type
      FROM warehouse_capacities wc
      JOIN stock_locations sl ON wc.location_id = sl.id
      WHERE wc.tenant_id = ${tenantId}
      ORDER BY sl.location_name
    `);

    return capacities.rows;
  }

  // ===== RASTREAMENTO EM TRÂNSITO =====
  async createTransitTracking(tenantId: string, data: TransitTracking) {
    const db = getTenantDb(tenantId);
    
    const [tracking] = await db.execute(sql`
      INSERT INTO transit_tracking (
        tenant_id, movement_id, carrier_name, tracking_number, transport_type,
        source_location_id, destination_location_id, status,
        estimated_departure, estimated_arrival, notes
      )
      VALUES (
        ${tenantId}, ${data.movement_id}, ${data.carrier_name || null}, 
        ${data.tracking_number || null}, ${data.transport_type},
        ${data.source_location_id}, ${data.destination_location_id}, ${data.status},
        ${data.estimated_departure || null}, ${data.estimated_arrival || null}, 
        ${data.notes || null}
      )
      RETURNING *
    `);

    return tracking;
  }

  async getTransitTrackings(tenantId: string, filters: any = {}) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE tt.tenant_id = '${tenantId}'`;
    
    if (filters.status) {
      whereClause += ` AND tt.status = '${filters.status}'`;
    }

    const trackings = await db.execute(sql.raw(`
      SELECT 
        tt.*,
        sm.movement_number,
        sm.quantity,
        p.title as part_title,
        p.internal_code as part_code,
        sl_source.location_name as source_location_name,
        sl_dest.location_name as destination_location_name
      FROM transit_tracking tt
      JOIN stock_movements sm ON tt.movement_id = sm.id
      JOIN parts p ON sm.part_id = p.id
      JOIN stock_locations sl_source ON tt.source_location_id = sl_source.id
      JOIN stock_locations sl_dest ON tt.destination_location_id = sl_dest.id
      ${whereClause}
      ORDER BY tt.created_at DESC
    `));

    return trackings.rows;
  }

  async updateTransitStatus(tenantId: string, trackingId: string, status: string, notes?: string) {
    const db = getTenantDb(tenantId);
    
    const [tracking] = await db.execute(sql`
      UPDATE transit_tracking 
      SET 
        status = ${status},
        notes = COALESCE(${notes}, notes),
        actual_arrival = CASE WHEN ${status} = 'DELIVERED' THEN NOW() ELSE actual_arrival END,
        updated_at = NOW()
      WHERE id = ${trackingId} AND tenant_id = ${tenantId}
      RETURNING *
    `);

    return tracking;
  }

  // ===== ANÁLISE ABC AUTOMATIZADA =====
  async generateAbcAnalysis(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    // Calcular análise ABC baseada no valor consumido nos últimos 90 dias
    const analysisResults = await db.execute(sql`
      WITH consumption_analysis AS (
        SELECT 
          sm.part_id,
          sl.id as location_id,
          SUM(CASE WHEN sm.movement_type = 'OUT' THEN sm.quantity ELSE 0 END) as total_consumption,
          SUM(CASE WHEN sm.movement_type = 'OUT' THEN sm.total_cost ELSE 0 END) as total_value_consumed,
          COUNT(CASE WHEN sm.movement_type = 'OUT' THEN 1 END) as consumption_frequency
        FROM stock_movements sm
        JOIN stock_locations sl ON sm.location_id = sl.id
        WHERE sm.tenant_id = ${tenantId}
          AND sm.created_at >= CURRENT_DATE - INTERVAL '90 days'
          AND sm.status = 'COMPLETED'
        GROUP BY sm.part_id, sl.id
        HAVING SUM(CASE WHEN sm.movement_type = 'OUT' THEN sm.quantity ELSE 0 END) > 0
      ),
      value_percentiles AS (
        SELECT 
          *,
          PERCENT_RANK() OVER (ORDER BY total_value_consumed DESC) as value_percentile
        FROM consumption_analysis
      )
      INSERT INTO abc_analysis (
        tenant_id, part_id, location_id, analysis_period_start, analysis_period_end,
        total_consumption, total_value_consumed, consumption_frequency,
        abc_classification, classification_criteria, percentage_of_total_value
      )
      SELECT 
        ${tenantId},
        part_id,
        location_id,
        CURRENT_DATE - INTERVAL '90 days',
        CURRENT_DATE,
        total_consumption,
        total_value_consumed,
        consumption_frequency,
        CASE 
          WHEN value_percentile <= 0.8 THEN 'A'
          WHEN value_percentile <= 0.95 THEN 'B'
          ELSE 'C'
        END,
        'VALUE',
        (value_percentile * 100)::DECIMAL(5,2)
      FROM value_percentiles
      ON CONFLICT (tenant_id, part_id, location_id, analysis_period_end)
      DO UPDATE SET
        total_consumption = EXCLUDED.total_consumption,
        total_value_consumed = EXCLUDED.total_value_consumed,
        abc_classification = EXCLUDED.abc_classification,
        percentage_of_total_value = EXCLUDED.percentage_of_total_value
      RETURNING *
    `);

    return analysisResults.rows;
  }

  async getAbcAnalysis(tenantId: string, filters: any = {}) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE abc.tenant_id = '${tenantId}'`;
    
    if (filters.classification) {
      whereClause += ` AND abc.abc_classification = '${filters.classification}'`;
    }
    
    if (filters.locationId) {
      whereClause += ` AND abc.location_id = '${filters.locationId}'`;
    }

    const analysis = await db.execute(sql.raw(`
      SELECT 
        abc.*,
        p.title as part_title,
        p.internal_code as part_code,
        sl.location_name,
        iml.current_quantity,
        iml.minimum_stock
      FROM abc_analysis abc
      JOIN parts p ON abc.part_id = p.id
      LEFT JOIN stock_locations sl ON abc.location_id = sl.id
      LEFT JOIN inventory_multi_location iml ON abc.part_id = iml.part_id AND abc.location_id = iml.location_id
      ${whereClause}
      ORDER BY abc.abc_classification, abc.percentage_of_total_value DESC
    `));

    return analysis.rows;
  }

  // ===== DASHBOARD ANALYTICS =====
  async getAdvancedAnalytics(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    // Estatísticas avançadas da Etapa 3
    const analytics = await db.execute(sql`
      SELECT 
        -- Alertas ativos
        (SELECT COUNT(*) FROM stock_alerts WHERE tenant_id = ${tenantId} AND status = 'ACTIVE') as active_alerts,
        
        -- Transferências automáticas hoje
        (SELECT COUNT(*) FROM automated_transfers WHERE tenant_id = ${tenantId} AND is_active = true) as active_transfer_rules,
        
        -- Itens em trânsito
        (SELECT COUNT(*) FROM transit_tracking WHERE tenant_id = ${tenantId} AND status = 'IN_TRANSIT') as items_in_transit,
        
        -- Utilização média de capacidade
        (SELECT AVG(capacity_utilization_percentage) FROM warehouse_capacities WHERE tenant_id = ${tenantId}) as avg_capacity_utilization,
        
        -- Previsões geradas hoje
        (SELECT COUNT(*) FROM demand_forecasts WHERE tenant_id = ${tenantId} AND created_at::DATE = CURRENT_DATE) as forecasts_today,
        
        -- Classificação ABC por tipo
        (SELECT COUNT(*) FROM abc_analysis WHERE tenant_id = ${tenantId} AND abc_classification = 'A') as class_a_items,
        (SELECT COUNT(*) FROM abc_analysis WHERE tenant_id = ${tenantId} AND abc_classification = 'B') as class_b_items,
        (SELECT COUNT(*) FROM abc_analysis WHERE tenant_id = ${tenantId} AND abc_classification = 'C') as class_c_items
    `);

    return analytics.rows[0] || {};
  }
}
