
-- MIGRAÇÃO ETAPA 3: SISTEMA MULTI-ARMAZÉM AVANÇADO
-- Execute este script para implementar as funcionalidades da Etapa 3

-- 1. Criar tabela de transferências automatizadas
CREATE TABLE IF NOT EXISTS automated_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Configuração da regra
  rule_name VARCHAR(100) NOT NULL,
  source_location_id UUID NOT NULL REFERENCES stock_locations(id),
  destination_location_id UUID NOT NULL REFERENCES stock_locations(id),
  part_id UUID REFERENCES parts(id), -- NULL = aplicar a todas as peças
  
  -- Condições de ativação
  trigger_type VARCHAR(50) NOT NULL, -- LOW_STOCK, OVERSTOCK, SCHEDULED, DEMAND_FORECAST
  minimum_trigger_quantity INTEGER DEFAULT 0,
  maximum_trigger_quantity INTEGER,
  transfer_quantity_type VARCHAR(20) DEFAULT 'FIXED', -- FIXED, PERCENTAGE, AUTO_CALCULATE
  transfer_quantity INTEGER,
  transfer_percentage DECIMAL(5,2),
  
  -- Agendamento
  schedule_type VARCHAR(20), -- DAILY, WEEKLY, MONTHLY
  schedule_time TIME,
  schedule_day_of_week INTEGER,
  schedule_day_of_month INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_execution TIMESTAMP,
  next_execution TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- 2. Criar tabela de previsão de demanda
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  part_id UUID NOT NULL REFERENCES parts(id),
  location_id UUID NOT NULL REFERENCES stock_locations(id),
  
  -- Período da previsão
  forecast_date DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL, -- DAILY, WEEKLY, MONTHLY
  
  -- Previsões calculadas
  predicted_demand INTEGER NOT NULL,
  confidence_level DECIMAL(5,2), -- 0-100%
  
  -- Dados base para cálculo
  historical_average DECIMAL(10,2),
  trend_factor DECIMAL(5,4),
  seasonality_factor DECIMAL(5,4),
  
  -- Metadados
  calculation_method VARCHAR(50), -- MOVING_AVERAGE, LINEAR_REGRESSION, EXPONENTIAL_SMOOTHING
  data_points_used INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Criar tabela de alertas automáticos
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Referências
  part_id UUID NOT NULL REFERENCES parts(id),
  location_id UUID NOT NULL REFERENCES stock_locations(id),
  
  -- Tipo e configuração do alerta
  alert_type VARCHAR(50) NOT NULL, -- LOW_STOCK, OVERSTOCK, EXPIRING, OBSOLETE, ZERO_STOCK
  alert_priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
  
  -- Condições específicas
  threshold_value INTEGER,
  threshold_percentage DECIMAL(5,2),
  days_ahead INTEGER, -- Para alertas de vencimento
  
  -- Status do alerta
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED, DISABLED
  message TEXT,
  
  -- Ações automáticas
  auto_create_purchase_order BOOLEAN DEFAULT false,
  auto_transfer_from_location UUID REFERENCES stock_locations(id),
  notification_emails TEXT[], -- Array de emails para notificação
  
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID,
  resolved_at TIMESTAMP
);

-- 4. Criar tabela de capacidades por armazém
CREATE TABLE IF NOT EXISTS warehouse_capacities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  location_id UUID NOT NULL REFERENCES stock_locations(id),
  
  -- Capacidades físicas
  total_area_m2 DECIMAL(10,2),
  usable_area_m2 DECIMAL(10,2),
  height_limit_m DECIMAL(5,2),
  weight_limit_kg DECIMAL(15,2),
  
  -- Capacidades por volume/peso
  max_volume_m3 DECIMAL(15,3),
  current_volume_m3 DECIMAL(15,3) DEFAULT 0,
  max_weight_kg DECIMAL(15,2),
  current_weight_kg DECIMAL(15,2) DEFAULT 0,
  
  -- Zonas de armazenamento
  temperature_controlled_zones INTEGER DEFAULT 0,
  hazardous_material_zones INTEGER DEFAULT 0,
  special_handling_zones INTEGER DEFAULT 0,
  
  -- Configurações operacionais
  max_daily_movements INTEGER,
  operating_hours_start TIME,
  operating_hours_end TIME,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  capacity_utilization_percentage DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Criar tabela de rastreamento em trânsito
