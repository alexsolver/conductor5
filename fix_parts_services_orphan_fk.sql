-- PARTS & SERVICES MODULE: CORREÇÃO DO FK ÓRFÃO CRÍTICO
-- ==========================================================

-- PROBLEMA IDENTIFICADO: inventory.location_id → storage_locations.id (TABELA INEXISTENTE)
-- SOLUÇÃO: Corrigir para referenciar stock_locations.id que existe

DO $$ 
DECLARE
    tenant_schema TEXT;
    tenant_record RECORD;
    constraint_name TEXT;
BEGIN
    -- Iterar por todos os tenant schemas que têm tabelas parts/services
    FOR tenant_record IN 
        SELECT DISTINCT table_schema 
        FROM information_schema.tables 
        WHERE table_schema LIKE 'tenant_%' 
        AND table_name = 'inventory'
    LOOP
        tenant_schema := tenant_record.table_schema;
        RAISE NOTICE 'Corrigindo FK órfão no schema: %', tenant_schema;
        
        -- 1. Verificar se existe FK órfão inventory.location_id → storage_locations
        SELECT constraint_name INTO constraint_name
        FROM information_schema.referential_constraints rc
        JOIN information_schema.constraint_column_usage ccu ON rc.constraint_name = ccu.constraint_name
        WHERE rc.constraint_schema = tenant_schema
        AND ccu.table_name = 'storage_locations'
        AND EXISTS (
            SELECT 1 FROM information_schema.key_column_usage kcu
            WHERE kcu.constraint_name = rc.constraint_name
            AND kcu.table_name = 'inventory'
            AND kcu.column_name = 'location_id'
        )
        LIMIT 1;
        
        -- 2. Remover FK órfão se existe
        IF constraint_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE %I.inventory DROP CONSTRAINT %I', tenant_schema, constraint_name);
            RAISE NOTICE 'FK órfão removido: %', constraint_name;
        END IF;
        
        -- 3. Verificar se stock_locations existe no schema
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = tenant_schema AND table_name = 'stock_locations'
        ) THEN
            -- 4. Criar FK correto para stock_locations
            EXECUTE format('ALTER TABLE %I.inventory 
                           ADD CONSTRAINT fk_inventory_stock_location_id 
                           FOREIGN KEY (location_id) REFERENCES %I.stock_locations(id) 
                           ON DELETE SET NULL ON UPDATE CASCADE', 
                           tenant_schema, tenant_schema);
            RAISE NOTICE 'FK correto criado: inventory.location_id → stock_locations.id';
        ELSE
            RAISE NOTICE 'AVISO: Tabela stock_locations não existe no schema %', tenant_schema;
        END IF;
        
        -- 5. Verificar dados órfãos
        EXECUTE format('SELECT COUNT(*) FROM %I.inventory 
                       WHERE location_id IS NOT NULL 
                       AND location_id NOT IN (
                           SELECT id FROM %I.stock_locations
                       )', tenant_schema, tenant_schema);
        
        -- Reset constraint_name para próxima iteração
        constraint_name := NULL;
        
    END LOOP;
    
    RAISE NOTICE 'Correção de FK órfão concluída em todos os tenant schemas';
END $$;

-- VERIFICAÇÃO FINAL: Listar todos os FKs corrigidos
SELECT 
    tc.constraint_schema as schema_name,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.constraint_schema LIKE 'tenant_%'
  AND tc.table_name = 'inventory'
  AND kcu.column_name = 'location_id'  
ORDER BY tc.constraint_schema;