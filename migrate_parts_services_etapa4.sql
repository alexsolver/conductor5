
-- ===============================================
-- ETAPA 4: INTEGRAÇÃO DE SERVIÇOS E AUTOMAÇÕES
-- Estruturas de banco para Work Orders, Integrações e Contratos
-- ===============================================

-- Tabela de Work Orders Automáticos
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD')),
    work_order_type VARCHAR(50) DEFAULT 'MAINTENANCE' CHECK (work_order_type IN ('MAINTENANCE', 'REPAIR', 'INSTALLATION', 'INSPECTION', 'EMERGENCY')),
    
    -- Integração com tickets
    source_ticket_id UUID,
    auto_created BOOLEAN DEFAULT false,
    
    -- Peças e localização
    part_id UUID,
    location_id UUID,
    estimated_quantity INTEGER DEFAULT 1,
    
    -- Datas e prazos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Responsáveis
    assigned_to UUID,
    created_by UUID NOT NULL,
    completed_by UUID,
    
    -- Custos estimados
    estimated_cost DECIMAL(15,2) DEFAULT 0.00,
    actual_cost DECIMAL(15,2) DEFAULT 0.00,
    labor_hours DECIMAL(8,2) DEFAULT 0.00,
    
    -- Workflow e automação
    automation_rule_id UUID,
    workflow_status JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    -- Auditoria
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Integrações Externas
CREATE TABLE IF NOT EXISTS external_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    integration_name VARCHAR(100) NOT NULL,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('ERP', 'CRM', 'WMS', 'API', 'WEBHOOK', 'DATABASE')),
    
    -- Configuração da integração
    endpoint_url TEXT,
    api_key_encrypted TEXT,
    auth_method VARCHAR(30) DEFAULT 'API_KEY' CHECK (auth_method IN ('API_KEY', 'OAUTH', 'BASIC_AUTH', 'TOKEN')),
    
    -- Mapeamento de campos
    field_mapping JSONB DEFAULT '{}',
    sync_direction VARCHAR(20) DEFAULT 'BIDIRECTIONAL' CHECK (sync_direction IN ('INBOUND', 'OUTBOUND', 'BIDIRECTIONAL')),
    
    -- Configurações de sincronização
    sync_frequency VARCHAR(20) DEFAULT 'HOURLY' CHECK (sync_frequency IN ('REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MANUAL')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING')),
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Webhook configuration
    webhook_url TEXT,
    webhook_secret TEXT,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Tabela de Logs de Sincronização
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    integration_id UUID NOT NULL REFERENCES external_integrations(id) ON DELETE CASCADE,
    
    -- Detalhes da sincronização
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('FULL', 'INCREMENTAL', 'WEBHOOK')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'PARTIAL', 'FAILED', 'IN_PROGRESS')),
    
    -- Estatísticas
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Detalhes e logs
    sync_details JSONB DEFAULT '{}',
    error_details JSONB DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER
);

