
-- Migration: Create Item Groups and Hierarchy Tables
-- This script creates the new item_groups, item_group_memberships, and item_hierarchy tables

DO $$
DECLARE
    tenant_record RECORD;
    schema_name TEXT;
BEGIN
    -- Loop through all tenant schemas
    FOR tenant_record IN 
        SELECT schema_name FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        schema_name := tenant_record.schema_name;
        
        RAISE NOTICE 'Creating item groups and hierarchy tables in schema: %', schema_name;
        
        -- Create item_groups table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_groups (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                color VARCHAR(7) DEFAULT ''#3B82F6'',
                icon VARCHAR(50) DEFAULT ''folder'',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                created_by UUID,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_by UUID
            )', schema_name);
        
        -- Create item_group_memberships table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_group_memberships (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                item_id UUID NOT NULL,
                group_id UUID NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                created_by UUID,
                FOREIGN KEY (item_id) REFERENCES %I.items(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES %I.item_groups(id) ON DELETE CASCADE
            )', schema_name, schema_name, schema_name);
        
        -- Create item_hierarchy table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_hierarchy (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                parent_item_id UUID NOT NULL,
                child_item_id UUID NOT NULL,
                "order" INTEGER DEFAULT 0,
                notes TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                created_by UUID,
                FOREIGN KEY (parent_item_id) REFERENCES %I.items(id) ON DELETE CASCADE,
                FOREIGN KEY (child_item_id) REFERENCES %I.items(id) ON DELETE CASCADE,
                UNIQUE(parent_item_id, child_item_id, tenant_id)
            )', schema_name, schema_name, schema_name);
        
        -- Create indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_groups_tenant_id ON %I.item_groups(tenant_id)', 
            replace(schema_name, 'tenant_', ''), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_group_memberships_item_id ON %I.item_group_memberships(item_id)', 
            replace(schema_name, 'tenant_', ''), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_group_memberships_group_id ON %I.item_group_memberships(group_id)', 
            replace(schema_name, 'tenant_', ''), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_hierarchy_parent_item_id ON %I.item_hierarchy(parent_item_id)', 
            replace(schema_name, 'tenant_', ''), schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_item_hierarchy_child_item_id ON %I.item_hierarchy(child_item_id)', 
            replace(schema_name, 'tenant_', ''), schema_name);
        
        RAISE NOTICE 'Successfully created tables and indexes in schema: %', schema_name;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully for all tenant schemas';
END
$$;
