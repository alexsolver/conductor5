
-- Create item_hierarchy table for all tenant schemas
DO $$
DECLARE
    schema_record RECORD;
    schema_name TEXT;
BEGIN
    -- Get all tenant schemas
    FOR schema_record IN 
        SELECT schema_name as name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        schema_name := schema_record.name;
        
        -- Create item_hierarchy table if it doesn't exist
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS "%s".item_hierarchy (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                parent_item_id UUID NOT NULL,
                child_item_id UUID NOT NULL,
                "order" INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                created_by UUID,
                updated_at TIMESTAMP DEFAULT NOW(),
                updated_by UUID,
                
                -- Foreign key constraints
                CONSTRAINT fk_parent_item FOREIGN KEY (parent_item_id) 
                    REFERENCES "%s".items(id) ON DELETE CASCADE,
                CONSTRAINT fk_child_item FOREIGN KEY (child_item_id) 
                    REFERENCES "%s".items(id) ON DELETE CASCADE,
                    
                -- Unique constraint to prevent duplicate relationships
                CONSTRAINT unique_parent_child UNIQUE (parent_item_id, child_item_id)
            );
        ', schema_name, schema_name, schema_name);
        
        -- Create indexes for performance
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%s_item_hierarchy_parent 
            ON "%s".item_hierarchy(parent_item_id);
        ', replace(schema_name, '-', '_'), schema_name);
        
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%s_item_hierarchy_child 
            ON "%s".item_hierarchy(child_item_id);
        ', replace(schema_name, '-', '_'), schema_name);
        
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%s_item_hierarchy_tenant 
            ON "%s".item_hierarchy(tenant_id);
        ', replace(schema_name, '-', '_'), schema_name);
        
        RAISE NOTICE 'Created item_hierarchy table for schema: %', schema_name;
    END LOOP;
END $$;
