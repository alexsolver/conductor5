
import { getTenantDb } from "../../../../db-tenant";
import { eq, and, desc, asc, sql, gte, lte, count, avg, sum } from "drizzle-orm";

export interface KPIDefinition {
  id?: string;
  kpi_code: string;
  kpi_name: string;
  kpi_description?: string;
  calculation_method: string;
  kpi_category: string;
  target_value?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  unit_of_measure?: string;
  refresh_frequency?: string;
  is_active?: boolean;
}

export interface KPIValue {
  kpi_definition_id: string;
  calculated_value: number;
  calculation_date: string;
  metadata?: any;
}

export interface AnalyticsDashboard {
  dashboard_name: string;
  dashboard_description?: string;
  dashboard_config: any;
  is_default?: boolean;
  is_public?: boolean;
  access_roles?: string[];
}

export interface ScheduledReport {
  report_name: string;
  report_type: string;
  report_config: any;
  schedule_frequency: string;
  schedule_time?: string;
  schedule_day_of_week?: number;
  schedule_day_of_month?: number;
  recipients?: string[];
  output_format?: string;
}

export interface PerformanceBenchmark {
  benchmark_type: string;
  measurement_period: string;
  period_start_date: string;
  period_end_date: string;
  measured_value: number;
  industry_average?: number;
  best_practice_value?: number;
  variance_percentage?: number;
  performance_grade?: string;
  improvement_suggestions?: string[];
}

export interface AnalyticsAlert {
  alert_type: string;
  alert_severity: string;
  alert_title: string;
  alert_description: string;
  related_kpi_id?: string;
  trigger_value?: number;
  threshold_value?: number;
  metadata?: any;
}

export class PartsServicesRepositoryEtapa8 {
  
  // ===== KPI MANAGEMENT =====
  
  async getKPIDefinitions(tenantId: string) {
    try {
      const db = getTenantDb(tenantId);
      
      const kpis = await db.execute(sql`
        SELECT * FROM kpi_definitions 
        WHERE tenant_id = ${tenantId} 
        AND is_active = true
        ORDER BY kpi_category, kpi_name
      `);
      
      return { success: true, data: kpis };
    } catch (error) {
      console.error('Error getting KPI definitions:', error);
      return { success: false, error: error.message };
    }
  }

  async calculateKPIValue(tenantId: string, kpiDefinitionId: string) {
    try {
      const db = getTenantDb(tenantId);
      
      // Buscar definição do KPI
      const [kpiDef] = await db.execute(sql`
        SELECT * FROM kpi_definitions 
        WHERE id = ${kpiDefinitionId} AND tenant_id = ${tenantId}
      `);
      
      if (!kpiDef) {
        return { success: false, error: 'KPI definition not found' };
      }
      
      // Executar cálculo dinâmico
      const calculationQuery = kpiDef.calculation_method.replace('$tenant_id', `'${tenantId}'`);
      const [result] = await db.execute(sql.raw(calculationQuery));
      
      const calculatedValue = Object.values(result)[0] as number;
      
      // Salvar valor calculado
      await db.execute(sql`
        INSERT INTO kpi_values (tenant_id, kpi_definition_id, calculated_value, calculation_date)
        VALUES (${tenantId}, ${kpiDefinitionId}, ${calculatedValue}, CURRENT_DATE)
        ON CONFLICT (tenant_id, kpi_definition_id, calculation_date) 
        DO UPDATE SET calculated_value = ${calculatedValue}, calculation_timestamp = CURRENT_TIMESTAMP
      `);
      
      return { 
        success: true, 
        data: { 
          kpi_definition_id: kpiDefinitionId,
          calculated_value: calculatedValue,
          calculation_date: new Date().toISOString().split('T')[0]
        } 
      };
    } catch (error) {
      console.error('Error calculating KPI value:', error);
      return { success: false, error: error.message };
    }
  }

