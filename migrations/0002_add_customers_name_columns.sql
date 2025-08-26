
-- Add missing first_name and last_name columns to customers table in all tenant schemas
DO $$
DECLARE
    tenant_schema TEXT;
    tenant_cursor CURSOR FOR 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%';
BEGIN
    -- Fix main customers table if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'customers' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE customers 
          ADD COLUMN IF NOT EXISTS first_name varchar(255) NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS last_name varchar(255) NOT NULL DEFAULT '';
    END IF;

    -- Fix all tenant schemas
    FOR tenant_record IN tenant_cursor LOOP
        tenant_schema := tenant_record.schema_name;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = tenant_schema 
            AND table_name = 'customers'
        ) THEN
            -- Add first_name column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'first_name'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN first_name varchar(255) NOT NULL DEFAULT ''''', tenant_schema);
            END IF;
            
            -- Add last_name column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'last_name'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN last_name varchar(255) NOT NULL DEFAULT ''''', tenant_schema);
            END IF;
            
            RAISE NOTICE 'Added missing name columns to %.customers', tenant_schema;
        END IF;
    END LOOP;
END $$;