-- Tabela de Contratos com Fornecedores
CREATE TABLE IF NOT EXISTS supplier_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL,
    
    -- Informações do contrato
    contract_name VARCHAR(255) NOT NULL,
    contract_type VARCHAR(30) DEFAULT 'SUPPLY' CHECK (contract_type IN ('SUPPLY', 'SERVICE', 'MAINTENANCE', 'MIXED')),
    
    -- Período de vigência
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renewal BOOLEAN DEFAULT false,
    renewal_period_months INTEGER,
    
    -- Valores e termos
    total_value DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    payment_terms TEXT,
    delivery_terms TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED')),
    
    -- Alertas
    alert_days_before_expiry INTEGER DEFAULT 30,
    
    -- Documentos e anexos
    contract_document_url TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Termos especiais
    minimum_order_value DECIMAL(15,2),
    maximum_order_value DECIMAL(15,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Tabela de Itens do Contrato (Preços Contratuais)
CREATE TABLE IF NOT EXISTS contract_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    contract_id UUID NOT NULL REFERENCES supplier_contracts(id) ON DELETE CASCADE,
    part_id UUID NOT NULL,
    
    -- Preços contratuais
    contract_price DECIMAL(12,4) NOT NULL,
    minimum_quantity INTEGER DEFAULT 1,
    maximum_quantity INTEGER,
    
    -- Condições especiais
    lead_time_days INTEGER DEFAULT 7,
    unit_of_measure VARCHAR(20) DEFAULT 'UN',
    
    -- Vigência específica do item
    effective_from DATE,
    effective_to DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Workflow de Aprovações
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_name VARCHAR(100) NOT NULL,
    workflow_type VARCHAR(30) NOT NULL CHECK (workflow_type IN ('PURCHASE_ORDER', 'TRANSFER', 'ADJUSTMENT', 'WORK_ORDER')),
    
    -- Configuração do workflow
    approval_rules JSONB NOT NULL DEFAULT '[]',
    auto_approval_rules JSONB DEFAULT '{}',
    
    -- Valores para aprovação automática
    auto_approve_threshold DECIMAL(15,2),
    require_manager_above DECIMAL(15,2),
    require_director_above DECIMAL(15,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Tabela de Instâncias de Aprovação
CREATE TABLE IF NOT EXISTS approval_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
    
    -- Referência ao item sendo aprovado
    reference_type VARCHAR(30) NOT NULL CHECK (reference_type IN ('PURCHASE_ORDER', 'TRANSFER', 'ADJUSTMENT', 'WORK_ORDER')),
    reference_id UUID NOT NULL,
    
    -- Status da aprovação
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER NOT NULL,
    
    -- Detalhes
    requested_by UUID NOT NULL,
    requested_amount DECIMAL(15,2),
    justification TEXT,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE
);

-- Tabela de Etapas de Aprovação
CREATE TABLE IF NOT EXISTS approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    approval_instance_id UUID NOT NULL REFERENCES approval_instances(id) ON DELETE CASCADE,
    
    -- Configuração da etapa
    step_number INTEGER NOT NULL,
    approver_id UUID NOT NULL,
    approver_role VARCHAR(50),
    
    -- Status da etapa
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED')),
    
    -- Detalhes da aprovação
    decision_date TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Relatórios Executivos
CREATE TABLE IF NOT EXISTS executive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(30) NOT NULL CHECK (report_type IN ('KPI', 'SUPPLIER_PERFORMANCE', 'INVENTORY_ANALYSIS', 'COST_ANALYSIS')),
    
    -- Configuração do relatório
    report_config JSONB NOT NULL DEFAULT '{}',
    schedule_frequency VARCHAR(20) DEFAULT 'MONTHLY' CHECK (schedule_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY')),
    
    -- Recipients
    recipients JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    next_generation_at TIMESTAMP WITH TIME ZONE,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Tabela de KPIs de Performance
CREATE TABLE IF NOT EXISTS supplier_performance_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    
    -- Período de análise
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    
    -- KPIs de entrega
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0.00,
    quality_score DECIMAL(5,2) DEFAULT 0.00,
    lead_time_average DECIMAL(8,2) DEFAULT 0.00,
    
    -- KPIs financeiros
    total_orders_value DECIMAL(15,2) DEFAULT 0.00,
    average_order_value DECIMAL(15,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- KPIs operacionais
    order_fulfillment_rate DECIMAL(5,2) DEFAULT 0.00,
    return_rate DECIMAL(5,2) DEFAULT 0.00,
    response_time_hours DECIMAL(8,2) DEFAULT 0.00,
    
    -- Score geral
    overall_performance_score DECIMAL(5,2) DEFAULT 0.00,
    performance_grade VARCHAR(2) DEFAULT 'C' CHECK (performance_grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')),
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID
);

-- ===============================================
-- ÍNDICES PARA PERFORMANCE
-- ===============================================

-- Work Orders
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_status ON work_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_date ON work_orders(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_orders_auto_created ON work_orders(tenant_id, auto_created) WHERE auto_created = true;

-- Integrações
CREATE INDEX IF NOT EXISTS idx_external_integrations_tenant_active ON external_integrations(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_external_integrations_next_sync ON external_integrations(next_sync_at) WHERE is_active = true;

-- Sync Logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_date ON sync_logs(integration_id, started_at DESC);

-- Contratos
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_tenant_supplier ON supplier_contracts(tenant_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_dates ON supplier_contracts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_expiry_alert ON supplier_contracts(end_date) WHERE status = 'ACTIVE';

-- Contract Items
CREATE INDEX IF NOT EXISTS idx_contract_items_contract_part ON contract_items(contract_id, part_id);
CREATE INDEX IF NOT EXISTS idx_contract_items_effective_dates ON contract_items(effective_from, effective_to) WHERE is_active = true;

-- Aprovações
CREATE INDEX IF NOT EXISTS idx_approval_instances_reference ON approval_instances(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_approval_instances_status ON approval_instances(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approver ON approval_steps(approver_id, status);

-- Performance KPIs
CREATE INDEX IF NOT EXISTS idx_supplier_kpis_supplier_period ON supplier_performance_kpis(supplier_id, analysis_period_end DESC);

-- ===============================================
-- TRIGGERS PARA AUDITORIA
-- ===============================================

-- Trigger para updated_at em work_orders
CREATE OR REPLACE FUNCTION update_work_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_work_orders_updated_at();

-- Trigger para updated_at em external_integrations
CREATE OR REPLACE FUNCTION update_external_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_external_integrations_updated_at
    BEFORE UPDATE ON external_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_external_integrations_updated_at();

-- ===============================================
-- FUNÇÕES AUXILIARES
-- ===============================================

-- Função para calcular KPIs de fornecedor
CREATE OR REPLACE FUNCTION calculate_supplier_kpis(
    p_tenant_id UUID,
    p_supplier_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    on_time_rate DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    avg_lead_time DECIMAL(8,2),
    total_value DECIMAL(15,2),
    avg_order_value DECIMAL(15,2),
    fulfillment_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            (COUNT(CASE WHEN po.delivered_date <= po.expected_delivery_date THEN 1 END) * 100.0 / 
             NULLIF(COUNT(*), 0)), 0.00
        )::DECIMAL(5,2) as on_time_rate,
        
        COALESCE(AVG(po.quality_rating), 0.00)::DECIMAL(5,2) as quality_score,
        
        COALESCE(
            AVG(EXTRACT(days FROM po.delivered_date - po.created_at)), 0.00
        )::DECIMAL(8,2) as avg_lead_time,
        
        COALESCE(SUM(po.total_amount), 0.00)::DECIMAL(15,2) as total_value,
        
        COALESCE(AVG(po.total_amount), 0.00)::DECIMAL(15,2) as avg_order_value,
        
        COALESCE(
            (COUNT(CASE WHEN po.status = 'COMPLETED' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(*), 0)), 0.00
        )::DECIMAL(5,2) as fulfillment_rate
        
    FROM purchase_orders po
    WHERE po.tenant_id = p_tenant_id
      AND po.supplier_id = p_supplier_id
      AND po.created_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Função para auto-criação de work orders
CREATE OR REPLACE FUNCTION auto_create_work_order_from_ticket()
RETURNS TRIGGER AS $$
DECLARE
    wo_number VARCHAR(50);
    automation_enabled BOOLEAN;
BEGIN
    -- Verificar se automação está habilitada para este tipo de ticket
    SELECT EXISTS(
        SELECT 1 FROM automation_rules 
        WHERE tenant_id = NEW.tenant_id 
          AND rule_type = 'TICKET_TO_WORK_ORDER'
          AND is_active = true
          AND (trigger_conditions->>'ticket_type' = NEW.ticket_type OR trigger_conditions->>'ticket_type' IS NULL)
    ) INTO automation_enabled;
    
    IF automation_enabled THEN
        -- Gerar número do work order
        wo_number := 'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('work_order_sequence'), 4, '0');
        
        -- Criar work order automaticamente
        INSERT INTO work_orders (
            tenant_id, work_order_number, title, description, priority,
            source_ticket_id, auto_created, work_order_type, 
            scheduled_date, assigned_to, created_by
        ) VALUES (
            NEW.tenant_id,
            wo_number,
            'Auto: ' || NEW.title,
            'Work order criado automaticamente a partir do ticket: ' || NEW.ticket_number,
            NEW.priority,
            NEW.id,
            true,
            'MAINTENANCE',
            NOW() + INTERVAL '1 day',
            NEW.assigned_to,
            NEW.assigned_to
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- SEQUÊNCIAS
-- ===============================================

CREATE SEQUENCE IF NOT EXISTS work_order_sequence START 1;

-- ===============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ===============================================

COMMENT ON TABLE work_orders IS 'Work orders automáticos baseados em tickets';
COMMENT ON TABLE external_integrations IS 'Configurações de integrações com sistemas externos';
COMMENT ON TABLE sync_logs IS 'Logs de sincronização com sistemas externos';
COMMENT ON TABLE supplier_contracts IS 'Contratos com fornecedores';
COMMENT ON TABLE contract_items IS 'Itens e preços contratuais por fornecedor';
COMMENT ON TABLE approval_workflows IS 'Workflows de aprovação configuráveis';
COMMENT ON TABLE approval_instances IS 'Instâncias de aprovação em andamento';
COMMENT ON TABLE approval_steps IS 'Etapas individuais de aprovação';
COMMENT ON TABLE executive_reports IS 'Relatórios executivos automatizados';
COMMENT ON TABLE supplier_performance_kpis IS 'KPIs de performance de fornecedores';

-- ===============================================
-- DADOS INICIAIS PARA DEMONSTRAÇÃO
-- ===============================================

-- Workflow de aprovação padrão para purchase orders
INSERT INTO approval_workflows (tenant_id, workflow_name, workflow_type, approval_rules, auto_approve_threshold, require_manager_above, require_director_above, created_by) 
SELECT 
    '3f99462f-3621-4b1b-bea8-782acc50d62e',
    'Aprovação de Purchase Orders',
    'PURCHASE_ORDER',
    '[
        {"step": 1, "role": "MANAGER", "condition": "amount > 1000"},
        {"step": 2, "role": "DIRECTOR", "condition": "amount > 10000"}
    ]'::jsonb,
    1000.00,
    5000.00,
    25000.00,
    '550e8400-e29b-41d4-a716-446655440001'
WHERE NOT EXISTS (
    SELECT 1 FROM approval_workflows 
    WHERE tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e' 
    AND workflow_type = 'PURCHASE_ORDER'
);

-- Relatório executivo padrão
INSERT INTO executive_reports (tenant_id, report_name, report_type, report_config, schedule_frequency, recipients, created_by)
SELECT 
    '3f99462f-3621-4b1b-bea8-782acc50d62e',
    'Relatório Mensal de KPIs',
    'KPI',
    '{
        "metrics": ["inventory_turnover", "supplier_performance", "cost_variance"],
        "format": "PDF",
        "include_charts": true
    }'::jsonb,
    'MONTHLY',
    '["admin@empresa.com", "gerencia@empresa.com"]'::jsonb,
    '550e8400-e29b-41d4-a716-446655440001'
WHERE NOT EXISTS (
    SELECT 1 FROM executive_reports 
    WHERE tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e' 
    AND report_name = 'Relatório Mensal de KPIs'
);

SELECT 'Etapa 4 - Estruturas de banco criadas com sucesso!' as status;
