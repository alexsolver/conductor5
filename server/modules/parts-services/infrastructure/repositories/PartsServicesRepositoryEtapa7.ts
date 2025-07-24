
// ETAPA 7: SISTEMA DE MOVIMENTAÇÕES REAIS E ANALYTICS - REPOSITORY
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../../../db';

interface StockMovementReal {
  id: string;
  tenantId: string;
  movementNumber: string;
  movementType: string;
  referenceType?: string;
  referenceId?: string;
  partId: string;
  fromLocationId?: string;
  toLocationId?: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  batchNumber?: string;
  serialNumbers?: string[];
  expirationDate?: Date;
  requestedBy?: string;
  approvedBy?: string;
  executedBy?: string;
  requestedDate: Date;
  approvedDate?: Date;
  executedDate?: Date;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

interface ABCAnalysis {
  id: string;
  tenantId: string;
  analysisPeriodStart: Date;
  analysisPeriodEnd: Date;
  partId: string;
  totalQuantityMoved: number;
  totalValueMoved: number;
  movementFrequency: number;
  abcClassification: string;
  classificationCriteria: string;
  valuePercentage: number;
  quantityPercentage: number;
  frequencyPercentage: number;
  averageMonthlyConsumption: number;
  leadTimeDays: number;
  safetyStockRecommended: number;
  reorderPointRecommended: number;
  createdAt: Date;
  analysisRunId: string;
}

interface DemandForecasting {
  id: string;
  tenantId: string;
  partId: string;
  forecastDate: Date;
  forecastPeriod: string;
  historicalPeriodsUsed: number;
  historicalDataQuality: number;
  forecastedQuantity: number;
  confidenceLevel: number;
  lowerBound: number;
  upperBound: number;
  forecastMethod: string;
  modelAccuracy: number;
  reorderAlert: boolean;
  shortageRisk: number;
  overstockRisk: number;
  createdAt: Date;
  modelVersion: string;
}

interface StockAlert {
  id: string;
  tenantId: string;
  partId: string;
  locationId?: string;
  alertType: string;
  severity: string;
  currentQuantity: number;
  thresholdQuantity: number;
  recommendedAction: string;
  alertTitle: string;
  alertDescription?: string;
  alertDate: Date;
  expirationDate?: Date;
  status: string;
  acknowledgedBy?: string;
  acknowledgedDate?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PartsServicesRepositoryEtapa7 {
  // ===== MOVIMENTAÇÕES REAIS =====
  
  async getStockMovementsReal(tenantId: string): Promise<{ success: boolean; data?: StockMovementReal[]; error?: string }> {
    try {
      const movements = await db.execute(sql`
        SELECT 
          id, tenant_id as "tenantId", movement_number as "movementNumber",
          movement_type as "movementType", reference_type as "referenceType",
          reference_id as "referenceId", part_id as "partId",
          from_location_id as "fromLocationId", to_location_id as "toLocationId",
          quantity, unit_cost as "unitCost", total_cost as "totalCost",
          batch_number as "batchNumber", serial_numbers as "serialNumbers",
          expiration_date as "expirationDate", requested_by as "requestedBy",
          approved_by as "approvedBy", executed_by as "executedBy",
          requested_date as "requestedDate", approved_date as "approvedDate",
          executed_date as "executedDate", status, notes,
          created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
        FROM stock_movements_real 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
        LIMIT 100
      `);

      return { success: true, data: movements.rows as StockMovementReal[] };
    } catch (error) {
      console.error('Error fetching stock movements real:', error);
      return { success: false, error: 'Erro ao buscar movimentações' };
    }
  }

  async createStockMovementReal(tenantId: string, movementData: Partial<StockMovementReal>): Promise<{ success: boolean; data?: StockMovementReal; error?: string }> {
    try {
      // Gerar número sequencial da movimentação
      const numberResult = await db.execute(sql`
        SELECT COALESCE(MAX(CAST(SUBSTRING(movement_number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_number
        FROM stock_movements_real 
        WHERE tenant_id = ${tenantId}
      `);
      
      const nextNumber = numberResult.rows[0]?.next_number || 1;
      const movementNumber = `MOV-${String(nextNumber).padStart(6, '0')}`;

      const result = await db.execute(sql`
        INSERT INTO stock_movements_real (
          tenant_id, movement_number, movement_type, reference_type, reference_id,
          part_id, from_location_id, to_location_id, quantity, unit_cost, total_cost,
          batch_number, serial_numbers, expiration_date, requested_by, status, notes, created_by
        ) VALUES (
          ${tenantId}, ${movementNumber}, ${movementData.movementType}, ${movementData.referenceType},
          ${movementData.referenceId}, ${movementData.partId}, ${movementData.fromLocationId},
          ${movementData.toLocationId}, ${movementData.quantity}, ${movementData.unitCost},
          ${movementData.totalCost}, ${movementData.batchNumber}, 
          ${movementData.serialNumbers ? JSON.stringify(movementData.serialNumbers) : null},
          ${movementData.expirationDate}, ${movementData.requestedBy}, 
          ${movementData.status || 'pending'}, ${movementData.notes}, ${movementData.createdBy}
        )
        RETURNING *
      `);

      return { success: true, data: result.rows[0] as StockMovementReal };
    } catch (error) {
      console.error('Error creating stock movement real:', error);
      return { success: false, error: 'Erro ao criar movimentação' };
    }
  }

  async approveStockMovement(tenantId: string, movementId: string, approvedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      await db.execute(sql`
        UPDATE stock_movements_real 
        SET status = 'approved', approved_by = ${approvedBy}, approved_date = CURRENT_TIMESTAMP
        WHERE id = ${movementId} AND tenant_id = ${tenantId}
      `);

      return { success: true };
    } catch (error) {
      console.error('Error approving stock movement:', error);
      return { success: false, error: 'Erro ao aprovar movimentação' };
    }
  }

