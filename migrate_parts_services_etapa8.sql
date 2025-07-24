
-- ETAPA 8: ANALYTICS AVANÇADOS E OTIMIZAÇÕES
-- Sistema de dashboards analíticos e relatórios gerenciais

-- Tabela de KPIs configuráveis
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  kpi_code VARCHAR(100) NOT NULL,
  kpi_name VARCHAR(255) NOT NULL,
  kpi_description TEXT,
  calculation_method TEXT NOT NULL, -- SQL query ou fórmula
  kpi_category VARCHAR(100) NOT NULL, -- 'INVENTORY', 'FINANCIAL', 'OPERATIONAL', etc.
  target_value DECIMAL(15,2),
  warning_threshold DECIMAL(15,2),
  critical_threshold DECIMAL(15,2),
  unit_of_measure VARCHAR(50),
  refresh_frequency VARCHAR(50) DEFAULT 'DAILY', -- 'REALTIME', 'HOURLY', 'DAILY', 'WEEKLY'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  UNIQUE(tenant_id, kpi_code)
);

-- Tabela de valores de KPIs calculados
CREATE TABLE IF NOT EXISTS kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id),
  calculated_value DECIMAL(15,2) NOT NULL,
  calculation_date DATE NOT NULL,
  calculation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB, -- dados extras da calculação
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de dashboards personalizáveis
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  dashboard_name VARCHAR(255) NOT NULL,
  dashboard_description TEXT,
  dashboard_config JSONB NOT NULL, -- configuração do layout e widgets
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  access_roles TEXT[], -- roles que podem acessar
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relatórios programados
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL, -- 'INVENTORY_SUMMARY', 'ABC_ANALYSIS', 'COST_ANALYSIS', etc.
  report_config JSONB NOT NULL, -- parâmetros do relatório
  schedule_frequency VARCHAR(50) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY'
  schedule_time TIME,
  schedule_day_of_week INTEGER, -- para relatórios semanais
  schedule_day_of_month INTEGER, -- para relatórios mensais
  recipients TEXT[], -- emails para envio
  output_format VARCHAR(20) DEFAULT 'PDF', -- 'PDF', 'EXCEL', 'CSV'
  last_execution_date TIMESTAMP,
  next_execution_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de execuções de relatórios
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  scheduled_report_id UUID REFERENCES scheduled_reports(id),
  execution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_status VARCHAR(50) NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED'
  execution_time_ms INTEGER,
  output_file_path TEXT,
  error_message TEXT,
  metadata JSONB
);

-- Tabela de benchmarks e comparativos
CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  benchmark_type VARCHAR(100) NOT NULL, -- 'TURNOVER_RATE', 'ACCURACY_RATE', 'COST_PER_UNIT', etc.
  measurement_period VARCHAR(50) NOT NULL, -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  measured_value DECIMAL(15,2) NOT NULL,
  industry_average DECIMAL(15,2),
  best_practice_value DECIMAL(15,2),
  variance_percentage DECIMAL(5,2),
  performance_grade VARCHAR(10), -- 'A+', 'A', 'B', 'C', 'D'
  improvement_suggestions TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de alertas analíticos
