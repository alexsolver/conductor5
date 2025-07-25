
BEGIN;

-- Adicionar campos faltantes na tabela items
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS default_maintenance_plan TEXT,
ADD COLUMN IF NOT EXISTS item_group VARCHAR(100),
ADD COLUMN IF NOT EXISTS default_checklist TEXT;

-- Criar tabela de vínculos item-cliente
CREATE TABLE IF NOT EXISTS item_customer_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    nickname VARCHAR(255),
    customer_sku VARCHAR(100),
    barcode VARCHAR(255),
    qr_code VARCHAR(255),
    is_asset BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID
);

-- Criar tabela de vínculos item-fornecedor
CREATE TABLE IF NOT EXISTS item_supplier_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    part_number VARCHAR(100),
    supplier_description TEXT,
    supplier_qr_code VARCHAR(255),
    supplier_barcode VARCHAR(255),
    unit_price DECIMAL(10,2),
    minimum_order_quantity DECIMAL(10,2),
    lead_time INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_preferred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID,
    updated_by UUID
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_item_customer_links_tenant_id ON item_customer_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_customer_links_item_id ON item_customer_links(item_id);
CREATE INDEX IF NOT EXISTS idx_item_customer_links_customer_id ON item_customer_links(customer_id);

CREATE INDEX IF NOT EXISTS idx_item_supplier_links_tenant_id ON item_supplier_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_supplier_links_item_id ON item_supplier_links(item_id);
CREATE INDEX IF NOT EXISTS idx_item_supplier_links_supplier_id ON item_supplier_links(supplier_id);

-- Comentários nas tabelas
COMMENT ON TABLE item_customer_links IS 'Vínculos entre itens e clientes com informações específicas por cliente';
COMMENT ON TABLE item_supplier_links IS 'Vínculos entre itens e fornecedores com informações comerciais específicas';

COMMIT;
