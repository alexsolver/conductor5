
-- Script de Validação Completa de Vínculos
-- Execute para testar todas as estruturas de vínculos

-- 1. VERIFICAR ESTRUTURA DE TABELAS
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e' 
AND table_name IN ('customer_item_mappings', 'item_customer_links', 'supplier_item_links', 'companies', 'suppliers')
ORDER BY table_name, ordinal_position;

-- 2. VALIDAR DADOS DE TESTE
-- Inserir vínculos de empresas se não existirem
DO $$
BEGIN
    -- Verificar se customer_item_mappings existe
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e' 
               AND table_name = 'customer_item_mappings') THEN
        
        -- Inserir vínculos de teste
        INSERT INTO "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".customer_item_mappings 
        (id, tenant_id, item_id, customer_id, is_active, created_at, updated_at)
        SELECT 
          gen_random_uuid(),
          '3f99462f-3621-4b1b-bea8-782acc50d62e',
          i.id,
          c.id,
          true,
          NOW(),
          NOW()
        FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".items i
        CROSS JOIN "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".companies c
        WHERE NOT EXISTS (
          SELECT 1 FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".customer_item_mappings cim
          WHERE cim.item_id = i.id AND cim.customer_id = c.id
        )
        LIMIT 10;
        
        RAISE NOTICE 'Vínculos de empresas inseridos em customer_item_mappings';
    ELSE
        RAISE NOTICE 'Tabela customer_item_mappings não encontrada';
    END IF;
END $$;

-- 3. TESTAR QUERY DE VÍNCULOS DE FORNECEDORES
SELECT 
  s.id, 
  s.name,
  sil.item_id,
  i.name as item_name,
  sil.created_at as linked_at
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".supplier_item_links sil
INNER JOIN "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".suppliers s ON sil.supplier_id = s.id
INNER JOIN "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".items i ON sil.item_id = i.id
WHERE sil.is_active = true
LIMIT 10;

-- 4. RELATÓRIO DE INTEGRIDADE
SELECT 
  'Items' as entity,
  COUNT(*) as total
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".items

UNION ALL

SELECT 
  'Companies' as entity,
  COUNT(*) as total
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".companies

UNION ALL

SELECT 
  'Suppliers' as entity,
  COUNT(*) as total
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".suppliers

UNION ALL

SELECT 
  'Customer Links' as entity,
  COUNT(*) as total
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".customer_item_mappings

UNION ALL

SELECT 
  'Supplier Links' as entity,
  COUNT(*) as total
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".supplier_item_links;
