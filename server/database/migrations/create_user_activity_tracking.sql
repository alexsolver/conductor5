
-- User Activity Tracking Table
DO $$ 
DECLARE 
    tenant_record RECORD;
    tenant_schema_name TEXT;
BEGIN
    -- Loop through all tenant schemas
    FOR tenant_record IN 
        SELECT s.schema_name FROM information_schema.schemata s
        WHERE s.schema_name LIKE 'tenant_%'
    LOOP
        tenant_schema_name := tenant_record.schema_name;
        
        -- Create user_activity_tracking table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS "%s".user_activity_tracking (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                user_id UUID NOT NULL,
                session_id VARCHAR(255),
                activity_type VARCHAR(100) NOT NULL, -- edit_ticket, view_ticket, send_message, etc
                resource_type VARCHAR(100), -- ticket, customer, message
                resource_id UUID,
                action VARCHAR(100) NOT NULL, -- start, end, update
                metadata JSONB DEFAULT ''{}'',
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                duration_seconds INTEGER,
                page_url TEXT,
                user_agent TEXT,
                ip_address INET,
                is_productive BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                
                CONSTRAINT fk_activity_tenant 
                    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
                CONSTRAINT fk_activity_user 
                    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
            )', tenant_schema_name);
            
        -- Create indexes for performance
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_activity_user_time ON "%s".user_activity_tracking(user_id, created_at);
            CREATE INDEX IF NOT EXISTS idx_activity_type_time ON "%s".user_activity_tracking(activity_type, created_at);
            CREATE INDEX IF NOT EXISTS idx_activity_resource ON "%s".user_activity_tracking(resource_type, resource_id);
            CREATE INDEX IF NOT EXISTS idx_activity_duration ON "%s".user_activity_tracking(duration_seconds) WHERE duration_seconds IS NOT NULL;
        ', tenant_schema_name, tenant_schema_name, tenant_schema_name, tenant_schema_name);
        
        RAISE NOTICE 'Created user_activity_tracking table for schema: %', tenant_schema_name;
    END LOOP;
END $$;