CREATE TABLE IF NOT EXISTS transit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Referência à movimentação
  movement_id UUID NOT NULL REFERENCES stock_movements(id),
  
  -- Informações de transporte
  carrier_name VARCHAR(100),
  tracking_number VARCHAR(100),
  transport_type VARCHAR(50), -- TRUCK, VAN, COURIER, INTERNAL
  
  -- Origem e destino
  source_location_id UUID NOT NULL REFERENCES stock_locations(id),
  destination_location_id UUID NOT NULL REFERENCES stock_locations(id),
  
  -- Status e datas
  status VARCHAR(30) DEFAULT 'IN_TRANSIT', -- PENDING, IN_TRANSIT, DELIVERED, DELAYED, CANCELLED
  estimated_departure TIMESTAMP,
  actual_departure TIMESTAMP,
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  
  -- Localização atual
  current_latitude DECIMAL(10, 7),
  current_longitude DECIMAL(10, 7),
  last_location_update TIMESTAMP,
  
  -- Observações
  notes TEXT,
  delivery_instructions TEXT,
  special_handling_requirements TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Criar tabela de análise ABC automatizada
CREATE TABLE IF NOT EXISTS abc_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  part_id UUID NOT NULL REFERENCES parts(id),
  location_id UUID REFERENCES stock_locations(id), -- NULL = análise global
  
  -- Período da análise
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  
  -- Métricas calculadas
  total_consumption INTEGER,
  total_value_consumed DECIMAL(15,2),
  consumption_frequency INTEGER,
  average_monthly_consumption DECIMAL(10,2),
  
  -- Classificação ABC
  abc_classification VARCHAR(1) NOT NULL, -- A, B, C
  classification_criteria VARCHAR(20), -- VALUE, QUANTITY, FREQUENCY, COMBINED
  percentage_of_total_value DECIMAL(5,2),
  percentage_of_total_quantity DECIMAL(5,2),
  
  -- Recomendações
  recommended_reorder_point INTEGER,
  recommended_safety_stock INTEGER,
  recommended_max_stock INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_automated_transfers_tenant_location 
ON automated_transfers(tenant_id, source_location_id, destination_location_id);

CREATE INDEX IF NOT EXISTS idx_demand_forecasts_part_date 
ON demand_forecasts(tenant_id, part_id, forecast_date DESC);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_active 
ON stock_alerts(tenant_id, status) WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_transit_tracking_status 
ON transit_tracking(tenant_id, status, estimated_arrival);

CREATE INDEX IF NOT EXISTS idx_abc_analysis_classification 
ON abc_analysis(tenant_id, abc_classification, analysis_period_end DESC);

-- 8. Criar função para calcular previsão de demanda
CREATE OR REPLACE FUNCTION calculate_demand_forecast(
  p_tenant_id UUID,
  p_part_id UUID,
  p_location_id UUID,
  p_forecast_date DATE,
  p_period_type VARCHAR
) RETURNS TABLE(
  predicted_demand INTEGER,
  confidence_level DECIMAL,
  historical_average DECIMAL
) AS $$
DECLARE
  avg_consumption DECIMAL;
  trend_factor DECIMAL := 1.0;
  data_points INTEGER;
