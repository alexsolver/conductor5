-- ===========================
-- MIGRATION: CREATE CUSTOM FIELDS SYSTEM TABLES
-- Description: Creates tables for universal metadata and custom fields system
-- Author: System Administrator
-- Date: 2025-01-27
-- ===========================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================
-- CUSTOM FIELDS METADATA TABLE
-- ===========================

CREATE TABLE IF NOT EXISTS custom_fields_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  module_type VARCHAR(50) NOT NULL CHECK (module_type IN ('customers', 'favorecidos', 'tickets', 'skills', 'materials-services', 'locations')),
  field_name VARCHAR(100) NOT NULL,
  field_type VARCHAR(30) NOT NULL CHECK (field_type IN ('text', 'number', 'select', 'multiselect', 'date', 'boolean', 'textarea', 'file', 'email', 'phone')),
  field_label VARCHAR(200) NOT NULL,
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB,
  field_options JSONB,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID,

  -- Constraints
  CONSTRAINT custom_fields_metadata_unique_field_per_tenant_module 
    UNIQUE (tenant_id, module_type, field_name),
  
  -- Indexes for performance
  INDEX idx_custom_fields_metadata_tenant_module (tenant_id, module_type),
  INDEX idx_custom_fields_metadata_field_name (field_name),
  INDEX idx_custom_fields_metadata_display_order (display_order)
);

-- ===========================
-- CUSTOM FIELDS VALUES TABLE  
-- ===========================

CREATE TABLE IF NOT EXISTS custom_fields_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  field_id UUID NOT NULL REFERENCES custom_fields_metadata(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('customers', 'favorecidos', 'tickets', 'skills', 'materials-services', 'locations')),
  field_value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT custom_fields_values_unique_field_entity 
    UNIQUE (tenant_id, field_id, entity_id, entity_type),
  
  -- Indexes for performance
  INDEX idx_custom_fields_values_tenant_entity (tenant_id, entity_type, entity_id),
  INDEX idx_custom_fields_values_field_id (field_id),
  INDEX idx_custom_fields_values_entity_id (entity_id)
);

-- ===========================
-- TENANT MODULE ACCESS TABLE
-- ===========================

CREATE TABLE IF NOT EXISTS tenant_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  module_type VARCHAR(50) NOT NULL CHECK (module_type IN ('customers', 'favorecidos', 'tickets', 'skills', 'materials-services', 'locations')),
  is_enabled BOOLEAN DEFAULT true,
  configuration JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT tenant_module_access_unique_tenant_module 
    UNIQUE (tenant_id, module_type),
  
  -- Indexes for performance
  INDEX idx_tenant_module_access_tenant_id (tenant_id),
  INDEX idx_tenant_module_access_module_type (module_type)
);

-- ===========================
-- CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===========================

-- Additional composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_custom_fields_metadata_tenant_active 
  ON custom_fields_metadata (tenant_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_custom_fields_values_tenant_field 
  ON custom_fields_values (tenant_id, field_id);

CREATE INDEX IF NOT EXISTS idx_custom_fields_metadata_created_by 
  ON custom_fields_metadata (created_by);

-- Partial index for required fields only
CREATE INDEX IF NOT EXISTS idx_custom_fields_metadata_required 
  ON custom_fields_metadata (tenant_id, module_type, is_required) 
  WHERE is_required = true;

-- ===========================
-- INSERT SAMPLE DATA FOR TESTING (OPTIONAL)
-- ===========================

-- Sample tenant module access (all modules enabled by default)
INSERT INTO tenant_module_access (tenant_id, module_type, is_enabled, configuration) 
VALUES 
  ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'customers', true, '{}'),
  ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'favorecidos', true, '{}'),
  ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'tickets', true, '{}'),
  ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'skills', true, '{}'),
  ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'materials-services', true, '{}'),
  ('3f99462f-3621-4b1b-bea8-782acc50d62e', 'locations', true, '{}')
ON CONFLICT (tenant_id, module_type) DO NOTHING;

