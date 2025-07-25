
-- MIGRAÇÃO COMPLETA MÓDULO PEÇAS E SERVIÇOS
-- Baseado em shared/schema-parts-services-complete.ts

BEGIN;

-- Criar ENUMs se não existirem
DO $$ BEGIN
    CREATE TYPE item_type AS ENUM ('material', 'service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE measurement_unit AS ENUM ('UN', 'M', 'M2', 'M3', 'KG', 'L', 'H', 'PC', 'CX', 'GL', 'SET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM ('entrada', 'saida', 'transferencia', 'ajuste', 'devolucao', 'inventario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_status AS ENUM ('ativo', 'inativo', 'manutencao', 'descartado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE link_type AS ENUM ('item_item', 'item_cliente', 'item_fornecedor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ================================
-- TABELA PRINCIPAL: ITENS
-- ================================
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Campos obrigatórios conforme requisitos
    active BOOLEAN NOT NULL DEFAULT true,
    type item_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    integration_code VARCHAR(100),
    description TEXT,
    measurement_unit measurement_unit DEFAULT 'UN',
    maintenance_plan TEXT,
    "group" VARCHAR(100),
    default_checklist JSONB,
    
    -- Campos técnicos adicionais
    internal_code VARCHAR(100),
    manufacturer_code VARCHAR(100),
    barcode VARCHAR(100),
    qr_code VARCHAR(255),
    sku VARCHAR(100),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    
    -- Preços e custos
    cost_price DECIMAL(12,2),
    sale_price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Classificações
    abc_classification VARCHAR(1),
    criticality VARCHAR(20),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Especificações técnicas
    specifications JSONB,
    technical_details TEXT,
    weight DECIMAL(10,3),
    dimensions JSONB,
    
    -- Estoque
    minimum_stock DECIMAL(10,2) DEFAULT 0,
    maximum_stock DECIMAL(10,2),
    reorder_point DECIMAL(10,2),
    economic_lot DECIMAL(10,2),
    
    -- Garantia e validade
    warranty_period INTEGER,
    has_expiration BOOLEAN DEFAULT false,
    shelf_life INTEGER,
    
    -- Metadados
    tags JSONB,
    custom_fields JSONB,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID
);

-- ================================
-- ANEXOS DE ITENS (UPLOAD DE ARQUIVOS)
-- ================================
CREATE TABLE IF NOT EXISTS item_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL,
    
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    category VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID,
    
    CONSTRAINT fk_item_attachments_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- ================================
-- VÍNCULOS DE ITENS (REQUISITO CORE)
-- ================================
CREATE TABLE IF NOT EXISTS item_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    link_type link_type NOT NULL,
    parent_item_id UUID NOT NULL,
    
    -- Para vínculos item-item
    linked_item_id UUID,
    
    -- Para vínculos item-cliente (EMPRESAS CLIENTES)
    customer_id UUID,
    customer_alias VARCHAR(255),
    customer_sku VARCHAR(100),
    customer_barcode VARCHAR(100),
    customer_qr_code VARCHAR(255),
    is_asset BOOLEAN DEFAULT false,
    
    -- Para vínculos item-fornecedor (FORNECEDORES)
    supplier_id UUID,
    part_number VARCHAR(100),
    supplier_description TEXT,
    supplier_qr_code VARCHAR(255),
    supplier_barcode VARCHAR(100),
    supplier_price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    minimum_order_quantity DECIMAL(10,2),
    delivery_time_days INTEGER,
    is_preferred BOOLEAN DEFAULT false,
    
    -- Metadados do vínculo
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    custom_fields JSONB,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT fk_item_links_parent FOREIGN KEY (parent_item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_links_linked FOREIGN KEY (linked_item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- ================================
-- FORNECEDORES COMPLETO
-- ================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    supplier_code VARCHAR(50),
    trade_name VARCHAR(255),
    document_number VARCHAR(20),
    document_type VARCHAR(10),
    
    -- Contato
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Endereço
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'BR',
    zip_code VARCHAR(10),
    
    -- Dados comerciais
    payment_terms VARCHAR(100),
    delivery_time INTEGER,
    minimum_order DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    category VARCHAR(100),
    rating DECIMAL(3,2),
    
    -- Status e metadados
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    custom_fields JSONB,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID
);

-- ================================
-- LOCALIZAÇÕES DE ESTOQUE (MULTI-LOCALIZAÇÃO)
-- ================================
CREATE TABLE IF NOT EXISTS stock_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    location_type VARCHAR(20) DEFAULT 'warehouse',
    
    -- Hierarquia
    parent_location_id UUID,
    location_path VARCHAR(500),
    level INTEGER DEFAULT 1,
    
    -- Endereço e coordenadas
    address TEXT,
    coordinates JSONB,
    
    -- Capacidade e controles
    capacity DECIMAL(12,2),
    allow_negative_stock BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Responsável
    manager_id UUID,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT fk_stock_locations_parent FOREIGN KEY (parent_location_id) REFERENCES stock_locations(id)
);

-- ================================
-- NÍVEIS DE ESTOQUE
-- ================================
CREATE TABLE IF NOT EXISTS stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL,
    location_id UUID NOT NULL,
    
    -- Quantidades
    current_quantity DECIMAL(10,2) DEFAULT 0,
    reserved_quantity DECIMAL(10,2) DEFAULT 0,
    available_quantity DECIMAL(10,2) DEFAULT 0,
    
    -- Níveis de controle
    minimum_stock DECIMAL(10,2) DEFAULT 0,
    maximum_stock DECIMAL(10,2),
    reorder_point DECIMAL(10,2),
    safety_stock DECIMAL(10,2),
    
    -- Custos
    average_cost DECIMAL(12,2),
    last_cost DECIMAL(12,2),
    total_value DECIMAL(12,2),
    
    -- Controle de datas
    last_movement_date TIMESTAMP,
    last_count_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    CONSTRAINT fk_stock_levels_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_levels_location FOREIGN KEY (location_id) REFERENCES stock_locations(id) ON DELETE CASCADE,
    CONSTRAINT uk_stock_levels_item_location UNIQUE (item_id, location_id)
);

-- ================================
-- MOVIMENTAÇÕES DE ESTOQUE
-- ================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Referências
    item_id UUID NOT NULL,
    from_location_id UUID,
    to_location_id UUID,
    
    -- Tipo e dados da movimentação
    movement_type movement_type NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    
    -- Referências de origem
    reference_type VARCHAR(20),
    reference_id UUID,
    reference_number VARCHAR(50),
    
    -- Lote e rastreabilidade
    batch_number VARCHAR(50),
    serial_number VARCHAR(100),
    expiration_date TIMESTAMP,
    
    -- Metadados
    reason TEXT,
    notes TEXT,
    
    -- Aprovação
    requires_approval BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    approved_by UUID,
    approved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID NOT NULL,
    
    CONSTRAINT fk_stock_movements_item FOREIGN KEY (item_id) REFERENCES items(id),
    CONSTRAINT fk_stock_movements_from FOREIGN KEY (from_location_id) REFERENCES stock_locations(id),
    CONSTRAINT fk_stock_movements_to FOREIGN KEY (to_location_id) REFERENCES stock_locations(id)
);

