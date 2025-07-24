-- ===============================================
-- MIGRAÇÃO ETAPA 5: SISTEMA MULTI-ARMAZÉM ENTERPRISE
-- Parts & Services - Logística Avançada
-- ===============================================

-- Armazéns Avançados com GPS e Capacidades
CREATE TABLE IF NOT EXISTS multi_warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    warehouse_code VARCHAR(50) NOT NULL,
    warehouse_name VARCHAR(200) NOT NULL,
    warehouse_type VARCHAR(50) NOT NULL CHECK (warehouse_type IN ('FIXED', 'MOBILE', 'VIRTUAL', 'CUSTOMER', 'SUPPLIER')),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'BR',
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    total_capacity DECIMAL(15, 2),
    used_capacity DECIMAL(15, 2) DEFAULT 0,
    capacity_unit VARCHAR(20) DEFAULT 'M3',
    temperature_controlled BOOLEAN DEFAULT FALSE,
    min_temperature DECIMAL(5, 2),
    max_temperature DECIMAL(5, 2),
    security_level VARCHAR(20) DEFAULT 'STANDARD',
    operating_hours JSONB,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(30),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    UNIQUE(tenant_id, warehouse_code)
);

-- Transferências Complexas Entre Armazéns
CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transfer_number VARCHAR(50) NOT NULL,
    source_warehouse_id UUID NOT NULL,
    destination_warehouse_id UUID NOT NULL,
    transfer_type VARCHAR(30) NOT NULL CHECK (transfer_type IN ('INTERNAL', 'CUSTOMER', 'SUPPLIER', 'EMERGENCY', 'REBALANCING')),
    priority_level VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority_level IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REJECTED')),
    requested_date DATE NOT NULL,
    scheduled_date DATE,
    shipped_date DATE,
    delivered_date DATE,
    total_items INTEGER DEFAULT 0,
    total_value DECIMAL(15, 2) DEFAULT 0,
    shipping_cost DECIMAL(15, 2) DEFAULT 0,
    tracking_number VARCHAR(100),
    carrier_name VARCHAR(100),
    estimated_delivery DATE,
    delivery_notes TEXT,
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    special_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    UNIQUE(tenant_id, transfer_number),
    FOREIGN KEY (source_warehouse_id) REFERENCES multi_warehouses(id),
    FOREIGN KEY (destination_warehouse_id) REFERENCES multi_warehouses(id)
);

-- Itens de Transferência com Rastreamento
CREATE TABLE IF NOT EXISTS transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transfer_id UUID NOT NULL,
    part_id UUID NOT NULL,
    requested_quantity INTEGER NOT NULL,
    approved_quantity INTEGER DEFAULT 0,
    shipped_quantity INTEGER DEFAULT 0,
    received_quantity INTEGER DEFAULT 0,
    unit_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2),
    lot_number VARCHAR(100),
    expiry_date DATE,
    condition_status VARCHAR(30) DEFAULT 'GOOD' CHECK (condition_status IN ('EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'EXPIRED')),
    serial_numbers JSONB,
    packaging_type VARCHAR(50),
    weight_kg DECIMAL(10, 3),
    volume_m3 DECIMAL(10, 3),
    special_handling TEXT,
    damage_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    FOREIGN KEY (transfer_id) REFERENCES warehouse_transfers(id) ON DELETE CASCADE
);

-- Rastreamento GPS em Tempo Real
CREATE TABLE IF NOT EXISTS gps_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transfer_id UUID NOT NULL,
    tracking_timestamp TIMESTAMP DEFAULT NOW(),
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    altitude_meters DECIMAL(8, 2),
    speed_kmh DECIMAL(6, 2),
    heading_degrees INTEGER,
    accuracy_meters DECIMAL(6, 2),
    location_address TEXT,
    milestone_type VARCHAR(50),
    milestone_description TEXT,
    driver_name VARCHAR(100),
    vehicle_id VARCHAR(50),
    fuel_level_percent INTEGER,
    temperature_celsius DECIMAL(5, 2),
    battery_level_percent INTEGER,
    signal_strength INTEGER,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (transfer_id) REFERENCES warehouse_transfers(id) ON DELETE CASCADE
);

