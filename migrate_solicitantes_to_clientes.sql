
-- Script para migrar nomenclatura de 'solicitante' para 'cliente' em todas as tabelas tenant
-- Execute este script para atualizar o banco de dados

DO $$
DECLARE
    tenant_schema RECORD;
    schema_name TEXT;
BEGIN
    -- Loop através de todos os schemas tenant
    FOR tenant_schema IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        schema_name := tenant_schema.schema_name;
        
        -- Atualizar tabela external_contacts: alterar type de 'solicitante' para 'cliente'
        EXECUTE format('
            UPDATE %I.external_contacts 
            SET type = ''cliente'' 
            WHERE type = ''solicitante'';
        ', schema_name);
        
        RAISE NOTICE 'Updated external_contacts in schema: %', schema_name;
        
        -- Se houver outras tabelas com referências a 'solicitante', adicione aqui
        -- Exemplo para tabela tickets (se necessário):
        /*
        EXECUTE format('
            UPDATE %I.tickets 
            SET caller_type = ''cliente'' 
            WHERE caller_type = ''solicitante'';
        ', schema_name);
        */
        
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully for all tenant schemas';
END $$;

-- Verificar se a migração foi bem-sucedida
DO $$
DECLARE
    tenant_schema RECORD;
    count_result INTEGER;
BEGIN
    FOR tenant_schema IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        EXECUTE format('
            SELECT COUNT(*) FROM %I.external_contacts 
            WHERE type = ''solicitante''
        ', tenant_schema.schema_name) INTO count_result;
        
        IF count_result > 0 THEN
            RAISE WARNING 'Schema % still has % records with type solicitante', 
                tenant_schema.schema_name, count_result;
        ELSE
            RAISE NOTICE 'Schema % migration verified - no solicitante records found', 
                tenant_schema.schema_name;
        END IF;
    END LOOP;
END $$;