-- ================================
-- CONTROLE DE ATIVOS (MÓDULO 7)
-- ================================
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Dados básicos
    asset_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Hierarquia
    parent_asset_id UUID,
    asset_path VARCHAR(500),
    level INTEGER DEFAULT 1,
    
    -- Classificação
    category VARCHAR(100),
    subcategory VARCHAR(100),
    criticality VARCHAR(20),
    
    -- Dados técnicos
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(100),
    manufacture_date TIMESTAMP,
    purchase_date TIMESTAMP,
    installation_date TIMESTAMP,
    warranty_expiration TIMESTAMP,
    
    -- Localização
    current_location_id UUID,
    coordinates JSONB,
    
    -- Status e operação
    status asset_status DEFAULT 'ativo',
    operational_status VARCHAR(20),
    
    -- Medidores
    has_hour_meter BOOLEAN DEFAULT false,
    current_hours DECIMAL(10,2),
    has_km_meter BOOLEAN DEFAULT false,
    current_km DECIMAL(10,2),
    
    -- Custos
    purchase_value DECIMAL(12,2),
    current_value DECIMAL(12,2),
    residual_value DECIMAL(12,2),
    
    -- Metadados
    specifications JSONB,
    custom_fields JSONB,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT fk_assets_parent FOREIGN KEY (parent_asset_id) REFERENCES assets(id),
    CONSTRAINT fk_assets_location FOREIGN KEY (current_location_id) REFERENCES stock_locations(id)
);

