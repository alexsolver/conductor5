-- MIGRAÇÃO: MÓDULO PEÇAS E SERVIÇOS - ITENS
-- Data: 25/01/2025
-- Descrição: Implementação completa do módulo de gestão de itens

BEGIN;

-- 1. TABELA DE CATEGORIAS DE ITENS
CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT fk_item_categories_parent FOREIGN KEY (parent_category_id) REFERENCES item_categories(id),
    CONSTRAINT unique_category_name_per_tenant UNIQUE(tenant_id, name, parent_category_id)
);

-- 2. TABELA PRINCIPAL DE ITENS
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT unique_integration_code_per_tenant UNIQUE(tenant_id, integration_code)
);

-- 3. TABELA DE ANEXOS DOS ITENS
CREATE TABLE IF NOT EXISTS item_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID,
    CONSTRAINT fk_item_attachments_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- 4. TABELA DE VÍNCULOS ENTRE ITENS
CREATE TABLE IF NOT EXISTS item_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_item_id UUID NOT NULL,
    linked_item_id UUID NOT NULL,
    link_type VARCHAR(50) NOT NULL DEFAULT 'related',
    quantity DECIMAL(10,3),
    unit_of_measure VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    CONSTRAINT fk_item_links_parent FOREIGN KEY (parent_item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_links_linked FOREIGN KEY (linked_item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT unique_item_link UNIQUE(tenant_id, parent_item_id, linked_item_id, link_type),
    CONSTRAINT no_self_reference CHECK (parent_item_id != linked_item_id)
);

-- 5. TABELA DE VÍNCULOS COM EMPRESAS CLIENTES
CREATE TABLE IF NOT EXISTS item_customer_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    nickname VARCHAR(255),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    qr_code VARCHAR(255),
    is_asset BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT fk_item_customer_links_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT unique_item_customer_link UNIQUE(tenant_id, item_id, customer_id)
);

-- 6. TABELA DE VÍNCULOS COM FORNECEDORES
CREATE TABLE IF NOT EXISTS item_supplier_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    part_number VARCHAR(100),
    supplier_description TEXT,
    qr_code VARCHAR(255),
    barcode VARCHAR(100),
    lead_time_days INTEGER,
    minimum_order_quantity DECIMAL(10,3),
    unit_price DECIMAL(12,4),
    currency VARCHAR(3) DEFAULT 'BRL',
    is_preferred BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT fk_item_supplier_links_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT unique_item_supplier_link UNIQUE(tenant_id, item_id, supplier_id, part_number)
);

-- CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_item_categories_tenant_id ON item_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_categories_parent_id ON item_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_items_tenant_id ON items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(active);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_integration_code ON items(integration_code);
-- Índice removido: category_id não existe na estrutura atual
CREATE INDEX IF NOT EXISTS idx_item_attachments_item_id ON item_attachments(item_id);
CREATE INDEX IF NOT EXISTS idx_item_attachments_tenant_id ON item_attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_links_parent_item ON item_links(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_item_links_linked_item ON item_links(linked_item_id);
CREATE INDEX IF NOT EXISTS idx_item_links_tenant_id ON item_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_customer_links_item_id ON item_customer_links(item_id);
CREATE INDEX IF NOT EXISTS idx_item_customer_links_customer_id ON item_customer_links(customer_id);
CREATE INDEX IF NOT EXISTS idx_item_customer_links_tenant_id ON item_customer_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_supplier_links_item_id ON item_supplier_links(item_id);
CREATE INDEX IF NOT EXISTS idx_item_supplier_links_supplier_id ON item_supplier_links(supplier_id);
CREATE INDEX IF NOT EXISTS idx_item_supplier_links_tenant_id ON item_supplier_links(tenant_id);

-- TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_categories_updated_at BEFORE UPDATE ON item_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_customer_links_updated_at BEFORE UPDATE ON item_customer_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_supplier_links_updated_at BEFORE UPDATE ON item_supplier_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- COMENTÁRIOS DAS TABELAS
COMMENT ON TABLE items IS 'Tabela principal de itens (peças e serviços)';
COMMENT ON TABLE item_categories IS 'Categorias hierárquicas de itens';
COMMENT ON TABLE item_attachments IS 'Anexos de arquivos dos itens';
COMMENT ON TABLE item_links IS 'Vínculos entre itens (relacionamentos)';
COMMENT ON TABLE item_customer_links IS 'Vínculos de itens com clientes';
COMMENT ON TABLE item_supplier_links IS 'Vínculos de itens com fornecedores';

-- DADOS INICIAIS - CATEGORIAS
INSERT INTO item_categories (tenant_id, name, description, parent_category_id, is_active)
VALUES 
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Peças Mecânicas', 'Peças e componentes mecânicos', NULL, true),
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Peças Elétricas', 'Componentes elétricos e eletrônicos', NULL, true),
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Serviços de Manutenção', 'Serviços relacionados a manutenção', NULL, true),
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Consumíveis', 'Materiais de consumo geral', NULL, true);

-- DADOS INICIAIS - ITENS EXEMPLO
INSERT INTO items (tenant_id, active, type, name, integration_code, description, unit_of_measure, item_group)
VALUES 
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'material', 'Parafuso Phillips M6x20', 'PAR001', 'Parafuso Phillips cabeça chata M6 x 20mm', 'UN', 'PARAFUSOS'),
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'material', 'Cabo Elétrico 2,5mm²', 'CAB001', 'Cabo elétrico flexível 2,5mm² isolação PVC', 'MT', 'CABOS'),
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'service', 'Manutenção Preventiva Mensal', 'SRV001', 'Serviço de manutenção preventiva mensal completa', 'HR', 'MANUTENCAO');

COMMIT;