  async getKPIValues(tenantId: string, kpiDefinitionId?: string, startDate?: string, endDate?: string) {
    try {
      const db = getTenantDb(tenantId);
      
      let whereClause = `WHERE kv.tenant_id = '${tenantId}'`;
      
      if (kpiDefinitionId) {
        whereClause += ` AND kv.kpi_definition_id = '${kpiDefinitionId}'`;
      }
      
      if (startDate) {
        whereClause += ` AND kv.calculation_date >= '${startDate}'`;
      }
      
      if (endDate) {
        whereClause += ` AND kv.calculation_date <= '${endDate}'`;
      }
      
      const values = await db.execute(sql.raw(`
        SELECT 
          kv.*,
          kd.kpi_name,
          kd.kpi_code,
          kd.unit_of_measure,
          kd.target_value,
          kd.warning_threshold,
          kd.critical_threshold
        FROM kpi_values kv
        JOIN kpi_definitions kd ON kv.kpi_definition_id = kd.id
        ${whereClause}
        ORDER BY kv.calculation_date DESC, kd.kpi_name
      `));
      
      return { success: true, data: values };
    } catch (error) {
      console.error('Error getting KPI values:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== DASHBOARD MANAGEMENT =====
  
  async createDashboard(tenantId: string, dashboardData: AnalyticsDashboard, createdBy: string) {
    try {
      const db = getTenantDb(tenantId);
      
      const [dashboard] = await db.execute(sql`
        INSERT INTO analytics_dashboards (
          tenant_id, dashboard_name, dashboard_description, dashboard_config,
          is_default, is_public, access_roles, created_by
        )
        VALUES (
          ${tenantId}, ${dashboardData.dashboard_name}, ${dashboardData.dashboard_description},
          ${JSON.stringify(dashboardData.dashboard_config)}, ${dashboardData.is_default || false},
          ${dashboardData.is_public || false}, ${dashboardData.access_roles || []}, ${createdBy}
        )
        RETURNING *
      `);
      
      return { success: true, data: dashboard };
    } catch (error) {
      console.error('Error creating dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  async getDashboards(tenantId: string, userId?: string) {
    try {
      const db = getTenantDb(tenantId);
      
      const dashboards = await db.execute(sql`
        SELECT * FROM analytics_dashboards 
        WHERE tenant_id = ${tenantId}
        AND (is_public = true OR created_by = ${userId || ''})
        ORDER BY is_default DESC, dashboard_name
      `);
      
      return { success: true, data: dashboards };
    } catch (error) {
      console.error('Error getting dashboards:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== PERFORMANCE BENCHMARKS =====
  
  async createBenchmark(tenantId: string, benchmarkData: PerformanceBenchmark) {
    try {
      const db = getTenantDb(tenantId);
      
      // Calcular variance e grade automaticamente
      let variance_percentage = null;
      let performance_grade = 'C';
      
      if (benchmarkData.industry_average) {
        variance_percentage = ((benchmarkData.measured_value - benchmarkData.industry_average) / benchmarkData.industry_average) * 100;
        
        if (variance_percentage >= 20) performance_grade = 'A+';
        else if (variance_percentage >= 10) performance_grade = 'A';
        else if (variance_percentage >= 0) performance_grade = 'B';
        else if (variance_percentage >= -10) performance_grade = 'C';
        else performance_grade = 'D';
      }
      
      const [benchmark] = await db.execute(sql`
        INSERT INTO performance_benchmarks (
          tenant_id, benchmark_type, measurement_period, period_start_date, period_end_date,
          measured_value, industry_average, best_practice_value, variance_percentage,
          performance_grade, improvement_suggestions
        )
        VALUES (
          ${tenantId}, ${benchmarkData.benchmark_type}, ${benchmarkData.measurement_period},
          ${benchmarkData.period_start_date}, ${benchmarkData.period_end_date},
          ${benchmarkData.measured_value}, ${benchmarkData.industry_average}, 
          ${benchmarkData.best_practice_value}, ${variance_percentage},
          ${performance_grade}, ${benchmarkData.improvement_suggestions || []}
        )
        RETURNING *
      `);
      
      return { success: true, data: benchmark };
    } catch (error) {
      console.error('Error creating benchmark:', error);
      return { success: false, error: error.message };
    }
  }

  async getBenchmarks(tenantId: string, benchmarkType?: string) {
    try {
      const db = getTenantDb(tenantId);
      
      let whereClause = `WHERE tenant_id = '${tenantId}'`;
      if (benchmarkType) {
        whereClause += ` AND benchmark_type = '${benchmarkType}'`;
      }
      
      const benchmarks = await db.execute(sql.raw(`
        SELECT * FROM performance_benchmarks 
        ${whereClause}
        ORDER BY period_start_date DESC, benchmark_type
      `));
      
      return { success: true, data: benchmarks };
    } catch (error) {
      console.error('Error getting benchmarks:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== ANALYTICS ALERTS =====
  
  async createAnalyticsAlert(tenantId: string, alertData: AnalyticsAlert) {
    try {
      const db = getTenantDb(tenantId);
      
      const [alert] = await db.execute(sql`
        INSERT INTO analytics_alerts (
          tenant_id, alert_type, alert_severity, alert_title, alert_description,
          related_kpi_id, trigger_value, threshold_value, metadata
        )
        VALUES (
          ${tenantId}, ${alertData.alert_type}, ${alertData.alert_severity},
          ${alertData.alert_title}, ${alertData.alert_description},
          ${alertData.related_kpi_id}, ${alertData.trigger_value},
          ${alertData.threshold_value}, ${JSON.stringify(alertData.metadata || {})}
        )
        RETURNING *
      `);
      
      return { success: true, data: alert };
    } catch (error) {
      console.error('Error creating analytics alert:', error);
      return { success: false, error: error.message };
    }
  }

  async getAnalyticsAlerts(tenantId: string, status: string = 'ACTIVE') {
    try {
      const db = getTenantDb(tenantId);
      
      const alerts = await db.execute(sql`
        SELECT 
          aa.*,
          kd.kpi_name,
          kd.kpi_code
        FROM analytics_alerts aa
        LEFT JOIN kpi_definitions kd ON aa.related_kpi_id = kd.id
        WHERE aa.tenant_id = ${tenantId}
        AND aa.status = ${status}
        ORDER BY aa.detection_timestamp DESC, aa.alert_severity DESC
      `);
      
      return { success: true, data: alerts };
    } catch (error) {
      console.error('Error getting analytics alerts:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== RELATÓRIOS CONSOLIDADOS =====
  
  async generateInventoryAnalyticsReport(tenantId: string) {
    try {
      const db = getTenantDb(tenantId);
      
      const report = await db.execute(sql`
        SELECT 
          'inventory_overview' as section,
          json_build_object(
            'total_parts', COUNT(DISTINCT p.id),
            'total_locations', COUNT(DISTINCT sl.id),
            'total_inventory_value', COALESCE(SUM(iml.current_quantity * iml.unit_cost), 0),
            'low_stock_alerts', COUNT(DISTINCT CASE WHEN iml.current_quantity <= iml.minimum_quantity THEN p.id END),
            'zero_stock_items', COUNT(DISTINCT CASE WHEN iml.current_quantity = 0 THEN p.id END)
          ) as data
        FROM parts p
        LEFT JOIN inventory_multi_location iml ON p.id = iml.part_id
        LEFT JOIN stock_locations sl ON iml.location_id = sl.id
        WHERE p.tenant_id = ${tenantId}
        
        UNION ALL
        
        SELECT 
          'abc_analysis' as section,
          json_build_object(
            'class_a_count', COUNT(CASE WHEN abc_classification = 'A' THEN 1 END),
            'class_b_count', COUNT(CASE WHEN abc_classification = 'B' THEN 1 END),
            'class_c_count', COUNT(CASE WHEN abc_classification = 'C' THEN 1 END),
            'class_a_value_percentage', 
              ROUND(
                COALESCE(SUM(CASE WHEN abc_classification = 'A' THEN total_value_moved END), 0) * 100.0 / 
                NULLIF(SUM(total_value_moved), 0), 2
              )
          ) as data
        FROM abc_analysis
        WHERE tenant_id = ${tenantId}
        
        UNION ALL
        
        SELECT 
          'movement_trends' as section,
          json_build_object(
            'total_movements_30d', COUNT(*),
            'entries_30d', COUNT(CASE WHEN movement_type = 'IN' THEN 1 END),
            'exits_30d', COUNT(CASE WHEN movement_type = 'OUT' THEN 1 END),
            'transfers_30d', COUNT(CASE WHEN movement_type = 'TRANSFER' THEN 1 END),
            'total_value_moved_30d', COALESCE(SUM(total_cost), 0)
          ) as data
        FROM stock_movements
        WHERE tenant_id = ${tenantId}
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      `);
      
      return { success: true, data: report };
    } catch (error) {
      console.error('Error generating inventory analytics report:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== DASHBOARD STATS ETAPA 8 =====
  
  async getDashboardStatsEtapa8(tenantId: string) {
    try {
      const db = getTenantDb(tenantId);
      
      const [stats] = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM kpi_definitions WHERE tenant_id = ${tenantId} AND is_active = true) as total_kpis,
          (SELECT COUNT(*) FROM analytics_dashboards WHERE tenant_id = ${tenantId}) as total_dashboards,
          (SELECT COUNT(*) FROM analytics_alerts WHERE tenant_id = ${tenantId} AND status = 'ACTIVE') as active_alerts,
          (SELECT COUNT(*) FROM analytics_alerts WHERE tenant_id = ${tenantId} AND status = 'ACTIVE' AND alert_severity = 'CRITICAL') as critical_alerts,
          (SELECT COUNT(*) FROM performance_benchmarks WHERE tenant_id = ${tenantId}) as total_benchmarks,
          (SELECT COUNT(*) FROM scheduled_reports WHERE tenant_id = ${tenantId} AND is_active = true) as active_reports,
          (SELECT AVG(calculated_value) FROM kpi_values kv 
           JOIN kpi_definitions kd ON kv.kpi_definition_id = kd.id 
           WHERE kd.tenant_id = ${tenantId} AND kd.kpi_code = 'STOCK_ACCURACY' 
           AND kv.calculation_date >= CURRENT_DATE - 7) as avg_stock_accuracy,
          (SELECT SUM(calculated_value) FROM kpi_values kv 
           JOIN kpi_definitions kd ON kv.kpi_definition_id = kd.id 
           WHERE kd.tenant_id = ${tenantId} AND kd.kpi_code = 'INVENTORY_VALUE' 
           AND kv.calculation_date = CURRENT_DATE) as current_inventory_value
      `);
      
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting dashboard stats etapa8:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== ANOMALY DETECTION =====
  
  async detectAnomalies(tenantId: string, analysisDays: number = 30) {
    try {
      const db = getTenantDb(tenantId);
      
      const anomalies = await db.execute(sql`
        SELECT * FROM detect_stock_anomalies(${tenantId}, ${analysisDays})
      `);
      
      return { success: true, data: anomalies };
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return { success: false, error: error.message };
    }
  }
}
