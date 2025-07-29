
-- Script para criar tabelas de configuração hierárquica de tickets
-- Tabelas: ticket_categories, ticket_subcategories, ticket_actions, ticket_field_options, ticket_numbering_config

-- Tabela de Categorias (Nível 1)
CREATE TABLE IF NOT EXISTS ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para ticket_categories
CREATE INDEX IF NOT EXISTS idx_ticket_categories_tenant_company ON ticket_categories(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_categories_active ON ticket_categories(tenant_id, active);

-- Tabela de Subcategorias (Nível 2)
CREATE TABLE IF NOT EXISTS ticket_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    category_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_subcategories_category FOREIGN KEY (category_id) REFERENCES ticket_categories(id) ON DELETE CASCADE
);

-- Índices para ticket_subcategories
CREATE INDEX IF NOT EXISTS idx_ticket_subcategories_tenant_company ON ticket_subcategories(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_subcategories_category ON ticket_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_ticket_subcategories_active ON ticket_subcategories(tenant_id, active);

-- Tabela de Ações (Nível 3)
CREATE TABLE IF NOT EXISTS ticket_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    subcategory_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_time_minutes INTEGER,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_actions_subcategory FOREIGN KEY (subcategory_id) REFERENCES ticket_subcategories(id) ON DELETE CASCADE
);

-- Índices para ticket_actions
CREATE INDEX IF NOT EXISTS idx_ticket_actions_tenant_company ON ticket_actions(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_actions_subcategory ON ticket_actions(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ticket_actions_active ON ticket_actions(tenant_id, active);

-- Tabela de Opções de Campos (status, priority, impact, urgency)
CREATE TABLE IF NOT EXISTS ticket_field_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    value VARCHAR(100) NOT NULL,
    display_label VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para ticket_field_options
CREATE INDEX IF NOT EXISTS idx_ticket_field_options_tenant_company ON ticket_field_options(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_field_options_field ON ticket_field_options(tenant_id, field_name);
CREATE INDEX IF NOT EXISTS idx_ticket_field_options_active ON ticket_field_options(tenant_id, active);

-- Tabela de Configuração de Numeração
CREATE TABLE IF NOT EXISTS ticket_numbering_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    year_format VARCHAR(1) DEFAULT '4',
    sequential_digits INTEGER DEFAULT 6,
    separator VARCHAR(5) DEFAULT '-',
    reset_yearly BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para ticket_numbering_config
CREATE INDEX IF NOT EXISTS idx_ticket_numbering_config_tenant_company ON ticket_numbering_config(tenant_id, company_id);

-- Tabela de Regras de Validação
CREATE TABLE IF NOT EXISTS ticket_validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    validation_pattern TEXT,
    error_message TEXT,
    default_value TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para ticket_validation_rules
CREATE INDEX IF NOT EXISTS idx_ticket_validation_rules_tenant_company ON ticket_validation_rules(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_validation_rules_field ON ticket_validation_rules(tenant_id, field_name);
