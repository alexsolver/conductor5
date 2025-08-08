
-- Fix tickets table for production
DO $$
DECLARE
    tenant_record RECORD;
    schema_name TEXT;
BEGIN
    -- Loop through all tenant schemas
    FOR tenant_record IN 
        SELECT id FROM public.tenants 
    LOOP
        schema_name := 'tenant_' || REPLACE(tenant_record.id::text, '-', '_');
        
        -- Add missing constraints
        EXECUTE format('ALTER TABLE %I.tickets 
            ADD CONSTRAINT IF NOT EXISTS tickets_status_check 
            CHECK (status IN (''new'', ''open'', ''in_progress'', ''resolved'', ''closed'', ''pending''))', schema_name);
            
        EXECUTE format('ALTER TABLE %I.tickets 
            ADD CONSTRAINT IF NOT EXISTS tickets_priority_check 
            CHECK (priority IN (''low'', ''medium'', ''high'', ''urgent''))', schema_name);
            
        -- Add performance indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status 
            ON %I.tickets (tenant_id, status) WHERE is_active = true', schema_name);
            
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_tickets_customer_priority 
            ON %I.tickets (customer_id, priority) WHERE is_active = true', schema_name);
            
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_tickets_assigned_status 
            ON %I.tickets (assigned_to_id, status) WHERE assigned_to_id IS NOT NULL', schema_name);
            
        -- Fix any remaining customer_company_id references to company_id
        EXECUTE format('UPDATE %I.tickets SET company_id = customer_company_id 
            WHERE company_id IS NULL AND customer_company_id IS NOT NULL', schema_name);
            
        RAISE NOTICE 'Fixed tickets table for schema %', schema_name;
    END LOOP;
END $$;
