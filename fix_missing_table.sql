
-- Fix missing trechos_rota table for all tenant schemas
DO $$
DECLARE
    schema_name TEXT;
BEGIN
    FOR schema_name IN 
        SELECT nspname FROM pg_namespace WHERE nspname LIKE 'tenant_%'
    LOOP
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.trechos_rota (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                rota_trecho_id UUID NOT NULL,
                
                ordem INTEGER NOT NULL,
                local_origem_id UUID NOT NULL,
                nome_trecho VARCHAR(200),
                local_destino_id UUID NOT NULL,
                
                created_at TIMESTAMP DEFAULT NOW()
            )
        ', schema_name);

        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%I_trechos_rota_tenant_id 
            ON %I.trechos_rota(tenant_id)
        ', replace(schema_name, '-', '_'), schema_name);

        RAISE NOTICE 'Created trechos_rota table for schema: %', schema_name;
    END LOOP;
END
$$;
