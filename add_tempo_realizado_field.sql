-- Adicionar campo tempo_realizado na tabela ticket_internal_actions de todos os tenants

DO $$
DECLARE
    tenant_schema TEXT;
    tenant_record RECORD;
BEGIN
    -- Listar todos os schemas de tenant (excluindo public e information_schema)
    FOR tenant_record IN 
        SELECT schema_name FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        tenant_schema := tenant_record.schema_name;
        
        -- Verificar se a tabela ticket_internal_actions existe neste schema
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = tenant_schema 
            AND table_name = 'ticket_internal_actions'
        ) THEN
            -- Verificar se a coluna tempo_realizado já existe
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'ticket_internal_actions' 
                AND column_name = 'tempo_realizado'
            ) THEN
                -- Adicionar a coluna tempo_realizado
                EXECUTE format('ALTER TABLE %I.ticket_internal_actions ADD COLUMN tempo_realizado INTEGER', tenant_schema);
                RAISE NOTICE 'Campo tempo_realizado adicionado em %', tenant_schema;
            ELSE
                RAISE NOTICE 'Campo tempo_realizado já existe em %', tenant_schema;
            END IF;
        ELSE
            RAISE NOTICE 'Tabela ticket_internal_actions não encontrada em %', tenant_schema;
        END IF;
    END LOOP;
END $$;