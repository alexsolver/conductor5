-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================
-- ENUM DEFINITIONS
-- ==============================

DO $$ BEGIN
    CREATE TYPE customer_type_enum AS ENUM ('PF', 'PJ');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE location_type_enum AS ENUM ('warehouse', 'office', 'field', 'customer_site', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE item_type_enum AS ENUM ('material', 'service', 'tool', 'equipment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE measurement_unit_enum AS ENUM ('unit', 'meter', 'kilogram', 'liter', 'hour');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE movement_type_enum AS ENUM ('in', 'out', 'transfer', 'adjustment', 'return');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE approver_type_enum AS ENUM ('user', 'role', 'group', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE operator_enum AS ENUM ('equals', 'not_equals', 'greater_than', 'less_than', 'like');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE kb_category_enum AS ENUM ('general', 'technical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE kb_status_enum AS ENUM ('draft', 'review', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE kb_visibility_enum AS ENUM ('public', 'internal', 'restricted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE kb_approval_enum AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM ('info', 'warning', 'error', 'success');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_priority_enum AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel_enum AS ENUM ('email', 'sms', 'push', 'in_app');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_status_enum AS ENUM ('pending', 'sent', 'delivered', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE gdpr_request_enum AS ENUM ('access', 'rectification', 'erasure', 'restriction', 'portability');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE gdpr_status_enum AS ENUM ('pending', 'processing', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================
-- CORE BUSINESS TABLES
-- ==============================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    customer_type customer_type_enum,
    cpf VARCHAR(14),
    cnpj VARCHAR(18),
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    state VARCHAR(5),
    city VARCHAR(100),
    address VARCHAR(255),
    address_number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    zip_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Brasil',
    is_active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by_id UUID,
    updated_by_id UUID
);


CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    cnpj VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(255),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(10),
    zip_code VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Brasil',
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Brasil',
    description TEXT,
    industry VARCHAR(255),
    size VARCHAR(255),
    website VARCHAR(255),
    subscription_tier VARCHAR(255),
    status VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb
);


CREATE TABLE IF NOT EXISTS companies_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    company_id UUID NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'member',
    start_date DATE,
    end_date DATE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS beneficiaries (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    cnpj VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    ticket_number VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    status ticket_status_enum,
    priority ticket_priority_enum,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    customer_id UUID REFERENCES customers(id),
    assigned_to UUID,
    company_id UUID REFERENCES companies(id),
    location_id UUID,
    caller_id UUID,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    due_date TIMESTAMP,
    resolution_date TIMESTAMP,
    satisfaction_rating INTEGER,
    satisfaction_comment TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by_id UUID,
    updated_by_id UUID,
    template_name VARCHAR(255),
    template_alternative VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS ticket_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    company_id UUID,
    department_id UUID,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    template_type TEXT NOT NULL CHECK (template_type IN ('creation', 'edit')),

    -- colunas novas no lugar de "fields"
    required_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_fields   JSONB NOT NULL DEFAULT '[]'::jsonb,
    fields JSONB,

    automation JSONB DEFAULT '{}'::jsonb,
    workflow JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],
    is_default BOOLEAN DEFAULT FALSE,
    is_system  BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft',
    permissions JSONB DEFAULT '[]'::jsonb,

    created_by UUID,
    updated_by UUID,
    user_role UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



-- ==============================
-- LOCATIONS & GEOGRAPHY
-- ==============================

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type location_type_enum,
    code VARCHAR(50),
    description TEXT,
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Brasil',
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    parent_location_id UUID REFERENCES locations(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==============================
-- MATERIALS & SERVICES
-- ==============================

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type item_type_enum,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    unit_of_measurement measurement_unit_enum,
    unit_cost DECIMAL(10,2),
    stock_quantity DECIMAL(10,2) DEFAULT 0,
    minimum_stock DECIMAL(10,2) DEFAULT 0,
    maximum_stock DECIMAL(10,2),
    supplier_id UUID REFERENCES suppliers(id),
    brand VARCHAR(100),
    model VARCHAR(100),
    specifications JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3,2),
    payment_terms VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'BRL',
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    created_by_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    price_list_id UUID NOT NULL REFERENCES price_lists(id),
    item_id UUID NOT NULL REFERENCES items(id),
    unit_price DECIMAL(10,2),
    minimum_quantity DECIMAL(10,2) DEFAULT 1,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    markup_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ==============================
-- STOCK MANAGEMENT
-- ==============================

CREATE TABLE IF NOT EXISTS stock_locations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    type VARCHAR(50),
    parent_location_id UUID REFERENCES stock_locations(id),
    address JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_levels (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id),
    location_id UUID NOT NULL REFERENCES stock_locations(id),
    quantity_available DECIMAL(10,2) DEFAULT 0,
    quantity_reserved DECIMAL(10,2) DEFAULT 0,
    quantity_on_order DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id),
    location_id UUID NOT NULL REFERENCES stock_locations(id),
    movement_type movement_type_enum NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    performed_by UUID,
    performed_at TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now()
);
-- ==============================
-- TICKET MATERIALS & PLANNING
-- ==============================

