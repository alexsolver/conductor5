
-- Internal Forms Tables Migration - Phase 10 Implementation
-- ✅ 1QA.MD MULTITENANT COMPLIANCE: All tables in tenant schemas with proper constraints

-- This script should be run for each tenant schema
-- Replace {TENANT_SCHEMA} with actual tenant schema name (e.g., tenant_uuid)

-- Create internal_forms table
CREATE TABLE IF NOT EXISTS "{TENANT_SCHEMA}".internal_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    
    -- ✅ CONSTRAINT obrigatório para tenant_id UUID v4
    CONSTRAINT tenant_id_uuid_format 
    CHECK (LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'),
    
    -- ✅ UNIQUE constraints sempre com tenant_id
    CONSTRAINT unique_internal_form_name_per_tenant UNIQUE (tenant_id, name)
);

-- Create internal_form_submissions table
CREATE TABLE IF NOT EXISTS "{TENANT_SCHEMA}".internal_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    submitted_by UUID NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- ✅ CONSTRAINT obrigatório para tenant_id UUID v4
    CONSTRAINT tenant_id_uuid_format 
    CHECK (LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'),
    
    -- Status constraint
    CONSTRAINT valid_submission_status 
    CHECK (status IN ('submitted', 'in_approval', 'approved', 'rejected'))
);

-- Create internal_form_categories table
CREATE TABLE IF NOT EXISTS "{TENANT_SCHEMA}".internal_form_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- ✅ CONSTRAINT obrigatório para tenant_id UUID v4
    CONSTRAINT tenant_id_uuid_format 
    CHECK (LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'),
    
    -- ✅ UNIQUE constraints sempre com tenant_id
    CONSTRAINT unique_internal_form_category_name_per_tenant UNIQUE (tenant_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_internal_forms_tenant_id ON "{TENANT_SCHEMA}".internal_forms (tenant_id);
CREATE INDEX IF NOT EXISTS idx_internal_forms_category ON "{TENANT_SCHEMA}".internal_forms (category);
CREATE INDEX IF NOT EXISTS idx_internal_forms_active ON "{TENANT_SCHEMA}".internal_forms (is_active);
CREATE INDEX IF NOT EXISTS idx_internal_forms_created_at ON "{TENANT_SCHEMA}".internal_forms (created_at);

CREATE INDEX IF NOT EXISTS idx_internal_form_submissions_form_id ON "{TENANT_SCHEMA}".internal_form_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_internal_form_submissions_tenant_id ON "{TENANT_SCHEMA}".internal_form_submissions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_internal_form_submissions_status ON "{TENANT_SCHEMA}".internal_form_submissions (status);
CREATE INDEX IF NOT EXISTS idx_internal_form_submissions_submitted_at ON "{TENANT_SCHEMA}".internal_form_submissions (submitted_at);

CREATE INDEX IF NOT EXISTS idx_internal_form_categories_tenant_id ON "{TENANT_SCHEMA}".internal_form_categories (tenant_id);
CREATE INDEX IF NOT EXISTS idx_internal_form_categories_active ON "{TENANT_SCHEMA}".internal_form_categories (is_active);

-- Insert default categories
INSERT INTO "{TENANT_SCHEMA}".internal_form_categories (tenant_id, name, icon, color, is_active) 
VALUES 
    ('{TENANT_ID}', 'Geral', 'FileText', '#3B82F6', true),
    ('{TENANT_ID}', 'Acesso', 'Key', '#10B981', true),
    ('{TENANT_ID}', 'Suporte', 'HelpCircle', '#F59E0B', true),
    ('{TENANT_ID}', 'Aquisição', 'ShoppingCart', '#EF4444', true),
    ('{TENANT_ID}', 'Recursos Humanos', 'Users', '#8B5CF6', true)
ON CONFLICT (tenant_id, name) DO NOTHING;
