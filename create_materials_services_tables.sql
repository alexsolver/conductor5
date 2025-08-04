
-- Materials-Services Module Tables Creation
-- Based on schema-materials-services.ts

-- 1. CATÁLOGO DE ITENS
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    integration_code VARCHAR(100),
    description TEXT,
    measurement_unit VARCHAR(10) DEFAULT 'UN',
    maintenance_plan TEXT,
    group_name VARCHAR(100),
    default_checklist JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID
);

-- 2. FORNECEDORES
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    trade_name VARCHAR(255),
    document VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Brasil',
    website VARCHAR(255),
    contact_person VARCHAR(255),
    payment_terms TEXT,
    notes TEXT,
    performance_rating DECIMAL(3,2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID
);

-- 3. CONTROLE DE ATIVOS
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    parent_asset_id UUID,
    asset_level VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    current_location_id UUID,
    coordinates JSONB,
    acquisition_date TIMESTAMP,
    acquisition_cost DECIMAL(12,2),
    warranty_expiry TIMESTAMP,
    hour_meter DECIMAL(10,2),
    kilometer_meter DECIMAL(10,2),
    usage_time INTEGER,
    qr_code VARCHAR(255),
    rfid_tag VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID
);

-- 4. LISTA DE PREÇOS UNIFICADA (LPU) - TABELA PRINCIPAL
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    customer_id UUID,
    customer_company_id UUID,
    contract_id UUID,
    cost_center_id UUID,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    currency VARCHAR(3) DEFAULT 'BRL',
    automatic_margin DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    UNIQUE(tenant_id, code, version)
);

-- 5. ITENS DA LISTA DE PREÇOS
CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    price_list_id UUID NOT NULL,
    item_id UUID,
    service_type_id UUID,
    unit_price DECIMAL(10,2) NOT NULL,
    special_price DECIMAL(10,2),
    scale_discounts JSONB,
    hourly_rate DECIMAL(10,2),
    travel_cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE
);

-- 6. REGRAS DE PRECIFICAÇÃO
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    conditions JSONB,
    actions JSONB,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. VERSIONAMENTO DE LISTAS DE PREÇOS
CREATE TABLE IF NOT EXISTS price_list_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    price_list_id UUID NOT NULL,
    version VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,
    submitted_by UUID,
    submitted_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    rejected_by UUID,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    base_margin DECIMAL(5,2),
    margin_override JSONB,
    effective_date TIMESTAMP,
    expiration_date TIMESTAMP,
    notes TEXT,
    change_log JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE
);

-- 8. PRECIFICAÇÃO DINÂMICA
CREATE TABLE IF NOT EXISTS dynamic_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    price_list_id UUID NOT NULL,
    item_id UUID,
    base_price DECIMAL(15,2) NOT NULL,
    current_price DECIMAL(15,2) NOT NULL,
    demand_factor DECIMAL(5,4) DEFAULT 1.0000,
    seasonal_factor DECIMAL(5,4) DEFAULT 1.0000,
    inventory_factor DECIMAL(5,4) DEFAULT 1.0000,
    competitor_factor DECIMAL(5,4) DEFAULT 1.0000,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculation_rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE
);

-- INDEXES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_price_lists_tenant_id ON price_lists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_active ON price_lists(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_lists_validity ON price_lists(tenant_id, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_price_list_items_tenant_id ON price_list_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_list_id ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_tenant_id ON pricing_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(tenant_id, priority DESC);

-- COMENTÁRIOS DAS TABELAS
COMMENT ON TABLE price_lists IS 'Lista de Preços Unificada (LPU) - Sistema principal de precificação';
COMMENT ON TABLE price_list_items IS 'Itens associados às listas de preços com valores específicos';
COMMENT ON TABLE pricing_rules IS 'Regras automáticas de precificação e descontos';
COMMENT ON TABLE price_list_versions IS 'Controle de versionamento e workflow de aprovação';
COMMENT ON TABLE dynamic_pricing IS 'Sistema de precificação dinâmica baseada em fatores de mercado';
