DO $$
DECLARE
    schema_name TEXT;
BEGIN
    FOR schema_name IN 
        SELECT DISTINCT schemaname 
        FROM pg_tables 
        WHERE schemaname LIKE 'tenant_%'
    LOOP
        EXECUTE format('
            ALTER TABLE "%I".tickets 
            DROP COLUMN IF EXISTS link_ticket_number,
            DROP COLUMN IF EXISTS link_type,
            DROP COLUMN IF EXISTS link_comment;
        ', schema_name);
        
        RAISE NOTICE 'Removed relationship fields from schema: %', schema_name;
    END LOOP;
END $$;
