
-- MIGRAÇÃO COMPLETA - MÓDULO PEÇAS E SERVIÇOS
-- Data: 24 de janeiro de 2025

-- 1. TABELA PRINCIPAL DE ITENS
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    active BOOLEAN DEFAULT true,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Material', 'Serviço')),
    name VARCHAR(255) NOT NULL,
    integration_code VARCHAR(100) UNIQUE,
    description TEXT,
    unit_of_measure VARCHAR(50),
    default_maintenance_plan TEXT,
    group_category VARCHAR(100),
    default_checklist TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID
);

-- 2. ANEXOS DOS ITENS
CREATE TABLE IF NOT EXISTS item_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by_id UUID
);

-- 3. VÍNCULOS ENTRE ITENS
CREATE TABLE IF NOT EXISTS item_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    linked_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) DEFAULT 'related',
    quantity DECIMAL(10,3) DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. EMPRESAS CLIENTES (para vínculos)
CREATE TABLE IF NOT EXISTS customer_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    document_number VARCHAR(50),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. VÍNCULOS ITEM-CLIENTE
CREATE TABLE IF NOT EXISTS item_customer_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    customer_company_id UUID NOT NULL REFERENCES customer_companies(id) ON DELETE CASCADE,
    nickname VARCHAR(255),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    qr_code VARCHAR(100),
    is_asset BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. FORNECEDORES
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    document_number VARCHAR(50),
    supplier_code VARCHAR(100),
    trade_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID
);

-- 7. VÍNCULOS ITEM-FORNECEDOR
CREATE TABLE IF NOT EXISTS item_supplier_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    part_number VARCHAR(100),
    supplier_description TEXT,
    qr_code VARCHAR(100),
    barcode VARCHAR(100),
    cost_price DECIMAL(15,2) DEFAULT 0,
    lead_time_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. LOCALIZAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS stock_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('Fixo', 'Móvel')),
    address TEXT,
    responsible_person VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. CONTROLE DE ESTOQUE
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    current_quantity DECIMAL(10,3) DEFAULT 0,
    minimum_stock DECIMAL(10,3) DEFAULT 0,
    maximum_stock DECIMAL(10,3) DEFAULT 0,
    reorder_point DECIMAL(10,3) DEFAULT 0,
    economic_lot DECIMAL(10,3) DEFAULT 0,
    reserved_quantity DECIMAL(10,3) DEFAULT 0,
    consigned_quantity DECIMAL(10,3) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, location_id)
);

-- 10. MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id),
    location_id UUID NOT NULL REFERENCES stock_locations(id),
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('Entrada', 'Saída', 'Transferência', 'Devolução', 'Inventário')),
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    reference_document VARCHAR(100),
    notes TEXT,
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID
);

-- 11. KITS DE SERVIÇO
CREATE TABLE IF NOT EXISTS service_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    maintenance_type VARCHAR(100),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID
);

-- 12. ITENS DOS KITS DE SERVIÇO
CREATE TABLE IF NOT EXISTS service_kit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service_kit_id UUID NOT NULL REFERENCES service_kits(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    is_optional BOOLEAN DEFAULT false
);

-- 13. LISTAS DE PREÇOS
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    customer_company_id UUID REFERENCES customer_companies(id),
    cost_center VARCHAR(100),
    region VARCHAR(100),
    channel VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID
);

-- 14. ITENS DAS LISTAS DE PREÇOS
CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    unit_price DECIMAL(15,2) NOT NULL,
    margin_percentage DECIMAL(5,2) DEFAULT 0,
    min_quantity DECIMAL(10,3) DEFAULT 1,
    max_quantity DECIMAL(10,3),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    special_price DECIMAL(15,2),
    valid_from DATE,
    valid_until DATE
);

-- 15. CONTROLE DE ATIVOS
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID REFERENCES items(id),
    customer_company_id UUID REFERENCES customer_companies(id),
    asset_tag VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_asset_id UUID REFERENCES assets(id),
    hierarchy_level INTEGER DEFAULT 1,
    serial_number VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    acquisition_date DATE,
    warranty_start DATE,
    warranty_end DATE,
    location_description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    qr_code VARCHAR(100),
    rfid_tag VARCHAR(100),
    meter_type VARCHAR(50), -- 'horímetro', 'quilometragem', 'tempo_uso'
    current_meter_reading DECIMAL(15,3) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Ativo',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_items_tenant_id ON items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(active);