-- Sample custom fields for tickets module
INSERT INTO custom_fields_metadata (
  tenant_id, 
  module_type, 
  field_name, 
  field_type, 
  field_label, 
  is_required, 
  validation_rules, 
  field_options, 
  display_order,
  created_by
) VALUES 
(
  '3f99462f-3621-4b1b-bea8-782acc50d62e',
  'tickets',
  'equipment_type',
  'select',
  'Tipo de Equipamento',
  true,
  '{"required": true}',
  '[
    {"value": "computer", "label": "Computador", "color": "#3b82f6"},
    {"value": "printer", "label": "Impressora", "color": "#10b981"},
    {"value": "network", "label": "Equipamento de Rede", "color": "#f59e0b"},
    {"value": "phone", "label": "Telefone", "color": "#8b5cf6"}
  ]',
  1,
  '550e8400-e29b-41d4-a716-446655440001'
),
(
  '3f99462f-3621-4b1b-bea8-782acc50d62e',
  'tickets',
  'affected_users_count',
  'number',
  'Número de Usuários Afetados',
  false,
  '{"min": 1, "max": 1000}',
  '[]',
  2,
  '550e8400-e29b-41d4-a716-446655440001'
),
(
  '3f99462f-3621-4b1b-bea8-782acc50d62e',
  'tickets',
  'business_impact',
  'textarea',
  'Impacto no Negócio',
  true,
  '{"required": true, "maxLength": 500}',
  '[]',
  3,
  '550e8400-e29b-41d4-a716-446655440001'
),
(
  '3f99462f-3621-4b1b-bea8-782acc50d62e',
  'tickets',
  'incident_location',
  'text',
  'Local do Incidente',
  false,
  '{"maxLength": 100}',
  '[]',
  4,
  '550e8400-e29b-41d4-a716-446655440001'
);

-- Sample custom fields for customers module
INSERT INTO custom_fields_metadata (
  tenant_id, 
  module_type, 
  field_name, 
  field_type, 
  field_label, 
  is_required, 
  validation_rules, 
  field_options, 
  display_order,
  created_by
) VALUES 
(
  '3f99462f-3621-4b1b-bea8-782acc50d62e',
  'customers',
  'customer_segment',
  'select',
  'Segmento do Cliente',
  true,
  '{"required": true}',
  '[
    {"value": "enterprise", "label": "Corporativo", "color": "#1f2937"},
    {"value": "sme", "label": "Pequena/Média Empresa", "color": "#059669"},
    {"value": "startup", "label": "Startup", "color": "#dc2626"},
    {"value": "government", "label": "Governo", "color": "#7c3aed"}
  ]',
  1,
  '550e8400-e29b-41d4-a716-446655440001'
),
(
  '3f99462f-3621-4b1b-bea8-782acc50d62e',
  'customers',
  'contract_value',
  'number',
  'Valor do Contrato (R$)',
  false,
  '{"min": 0}',
  '[]',
  2,
  '550e8400-e29b-41d4-a716-446655440001'
),
(
  '3f99462f-3621-4b1b-bea8-782acc50d62e',
  'customers',
  'requires_sla',
  'boolean',
  'Requer SLA Diferenciado',
  false,
  '{}',
  '[]',
  3,
  '550e8400-e29b-41d4-a716-446655440001'
);

-- ===========================
-- COMMENTS FOR DOCUMENTATION
-- ===========================

COMMENT ON TABLE custom_fields_metadata IS 'Armazena definições de campos customizados para diferentes módulos do sistema';
COMMENT ON TABLE custom_fields_values IS 'Armazena valores dos campos customizados para entidades específicas';
COMMENT ON TABLE tenant_module_access IS 'Controla quais módulos estão habilitados para cada tenant (SaaS)';

COMMENT ON COLUMN custom_fields_metadata.module_type IS 'Módulo ao qual o campo pertence (customers, tickets, etc.)';
COMMENT ON COLUMN custom_fields_metadata.field_type IS 'Tipo do campo (text, select, date, etc.)';
COMMENT ON COLUMN custom_fields_metadata.validation_rules IS 'Regras de validação em formato JSON';
COMMENT ON COLUMN custom_fields_metadata.field_options IS 'Opções para campos select/multiselect em formato JSON';

COMMENT ON COLUMN custom_fields_values.field_value IS 'Valor do campo em formato JSON para suportar diferentes tipos';
COMMENT ON COLUMN custom_fields_values.entity_id IS 'ID da entidade (customer, ticket, etc.) à qual o valor pertence';

-- ===========================
-- VERIFICATION QUERIES
-- ===========================

-- Verificar se as tabelas foram criadas
SELECT 'custom_fields_metadata' as table_name, COUNT(*) as records FROM custom_fields_metadata
UNION ALL
SELECT 'custom_fields_values' as table_name, COUNT(*) as records FROM custom_fields_values  
UNION ALL
SELECT 'tenant_module_access' as table_name, COUNT(*) as records FROM tenant_module_access;

-- Verificar campos customizados criados
SELECT 
  module_type,
  field_name,
  field_type,
  field_label,
  is_required,
  is_active
FROM custom_fields_metadata 
WHERE tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e'
ORDER BY module_type, display_order;

-- ===========================
-- MIGRATION COMPLETE
-- ===========================

COMMIT;