-- Analytics Avançados por Localização
CREATE TABLE IF NOT EXISTS warehouse_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    analysis_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    total_movements INTEGER DEFAULT 0,
    inbound_movements INTEGER DEFAULT 0,
    outbound_movements INTEGER DEFAULT 0,
    transfer_movements INTEGER DEFAULT 0,
    total_value_moved DECIMAL(15, 2) DEFAULT 0,
    inventory_turnover DECIMAL(8, 4) DEFAULT 0,
    capacity_utilization DECIMAL(5, 2) DEFAULT 0,
    avg_processing_time_hours DECIMAL(8, 2) DEFAULT 0,
    error_rate_percent DECIMAL(5, 2) DEFAULT 0,
    efficiency_score DECIMAL(5, 2) DEFAULT 0,
    cost_per_movement DECIMAL(15, 2) DEFAULT 0,
    peak_hour_start INTEGER,
    peak_hour_end INTEGER,
    bottleneck_areas JSONB,
    improvement_suggestions JSONB,
    kpis JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (warehouse_id) REFERENCES multi_warehouses(id),
    UNIQUE(tenant_id, warehouse_id, analysis_date, period_type)
);

-- Previsão de Demanda por Localização
CREATE TABLE IF NOT EXISTS demand_forecasting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    part_id UUID NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_period VARCHAR(20) NOT NULL CHECK (forecast_period IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    historical_demand DECIMAL(15, 2) DEFAULT 0,
    predicted_demand DECIMAL(15, 2) NOT NULL,
    confidence_level DECIMAL(5, 2) DEFAULT 0,
    seasonality_factor DECIMAL(8, 4) DEFAULT 1.0,
    trend_factor DECIMAL(8, 4) DEFAULT 1.0,
    external_factors JSONB,
    algorithm_used VARCHAR(50),
    accuracy_score DECIMAL(5, 2),
    last_actual_demand DECIMAL(15, 2),
    variance_percent DECIMAL(8, 2),
    recommended_stock_level DECIMAL(15, 2),
    reorder_point DECIMAL(15, 2),
    safety_stock DECIMAL(15, 2),
    lead_time_days INTEGER,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (warehouse_id) REFERENCES multi_warehouses(id),
    UNIQUE(tenant_id, warehouse_id, part_id, forecast_date, forecast_period)
);

-- Workflow de Aprovação de Devoluções
CREATE TABLE IF NOT EXISTS return_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    return_number VARCHAR(50) NOT NULL,
    warehouse_id UUID NOT NULL,
    customer_id UUID,
    return_type VARCHAR(30) NOT NULL CHECK (return_type IN ('DEFECTIVE', 'WRONG_ITEM', 'EXCESS', 'EXPIRED', 'DAMAGE', 'WARRANTY', 'GOODWILL')),
    status VARCHAR(30) DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTED', 'PROCESSED', 'REFUNDED', 'REPLACED')),
    priority_level VARCHAR(20) DEFAULT 'NORMAL',
    initiated_date DATE NOT NULL,
    approval_deadline DATE,
    approved_date DATE,
    received_date DATE,
    processed_date DATE,
    total_items INTEGER DEFAULT 0,
    total_value DECIMAL(15, 2) DEFAULT 0,
    refund_amount DECIMAL(15, 2) DEFAULT 0,
    replacement_cost DECIMAL(15, 2) DEFAULT 0,
    restocking_fee DECIMAL(15, 2) DEFAULT 0,
    return_reason TEXT NOT NULL,
    customer_notes TEXT,
    inspection_notes TEXT,
    approval_notes TEXT,
    resolution_type VARCHAR(30),
    approved_by UUID,
    inspected_by UUID,
    processed_by UUID,
    tracking_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    UNIQUE(tenant_id, return_number),
    FOREIGN KEY (warehouse_id) REFERENCES multi_warehouses(id)
);

-- Códigos de Rastreamento e ETAs
CREATE TABLE IF NOT EXISTS tracking_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('TRANSFER', 'RETURN', 'PURCHASE_ORDER', 'DELIVERY')),
    entity_id UUID NOT NULL,
    tracking_code VARCHAR(100) NOT NULL,
    carrier_name VARCHAR(100),
    service_type VARCHAR(50),
    origin_location VARCHAR(255),
    destination_location VARCHAR(255),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    current_status VARCHAR(50),
    last_update_time TIMESTAMP,
    tracking_events JSONB,
    delivery_signature TEXT,
    delivery_photo_url VARCHAR(500),
    special_instructions TEXT,
    insurance_value DECIMAL(15, 2),
    weight_kg DECIMAL(10, 3),
    dimensions_cm VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, tracking_code)
);

-- ===============================================
-- FUNÇÕES SQL PARA ETAPA 5
-- ===============================================