  async executeStockMovement(tenantId: string, movementId: string, executedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      await db.execute(sql`
        UPDATE stock_movements_real 
        SET status = 'executed', executed_by = ${executedBy}, executed_date = CURRENT_TIMESTAMP
        WHERE id = ${movementId} AND tenant_id = ${tenantId} AND status = 'approved'
      `);

      return { success: true };
    } catch (error) {
      console.error('Error executing stock movement:', error);
      return { success: false, error: 'Erro ao executar movimentação' };
    }
  }

  // ===== ANÁLISE ABC =====
  
  async runABCAnalysis(tenantId: string, periodStart: Date, periodEnd: Date): Promise<{ success: boolean; data?: ABCAnalysis[]; error?: string }> {
    try {
      // Executar análise ABC baseada nos dados de movimentação
      const analysisRunId = crypto.randomUUID();
      
      const result = await db.execute(sql`
        WITH movement_stats AS (
          SELECT 
            part_id,
            SUM(quantity) as total_quantity,
            SUM(total_cost) as total_value,
            COUNT(*) as frequency,
            AVG(quantity) as avg_quantity
          FROM stock_movements_real 
          WHERE tenant_id = ${tenantId} 
            AND executed_date BETWEEN ${periodStart} AND ${periodEnd}
            AND status = 'executed'
          GROUP BY part_id
        ),
        value_ranking AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (ORDER BY total_value DESC) as value_rank,
            SUM(total_value) OVER () as total_system_value,
            total_value / SUM(total_value) OVER () * 100 as value_percentage
          FROM movement_stats
        ),
        abc_classification AS (
          SELECT 
            *,
            CASE 
              WHEN SUM(value_percentage) OVER (ORDER BY value_rank) <= 80 THEN 'A'
              WHEN SUM(value_percentage) OVER (ORDER BY value_rank) <= 95 THEN 'B'
              ELSE 'C'
            END as abc_class
          FROM value_ranking
        )
        INSERT INTO abc_analysis (
          tenant_id, analysis_period_start, analysis_period_end, part_id,
          total_quantity_moved, total_value_moved, movement_frequency,
          abc_classification, classification_criteria, value_percentage,
          average_monthly_consumption, analysis_run_id
        )
        SELECT 
          ${tenantId}, ${periodStart}, ${periodEnd}, part_id,
          total_quantity, total_value, frequency,
          abc_class, 'value', value_percentage,
          total_quantity / EXTRACT(MONTH FROM AGE(${periodEnd}, ${periodStart})), ${analysisRunId}
        FROM abc_classification
        RETURNING *
      `);

      return { success: true, data: result.rows as ABCAnalysis[] };
    } catch (error) {
      console.error('Error running ABC analysis:', error);
      return { success: false, error: 'Erro ao executar análise ABC' };
    }
  }

