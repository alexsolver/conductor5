-- Create ticket materials and services consumption tables
-- These tables support the integrated LPU pricing system

-- LPU Settings per ticket
CREATE TABLE IF NOT EXISTS ticket_lpu_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ticket_id UUID NOT NULL,
    lpu_id UUID NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    applied_by_id UUID,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Planned items consumption (before service execution)
CREATE TABLE IF NOT EXISTS ticket_planned_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ticket_id UUID NOT NULL,
    item_id UUID NOT NULL,
    planned_quantity DECIMAL(15,4) NOT NULL,
    lpu_id UUID NOT NULL,
    unit_price_at_planning DECIMAL(15,4) NOT NULL,
    estimated_cost DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'planned' NOT NULL,
    planned_by_id UUID,
    approved_by_id UUID,
    approved_at TIMESTAMP,
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Actual items consumption (after service execution)
CREATE TABLE IF NOT EXISTS ticket_consumed_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ticket_id UUID NOT NULL,
    planned_item_id UUID,
    item_id UUID NOT NULL,
    planned_quantity DECIMAL(15,4) DEFAULT 0,
    actual_quantity DECIMAL(15,4) NOT NULL,
    lpu_id UUID NOT NULL,
    unit_price_at_consumption DECIMAL(15,4) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    technician_id UUID NOT NULL,
    stock_location_id UUID,
    consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    consumption_type VARCHAR(50) DEFAULT 'used',
    notes TEXT,
    batch_number VARCHAR(100),
    serial_number VARCHAR(100),
    warranty_period INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Costs summary per ticket
CREATE TABLE IF NOT EXISTS ticket_costs_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ticket_id UUID NOT NULL,
    total_planned_cost DECIMAL(15,2) DEFAULT 0,
    total_actual_cost DECIMAL(15,2) DEFAULT 0,
    cost_variance DECIMAL(15,2) DEFAULT 0,
    cost_variance_percentage DECIMAL(5,2) DEFAULT 0,
    materials_count INTEGER DEFAULT 0,
    services_count INTEGER DEFAULT 0,
    total_items_count INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'BRL',
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    calculated_by_id UUID,
    status VARCHAR(20) DEFAULT 'draft',
    approved_by_id UUID,
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Stock movements triggered by ticket consumption
CREATE TABLE IF NOT EXISTS ticket_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ticket_id UUID NOT NULL,
    consumed_item_id UUID NOT NULL,
    stock_location_id UUID NOT NULL,
    item_id UUID NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    previous_stock DECIMAL(15,4) NOT NULL,
    new_stock DECIMAL(15,4) NOT NULL,
    unit_cost DECIMAL(15,4),
    total_cost DECIMAL(15,2),
    technician_id UUID NOT NULL,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ticket_lpu_settings_tenant_ticket_idx ON ticket_lpu_settings(tenant_id, ticket_id);
CREATE INDEX IF NOT EXISTS ticket_lpu_settings_tenant_lpu_idx ON ticket_lpu_settings(tenant_id, lpu_id);
CREATE INDEX IF NOT EXISTS ticket_lpu_settings_tenant_active_idx ON ticket_lpu_settings(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS ticket_planned_items_tenant_ticket_idx ON ticket_planned_items(tenant_id, ticket_id);
CREATE INDEX IF NOT EXISTS ticket_planned_items_tenant_item_idx ON ticket_planned_items(tenant_id, item_id);
CREATE INDEX IF NOT EXISTS ticket_planned_items_tenant_status_idx ON ticket_planned_items(tenant_id, status);
CREATE INDEX IF NOT EXISTS ticket_planned_items_tenant_lpu_idx ON ticket_planned_items(tenant_id, lpu_id);

CREATE INDEX IF NOT EXISTS ticket_consumed_items_tenant_ticket_idx ON ticket_consumed_items(tenant_id, ticket_id);
CREATE INDEX IF NOT EXISTS ticket_consumed_items_tenant_item_idx ON ticket_consumed_items(tenant_id, item_id);
CREATE INDEX IF NOT EXISTS ticket_consumed_items_tenant_technician_idx ON ticket_consumed_items(tenant_id, technician_id);
CREATE INDEX IF NOT EXISTS ticket_consumed_items_tenant_consumed_idx ON ticket_consumed_items(tenant_id, consumed_at);
CREATE INDEX IF NOT EXISTS ticket_consumed_items_tenant_lpu_idx ON ticket_consumed_items(tenant_id, lpu_id);
CREATE INDEX IF NOT EXISTS ticket_consumed_items_tenant_location_idx ON ticket_consumed_items(tenant_id, stock_location_id);

CREATE INDEX IF NOT EXISTS ticket_costs_summary_tenant_ticket_idx ON ticket_costs_summary(tenant_id, ticket_id);
CREATE INDEX IF NOT EXISTS ticket_costs_summary_tenant_status_idx ON ticket_costs_summary(tenant_id, status);
CREATE INDEX IF NOT EXISTS ticket_costs_summary_tenant_calculated_idx ON ticket_costs_summary(tenant_id, last_calculated_at);

CREATE INDEX IF NOT EXISTS ticket_stock_movements_tenant_ticket_idx ON ticket_stock_movements(tenant_id, ticket_id);
CREATE INDEX IF NOT EXISTS ticket_stock_movements_tenant_location_idx ON ticket_stock_movements(tenant_id, stock_location_id);
CREATE INDEX IF NOT EXISTS ticket_stock_movements_tenant_item_idx ON ticket_stock_movements(tenant_id, item_id);
CREATE INDEX IF NOT EXISTS ticket_stock_movements_tenant_technician_idx ON ticket_stock_movements(tenant_id, technician_id);
CREATE INDEX IF NOT EXISTS ticket_stock_movements_tenant_date_idx ON ticket_stock_movements(tenant_id, movement_date);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS ticket_costs_summary_unique_ticket ON ticket_costs_summary(tenant_id, ticket_id);

COMMENT ON TABLE ticket_lpu_settings IS 'Links tickets to specific LPU price lists';
COMMENT ON TABLE ticket_planned_items IS 'Items planned for consumption before service execution';
COMMENT ON TABLE ticket_consumed_items IS 'Actual items consumed during service execution';
COMMENT ON TABLE ticket_costs_summary IS 'Cost summary and variance tracking per ticket';
COMMENT ON TABLE ticket_stock_movements IS 'Stock movements triggered by ticket item consumption';