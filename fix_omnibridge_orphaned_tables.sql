-- OMNIBRIDGE MODULE: LIMPEZA DE TABELAS ÓRFÃS NO SCHEMA PÚBLICO
-- ================================================================

-- PROBLEMA IDENTIFICADO: 5 tabelas omnibridge órfãs no schema público (44 campos totais)
-- SOLUÇÃO: Remover tabelas não utilizadas após transição para email-config system

-- AVISO: Fazer backup antes de executar em produção
-- Esse script remove permanentemente as tabelas órfãs identificadas na análise QA

DO $$ 
DECLARE
    orphaned_tables TEXT[] := ARRAY[
        'omnibridge_metrics',
        'omnibridge_rules', 
        'omnibridge_rule_stats',
        'omnibridge_templates',
        'omnibridge_template_stats'
    ];
    table_name TEXT;
    row_count INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando limpeza de tabelas órfãs do Omnibridge...';
    
    -- Iterar pelas tabelas órfãs identificadas
    FOREACH table_name IN ARRAY orphaned_tables
    LOOP
        -- Verificar se a tabela existe no schema público
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) THEN
            -- Contar registros antes da remoção (para log)
            EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO row_count;
            RAISE NOTICE 'Tabela órfã encontrada: % (% registros)', table_name, row_count;
            
            -- Remover tabela órfã
            EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', table_name);
            RAISE NOTICE 'Tabela órfã removida: %', table_name;
        ELSE
            RAISE NOTICE 'Tabela não encontrada (já removida): %', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Limpeza de tabelas órfãs concluída com sucesso';
END $$;

-- LIMPEZA ADICIONAL: Remover referências de routes órfãs se existirem
-- (Essas serão tratadas no código, mas documentamos aqui)

-- VERIFICAÇÃO FINAL: Confirmar que não existem mais tabelas omnibridge órfãs
SELECT 
    table_name,
    table_schema,
    CASE 
        WHEN table_schema = 'public' THEN 'ÓRFÃ (deve ser removida)'
        ELSE 'Sistema funcional (manter)'
    END as status
FROM information_schema.tables 
WHERE table_name LIKE 'omnibridge%'
ORDER BY table_schema, table_name;

-- RESULTADO ESPERADO APÓS LIMPEZA:
-- Nenhuma tabela omnibridge_* no schema público
-- Sistema email-config operacional nos schemas tenant mantido