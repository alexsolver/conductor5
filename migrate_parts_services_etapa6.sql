
-- =====================================================
-- ETAPA 6: MÓDULOS ENTERPRISE AVANÇADOS - MIGRATION
-- Controle de Ativos, LPU Enterprise, Preços Avançados,
-- Compliance e Auditoria, Mobile/Offline
-- =====================================================

-- MÓDULO 1: CONTROLE DE ATIVOS ENTERPRISE
CREATE TABLE IF NOT EXISTS assets_enterprise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  asset_number VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Hierarquia de ativos
  parent_asset_id UUID REFERENCES assets_enterprise(id),
  asset_level INTEGER DEFAULT 1, -- 1=equipamento, 2=componente, 3=peça
  asset_path TEXT, -- path hierárquico completo
  
  -- Classificação
  category VARCHAR(50) NOT NULL, -- equipment, vehicle, tool, facility
  subcategory VARCHAR(50),
  asset_type VARCHAR(50),
  
  -- Dados técnicos
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  manufacturing_date TIMESTAMP,
  warranty_end_date TIMESTAMP,
  
  -- Localização e status
  current_location_id UUID,
  coordinates JSONB, -- {lat, lng, address}
  status VARCHAR(30) DEFAULT 'active', -- active, maintenance, disposed
  condition_rating VARCHAR(20) DEFAULT 'good', -- excellent, good, fair, poor
  
  -- Valores financeiros
  acquisition_cost DECIMAL(15,2),
  current_value DECIMAL(15,2),
  depreciation_rate DECIMAL(5,2),
  
  -- Métricas operacionais
  operating_hours INTEGER DEFAULT 0,
  kilometers INTEGER DEFAULT 0,
  cycle_count INTEGER DEFAULT 0,
  last_maintenance_date TIMESTAMP,
  next_maintenance_date TIMESTAMP,
  
  -- QR Code e RFID
  qr_code VARCHAR(200),
  rfid_tag VARCHAR(100),
  
  -- Responsabilidade
  assigned_to UUID, -- user_id responsável
  custodian UUID, -- custodiante
  
  -- Sistema
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE TABLE IF NOT EXISTS asset_maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets_enterprise(id),
  
  -- Tipo de manutenção
  maintenance_type VARCHAR(30) NOT NULL, -- preventive, corrective, predictive
  work_order_id UUID,
  
  -- Execução
  scheduled_date TIMESTAMP,
  start_date TIMESTAMP,
  completed_date TIMESTAMP,
  
  -- Descrição do trabalho
  description TEXT NOT NULL,
  work_performed TEXT,
  issues_found TEXT,
  
  -- Recursos utilizados
  technician_id UUID,
  labor_hours DECIMAL(8,2),
  labor_cost DECIMAL(12,2),
  parts_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  
  -- Métricas no momento
  operating_hours_at_maintenance INTEGER,
  kilometers_at_maintenance INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed', -- planned, in_progress, completed
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE TABLE IF NOT EXISTS asset_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets_enterprise(id),
  
  -- Movimento
  movement_type VARCHAR(30) NOT NULL, -- transfer, assignment, maintenance
  from_location_id UUID,
  to_location_id UUID,
  from_user_id UUID,
  to_user_id UUID,
  
  -- Datas
  movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_return_date TIMESTAMP,
  actual_return_date TIMESTAMP,
  
  -- Motivo
  reason VARCHAR(100) NOT NULL,
  notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL
);

