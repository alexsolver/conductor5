
-- Add isGlobal column to ticket_templates table
-- This migration adds hierarchical support for templates

ALTER TABLE ticket_templates 
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false NOT NULL;

-- Update existing templates to be global if they don't have a company_id
UPDATE ticket_templates 
SET is_global = true 
WHERE company_id IS NULL;

-- Update existing templates to be company-specific if they have a company_id
UPDATE ticket_templates 
SET is_global = false 
WHERE company_id IS NOT NULL;

-- Add index for better performance on hierarchical queries
CREATE INDEX IF NOT EXISTS idx_ticket_templates_is_global ON ticket_templates(tenant_id, is_global, is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_templates_company_specific ON ticket_templates(tenant_id, company_id, is_global, is_active) WHERE is_global = false;
CREATE INDEX IF NOT EXISTS idx_ticket_templates_global ON ticket_templates(tenant_id, is_global, is_active) WHERE is_global = true;

COMMENT ON COLUMN ticket_templates.is_global IS 'Indicates if template is global (available to all companies) or company-specific';
