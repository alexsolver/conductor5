
-- Script para adicionar a coluna status_type à tabela ticket_field_options
-- Executa para todos os schemas de tenant

DO $$
DECLARE
    tenant_schema TEXT;
    tenant_record RECORD;
BEGIN
    -- Loop através de todos os schemas de tenant
    FOR tenant_record IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        tenant_schema := tenant_record.schema_name;
        
        -- Verifica se a coluna já existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = tenant_schema 
            AND table_name = 'ticket_field_options' 
            AND column_name = 'status_type'
        ) THEN
            -- Adiciona a coluna status_type
            EXECUTE format('ALTER TABLE %I.ticket_field_options ADD COLUMN status_type VARCHAR(20)', tenant_schema);
            
            -- Adiciona um comentário explicativo
            EXECUTE format('COMMENT ON COLUMN %I.ticket_field_options.status_type IS ''Tipo do status: open, paused, resolved, closed''', tenant_schema);
            
            RAISE NOTICE 'Coluna status_type adicionada ao schema %', tenant_schema;
        ELSE
            RAISE NOTICE 'Coluna status_type já existe no schema %', tenant_schema;
        END IF;
    END LOOP;
END $$;
