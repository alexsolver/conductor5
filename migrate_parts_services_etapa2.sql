
-- MIGRAÇÃO ETAPA 2: SISTEMA DE MOVIMENTAÇÕES REAIS DE ESTOQUE
-- Execute este script para implementar as funcionalidades da Etapa 2

-- 1. Criar tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Referências
  part_id UUID NOT NULL,
  location_id UUID NOT NULL,
  movement_number VARCHAR(50) NOT NULL,
  
  -- Tipo de movimentação
  movement_type VARCHAR(50) NOT NULL, -- IN, OUT, TRANSFER, ADJUSTMENT
  movement_subtype VARCHAR(50), -- PURCHASE, SALE, RETURN, COUNT, etc.
  
  -- Quantidades
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(15, 2),
  
  -- Transferências
  source_location_id UUID,
  destination_location_id UUID,
  
  -- Rastreabilidade
  lot_number VARCHAR(100),
  serial_number VARCHAR(100),
  expiration_date DATE,
  
  -- Documentos
  reference_document_type VARCHAR(50),
  reference_document_number VARCHAR(100),
  supplier_id UUID,
  customer_id UUID,
  
  -- Status
  status VARCHAR(20) DEFAULT 'COMPLETED', -- PENDING, COMPLETED, CANCELLED
  approval_status VARCHAR(20) DEFAULT 'APPROVED', -- PENDING, APPROVED, REJECTED
  approved_by UUID,
  approved_at TIMESTAMP,
  
  -- Observações
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL,
  
  -- Constraints
  FOREIGN KEY (part_id) REFERENCES parts(id),
  FOREIGN KEY (location_id) REFERENCES stock_locations(id),
  FOREIGN KEY (source_location_id) REFERENCES stock_locations(id),
  FOREIGN KEY (destination_location_id) REFERENCES stock_locations(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  
  UNIQUE(tenant_id, movement_number)
);

-- 2. Criar tabela de lotes/serial numbers
CREATE TABLE IF NOT EXISTS stock_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  part_id UUID NOT NULL,
  location_id UUID NOT NULL,
  
  -- Identificação do lote
  lot_number VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100),
  
  -- Quantidades
  current_quantity INTEGER DEFAULT 0,
  original_quantity INTEGER NOT NULL,
  
  -- Datas
  manufacturing_date DATE,
  expiration_date DATE,
  received_date DATE DEFAULT CURRENT_DATE,
  
  -- Custos
  unit_cost DECIMAL(10, 2),
  total_value DECIMAL(15, 2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, RECALLED
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (part_id) REFERENCES parts(id),
  FOREIGN KEY (location_id) REFERENCES stock_locations(id),
  UNIQUE(tenant_id, part_id, location_id, lot_number)
);

-- 3. Criar tabela de regras de aprovação
CREATE TABLE IF NOT EXISTS movement_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Condições
  movement_type VARCHAR(50) NOT NULL,
  minimum_value DECIMAL(15, 2),
  maximum_quantity INTEGER,
  
  -- Aprovador
  approver_role VARCHAR(50),
  approver_user_id UUID,
  
  -- Configurações
  requires_approval BOOLEAN DEFAULT true,
  auto_approve_threshold DECIMAL(15, 2),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_part_date 
ON stock_movements(tenant_id, part_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_location_date 
ON stock_movements(tenant_id, location_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_type 
ON stock_movements(tenant_id, movement_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_status 
ON stock_movements(tenant_id, status, approval_status);

CREATE INDEX IF NOT EXISTS idx_stock_lots_part_location 
ON stock_lots(tenant_id, part_id, location_id);

CREATE INDEX IF NOT EXISTS idx_stock_lots_expiration 
ON stock_lots(tenant_id, expiration_date) WHERE status = 'ACTIVE';

-- 5. Criar função para atualizar inventário após movimentação
CREATE OR REPLACE FUNCTION update_inventory_after_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Para movimentações de entrada (IN)
  IF NEW.movement_type = 'IN' THEN
    INSERT INTO inventory_multi_location (
      tenant_id, part_id, location_id, current_quantity, unit_cost, total_value, last_movement_date
    )
    VALUES (
      NEW.tenant_id, NEW.part_id, NEW.location_id, NEW.quantity, 
      NEW.unit_cost, NEW.total_cost, NEW.created_at
    )
    ON CONFLICT (tenant_id, part_id, location_id)
    DO UPDATE SET
      current_quantity = inventory_multi_location.current_quantity + NEW.quantity,
      available_quantity = inventory_multi_location.available_quantity + NEW.quantity,
      total_value = inventory_multi_location.total_value + NEW.total_cost,
      last_movement_date = NEW.created_at,
      updated_at = NOW();
      
  -- Para movimentações de saída (OUT)
  ELSIF NEW.movement_type = 'OUT' THEN
    UPDATE inventory_multi_location 
    SET 
      current_quantity = current_quantity - NEW.quantity,
      available_quantity = available_quantity - NEW.quantity,
      total_value = total_value - NEW.total_cost,
      last_movement_date = NEW.created_at,
      updated_at = NOW()
    WHERE tenant_id = NEW.tenant_id 
      AND part_id = NEW.part_id 
      AND location_id = NEW.location_id;
      
  -- Para transferências (TRANSFER)
  ELSIF NEW.movement_type = 'TRANSFER' AND NEW.source_location_id IS NOT NULL AND NEW.destination_location_id IS NOT NULL THEN
    -- Saída do local de origem
    UPDATE inventory_multi_location 
    SET 
      current_quantity = current_quantity - NEW.quantity,
      available_quantity = available_quantity - NEW.quantity,
      last_movement_date = NEW.created_at,
      updated_at = NOW()
    WHERE tenant_id = NEW.tenant_id 
      AND part_id = NEW.part_id 
      AND location_id = NEW.source_location_id;
      
    -- Entrada no local de destino
    INSERT INTO inventory_multi_location (
      tenant_id, part_id, location_id, current_quantity, unit_cost, total_value, last_movement_date
    )
    VALUES (
      NEW.tenant_id, NEW.part_id, NEW.destination_location_id, NEW.quantity, 
      NEW.unit_cost, NEW.total_cost, NEW.created_at
    )
    ON CONFLICT (tenant_id, part_id, location_id)
    DO UPDATE SET
      current_quantity = inventory_multi_location.current_quantity + NEW.quantity,
      available_quantity = inventory_multi_location.available_quantity + NEW.quantity,
      last_movement_date = NEW.created_at,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para atualizar inventário automaticamente
DROP TRIGGER IF EXISTS trigger_update_inventory_after_movement ON stock_movements;
CREATE TRIGGER trigger_update_inventory_after_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  WHEN (NEW.status = 'COMPLETED' AND NEW.approval_status = 'APPROVED')
  EXECUTE FUNCTION update_inventory_after_movement();

-- 7. Inserir regras de aprovação padrão
DO $$
DECLARE
    tenant_record RECORD;
BEGIN
    FOR tenant_record IN SELECT DISTINCT tenant_id FROM stock_locations WHERE tenant_id IS NOT NULL
    LOOP
        -- Regra para movimentações de alta valor
        INSERT INTO movement_approval_rules (tenant_id, movement_type, minimum_value, requires_approval)
        VALUES (
            tenant_record.tenant_id,
            'OUT',
            1000.00,
            true
        )
        ON CONFLICT DO NOTHING;
        
        -- Regra para transferências
        INSERT INTO movement_approval_rules (tenant_id, movement_type, minimum_value, requires_approval)
        VALUES (
            tenant_record.tenant_id,
            'TRANSFER',
            500.00,
            true
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

COMMIT;