CREATE TABLE IF NOT EXISTS analytics_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  alert_type VARCHAR(100) NOT NULL, -- 'KPI_THRESHOLD', 'TREND_DEVIATION', 'ANOMALY_DETECTION'
  alert_severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  alert_title VARCHAR(255) NOT NULL,
  alert_description TEXT NOT NULL,
  related_kpi_id UUID REFERENCES kpi_definitions(id),
  trigger_value DECIMAL(15,2),
  threshold_value DECIMAL(15,2),
  detection_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP,
  resolved_by UUID,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  notification_sent BOOLEAN DEFAULT false,
  metadata JSONB
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kpi_values_tenant_kpi_date ON kpi_values(tenant_id, kpi_definition_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_kpi_values_calculation_date ON kpi_values(calculation_date);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_tenant_status ON analytics_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_tenant_type_period ON performance_benchmarks(tenant_id, benchmark_type, period_start_date);
CREATE INDEX IF NOT EXISTS idx_report_executions_tenant_status ON report_executions(tenant_id, execution_status);

-- Função para calcular KPI de giro de estoque
CREATE OR REPLACE FUNCTION calculate_inventory_turnover(
  p_tenant_id UUID,
  p_part_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '365 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_cost_of_goods_sold DECIMAL(15,2);
  v_average_inventory DECIMAL(15,2);
  v_turnover_ratio DECIMAL(10,2);
BEGIN
  -- Custo dos produtos vendidos (saídas)
  SELECT COALESCE(SUM(sm.quantity * sm.unit_cost), 0)
  INTO v_cost_of_goods_sold
  FROM stock_movements sm
  WHERE sm.tenant_id = p_tenant_id
    AND sm.movement_type = 'OUT'
    AND sm.created_at::date BETWEEN p_start_date AND p_end_date
    AND (p_part_id IS NULL OR sm.part_id = p_part_id);

  -- Estoque médio do período
  SELECT COALESCE(AVG(total_value), 0)
  INTO v_average_inventory
  FROM (
    SELECT 
      DATE_TRUNC('month', sm.created_at) as month,
      SUM(
        CASE 
          WHEN sm.movement_type = 'IN' THEN sm.quantity * sm.unit_cost
          WHEN sm.movement_type = 'OUT' THEN -(sm.quantity * sm.unit_cost)
          ELSE 0 
        END
      ) as total_value
    FROM stock_movements sm
    WHERE sm.tenant_id = p_tenant_id
      AND sm.created_at::date BETWEEN p_start_date AND p_end_date
      AND (p_part_id IS NULL OR sm.part_id = p_part_id)
    GROUP BY DATE_TRUNC('month', sm.created_at)
  ) monthly_inventory;

  -- Calcular ratio
  IF v_average_inventory > 0 THEN
    v_turnover_ratio := v_cost_of_goods_sold / v_average_inventory;
  ELSE
    v_turnover_ratio := 0;
  END IF;

  RETURN v_turnover_ratio;
END;
$$ LANGUAGE plpgsql;

-- Função para detectar anomalias em movimentações
CREATE OR REPLACE FUNCTION detect_stock_anomalies(
  p_tenant_id UUID,
  p_analysis_days INTEGER DEFAULT 30
) RETURNS TABLE(
  part_id UUID,
  anomaly_type VARCHAR(50),
  anomaly_description TEXT,
  severity_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH movement_stats AS (
    SELECT 
      sm.part_id,
      COUNT(*) as movement_count,
      AVG(sm.quantity) as avg_quantity,
      STDDEV(sm.quantity) as stddev_quantity,
      MAX(sm.quantity) as max_quantity,
      MIN(sm.quantity) as min_quantity
    FROM stock_movements sm
    WHERE sm.tenant_id = p_tenant_id
      AND sm.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_analysis_days
    GROUP BY sm.part_id
  )
  SELECT 
    ms.part_id,
    'UNUSUAL_QUANTITY'::VARCHAR(50) as anomaly_type,
    'Movimento com quantidade fora do padrão detectado'::TEXT as anomaly_description,
    CASE 
      WHEN ms.max_quantity > (ms.avg_quantity + 3 * ms.stddev_quantity) THEN 5
      WHEN ms.max_quantity > (ms.avg_quantity + 2 * ms.stddev_quantity) THEN 3
      ELSE 1
    END as severity_score
  FROM movement_stats ms
  WHERE ms.stddev_quantity > 0
    AND ms.max_quantity > (ms.avg_quantity + 2 * ms.stddev_quantity);
END;
$$ LANGUAGE plpgsql;

-- Inserir KPIs padrão
INSERT INTO kpi_definitions (tenant_id, kpi_code, kpi_name, kpi_description, calculation_method, kpi_category, unit_of_measure, refresh_frequency) VALUES
-- Para cada tenant existente, vamos inserir depois via script

-- KPIs de Inventário
('00000000-0000-0000-0000-000000000000', 'INVENTORY_TURNOVER', 'Giro de Estoque', 'Número de vezes que o estoque gira por período', 'SELECT calculate_inventory_turnover($tenant_id)', 'INVENTORY', 'ratio', 'WEEKLY'),
('00000000-0000-0000-0000-000000000000', 'STOCK_ACCURACY', 'Acurácia de Estoque', 'Percentual de precisão do inventário', 'SELECT (COUNT(*) FILTER (WHERE accuracy >= 95.0) * 100.0 / COUNT(*)) FROM inventory_accuracy', 'INVENTORY', 'percentage', 'DAILY'),
('00000000-0000-0000-0000-000000000000', 'OBSOLETE_STOCK_VALUE', 'Valor de Estoque Obsoleto', 'Valor total de itens obsoletos', 'SELECT SUM(value) FROM obsolete_stock_analysis', 'INVENTORY', 'currency', 'WEEKLY'),

-- KPIs Financeiros
('00000000-0000-0000-0000-000000000000', 'INVENTORY_VALUE', 'Valor Total do Estoque', 'Valor total do inventário atual', 'SELECT SUM(current_quantity * unit_cost) FROM inventory_multi_location', 'FINANCIAL', 'currency', 'DAILY'),
('00000000-0000-0000-0000-000000000000', 'MOVEMENT_COST_MONTH', 'Custo de Movimentações Mensais', 'Total de custos de movimentações no mês', 'SELECT SUM(total_cost) FROM stock_movements WHERE DATE_TRUNC(''month'', created_at) = DATE_TRUNC(''month'', CURRENT_DATE)', 'FINANCIAL', 'currency', 'DAILY'),

-- KPIs Operacionais
('00000000-0000-0000-0000-000000000000', 'PENDING_APPROVALS', 'Aprovações Pendentes', 'Número de movimentações aguardando aprovação', 'SELECT COUNT(*) FROM stock_movements WHERE approval_status = ''PENDING''', 'OPERATIONAL', 'count', 'REALTIME'),
('00000000-0000-0000-0000-000000000000', 'ALERT_COUNT_ACTIVE', 'Alertas Ativos', 'Número de alertas de estoque ativos', 'SELECT COUNT(*) FROM stock_alerts WHERE status = ''ACTIVE''', 'OPERATIONAL', 'count', 'REALTIME'),
('00000000-0000-0000-0000-000000000000', 'FORECAST_ACCURACY', 'Precisão de Previsão', 'Percentual de acerto nas previsões de demanda', 'SELECT AVG(confidence_level) FROM demand_forecasts WHERE forecast_date >= CURRENT_DATE - 30', 'OPERATIONAL', 'percentage', 'WEEKLY');

COMMENT ON TABLE kpi_definitions IS 'Definições de KPIs configuráveis para analytics';
COMMENT ON TABLE kpi_values IS 'Valores calculados dos KPIs ao longo do tempo';
COMMENT ON TABLE analytics_dashboards IS 'Dashboards personalizáveis para visualização de analytics';
COMMENT ON TABLE scheduled_reports IS 'Relatórios programados para execução automática';
COMMENT ON TABLE performance_benchmarks IS 'Benchmarks de performance e comparativos';
COMMENT ON TABLE analytics_alerts IS 'Alertas baseados em análises e anomalias';
