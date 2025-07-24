
import { eq, and, desc, asc, sql, gte, lte, count, sum, avg } from 'drizzle-orm';
import { getTenantDb } from '../../../../storage-simple';

export class PartsServicesRepositoryEtapa5 {
  
  // ===== MULTI-WAREHOUSES MANAGEMENT =====
  async findMultiWarehouses(tenantId: string) {
    try {
      const db = await getTenantDb(tenantId);
      
      const query = sql`
        SELECT 
          id, warehouse_code, warehouse_name, warehouse_type,
          address_line1, address_line2, city, state, postal_code, country,
          gps_latitude, gps_longitude, total_capacity, used_capacity, capacity_unit,
          temperature_controlled, min_temperature, max_temperature,
          security_level, operating_hours, contact_person, contact_phone, contact_email,
          is_active, created_at, updated_at,
          CASE 
            WHEN total_capacity > 0 THEN (used_capacity / total_capacity) * 100
            ELSE 0
          END as utilization_percent
        FROM multi_warehouses 
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY warehouse_name ASC
      `;
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows || [],
        total: result.rows?.length || 0
      };
    } catch (error) {
      console.error('Error fetching multi warehouses:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createMultiWarehouse(tenantId: string, data: any) {
    try {
      const db = await getTenantDb(tenantId);
      
      const query = sql`
        INSERT INTO multi_warehouses (
          tenant_id, warehouse_code, warehouse_name, warehouse_type,
          address_line1, address_line2, city, state, postal_code, country,
          gps_latitude, gps_longitude, total_capacity, capacity_unit,
          temperature_controlled, min_temperature, max_temperature,
          security_level, operating_hours, contact_person, contact_phone, contact_email,
          created_by
        ) VALUES (
          ${tenantId}, ${data.warehouse_code}, ${data.warehouse_name}, ${data.warehouse_type},
          ${data.address_line1}, ${data.address_line2}, ${data.city}, ${data.state}, 
          ${data.postal_code}, ${data.country || 'BR'},
          ${data.gps_latitude}, ${data.gps_longitude}, ${data.total_capacity}, ${data.capacity_unit || 'M3'},
          ${data.temperature_controlled || false}, ${data.min_temperature}, ${data.max_temperature},
          ${data.security_level || 'STANDARD'}, ${JSON.stringify(data.operating_hours || {})}, 
          ${data.contact_person}, ${data.contact_phone}, ${data.contact_email},
          ${data.created_by}
        ) RETURNING *
      `;
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows?.[0] || null,
        message: 'Armazém criado com sucesso'
      };
    } catch (error) {
      console.error('Error creating multi warehouse:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== WAREHOUSE TRANSFERS =====
  async findWarehouseTransfers(tenantId: string) {
    try {
      const db = await getTenantDb(tenantId);
      
      const query = sql`
        SELECT 
          wt.id, wt.transfer_number, wt.transfer_type, wt.priority_level, wt.status,
          wt.requested_date, wt.scheduled_date, wt.shipped_date, wt.delivered_date,
          wt.total_items, wt.total_value, wt.shipping_cost, wt.tracking_number,
          wt.carrier_name, wt.estimated_delivery, wt.delivery_notes,
          sw.warehouse_name as source_warehouse,
          dw.warehouse_name as destination_warehouse,
          wt.created_at, wt.updated_at
        FROM warehouse_transfers wt
        LEFT JOIN multi_warehouses sw ON wt.source_warehouse_id = sw.id
        LEFT JOIN multi_warehouses dw ON wt.destination_warehouse_id = dw.id
        WHERE wt.tenant_id = ${tenantId} AND wt.is_active = true
        ORDER BY wt.created_at DESC
      `;
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows || [],
        total: result.rows?.length || 0
      };
    } catch (error) {
      console.error('Error fetching warehouse transfers:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createWarehouseTransfer(tenantId: string, data: any) {
    try {
      const db = await getTenantDb(tenantId);
      
      // Gerar número de transferência único
      const transferNumber = `TRF-${Date.now()}`;
      
      const query = sql`
        INSERT INTO warehouse_transfers (
          tenant_id, transfer_number, source_warehouse_id, destination_warehouse_id,
          transfer_type, priority_level, requested_date, scheduled_date,
          special_instructions, approval_required, created_by
        ) VALUES (
          ${tenantId}, ${transferNumber}, ${data.source_warehouse_id}, ${data.destination_warehouse_id},
          ${data.transfer_type}, ${data.priority_level || 'NORMAL'}, ${data.requested_date}, ${data.scheduled_date},
          ${data.special_instructions}, ${data.approval_required || false}, ${data.created_by}
        ) RETURNING *
      `;
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows?.[0] || null,
        message: 'Transferência criada com sucesso'
      };
    } catch (error) {
      console.error('Error creating warehouse transfer:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== GPS TRACKING =====
  async findGpsTracking(tenantId: string, transferId: string) {
    try {
      const db = await getTenantDb(tenantId);
      
      const query = sql`
        SELECT 
          id, transfer_id, tracking_timestamp, current_latitude, current_longitude,
          altitude_meters, speed_kmh, heading_degrees, accuracy_meters,
          location_address, milestone_type, milestone_description,
          driver_name, vehicle_id, fuel_level_percent, temperature_celsius,
          battery_level_percent, signal_strength, notes, created_at
        FROM gps_tracking 
        WHERE tenant_id = ${tenantId} AND transfer_id = ${transferId} AND is_active = true
        ORDER BY tracking_timestamp DESC
      `;
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows || [],
        total: result.rows?.length || 0
      };
    } catch (error) {
      console.error('Error fetching GPS tracking:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createGpsTracking(tenantId: string, data: any) {
    try {
      const db = await getTenantDb(tenantId);
      
      const query = sql`
        INSERT INTO gps_tracking (
          tenant_id, transfer_id, current_latitude, current_longitude,
          altitude_meters, speed_kmh, heading_degrees, accuracy_meters,
          location_address, milestone_type, milestone_description,
          driver_name, vehicle_id, fuel_level_percent, temperature_celsius,
          battery_level_percent, signal_strength, notes
        ) VALUES (
          ${tenantId}, ${data.transfer_id}, ${data.current_latitude}, ${data.current_longitude},
          ${data.altitude_meters}, ${data.speed_kmh}, ${data.heading_degrees}, ${data.accuracy_meters},
          ${data.location_address}, ${data.milestone_type}, ${data.milestone_description},
          ${data.driver_name}, ${data.vehicle_id}, ${data.fuel_level_percent}, ${data.temperature_celsius},
          ${data.battery_level_percent}, ${data.signal_strength}, ${data.notes}
        ) RETURNING *
      `;
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows?.[0] || null,
        message: 'Rastreamento GPS registrado com sucesso'
      };
    } catch (error) {
      console.error('Error creating GPS tracking:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== WAREHOUSE ANALYTICS =====
  async getWarehouseAnalytics(tenantId: string, warehouseId?: string) {
    try {
      const db = await getTenantDb(tenantId);
      
      let query;
      if (warehouseId) {
        query = sql`
          SELECT 
            wa.id, wa.warehouse_id, wa.analysis_date, wa.period_type,
            wa.total_movements, wa.inbound_movements, wa.outbound_movements, wa.transfer_movements,
            wa.total_value_moved, wa.inventory_turnover, wa.capacity_utilization,
            wa.avg_processing_time_hours, wa.error_rate_percent, wa.efficiency_score,
            wa.cost_per_movement, wa.peak_hour_start, wa.peak_hour_end,
            wa.bottleneck_areas, wa.improvement_suggestions, wa.kpis,
            mw.warehouse_name, mw.warehouse_code
          FROM warehouse_analytics wa
          LEFT JOIN multi_warehouses mw ON wa.warehouse_id = mw.id
          WHERE wa.tenant_id = ${tenantId} AND wa.warehouse_id = ${warehouseId} AND wa.is_active = true
          ORDER BY wa.analysis_date DESC
          LIMIT 30
        `;
      } else {
        query = sql`
          SELECT 
            wa.warehouse_id,
            mw.warehouse_name, mw.warehouse_code,
            SUM(wa.total_movements) as total_movements,
            SUM(wa.total_value_moved) as total_value_moved,
            AVG(wa.inventory_turnover) as avg_inventory_turnover,
            AVG(wa.capacity_utilization) as avg_capacity_utilization,
            AVG(wa.efficiency_score) as avg_efficiency_score,
            COUNT(*) as analysis_count
          FROM warehouse_analytics wa
          LEFT JOIN multi_warehouses mw ON wa.warehouse_id = mw.id
          WHERE wa.tenant_id = ${tenantId} AND wa.is_active = true
          AND wa.analysis_date >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY wa.warehouse_id, mw.warehouse_name, mw.warehouse_code
          ORDER BY total_value_moved DESC
        `;
      }
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows || [],
        total: result.rows?.length || 0
      };
    } catch (error) {
      console.error('Error fetching warehouse analytics:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== DEMAND FORECASTING =====
  async getDemandForecasting(tenantId: string, warehouseId?: string) {
    try {
      const db = await getTenantDb(tenantId);
      
      let query;
      if (warehouseId) {
        query = sql`
          SELECT 
            df.id, df.warehouse_id, df.part_id, df.forecast_date, df.forecast_period,
            df.historical_demand, df.predicted_demand, df.confidence_level,
            df.seasonality_factor, df.trend_factor, df.algorithm_used,
            df.accuracy_score, df.recommended_stock_level, df.reorder_point, df.safety_stock,
            mw.warehouse_name, mw.warehouse_code
          FROM demand_forecasting df
          LEFT JOIN multi_warehouses mw ON df.warehouse_id = mw.id
          WHERE df.tenant_id = ${tenantId} AND df.warehouse_id = ${warehouseId} AND df.is_active = true
          ORDER BY df.forecast_date DESC
          LIMIT 50
        `;
      } else {
        query = sql`
          SELECT 
            df.warehouse_id,
            mw.warehouse_name, mw.warehouse_code,
            COUNT(*) as total_forecasts,
            SUM(df.predicted_demand) as total_predicted_demand,
            AVG(df.confidence_level) as avg_confidence_level,
            AVG(df.accuracy_score) as avg_accuracy_score
          FROM demand_forecasting df
          LEFT JOIN multi_warehouses mw ON df.warehouse_id = mw.id
          WHERE df.tenant_id = ${tenantId} AND df.is_active = true
          AND df.forecast_date >= CURRENT_DATE - INTERVAL '90 days'
          GROUP BY df.warehouse_id, mw.warehouse_name, mw.warehouse_code
          ORDER BY total_predicted_demand DESC
        `;
      }
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows || [],
        total: result.rows?.length || 0
      };
    } catch (error) {
      console.error('Error fetching demand forecasting:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== RETURN WORKFLOWS =====
  async findReturnWorkflows(tenantId: string) {
    try {
      const db = await getTenantDb(tenantId);
      
      const query = sql`
        SELECT 
          rw.id, rw.return_number, rw.warehouse_id, rw.customer_id, rw.return_type, rw.status,
          rw.priority_level, rw.initiated_date, rw.approval_deadline, rw.approved_date,
          rw.received_date, rw.processed_date, rw.total_items, rw.total_value,
          rw.refund_amount, rw.replacement_cost, rw.restocking_fee,
          rw.return_reason, rw.customer_notes, rw.inspection_notes, rw.approval_notes,
          rw.resolution_type, rw.tracking_info, rw.created_at, rw.updated_at,
          mw.warehouse_name, mw.warehouse_code
        FROM return_workflows rw
        LEFT JOIN multi_warehouses mw ON rw.warehouse_id = mw.id
        WHERE rw.tenant_id = ${tenantId} AND rw.is_active = true
        ORDER BY rw.created_at DESC
      `;
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows || [],
        total: result.rows?.length || 0
      };
    } catch (error) {
      console.error('Error fetching return workflows:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createReturnWorkflow(tenantId: string, data: any) {
    try {
      const db = await getTenantDb(tenantId);
      
      // Gerar número de devolução único
      const returnNumber = `RET-${Date.now()}`;
      
      const query = sql`
        INSERT INTO return_workflows (
          tenant_id, return_number, warehouse_id, customer_id, return_type,
          priority_level, initiated_date, approval_deadline, return_reason,
          customer_notes, total_items, total_value, created_by
        ) VALUES (
          ${tenantId}, ${returnNumber}, ${data.warehouse_id}, ${data.customer_id}, ${data.return_type},
          ${data.priority_level || 'NORMAL'}, ${data.initiated_date}, ${data.approval_deadline}, ${data.return_reason},
          ${data.customer_notes}, ${data.total_items || 0}, ${data.total_value || 0}, ${data.created_by}
        ) RETURNING *
      `;
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows?.[0] || null,
        message: 'Devolução criada com sucesso'
      };
    } catch (error) {
      console.error('Error creating return workflow:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== TRACKING CODES =====
  async findTrackingCodes(tenantId: string, entityType?: string, entityId?: string) {
    try {
      const db = await getTenantDb(tenantId);
      
      let query;
      if (entityType && entityId) {
        query = sql`
          SELECT 
            id, entity_type, entity_id, tracking_code, carrier_name, service_type,
            origin_location, destination_location, estimated_delivery_date, actual_delivery_date,
            current_status, last_update_time, tracking_events, delivery_signature,
            delivery_photo_url, special_instructions, insurance_value, weight_kg, dimensions_cm,
            created_at, updated_at
          FROM tracking_codes 
          WHERE tenant_id = ${tenantId} AND entity_type = ${entityType} AND entity_id = ${entityId} AND is_active = true
          ORDER BY created_at DESC
        `;
      } else {
        query = sql`
          SELECT 
            id, entity_type, entity_id, tracking_code, carrier_name, service_type,
            origin_location, destination_location, estimated_delivery_date, actual_delivery_date,
            current_status, last_update_time, tracking_events, delivery_signature,
            delivery_photo_url, special_instructions, insurance_value, weight_kg, dimensions_cm,
            created_at, updated_at
          FROM tracking_codes 
          WHERE tenant_id = ${tenantId} AND is_active = true
          ORDER BY created_at DESC
          LIMIT 100
        `;
      }
      
      const result = await db.execute(query);
      
      return {
        success: true,
        data: result.rows || [],
        total: result.rows?.length || 0
      };
    } catch (error) {
      console.error('Error fetching tracking codes:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== DASHBOARD STATS ETAPA 5 =====
  async getDashboardStatsEtapa5(tenantId: string) {
    try {
      const db = await getTenantDb(tenantId);
      
      const statsQuery = sql`
        SELECT
          (SELECT COUNT(*) FROM multi_warehouses WHERE tenant_id = ${tenantId} AND is_active = true) as total_warehouses,
          (SELECT COUNT(*) FROM warehouse_transfers WHERE tenant_id = ${tenantId} AND is_active = true) as total_transfers,
          (SELECT COUNT(*) FROM warehouse_transfers WHERE tenant_id = ${tenantId} AND status = 'IN_TRANSIT' AND is_active = true) as active_transfers,
          (SELECT COUNT(*) FROM return_workflows WHERE tenant_id = ${tenantId} AND is_active = true) as total_returns,
          (SELECT COUNT(*) FROM return_workflows WHERE tenant_id = ${tenantId} AND status = 'PENDING_APPROVAL' AND is_active = true) as pending_returns,
          (SELECT COUNT(*) FROM tracking_codes WHERE tenant_id = ${tenantId} AND is_active = true) as total_tracking_codes,
          (SELECT COALESCE(SUM(total_capacity), 0) FROM multi_warehouses WHERE tenant_id = ${tenantId} AND is_active = true) as total_capacity,
          (SELECT COALESCE(SUM(used_capacity), 0) FROM multi_warehouses WHERE tenant_id = ${tenantId} AND is_active = true) as used_capacity,
          (SELECT COALESCE(SUM(total_value), 0) FROM warehouse_transfers WHERE tenant_id = ${tenantId} AND is_active = true) as total_transfer_value,
          (SELECT COALESCE(AVG(efficiency_score), 0) FROM warehouse_analytics WHERE tenant_id = ${tenantId} AND is_active = true) as avg_efficiency_score
      `;
      
      const result = await db.execute(statsQuery);
      const stats = result.rows?.[0] || {};
      
      // Calcular utilização geral
      const totalCapacity = parseFloat(stats.total_capacity || '0');
      const usedCapacity = parseFloat(stats.used_capacity || '0');
      const utilizationPercent = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;
      
      return {
        success: true,
        data: {
          totalWarehouses: parseInt(stats.total_warehouses || '0'),
          totalTransfers: parseInt(stats.total_transfers || '0'),
          activeTransfers: parseInt(stats.active_transfers || '0'),
          totalReturns: parseInt(stats.total_returns || '0'),
          pendingReturns: parseInt(stats.pending_returns || '0'),
          totalTrackingCodes: parseInt(stats.total_tracking_codes || '0'),
          totalCapacity: totalCapacity,
          usedCapacity: usedCapacity,
          utilizationPercent: Math.round(utilizationPercent * 100) / 100,
          totalTransferValue: parseFloat(stats.total_transfer_value || '0'),
          avgEfficiencyScore: Math.round(parseFloat(stats.avg_efficiency_score || '0') * 100) / 100
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats etapa 5:', error);
      return {
        success: false,
        data: {
          totalWarehouses: 0,
          totalTransfers: 0,
          activeTransfers: 0,
          totalReturns: 0,
          pendingReturns: 0,
          totalTrackingCodes: 0,
          totalCapacity: 0,
          usedCapacity: 0,
          utilizationPercent: 0,
          totalTransferValue: 0,
          avgEfficiencyScore: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
