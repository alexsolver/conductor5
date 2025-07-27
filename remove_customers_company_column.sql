
-- Migration: Remove company column from customers table
-- This prevents confusion with the integrated customer companies system

-- For all tenant schemas, remove the company column
DO $$
DECLARE
    tenant_schema TEXT;
    tenant_cursor CURSOR FOR 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%';
BEGIN
    FOR tenant_record IN tenant_cursor LOOP
        tenant_schema := tenant_record.schema_name;
        
        -- Check if the company column exists before dropping it
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = tenant_schema 
            AND table_name = 'customers' 
            AND column_name = 'company'
        ) THEN
            EXECUTE format('ALTER TABLE %I.customers DROP COLUMN company', tenant_schema);
            RAISE NOTICE 'Removed company column from %.customers', tenant_schema;
        END IF;
    END LOOP;
END $$;