-- MÓDULO 2: LPU ENTERPRISE COM VERSIONAMENTO
CREATE TABLE IF NOT EXISTS price_lists_enterprise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Versionamento
  version VARCHAR(20) NOT NULL,
  previous_version_id UUID REFERENCES price_lists_enterprise(id),
  is_current_version BOOLEAN DEFAULT false,
  
  -- Aplicação
  customer_id UUID, -- se específica para cliente
  contract_id UUID, -- se vinculada a contrato
  cost_center_id UUID, -- se por centro de custo
  region VARCHAR(50), -- região de aplicação
  
  -- Vigência
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP,
  
  -- Periodicidade de revisão
  review_period VARCHAR(20), -- monthly, quarterly, yearly
  next_review_date TIMESTAMP,
  auto_review BOOLEAN DEFAULT false,
  
  -- Status de aprovação
  status VARCHAR(20) DEFAULT 'draft', -- draft, pending_approval, approved, active, expired
  approval_workflow JSONB, -- workflow de aprovação
  
  -- Sistema
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_list_items_enterprise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  price_list_id UUID NOT NULL REFERENCES price_lists_enterprise(id),
  
  -- Item
  item_type VARCHAR(30) NOT NULL, -- part, service, labor, travel, equipment
  item_id UUID,
  item_code VARCHAR(50),
  item_description TEXT NOT NULL,
  
  -- Preços com múltiplas moedas
  base_price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  usd_price DECIMAL(12,2), -- preço em USD para referência
  eur_price DECIMAL(12,2), -- preço em EUR para referência
  
  -- Unidade de medida
  unit VARCHAR(20) DEFAULT 'UN', -- UN, KG, M, H, etc
  minimum_quantity DECIMAL(10,3) DEFAULT 1,
  
  -- Margem e markup
  cost_price DECIMAL(12,2),
  margin_percentage DECIMAL(5,2),
  markup_percentage DECIMAL(5,2),
  
  -- Descontos por escala (JSON)
  quantity_discounts JSONB, -- [{minQty: 10, discount: 5}, {minQty: 50, discount: 10}]
  
  -- Validade específica do item
  item_valid_from TIMESTAMP,
  item_valid_to TIMESTAMP,
  
  -- Observações e especificações
  notes TEXT,
  technical_specs JSONB,
  
  -- Sistema
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_list_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  price_list_id UUID NOT NULL REFERENCES price_lists_enterprise(id),
  
  -- Onde foi aplicada
  application_target VARCHAR(30) NOT NULL, -- work_order, quote, invoice, contract
  target_id UUID NOT NULL,
  
  -- Valores
  estimated_value DECIMAL(15,2),
  actual_value DECIMAL(15,2),
  variance DECIMAL(15,2),
  variance_percentage DECIMAL(5,2),
  
  -- Conversão de moeda (se aplicável)
  original_currency VARCHAR(3),
  conversion_rate DECIMAL(10,6),
  converted_value DECIMAL(15,2),
  
  -- Sistema
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_by UUID
);

-- MÓDULO 3: MOTOR DE PREÇOS AVANÇADO
CREATE TABLE IF NOT EXISTS pricing_rules_engine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Regra
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(30) NOT NULL, -- automatic_margin, volume_discount, seasonal, customer_tier
  priority INTEGER DEFAULT 1, -- prioridade de execução
  
  -- Condições (JSON flexível)
  conditions JSONB NOT NULL, -- {customerType: 'enterprise', minQuantity: 100, season: 'high'}
  
  -- Ações
  action_type VARCHAR(30) NOT NULL, -- percentage_discount, fixed_discount, new_price, margin_adjustment
  action_value DECIMAL(12,2) NOT NULL,
  max_discount_percentage DECIMAL(5,2), -- limite máximo de desconto
  
  -- Vigência
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_to TIMESTAMP,
  
  -- Aplicação
  applies_to_item_types TEXT[], -- tipos de item onde se aplica
  applies_to_customers UUID[], -- clientes específicos (se aplicável)
  
  -- Sistema
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE TABLE IF NOT EXISTS price_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Simulação
  simulation_name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Contexto
  customer_id UUID,
  price_list_id UUID,
  currency VARCHAR(3) DEFAULT 'BRL',
  
  -- Configuração
  scenario_data JSONB, -- dados do cenário simulado
  applied_rules JSONB, -- regras que foram aplicadas
  
  -- Resultados
  original_total DECIMAL(15,2),
  discounted_total DECIMAL(15,2),
  total_discount DECIMAL(15,2),
  discount_percentage DECIMAL(5,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, approved, converted_to_quote
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP
);

-- MÓDULO 4: COMPLIANCE E AUDITORIA ENTERPRISE
CREATE TABLE IF NOT EXISTS audit_trails_enterprise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Ação auditada
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE, VIEW
  
  -- Dados da mudança
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Contexto da ação
  user_id UUID NOT NULL,
  user_role VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  
  -- Classificação de sensibilidade
  sensitivity_level VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
  requires_retention BOOLEAN DEFAULT false,
  retention_until TIMESTAMP,
  
  -- Compliance
  compliance_tags TEXT[], -- LGPD, SOX, ISO27001, etc
  
  -- Sistema
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certifications_enterprise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Certificação
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- quality, environmental, safety, regulatory
  issuing_body VARCHAR(200) NOT NULL,
  certificate_number VARCHAR(100),
  
  -- Escopo e aplicação
  scope TEXT,
  applicable_to_asset_types TEXT[],
  applicable_to_part_types TEXT[],
  applicable_to_processes TEXT[],
  
  -- Validade
  issued_date TIMESTAMP NOT NULL,
  expiration_date TIMESTAMP NOT NULL,
  reminder_days_before INTEGER DEFAULT 30,
  auto_renew_reminder BOOLEAN DEFAULT true,
  
  -- Documentos
  document_path VARCHAR(500),
  document_hash VARCHAR(64), -- SHA256 para integridade
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, expired, suspended, cancelled
  
  -- Sistema
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE TABLE IF NOT EXISTS compliance_alerts_enterprise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Alerta
  alert_type VARCHAR(30) NOT NULL, -- certification_expiry, regulatory_change, audit_due
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Referência
  reference_type VARCHAR(30), -- certification, asset, audit_trail
  reference_id UUID,
  
  -- Classificação
  compliance_domain VARCHAR(50), -- LGPD, SOX, ISO27001, GDPR
  impact_assessment TEXT,
  recommended_actions TEXT[],
  
  -- Datas
  alert_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  escalation_date TIMESTAMP,
  
  -- Workflow
  assigned_to UUID,
  escalation_to UUID,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open', -- open, acknowledged, in_progress, resolved
  resolution_notes TEXT,
  resolved_date TIMESTAMP,
  resolved_by UUID,
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

