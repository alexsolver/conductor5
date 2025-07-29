
-- Tabelas para Configuração Hierárquica de Tickets
-- Execute este script em cada schema de tenant

-- Nível 2: Categorias (por empresa cliente)
CREATE TABLE IF NOT EXISTS ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_ticket_categories_company FOREIGN KEY (company_id) REFERENCES customer_companies(id) ON DELETE CASCADE
);

-- Nível 3: Subcategorias (dependentes de categoria)
CREATE TABLE IF NOT EXISTS ticket_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    category_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_ticket_subcategories_category FOREIGN KEY (category_id) REFERENCES ticket_categories(id) ON DELETE CASCADE
);

-- Nível 4: Ações (dependentes de subcategoria)
CREATE TABLE IF NOT EXISTS ticket_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    subcategory_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_time_minutes INTEGER,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_ticket_actions_subcategory FOREIGN KEY (subcategory_id) REFERENCES ticket_subcategories(id) ON DELETE CASCADE
);

-- Configuração de opções de campos (status, priority, impact, urgency)
CREATE TABLE IF NOT EXISTS ticket_field_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    field_name VARCHAR(50) NOT NULL, -- 'status', 'priority', 'impact', 'urgency'
    value VARCHAR(50) NOT NULL,
    display_label VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_ticket_field_options_company FOREIGN KEY (company_id) REFERENCES customer_companies(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, company_id, field_name, value)
);

-- Configuração de numeração de tickets (por empresa)
CREATE TABLE IF NOT EXISTS ticket_numbering_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT 'T',
    year_format VARCHAR(1) DEFAULT '4' CHECK (year_format IN ('2', '4')),
    sequential_digits INTEGER DEFAULT 6 CHECK (sequential_digits BETWEEN 4 AND 10),
    separator VARCHAR(5) DEFAULT '-',
    reset_yearly BOOLEAN DEFAULT true,
    current_sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_ticket_numbering_company FOREIGN KEY (company_id) REFERENCES customer_companies(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, company_id)
);

-- Regras de validação (por empresa e campo)
CREATE TABLE IF NOT EXISTS ticket_validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    validation_pattern TEXT, -- Regex pattern
    error_message VARCHAR(255),
    default_value VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_ticket_validation_company FOREIGN KEY (company_id) REFERENCES customer_companies(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, company_id, field_name)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_ticket_categories_company ON ticket_categories(tenant_id, company_id, active);
CREATE INDEX IF NOT EXISTS idx_ticket_subcategories_category ON ticket_subcategories(tenant_id, category_id, active);
CREATE INDEX IF NOT EXISTS idx_ticket_actions_subcategory ON ticket_actions(tenant_id, subcategory_id, active);
CREATE INDEX IF NOT EXISTS idx_ticket_field_options_lookup ON ticket_field_options(tenant_id, company_id, field_name, active);
CREATE INDEX IF NOT EXISTS idx_ticket_numbering_company ON ticket_numbering_config(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_validation_company ON ticket_validation_rules(tenant_id, company_id, field_name);

-- Comentários para documentação
COMMENT ON TABLE ticket_categories IS 'Nível 2 da hierarquia: Categorias macro por empresa cliente';
COMMENT ON TABLE ticket_subcategories IS 'Nível 3 da hierarquia: Subcategorias dependentes de categoria';
COMMENT ON TABLE ticket_actions IS 'Nível 4 da hierarquia: Ações específicas dependentes de subcategoria';
COMMENT ON TABLE ticket_field_options IS 'Opções configuráveis para campos de classificação (status, priority, etc)';
COMMENT ON TABLE ticket_numbering_config IS 'Configuração de numeração personalizada por empresa';
COMMENT ON TABLE ticket_validation_rules IS 'Regras de validação e obrigatoriedade por campo e empresa';
