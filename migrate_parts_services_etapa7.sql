
-- =====================================================
-- ETAPA 7: SISTEMA DE MOVIMENTAÇÕES REAIS E ANALYTICS
-- =====================================================

-- Tabela de movimentações reais persistentes
CREATE TABLE IF NOT EXISTS stock_movements_real (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação da movimentação
  movement_number VARCHAR(50) NOT NULL UNIQUE,
  movement_type VARCHAR(30) NOT NULL, -- IN, OUT, TRANSFER, ADJUSTMENT, RETURN
  reference_type VARCHAR(30), -- purchase_order, work_order, transfer_request
  reference_id UUID,
  
  -- Item e localização
  part_id UUID NOT NULL,
  from_location_id UUID,
  to_location_id UUID,
  
  -- Quantidades e valores
  quantity DECIMAL(15,3) NOT NULL,
  unit_cost DECIMAL(12,2),
  total_cost DECIMAL(15,2),
  
  -- Rastreabilidade
  batch_number VARCHAR(100),
  serial_numbers TEXT[],
  expiration_date TIMESTAMP,
  
  -- Aprovação e execução
  requested_by UUID,
  approved_by UUID,
  executed_by UUID,
  
  -- Datas
  requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_date TIMESTAMP,
  executed_date TIMESTAMP,
  
  -- Status e observações
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, executed, cancelled
  notes TEXT,
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

-- Tabela de análise ABC automática
CREATE TABLE IF NOT EXISTS abc_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Período de análise
  analysis_period_start TIMESTAMP NOT NULL,
  analysis_period_end TIMESTAMP NOT NULL,
  
  -- Item analisado
  part_id UUID NOT NULL,
  
  -- Dados de movimento
  total_quantity_moved DECIMAL(15,3),
  total_value_moved DECIMAL(15,2),
  movement_frequency INTEGER,
  
  -- Classificação ABC
  abc_classification VARCHAR(1), -- A, B, C
  classification_criteria VARCHAR(50), -- value, quantity, frequency
  
  -- Percentuais
  value_percentage DECIMAL(5,2),
  quantity_percentage DECIMAL(5,2),
  frequency_percentage DECIMAL(5,2),
  
  -- Métricas adicionais
  average_monthly_consumption DECIMAL(15,3),
  lead_time_days INTEGER,
  safety_stock_recommended DECIMAL(15,3),
  reorder_point_recommended DECIMAL(15,3),
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analysis_run_id UUID
);

-- Tabela de previsão de demanda
CREATE TABLE IF NOT EXISTS demand_forecasting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Item e período
  part_id UUID NOT NULL,
  forecast_date DATE NOT NULL,
  forecast_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
  
  -- Dados históricos utilizados
  historical_periods_used INTEGER,
  historical_data_quality DECIMAL(3,2), -- 0.00 a 1.00
  
  -- Previsões
  forecasted_quantity DECIMAL(15,3),
  confidence_level DECIMAL(3,2), -- 0.00 a 1.00
  lower_bound DECIMAL(15,3),
  upper_bound DECIMAL(15,3),
  
  -- Algoritmo utilizado
  forecast_method VARCHAR(50), -- linear_regression, exponential_smoothing, seasonal_arima
  model_accuracy DECIMAL(5,2), -- R² ou MAPE
  
  -- Alertas
  reorder_alert BOOLEAN DEFAULT false,
  shortage_risk DECIMAL(3,2),
  overstock_risk DECIMAL(3,2),
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  model_version VARCHAR(20)
);

-- Tabela de alertas automáticos de estoque
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Item e localização
  part_id UUID NOT NULL,
  location_id UUID,
  
  -- Tipo de alerta
  alert_type VARCHAR(30) NOT NULL, -- low_stock, reorder_point, expiration, obsolescence
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  
  -- Dados do alerta
  current_quantity DECIMAL(15,3),
  threshold_quantity DECIMAL(15,3),
  recommended_action VARCHAR(50),
  
  -- Mensagem e descrição
  alert_title VARCHAR(200) NOT NULL,
  alert_description TEXT,
  
  -- Datas
  alert_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiration_date TIMESTAMP,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, resolved, dismissed
  acknowledged_by UUID,
  acknowledged_date TIMESTAMP,
  resolution_notes TEXT,
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_real_tenant_part ON stock_movements_real(tenant_id, part_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_real_location ON stock_movements_real(tenant_id, from_location_id, to_location_id);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_tenant_part ON abc_analysis(tenant_id, part_id, analysis_period_end);
CREATE INDEX IF NOT EXISTS idx_demand_forecasting_tenant_part_date ON demand_forecasting(tenant_id, part_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_tenant_status ON stock_alerts(tenant_id, status, alert_date);

-- Constraints
ALTER TABLE stock_movements_real ADD CONSTRAINT chk_movement_type CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'RETURN'));
ALTER TABLE stock_movements_real ADD CONSTRAINT chk_movement_status CHECK (status IN ('pending', 'approved', 'executed', 'cancelled'));
ALTER TABLE abc_analysis ADD CONSTRAINT chk_abc_classification CHECK (abc_classification IN ('A', 'B', 'C'));
ALTER TABLE stock_alerts ADD CONSTRAINT chk_alert_status CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed'));