CREATE TABLE IF NOT EXISTS ticket_planned_items (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    item_id UUID NOT NULL REFERENCES items(id),
    quantity_planned DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_consumed_items (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    item_id UUID NOT NULL REFERENCES items(id),
    quantity_consumed DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    consumed_at TIMESTAMP DEFAULT now(),
    consumed_by UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ==============================
-- CUSTOMER MAPPINGS
-- ==============================

CREATE TABLE IF NOT EXISTS customer_item_mappings (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    item_id UUID NOT NULL REFERENCES items(id),
    customer_item_code VARCHAR(100),
    customer_item_name VARCHAR(255),
    customer_item_description TEXT,
    unit_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==============================
-- USER MANAGEMENT
-- ==============================

CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by_id UUID,
    updated_by_id UUID
);

CREATE TABLE IF NOT EXISTS user_group_memberships (
  id            uuid        PRIMARY KEY,        -- gere o UUID na aplicação
  tenant_id     uuid        NOT NULL,
  user_id       uuid        NOT NULL,
  group_id      uuid        NOT NULL,
  role          varchar(50) NOT NULL DEFAULT 'member',
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamp   NOT NULL DEFAULT now(),
  updated_at    timestamp   NULL,
  created_by_id uuid        NULL,
  updated_by_id uuid        NULL
);


-- ==============================
-- APPROVAL SYSTEM
-- ==============================

CREATE TABLE IF NOT EXISTS approval_rules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module_type VARCHAR(50), -- ticket, purchase, expense, etc.
    entity_type VARCHAR(100),
    query_conditions JSONB DEFAULT '{}'::jsonb,
    approval_steps JSONB DEFAULT '[]'::jsonb,
    sla_hours INTEGER,
    business_hours_only BOOLEAN DEFAULT false,
    auto_approval_conditions JSONB DEFAULT '{}'::jsonb,
    escalation_settings JSONB DEFAULT '{}'::jsonb,
    company_id UUID REFERENCES companies(id),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_by_id UUID,
    updated_by_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_instances (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    rule_id UUID NOT NULL REFERENCES approval_rules(id),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(100),
    current_step_index INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    requested_by_id UUID,
    sla_deadline TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_decisions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    instance_id UUID NOT NULL REFERENCES approval_instances(id),
    step_index INTEGER,
    approver_id UUID NOT NULL,
    decision VARCHAR(20), -- approved, rejected, etc.
    comments TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_steps (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    rule_id UUID NOT NULL REFERENCES approval_rules(id),
    step_index INTEGER NOT NULL,
    name VARCHAR(255),
    approver_type approver_type_enum,
    approvers JSONB DEFAULT '[]'::jsonb,
    required_approvals INTEGER DEFAULT 1,
    timeout_hours INTEGER,
    escalation_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_conditions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    rule_id UUID NOT NULL REFERENCES approval_rules(id),
    field_name VARCHAR(100),
    operator operator_enum,
    value JSONB,
    logical_operator VARCHAR(10),
    group_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module_type VARCHAR(50),
    workflow_steps JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
-- ==============================
-- KNOWLEDGE BASE
-- ==============================

CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    excerpt TEXT,
    author_id UUID,
    category knowledge_base_category,
    status knowledge_base_status,
    visibility knowledge_base_visibility,
    approval_status knowledge_base_approval_status,
    tags JSONB DEFAULT '[]'::jsonb,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    slug VARCHAR(500),
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_base_article_versions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES knowledge_base_articles(id),
    version_number INTEGER NOT NULL,
    content TEXT,
    created_by_id UUID,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_base_attachments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES knowledge_base_articles(id),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_type VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_base_ratings (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES knowledge_base_articles(id),
    user_id UUID NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_base_approvals (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES knowledge_base_articles(id),
    approver_id UUID NOT NULL,
    status kb_approval_enum,
    comments TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_base_comments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES knowledge_base_articles(id),
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_base_templates (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    content TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ==============================
-- NOTIFICATIONS
-- ==============================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type_enum,
    priority notification_priority_enum,
    channel notification_channel_enum,
    status notification_status_enum DEFAULT 'pending',
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    frequency VARCHAR(20) DEFAULT 'immediate',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    categories JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject_template VARCHAR(255),
    body_template TEXT,
    type notification_type_enum,
    channel notification_channel_enum,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_notifications (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title VARCHAR(255),
    description TEXT,
    scheduled_date TIMESTAMP,
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMP, 
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ==============================
-- REPORTS & DASHBOARDS
-- ==============================

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query_definition JSONB DEFAULT '{}'::jsonb,
    visualization_config JSONB DEFAULT '{}'::jsonb,
    parameters JSONB DEFAULT '{}'::jsonb,
    schedule JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    created_by_id UUID,
    updated_by_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout_config JSONB DEFAULT '{}'::jsonb,
    widgets JSONB DEFAULT '[]'::jsonb,
    permissions JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    created_by_id UUID,
    updated_by_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    dashboard_id UUID NOT NULL REFERENCES dashboards(id),
    widget_type VARCHAR(50),
    title VARCHAR(255),
    configuration JSONB DEFAULT '{}'::jsonb,
    data_source JSONB DEFAULT '{}'::jsonb,
    position JSONB DEFAULT '{}'::jsonb,
    size JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ==============================
-- GDPR COMPLIANCE
-- ==============================

CREATE TABLE IF NOT EXISTS gdpr_data_requests (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    request_type gdpr_request_enum NOT NULL,
    subject_email VARCHAR(255) NOT NULL,
    subject_name VARCHAR(255),
    description TEXT,
    status gdpr_status_enum DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT now(),
    processed_at TIMESTAMP,
    processed_by_id UUID,
    response_data JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gdpr_consent_records (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    consent_type VARCHAR(100),
    purpose TEXT,
    legal_basis VARCHAR(100),
    granted BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT now(),
    withdrawn_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gdpr_audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- ==============================
-- ACTIVITY TRACKING
-- ==============================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);
-- ==============================
-- OMNIBRIDGE (Communication)
-- ==============================

CREATE TABLE IF NOT EXISTS omnibridge_channels (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    integration_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    config JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    icon VARCHAR(50),
    last_sync TIMESTAMP,
    metrics JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS omnibridge_messages (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    channel_id VARCHAR(36) NOT NULL REFERENCES omnibridge_channels(id),
    channel_type VARCHAR(50),
    from_address TEXT,
    to_address TEXT,
    subject TEXT,
    content TEXT,
    timestamp TIMESTAMP DEFAULT now(),
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    tags JSONB DEFAULT '[]'::jsonb,
    attachments INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS omnibridge_chatbots (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    configuration JSONB DEFAULT '{}'::jsonb,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by VARCHAR(36),
    updated_by VARCHAR(36)
);


-- ==============================
-- TICKET MESSAGES
-- ==============================
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'user', -- user/system/bot
    created_at TIMESTAMP DEFAULT now()
);

-- ==============================
-- SKILLS
-- ==============================
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    level_min INTEGER DEFAULT 1,
    level_max INTEGER DEFAULT 5,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT skills_tenant_name_unique UNIQUE (tenant_id, name)
);

-- ==============================
-- TICKET FIELD CONFIGURATIONS
-- ==============================
CREATE TABLE IF NOT EXISTS ticket_field_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- text, number, select, checkbox...
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER,
    options JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT ticket_field_unique UNIQUE (tenant_id, field_name)
);

-- ==============================
-- TICKET FIELD OPTIONS
-- ==============================
CREATE TABLE IF NOT EXISTS ticket_field_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL, -- referência ao cliente/empresa dono da opção
    field_name VARCHAR(255) NOT NULL, -- nome do campo configurado
    value VARCHAR(255) NOT NULL,      -- valor armazenado (ex: chave)
    label VARCHAR(255) NOT NULL,      -- rótulo exibido ao usuário
    color VARCHAR(50),                -- cor opcional para exibição
    sort_order INTEGER,               -- ordem de exibição
    is_active BOOLEAN DEFAULT true,   -- ativo ou não
    is_default BOOLEAN DEFAULT false, -- se é a opção padrão
    status_type VARCHAR(50),          -- categoria/tipo de status
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);


-- ==============================
-- TICKET CATEGORIES
-- ==============================
CREATE TABLE IF NOT EXISTS ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ==============================
-- TICKET SUBCATEGORIES
-- ==============================
CREATE TABLE IF NOT EXISTS ticket_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID,
    category_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id) ON DELETE CASCADE
);

-- ==============================
-- TICKET ACTIONS
-- ==============================
CREATE TABLE IF NOT EXISTS ticket_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID,
    subcategory_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_time_minutes INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    action_type VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (subcategory_id) REFERENCES ticket_subcategories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  role VARCHAR(50) NOT NULL DEFAULT 'agent',
  tenant_id UUID NOT NULL,
  profile_image_url VARCHAR,

  -- Dados Básicos
  integration_code VARCHAR(100),
  alternative_email VARCHAR,
  cell_phone VARCHAR(20),
  phone VARCHAR(20),
  ramal VARCHAR(20),
  time_zone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  vehicle_type VARCHAR(50),
  cpf_cnpj VARCHAR(20),
  supervisor_ids TEXT[],

  -- Endereço
  cep VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Brasil',
  state VARCHAR(100),
  city VARCHAR(100),
  street_address VARCHAR,
  house_type VARCHAR(50),
  house_number VARCHAR(20),
  complement VARCHAR,
  neighborhood VARCHAR(100),

  -- Dados RH
  employee_code VARCHAR(50),
  pis VARCHAR(20),
  cargo VARCHAR(100),
  ctps VARCHAR(50),
  serie_number VARCHAR(20),
  admission_date TIMESTAMP,
  cost_center VARCHAR(100),

  -- HR Extension
  position VARCHAR(100),
  department_id UUID,
  performance INTEGER DEFAULT 75,
  last_active_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  goals INTEGER DEFAULT 0,
  completed_goals INTEGER DEFAULT 0,

  -- Employment Type
  employment_type VARCHAR(20) DEFAULT 'clt',

  -- System fields
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email)
);


CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  operating_system VARCHAR(100),
  ip_address VARCHAR(45),
  location JSONB,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT user_sessions_tenant_token_unique UNIQUE (tenant_id, session_token)
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- redundância saudável pra garantir
  name TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}', -- array de strings (ids das permissões)
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  user_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (tenant_id, user_id, role_id)
);


CREATE TABLE IF NOT EXISTS locais (
    id uuid PRIMARY KEY,
    tenant_id UUID NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    nome TEXT NOT NULL,
    descricao TEXT,
    codigo_integracao TEXT,
    tipo_cliente_favorecido TEXT,
    tecnico_principal_id UUID,
    email TEXT,
    ddd TEXT,
    telefone TEXT,
    cep TEXT,
    pais TEXT DEFAULT 'Brasil',
    estado TEXT,
    municipio TEXT,
    bairro TEXT,
    tipo_logradouro TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geo_coordenadas JSONB,
    fuso_horario TEXT DEFAULT 'America/Sao_Paulo',
    feriados_incluidos JSONB,
    indisponibilidades JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- ==============================
-- Função genérica para atualizar updated_at
-- ==============================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- Triggers para cada tabela
-- ==============================

-- Core business
DROP TRIGGER IF EXISTS trg_customers_updated ON customers;
CREATE TRIGGER trg_customers_updated
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_companies_updated ON companies;
CREATE TRIGGER trg_companies_updated
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_beneficiaries_updated ON beneficiaries;
CREATE TRIGGER trg_beneficiaries_updated
    BEFORE UPDATE ON beneficiaries
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tickets_updated ON tickets;
CREATE TRIGGER trg_tickets_updated
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Locations
DROP TRIGGER IF EXISTS trg_locations_updated ON locations;
CREATE TRIGGER trg_locations_updated
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Items & suppliers
DROP TRIGGER IF EXISTS trg_items_updated ON items;
CREATE TRIGGER trg_items_updated
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_suppliers_updated ON suppliers;
CREATE TRIGGER trg_suppliers_updated
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_price_lists_updated ON price_lists;
CREATE TRIGGER trg_price_lists_updated
    BEFORE UPDATE ON price_lists
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_price_list_items_updated ON price_list_items;
CREATE TRIGGER trg_price_list_items_updated
    BEFORE UPDATE ON price_list_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Stock
DROP TRIGGER IF EXISTS trg_stock_locations_updated ON stock_locations;
CREATE TRIGGER trg_stock_locations_updated
    BEFORE UPDATE ON stock_locations
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_stock_levels_updated ON stock_levels;
CREATE TRIGGER trg_stock_levels_updated
    BEFORE UPDATE ON stock_levels
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_stock_movements_updated ON stock_movements;
CREATE TRIGGER trg_stock_movements_updated
    BEFORE UPDATE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Tickets x items
DROP TRIGGER IF EXISTS trg_ticket_planned_items_updated ON ticket_planned_items;
CREATE TRIGGER trg_ticket_planned_items_updated
    BEFORE UPDATE ON ticket_planned_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_ticket_consumed_items_updated ON ticket_consumed_items;
CREATE TRIGGER trg_ticket_consumed_items_updated
    BEFORE UPDATE ON ticket_consumed_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Customer mapping
DROP TRIGGER IF EXISTS trg_customer_item_mappings_updated ON customer_item_mappings;
CREATE TRIGGER trg_customer_item_mappings_updated
    BEFORE UPDATE ON customer_item_mappings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- User groups
DROP TRIGGER IF EXISTS trg_user_groups_updated ON user_groups;
CREATE TRIGGER trg_user_groups_updated
    BEFORE UPDATE ON user_groups
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Approval system
DROP TRIGGER IF EXISTS trg_approval_rules_updated ON approval_rules;
CREATE TRIGGER trg_approval_rules_updated
    BEFORE UPDATE ON approval_rules
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_approval_instances_updated ON approval_instances;
CREATE TRIGGER trg_approval_instances_updated
    BEFORE UPDATE ON approval_instances
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_approval_decisions_updated ON approval_decisions;
CREATE TRIGGER trg_approval_decisions_updated
    BEFORE UPDATE ON approval_decisions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_approval_steps_updated ON approval_steps;
CREATE TRIGGER trg_approval_steps_updated
    BEFORE UPDATE ON approval_steps
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_approval_conditions_updated ON approval_conditions;
CREATE TRIGGER trg_approval_conditions_updated
    BEFORE UPDATE ON approval_conditions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_approval_workflows_updated ON approval_workflows;
CREATE TRIGGER trg_approval_workflows_updated
    BEFORE UPDATE ON approval_workflows
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Knowledge base
DROP TRIGGER IF EXISTS trg_kb_articles_updated ON knowledge_base_articles;
CREATE TRIGGER trg_kb_articles_updated
    BEFORE UPDATE ON knowledge_base_articles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_kb_article_versions_updated ON knowledge_base_article_versions;
CREATE TRIGGER trg_kb_article_versions_updated
    BEFORE UPDATE ON knowledge_base_article_versions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_kb_attachments_updated ON knowledge_base_attachments;
CREATE TRIGGER trg_kb_attachments_updated
    BEFORE UPDATE ON knowledge_base_attachments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_kb_ratings_updated ON knowledge_base_ratings;
CREATE TRIGGER trg_kb_ratings_updated
    BEFORE UPDATE ON knowledge_base_ratings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_kb_approvals_updated ON knowledge_base_approvals;
CREATE TRIGGER trg_kb_approvals_updated
    BEFORE UPDATE ON knowledge_base_approvals
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_kb_comments_updated ON knowledge_base_comments;
CREATE TRIGGER trg_kb_comments_updated
    BEFORE UPDATE ON knowledge_base_comments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_kb_templates_updated ON knowledge_base_templates;
CREATE TRIGGER trg_kb_templates_updated
    BEFORE UPDATE ON knowledge_base_templates
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Notifications
DROP TRIGGER IF EXISTS trg_notifications_updated ON notifications;
CREATE TRIGGER trg_notifications_updated
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_notif_prefs_updated ON user_notification_preferences;
CREATE TRIGGER trg_user_notif_prefs_updated
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_notification_templates_updated ON notification_templates;
CREATE TRIGGER trg_notification_templates_updated
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_schedule_notifications_updated ON schedule_notifications;
CREATE TRIGGER trg_schedule_notifications_updated
    BEFORE UPDATE ON schedule_notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Reports & dashboards
DROP TRIGGER IF EXISTS trg_reports_updated ON reports;
CREATE TRIGGER trg_reports_updated
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dashboards_updated ON dashboards;
CREATE TRIGGER trg_dashboards_updated
    BEFORE UPDATE ON dashboards
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dashboard_widgets_updated ON dashboard_widgets;
CREATE TRIGGER trg_dashboard_widgets_updated
    BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- GDPR
DROP TRIGGER IF EXISTS trg_gdpr_requests_updated ON gdpr_data_requests;
CREATE TRIGGER trg_gdpr_requests_updated
    BEFORE UPDATE ON gdpr_data_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_gdpr_consent_updated ON gdpr_consent_records;
CREATE TRIGGER trg_gdpr_consent_updated
    BEFORE UPDATE ON gdpr_consent_records
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_gdpr_audit_logs_updated ON gdpr_audit_logs;
CREATE TRIGGER trg_gdpr_audit_logs_updated
    BEFORE UPDATE ON gdpr_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Activity
DROP TRIGGER IF EXISTS trg_activity_logs_updated ON activity_logs;
CREATE TRIGGER trg_activity_logs_updated
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Omnibridge
DROP TRIGGER IF EXISTS trg_omni_channels_updated ON omnibridge_channels;
CREATE TRIGGER trg_omni_channels_updated
    BEFORE UPDATE ON omnibridge_channels
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_omni_messages_updated ON omnibridge_messages;
CREATE TRIGGER trg_omni_messages_updated
    BEFORE UPDATE ON omnibridge_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_omni_chatbots_updated ON omnibridge_chatbots;
CREATE TRIGGER trg_omni_chatbots_updated
    BEFORE UPDATE ON omnibridge_chatbots
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();