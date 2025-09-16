
-- Add missing columns to existing tenant tables
ALTER TABLE ticket_categories 
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE ticket_subcategories 
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE ticket_actions 
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add ticket_field_options table if it doesn't exist
CREATE TABLE IF NOT EXISTS ticket_field_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    field_value VARCHAR(100) NOT NULL,
    label VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Add ticket_numbering_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS ticket_numbering_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    prefix VARCHAR(10) DEFAULT 'TKT',
    next_number INTEGER DEFAULT 1,
    padding_length INTEGER DEFAULT 6,
    reset_annually BOOLEAN DEFAULT false,
    separator VARCHAR(5) DEFAULT '-',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT ticket_numbering_config_company_unique UNIQUE (tenant_id, company_id)
);


CREATE TABLE IF NOT EXISTS ticket_list_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by_id UUID NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    columns JSONB NOT NULL,
    filters JSONB NOT NULL DEFAULT '[]'::jsonb,
    sorting JSONB NOT NULL DEFAULT '[]'::jsonb,
    page_size INTEGER NOT NULL DEFAULT 25,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