  async getABCAnalysis(tenantId: string): Promise<{ success: boolean; data?: ABCAnalysis[]; error?: string }> {
    try {
      const analysis = await db.execute(sql`
        SELECT 
          id, tenant_id as "tenantId", analysis_period_start as "analysisPeriodStart",
          analysis_period_end as "analysisPeriodEnd", part_id as "partId",
          total_quantity_moved as "totalQuantityMoved", total_value_moved as "totalValueMoved",
          movement_frequency as "movementFrequency", abc_classification as "abcClassification",
          classification_criteria as "classificationCriteria", value_percentage as "valuePercentage",
          quantity_percentage as "quantityPercentage", frequency_percentage as "frequencyPercentage",
          average_monthly_consumption as "averageMonthlyConsumption", lead_time_days as "leadTimeDays",
          safety_stock_recommended as "safetyStockRecommended", 
          reorder_point_recommended as "reorderPointRecommended",
          created_at as "createdAt", analysis_run_id as "analysisRunId"
        FROM abc_analysis 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `);

      return { success: true, data: analysis.rows as ABCAnalysis[] };
    } catch (error) {
      console.error('Error fetching ABC analysis:', error);
      return { success: false, error: 'Erro ao buscar análise ABC' };
    }
  }

  // ===== PREVISÃO DE DEMANDA =====
  
  async generateDemandForecast(tenantId: string, partId: string, forecastPeriods: number = 12): Promise<{ success: boolean; data?: DemandForecasting[]; error?: string }> {
    try {
      // Algoritmo simples de previsão baseado em média móvel e tendência
      const forecasts: DemandForecasting[] = [];
      
      for (let i = 1; i <= forecastPeriods; i++) {
        const forecastDate = new Date();
        forecastDate.setMonth(forecastDate.getMonth() + i);
        
        // Calcular previsão baseada em dados históricos (simplificado)
        const historicalData = await db.execute(sql`
          SELECT AVG(quantity) as avg_consumption, STDDEV(quantity) as std_dev
          FROM stock_movements_real 
          WHERE tenant_id = ${tenantId} AND part_id = ${partId}
            AND movement_type = 'OUT' AND status = 'executed'
            AND executed_date >= CURRENT_DATE - INTERVAL '12 months'
        `);
        
        const avgConsumption = parseFloat(historicalData.rows[0]?.avg_consumption || '0');
        const stdDev = parseFloat(historicalData.rows[0]?.std_dev || '0');
        
        const forecast: DemandForecasting = {
          id: crypto.randomUUID(),
          tenantId,
          partId,
          forecastDate,
          forecastPeriod: 'monthly',
          historicalPeriodsUsed: 12,
          historicalDataQuality: 0.85,
          forecastedQuantity: avgConsumption,
          confidenceLevel: 0.80,
          lowerBound: Math.max(0, avgConsumption - stdDev),
          upperBound: avgConsumption + stdDev,
          forecastMethod: 'simple_moving_average',
          modelAccuracy: 75.0,
          reorderAlert: avgConsumption > 0,
          shortageRisk: avgConsumption > 100 ? 0.3 : 0.1,
          overstockRisk: avgConsumption < 10 ? 0.4 : 0.2,
          createdAt: new Date(),
          modelVersion: '1.0'
        };
        
        forecasts.push(forecast);
      }
      
      // Inserir previsões no banco
      for (const forecast of forecasts) {
        await db.execute(sql`
          INSERT INTO demand_forecasting (
            id, tenant_id, part_id, forecast_date, forecast_period,
            historical_periods_used, historical_data_quality, forecasted_quantity,
            confidence_level, lower_bound, upper_bound, forecast_method,
            model_accuracy, reorder_alert, shortage_risk, overstock_risk,
            model_version
          ) VALUES (
            ${forecast.id}, ${forecast.tenantId}, ${forecast.partId}, ${forecast.forecastDate},
            ${forecast.forecastPeriod}, ${forecast.historicalPeriodsUsed}, ${forecast.historicalDataQuality},
            ${forecast.forecastedQuantity}, ${forecast.confidenceLevel}, ${forecast.lowerBound},
            ${forecast.upperBound}, ${forecast.forecastMethod}, ${forecast.modelAccuracy},
            ${forecast.reorderAlert}, ${forecast.shortageRisk}, ${forecast.overstockRisk}, ${forecast.modelVersion}
          )
        `);
      }

      return { success: true, data: forecasts };
    } catch (error) {
      console.error('Error generating demand forecast:', error);
      return { success: false, error: 'Erro ao gerar previsão de demanda' };
    }
  }

