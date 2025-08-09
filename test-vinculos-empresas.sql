
-- Script de teste para validar vínculos de empresas no Item Catalog
-- Execute no console do banco para testar o fluxo completo

-- 1. Verificar se há itens disponíveis
SELECT id, name, type FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".items LIMIT 5;

-- 2. Verificar se há empresas disponíveis  
SELECT id, name FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".companies LIMIT 5;

-- 3. Criar vínculos de teste (substituir IDs pelos reais)
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
LIMIT 5;

-- 4. Verificar vínculos criados
SELECT 
  cim.id,
  i.name as item_name,
  c.name as company_name,
  cim.created_at
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".customer_item_mappings cim
JOIN "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".items i ON cim.item_id = i.id
JOIN "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".companies c ON cim.customer_id = c.id
WHERE cim.is_active = true;
