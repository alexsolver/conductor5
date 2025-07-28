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
            CREATE TABLE IF NOT EXISTS "%I".ticket_relationships (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                source_ticket_id UUID NOT NULL,
                target_ticket_id UUID NOT NULL,
                relationship_type VARCHAR(50) NOT NULL,
                description TEXT,
                created_by_id UUID,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT true,

                CONSTRAINT fk_ticket_relationships_source FOREIGN KEY (source_ticket_id) REFERENCES "%I".tickets(id) ON DELETE CASCADE,
                CONSTRAINT fk_ticket_relationships_target FOREIGN KEY (target_ticket_id) REFERENCES "%I".tickets(id) ON DELETE CASCADE,
                CONSTRAINT fk_ticket_relationships_created_by FOREIGN KEY (created_by_id) REFERENCES public.users(id),

                CONSTRAINT chk_no_self_reference CHECK (source_ticket_id != target_ticket_id),

                CONSTRAINT uk_ticket_relationships UNIQUE (tenant_id, source_ticket_id, target_ticket_id, relationship_type)
            );

            CREATE INDEX IF NOT EXISTS idx_ticket_relationships_source ON "%I".ticket_relationships(tenant_id, source_ticket_id);
            CREATE INDEX IF NOT EXISTS idx_ticket_relationships_target ON "%I".ticket_relationships(tenant_id, target_ticket_id); 
            CREATE INDEX IF NOT EXISTS idx_ticket_relationships_type ON "%I".ticket_relationships(relationship_type);
            CREATE INDEX IF NOT EXISTS idx_ticket_relationships_active ON "%I".ticket_relationships(tenant_id, is_active);
        ', schema_name, schema_name, schema_name, schema_name, schema_name, schema_name);
    END LOOP;
END $$;