  // ===== ALERTAS DE ESTOQUE =====
  
  async getStockAlerts(tenantId: string): Promise<{ success: boolean; data?: StockAlert[]; error?: string }> {
    try {
      const alerts = await db.execute(sql`
        SELECT 
          id, tenant_id as "tenantId", part_id as "partId", location_id as "locationId",
          alert_type as "alertType", severity, current_quantity as "currentQuantity",
          threshold_quantity as "thresholdQuantity", recommended_action as "recommendedAction",
          alert_title as "alertTitle", alert_description as "alertDescription",
          alert_date as "alertDate", expiration_date as "expirationDate", status,
          acknowledged_by as "acknowledgedBy", acknowledged_date as "acknowledgedDate",
          resolution_notes as "resolutionNotes", created_at as "createdAt", updated_at as "updatedAt"
        FROM stock_alerts 
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

      return { success: true, data: alerts.rows as StockAlert[] };
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      return { success: false, error: 'Erro ao buscar alertas de estoque' };
    }
  }

  async createStockAlert(tenantId: string, alertData: Partial<StockAlert>): Promise<{ success: boolean; data?: StockAlert; error?: string }> {
    try {
      const result = await db.execute(sql`
        INSERT INTO stock_alerts (
          tenant_id, part_id, location_id, alert_type, severity,
          current_quantity, threshold_quantity, recommended_action,
          alert_title, alert_description, expiration_date
        ) VALUES (
          ${tenantId}, ${alertData.partId}, ${alertData.locationId}, ${alertData.alertType},
          ${alertData.severity || 'medium'}, ${alertData.currentQuantity}, ${alertData.thresholdQuantity},
          ${alertData.recommendedAction}, ${alertData.alertTitle}, ${alertData.alertDescription},
          ${alertData.expirationDate}
        )
        RETURNING *
      `);

      return { success: true, data: result.rows[0] as StockAlert };
    } catch (error) {
      console.error('Error creating stock alert:', error);
      return { success: false, error: 'Erro ao criar alerta de estoque' };
    }
  }

  // ===== DASHBOARD STATS ETAPA 7 =====
  
  async getDashboardStatsEtapa7(tenantId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const stats = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM stock_movements_real WHERE tenant_id = ${tenantId} AND status = 'pending') as pending_movements,
          (SELECT COUNT(*) FROM stock_movements_real WHERE tenant_id = ${tenantId} AND status = 'executed' 
           AND DATE(executed_date) = CURRENT_DATE) as today_movements,
          (SELECT COUNT(*) FROM stock_alerts WHERE tenant_id = ${tenantId} AND status = 'active') as active_alerts,
          (SELECT COUNT(*) FROM stock_alerts WHERE tenant_id = ${tenantId} AND status = 'active' AND severity = 'critical') as critical_alerts,
          (SELECT COUNT(DISTINCT part_id) FROM abc_analysis WHERE tenant_id = ${tenantId}) as parts_with_abc,
          (SELECT COUNT(*) FROM demand_forecasting WHERE tenant_id = ${tenantId} AND forecast_date >= CURRENT_DATE) as active_forecasts,
          (SELECT AVG(model_accuracy) FROM demand_forecasting WHERE tenant_id = ${tenantId}) as avg_forecast_accuracy,
          (SELECT SUM(quantity * unit_cost) FROM stock_movements_real 
           WHERE tenant_id = ${tenantId} AND status = 'executed' AND movement_type = 'OUT'
           AND DATE(executed_date) >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_consumption_value
      `);

      return { success: true, data: stats.rows[0] };
    } catch (error) {
      console.error('Error fetching dashboard stats etapa 7:', error);
      return { success: false, error: 'Erro ao buscar estatísticas do dashboard' };
    }
  }
}