-- Função para calcular utilização de capacidade
CREATE OR REPLACE FUNCTION calculate_warehouse_utilization(warehouse_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    utilization DECIMAL(5,2);
BEGIN
    SELECT 
        CASE 
            WHEN total_capacity > 0 THEN (used_capacity / total_capacity) * 100
            ELSE 0
        END
    INTO utilization
    FROM multi_warehouses 
    WHERE id = warehouse_uuid;

    RETURN COALESCE(utilization, 0);
END;
$$ LANGUAGE plpgsql;

-- Função para previsão automática de demanda
CREATE OR REPLACE FUNCTION auto_demand_forecast(tenant_uuid UUID, warehouse_uuid UUID, part_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    predicted_demand DECIMAL(15,2);
    avg_monthly_demand DECIMAL(15,2);
    trend_factor DECIMAL(8,4);
BEGIN
    -- Calcular demanda média dos últimos 6 meses
    SELECT AVG(monthly_demand) INTO avg_monthly_demand
    FROM (
        SELECT 
            EXTRACT(YEAR FROM created_at) as year,
            EXTRACT(MONTH FROM created_at) as month,
            SUM(quantity) as monthly_demand
        FROM stock_movements 
        WHERE tenant_id = tenant_uuid 
        AND part_id = part_uuid
        AND movement_type = 'OUT'
        AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
    ) monthly_data;

    -- Calcular tendência (simplificado)
    trend_factor := 1.1; -- 10% de crescimento estimado

    predicted_demand := COALESCE(avg_monthly_demand, 0) * trend_factor;

    RETURN predicted_demand;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- DADOS INICIAIS PARA DEMONSTRAÇÃO
-- ===============================================

-- Armazém principal para demonstração
INSERT INTO multi_warehouses (
    tenant_id, warehouse_code, warehouse_name, warehouse_type,
    address_line1, city, state, postal_code, country,
    gps_latitude, gps_longitude, total_capacity, capacity_unit,
    temperature_controlled, operating_hours, contact_person,
    contact_phone, contact_email, created_by
) 
SELECT 
    '3f99462f-3621-4b1b-bea8-782acc50d62e',
    'WH001',
    'Armazém Central São Paulo',
    'FIXED',
    'Rua das Indústrias, 1000',
    'São Paulo',
    'SP',
    '04001-000',
    'BR',
    -23.5505,
    -46.6333,
    5000.00,
    'M3',
    TRUE,
    '{"monday": "08:00-18:00", "tuesday": "08:00-18:00", "wednesday": "08:00-18:00", "thursday": "08:00-18:00", "friday": "08:00-18:00", "saturday": "08:00-12:00"}'::jsonb,
    'João Silva',
    '+55 11 99999-9999',
    'joao.silva@empresa.com',
    '550e8400-e29b-41d4-a716-446655440001'
WHERE NOT EXISTS (
    SELECT 1 FROM multi_warehouses 
    WHERE tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e' 
    AND warehouse_code = 'WH001'
);

-- Armazém secundário
INSERT INTO multi_warehouses (
    tenant_id, warehouse_code, warehouse_name, warehouse_type,
    address_line1, city, state, postal_code, country,
    gps_latitude, gps_longitude, total_capacity, capacity_unit,
    temperature_controlled, operating_hours, contact_person,
    contact_phone, contact_email, created_by
) 
SELECT 
    '3f99462f-3621-4b1b-bea8-782acc50d62e',
    'WH002',
    'Centro de Distribuição Rio de Janeiro',
    'FIXED',
    'Av. Brasil, 2500',
    'Rio de Janeiro',
    'RJ',
    '20001-000',
    'BR',
    -22.9068,
    -43.1729,
    3000.00,
    'M3',
    FALSE,
    '{"monday": "07:00-17:00", "tuesday": "07:00-17:00", "wednesday": "07:00-17:00", "thursday": "07:00-17:00", "friday": "07:00-17:00"}'::jsonb,
    'Maria Santos',
    '+55 21 88888-8888',
    'maria.santos@empresa.com',
    '550e8400-e29b-41d4-a716-446655440001'
WHERE NOT EXISTS (
    SELECT 1 FROM multi_warehouses 
    WHERE tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e' 
    AND warehouse_code = 'WH002'
);

-- ===============================================
-- COMENTÁRIOS FINAIS
-- ===============================================
-- Este schema implementa:
-- ✅ Sistema completo multi-armazém com GPS
-- ✅ Transferências complexas com rastreamento
-- ✅ Analytics avançados por localização  
-- ✅ Previsão de demanda automatizada
-- ✅ Workflow de aprovação de devoluções
-- ✅ Códigos de rastreamento e ETAs
-- ✅ Funções SQL para cálculos automatizados
-- ✅ Dados iniciais para demonstração imediata