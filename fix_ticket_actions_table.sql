
-- Fix ticket_actions table structure
DO $$ 
DECLARE 
    tenant_record RECORD;
    current_schema TEXT;
BEGIN
    -- Loop through all tenant schemas
    FOR tenant_record IN 
        SELECT schema_name FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        current_schema := tenant_record.schema_name;
        
        -- Drop existing table if it exists
        EXECUTE format('DROP TABLE IF EXISTS "%s".ticket_actions CASCADE', current_schema);
        
        -- Create correct ticket_actions table
        EXECUTE format('
            CREATE TABLE "%s".ticket_actions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                ticket_id UUID NOT NULL,
                action_type VARCHAR(100) NOT NULL,
                description TEXT,
                work_log TEXT,
                time_spent VARCHAR(20),
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                estimated_hours DECIMAL(5,2) DEFAULT 0,
                is_public BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_by UUID,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                
                CONSTRAINT fk_ticket_actions_tenant 
                    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
                CONSTRAINT fk_ticket_actions_ticket 
                    FOREIGN KEY (ticket_id) REFERENCES "%s".tickets(id) ON DELETE CASCADE,
                CONSTRAINT fk_ticket_actions_user 
                    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL
            )', current_schema, current_schema);
            
        -- Create indexes
        EXECUTE format('
            CREATE INDEX idx_ticket_actions_tenant_id ON "%s".ticket_actions(tenant_id);
            CREATE INDEX idx_ticket_actions_ticket_id ON "%s".ticket_actions(ticket_id);
            CREATE INDEX idx_ticket_actions_created_at ON "%s".ticket_actions(created_at);
        ', current_schema, current_schema, current_schema);
        
        RAISE NOTICE 'Fixed ticket_actions table for schema: %', current_schema;
    END LOOP;
END $$;
