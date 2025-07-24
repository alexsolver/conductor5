-- ===================================================
-- QA PARTS & SERVICES - RECONCILIAÇÃO DE SCHEMAS
-- Correção de inconsistências críticas identificadas
-- ===================================================

-- PROBLEMA 1: FK órfão inventory.location_id → storage_locations.id
-- SOLUÇÃO: Corrigir FK para apontar para stock_locations.id

DO $$ 
DECLARE
    tenant_schema TEXT;
    tenant_record RECORD;
BEGIN
    -- Processar todos os tenant schemas
    FOR tenant_record IN 
        SELECT DISTINCT table_schema 
        FROM information_schema.tables 
        WHERE table_schema LIKE 'tenant_%' 
        AND table_name = 'inventory'
    LOOP
        tenant_schema := tenant_record.table_schema;
        RAISE NOTICE 'Corrigindo FK órfão no schema: %', tenant_schema;
        
        -- Verificar se FK órfão existe
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = tenant_schema 
            AND tc.table_name = 'inventory'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'storage_locations'
        ) THEN
            -- Remover FK órfão
            EXECUTE format('ALTER TABLE %I.inventory DROP CONSTRAINT inventory_location_id_fkey', tenant_schema);
            RAISE NOTICE 'FK órfão removido: inventory_location_id_fkey';
            
            -- Verificar se stock_locations existe
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = tenant_schema AND table_name = 'stock_locations'
            ) THEN
                -- Recriar FK correto
                EXECUTE format('ALTER TABLE %I.inventory ADD CONSTRAINT inventory_location_id_fkey 
                               FOREIGN KEY (location_id) REFERENCES %I.stock_locations(id)', 
                               tenant_schema, tenant_schema);
                RAISE NOTICE 'FK correto criado: inventory → stock_locations';
            ELSE
                RAISE NOTICE 'AVISO: tabela stock_locations não existe em %', tenant_schema;
            END IF;
        END IF;
        
    END LOOP;
END $$;

-- PROBLEMA 2: Inconsistência de nomenclatura parts_categories vs part_categories
-- SOLUÇÃO: Padronizar para part_categories

DO $$ 
DECLARE
    tenant_schema TEXT;
    tenant_record RECORD;
BEGIN
    FOR tenant_record IN 
        SELECT DISTINCT table_schema 
        FROM information_schema.tables 
        WHERE table_schema LIKE 'tenant_%' 
        AND table_name = 'parts'
    LOOP
        tenant_schema := tenant_record.table_schema;
        RAISE NOTICE 'Verificando nomenclatura de categorias no schema: %', tenant_schema;
        
        -- Se existe parts_categories mas FK aponta para part_categories
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = tenant_schema AND table_name = 'parts_categories'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.constraint_column_usage 
            WHERE table_schema = tenant_schema AND table_name = 'part_categories'
        ) THEN
            -- Corrigir FK para apontar para tabela existente
            EXECUTE format('ALTER TABLE %I.parts DROP CONSTRAINT IF EXISTS parts_category_id_fkey', tenant_schema);
            EXECUTE format('ALTER TABLE %I.parts ADD CONSTRAINT parts_category_id_fkey 
                           FOREIGN KEY (category_id) REFERENCES %I.parts_categories(id)', 
                           tenant_schema, tenant_schema);
            RAISE NOTICE 'FK corrigido: parts.category_id → parts_categories.id';
        END IF;
        
    END LOOP;
END $$;

-- PROBLEMA 3: Verificar integridade de dados órfãos
-- SOLUÇÃO: Identificar registros com FKs que apontam para registros inexistentes

DO $$ 
DECLARE
    tenant_schema TEXT;
    tenant_record RECORD;
    orphan_count INTEGER;
BEGIN
    FOR tenant_record IN 
        SELECT DISTINCT table_schema 
        FROM information_schema.tables 
        WHERE table_schema LIKE 'tenant_%' 
        AND table_name = 'inventory'
    LOOP
        tenant_schema := tenant_record.table_schema;
        RAISE NOTICE 'Verificando dados órfãos no schema: %', tenant_schema;
        
        -- Verificar registros inventory órfãos (part_id não existe)
        EXECUTE format('SELECT COUNT(*) FROM %I.inventory i 
                       LEFT JOIN %I.parts p ON i.part_id = p.id 
                       WHERE p.id IS NULL', tenant_schema, tenant_schema) 
        INTO orphan_count;
        
        IF orphan_count > 0 THEN
            RAISE NOTICE 'ATENÇÃO: % registros órfãos em inventory (part_id inexistente)', orphan_count;
        ELSE
            RAISE NOTICE 'OK: Não há registros órfãos em inventory.part_id';
        END IF;
        
    END LOOP;
END $$;

-- RELATÓRIO FINAL: Verificar estado dos relacionamentos após correção
DO $$ 
DECLARE
    tenant_schema TEXT;
    tenant_record RECORD;
    fk_count INTEGER;
BEGIN
    RAISE NOTICE '========== RELATÓRIO FINAL DE RELACIONAMENTOS ==========';
    
    FOR tenant_record IN 
        SELECT DISTINCT table_schema 
        FROM information_schema.tables 
        WHERE table_schema LIKE 'tenant_%' 
        AND table_name = 'parts'
    LOOP
        tenant_schema := tenant_record.table_schema;
        
        -- Contar FKs válidos
        SELECT COUNT(*) INTO fk_count
        FROM information_schema.table_constraints 
        WHERE table_schema = tenant_schema 
        AND constraint_type = 'FOREIGN KEY'
        AND table_name IN ('parts', 'inventory', 'suppliers', 'supplier_catalog');
        
        RAISE NOTICE 'Schema: % - FKs válidos: %', tenant_schema, fk_count;
        
    END LOOP;
    
    RAISE NOTICE '========== FIM DO RELATÓRIO ==========';
END $$;