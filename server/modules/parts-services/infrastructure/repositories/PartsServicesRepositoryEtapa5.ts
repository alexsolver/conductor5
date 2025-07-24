
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
// ETAPA 5: SISTEMA MULTI-ARMAZÉM ENTERPRISE - REPOSITORY
import { Pool } from 'pg';
import pool from '../../../../db';

export class PartsServicesRepositoryEtapa5 {
  private getTenantSchema(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // ===== CAPACIDADES DE ARMAZÉM =====
  async getWarehouseCapacities(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(`
        SELECT 
          wc.*,
          sl.name as location_name,
          sl.address,
          sl.coordinates,
          sl.location_type,
          ROUND((wc.used_capacity / wc.total_capacity * 100)::numeric, 2) as utilization_percentage
        FROM ${schema}.warehouse_capacities wc
        LEFT JOIN ${schema}.stock_locations sl ON wc.location_id = sl.id
        WHERE wc.tenant_id = $1
        ORDER BY utilization_percentage DESC
      `, [tenantId]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching warehouse capacities:', error);
      throw error;
    }
  }

  async createWarehouseCapacity(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(`
        INSERT INTO ${schema}.warehouse_capacities (
          tenant_id, location_id, total_capacity, available_capacity,
          unit, max_weight
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        tenantId, data.locationId, data.totalCapacity, 
        data.availableCapacity, data.unit, data.maxWeight
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating warehouse capacity:', error);
      throw error;
    }
  }

  // ===== ORDENS DE TRANSFERÊNCIA =====
  async getTransferOrders(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(`
        SELECT 
          to_.*,
          sl_from.name as from_location_name,
          sl_from.address as from_address,
          sl_to.name as to_location_name,
          sl_to.address as to_address,
          u_req.first_name || ' ' || u_req.last_name as requested_by_name,
          u_app.first_name || ' ' || u_app.last_name as approved_by_name,
          COUNT(toi.id) as total_items,
          SUM(toi.requested_quantity) as total_quantity
        FROM ${schema}.transfer_orders to_
        LEFT JOIN ${schema}.stock_locations sl_from ON to_.from_location_id = sl_from.id
        LEFT JOIN ${schema}.stock_locations sl_to ON to_.to_location_id = sl_to.id
        LEFT JOIN public.users u_req ON to_.requested_by = u_req.id
        LEFT JOIN public.users u_app ON to_.approved_by = u_app.id
        LEFT JOIN ${schema}.transfer_order_items toi ON to_.id = toi.transfer_order_id
        WHERE to_.tenant_id = $1
        GROUP BY to_.id, sl_from.name, sl_from.address, sl_to.name, sl_to.address,
                 u_req.first_name, u_req.last_name, u_app.first_name, u_app.last_name
        ORDER BY to_.created_at DESC
      `, [tenantId]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching transfer orders:', error);
      throw error;
    }
  }

  async createTransferOrder(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Gerar número da transferência
      const transferNumber = `TRF-${Date.now()}`;

      // Criar ordem de transferência
      const transferResult = await client.query(`
        INSERT INTO ${schema}.transfer_orders (
          tenant_id, transfer_number, from_location_id, to_location_id,
          status, priority, requested_date, requested_by, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        tenantId, transferNumber, data.fromLocationId, data.toLocationId,
        'pending', data.priority || 'normal', data.requestedDate,
        data.requestedBy, data.notes
      ]);

      const transferOrder = transferResult.rows[0];

      // Criar itens da transferência
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await client.query(`
            INSERT INTO ${schema}.transfer_order_items (
              tenant_id, transfer_order_id, part_id, requested_quantity, notes
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            tenantId, transferOrder.id, item.partId, 
            item.requestedQuantity, item.notes
          ]);
        }
      }

      await client.query('COMMIT');
      return transferOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating transfer order:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTransferOrderStatus(tenantId: string, orderId: string, status: string, userId: string): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      let updateFields = 'status = $3, updated_at = NOW()';
      let values = [tenantId, orderId, status];

      if (status === 'approved') {
        updateFields += ', approved_by = $4, approved_date = NOW()';
        values.push(userId);
      } else if (status === 'in_transit') {
        updateFields += ', shipped_date = NOW()';
      } else if (status === 'delivered') {
        updateFields += ', delivered_date = NOW()';
      }

      const result = await pool.query(`
        UPDATE ${schema}.transfer_orders 
        SET ${updateFields}
        WHERE tenant_id = $1 AND id = $2
        RETURNING *
      `, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating transfer order status:', error);
      throw error;
    }
  }

  // ===== GPS TRACKING =====
  async createGpsTrackingPoint(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(`
        INSERT INTO ${schema}.gps_tracking (
          tenant_id, trackable_type, trackable_id, latitude, longitude,
          altitude, speed, heading, accuracy, is_moving, battery_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        tenantId, data.trackableType, data.trackableId, data.latitude,
        data.longitude, data.altitude, data.speed, data.heading,
        data.accuracy, data.isMoving, data.batteryLevel
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating GPS tracking point:', error);
      throw error;
    }
  }

  async getGpsTracking(tenantId: string, trackableType: string, trackableId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(`
        SELECT * FROM ${schema}.gps_tracking
        WHERE tenant_id = $1 AND trackable_type = $2 AND trackable_id = $3
        ORDER BY recorded_at DESC
        LIMIT 100
      `, [tenantId, trackableType, trackableId]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching GPS tracking:', error);
      throw error;
    }
  }

  // ===== ANALYTICS DE ARMAZÉM =====
  async getWarehouseAnalytics(tenantId: string, locationId?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      let whereClause = 'WHERE wa.tenant_id = $1';
      let values = [tenantId];

      if (locationId) {
        whereClause += ' AND wa.location_id = $2';
        values.push(locationId);
      }

      const result = await pool.query(`
        SELECT 
          wa.*,
          sl.name as location_name,
          sl.location_type
        FROM ${schema}.warehouse_analytics wa
        LEFT JOIN ${schema}.stock_locations sl ON wa.location_id = sl.id
        ${whereClause}
        ORDER BY wa.analytics_date DESC
        LIMIT 30
      `, values);

      return result.rows;
    } catch (error) {
      console.error('Error fetching warehouse analytics:', error);
      throw error;
    }
  }

  async generateDailyAnalytics(tenantId: string): Promise<void> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      await pool.query(`
        INSERT INTO ${schema}.warehouse_analytics (
          tenant_id, analytics_date, location_id, total_items, total_value,
          items_received, items_shipped, utilization_rate
        )
        SELECT 
          $1,
          CURRENT_DATE,
          i.location_id,
          COUNT(DISTINCT i.part_id),
          SUM(i.quantity * p.unit_cost),
          COALESCE(received.count, 0),
          COALESCE(shipped.count, 0),
          COALESCE(wc.used_capacity / wc.total_capacity * 100, 0)
        FROM ${schema}.inventory i
        LEFT JOIN ${schema}.parts p ON i.part_id = p.id
        LEFT JOIN ${schema}.warehouse_capacities wc ON i.location_id = wc.location_id
        LEFT JOIN (
          SELECT location_id, COUNT(*) as count
          FROM ${schema}.stock_movements
          WHERE movement_type = 'in' AND DATE(created_at) = CURRENT_DATE
          GROUP BY location_id
        ) received ON i.location_id = received.location_id
        LEFT JOIN (
          SELECT location_id, COUNT(*) as count
          FROM ${schema}.stock_movements
          WHERE movement_type = 'out' AND DATE(created_at) = CURRENT_DATE
          GROUP BY location_id
        ) shipped ON i.location_id = shipped.location_id
        WHERE i.tenant_id = $1
        GROUP BY i.location_id, received.count, shipped.count, wc.used_capacity, wc.total_capacity
        ON CONFLICT (tenant_id, analytics_date, location_id) 
        DO UPDATE SET
          total_items = EXCLUDED.total_items,
          total_value = EXCLUDED.total_value,
          items_received = EXCLUDED.items_received,
          items_shipped = EXCLUDED.items_shipped,
          utilization_rate = EXCLUDED.utilization_rate
      `, [tenantId]);
    } catch (error) {
      console.error('Error generating daily analytics:', error);
      throw error;
    }
  }

  // ===== PREVISÃO DE DEMANDA =====
  async getDemandForecasting(tenantId: string, partId?: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      let whereClause = 'WHERE df.tenant_id = $1';
      let values = [tenantId];

      if (partId) {
        whereClause += ' AND df.part_id = $2';
        values.push(partId);
      }

      const result = await pool.query(`
        SELECT 
          df.*,
          p.name as part_name,
          p.internal_code,
          sl.name as location_name,
          i.quantity as current_stock
        FROM ${schema}.demand_forecasting df
        LEFT JOIN ${schema}.parts p ON df.part_id = p.id
        LEFT JOIN ${schema}.stock_locations sl ON df.location_id = sl.id
        LEFT JOIN ${schema}.inventory i ON df.part_id = i.part_id AND df.location_id = i.location_id
        ${whereClause}
        ORDER BY df.forecast_date DESC
      `, values);

      return result.rows;
    } catch (error) {
      console.error('Error fetching demand forecasting:', error);
      throw error;
    }
  }

  async generateDemandForecast(tenantId: string, partId: string, locationId: string): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      // Calcular média móvel dos últimos 30 dias
      const historicalResult = await pool.query(`
        SELECT 
          AVG(ABS(quantity)) as avg_movement,
          STDDEV(ABS(quantity)) as std_dev
        FROM ${schema}.stock_movements
        WHERE tenant_id = $1 AND part_id = $2 AND location_id = $3
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND movement_type = 'out'
      `, [tenantId, partId, locationId]);

      const historical = historicalResult.rows[0];
      const forecastedDemand = historical.avg_movement || 0;
      const confidenceLevel = historical.std_dev ? 
        Math.max(50, 100 - (historical.std_dev / historical.avg_movement * 100)) : 50;

      const result = await pool.query(`
        INSERT INTO ${schema}.demand_forecasting (
          tenant_id, part_id, location_id, forecast_date, forecast_period,
          historical_average, historical_std_dev, forecasted_demand, confidence_level,
          recommended_stock_level, reorder_point, algorithm
        ) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '1 day', 'daily', $4, $5, $6, $7, $8, $9, 'moving_average')
        RETURNING *
      `, [
        tenantId, partId, locationId, historical.avg_movement, historical.std_dev,
        forecastedDemand, confidenceLevel, forecastedDemand * 7, forecastedDemand * 3
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error generating demand forecast:', error);
      throw error;
    }
  }

  // ===== WORKFLOW DE DEVOLUÇÕES =====
  async getReturnWorkflows(tenantId: string): Promise<any[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(`
        SELECT 
          rw.*,
          p.name as part_name,
          p.internal_code,
          sl_current.name as current_location_name,
          sl_dest.name as destination_location_name,
          u_req.first_name || ' ' || u_req.last_name as requested_by_name,
          u_app.first_name || ' ' || u_app.last_name as approved_by_name
        FROM ${schema}.return_workflow rw
        LEFT JOIN ${schema}.parts p ON rw.part_id = p.id
        LEFT JOIN ${schema}.stock_locations sl_current ON rw.current_location_id = sl_current.id
        LEFT JOIN ${schema}.stock_locations sl_dest ON rw.destination_location_id = sl_dest.id
        LEFT JOIN public.users u_req ON rw.requested_by = u_req.id
        LEFT JOIN public.users u_app ON rw.approved_by = u_app.id
        WHERE rw.tenant_id = $1
        ORDER BY rw.created_at DESC
      `, [tenantId]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching return workflows:', error);
      throw error;
    }
  }

  async createReturnWorkflow(tenantId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const returnNumber = `RET-${Date.now()}`;

      const result = await pool.query(`
        INSERT INTO ${schema}.return_workflow (
          tenant_id, return_number, source_type, source_id, part_id,
          quantity, return_reason, item_condition, requested_by,
          current_location_id, customer_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        tenantId, returnNumber, data.sourceType, data.sourceId, data.partId,
        data.quantity, data.returnReason, data.itemCondition, data.requestedBy,
        data.currentLocationId, data.customerNotes
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating return workflow:', error);
      throw error;
    }
  }

  async updateReturnWorkflow(tenantId: string, returnId: string, data: any): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(`
        UPDATE ${schema}.return_workflow
        SET 
          status = $3,
          approved_by = $4,
          return_action = $5,
          disposition = $6,
          destination_location_id = $7,
          refund_amount = $8,
          internal_notes = $9,
          approval_date = CASE WHEN $3 = 'approved' THEN NOW() ELSE approval_date END,
          completed_date = CASE WHEN $3 = 'completed' THEN NOW() ELSE completed_date END,
          updated_at = NOW()
        WHERE tenant_id = $1 AND id = $2
        RETURNING *
      `, [
        tenantId, returnId, data.status, data.approvedBy, data.returnAction,
        data.disposition, data.destinationLocationId, data.refundAmount,
        data.internalNotes
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating return workflow:', error);
      throw error;
    }
  }

  // ===== RELATÓRIOS CONSOLIDADOS =====
  async getMultiWarehouseStats(tenantId: string): Promise<any> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(DISTINCT sl.id) as total_locations,
          COUNT(DISTINCT to_.id) as total_transfers,
          COUNT(DISTINCT rw.id) as total_returns,
          AVG(wa.utilization_rate) as avg_utilization,
          SUM(wa.total_value) as total_inventory_value,
          COUNT(CASE WHEN to_.status = 'pending' THEN 1 END) as pending_transfers,
          COUNT(CASE WHEN rw.status = 'pending' THEN 1 END) as pending_returns
        FROM ${schema}.stock_locations sl
        LEFT JOIN ${schema}.transfer_orders to_ ON sl.id IN (to_.from_location_id, to_.to_location_id)
        LEFT JOIN ${schema}.return_workflow rw ON sl.id = rw.current_location_id
        LEFT JOIN ${schema}.warehouse_analytics wa ON sl.id = wa.location_id 
          AND wa.analytics_date = CURRENT_DATE
        WHERE sl.tenant_id = $1
      `, [tenantId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching multi-warehouse stats:', error);
      throw error;
    }
  }
}