CREATE INDEX IF NOT EXISTS idx_inventory_item_location ON inventory(item_id, location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
CREATE INDEX IF NOT EXISTS idx_price_lists_tenant_id ON price_lists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_active ON price_lists(active);
CREATE INDEX IF NOT EXISTS idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_customer_company ON assets(customer_company_id);

-- INSERIR DADOS INICIAIS
INSERT INTO items (tenant_id, active, type, name, integration_code, description, unit_of_measure, group_category) VALUES
('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'Material', 'Parafuso M6x20', 'PAR-M6-20', 'Parafuso sextavado M6 x 20mm', 'UN', 'Parafusos'),
('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'Material', 'Óleo Hidráulico ISO 32', 'OLE-HID-32', 'Óleo hidráulico para sistemas industriais', 'L', 'Lubrificantes'),
('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'Serviço', 'Manutenção Preventiva', 'SRV-MP-001', 'Serviço de manutenção preventiva completa', 'HR', 'Serviços'),
('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'Material', 'Filtro de Ar Industrial', 'FLT-AR-001', 'Filtro de ar para equipamentos industriais', 'UN', 'Filtros'),
('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'Material', 'Rolamento SKF 6205', 'ROL-SKF-6205', 'Rolamento de esferas SKF 6205', 'UN', 'Rolamentos');

INSERT INTO suppliers (tenant_id, name, document_number, supplier_code, trade_name, contact_email, contact_phone, active) VALUES
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'SKF do Brasil Ltda', '12.345.678/0001-90', 'SKF-001', 'SKF Brasil', 'vendas@skf.com.br', '(11) 4567-8900', true),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Petrobras Distribuidora', '98.765.432/0001-10', 'PETRO-001', 'BR Distribuidora', 'comercial@br.com.br', '(11) 3456-7890', true),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Mann+Hummel Brasil', '11.222.333/0001-44', 'MANN-001', 'Mann+Hummel', 'vendas@mann-hummel.com', '(11) 2345-6789', true);

INSERT INTO customer_companies (tenant_id, name, document_number, contact_email, contact_phone, active) VALUES
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Metalúrgica Silva S.A.', '55.666.777/0001-88', 'compras@metalurgicasilva.com.br', '(11) 5678-9012', true),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Indústria Química ABC Ltda', '44.555.666/0001-77', 'suprimentos@quimicaabc.com.br', '(11) 6789-0123', true);

INSERT INTO stock_locations (tenant_id, name, type, address, responsible_person, active) VALUES
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Almoxarifado Central', 'Fixo', 'Rua Principal, 100 - São Paulo', 'João Silva', true),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Estoque Móvel Van 01', 'Móvel', 'Veículo de campo', 'Carlos Santos', true),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Depósito Regional Sul', 'Fixo', 'Av. Industrial, 500 - Porto Alegre', 'Maria Oliveira', true);

-- Inserir estoque inicial
INSERT INTO inventory (tenant_id, item_id, location_id, current_quantity, minimum_stock, maximum_stock, reorder_point) 
SELECT 
    '3f99462f-3621-4b1b-bea8-782acc50d62e',
    i.id,
    l.id,
    CASE 
        WHEN i.name LIKE '%Parafuso%' THEN 1000
        WHEN i.name LIKE '%Óleo%' THEN 50
        WHEN i.name LIKE '%Filtro%' THEN 25
        WHEN i.name LIKE '%Rolamento%' THEN 15
        ELSE 10
    END,
    CASE 
        WHEN i.name LIKE '%Parafuso%' THEN 200
        WHEN i.name LIKE '%Óleo%' THEN 10
        WHEN i.name LIKE '%Filtro%' THEN 5
        WHEN i.name LIKE '%Rolamento%' THEN 3
        ELSE 2
    END,
    CASE 
        WHEN i.name LIKE '%Parafuso%' THEN 2000
        WHEN i.name LIKE '%Óleo%' THEN 100
        WHEN i.name LIKE '%Filtro%' THEN 50
        WHEN i.name LIKE '%Rolamento%' THEN 30
        ELSE 20
    END,
    CASE 
        WHEN i.name LIKE '%Parafuso%' THEN 300
        WHEN i.name LIKE '%Óleo%' THEN 15
        WHEN i.name LIKE '%Filtro%' THEN 8
        WHEN i.name LIKE '%Rolamento%' THEN 5
        ELSE 3
    END
FROM items i, stock_locations l 
WHERE i.tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e' 
AND l.tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e'
AND i.type = 'Material'
AND l.name = 'Almoxarifado Central';

COMMIT;
