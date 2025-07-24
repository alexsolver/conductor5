-- Create Items module tables in all tenant schemas
-- This script creates the 5 tables for the Items module

DO $$
DECLARE
    tenant_record RECORD;
    schema_name TEXT;
BEGIN
    -- Loop through all tenant schemas
    FOR tenant_record IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name ~ '^tenant_[a-f0-9]{8}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{12}$'
    LOOP
        schema_name := tenant_record.schema_name;
        
        RAISE NOTICE 'Creating Items tables in schema: %', schema_name;
        
        -- Create items table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true,
                type VARCHAR(20) NOT NULL CHECK (type IN (''material'', ''service'')),
                name VARCHAR(255) NOT NULL,
                integration_code VARCHAR(100),
                description TEXT,
                unit_of_measure VARCHAR(50),
                default_maintenance_plan VARCHAR(255),
                "group" VARCHAR(100),
                default_checklist TEXT,
                created_by_id UUID NOT NULL,
                updated_by_id UUID,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        ', schema_name);
        
        -- Create item_attachments table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_attachments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                item_id UUID NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size BIGINT NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                created_by_id UUID NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES %I.items(id) ON DELETE CASCADE
            );
        ', schema_name, schema_name);
        
        -- Create item_links table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_links (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                parent_item_id UUID NOT NULL,
                child_item_id UUID NOT NULL,
                link_type VARCHAR(50) NOT NULL DEFAULT ''component'',
                quantity DECIMAL(10,3) DEFAULT 1.0,
                description TEXT,
                created_by_id UUID NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_item_id) REFERENCES %I.items(id) ON DELETE CASCADE,
                FOREIGN KEY (child_item_id) REFERENCES %I.items(id) ON DELETE CASCADE,
                UNIQUE (tenant_id, parent_item_id, child_item_id, link_type)
            );
        ', schema_name, schema_name, schema_name);
        
        -- Create item_customer_links table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_customer_links (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                item_id UUID NOT NULL,
                customer_company_id UUID NOT NULL,
                nickname VARCHAR(255),
                sku VARCHAR(100),
                barcode VARCHAR(255),
                qr_code VARCHAR(255),
                is_asset BOOLEAN NOT NULL DEFAULT false,
                created_by_id UUID NOT NULL,
                updated_by_id UUID,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES %I.items(id) ON DELETE CASCADE
            );
        ', schema_name, schema_name);
        
        -- Create item_supplier_links table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_supplier_links (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                item_id UUID NOT NULL,
                supplier_name VARCHAR(255) NOT NULL,
                part_number VARCHAR(100),
                description TEXT,
                barcode VARCHAR(255),
                qr_code VARCHAR(255),
                created_by_id UUID NOT NULL,
                updated_by_id UUID,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES %I.items(id) ON DELETE CASCADE
            );
        ', schema_name, schema_name);
        
        -- Create indexes for performance
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_items_tenant_id ON %I.items(tenant_id);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_items_type ON %I.items(type);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_items_active ON %I.items(is_active);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_items_group ON %I.items("group");', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_items_integration_code ON %I.items(integration_code);', replace(schema_name, '-', '_'), schema_name);
        
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_attachments_tenant_id ON %I.item_attachments(tenant_id);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_attachments_item_id ON %I.item_attachments(item_id);', replace(schema_name, '-', '_'), schema_name);
        
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_links_tenant_id ON %I.item_links(tenant_id);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_links_parent_item_id ON %I.item_links(parent_item_id);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_links_child_item_id ON %I.item_links(child_item_id);', replace(schema_name, '-', '_'), schema_name);
        
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_customer_links_tenant_id ON %I.item_customer_links(tenant_id);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_customer_links_item_id ON %I.item_customer_links(item_id);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_customer_links_customer_id ON %I.item_customer_links(customer_company_id);', replace(schema_name, '-', '_'), schema_name);
        
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_supplier_links_tenant_id ON %I.item_supplier_links(tenant_id);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_supplier_links_item_id ON %I.item_supplier_links(item_id);', replace(schema_name, '-', '_'), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_supplier_links_supplier_name ON %I.item_supplier_links(supplier_name);', replace(schema_name, '-', '_'), schema_name);
        
        RAISE NOTICE 'Completed Items tables creation for schema: %', schema_name;
    END LOOP;
END $$;

-- Insert some test data in the main tenant schema (3f99462f-3621-4b1b-bea8-782acc50d62e)
INSERT INTO tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.items (
    tenant_id, 
    is_active, 
    type, 
    name, 
    integration_code, 
    description, 
    unit_of_measure, 
    "group",
    created_by_id
) VALUES 
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'material', 'Parafuso Phillips M6x20', 'PAR001', 'Parafuso Phillips cabeça panela M6 x 20mm', 'un', 'Fixação', '3f99462f-3621-4b1b-bea8-782acc50d62e'),
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'material', 'Cabo Ethernet Cat6', 'CAB001', 'Cabo de rede Ethernet categoria 6 - 1 metro', 'm', 'Informática', '3f99462f-3621-4b1b-bea8-782acc50d62e'),
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'service', 'Instalação de Software', 'SRV001', 'Serviço de instalação e configuração de software', 'hr', 'Informática', '3f99462f-3621-4b1b-bea8-782acc50d62e'),
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'material', 'Tinta Acrílica Branca', 'TIN001', 'Tinta acrílica premium cor branca 18L', 'L', 'Pintura', '3f99462f-3621-4b1b-bea8-782acc50d62e'),
    ('3f99462f-3621-4b1b-bea8-782acc50d62e', true, 'service', 'Manutenção Preventiva', 'SRV002', 'Serviço de manutenção preventiva em equipamentos', 'hr', 'Manutenção', '3f99462f-3621-4b1b-bea8-782acc50d62e')
ON CONFLICT DO NOTHING;