-- MÓDULO 5: MOBILE E OFFLINE CAPABILITIES
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Dados da operação offline
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
  data JSONB NOT NULL,
  
  -- Controle de sincronização
  device_id VARCHAR(100),
  local_timestamp TIMESTAMP NOT NULL,
  server_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Status de sincronização
  sync_status VARCHAR(20) DEFAULT 'pending', -- pending, synced, conflict, error
  sync_attempts INTEGER DEFAULT 0,
  last_sync_attempt TIMESTAMP,
  sync_error TEXT,
  
  -- Resolução de conflitos
  conflict_resolution VARCHAR(30), -- server_wins, client_wins, manual_merge
  conflict_data JSONB, -- dados do conflito para resolução manual
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mobile_device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Identificação do dispositivo
  device_id VARCHAR(100) NOT NULL,
  device_name VARCHAR(100),
  device_type VARCHAR(30), -- android, ios, web
  device_model VARCHAR(100),
  os_version VARCHAR(50),
  app_version VARCHAR(20),
  
  -- Localização e conectividade
  last_known_location JSONB, -- {lat, lng, accuracy, timestamp}
  connectivity_status VARCHAR(20) DEFAULT 'online', -- online, offline, limited
  
  -- Permissões
  permissions JSONB, -- permissões específicas do dispositivo
  allowed_modules TEXT[], -- módulos permitidos offline
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Sistema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA PERFORMANCE ENTERPRISE
CREATE INDEX IF NOT EXISTS idx_assets_enterprise_tenant_status ON assets_enterprise(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_enterprise_location ON assets_enterprise(tenant_id, current_location_id);
CREATE INDEX IF NOT EXISTS idx_assets_enterprise_hierarchy ON assets_enterprise(tenant_id, parent_asset_id, asset_level);
CREATE INDEX IF NOT EXISTS idx_assets_enterprise_maintenance ON assets_enterprise(tenant_id, next_maintenance_date) WHERE next_maintenance_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_lists_enterprise_tenant_version ON price_lists_enterprise(tenant_id, is_current_version);
CREATE INDEX IF NOT EXISTS idx_price_lists_enterprise_validity ON price_lists_enterprise(tenant_id, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_price_list_items_enterprise_item ON price_list_items_enterprise(tenant_id, price_list_id, item_type);

CREATE INDEX IF NOT EXISTS idx_audit_trails_enterprise_tenant_table ON audit_trails_enterprise(tenant_id, table_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trails_enterprise_user ON audit_trails_enterprise(tenant_id, user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trails_enterprise_sensitivity ON audit_trails_enterprise(tenant_id, sensitivity_level, timestamp);

CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_user_status ON offline_sync_queue(tenant_id, user_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_timestamp ON offline_sync_queue(tenant_id, server_timestamp);

-- CONSTRAINTS E VALIDATIONS
ALTER TABLE assets_enterprise ADD CONSTRAINT chk_asset_level CHECK (asset_level BETWEEN 1 AND 5);
ALTER TABLE assets_enterprise ADD CONSTRAINT chk_condition_rating CHECK (condition_rating IN ('excellent', 'good', 'fair', 'poor', 'critical'));
ALTER TABLE price_lists_enterprise ADD CONSTRAINT chk_price_list_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'active', 'expired', 'cancelled'));
ALTER TABLE audit_trails_enterprise ADD CONSTRAINT chk_audit_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'));
ALTER TABLE compliance_alerts_enterprise ADD CONSTRAINT chk_alert_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'));
