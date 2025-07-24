
-- MIGRAÇÃO ETAPA 1: LOCALIZAÇÕES E INVENTÁRIO MULTI-LOCALIZAÇÃO
-- Execute este script para implementar as funcionalidades da Etapa 1

-- 1. Criar tabela de localizações de estoque
CREATE TABLE IF NOT EXISTS stock_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  location_code VARCHAR(20) NOT NULL,
  location_name VARCHAR(100) NOT NULL,
  location_type VARCHAR(50) NOT NULL,
  
  -- Endereço
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'Brasil',
  
  -- GPS
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  
  -- Configurações
  is_main_warehouse BOOLEAN DEFAULT false,
  allows_negative_stock BOOLEAN DEFAULT false,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, location_code)
);

-- 2. Criar tabela de inventário multi-localização
CREATE TABLE IF NOT EXISTS inventory_multi_location (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  part_id UUID NOT NULL,
  location_id UUID NOT NULL,
  
  -- Quantidades
  current_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  on_order_quantity INTEGER DEFAULT 0,
  
  -- Níveis de estoque
  minimum_stock INTEGER DEFAULT 0,
  maximum_stock INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 0,
  safety_stock INTEGER DEFAULT 0,
  
  -- Custos
  unit_cost DECIMAL(10, 2),
  total_value DECIMAL(15, 2),
  average_cost DECIMAL(10, 2),
  
  -- Controle
  last_movement_date TIMESTAMP,
  last_count_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (part_id) REFERENCES parts(id),
  FOREIGN KEY (location_id) REFERENCES stock_locations(id),
  UNIQUE(tenant_id, part_id, location_id)
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_stock_locations_tenant ON stock_locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_locations_type ON stock_locations(tenant_id, location_type);
CREATE INDEX IF NOT EXISTS idx_inventory_multi_tenant_part_location ON inventory_multi_location(tenant_id, part_id, location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_multi_low_stock ON inventory_multi_location(tenant_id) WHERE current_quantity <= reorder_point;

-- 4. Inserir localização padrão para cada tenant
DO $$
DECLARE
    tenant_record RECORD;
BEGIN
    FOR tenant_record IN SELECT DISTINCT tenant_id FROM parts WHERE tenant_id IS NOT NULL
    LOOP
        INSERT INTO stock_locations (tenant_id, location_code, location_name, location_type, is_main_warehouse)
        VALUES (
            tenant_record.tenant_id,
            'MAIN',
            'Armazém Principal',
            'warehouse',
            true
        )
        ON CONFLICT (tenant_id, location_code) DO NOTHING;
    END LOOP;
END $$;

-- 5. Migrar inventário existente para multi-localização (se existir tabela inventory)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN
        INSERT INTO inventory_multi_location (
            tenant_id, part_id, location_id, current_quantity, minimum_stock, maximum_stock, unit_cost, created_at
        )
        SELECT 
            i.tenant_id,
            i.part_id,
            sl.id as location_id,
            COALESCE(i.current_stock, 0),
            COALESCE(i.minimum_quantity, 0),
            COALESCE(i.maximum_quantity, 0),
            COALESCE(i.unit_cost, 0),
            i.created_at
        FROM inventory i
        JOIN stock_locations sl ON sl.tenant_id = i.tenant_id AND sl.is_main_warehouse = true
        ON CONFLICT (tenant_id, part_id, location_id) DO NOTHING;
    END IF;
END $$;

COMMIT;
