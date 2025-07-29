-- Add cost_center field to tickets table in all tenant schemas
DO $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Loop through all tenant schemas
    FOR schema_name IN 
        SELECT DISTINCT schemaname 
        FROM pg_tables 
        WHERE schemaname LIKE 'tenant_%'
    LOOP
        -- Add cost_center column to tickets table
        EXECUTE format('
            ALTER TABLE "%I".tickets 
            ADD COLUMN IF NOT EXISTS cost_center VARCHAR(100)
        ', schema_name);
        
        RAISE NOTICE 'Added cost_center column to schema: %', schema_name;
    END LOOP;
END $$;
