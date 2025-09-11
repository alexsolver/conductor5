
-- Script to create missing LPU tables and add missing columns
-- Run this for each tenant schema

-- First, let's add the missing notes column to price_lists if it doesn't exist
DO $$ 
BEGIN
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'price_lists' 
        AND column_name = 'notes'
        AND table_schema = current_schema()
    ) THEN
        ALTER TABLE price_lists ADD COLUMN notes TEXT;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'price_lists' 
        AND column_name = 'description'
        AND table_schema = current_schema()
    ) THEN
        ALTER TABLE price_lists ADD COLUMN description TEXT;
    END IF;
    
    -- Add list_code column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'price_lists' 
        AND column_name = 'list_code'
        AND table_schema = current_schema()
    ) THEN
        ALTER TABLE price_lists ADD COLUMN list_code VARCHAR(50);
    END IF;
END $$;

-- Create pricing_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    conditions JSONB,
    actions JSONB,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create price_list_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    price_list_id UUID NOT NULL,
    item_id UUID,
    service_type_id UUID,
    unit_price DECIMAL(15,2),
    special_price DECIMAL(15,2),
    hourly_rate DECIMAL(15,2),
    travel_cost DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by_id UUID,
    updated_by UUID
);

-- Create price_list_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS price_list_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    price_list_id UUID NOT NULL,
    version VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,
    submitted_by UUID,
    submitted_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    rejected_by UUID,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    base_margin DECIMAL(5,2),
    margin_override JSONB,
    effective_date TIMESTAMP,
    expiration_date TIMESTAMP,
    notes TEXT,
    change_log JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create timecard_entries table if it doesn't exist (since it's being referenced)
CREATE TABLE IF NOT EXISTS timecard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    break_start TIMESTAMP,
    break_end TIMESTAMP,
    total_hours DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_tenant_id ON pricing_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_list_items_tenant_id ON price_list_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_list_id ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_versions_tenant_id ON price_list_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_timecard_entries_user_date ON timecard_entries(user_id, date);

-- Add some sample data for testing
INSERT INTO pricing_rules (tenant_id, name, description, rule_type, conditions, actions, priority)
VALUES 
    ('ce46e00d-3baa-43e1-b4bb-f110b7dcfbeb', 'Volume Discount', 'Automatic volume discount', 'percentage', '{}', '{}', 1),
    ('ce46e00d-3baa-43e1-b4bb-f110b7dcfbeb', 'Minimum Margin', 'Ensure minimum 15% margin', 'fixed', '{}', '{}', 2)
ON CONFLICT DO NOTHING;

COMMIT;
