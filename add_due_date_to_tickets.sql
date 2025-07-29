-- Add due_date column to all tenant ticket tables
DO $$
DECLARE
    tenant_schema RECORD;
BEGIN
    -- Loop through all tenant schemas
    FOR tenant_schema IN 
        SELECT DISTINCT schemaname 
        FROM pg_tables 
        WHERE schemaname LIKE 'tenant_%'
    LOOP
        -- Add due_date column to tickets table in each tenant schema
        EXECUTE format('
            ALTER TABLE "%I".tickets 
            ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
        ', tenant_schema.schemaname);
        
        -- Create index for due_date queries
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%I_tickets_due_date 
            ON "%I".tickets (tenant_id, due_date) 
            WHERE due_date IS NOT NULL;
        ', replace(tenant_schema.schemaname, '-', '_'), tenant_schema.schemaname);
        
        RAISE NOTICE 'Added due_date column to schema: %', tenant_schema.schemaname;
    END LOOP;
END $$;
