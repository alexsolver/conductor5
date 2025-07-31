
-- Script para adicionar coluna first_separator na tabela ticket_numbering_config
-- Execute este script antes de usar a nova funcionalidade

-- Para cada tenant schema, adicionar a coluna first_separator
DO $$
DECLARE
    schema_name TEXT;
    tenant_schemas CURSOR FOR
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%';
BEGIN
    FOR tenant_rec IN tenant_schemas LOOP
        schema_name := tenant_rec.schema_name;
        
        -- Verificar se a tabela existe neste schema
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_name 
            AND table_name = 'ticket_numbering_config'
        ) THEN
            -- Verificar se a coluna já existe
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = schema_name 
                AND table_name = 'ticket_numbering_config' 
                AND column_name = 'first_separator'
            ) THEN
                -- Adicionar a coluna
                EXECUTE format('ALTER TABLE %I.ticket_numbering_config ADD COLUMN first_separator VARCHAR(5) DEFAULT ''-''', schema_name);
                RAISE NOTICE 'Adicionada coluna first_separator no schema %', schema_name;
            ELSE
                RAISE NOTICE 'Coluna first_separator já existe no schema %', schema_name;
            END IF;
        ELSE
            RAISE NOTICE 'Tabela ticket_numbering_config não existe no schema %', schema_name;
        END IF;
    END LOOP;
END $$;
