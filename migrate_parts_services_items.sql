
-- Migração para o módulo Peças e Serviços - Gestão de Itens
-- Criado em: 2025-01-25
-- Objetivo: Implementar tabelas base para gestão de itens (peças e serviços)

-- 1. TABELA PRINCIPAL DE ITENS
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    type VARCHAR(20) NOT NULL CHECK (type IN ('material', 'service')),
    name VARCHAR(255) NOT NULL,
    integration_code VARCHAR(100),
    description TEXT,
    unit_of_measure VARCHAR(50),
    default_maintenance_plan VARCHAR(255),
    item_group VARCHAR(100),
    default_checklist TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Índices
    CONSTRAINT unique_integration_code_per_tenant UNIQUE (tenant_id, integration_code)
);

-- 2. TABELA DE ANEXOS DOS ITENS
CREATE TABLE IF NOT EXISTS item_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID,
    
    -- Índices
    INDEX idx_item_attachments_item_id (item_id),
    INDEX idx_item_attachments_tenant_id (tenant_id)
);

-- 3. TABELA DE VÍNCULOS ENTRE ITENS
CREATE TABLE IF NOT EXISTS item_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    linked_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL DEFAULT 'related',
    quantity DECIMAL(10,3),
    unit_of_measure VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Índices
    INDEX idx_item_links_parent_item (parent_item_id),
    INDEX idx_item_links_linked_item (linked_item_id),
    INDEX idx_item_links_tenant_id (tenant_id),
    
    -- Constraint para evitar auto-referência
    CONSTRAINT no_self_reference CHECK (parent_item_id != linked_item_id),
    
    -- Constraint para evitar duplicatas
    CONSTRAINT unique_item_link UNIQUE (tenant_id, parent_item_id, linked_item_id, link_type)
);

-- 4. TABELA DE VÍNCULOS COM EMPRESAS CLIENTES
CREATE TABLE IF NOT EXISTS item_customer_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL, -- Referência para tabela de clientes
    nickname VARCHAR(255),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    qr_code VARCHAR(255),
    is_asset BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Índices
    INDEX idx_item_customer_links_item_id (item_id),
    INDEX idx_item_customer_links_customer_id (customer_id),
    INDEX idx_item_customer_links_tenant_id (tenant_id),
    INDEX idx_item_customer_links_sku (sku),
    INDEX idx_item_customer_links_barcode (barcode),
    
    -- Constraint para evitar duplicatas
    CONSTRAINT unique_item_customer_link UNIQUE (tenant_id, item_id, customer_id)
);

-- 5. TABELA DE VÍNCULOS COM FORNECEDORES
CREATE TABLE IF NOT EXISTS item_supplier_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL, -- Referência para tabela de fornecedores
    part_number VARCHAR(100),
    supplier_description TEXT,
    qr_code VARCHAR(255),
    barcode VARCHAR(100),
    lead_time_days INTEGER,
    minimum_order_quantity DECIMAL(10,3),
    unit_price DECIMAL(12,4),
    currency VARCHAR(3) DEFAULT 'BRL',
    is_preferred BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Índices
    INDEX idx_item_supplier_links_item_id (item_id),
    INDEX idx_item_supplier_links_supplier_id (supplier_id),
    INDEX idx_item_supplier_links_tenant_id (tenant_id),
    INDEX idx_item_supplier_links_part_number (part_number),
    INDEX idx_item_supplier_links_barcode (barcode),
    
    -- Constraint para evitar duplicatas
    CONSTRAINT unique_item_supplier_link UNIQUE (tenant_id, item_id, supplier_id, part_number)
);

-- 6. TABELA DE CATEGORIAS/GRUPOS DE ITENS
CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES item_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Índices
    INDEX idx_item_categories_tenant_id (tenant_id),
    INDEX idx_item_categories_parent_id (parent_category_id),
    
    -- Constraint para evitar duplicatas
    CONSTRAINT unique_category_name_per_tenant UNIQUE (tenant_id, name, parent_category_id)
);

-- 7. ATUALIZAR TABELA DE ITENS PARA INCLUIR CATEGORIA
ALTER TABLE items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES item_categories(id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);

-- 8. ÍNDICES ADICIONAIS PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_items_tenant_id ON items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(active);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_integration_code ON items(integration_code);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at);

-- 9. TRIGGERS PARA UPDATE_AT AUTOMÁTICO
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_customer_links_updated_at 
    BEFORE UPDATE ON item_customer_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_supplier_links_updated_at 
    BEFORE UPDATE ON item_supplier_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_categories_updated_at 
    BEFORE UPDATE ON item_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. COMENTÁRIOS NAS TABELAS
COMMENT ON TABLE items IS 'Tabela principal para gestão de itens (peças e serviços)';
COMMENT ON TABLE item_attachments IS 'Anexos dos itens (documentos, imagens, etc.)';
COMMENT ON TABLE item_links IS 'Vínculos entre itens (relacionamentos)';
COMMENT ON TABLE item_customer_links IS 'Vínculos dos itens com empresas clientes';
COMMENT ON TABLE item_supplier_links IS 'Vínculos dos itens com fornecedores';
COMMENT ON TABLE item_categories IS 'Categorias hierárquicas dos itens';

-- 11. DADOS INICIAIS PARA CATEGORIAS
INSERT INTO item_categories (tenant_id, name, description, parent_category_id) VALUES
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Peças Mecânicas', 'Componentes mecânicos diversos', NULL),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Peças Elétricas', 'Componentes elétricos e eletrônicos', NULL),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Serviços de Manutenção', 'Serviços diversos de manutenção', NULL),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Consumíveis', 'Itens de consumo regular', NULL)
ON CONFLICT (tenant_id, name, parent_category_id) DO NOTHING;

-- 12. DADOS INICIAIS PARA ITENS (CONFORME REQUISITO - SEM MOCK)
INSERT INTO items (tenant_id, active, type, name, integration_code, description, unit_of_measure, item_group, category_id) 
SELECT 
    '3f99462f-3621-4b1b-bea8-782acc50d62e',
    true,
    'material',
    'Filtro de Óleo',
    'FO-001',
    'Filtro de óleo para motores diesel',
    'UNIDADE',
    'Filtros',
    id
FROM item_categories 
WHERE tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e' AND name = 'Peças Mecânicas'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO items (tenant_id, active, type, name, integration_code, description, unit_of_measure, item_group, category_id) 
SELECT 
    '3f99462f-3621-4b1b-bea8-782acc50d62e',
    true,
    'material',
    'Correia Dentada',
    'CD-001',
    'Correia dentada para sincronismo',
    'UNIDADE',
    'Correias',
    id
FROM item_categories 
WHERE tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e' AND name = 'Peças Mecânicas'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO items (tenant_id, active, type, name, integration_code, description, unit_of_measure, item_group, category_id) 
SELECT 
    '3f99462f-3621-4b1b-bea8-782acc50d62e',
    true,
    'service',
    'Manutenção Preventiva Motor',
    'MPM-001',
    'Serviço completo de manutenção preventiva em motores',
    'HORA',
    'Manutenção Preventiva',
    id
FROM item_categories 
WHERE tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e' AND name = 'Serviços de Manutenção'
LIMIT 1
ON CONFLICT DO NOTHING;

COMMIT;
