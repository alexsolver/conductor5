-- Create LPU tables in tenant schema
CREATE SCHEMA IF NOT EXISTS tenant_3f99462f_3621_4b1b_bea8_782acc50d62e;

SET search_path TO tenant_3f99462f_3621_4b1b_bea8_782acc50d62e;

-- Create price_lists table
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    version VARCHAR(20),
    customer_id UUID,
    customer_company_id UUID,
    contract_id UUID,
    cost_center_id UUID,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    currency VARCHAR(3) DEFAULT 'BRL',
    automatic_margin DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Create pricing_rules table
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data for testing
INSERT INTO price_lists (tenant_id, name, code, description, version) VALUES 
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Lista Padrão 2024', 'LP2024001', 'Lista de preços padrão para 2024', '1.0'),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Lista Cliente Premium', 'LCP2024001', 'Lista especial para clientes premium', '1.1')
ON CONFLICT DO NOTHING;

INSERT INTO pricing_rules (tenant_id, name, description, rule_type, priority) VALUES 
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Desconto Volume', 'Desconto automático por volume', 'percentual', 1),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Margem Mínima', 'Garantir margem mínima de 15%', 'fixo', 2)
ON CONFLICT DO NOTHING;
