-- Tabelas de configuração de tickets
-- 1. Tabela de categorias principais (Nível 2 da hierarquia)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de subcategorias (Nível 3 da hierarquia)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de ações (Nível 4 da hierarquia)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de opções de campos (status, priority, impact, urgency)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de configuração de numeração
CREATE TABLE IF NOT EXISTS ticket_numbering_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    year_format VARCHAR(1) DEFAULT '4',
    sequential_digits INTEGER DEFAULT 6,
    separator VARCHAR(5) DEFAULT '-',
    reset_yearly BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de regras de validação
CREATE TABLE IF NOT EXISTS ticket_validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    validation_pattern TEXT,
    error_message VARCHAR(255),
    default_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ticket_categories_tenant_company ON ticket_categories(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_subcategories_tenant_category ON ticket_subcategories(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_ticket_actions_tenant_subcategory ON ticket_actions(tenant_id, subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ticket_field_options_tenant_company ON ticket_field_options(tenant_id, company_id, field_name);
CREATE INDEX IF NOT EXISTS idx_ticket_numbering_config_tenant_company ON ticket_numbering_config(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_validation_rules_tenant_company ON ticket_validation_rules(tenant_id, company_id, field_name);