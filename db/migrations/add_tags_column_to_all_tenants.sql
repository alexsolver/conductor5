
-- Migration to add tags column to all tenant schemas
-- This migration adds a tags JSONB column to the tickets table in all tenant schemas

DO $$
DECLARE
    tenant_schema TEXT;
BEGIN
    -- Loop through all tenant schemas
    FOR tenant_schema IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        -- Add tags column to each tenant's tickets table
        EXECUTE format(
            'ALTER TABLE %I.tickets ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT ''[]''::jsonb',
            tenant_schema
        );
        
        RAISE NOTICE 'Added tags column to %.tickets', tenant_schema;
    END LOOP;
END $$;

-- Add comment to document the column
DO $$
DECLARE
    tenant_schema TEXT;
BEGIN
    FOR tenant_schema IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        EXECUTE format(
            'COMMENT ON COLUMN %I.tickets.tags IS ''Tags for ticket categorization stored as JSON array''',
            tenant_schema
        );
    END LOOP;
END $$;