BEGIN
  -- Calcular média histórica dos últimos 90 dias
  SELECT 
    COALESCE(AVG(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END), 0),
    COUNT(*)
  INTO avg_consumption, data_points
  FROM stock_movements sm
  WHERE sm.tenant_id = p_tenant_id 
    AND sm.part_id = p_part_id
    AND sm.location_id = p_location_id
    AND sm.created_at >= p_forecast_date - INTERVAL '90 days'
    AND sm.status = 'COMPLETED';
  
  -- Calcular fator de tendência simples
  IF data_points > 10 THEN
    trend_factor := 1.05; -- Tendência de crescimento leve
  END IF;
  
  RETURN QUERY SELECT 
    GREATEST(0, (avg_consumption * trend_factor)::INTEGER),
    CASE 
      WHEN data_points > 30 THEN 85.0
      WHEN data_points > 10 THEN 70.0
      ELSE 50.0
    END::DECIMAL,
    avg_consumption;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar função para verificar alertas automáticos
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
  min_stock INTEGER;
  max_stock INTEGER;
  expiring_count INTEGER;
BEGIN
  -- Verificar estoque baixo
  SELECT current_quantity, minimum_stock, maximum_stock
  INTO current_stock, min_stock, max_stock
  FROM inventory_multi_location
  WHERE tenant_id = NEW.tenant_id 
    AND part_id = NEW.part_id 
    AND location_id = NEW.location_id;
  
  -- Criar alerta de estoque baixo
  IF current_stock IS NOT NULL AND min_stock IS NOT NULL AND current_stock <= min_stock THEN
    INSERT INTO stock_alerts (
      tenant_id, part_id, location_id, alert_type, alert_priority,
      threshold_value, message
    )
    VALUES (
      NEW.tenant_id, NEW.part_id, NEW.location_id,
      'LOW_STOCK', 'HIGH',
      min_stock,
      'Estoque baixo: ' || current_stock || ' unidades (mínimo: ' || min_stock || ')'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Criar alerta de estoque alto
  IF current_stock IS NOT NULL AND max_stock IS NOT NULL AND current_stock >= max_stock THEN
    INSERT INTO stock_alerts (
      tenant_id, part_id, location_id, alert_type, alert_priority,
      threshold_value, message
    )
    VALUES (
      NEW.tenant_id, NEW.part_id, NEW.location_id,
      'OVERSTOCK', 'MEDIUM',
      max_stock,
      'Estoque alto: ' || current_stock || ' unidades (máximo: ' || max_stock || ')'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar trigger para alertas automáticos
DROP TRIGGER IF EXISTS trigger_check_stock_alerts ON inventory_multi_location;
CREATE TRIGGER trigger_check_stock_alerts
  AFTER INSERT OR UPDATE ON inventory_multi_location
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_alerts();

-- 11. Inserir regras de transferência automática padrão
DO $$
DECLARE
    tenant_record RECORD;
    main_warehouse_id UUID;
    secondary_location_id UUID;
BEGIN
    FOR tenant_record IN SELECT DISTINCT tenant_id FROM stock_locations WHERE tenant_id IS NOT NULL
    LOOP
        -- Buscar armazém principal
        SELECT id INTO main_warehouse_id
        FROM stock_locations 
        WHERE tenant_id = tenant_record.tenant_id 
          AND is_main_warehouse = true 
        LIMIT 1;
        
        -- Buscar segunda localização
        SELECT id INTO secondary_location_id
        FROM stock_locations 
        WHERE tenant_id = tenant_record.tenant_id 
          AND id != main_warehouse_id
        LIMIT 1;
        
        -- Criar regra de rebalanceamento automático
        IF main_warehouse_id IS NOT NULL AND secondary_location_id IS NOT NULL THEN
            INSERT INTO automated_transfers (
                tenant_id, rule_name, source_location_id, destination_location_id,
                trigger_type, minimum_trigger_quantity, transfer_quantity_type,
                transfer_quantity, is_active, created_by
            )
            VALUES (
                tenant_record.tenant_id,
                'Rebalanceamento Automático - Estoque Baixo',
                main_warehouse_id,
                secondary_location_id,
                'LOW_STOCK',
                5,
                'FIXED',
                20,
                true,
                tenant_record.tenant_id -- Usando tenant_id como created_by temporariamente
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

COMMIT;
