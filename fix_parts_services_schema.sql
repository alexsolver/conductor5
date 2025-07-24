
-- Script para corrigir schema de Parts & Services
-- Adiciona campos faltantes nas tabelas

-- Verificar se as colunas existem antes de adicionar
DO $$
BEGIN
    -- Adicionar campos faltantes na tabela parts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='internal_code') THEN
        ALTER TABLE parts ADD COLUMN internal_code VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='manufacturer_code') THEN
        ALTER TABLE parts ADD COLUMN manufacturer_code VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='weight_kg') THEN
        ALTER TABLE parts ADD COLUMN weight_kg DECIMAL(10,3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='material') THEN
        ALTER TABLE parts ADD COLUMN material VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='voltage') THEN
        ALTER TABLE parts ADD COLUMN voltage VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='power_watts') THEN
        ALTER TABLE parts ADD COLUMN power_watts DECIMAL(10,2);
    END IF;

    -- Adicionar campos faltantes na tabela suppliers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='supplier_code') THEN
        ALTER TABLE suppliers ADD COLUMN supplier_code VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='trade_name') THEN
        ALTER TABLE suppliers ADD COLUMN trade_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='document_number') THEN
        ALTER TABLE suppliers ADD COLUMN document_number VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='city') THEN
        ALTER TABLE suppliers ADD COLUMN city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='state') THEN
        ALTER TABLE suppliers ADD COLUMN state VARCHAR(2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='country') THEN
        ALTER TABLE suppliers ADD COLUMN country VARCHAR(100) DEFAULT 'Brasil';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='supplier_type') THEN
        ALTER TABLE suppliers ADD COLUMN supplier_type VARCHAR(20) DEFAULT 'regular';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='quality_rating') THEN
        ALTER TABLE suppliers ADD COLUMN quality_rating DECIMAL(3,1) DEFAULT 4.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='delivery_rating') THEN
        ALTER TABLE suppliers ADD COLUMN delivery_rating DECIMAL(3,1) DEFAULT 4.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='price_rating') THEN
        ALTER TABLE suppliers ADD COLUMN price_rating DECIMAL(3,1) DEFAULT 4.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='overall_rating') THEN
        ALTER TABLE suppliers ADD COLUMN overall_rating DECIMAL(3,1) DEFAULT 4.0;
    END IF;

END $$;

-- Criar índices faltantes
CREATE INDEX IF NOT EXISTS parts_tenant_internal_code_idx ON parts(tenant_id, internal_code);
CREATE INDEX IF NOT EXISTS suppliers_tenant_code_idx ON suppliers(tenant_id, supplier_code);

-- Atualizar dados existentes
UPDATE parts SET internal_code = part_number WHERE internal_code IS NULL;
UPDATE parts SET manufacturer_code = part_number WHERE manufacturer_code IS NULL;
UPDATE suppliers SET supplier_code = CONCAT('FORN', LPAD(id::text, 3, '0')) WHERE supplier_code IS NULL;
UPDATE suppliers SET trade_name = name WHERE trade_name IS NULL;