-- ================================
-- LISTA DE PREÇOS UNITÁRIOS (MÓDULO 8)
-- ================================
CREATE TABLE IF NOT EXISTS price_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Vigência
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    
    -- Segmentação
    customer_id UUID,
    contract_id UUID,
    cost_center_id UUID,
    region VARCHAR(100),
    channel VARCHAR(100),
    
    -- Configurações
    currency VARCHAR(3) DEFAULT 'BRL',
    includes_tax BOOLEAN DEFAULT false,
    default_margin DECIMAL(5,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID
);

CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    price_list_id UUID NOT NULL,
    item_id UUID NOT NULL,
    
    -- Preços
    unit_price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2),
    margin DECIMAL(5,2),
    
    -- Descontos por escala
    minimum_quantity DECIMAL(10,2) DEFAULT 1,
    discount_percentage DECIMAL(5,2),
    
    -- Configurações
    is_special_price BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    CONSTRAINT fk_price_list_items_list FOREIGN KEY (price_list_id) REFERENCES price_list(id) ON DELETE CASCADE,
    CONSTRAINT fk_price_list_items_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- ================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ================================
-- Índices para itens
CREATE INDEX IF NOT EXISTS idx_items_tenant_type ON items(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_items_tenant_active ON items(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_items_integration_code ON items(integration_code);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);

-- Índices para vínculos
CREATE INDEX IF NOT EXISTS idx_item_links_tenant_type ON item_links(tenant_id, link_type);
CREATE INDEX IF NOT EXISTS idx_item_links_parent ON item_links(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_item_links_customer ON item_links(customer_id);
CREATE INDEX IF NOT EXISTS idx_item_links_supplier ON item_links(supplier_id);

-- Índices para estoque
CREATE INDEX IF NOT EXISTS idx_stock_levels_tenant_item ON stock_levels(tenant_id, item_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_location ON stock_levels(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_item ON stock_movements(tenant_id, item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);

-- Índices para fornecedores
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_active ON suppliers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_document ON suppliers(document_number);

-- Índices para anexos
CREATE INDEX IF NOT EXISTS idx_item_attachments_tenant_item ON item_attachments(tenant_id, item_id);

-- ================================
-- DADOS INICIAIS OBRIGATÓRIOS
-- ================================

-- Inserir localização de estoque padrão para cada tenant
INSERT INTO stock_locations (tenant_id, name, code, description, location_type, is_active)
SELECT 
    t.id as tenant_id,
    'Estoque Principal' as name,
    'PRINCIPAL' as code,
    'Estoque principal da empresa' as description,
    'warehouse' as location_type,
    true as is_active
FROM (
    SELECT DISTINCT tenant_id as id 
    FROM public.tenants 
    WHERE tenant_id IS NOT NULL
) t
ON CONFLICT DO NOTHING;

-- Inserir algumas unidades de medida como itens de serviço básicos
INSERT INTO items (tenant_id, type, name, description, measurement_unit, active, category)
SELECT 
    t.id as tenant_id,
    'service' as type,
    'Hora Técnica' as name,
    'Serviço de mão de obra técnica' as description,
    'H' as measurement_unit,
    true as active,
    'Serviços' as category
FROM (
    SELECT DISTINCT tenant_id as id 
    FROM public.tenants 
    WHERE tenant_id IS NOT NULL
) t
ON CONFLICT DO NOTHING;

INSERT INTO items (tenant_id, type, name, description, measurement_unit, active, category)
SELECT 
    t.id as tenant_id,
    'service' as type,
    'Deslocamento' as name,
    'Serviço de deslocamento para atendimento' as description,
    'KM' as measurement_unit,
    true as active,
    'Serviços' as category
FROM (
    SELECT DISTINCT tenant_id as id 
    FROM public.tenants 
    WHERE tenant_id IS NOT NULL
) t
ON CONFLICT DO NOTHING;

COMMIT;
