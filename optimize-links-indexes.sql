
-- Otimização de Índices para Vínculos de Itens
-- Execute no schema do tenant para melhor performance

-- Índices para customer_item_mappings
CREATE INDEX CONCURRENTLY IF NOT EXISTS customer_item_mappings_item_tenant_active_idx 
ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".customer_item_mappings (item_id, tenant_id, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS customer_item_mappings_customer_tenant_active_idx 
ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".customer_item_mappings (customer_id, tenant_id, is_active) 
WHERE is_active = true;

-- Índices para supplier_item_links
CREATE INDEX CONCURRENTLY IF NOT EXISTS supplier_item_links_item_tenant_active_idx 
ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".supplier_item_links (item_id, tenant_id, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS supplier_item_links_supplier_tenant_active_idx 
ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".supplier_item_links (supplier_id, tenant_id, is_active) 
WHERE is_active = true;

-- Índices para item_customer_links (fallback)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e' 
               AND table_name = 'item_customer_links') THEN
        
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS item_customer_links_item_tenant_active_idx 
                 ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".item_customer_links (item_id, tenant_id, is_active) 
                 WHERE is_active = true';
                 
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS item_customer_links_company_tenant_active_idx 
                 ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".item_customer_links (company_id, tenant_id, is_active) 
                 WHERE is_active = true';
    END IF;
END $$;

-- Análise de performance
ANALYZE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".customer_item_mappings;
ANALYZE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".supplier_item_links;
ANALYZE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".companies;
ANALYZE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".suppliers;
