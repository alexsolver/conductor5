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

CREATE TABLE IF NOT EXISTS "absence_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" VARCHAR(36) NOT NULL,
  "absence_type" VARCHAR(30) NOT NULL,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "total_days" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "attachments" JSONB NULL DEFAULT '[]',
  "medical_certificate" VARCHAR(500) NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'pending',
  "submitted_at" TIMESTAMP NULL DEFAULT now(),
  "reviewed_by" VARCHAR(36) NULL DEFAULT NULL,
  "reviewed_at" TIMESTAMP NULL DEFAULT NULL,
  "review_notes" TEXT NULL DEFAULT NULL,
  "cover_user_id" VARCHAR(36) NULL DEFAULT NULL,
  "cover_approved" BOOLEAN NULL DEFAULT false,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "user_id"),
  KEY ("tenant_id", "status"),
  CONSTRAINT "absence_requests_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.activity_logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" VARCHAR(36) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" UUID NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "user_id" UUID NULL DEFAULT NULL,
  "details" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "is_active" BOOLEAN NULL DEFAULT true,
  "ip_address" TEXT NULL DEFAULT NULL,
  "user_agent" TEXT NULL DEFAULT NULL,
  "metadata" TEXT,
  "new_values" TEXT,
  "old_values" TEXT
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "entity_type", "entity_id"),
  CONSTRAINT "chk_activity_logs_tenant_id" CHECK ((((tenant_id)::text = '3f99462f-3621-4b1b-bea8-782acc50d62e'::text)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.activity_types
CREATE TABLE IF NOT EXISTS "activity_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "color" VARCHAR(7) NOT NULL,
  "duration" INTEGER NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.agent_availability
CREATE TABLE IF NOT EXISTS "agent_availability" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "day_of_week" INTEGER NOT NULL,
  "start_time" VARCHAR(5) NOT NULL,
  "end_time" VARCHAR(5) NOT NULL,
  "break_start_time" VARCHAR(5) NULL DEFAULT NULL,
  "break_end_time" VARCHAR(5) NULL DEFAULT NULL,
  "is_available" BOOLEAN NULL DEFAULT true,
  "max_appointments" INTEGER NULL DEFAULT 8,
  "preferred_zones" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.agent_trajectories
CREATE TABLE IF NOT EXISTS "agent_trajectories" (
  "id" SERIAL NOT NULL,
  "agent_id" VARCHAR(50) NOT NULL,
  "agent_name" VARCHAR(255) NOT NULL,
  "lat" NUMERIC(10,8) NOT NULL,
  "lng" NUMERIC(11,8) NOT NULL,
  "accuracy" INTEGER NULL DEFAULT NULL,
  "speed" INTEGER NULL DEFAULT NULL,
  "heading" INTEGER NULL DEFAULT NULL,
  "altitude" INTEGER NULL DEFAULT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  "battery_level" INTEGER NULL DEFAULT NULL,
  "signal_strength" INTEGER NULL DEFAULT NULL,
  "status" VARCHAR(50) NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.agrupamentos
CREATE TABLE IF NOT EXISTS "agrupamentos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "nome" VARCHAR(200) NOT NULL,
  "descricao" TEXT NULL DEFAULT NULL,
  "codigo_integracao" VARCHAR(100) NULL DEFAULT NULL,
  "areas_vinculadas" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.approval_conditions
CREATE TABLE IF NOT EXISTS "approval_conditions" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "rule_id" UUID NOT NULL,
  "field_name" VARCHAR(100) NULL DEFAULT NULL,
  "operator" UNKNOWN NULL DEFAULT NULL,
  "value" JSONB NULL DEFAULT NULL,
  "logical_operator" VARCHAR(10) NULL DEFAULT NULL,
  "group_index" INTEGER NULL DEFAULT 0,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "approval_conditions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "approval_rules" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.approval_decisions
CREATE TABLE IF NOT EXISTS "approval_decisions" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "instance_id" UUID NOT NULL,
  "step_index" INTEGER NULL DEFAULT NULL,
  "approver_id" UUID NOT NULL,
  "decision" VARCHAR(20) NULL DEFAULT NULL,
  "comments" TEXT NULL DEFAULT NULL,
  "metadata" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id", "instance_id"),
  KEY ("tenant_id", "step_id"),
  KEY ("tenant_id", "approver_id"),
  KEY ("tenant_id", "decision"),
  UNIQUE ("step_id", "approver_id", "approver_type"),
  PRIMARY KEY ("id"),
  CONSTRAINT "approval_decisions_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "approval_instances" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.approval_group_members
CREATE TABLE IF NOT EXISTS "approval_group_members" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "group_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" VARCHAR(50) NULL DEFAULT 'member',
  "is_active" BOOLEAN NULL DEFAULT true,
  "added_at" TIMESTAMP NULL DEFAULT now(),
  "added_by_id" UUID NULL DEFAULT NULL,
  KEY ("group_id"),
  KEY ("user_id"),
  KEY ("tenant_id"),
  PRIMARY KEY ("id"),
  UNIQUE ("group_id", "user_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.approval_instances
CREATE TABLE IF NOT EXISTS "approval_instances" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "rule_id" UUID NOT NULL,
  "entity_id" UUID NOT NULL,
  "entity_type" VARCHAR(100) NULL DEFAULT NULL,
  "current_step_index" INTEGER NULL DEFAULT 0,
  "status" VARCHAR(20) NULL DEFAULT 'pending',
  "requested_by_id" UUID NULL DEFAULT NULL,
  "sla_deadline" TIMESTAMP NULL DEFAULT NULL,
  "metadata" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "completed_at" TIMESTAMP NULL DEFAULT NULL,
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id", "entity_type", "entity_id"),
  KEY ("tenant_id", "status"),
  KEY ("tenant_id", "sla_status", "sla_deadline"),
  KEY ("tenant_id", "requested_by_id"),
  KEY ("rule_id"),
  PRIMARY KEY ("id"),
  CONSTRAINT "approval_instances_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "approval_rules" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.approval_rules
CREATE TABLE IF NOT EXISTS "approval_rules" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "module_type" VARCHAR(50) NULL DEFAULT NULL,
  "entity_type" VARCHAR(100) NULL DEFAULT NULL,
  "query_conditions" JSONB NULL DEFAULT '{}',
  "approval_steps" JSONB NULL DEFAULT '[]',
  "sla_hours" INTEGER NULL DEFAULT NULL,
  "business_hours_only" BOOLEAN NULL DEFAULT false,
  "auto_approval_conditions" JSONB NULL DEFAULT '{}',
  "escalation_settings" JSONB NULL DEFAULT '{}',
  "company_id" UUID NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "priority" INTEGER NULL DEFAULT 0,
  "created_by_id" UUID NULL DEFAULT NULL,
  "updated_by_id" UUID NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id", "module_type"),
  KEY ("tenant_id", "is_active"),
  KEY ("tenant_id", "priority"),
  UNIQUE ("tenant_id", "name"),
  PRIMARY KEY ("id"),
  CONSTRAINT "approval_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.approval_steps
CREATE TABLE IF NOT EXISTS "approval_steps" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "rule_id" UUID NOT NULL,
  "step_index" INTEGER NOT NULL,
  "name" VARCHAR(255) NULL DEFAULT NULL,
  "approver_type" UNKNOWN NULL DEFAULT NULL,
  "approvers" JSONB NULL DEFAULT '[]',
  "required_approvals" INTEGER NULL DEFAULT 1,
  "timeout_hours" INTEGER NULL DEFAULT NULL,
  "escalation_rules" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id", "instance_id"),
  KEY ("tenant_id", "status"),
  KEY ("tenant_id", "step_deadline"),
  UNIQUE ("instance_id", "step_index"),
  PRIMARY KEY ("id"),
  CONSTRAINT "approval_steps_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "approval_rules" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.approval_workflows
CREATE TABLE IF NOT EXISTS "approval_workflows" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "module_type" VARCHAR(50) NULL DEFAULT NULL,
  "workflow_steps" JSONB NULL DEFAULT '[]',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_by_id" UUID NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.areas
CREATE TABLE IF NOT EXISTS "areas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "nome" VARCHAR(200) NOT NULL,
  "descricao" TEXT NULL DEFAULT NULL,
  "codigo_integracao" VARCHAR(100) NULL DEFAULT NULL,
  "tipo_area" VARCHAR(50) NULL DEFAULT NULL,
  "cor_mapa" VARCHAR(7) NULL DEFAULT NULL,
  "classificacao_area" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.area_groups
CREATE TABLE IF NOT EXISTS "area_groups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "group_name" VARCHAR(200) NOT NULL,
  "group_type" UNKNOWN NOT NULL,
  "parent_group_id" UUID NULL DEFAULT NULL,
  "coordinates_center" JSONB NULL DEFAULT NULL,
  "total_locations" INTEGER NULL DEFAULT 0,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "area_groups_parent_group_id_fkey" FOREIGN KEY ("parent_group_id") REFERENCES "area_groups" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.assets
CREATE TABLE IF NOT EXISTS "assets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "location_id" UUID NOT NULL,
  "parent_asset_id" UUID NULL DEFAULT NULL,
  "tag" VARCHAR(100) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "model" VARCHAR(100) NULL DEFAULT NULL,
  "manufacturer" VARCHAR(100) NULL DEFAULT NULL,
  "serial_number" VARCHAR(100) NULL DEFAULT NULL,
  "criticality" VARCHAR(20) NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "meters_json" JSONB NULL DEFAULT NULL,
  "mtbf" INTEGER NULL DEFAULT NULL,
  "mttr" INTEGER NULL DEFAULT NULL,
  "failure_codes_json" JSONB NULL DEFAULT NULL,
  "specifications" JSONB NULL DEFAULT NULL,
  "installation_date" TIMESTAMP NULL DEFAULT NULL,
  "warranty_expiry_date" TIMESTAMP NULL DEFAULT NULL,
  "last_maintenance_date" TIMESTAMP NULL DEFAULT NULL,
  "next_maintenance_date" TIMESTAMP NULL DEFAULT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "assets_criticality_check" CHECK ((((criticality)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])))),
  CONSTRAINT "assets_status_check" CHECK ((((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'maintenance'::character varying, 'decommissioned'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.beneficiaries
CREATE TABLE IF NOT EXISTS "beneficiaries" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" TEXT,
  "first_name" VARCHAR(100) NULL DEFAULT NULL,
  "last_name" VARCHAR(100) NULL DEFAULT NULL,
  "email" VARCHAR(255) NULL DEFAULT NULL,
  "birth_date" DATE NULL DEFAULT NULL,
  "rg" VARCHAR(20) NULL DEFAULT NULL,
  "cpf_cnpj" VARCHAR(20) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT NULL,
  "customer_code" VARCHAR(50) NULL DEFAULT NULL,
  "phone" VARCHAR(20) NULL DEFAULT NULL,
  "cell_phone" VARCHAR(20) NULL DEFAULT NULL,
  "contact_person" VARCHAR(255) NULL DEFAULT NULL,
  "contact_phone" VARCHAR(20) NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT NULL,
  "updated_at" TIMESTAMP NULL DEFAULT NULL,
  "customer_id" UUID NULL DEFAULT NULL,
  "cpf" TEXT NULL DEFAULT NULL,
  "cnpj" TEXT NULL DEFAULT NULL,
  "metadata" TEXT,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.beneficiary_customer_relationships
CREATE TABLE IF NOT EXISTS "beneficiary_customer_relationships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "beneficiary_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "tenant_id" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("beneficiary_id", "customer_id"),
  CONSTRAINT "favorecido_customer_relationships_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.certifications
CREATE TABLE IF NOT EXISTS "certifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" VARCHAR(36) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "issuer" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "validity_months" INTEGER NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "is_active" BOOLEAN NULL DEFAULT true,
  PRIMARY KEY ("id"),
  CONSTRAINT "certifications_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.chatbot_edges
CREATE TABLE IF NOT EXISTS "chatbot_edges" (
  "id" VARCHAR(36) NOT NULL DEFAULT gen_random_uuid(),
  "flow_id" VARCHAR(36) NOT NULL,
  "from_node_id" VARCHAR(36) NOT NULL,
  "to_node_id" VARCHAR(36) NOT NULL,
  "label" VARCHAR(255) NULL DEFAULT NULL,
  "condition" TEXT NULL DEFAULT NULL,
  "kind" UNKNOWN NOT NULL DEFAULT 'default',
  "order" INTEGER NOT NULL DEFAULT 0,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("flow_id"),
  KEY ("from_node_id"),
  KEY ("to_node_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.chatbot_flows
CREATE TABLE IF NOT EXISTS "chatbot_flows" (
  "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
  "bot_id" VARCHAR NOT NULL,
  "name" VARCHAR NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "nodes" JSONB NULL DEFAULT '[]',
  "edges" JSONB NULL DEFAULT '[]',
  "variables" JSONB NULL DEFAULT '{}',
  "is_active" BOOLEAN NULL DEFAULT true,
  "tenant_id" VARCHAR NOT NULL,
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "chatbot_flows_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "omnibridge_chatbots" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.chatbot_nodes
CREATE TABLE IF NOT EXISTS "chatbot_nodes" (
  "id" VARCHAR(36) NOT NULL DEFAULT gen_random_uuid(),
  "flow_id" VARCHAR(36) NOT NULL,
  "category" UNKNOWN NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "position" JSONB NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "is_start" BOOLEAN NOT NULL DEFAULT false,
  "is_end" BOOLEAN NOT NULL DEFAULT false,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("flow_id"),
  KEY ("category"),
  KEY ("flow_id", "is_start")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.chatbot_variables
CREATE TABLE IF NOT EXISTS "chatbot_variables" (
  "id" VARCHAR(36) NOT NULL DEFAULT gen_random_uuid(),
  "flow_id" VARCHAR(36) NOT NULL,
  "key" VARCHAR(100) NOT NULL,
  "label" VARCHAR(255) NOT NULL,
  "value_type" VARCHAR(50) NOT NULL DEFAULT 'string',
  "default_value" JSONB NULL DEFAULT NULL,
  "scope" UNKNOWN NOT NULL DEFAULT 'flow',
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("flow_id"),
  KEY ("flow_id", "key")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.companies
CREATE TABLE IF NOT EXISTS "companies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "cnpj" VARCHAR(20) NULL DEFAULT NULL,
  "industry" VARCHAR(100) NULL DEFAULT NULL,
  "website" VARCHAR(255) NULL DEFAULT NULL,
  "phone" VARCHAR(50) NULL DEFAULT NULL,
  "email" VARCHAR(255) NULL DEFAULT NULL,
  "address" TEXT NULL DEFAULT NULL,
  "city" VARCHAR(100) NULL DEFAULT NULL,
  "state" VARCHAR(50) NULL DEFAULT NULL,
  "zip_code" VARCHAR(20) NULL DEFAULT NULL,
  "country" VARCHAR(100) NULL DEFAULT 'Brazil',
  "annual_revenue" NUMERIC(15,2) NULL DEFAULT NULL,
  "employee_count" INTEGER NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "display_name" VARCHAR(255) NULL DEFAULT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "size" VARCHAR(50) NULL DEFAULT NULL,
  "subscription_tier" VARCHAR(50) NULL DEFAULT 'basic',
  "status" VARCHAR(50) NULL DEFAULT 'active',
  "created_by" UUID NULL DEFAULT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  "address_country" TEXT,
  "address_street" TEXT NULL DEFAULT NULL,
  "address_number" TEXT NULL DEFAULT NULL,
  "address_complement" TEXT NULL DEFAULT NULL,
  "address_neighborhood" TEXT NULL DEFAULT NULL,
  "address_city" TEXT NULL DEFAULT NULL,
  "address_state" TEXT NULL DEFAULT NULL,
  "address_zip_code" TEXT NULL DEFAULT NULL,
  "subscriptionTier" VARCHAR(255) NULL DEFAULT NULL,
  "complement" VARCHAR(100) NULL DEFAULT NULL,
  "neighborhood" VARCHAR(100) NULL DEFAULT NULL,
  "metadata" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "name")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.companies_relationships
CREATE TABLE IF NOT EXISTS "companies_relationships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "relationship_type" VARCHAR(50) NULL DEFAULT 'client',
  "start_date" DATE NULL DEFAULT CURRENT_DATE,
  "end_date" DATE NULL DEFAULT NULL,
  "is_primary" BOOLEAN NULL DEFAULT false,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "tenant_id" UUID NULL DEFAULT NULL,
  "created_by" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("customer_id", "company_id"),
  CONSTRAINT "customer_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "customer_companies_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.company_memberships
CREATE TABLE IF NOT EXISTS "company_memberships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "role" VARCHAR(100) NULL DEFAULT NULL,
  "department" VARCHAR(100) NULL DEFAULT NULL,
  "start_date" DATE NULL DEFAULT NULL,
  "end_date" DATE NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "permissions" TEXT NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "customer_id", "company_id"),
  CONSTRAINT "memberships_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.compliance_alerts
CREATE TABLE IF NOT EXISTS "compliance_alerts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "severity" VARCHAR(20) NULL DEFAULT 'medium',
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "category" VARCHAR(100) NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.compliance_certifications
CREATE TABLE IF NOT EXISTS "compliance_certifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "issuer" VARCHAR(255) NULL DEFAULT NULL,
  "issued_date" DATE NULL DEFAULT NULL,
  "expiry_date" DATE NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "certificate_number" VARCHAR(100) NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.compliance_scores
CREATE TABLE IF NOT EXISTS "compliance_scores" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "score" INTEGER NULL DEFAULT 0,
  "max_score" INTEGER NULL DEFAULT 100,
  "calculated_at" TIMESTAMP NULL DEFAULT now(),
  "details" JSONB NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.contracts
CREATE TABLE IF NOT EXISTS "contracts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "contract_number" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "customer_id" UUID NULL DEFAULT NULL,
  "customer_company_id" UUID NULL DEFAULT NULL,
  "contract_type" VARCHAR(50) NOT NULL,
  "status" VARCHAR(50) NULL DEFAULT 'active',
  "priority" VARCHAR(20) NULL DEFAULT 'medium',
  "total_value" NUMERIC(15,2) NULL DEFAULT NULL,
  "monthly_value" NUMERIC(15,2) NULL DEFAULT NULL,
  "currency" VARCHAR(3) NULL DEFAULT 'BRL',
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "renewal_date" TIMESTAMP NULL DEFAULT NULL,
  "last_renewal_date" TIMESTAMP NULL DEFAULT NULL,
  "signature_date" TIMESTAMP NULL DEFAULT NULL,
  "manager_id" UUID NULL DEFAULT NULL,
  "technical_manager_id" UUID NULL DEFAULT NULL,
  "location_id" UUID NULL DEFAULT NULL,
  "parent_contract_id" UUID NULL DEFAULT NULL,
  "is_main_contract" BOOLEAN NULL DEFAULT true,
  "auto_renewal" BOOLEAN NULL DEFAULT false,
  "renewal_notice_days" INTEGER NULL DEFAULT 30,
  "renewal_term_months" INTEGER NULL DEFAULT 12,
  "risk_level" VARCHAR(20) NULL DEFAULT 'low',
  "compliance_status" VARCHAR(50) NULL DEFAULT 'compliant',
  "terms" TEXT NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "tags" UNKNOWN NULL DEFAULT '{}',
  "custom_fields" JSONB NULL DEFAULT '{}',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "created_by_id" UUID NULL DEFAULT NULL,
  "updated_by_id" UUID NULL DEFAULT NULL,
  "payment_terms" INTEGER NULL DEFAULT 30,
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "contract_number"),
  KEY ("tenant_id", "status"),
  KEY ("tenant_id", "contract_type"),
  KEY ("manager_id"),
  KEY ("customer_company_id"),
  KEY ("start_date", "end_date")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.contract_billing
CREATE TABLE IF NOT EXISTS "contract_billing" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "contract_id" UUID NOT NULL,
  "billing_period_start" TIMESTAMP NOT NULL,
  "billing_period_end" TIMESTAMP NOT NULL,
  "billing_type" VARCHAR(50) NOT NULL,
  "base_amount" NUMERIC(15,2) NOT NULL,
  "additional_charges" NUMERIC(15,2) NULL DEFAULT 0,
  "discount_amount" NUMERIC(15,2) NULL DEFAULT 0,
  "penalty_amount" NUMERIC(15,2) NULL DEFAULT 0,
  "bonus_amount" NUMERIC(15,2) NULL DEFAULT 0,
  "total_amount" NUMERIC(15,2) NOT NULL,
  "tax_rate" NUMERIC(5,2) NULL DEFAULT NULL,
  "tax_amount" NUMERIC(15,2) NULL DEFAULT NULL,
  "invoice_number" VARCHAR(100) NULL DEFAULT NULL,
  "due_date" TIMESTAMP NULL DEFAULT NULL,
  "payment_status" VARCHAR(50) NULL DEFAULT 'pending',
  "payment_date" TIMESTAMP NULL DEFAULT NULL,
  "payment_method" VARCHAR(50) NULL DEFAULT NULL,
  "additional_services" JSONB NULL DEFAULT '[]',
  "usage_metrics" JSONB NULL DEFAULT '{}',
  "billing_notes" TEXT NULL DEFAULT NULL,
  "payment_notes" TEXT NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "generated_by_id" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "contract_billing_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.contract_documents
CREATE TABLE IF NOT EXISTS "contract_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "contract_id" UUID NOT NULL,
  "document_name" VARCHAR(255) NOT NULL,
  "document_type" VARCHAR(50) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_path" VARCHAR(500) NOT NULL,
  "file_size" BIGINT NULL DEFAULT NULL,
  "mime_type" VARCHAR(100) NULL DEFAULT NULL,
  "version" VARCHAR(20) NULL DEFAULT '1.0',
  "is_current_version" BOOLEAN NULL DEFAULT true,
  "previous_version_id" UUID NULL DEFAULT NULL,
  "requires_signature" BOOLEAN NULL DEFAULT false,
  "signature_status" VARCHAR(50) NULL DEFAULT 'pending',
  "signed_date" TIMESTAMP NULL DEFAULT NULL,
  "signed_by_id" UUID NULL DEFAULT NULL,
  "digital_signature_id" VARCHAR(255) NULL DEFAULT NULL,
  "access_level" VARCHAR(50) NULL DEFAULT 'internal',
  "allowed_user_ids" UNKNOWN NULL DEFAULT '{}',
  "allowed_roles" UNKNOWN NULL DEFAULT '{}',
  "description" TEXT NULL DEFAULT NULL,
  "tags" UNKNOWN NULL DEFAULT '{}',
  "expiration_date" TIMESTAMP NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "uploaded_by_id" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY ("contract_id"),
  CONSTRAINT "contract_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.contract_equipment
CREATE TABLE IF NOT EXISTS "contract_equipment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "contract_id" UUID NOT NULL,
  "equipment_name" VARCHAR(255) NOT NULL,
  "equipment_type" VARCHAR(100) NULL DEFAULT NULL,
  "manufacturer" VARCHAR(100) NULL DEFAULT NULL,
  "model" VARCHAR(100) NULL DEFAULT NULL,
  "serial_number" VARCHAR(100) NULL DEFAULT NULL,
  "asset_tag" VARCHAR(100) NULL DEFAULT NULL,
  "installation_location_id" UUID NULL DEFAULT NULL,
  "installation_date" TIMESTAMP NULL DEFAULT NULL,
  "installation_notes" TEXT NULL DEFAULT NULL,
  "coverage_type" VARCHAR(50) NULL DEFAULT 'full',
  "warranty_end_date" TIMESTAMP NULL DEFAULT NULL,
  "maintenance_schedule" VARCHAR(50) NULL DEFAULT NULL,
  "status" VARCHAR(50) NULL DEFAULT 'active',
  "replacement_date" TIMESTAMP NULL DEFAULT NULL,
  "replacement_reason" TEXT NULL DEFAULT NULL,
  "specifications" JSONB NULL DEFAULT '{}',
  "maintenance_history" JSONB NULL DEFAULT '[]',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "contract_equipment_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.contract_renewals
CREATE TABLE IF NOT EXISTS "contract_renewals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "contract_id" UUID NOT NULL,
  "renewal_type" VARCHAR(50) NOT NULL,
  "previous_end_date" TIMESTAMP NOT NULL,
  "new_end_date" TIMESTAMP NOT NULL,
  "renewal_date" TIMESTAMP NULL DEFAULT now(),
  "term_months" INTEGER NOT NULL,
  "previous_value" NUMERIC(15,2) NULL DEFAULT NULL,
  "new_value" NUMERIC(15,2) NULL DEFAULT NULL,
  "adjustment_percent" NUMERIC(5,2) NULL DEFAULT NULL,
  "adjustment_reason" VARCHAR(255) NULL DEFAULT NULL,
  "status" VARCHAR(50) NULL DEFAULT 'pending',
  "requested_by_id" UUID NULL DEFAULT NULL,
  "approved_by_id" UUID NULL DEFAULT NULL,
  "request_date" TIMESTAMP NULL DEFAULT now(),
  "approval_date" TIMESTAMP NULL DEFAULT NULL,
  "changes_from_previous" TEXT NULL DEFAULT NULL,
  "renewal_notes" TEXT NULL DEFAULT NULL,
  "approval_notes" TEXT NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "contract_renewals_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.contract_slas
CREATE TABLE IF NOT EXISTS "contract_slas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "contract_id" UUID NOT NULL,
  "sla_name" VARCHAR(255) NOT NULL,
  "sla_type" VARCHAR(50) NOT NULL,
  "response_time" INTEGER NULL DEFAULT NULL,
  "resolution_time" INTEGER NULL DEFAULT NULL,
  "availability_percent" NUMERIC(5,2) NULL DEFAULT NULL,
  "uptime_hours" NUMERIC(8,2) NULL DEFAULT NULL,
  "business_hours_start" TIME NULL DEFAULT '08:00:00',
  "business_hours_end" TIME NULL DEFAULT '18:00:00',
  "business_days" UNKNOWN NULL DEFAULT '{monday,tuesday,wednesday,thursday,friday}',
  "include_weekends" BOOLEAN NULL DEFAULT false,
  "include_holidays" BOOLEAN NULL DEFAULT false,
  "escalation_level1" INTEGER NULL DEFAULT NULL,
  "escalation_level2" INTEGER NULL DEFAULT NULL,
  "escalation_level3" INTEGER NULL DEFAULT NULL,
  "escalation_manager_id" UUID NULL DEFAULT NULL,
  "penalty_percent" NUMERIC(5,2) NULL DEFAULT NULL,
  "bonus_percent" NUMERIC(5,2) NULL DEFAULT NULL,
  "penalty_cap_percent" NUMERIC(5,2) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("contract_id", "sla_name"),
  KEY ("contract_id"),
  CONSTRAINT "contract_slas_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.customers
CREATE TABLE IF NOT EXISTS "customers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "first_name" VARCHAR(255) NULL DEFAULT NULL,
  "last_name" VARCHAR(255) NULL DEFAULT NULL,
  "email" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50) NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "address" VARCHAR(500) NULL DEFAULT NULL,
  "address_number" VARCHAR(20) NULL DEFAULT NULL,
  "complement" VARCHAR(100) NULL DEFAULT NULL,
  "neighborhood" VARCHAR(100) NULL DEFAULT NULL,
  "city" VARCHAR(100) NULL DEFAULT NULL,
  "state" VARCHAR(50) NULL DEFAULT NULL,
  "zip_code" VARCHAR(20) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "customer_type" VARCHAR(50) NULL DEFAULT 'individual',
  "mobile_phone" VARCHAR(20) NULL DEFAULT NULL,
  "cpf" VARCHAR(14) NULL DEFAULT NULL,
  "cnpj" VARCHAR(18) NULL DEFAULT NULL,
  "company_name" VARCHAR(255) NULL DEFAULT NULL,
  "contact_person" VARCHAR(255) NULL DEFAULT NULL,
  "created_by_id" UUID NULL DEFAULT NULL,
  "updated_by_id" UUID NULL DEFAULT NULL,
  "address_country" TEXT,
  "tags" TEXT,
  "verified" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "email"),
  KEY ("customer_type"),
  KEY ("is_active"),
  KEY ("email"),
  KEY ("tenant_id", "email"),
  KEY ("tenant_id", "is_active"),
  KEY ("tenant_id", "customer_type"),
  KEY ("tenant_id", "first_name", "last_name"),
  UNIQUE ("tenant_id", "email"),
  CONSTRAINT "customer_type_check" CHECK ((((customer_type)::text = ANY ((ARRAY['PF'::character varying, 'PJ'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.customer_item_mappings
CREATE TABLE IF NOT EXISTS "customer_item_mappings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "custom_sku" VARCHAR(100) NULL DEFAULT NULL,
  "custom_name" VARCHAR(255) NULL DEFAULT NULL,
  "custom_description" TEXT NULL DEFAULT NULL,
  "customer_reference" VARCHAR(100) NULL DEFAULT NULL,
  "lead_time_days" INTEGER NULL DEFAULT NULL,
  "preferred_supplier" VARCHAR(255) NULL DEFAULT NULL,
  "special_instructions" TEXT NULL DEFAULT NULL,
  "custom_fields" JSONB NULL DEFAULT '{}',
  "contract_reference" VARCHAR(100) NULL DEFAULT NULL,
  "requires_approval" BOOLEAN NULL DEFAULT false,
  "approval_limit" NUMERIC(15,2) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "effective_date" TIMESTAMP NULL DEFAULT now(),
  "expiration_date" TIMESTAMP NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NULL DEFAULT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  "customer_item_code" TEXT NULL DEFAULT NULL,
  "customer_item_name" TEXT NULL DEFAULT NULL,
  "customer_item_description" TEXT NULL DEFAULT NULL,
  "unit_price" TEXT NULL DEFAULT NULL,
  KEY ("tenant_id", "customer_id"),
  KEY ("tenant_id", "item_id"),
  KEY ("tenant_id", "is_active"),
  KEY ("tenant_id", "custom_sku"),
  UNIQUE ("tenant_id", "customer_id", "item_id"),
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "customer_id", "item_id"),
  UNIQUE ("tenant_id", "customer_id", "custom_sku"),
  KEY ("tenant_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.custom_fields_metadata
CREATE TABLE IF NOT EXISTS "custom_fields_metadata" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "module_type" VARCHAR(50) NOT NULL,
  "field_name" VARCHAR(100) NOT NULL,
  "field_label" VARCHAR(200) NOT NULL,
  "field_type" VARCHAR(50) NOT NULL,
  "is_required" BOOLEAN NULL DEFAULT false,
  "display_order" INTEGER NULL DEFAULT 0,
  "validation_rules" JSONB NULL DEFAULT '{}',
  "field_options" JSONB NULL DEFAULT '{}',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID NOT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.custom_fields_values
CREATE TABLE IF NOT EXISTS "custom_fields_values" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "field_id" UUID NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" UUID NOT NULL,
  "field_value" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.custom_field_metadata
CREATE TABLE IF NOT EXISTS "custom_field_metadata" (
  "id" VARCHAR(255) NOT NULL,
  "module_type" VARCHAR(100) NOT NULL,
  "field_name" VARCHAR(255) NOT NULL,
  "field_type" VARCHAR(100) NOT NULL,
  "field_label" VARCHAR(255) NOT NULL,
  "is_required" BOOLEAN NULL DEFAULT false,
  "validation_rules" JSONB NULL DEFAULT '{}',
  "field_options" JSONB NULL DEFAULT '[]',
  "placeholder" TEXT NULL DEFAULT '',
  "default_value" TEXT NULL DEFAULT '',
  "display_order" INTEGER NULL DEFAULT 0,
  "is_active" BOOLEAN NULL DEFAULT true,
  "help_text" TEXT NULL DEFAULT '',
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("module_type", "field_name")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.daily_timesheet
CREATE TABLE IF NOT EXISTS "daily_timesheet" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "clock_in_time" TIME NULL DEFAULT NULL,
  "clock_out_time" TIME NULL DEFAULT NULL,
  "total_worked_hours" NUMERIC(5,2) NULL DEFAULT 0,
  "overtime_hours" NUMERIC(5,2) NULL DEFAULT 0,
  "break_time_minutes" INTEGER NULL DEFAULT 0,
  "late_minutes" INTEGER NULL DEFAULT 0,
  "early_departure_minutes" INTEGER NULL DEFAULT 0,
  "status" VARCHAR(20) NULL DEFAULT 'pending',
  "digital_signature" TEXT NULL DEFAULT NULL,
  "tenant_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("user_id", "date", "tenant_id"),
  CONSTRAINT "daily_timesheet_status_check" CHECK ((((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'disputed'::character varying, 'corrected'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.dashboards
CREATE TABLE IF NOT EXISTS "dashboards" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "layout" JSONB NULL DEFAULT '{}',
  "layout_type" VARCHAR(50) NULL DEFAULT 'grid',
  "is_real_time" BOOLEAN NULL DEFAULT false,
  "refresh_interval" INTEGER NULL DEFAULT 60,
  "is_public" BOOLEAN NULL DEFAULT false,
  "tags" UNKNOWN NULL DEFAULT '{}',
  "share_token" VARCHAR(255) NULL DEFAULT NULL,
  "expires_at" TIMESTAMP NULL DEFAULT NULL,
  "allowed_roles" UNKNOWN NULL DEFAULT '{}',
  "theme" JSONB NULL DEFAULT '{"background": "default", "primaryColor": "#3b82f6", "secondaryColor": "#8b5cf6"}',
  "mobile_config" JSONB NULL DEFAULT '{"columns": 1, "enabled": true, "hiddenWidgets": []}',
  "tablet_config" JSONB NULL DEFAULT '{"columns": 2, "enabled": true, "hiddenWidgets": []}',
  "owner_id" UUID NOT NULL,
  "created_by" UUID NOT NULL,
  "last_viewed_at" TIMESTAMP NULL DEFAULT NULL,
  "view_count" INTEGER NULL DEFAULT 0,
  "is_favorite" BOOLEAN NULL DEFAULT false,
  "widget_count" INTEGER NULL DEFAULT 0,
  "status" VARCHAR(50) NULL DEFAULT 'active',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "deleted_at" TIMESTAMP NULL DEFAULT NULL,
  "created_by_id" UUID NULL DEFAULT NULL,
  "updated_by_id" UUID NULL DEFAULT NULL,
  "layout_config" TEXT,
  "permissions" TEXT,
  "widgets" TEXT,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.dashboard_configs
CREATE TABLE IF NOT EXISTS "dashboard_configs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "dashboard_name" VARCHAR(200) NOT NULL,
  "dashboard_type" VARCHAR(50) NOT NULL,
  "user_id" UUID NULL DEFAULT NULL,
  "role_based" BOOLEAN NULL DEFAULT false,
  "target_roles" UNKNOWN NULL DEFAULT NULL,
  "widgets" JSONB NOT NULL,
  "layout_config" JSONB NULL DEFAULT NULL,
  "refresh_interval_seconds" INTEGER NULL DEFAULT 300,
  "data_sources" JSONB NULL DEFAULT NULL,
  "filters" JSONB NULL DEFAULT NULL,
  "permissions" JSONB NULL DEFAULT NULL,
  "is_public" BOOLEAN NULL DEFAULT false,
  "is_default" BOOLEAN NULL DEFAULT false,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "is_active" BOOLEAN NULL DEFAULT true,
  PRIMARY KEY ("id"),
  CONSTRAINT "dashboard_configs_dashboard_type_check" CHECK ((((dashboard_type)::text = ANY ((ARRAY['OPERATIONAL'::character varying, 'FINANCIAL'::character varying, 'INVENTORY'::character varying, 'PERFORMANCE'::character varying, 'COMPLIANCE'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.dashboard_widgets
CREATE TABLE IF NOT EXISTS "dashboard_widgets" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "dashboard_id" UUID NOT NULL,
  "widget_type" VARCHAR(50) NULL DEFAULT NULL,
  "title" VARCHAR(255) NULL DEFAULT NULL,
  "configuration" JSONB NULL DEFAULT '{}',
  "data_source" JSONB NULL DEFAULT '{}',
  "position" JSONB NULL DEFAULT '{}',
  "size" JSONB NULL DEFAULT '{}',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "dashboard_widgets_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "dashboards" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.dynamic_pricing
CREATE TABLE IF NOT EXISTS "dynamic_pricing" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "price_list_id" UUID NOT NULL,
  "item_id" UUID NULL DEFAULT NULL,
  "base_price" NUMERIC(15,2) NOT NULL,
  "current_price" NUMERIC(15,2) NOT NULL,
  "demand_factor" NUMERIC(5,4) NULL DEFAULT 1.0000,
  "seasonal_factor" NUMERIC(5,4) NULL DEFAULT 1.0000,
  "inventory_factor" NUMERIC(5,4) NULL DEFAULT 1.0000,
  "competitor_factor" NUMERIC(5,4) NULL DEFAULT 1.0000,
  "last_updated" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "calculation_rules" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "price_list_id", "item_id"),
  KEY ("tenant_id", "item_id"),
  CONSTRAINT "dynamic_pricing_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.emails
CREATE TABLE IF NOT EXISTS "emails" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "message_id" TEXT NOT NULL,
  "thread_id" TEXT NULL DEFAULT NULL,
  "from_email" TEXT NOT NULL,
  "from_name" TEXT NULL DEFAULT NULL,
  "to_email" TEXT NOT NULL,
  "cc_emails" TEXT NULL DEFAULT '[]',
  "bcc_emails" TEXT NULL DEFAULT '[]',
  "subject" TEXT NULL DEFAULT NULL,
  "body_text" TEXT NULL DEFAULT NULL,
  "body_html" TEXT NULL DEFAULT NULL,
  "has_attachments" BOOLEAN NULL DEFAULT false,
  "attachment_count" INTEGER NULL DEFAULT 0,
  "attachment_details" TEXT NULL DEFAULT '[]',
  "email_headers" TEXT NULL DEFAULT '{}',
  "priority" VARCHAR(20) NULL DEFAULT 'medium',
  "is_read" BOOLEAN NULL DEFAULT false,
  "is_processed" BOOLEAN NULL DEFAULT false,
  "rule_matched" TEXT NULL DEFAULT NULL,
  "ticket_created" UUID NULL DEFAULT NULL,
  "email_date" TIMESTAMP NULL DEFAULT NULL,
  "received_at" TIMESTAMP NULL DEFAULT now(),
  "processed_at" TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("message_id"),
  KEY ("tenant_id", "received_at"),
  KEY ("message_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.email_inbox
CREATE TABLE IF NOT EXISTS "email_inbox" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "message_id" VARCHAR(255) NULL DEFAULT NULL,
  "subject" TEXT NULL DEFAULT NULL,
  "sender" VARCHAR(255) NULL DEFAULT NULL,
  "recipient" VARCHAR(255) NULL DEFAULT NULL,
  "body" TEXT NULL DEFAULT NULL,
  "priority" VARCHAR(20) NULL DEFAULT 'medium',
  "status" VARCHAR(20) NULL DEFAULT 'unread',
  "processed" BOOLEAN NULL DEFAULT false,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.email_inbox_messages
CREATE TABLE IF NOT EXISTS "email_inbox_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "message_id" VARCHAR(255) NULL DEFAULT NULL,
  "thread_id" VARCHAR(255) NULL DEFAULT NULL,
  "from_email" VARCHAR(255) NOT NULL,
  "from_name" VARCHAR(255) NULL DEFAULT NULL,
  "to_email" VARCHAR(255) NULL DEFAULT NULL,
  "cc_emails" TEXT NULL DEFAULT NULL,
  "bcc_emails" TEXT NULL DEFAULT NULL,
  "subject" TEXT NULL DEFAULT NULL,
  "body_text" TEXT NULL DEFAULT NULL,
  "body_html" TEXT NULL DEFAULT NULL,
  "has_attachments" BOOLEAN NULL DEFAULT false,
  "attachment_count" INTEGER NULL DEFAULT 0,
  "attachment_details" JSONB NULL DEFAULT '[]',
  "email_headers" JSONB NULL DEFAULT '{}',
  "priority" VARCHAR(20) NULL DEFAULT 'normal',
  "is_read" BOOLEAN NULL DEFAULT false,
  "is_processed" BOOLEAN NULL DEFAULT false,
  "rule_matched" UUID NULL DEFAULT NULL,
  "ticket_created" UUID NULL DEFAULT NULL,
  "email_date" TIMESTAMP NULL DEFAULT NULL,
  "received_at" TIMESTAMP NULL DEFAULT now(),
  "processed_at" TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("message_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.email_processing_logs
CREATE TABLE IF NOT EXISTS "email_processing_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "message_id" VARCHAR(255) NOT NULL,
  "rule_id" UUID NULL DEFAULT NULL,
  "processing_status" VARCHAR(50) NOT NULL,
  "action_taken" VARCHAR(100) NULL DEFAULT NULL,
  "ticket_id" UUID NULL DEFAULT NULL,
  "error_message" TEXT NULL DEFAULT NULL,
  "processing_time_ms" INTEGER NULL DEFAULT NULL,
  "email_from" VARCHAR(255) NULL DEFAULT NULL,
  "email_subject" TEXT NULL DEFAULT NULL,
  "metadata" JSONB NULL DEFAULT '{}',
  "processed_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.email_processing_rules
CREATE TABLE IF NOT EXISTS "email_processing_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "priority" INTEGER NULL DEFAULT 0,
  "is_active" BOOLEAN NULL DEFAULT true,
  "from_email_pattern" VARCHAR(500) NULL DEFAULT NULL,
  "subject_pattern" VARCHAR(500) NULL DEFAULT NULL,
  "body_pattern" TEXT NULL DEFAULT NULL,
  "attachment_required" BOOLEAN NULL DEFAULT false,
  "action_type" VARCHAR(50) NOT NULL DEFAULT 'create_ticket',
  "default_category" VARCHAR(100) NULL DEFAULT NULL,
  "default_priority" VARCHAR(20) NULL DEFAULT 'medium',
  "default_urgency" VARCHAR(20) NULL DEFAULT 'medium',
  "default_status" VARCHAR(50) NULL DEFAULT 'open',
  "default_assignee_id" UUID NULL DEFAULT NULL,
  "default_assignment_group" VARCHAR(100) NULL DEFAULT NULL,
  "auto_response_enabled" BOOLEAN NULL DEFAULT false,
  "auto_response_template_id" UUID NULL DEFAULT NULL,
  "auto_response_delay" INTEGER NULL DEFAULT 0,
  "extract_ticket_number" BOOLEAN NULL DEFAULT true,
  "create_duplicate_tickets" BOOLEAN NULL DEFAULT false,
  "notify_assignee" BOOLEAN NULL DEFAULT true,
  "metadata" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.email_response_templates
CREATE TABLE IF NOT EXISTS "email_response_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "template_type" VARCHAR(50) NOT NULL DEFAULT 'auto_response',
  "subject_template" TEXT NOT NULL,
  "body_template_text" TEXT NULL DEFAULT NULL,
  "body_template_html" TEXT NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "priority" INTEGER NULL DEFAULT 0,
  "language_code" VARCHAR(10) NULL DEFAULT 'pt-BR',
  "variable_mapping" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "signature_id" VARCHAR(36) NULL DEFAULT NULL,
  "include_signature" BOOLEAN NULL DEFAULT false,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.email_signatures
CREATE TABLE IF NOT EXISTS "email_signatures" (
  "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "support_group" VARCHAR(100) NOT NULL,
  "contact_name" VARCHAR(255) NULL DEFAULT NULL,
  "contact_title" VARCHAR(255) NULL DEFAULT NULL,
  "contact_email" VARCHAR(255) NULL DEFAULT NULL,
  "contact_phone" VARCHAR(50) NULL DEFAULT NULL,
  "signature_text" TEXT NULL DEFAULT NULL,
  "signature_html" TEXT NULL DEFAULT NULL,
  "is_default" BOOLEAN NULL DEFAULT false,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "tenant_id" UUID NOT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.expense_audit_trail
CREATE TABLE IF NOT EXISTS "expense_audit_trail" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" UUID NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "user_id" UUID NOT NULL,
  "user_name" VARCHAR(255) NOT NULL,
  "user_role" VARCHAR(100) NULL DEFAULT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
  "ip_address" VARCHAR(45) NULL DEFAULT NULL,
  "user_agent" TEXT NULL DEFAULT NULL,
  "old_values" JSONB NULL DEFAULT NULL,
  "new_values" JSONB NULL DEFAULT NULL,
  "metadata" JSONB NULL DEFAULT NULL,
  "session_id" VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.expense_items
CREATE TABLE IF NOT EXISTS "expense_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "expense_report_id" UUID NOT NULL,
  "item_number" INTEGER NOT NULL,
  "expense_type" VARCHAR(30) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "subcategory" VARCHAR(100) NULL DEFAULT NULL,
  "description" TEXT NOT NULL,
  "expense_date" DATE NOT NULL,
  "amount" NUMERIC(15,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
  "exchange_rate" NUMERIC(10,6) NULL DEFAULT 1,
  "amount_local" NUMERIC(15,2) NOT NULL,
  "vendor" VARCHAR(255) NULL DEFAULT NULL,
  "vendor_tax_id" VARCHAR(50) NULL DEFAULT NULL,
  "location" VARCHAR(255) NULL DEFAULT NULL,
  "payment_method" VARCHAR(30) NOT NULL,
  "card_transaction_id" VARCHAR(100) NULL DEFAULT NULL,
  "receipt_number" VARCHAR(100) NULL DEFAULT NULL,
  "tax_amount" NUMERIC(15,2) NULL DEFAULT 0,
  "tax_rate" NUMERIC(5,2) NULL DEFAULT NULL,
  "business_justification" TEXT NULL DEFAULT NULL,
  "attendees" JSONB NULL DEFAULT NULL,
  "mileage" NUMERIC(10,2) NULL DEFAULT NULL,
  "mileage_rate" NUMERIC(10,4) NULL DEFAULT NULL,
  "policy_violation" BOOLEAN NULL DEFAULT false,
  "policy_violation_details" TEXT NULL DEFAULT NULL,
  "compliance_notes" TEXT NULL DEFAULT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "expense_items_expense_report_id_fkey" FOREIGN KEY ("expense_report_id") REFERENCES "expense_reports" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.expense_reports
CREATE TABLE IF NOT EXISTS "expense_reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "report_number" VARCHAR(50) NOT NULL,
  "employee_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "submission_date" TIMESTAMP NULL DEFAULT NULL,
  "approval_date" TIMESTAMP NULL DEFAULT NULL,
  "payment_date" TIMESTAMP NULL DEFAULT NULL,
  "total_amount" NUMERIC(15,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
  "exchange_rate" NUMERIC(10,6) NULL DEFAULT 1,
  "total_amount_local" NUMERIC(15,2) NOT NULL DEFAULT 0,
  "department_id" UUID NULL DEFAULT NULL,
  "cost_center_id" UUID NULL DEFAULT NULL,
  "project_id" UUID NULL DEFAULT NULL,
  "policy_violation_level" VARCHAR(20) NULL DEFAULT 'none',
  "risk_score" INTEGER NULL DEFAULT 0,
  "compliance_checked" BOOLEAN NULL DEFAULT false,
  "audit_required" BOOLEAN NULL DEFAULT false,
  "current_approver_id" UUID NULL DEFAULT NULL,
  "approval_workflow_id" UUID NULL DEFAULT NULL,
  "metadata" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by_id" UUID NOT NULL,
  "updated_by_id" UUID NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "report_number")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.external_contacts
CREATE TABLE IF NOT EXISTS "external_contacts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "first_name" VARCHAR(255) NOT NULL,
  "last_name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NULL DEFAULT NULL,
  "phone" VARCHAR(50) NULL DEFAULT NULL,
  "type" VARCHAR(50) NULL DEFAULT 'favorecido',
  "company" VARCHAR(255) NULL DEFAULT NULL,
  "department" VARCHAR(255) NULL DEFAULT NULL,
  "position" VARCHAR(255) NULL DEFAULT NULL,
  "address" TEXT NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "name" VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "external_contacts_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.field_alias_mapping
CREATE TABLE IF NOT EXISTS "field_alias_mapping" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "source_table" VARCHAR(100) NOT NULL,
  "source_field" VARCHAR(100) NOT NULL,
  "alias_field" VARCHAR(100) NOT NULL,
  "alias_display_name" VARCHAR(200) NOT NULL,
  "market_code" VARCHAR(10) NOT NULL,
  "validation_rules" JSONB NOT NULL DEFAULT '{}',
  "transformation_rules" JSONB NOT NULL DEFAULT '{}',
  "description" TEXT NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "source_table"),
  KEY ("tenant_id", "source_table")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.flexible_work_arrangements
CREATE TABLE IF NOT EXISTS "flexible_work_arrangements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" VARCHAR(36) NOT NULL,
  "arrangement_type" VARCHAR(30) NOT NULL,
  "core_hours_start" VARCHAR(8) NULL DEFAULT NULL,
  "core_hours_end" VARCHAR(8) NULL DEFAULT NULL,
  "flex_window_start" VARCHAR(8) NULL DEFAULT NULL,
  "flex_window_end" VARCHAR(8) NULL DEFAULT NULL,
  "remote_work_days" JSONB NULL DEFAULT '[]',
  "remote_work_location" TEXT NULL DEFAULT NULL,
  "compressed_week_config" JSONB NULL DEFAULT '{}',
  "multiple_contracts" JSONB NULL DEFAULT '[]',
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "approved_by" VARCHAR(36) NULL DEFAULT NULL,
  "approved_at" TIMESTAMP NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "user_id"),
  CONSTRAINT "flexible_work_arrangements_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.gdpr_audit_log
CREATE TABLE IF NOT EXISTS "gdpr_audit_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "entity_type" VARCHAR(100) NOT NULL,
  "entity_id" UUID NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "previous_data" JSONB NULL DEFAULT NULL,
  "new_data" JSONB NULL DEFAULT NULL,
  "changes" JSONB NULL DEFAULT NULL,
  "user_agent" TEXT NULL DEFAULT NULL,
  "ip_address" VARCHAR(45) NULL DEFAULT NULL,
  "session_id" VARCHAR(255) NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  PRIMARY KEY ("id"),
  KEY ("entity_type", "entity_id"),
  KEY ("created_at")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.gdpr_audit_logs
CREATE TABLE IF NOT EXISTS "gdpr_audit_logs" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NULL DEFAULT NULL,
  "action" VARCHAR(100) NULL DEFAULT NULL,
  "entity_type" VARCHAR(50) NULL DEFAULT NULL,
  "entity_id" UUID NULL DEFAULT NULL,
  "details" TEXT NULL DEFAULT NULL,
  "ip_address" VARCHAR(45) NULL DEFAULT NULL,
  "user_agent" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.gdpr_compliance_tasks
CREATE TABLE IF NOT EXISTS "gdpr_compliance_tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "report_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "status" UNKNOWN NOT NULL DEFAULT 'draft',
  "priority" UNKNOWN NOT NULL DEFAULT 'medium',
  "task_type" VARCHAR(100) NULL DEFAULT NULL,
  "estimated_hours" INTEGER NULL DEFAULT NULL,
  "actual_hours" INTEGER NULL DEFAULT NULL,
  "due_date" TIMESTAMP NULL DEFAULT NULL,
  "completed_at" TIMESTAMP NULL DEFAULT NULL,
  "assigned_user_id" UUID NULL DEFAULT NULL,
  "assigned_by" UUID NULL DEFAULT NULL,
  "task_data" JSONB NULL DEFAULT NULL,
  "evidence" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "deleted_at" TIMESTAMP NULL DEFAULT NULL,
  "deleted_by" UUID NULL DEFAULT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY ("id"),
  KEY ("report_id"),
  KEY ("assigned_user_id"),
  KEY ("status"),
  CONSTRAINT "gdpr_compliance_tasks_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "gdpr_reports" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.gdpr_consent_records
CREATE TABLE IF NOT EXISTS "gdpr_consent_records" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "consent_type" VARCHAR(100) NULL DEFAULT NULL,
  "purpose" TEXT NULL DEFAULT NULL,
  "legal_basis" VARCHAR(100) NULL DEFAULT NULL,
  "granted" BOOLEAN NULL DEFAULT true,
  "granted_at" TIMESTAMP NULL DEFAULT now(),
  "withdrawn_at" TIMESTAMP NULL DEFAULT NULL,
  "ip_address" VARCHAR(45) NULL DEFAULT NULL,
  "user_agent" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.gdpr_data_requests
CREATE TABLE IF NOT EXISTS "gdpr_data_requests" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "request_type" UNKNOWN NOT NULL,
  "subject_email" VARCHAR(255) NOT NULL,
  "subject_name" VARCHAR(255) NULL DEFAULT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "status" UNKNOWN NULL DEFAULT 'pending',
  "requested_at" TIMESTAMP NULL DEFAULT now(),
  "processed_at" TIMESTAMP NULL DEFAULT NULL,
  "processed_by_id" UUID NULL DEFAULT NULL,
  "response_data" JSONB NULL DEFAULT '{}',
  "metadata" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.gdpr_reports
CREATE TABLE IF NOT EXISTS "gdpr_reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" VARCHAR(500) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "report_type" UNKNOWN NOT NULL,
  "status" UNKNOWN NOT NULL DEFAULT 'draft',
  "priority" UNKNOWN NOT NULL DEFAULT 'medium',
  "risk_level" UNKNOWN NULL DEFAULT 'medium',
  "report_data" JSONB NULL DEFAULT NULL,
  "findings" JSONB NULL DEFAULT NULL,
  "action_items" JSONB NULL DEFAULT NULL,
  "attachments" JSONB NULL DEFAULT NULL,
  "compliance_score" INTEGER NULL DEFAULT NULL,
  "last_audit_date" TIMESTAMP NULL DEFAULT NULL,
  "next_review_date" TIMESTAMP NULL DEFAULT NULL,
  "due_date" TIMESTAMP NULL DEFAULT NULL,
  "assigned_user_id" UUID NULL DEFAULT NULL,
  "reviewer_user_id" UUID NULL DEFAULT NULL,
  "approver_user_id" UUID NULL DEFAULT NULL,
  "submitted_at" TIMESTAMP NULL DEFAULT NULL,
  "approved_at" TIMESTAMP NULL DEFAULT NULL,
  "published_at" TIMESTAMP NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "deleted_at" TIMESTAMP NULL DEFAULT NULL,
  "deleted_by" UUID NULL DEFAULT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY ("id"),
  KEY ("tenant_id"),
  KEY ("status"),
  KEY ("report_type"),
  KEY ("assigned_user_id"),
  KEY ("created_at"),
  KEY ("due_date"),
  KEY ("is_active")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.gdpr_report_templates
CREATE TABLE IF NOT EXISTS "gdpr_report_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "report_type" UNKNOWN NOT NULL,
  "template_data" JSONB NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "deleted_at" TIMESTAMP NULL DEFAULT NULL,
  "deleted_by" UUID NULL DEFAULT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.holidays
CREATE TABLE IF NOT EXISTS "holidays" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "date" DATE NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "country_code" VARCHAR(3) NOT NULL,
  "region_code" VARCHAR(10) NULL DEFAULT NULL,
  "is_recurring" BOOLEAN NULL DEFAULT false,
  "is_active" BOOLEAN NULL DEFAULT true,
  "description" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "date"),
  KEY ("tenant_id", "country_code"),
  KEY ("tenant_id", "type"),
  KEY ("tenant_id", "is_active"),
  CONSTRAINT "holidays_type_check" CHECK ((((type)::text = ANY ((ARRAY['national'::character varying, 'regional'::character varying, 'corporate'::character varying, 'optional'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.hour_bank
CREATE TABLE IF NOT EXISTS "hour_bank" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" VARCHAR(36) NOT NULL,
  "reference_date" TIMESTAMP NOT NULL,
  "balance_hours" VARCHAR(10) NOT NULL,
  "accumulated_hours" VARCHAR(10) NULL DEFAULT '0',
  "used_hours" VARCHAR(10) NULL DEFAULT '0',
  "expired_hours" VARCHAR(10) NULL DEFAULT '0',
  "expiration_policy" VARCHAR(20) NULL DEFAULT '6_months',
  "expiration_date" TIMESTAMP NULL DEFAULT NULL,
  "movement_type" VARCHAR(20) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "related_timesheet_id" VARCHAR(36) NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.integrations
CREATE TABLE IF NOT EXISTS "integrations" (
  "id" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "category" VARCHAR(100) NULL DEFAULT NULL,
  "icon" VARCHAR(100) NULL DEFAULT NULL,
  "status" VARCHAR(50) NULL DEFAULT 'disconnected',
  "config" JSONB NULL DEFAULT '{}',
  "features" UNKNOWN NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "tenant_id" VARCHAR(36) NOT NULL,
  "is_currently_monitoring" BOOLEAN NULL DEFAULT false,
  "configured" BOOLEAN NULL DEFAULT false,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.integration_apis
CREATE TABLE IF NOT EXISTS "integration_apis" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "api_name" VARCHAR(200) NOT NULL,
  "api_type" VARCHAR(50) NOT NULL,
  "endpoint_url" VARCHAR(500) NOT NULL,
  "auth_method" VARCHAR(30) NOT NULL,
  "credentials" JSONB NULL DEFAULT NULL,
  "sync_direction" VARCHAR(20) NULL DEFAULT 'BIDIRECTIONAL',
  "sync_frequency_minutes" INTEGER NULL DEFAULT 60,
  "data_mapping" JSONB NULL DEFAULT NULL,
  "transformation_rules" JSONB NULL DEFAULT NULL,
  "error_handling_rules" JSONB NULL DEFAULT NULL,
  "last_sync" TIMESTAMP NULL DEFAULT NULL,
  "last_success" TIMESTAMP NULL DEFAULT NULL,
  "error_count" INTEGER NULL DEFAULT 0,
  "last_error" TEXT NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'ACTIVE',
  "timeout_seconds" INTEGER NULL DEFAULT 30,
  "retry_attempts" INTEGER NULL DEFAULT 3,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "is_active" BOOLEAN NULL DEFAULT true,
  PRIMARY KEY ("id"),
  CONSTRAINT "integration_apis_api_type_check" CHECK ((((api_type)::text = ANY ((ARRAY['ERP'::character varying, 'ACCOUNTING'::character varying, 'CRM'::character varying, 'INVENTORY'::character varying, 'MAINTENANCE'::character varying, 'MOBILE'::character varying])::text[])))),
  CONSTRAINT "integration_apis_auth_method_check" CHECK ((((auth_method)::text = ANY ((ARRAY['API_KEY'::character varying, 'OAUTH2'::character varying, 'BASIC'::character varying, 'BEARER'::character varying])::text[])))),
  CONSTRAINT "integration_apis_status_check" CHECK ((((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'ERROR'::character varying, 'MAINTENANCE'::character varying])::text[])))),
  CONSTRAINT "integration_apis_sync_direction_check" CHECK ((((sync_direction)::text = ANY ((ARRAY['INBOUND'::character varying, 'OUTBOUND'::character varying, 'BIDIRECTIONAL'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.internal_forms
CREATE TABLE IF NOT EXISTS "internal_forms" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "category" VARCHAR(100) NOT NULL,
  "fields" JSONB NOT NULL DEFAULT '[]',
  "actions" JSONB NOT NULL DEFAULT '[]',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "tenant_id_uuid_format" CHECK ((((length((tenant_id)::text) = 36) AND ((tenant_id)::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'::text))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.items
CREATE TABLE IF NOT EXISTS "items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "active" BOOLEAN NULL DEFAULT true,
  "type" VARCHAR(20) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "integration_code" VARCHAR(100) NULL DEFAULT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "measurement_unit" VARCHAR(10) NULL DEFAULT 'UN',
  "maintenance_plan" TEXT NULL DEFAULT NULL,
  "default_checklist" JSONB NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID NULL DEFAULT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  "group_name" VARCHAR(100) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "code" TEXT NULL DEFAULT NULL,
  "category" TEXT NULL DEFAULT NULL,
  "subcategory" TEXT NULL DEFAULT NULL,
  "unit_of_measurement" TEXT NULL DEFAULT NULL,
  "unit_cost" TEXT NULL DEFAULT NULL,
  "maximum_stock" TEXT NULL DEFAULT NULL,
  "supplier_id" UUID NULL DEFAULT NULL,
  "brand" TEXT NULL DEFAULT NULL,
  "model" TEXT NULL DEFAULT NULL,
  "minimum_stock" TEXT,
  "specifications" TEXT,
  "stock_quantity" TEXT,
  PRIMARY KEY ("id"),
  CONSTRAINT "items_status_check" CHECK ((((status)::text = ANY ((ARRAY['active'::character varying, 'under_review'::character varying, 'discontinued'::character varying])::text[])))),
  CONSTRAINT "items_type_check" CHECK ((((type)::text = ANY ((ARRAY['material'::character varying, 'service'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.item_hierarchy
CREATE TABLE IF NOT EXISTS "item_hierarchy" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "parent_item_id" UUID NOT NULL,
  "child_item_id" UUID NOT NULL,
  "order" INTEGER NULL DEFAULT 0,
  "is_active" BOOLEAN NULL DEFAULT true,
  "notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "created_by" UUID NULL DEFAULT NULL,
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "updated_by" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("parent_item_id", "child_item_id"),
  KEY ("parent_item_id"),
  CONSTRAINT "fk_child_item" FOREIGN KEY ("child_item_id") REFERENCES "items" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "fk_parent_item" FOREIGN KEY ("parent_item_id") REFERENCES "items" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.item_supplier_links
CREATE TABLE IF NOT EXISTS "item_supplier_links" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "supplier_id" UUID NOT NULL,
  "part_number" VARCHAR(100) NULL DEFAULT NULL,
  "supplier_item_code" VARCHAR(100) NULL DEFAULT NULL,
  "supplier_item_name" VARCHAR(255) NULL DEFAULT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "unit_price" NUMERIC(15,2) NULL DEFAULT NULL,
  "currency" VARCHAR(3) NULL DEFAULT 'BRL',
  "lead_time_days" INTEGER NULL DEFAULT NULL,
  "minimum_order_quantity" INTEGER NULL DEFAULT NULL,
  "qr_code" VARCHAR(255) NULL DEFAULT NULL,
  "barcode" VARCHAR(255) NULL DEFAULT NULL,
  "is_preferred" BOOLEAN NULL DEFAULT false,
  "is_active" BOOLEAN NULL DEFAULT true,
  "notes" TEXT NULL DEFAULT NULL,
  "last_price_update" TIMESTAMP NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "created_by" UUID NULL DEFAULT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "item_id", "supplier_id"),
  UNIQUE ("tenant_id", "supplier_id", "part_number")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_approvals
CREATE TABLE IF NOT EXISTS "knowledge_base_approvals" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "article_id" VARCHAR NOT NULL,
  "approver_id" VARCHAR NOT NULL,
  "status" UNKNOWN NOT NULL DEFAULT 'pending',
  "comments" TEXT NULL DEFAULT NULL,
  "requested_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewed_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "article_id"),
  KEY ("tenant_id", "approver_id"),
  KEY ("tenant_id", "status"),
  CONSTRAINT "kb_approvals_article_fk" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_approval_workflows
CREATE TABLE IF NOT EXISTS "knowledge_base_approval_workflows" (
  "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
  "tenant_id" VARCHAR(36) NOT NULL,
  "article_id" VARCHAR(36) NOT NULL,
  "status" VARCHAR(50) NULL DEFAULT 'pending',
  "requested_by" VARCHAR(36) NOT NULL,
  "approved_by" VARCHAR(36) NULL DEFAULT NULL,
  "comments" TEXT NULL DEFAULT NULL,
  "requested_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "responded_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_articles
CREATE TABLE IF NOT EXISTS "knowledge_base_articles" (
  "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
  "tenant_id" VARCHAR(36) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "tags" UNKNOWN NULL DEFAULT ARRAY[]::text[],
  "access_level" UNKNOWN NULL DEFAULT 'public',
  "author_id" VARCHAR(36) NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "published" BOOLEAN NULL DEFAULT false,
  "published_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "view_count" INTEGER NULL DEFAULT 0,
  "helpful_count" INTEGER NULL DEFAULT 0,
  "is_deleted" BOOLEAN NULL DEFAULT false,
  "deleted_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "summary" TEXT NULL DEFAULT NULL,
  "slug" VARCHAR(200) NULL DEFAULT NULL,
  "visibility" TEXT NULL DEFAULT 'internal',
  "status" TEXT NULL DEFAULT 'draft',
  "version" INTEGER NULL DEFAULT 1,
  "content_type" VARCHAR(100) NULL DEFAULT 'article',
  "approval_status" TEXT NULL DEFAULT 'pending',
  "rating_average" NUMERIC(3,2) NULL DEFAULT 0.0,
  "rating_count" INTEGER NULL DEFAULT 0,
  "attachment_count" INTEGER NULL DEFAULT 0,
  "reviewer_id" VARCHAR NULL DEFAULT NULL,
  "keywords" UNKNOWN NULL DEFAULT NULL,
  "upvote_count" INTEGER NULL DEFAULT 0,
  "last_viewed_at" TIMESTAMP NULL DEFAULT NULL,
  "excerpt" TEXT NULL DEFAULT NULL,
  "seo_title" TEXT NULL DEFAULT NULL,
  "seo_description" TEXT NULL DEFAULT NULL,
  "archived_at" TIMESTAMP NULL DEFAULT NULL,
  "featured" TEXT,
  "not_helpful_count" TEXT,
  KEY ("tenant_id"),
  KEY ("category_id"),
  KEY ("status"),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "category"),
  KEY ("tenant_id", "published", "published_at")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_article_relations
CREATE TABLE IF NOT EXISTS "knowledge_base_article_relations" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "article_id" VARCHAR NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" VARCHAR NOT NULL,
  "relation_type" VARCHAR(50) NOT NULL,
  "created_by" VARCHAR NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("article_id", "entity_type", "entity_id"),
  KEY ("tenant_id", "article_id"),
  KEY ("tenant_id", "entity_type", "entity_id"),
  CONSTRAINT "kb_relations_article_fk" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_article_versions
CREATE TABLE IF NOT EXISTS "knowledge_base_article_versions" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "article_id" VARCHAR NOT NULL,
  "version_number" INTEGER NOT NULL,
  "title" VARCHAR(500) NOT NULL,
  "content" TEXT NOT NULL,
  "summary" TEXT NULL DEFAULT NULL,
  "change_description" TEXT NULL DEFAULT NULL,
  "author_id" VARCHAR NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by_id" TEXT,
  PRIMARY KEY ("id"),
  UNIQUE ("article_id", "version_number"),
  KEY ("tenant_id", "article_id"),
  KEY ("tenant_id", "version_number"),
  CONSTRAINT "kb_versions_article_fk" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_attachments
CREATE TABLE IF NOT EXISTS "knowledge_base_attachments" (
  "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
  "tenant_id" VARCHAR(36) NOT NULL,
  "article_id" VARCHAR(36) NOT NULL,
  "filename" VARCHAR(255) NOT NULL,
  "original_filename" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(100) NULL DEFAULT NULL,
  "file_size" INTEGER NULL DEFAULT NULL,
  "file_path" VARCHAR(500) NOT NULL,
  "uploaded_by" VARCHAR(36) NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "file_name" TEXT NULL DEFAULT NULL,
  "file_type" TEXT NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_categories
CREATE TABLE IF NOT EXISTS "knowledge_base_categories" (
  "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
  "tenant_id" VARCHAR(36) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "parent_id" VARCHAR(36) NULL DEFAULT NULL,
  "color" VARCHAR(7) NULL DEFAULT NULL,
  "icon" VARCHAR(50) NULL DEFAULT NULL,
  "sort_order" INTEGER NULL DEFAULT 0,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ("tenant_id"),
  KEY ("parent_id"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_comments
CREATE TABLE IF NOT EXISTS "knowledge_base_comments" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "article_id" VARCHAR NOT NULL,
  "parent_id" VARCHAR NULL DEFAULT NULL,
  "content" TEXT NOT NULL,
  "author_id" VARCHAR NOT NULL,
  "author_name" VARCHAR(255) NOT NULL,
  "is_edited" BOOLEAN NOT NULL DEFAULT false,
  "is_approved" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "comment" TEXT,
  "user_id" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "article_id"),
  KEY ("tenant_id", "author_id"),
  KEY ("parent_id"),
  CONSTRAINT "kb_comments_article_fk" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "kb_comments_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "knowledge_base_comments" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_ratings
CREATE TABLE IF NOT EXISTS "knowledge_base_ratings" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "article_id" VARCHAR NOT NULL,
  "user_id" VARCHAR NOT NULL,
  "rating" INTEGER NOT NULL,
  "feedback" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "comments" TEXT,
  PRIMARY KEY ("id"),
  UNIQUE ("article_id", "user_id"),
  KEY ("tenant_id", "article_id"),
  KEY ("tenant_id", "user_id"),
  CONSTRAINT "kb_ratings_article_fk" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_scheduled_publications
CREATE TABLE IF NOT EXISTS "knowledge_base_scheduled_publications" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "article_id" VARCHAR NOT NULL,
  "scheduled_for" TIMESTAMPTZ NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  "published_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "auto_publish" BOOLEAN NOT NULL DEFAULT true,
  "notify_users" BOOLEAN NOT NULL DEFAULT false,
  "scheduled_by" VARCHAR NOT NULL,
  "execution_log" JSONB NULL DEFAULT '{}',
  "failure_reason" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id"),
  KEY ("tenant_id", "article_id"),
  KEY ("tenant_id", "status"),
  KEY ("scheduled_for"),
  CONSTRAINT "kb_scheduled_article_fk" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_search_logs
CREATE TABLE IF NOT EXISTS "knowledge_base_search_logs" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "query" TEXT NOT NULL,
  "user_id" VARCHAR NOT NULL,
  "results_count" INTEGER NULL DEFAULT 0,
  "clicked_article_id" VARCHAR NULL DEFAULT NULL,
  "search_context" JSONB NULL DEFAULT '{}',
  "user_agent" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "query"),
  KEY ("tenant_id", "user_id"),
  KEY ("tenant_id", "created_at")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.knowledge_base_templates
CREATE TABLE IF NOT EXISTS "knowledge_base_templates" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "content" TEXT NOT NULL,
  "category" VARCHAR NOT NULL,
  "fields" JSONB NULL DEFAULT '[]',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_by" VARCHAR NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "variables" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id"),
  KEY ("tenant_id", "category"),
  KEY ("tenant_id", "is_active")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.locais
CREATE TABLE IF NOT EXISTS "locais" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "nome" VARCHAR(200) NOT NULL,
  "descricao" TEXT NULL DEFAULT NULL,
  "codigo_integracao" VARCHAR(100) NULL DEFAULT NULL,
  "tipo_cliente_favorecido" VARCHAR(20) NULL DEFAULT NULL,
  "tecnico_principal_id" UUID NULL DEFAULT NULL,
  "email" VARCHAR(255) NULL DEFAULT NULL,
  "ddd" VARCHAR(3) NULL DEFAULT NULL,
  "telefone" VARCHAR(15) NULL DEFAULT NULL,
  "cep" VARCHAR(9) NULL DEFAULT NULL,
  "pais" VARCHAR(100) NULL DEFAULT 'Brasil',
  "estado" VARCHAR(100) NULL DEFAULT NULL,
  "municipio" VARCHAR(100) NULL DEFAULT NULL,
  "bairro" VARCHAR(100) NULL DEFAULT NULL,
  "tipo_logradouro" VARCHAR(50) NULL DEFAULT NULL,
  "logradouro" VARCHAR(255) NULL DEFAULT NULL,
  "numero" VARCHAR(20) NULL DEFAULT NULL,
  "complemento" VARCHAR(100) NULL DEFAULT NULL,
  "latitude" NUMERIC(10,8) NULL DEFAULT NULL,
  "longitude" NUMERIC(11,8) NULL DEFAULT NULL,
  "geo_coordenadas" JSONB NULL DEFAULT NULL,
  "fuso_horario" VARCHAR(50) NULL DEFAULT 'America/Sao_Paulo',
  "feriados_incluidos" JSONB NULL DEFAULT NULL,
  "indisponibilidades" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id"),
  KEY ("ativo"),
  KEY ("nome"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.localization_context
CREATE TABLE IF NOT EXISTS "localization_context" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "context_key" VARCHAR(100) NOT NULL,
  "context_type" VARCHAR(50) NOT NULL,
  "market_code" VARCHAR(10) NOT NULL,
  "labels" JSONB NOT NULL DEFAULT '{}',
  "placeholders" JSONB NOT NULL DEFAULT '{}',
  "help_texts" JSONB NOT NULL DEFAULT '{}',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "context_key"),
  KEY ("tenant_id", "context_key")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.locations
CREATE TABLE IF NOT EXISTS "locations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "location_type" UNKNOWN NOT NULL,
  "geometry_type" UNKNOWN NOT NULL,
  "coordinates" JSONB NOT NULL,
  "address_data" JSONB NULL DEFAULT NULL,
  "business_hours" JSONB NULL DEFAULT NULL,
  "access_requirements" JSONB NULL DEFAULT NULL,
  "sla_config" JSONB NULL DEFAULT NULL,
  "status" UNKNOWN NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "tags" UNKNOWN NULL DEFAULT NULL,
  "attachments" JSONB NULL DEFAULT '{}',
  "parent_location_id" UUID NULL DEFAULT NULL,
  "is_favorite" BOOLEAN NULL DEFAULT false,
  "type" TEXT NULL DEFAULT NULL,
  "code" TEXT NULL DEFAULT NULL,
  "address_street" TEXT NULL DEFAULT NULL,
  "address_number" TEXT NULL DEFAULT NULL,
  "address_complement" TEXT NULL DEFAULT NULL,
  "address_neighborhood" TEXT NULL DEFAULT NULL,
  "address_city" TEXT NULL DEFAULT NULL,
  "address_state" TEXT NULL DEFAULT NULL,
  "address_zip_code" TEXT NULL DEFAULT NULL,
  "latitude" TEXT NULL DEFAULT NULL,
  "longitude" TEXT NULL DEFAULT NULL,
  "address_country" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "metadata" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id"),
  KEY ("location_type"),
  KEY ("status"),
  KEY ("tags"),
  KEY ("parent_location_id"),
  KEY ("is_favorite"),
  CONSTRAINT "locations_parent_location_id_fkey" FOREIGN KEY ("parent_location_id") REFERENCES "locations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.location_areas
CREATE TABLE IF NOT EXISTS "location_areas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "location_id" UUID NOT NULL,
  "area_type" UNKNOWN NOT NULL,
  "boundary_coordinates" JSONB NOT NULL,
  "area_size_km2" NUMERIC(10,2) NULL DEFAULT NULL,
  "population_estimate" INTEGER NULL DEFAULT NULL,
  "service_level" UNKNOWN NOT NULL DEFAULT 'standard',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "location_areas_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.location_area_memberships
CREATE TABLE IF NOT EXISTS "location_area_memberships" (
  "location_id" UUID NOT NULL,
  "area_group_id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "membership_type" UNKNOWN NOT NULL DEFAULT 'primary',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("location_id", "area_group_id"),
  CONSTRAINT "location_area_memberships_area_group_id_fkey" FOREIGN KEY ("area_group_id") REFERENCES "area_groups" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "location_area_memberships_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.location_routes
CREATE TABLE IF NOT EXISTS "location_routes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "route_name" VARCHAR(200) NOT NULL,
  "route_type" UNKNOWN NOT NULL,
  "route_coordinates" JSONB NOT NULL,
  "estimated_duration_minutes" INTEGER NULL DEFAULT NULL,
  "difficulty_level" UNKNOWN NOT NULL DEFAULT 'medium',
  "required_skills" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.location_segments
CREATE TABLE IF NOT EXISTS "location_segments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "location_id" UUID NOT NULL,
  "segment_type" UNKNOWN NOT NULL,
  "start_coordinates" JSONB NOT NULL,
  "end_coordinates" JSONB NOT NULL,
  "path_coordinates" JSONB NULL DEFAULT NULL,
  "length_meters" NUMERIC(10,2) NULL DEFAULT NULL,
  "infrastructure_data" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "location_segments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.maintenance_plans
CREATE TABLE IF NOT EXISTS "maintenance_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "asset_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "trigger_type" VARCHAR(20) NOT NULL,
  "trigger_value_json" JSONB NOT NULL,
  "tasks_json" JSONB NOT NULL,
  "sla_policy" VARCHAR(255) NULL DEFAULT NULL,
  "priority" VARCHAR(20) NOT NULL,
  "estimated_duration" INTEGER NOT NULL,
  "lead_time" INTEGER NOT NULL DEFAULT 24,
  "seasonal_adjustments_json" JSONB NULL DEFAULT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "effective_from" TIMESTAMP NOT NULL,
  "effective_to" TIMESTAMP NULL DEFAULT NULL,
  "last_generated_at" TIMESTAMP NULL DEFAULT NULL,
  "next_scheduled_at" TIMESTAMP NULL DEFAULT NULL,
  "generation_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "maintenance_plans_priority_check" CHECK ((((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])))),
  CONSTRAINT "maintenance_plans_trigger_type_check" CHECK ((((trigger_type)::text = ANY ((ARRAY['time'::character varying, 'usage'::character varying, 'condition'::character varying, 'calendar'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.market_localization
CREATE TABLE IF NOT EXISTS "market_localization" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "market_code" VARCHAR(10) NOT NULL,
  "country_code" VARCHAR(2) NOT NULL,
  "language_code" VARCHAR(10) NOT NULL,
  "currency_code" VARCHAR(3) NOT NULL,
  "legal_field_mappings" JSONB NOT NULL DEFAULT '{}',
  "validation_rules" JSONB NOT NULL DEFAULT '{}',
  "display_config" JSONB NOT NULL DEFAULT '{}',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "market_code"),
  KEY ("tenant_id", "is_active"),
  KEY ("tenant_id", "market_code")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.notification_templates
CREATE TABLE IF NOT EXISTS "notification_templates" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "subject_template" VARCHAR(255) NULL DEFAULT NULL,
  "body_template" TEXT NULL DEFAULT NULL,
  "type" UNKNOWN NULL DEFAULT NULL,
  "channel" UNKNOWN NULL DEFAULT NULL,
  "variables" JSONB NULL DEFAULT '[]',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.nsr_sequences
CREATE TABLE IF NOT EXISTS "nsr_sequences" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "current_nsr" INTEGER NOT NULL DEFAULT 0,
  "last_reset" TIMESTAMP NULL DEFAULT NULL,
  "reset_period" VARCHAR(20) NULL DEFAULT 'yearly',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.offline_sync
CREATE TABLE IF NOT EXISTS "offline_sync" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "device_id" VARCHAR(255) NOT NULL,
  "user_id" UUID NOT NULL,
  "table_name" VARCHAR(100) NOT NULL,
  "operation" VARCHAR(20) NOT NULL,
  "entity_id" UUID NOT NULL,
  "entity_data" JSONB NOT NULL,
  "conflict_resolution" VARCHAR(30) NULL DEFAULT 'SERVER_WINS',
  "sync_status" VARCHAR(20) NULL DEFAULT 'PENDING',
  "offline_timestamp" TIMESTAMP NOT NULL,
  "sync_timestamp" TIMESTAMP NULL DEFAULT NULL,
  "conflict_data" JSONB NULL DEFAULT NULL,
  "error_message" TEXT NULL DEFAULT NULL,
  "retry_count" INTEGER NULL DEFAULT 0,
  "max_retries" INTEGER NULL DEFAULT 5,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "offline_sync_conflict_resolution_check" CHECK ((((conflict_resolution)::text = ANY ((ARRAY['SERVER_WINS'::character varying, 'CLIENT_WINS'::character varying, 'MANUAL_REVIEW'::character varying])::text[])))),
  CONSTRAINT "offline_sync_operation_check" CHECK ((((operation)::text = ANY ((ARRAY['CREATE'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))),
  CONSTRAINT "offline_sync_sync_status_check" CHECK ((((sync_status)::text = ANY ((ARRAY['PENDING'::character varying, 'SYNCED'::character varying, 'CONFLICT'::character varying, 'ERROR'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.omnibridge_automation_rules
CREATE TABLE IF NOT EXISTS "omnibridge_automation_rules" (
  "id" VARCHAR(36) NOT NULL,
  "tenant_id" VARCHAR(36) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "trigger" JSONB NOT NULL,
  "actions" JSONB NOT NULL DEFAULT '[]',
  "enabled" BOOLEAN NULL DEFAULT true,
  "priority" INTEGER NULL DEFAULT 1,
  "ai_enabled" BOOLEAN NULL DEFAULT false,
  "ai_prompt_id" VARCHAR(36) NULL DEFAULT NULL,
  "execution_count" INTEGER NULL DEFAULT 0,
  "success_count" INTEGER NULL DEFAULT 0,
  "last_executed" TIMESTAMP NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.omnibridge_channels
CREATE TABLE IF NOT EXISTS "omnibridge_channels" (
  "id" VARCHAR(36) NOT NULL,
  "tenant_id" VARCHAR(36) NOT NULL,
  "integration_id" VARCHAR(100) NULL DEFAULT NULL,
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'inactive',
  "config" JSONB NULL DEFAULT '{}',
  "features" JSONB NULL DEFAULT '[]',
  "description" TEXT NULL DEFAULT NULL,
  "icon" VARCHAR(50) NULL DEFAULT NULL,
  "last_sync" TIMESTAMP NULL DEFAULT NULL,
  "metrics" JSONB NULL DEFAULT '{}',
  "metadata" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.omnibridge_chatbots
CREATE TABLE IF NOT EXISTS "omnibridge_chatbots" (
  "id" VARCHAR(36) NOT NULL,
  "tenant_id" VARCHAR(36) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "configuration" JSONB NULL DEFAULT '{}',
  "is_enabled" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" VARCHAR(36) NULL DEFAULT NULL,
  "updated_by" VARCHAR(36) NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.omnibridge_messages
CREATE TABLE IF NOT EXISTS "omnibridge_messages" (
  "id" VARCHAR(36) NOT NULL,
  "tenant_id" VARCHAR(36) NOT NULL,
  "channel_id" VARCHAR(36) NOT NULL,
  "channel_type" VARCHAR(50) NOT NULL,
  "from_address" TEXT NULL DEFAULT NULL,
  "to_address" TEXT NULL DEFAULT NULL,
  "subject" TEXT NULL DEFAULT NULL,
  "content" TEXT NULL DEFAULT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
  "status" VARCHAR(20) NOT NULL DEFAULT 'unread',
  "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "tags" JSONB NULL DEFAULT '[]',
  "attachments" INTEGER NULL DEFAULT 0,
  "metadata" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.omnibridge_rules
CREATE TABLE IF NOT EXISTS "omnibridge_rules" (
  "id" VARCHAR(36) NOT NULL,
  "tenant_id" VARCHAR(36) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "conditions" JSONB NOT NULL,
  "actions" JSONB NOT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "priority" INTEGER NULL DEFAULT 0,
  "execution_count" INTEGER NULL DEFAULT 0,
  "success_count" INTEGER NULL DEFAULT 0,
  "last_executed" TIMESTAMP NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  KEY ("tenant_id"),
  KEY ("is_enabled"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.omnibridge_settings
CREATE TABLE IF NOT EXISTS "omnibridge_settings" (
  "id" VARCHAR(36) NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" VARCHAR(36) NOT NULL,
  "channels" JSONB NOT NULL DEFAULT '[]',
  "filters" JSONB NOT NULL DEFAULT '{}',
  "search" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.physical_inventories
CREATE TABLE IF NOT EXISTS "physical_inventories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "inventory_number" VARCHAR(50) NOT NULL,
  "location_id" UUID NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'planned',
  "planned_date" TIMESTAMP NOT NULL,
  "start_date" TIMESTAMP NULL DEFAULT NULL,
  "completed_date" TIMESTAMP NULL DEFAULT NULL,
  "responsible_user_id" UUID NOT NULL,
  "approved_by" UUID NULL DEFAULT NULL,
  "approved_at" TIMESTAMP NULL DEFAULT NULL,
  "total_items_planned" INTEGER NULL DEFAULT 0,
  "total_items_counted" INTEGER NULL DEFAULT 0,
  "total_discrepancies" INTEGER NULL DEFAULT 0,
  "notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "inventory_number")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.price_lists
CREATE TABLE IF NOT EXISTS "price_lists" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "version" VARCHAR(20) NOT NULL,
  "customer_id" UUID NULL DEFAULT NULL,
  "customer_company_id" UUID NULL DEFAULT NULL,
  "contract_id" UUID NULL DEFAULT NULL,
  "cost_center_id" UUID NULL DEFAULT NULL,
  "valid_from" TIMESTAMP NOT NULL,
  "valid_to" TIMESTAMP NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "currency" VARCHAR(3) NULL DEFAULT 'BRL',
  "automatic_margin" NUMERIC(5,2) NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NULL DEFAULT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  "list_code" VARCHAR(50) NULL DEFAULT 'DEFAULT',
  "created_by_id" UUID NULL DEFAULT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "valid_until" TEXT NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "is_active"),
  KEY ("tenant_id", "code"),
  KEY ("tenant_id", "customer_id", "is_active")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.price_list_items
CREATE TABLE IF NOT EXISTS "price_list_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "price_list_id" UUID NOT NULL,
  "item_id" UUID NULL DEFAULT NULL,
  "service_type_id" UUID NULL DEFAULT NULL,
  "unit_price" NUMERIC(10,2) NOT NULL,
  "special_price" NUMERIC(10,2) NULL DEFAULT NULL,
  "scale_discounts" JSONB NULL DEFAULT NULL,
  "hourly_rate" NUMERIC(10,2) NULL DEFAULT NULL,
  "travel_cost" NUMERIC(10,2) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "discount_percentage" TEXT,
  "markup_percentage" TEXT,
  "minimum_quantity" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "price_list_id"),
  KEY ("price_list_id"),
  KEY ("tenant_id", "price_list_id", "item_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.price_list_versions
CREATE TABLE IF NOT EXISTS "price_list_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "price_list_id" UUID NOT NULL,
  "version" VARCHAR(20) NOT NULL,
  "is_current" BOOLEAN NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.price_tables
CREATE TABLE IF NOT EXISTS "price_tables" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "table_code" VARCHAR(20) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "customer_segment" VARCHAR(50) NULL DEFAULT NULL,
  "region" VARCHAR(50) NULL DEFAULT NULL,
  "sales_channel" VARCHAR(50) NULL DEFAULT NULL,
  "version" VARCHAR(10) NOT NULL DEFAULT '1.0',
  "effective_date" DATE NOT NULL,
  "expiry_date" DATE NULL DEFAULT NULL,
  "default_margin_percentage" NUMERIC(5,2) NULL DEFAULT 0,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("table_code")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.pricing_rules
CREATE TABLE IF NOT EXISTS "pricing_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "rule_type" VARCHAR(50) NOT NULL,
  "conditions" JSONB NULL DEFAULT NULL,
  "actions" JSONB NULL DEFAULT NULL,
  "priority" INTEGER NULL DEFAULT 1,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "is_active", "priority")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.project_timeline
CREATE TABLE IF NOT EXISTS "project_timeline" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "event_type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "action_id" UUID NULL DEFAULT NULL,
  "related_entity_id" UUID NULL DEFAULT NULL,
  "related_entity_type" VARCHAR(50) NULL DEFAULT NULL,
  "old_value" TEXT NULL DEFAULT NULL,
  "new_value" TEXT NULL DEFAULT NULL,
  "metadata" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "created_by" UUID NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "project_timeline_tenant_id_check" CHECK ((((tenant_id)::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'::text)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.quality_certifications
CREATE TABLE IF NOT EXISTS "quality_certifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "item_type" VARCHAR(20) NOT NULL,
  "item_id" UUID NOT NULL,
  "certification_name" VARCHAR(100) NOT NULL,
  "certification_number" VARCHAR(50) NULL DEFAULT NULL,
  "issuer" VARCHAR(100) NULL DEFAULT NULL,
  "issue_date" DATE NULL DEFAULT NULL,
  "expiry_date" DATE NULL DEFAULT NULL,
  "document_url" TEXT NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "chk_quality_cert_item_type" CHECK ((((item_type)::text = ANY ((ARRAY['user'::character varying, 'equipment'::character varying, 'facility'::character varying, 'process'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.quotations
CREATE TABLE IF NOT EXISTS "quotations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "quotation_number" VARCHAR(100) NOT NULL,
  "supplier_id" UUID NULL DEFAULT NULL,
  "status" VARCHAR(50) NULL DEFAULT 'draft',
  "requested_date" TIMESTAMP NULL DEFAULT now(),
  "response_date" TIMESTAMP NULL DEFAULT NULL,
  "valid_until" TIMESTAMP NULL DEFAULT NULL,
  "total_value" NUMERIC(15,2) NULL DEFAULT NULL,
  "currency" VARCHAR(3) NULL DEFAULT 'BRL',
  "notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "created_by_id" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.recall_notices
CREATE TABLE IF NOT EXISTS "recall_notices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "recall_number" VARCHAR(50) NOT NULL,
  "part_id" UUID NOT NULL,
  "recall_reason" TEXT NOT NULL,
  "severity_level" VARCHAR(20) NULL DEFAULT 'medium',
  "affected_lot_numbers" UNKNOWN NULL DEFAULT NULL,
  "affected_serial_numbers" UNKNOWN NULL DEFAULT NULL,
  "recall_date" DATE NOT NULL,
  "notification_date" DATE NULL DEFAULT NULL,
  "resolution_deadline" DATE NULL DEFAULT NULL,
  "recommended_action" TEXT NULL DEFAULT NULL,
  "replacement_part_id" UUID NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("recall_number")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.regioes
CREATE TABLE IF NOT EXISTS "regioes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "nome" VARCHAR(200) NOT NULL,
  "descricao" TEXT NULL DEFAULT NULL,
  "codigo_integracao" VARCHAR(100) NULL DEFAULT NULL,
  "clientes_vinculados" JSONB NULL DEFAULT NULL,
  "tecnico_principal_id" UUID NULL DEFAULT NULL,
  "grupos_vinculados" JSONB NULL DEFAULT NULL,
  "locais_atendimento" JSONB NULL DEFAULT NULL,
  "latitude" NUMERIC(10,8) NULL DEFAULT NULL,
  "longitude" NUMERIC(11,8) NULL DEFAULT NULL,
  "ceps_abrangidos" JSONB NULL DEFAULT NULL,
  "cep" VARCHAR(9) NULL DEFAULT NULL,
  "pais" VARCHAR(100) NULL DEFAULT 'Brasil',
  "estado" VARCHAR(100) NULL DEFAULT NULL,
  "municipio" VARCHAR(100) NULL DEFAULT NULL,
  "bairro" VARCHAR(100) NULL DEFAULT NULL,
  "tipo_logradouro" VARCHAR(50) NULL DEFAULT NULL,
  "logradouro" VARCHAR(255) NULL DEFAULT NULL,
  "numero" VARCHAR(20) NULL DEFAULT NULL,
  "complemento" VARCHAR(100) NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id"),
  KEY ("ativo"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.reports
CREATE TABLE IF NOT EXISTS "reports" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "query_definition" JSONB NULL DEFAULT '{}',
  "visualization_config" JSONB NULL DEFAULT '{}',
  "parameters" JSONB NULL DEFAULT '{}',
  "schedule" JSONB NULL DEFAULT '{}',
  "is_public" BOOLEAN NULL DEFAULT false,
  "created_by_id" UUID NULL DEFAULT NULL,
  "updated_by_id" UUID NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.returns
CREATE TABLE IF NOT EXISTS "returns" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "return_number" VARCHAR(50) NOT NULL,
  "original_transfer_id" UUID NULL DEFAULT NULL,
  "return_type" VARCHAR(30) NOT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'INITIATED',
  "reason" TEXT NOT NULL,
  "return_date" DATE NOT NULL,
  "approved_by" UUID NULL DEFAULT NULL,
  "approved_at" TIMESTAMP NULL DEFAULT NULL,
  "restocking_fee" NUMERIC(10,2) NULL DEFAULT 0,
  "refund_amount" NUMERIC(10,2) NULL DEFAULT NULL,
  "disposition" VARCHAR(50) NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("return_number"),
  CONSTRAINT "returns_original_transfer_id_fkey" FOREIGN KEY ("original_transfer_id") REFERENCES "transfers" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "returns_disposition_check" CHECK ((((disposition)::text = ANY ((ARRAY['RESTOCK'::character varying, 'SCRAP'::character varying, 'REPAIR'::character varying, 'VENDOR_RETURN'::character varying])::text[])))),
  CONSTRAINT "returns_return_type_check" CHECK ((((return_type)::text = ANY ((ARRAY['DEFECTIVE'::character varying, 'EXCESS'::character varying, 'WRONG_ITEM'::character varying, 'CUSTOMER_RETURN'::character varying, 'EXPIRED'::character varying])::text[])))),
  CONSTRAINT "returns_status_check" CHECK ((((status)::text = ANY ((ARRAY['INITIATED'::character varying, 'APPROVED'::character varying, 'IN_TRANSIT'::character varying, 'COMPLETED'::character varying, 'REJECTED'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.roles
CREATE TABLE IF NOT EXISTS "roles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "permissions" UNKNOWN NOT NULL DEFAULT '{}',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "user_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.rotas_dinamicas
CREATE TABLE IF NOT EXISTS "rotas_dinamicas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "nome_rota" VARCHAR(100) NOT NULL,
  "id_rota" VARCHAR(100) NOT NULL,
  "descricao" TEXT NULL DEFAULT NULL,
  "codigo_integracao" VARCHAR(100) NULL DEFAULT NULL,
  "locais_vinculados" JSONB NULL DEFAULT NULL,
  "tecnico_principal_id" UUID NULL DEFAULT NULL,
  "grupos_vinculados" JSONB NULL DEFAULT NULL,
  "previsao_dias" INTEGER NULL DEFAULT NULL,
  "planejamento_rotas" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.rotas_trecho
CREATE TABLE IF NOT EXISTS "rotas_trecho" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "nome" VARCHAR(200) NOT NULL,
  "id_rota" VARCHAR(100) NOT NULL,
  "descricao" TEXT NULL DEFAULT NULL,
  "codigo_integracao" VARCHAR(100) NULL DEFAULT NULL,
  "definicao_trecho" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.schedules
CREATE TABLE IF NOT EXISTS "schedules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "customer_id" UUID NULL DEFAULT NULL,
  "activity_type_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "start_datetime" TIMESTAMP NOT NULL,
  "end_datetime" TIMESTAMP NOT NULL,
  "duration" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "location_address" TEXT NULL DEFAULT NULL,
  "coordinates" JSONB NULL DEFAULT NULL,
  "internal_notes" TEXT NULL DEFAULT NULL,
  "client_notes" TEXT NULL DEFAULT NULL,
  "estimated_travel_time" INTEGER NULL DEFAULT NULL,
  "actual_start_time" TIMESTAMP NULL DEFAULT NULL,
  "actual_end_time" TIMESTAMP NULL DEFAULT NULL,
  "is_recurring" BOOLEAN NULL DEFAULT false,
  "recurring_pattern" JSONB NULL DEFAULT NULL,
  "parent_schedule_id" UUID NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "type" VARCHAR(20) NOT NULL DEFAULT 'planned',
  PRIMARY KEY ("id"),
  CONSTRAINT "schedules_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.schedule_conflicts
CREATE TABLE IF NOT EXISTS "schedule_conflicts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "schedule_id" UUID NOT NULL,
  "conflict_with_schedule_id" UUID NULL DEFAULT NULL,
  "conflict_type" VARCHAR(50) NOT NULL,
  "conflict_details" JSONB NULL DEFAULT NULL,
  "severity" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "is_resolved" BOOLEAN NULL DEFAULT false,
  "resolution_notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "resolved_at" TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "schedule_conflicts_conflict_with_schedule_id_fkey" FOREIGN KEY ("conflict_with_schedule_id") REFERENCES "schedules" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "schedule_conflicts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.schedule_notifications
CREATE TABLE IF NOT EXISTS "schedule_notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" VARCHAR(36) NOT NULL,
  "notification_type" VARCHAR(30) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "message" TEXT NOT NULL,
  "priority" VARCHAR(10) NULL DEFAULT 'medium',
  "scheduled_for" TIMESTAMP NULL DEFAULT NULL,
  "sent_at" TIMESTAMP NULL DEFAULT NULL,
  "read_at" TIMESTAMP NULL DEFAULT NULL,
  "related_entity_type" VARCHAR(30) NULL DEFAULT NULL,
  "related_entity_id" VARCHAR(36) NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'pending',
  "delivery_method" VARCHAR(20) NULL DEFAULT 'in_app',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "description" TEXT NULL DEFAULT NULL,
  "scheduled_date" TIMESTAMP NULL DEFAULT NULL,
  "type" TEXT NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "metadata" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "user_id"),
  CONSTRAINT "schedule_notifications_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.schedule_templates
CREATE TABLE IF NOT EXISTS "schedule_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "category" VARCHAR(30) NOT NULL,
  "schedule_type" VARCHAR(20) NOT NULL,
  "rotation_cycle_days" INTEGER NULL DEFAULT NULL,
  "configuration" JSONB NULL DEFAULT '{}',
  "is_active" BOOLEAN NULL DEFAULT true,
  "requires_approval" BOOLEAN NULL DEFAULT true,
  "created_by" VARCHAR(36) NOT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "is_active"),
  CONSTRAINT "schedule_templates_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.service_integrations
CREATE TABLE IF NOT EXISTS "service_integrations" (
  "id" TEXT NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "category" TEXT NULL DEFAULT 'Comunicação',
  "icon" TEXT NULL DEFAULT 'Settings',
  "status" TEXT NULL DEFAULT 'disconnected',
  "enabled" BOOLEAN NULL DEFAULT false,
  "config" JSONB NULL DEFAULT '{}',
  "features" UNKNOWN NULL DEFAULT ARRAY[]::text[],
  "is_currently_monitoring" BOOLEAN NULL DEFAULT false,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.shift_swap_requests
CREATE TABLE IF NOT EXISTS "shift_swap_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "requester_id" VARCHAR(36) NOT NULL,
  "target_user_id" VARCHAR(36) NULL DEFAULT NULL,
  "original_shift_date" TIMESTAMP NOT NULL,
  "original_shift_start" TIMESTAMP NOT NULL,
  "original_shift_end" TIMESTAMP NOT NULL,
  "swap_shift_date" TIMESTAMP NULL DEFAULT NULL,
  "swap_shift_start" TIMESTAMP NULL DEFAULT NULL,
  "swap_shift_end" TIMESTAMP NULL DEFAULT NULL,
  "swap_type" VARCHAR(20) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'pending',
  "target_user_response" VARCHAR(20) NULL DEFAULT NULL,
  "target_user_response_at" TIMESTAMP NULL DEFAULT NULL,
  "manager_approval_required" BOOLEAN NULL DEFAULT true,
  "approved_by" VARCHAR(36) NULL DEFAULT NULL,
  "approved_at" TIMESTAMP NULL DEFAULT NULL,
  "approval_notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "status"),
  CONSTRAINT "shift_swap_requests_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.skills
CREATE TABLE IF NOT EXISTS "skills" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" VARCHAR(36) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "certification_suggested" VARCHAR(255) NULL DEFAULT NULL,
  "validity_months" INTEGER NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "is_active" BOOLEAN NULL DEFAULT true,
  "suggested_certification" VARCHAR(255) NULL DEFAULT NULL,
  "certification_validity_months" INTEGER NULL DEFAULT NULL,
  "observations" TEXT NULL DEFAULT NULL,
  "scale_options" JSONB NULL DEFAULT '[]',
  "updated_by" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "name"),
  KEY ("tenant_id", "name"),
  KEY ("tenant_id", "category"),
  CONSTRAINT "skills_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.sla_definitions
CREATE TABLE IF NOT EXISTS "sla_definitions" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "type" VARCHAR(20) NOT NULL DEFAULT 'SLA',
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "priority" VARCHAR(20) NULL DEFAULT 'medium',
  "valid_from" TIMESTAMPTZ NOT NULL,
  "valid_until" TIMESTAMPTZ NULL DEFAULT NULL,
  "application_rules" JSONB NOT NULL,
  "response_time_minutes" INTEGER NULL DEFAULT NULL,
  "resolution_time_minutes" INTEGER NULL DEFAULT NULL,
  "update_time_minutes" INTEGER NULL DEFAULT NULL,
  "idle_time_minutes" INTEGER NULL DEFAULT NULL,
  "business_hours_only" BOOLEAN NULL DEFAULT true,
  "working_days" JSONB NULL DEFAULT '[1, 2, 3, 4, 5]',
  "working_hours" JSONB NULL DEFAULT '{"end": "18:00", "start": "08:00"}',
  "timezone" VARCHAR(100) NULL DEFAULT 'America/Sao_Paulo',
  "escalation_enabled" BOOLEAN NULL DEFAULT false,
  "escalation_threshold_percent" INTEGER NULL DEFAULT 80,
  "escalation_actions" JSONB NULL DEFAULT '[]',
  "pause_conditions" JSONB NULL DEFAULT '[]',
  "resume_conditions" JSONB NULL DEFAULT '[]',
  "stop_conditions" JSONB NULL DEFAULT '[]',
  "workflow_actions" JSONB NULL DEFAULT '[]',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_by" VARCHAR NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "name"),
  KEY ("tenant_id"),
  KEY ("tenant_id", "status"),
  KEY ("tenant_id", "type")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.sla_events
CREATE TABLE IF NOT EXISTS "sla_events" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "sla_instance_id" VARCHAR NOT NULL,
  "ticket_id" VARCHAR NOT NULL,
  "event_type" VARCHAR(50) NOT NULL,
  "event_reason" VARCHAR(100) NULL DEFAULT NULL,
  "previous_status" VARCHAR(20) NULL DEFAULT NULL,
  "new_status" VARCHAR(20) NULL DEFAULT NULL,
  "elapsed_minutes_at_event" INTEGER NULL DEFAULT 0,
  "remaining_minutes_at_event" INTEGER NULL DEFAULT 0,
  "triggered_by" VARCHAR(50) NULL DEFAULT NULL,
  "triggered_by_user_id" VARCHAR NULL DEFAULT NULL,
  "trigger_condition" TEXT NULL DEFAULT NULL,
  "event_data" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id"),
  KEY ("tenant_id", "sla_instance_id"),
  KEY ("tenant_id", "ticket_id"),
  KEY ("tenant_id", "event_type"),
  KEY ("created_at")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.sla_instances
CREATE TABLE IF NOT EXISTS "sla_instances" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "sla_definition_id" VARCHAR NOT NULL,
  "ticket_id" VARCHAR NOT NULL,
  "started_at" TIMESTAMPTZ NOT NULL,
  "paused_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "resumed_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "completed_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "violated_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "status" VARCHAR(20) NOT NULL,
  "current_metric" VARCHAR(20) NOT NULL,
  "elapsed_minutes" INTEGER NULL DEFAULT 0,
  "paused_minutes" INTEGER NULL DEFAULT 0,
  "target_minutes" INTEGER NOT NULL,
  "remaining_minutes" INTEGER NOT NULL,
  "response_time_minutes" INTEGER NULL DEFAULT NULL,
  "resolution_time_minutes" INTEGER NULL DEFAULT NULL,
  "idle_time_minutes" INTEGER NULL DEFAULT 0,
  "is_breached" BOOLEAN NULL DEFAULT false,
  "breach_duration_minutes" INTEGER NULL DEFAULT 0,
  "breach_percentage" REAL NULL DEFAULT 0,
  "last_activity_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "last_agent_activity_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "last_customer_activity_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "escalation_level" INTEGER NULL DEFAULT 0,
  "escalated_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "escalated_to" VARCHAR NULL DEFAULT NULL,
  "automation_triggered" BOOLEAN NULL DEFAULT false,
  "automation_actions" JSONB NULL DEFAULT '[]',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("ticket_id", "current_metric"),
  KEY ("tenant_id"),
  KEY ("tenant_id", "ticket_id"),
  KEY ("tenant_id", "sla_definition_id"),
  KEY ("tenant_id", "status"),
  KEY ("tenant_id", "is_breached"),
  KEY ("tenant_id", "current_metric")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.sla_reports
CREATE TABLE IF NOT EXISTS "sla_reports" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "report_type" VARCHAR(50) NOT NULL,
  "report_period" VARCHAR(50) NOT NULL,
  "generated_at" TIMESTAMPTZ NOT NULL,
  "total_tickets" INTEGER NULL DEFAULT 0,
  "sla_met_tickets" INTEGER NULL DEFAULT 0,
  "sla_violated_tickets" INTEGER NULL DEFAULT 0,
  "sla_compliance_percentage" REAL NULL DEFAULT 0,
  "avg_response_time_minutes" REAL NULL DEFAULT 0,
  "avg_resolution_time_minutes" REAL NULL DEFAULT 0,
  "avg_idle_time_minutes" REAL NULL DEFAULT 0,
  "total_escalations" INTEGER NULL DEFAULT 0,
  "escalation_rate" REAL NULL DEFAULT 0,
  "sla_metrics" JSONB NULL DEFAULT '{}',
  "trend_data" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "report_type", "report_period"),
  KEY ("tenant_id"),
  KEY ("tenant_id", "report_type"),
  KEY ("tenant_id", "report_period")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.sla_violations
CREATE TABLE IF NOT EXISTS "sla_violations" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "sla_instance_id" VARCHAR NOT NULL,
  "ticket_id" VARCHAR NOT NULL,
  "sla_definition_id" VARCHAR NOT NULL,
  "violation_type" VARCHAR(50) NOT NULL,
  "target_minutes" INTEGER NOT NULL,
  "actual_minutes" INTEGER NOT NULL,
  "violation_minutes" INTEGER NOT NULL,
  "violation_percentage" REAL NOT NULL,
  "severity_level" VARCHAR(20) NULL DEFAULT 'medium',
  "business_impact" TEXT NULL DEFAULT NULL,
  "acknowledged" BOOLEAN NULL DEFAULT false,
  "acknowledged_by" VARCHAR NULL DEFAULT NULL,
  "acknowledged_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "resolved" BOOLEAN NULL DEFAULT false,
  "resolved_by" VARCHAR NULL DEFAULT NULL,
  "resolved_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "resolution_notes" TEXT NULL DEFAULT NULL,
  "root_cause" TEXT NULL DEFAULT NULL,
  "preventive_actions" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id"),
  KEY ("tenant_id", "ticket_id"),
  KEY ("tenant_id", "sla_definition_id"),
  KEY ("tenant_id", "violation_type"),
  KEY ("tenant_id", "severity_level"),
  KEY ("created_at")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.sla_workflows
CREATE TABLE IF NOT EXISTS "sla_workflows" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "triggers" JSONB NOT NULL,
  "actions" JSONB NOT NULL,
  "metadata" JSONB NULL DEFAULT '{}',
  "created_by" VARCHAR NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("tenant_id", "name"),
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "name"),
  KEY ("tenant_id"),
  KEY ("tenant_id", "is_active")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.sla_workflow_executions
CREATE TABLE IF NOT EXISTS "sla_workflow_executions" (
  "id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "workflow_id" VARCHAR NOT NULL,
  "tenant_id" VARCHAR NOT NULL,
  "triggered_by" VARCHAR(255) NOT NULL,
  "triggered_at" TIMESTAMPTZ NOT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'pending',
  "context" JSONB NOT NULL,
  "executed_actions" JSONB NULL DEFAULT '[]',
  "error" TEXT NULL DEFAULT NULL,
  "completed_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY ("tenant_id"),
  KEY ("workflow_id"),
  KEY ("tenant_id", "status"),
  KEY ("triggered_at")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.stock_levels
CREATE TABLE IF NOT EXISTS "stock_levels" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "location_id" UUID NOT NULL,
  "quantity_available" NUMERIC(10,2) NULL DEFAULT 0,
  "quantity_reserved" NUMERIC(10,2) NULL DEFAULT 0,
  "quantity_on_order" NUMERIC(10,2) NULL DEFAULT 0,
  "last_updated" TIMESTAMP NULL DEFAULT now(),
  "created_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "stock_levels_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "stock_levels_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.stock_locations
CREATE TABLE IF NOT EXISTS "stock_locations" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(50) NULL DEFAULT NULL,
  "type" VARCHAR(50) NULL DEFAULT NULL,
  "parent_location_id" UUID NULL DEFAULT NULL,
  "address" JSONB NULL DEFAULT '{}',
  "is_active" BOOLEAN NULL DEFAULT true,
  "metadata" JSONB NULL DEFAULT '{}',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "stock_locations_parent_location_id_fkey" FOREIGN KEY ("parent_location_id") REFERENCES "stock_locations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.stock_movements
CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "location_id" UUID NOT NULL,
  "movement_type" UNKNOWN NOT NULL,
  "quantity" NUMERIC(10,2) NOT NULL,
  "unit_cost" NUMERIC(10,2) NULL DEFAULT NULL,
  "reference_id" UUID NULL DEFAULT NULL,
  "reference_type" VARCHAR(50) NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "performed_by" UUID NULL DEFAULT NULL,
  "performed_at" TIMESTAMP NULL DEFAULT now(),
  "created_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "stock_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "stock_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "cnpj_cpf" VARCHAR(20) NULL DEFAULT NULL,
  "email" VARCHAR(255) NULL DEFAULT NULL,
  "phone" VARCHAR(20) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "cnpj" TEXT NULL DEFAULT NULL,
  "contact_person" TEXT NULL DEFAULT NULL,
  "rating" TEXT NULL DEFAULT NULL,
  "payment_terms" TEXT NULL DEFAULT NULL,
  "address" TEXT,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.supplier_item_links
CREATE TABLE IF NOT EXISTS "supplier_item_links" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "supplier_id" UUID NOT NULL,
  "part_number" VARCHAR(100) NULL DEFAULT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "qr_code" VARCHAR(255) NULL DEFAULT NULL,
  "barcode" VARCHAR(255) NULL DEFAULT NULL,
  "unit_price" NUMERIC(10,2) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "created_by" UUID NULL DEFAULT NULL,
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "updated_by" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY ("tenant_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.system_settings
CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "setting_key" VARCHAR(255) NOT NULL,
  "setting_value" TEXT NOT NULL,
  "setting_type" VARCHAR(50) NULL DEFAULT 'string',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "setting_key")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.tickets
CREATE TABLE IF NOT EXISTS "tickets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" VARCHAR(36) NOT NULL,
  "number" VARCHAR(50) NULL DEFAULT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "status" VARCHAR(100) NOT NULL DEFAULT 'open',
  "priority" VARCHAR(20) NULL DEFAULT 'medium',
  "category" VARCHAR(100) NULL DEFAULT NULL,
  "subcategory" VARCHAR(100) NULL DEFAULT NULL,
  "impact" VARCHAR(20) NULL DEFAULT 'low',
  "urgency" VARCHAR(20) NULL DEFAULT 'low',
  "state" VARCHAR(50) NULL DEFAULT 'new',
  "customer_id" UUID NULL DEFAULT NULL,
  "caller_id" UUID NULL DEFAULT NULL,
  "opened_by_id" UUID NULL DEFAULT NULL,
  "assigned_to_id" UUID NULL DEFAULT NULL,
  "assignment_group" VARCHAR(100) NULL DEFAULT NULL,
  "business_impact" TEXT NULL DEFAULT NULL,
  "symptoms" TEXT NULL DEFAULT NULL,
  "root_cause" TEXT NULL DEFAULT NULL,
  "workaround" TEXT NULL DEFAULT NULL,
  "contact_type" VARCHAR(50) NULL DEFAULT NULL,
  "notify" BOOLEAN NULL DEFAULT true,
  "opened_at" TIMESTAMP NULL DEFAULT now(),
  "resolved_at" TIMESTAMP NULL DEFAULT NULL,
  "closed_at" TIMESTAMP NULL DEFAULT NULL,
  "resolution_code" VARCHAR(100) NULL DEFAULT NULL,
  "resolution_notes" TEXT NULL DEFAULT NULL,
  "close_notes" TEXT NULL DEFAULT NULL,
  "work_notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "parent_ticket_id" UUID NULL DEFAULT NULL,
  "location" VARCHAR(255) NULL DEFAULT NULL,
  "due_date" TIMESTAMP NULL DEFAULT NULL,
  "trigger_date" TIMESTAMP NULL DEFAULT NULL,
  "original_due_date" TIMESTAMP NULL DEFAULT NULL,
  "resolution_date" TIMESTAMP NULL DEFAULT NULL,
  "closed_date" TIMESTAMP NULL DEFAULT NULL,
  "days_in_status" VARCHAR(10) NULL DEFAULT NULL,
  "environment" VARCHAR(100) NULL DEFAULT NULL,
  "template_name" VARCHAR(100) NULL DEFAULT NULL,
  "template_alternative" VARCHAR(100) NULL DEFAULT NULL,
  "caller_name_responsible" VARCHAR(255) NULL DEFAULT NULL,
  "call_url" TEXT NULL DEFAULT NULL,
  "environment_error" TEXT NULL DEFAULT NULL,
  "call_number" VARCHAR(50) NULL DEFAULT NULL,
  "service_version" VARCHAR(50) NULL DEFAULT NULL,
  "summary" TEXT NULL DEFAULT NULL,
  "responsible_team" VARCHAR(100) NULL DEFAULT NULL,
  "group_field" VARCHAR(100) NULL DEFAULT NULL,
  "infrastructure" VARCHAR(100) NULL DEFAULT NULL,
  "environment_publication" VARCHAR(100) NULL DEFAULT NULL,
  "publication_priority" VARCHAR(50) NULL DEFAULT NULL,
  "close_to_publish" BOOLEAN NULL DEFAULT false,
  "related_project_id" UUID NULL DEFAULT NULL,
  "related_action_id" UUID NULL DEFAULT NULL,
  "action_conversion_data" JSONB NULL DEFAULT '{}',
  "call_type" VARCHAR(50) NULL DEFAULT NULL,
  "beneficiary_id" UUID NULL DEFAULT NULL,
  "location_id" UUID NULL DEFAULT NULL,
  "caller_type" VARCHAR(20) NULL DEFAULT 'customer',
  "beneficiary_type" VARCHAR(20) NULL DEFAULT 'customer',
  "followers" UNKNOWN NULL DEFAULT ARRAY[]::text[],
  "cost_center" VARCHAR(100) NULL DEFAULT NULL,
  "company_id" UUID NULL DEFAULT NULL,
  "action" VARCHAR(100) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "link_ticket_number" VARCHAR(255) NULL DEFAULT NULL,
  "link_type" VARCHAR(50) NULL DEFAULT NULL,
  "link_comment" TEXT NULL DEFAULT NULL,
  "created_by" UUID NULL DEFAULT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  "ticket_number" TEXT NULL DEFAULT NULL,
  "title" TEXT NULL DEFAULT NULL,
  "assigned_to" TEXT NULL DEFAULT NULL,
  "estimated_hours" TEXT NULL DEFAULT NULL,
  "actual_hours" TEXT NULL DEFAULT NULL,
  "satisfaction_rating" TEXT NULL DEFAULT NULL,
  "satisfaction_comment" TEXT NULL DEFAULT NULL,
  "created_by_id" UUID NULL DEFAULT NULL,
  "updated_by_id" UUID NULL DEFAULT NULL,
  "template_id" UUID NULL DEFAULT NULL,
  "custom_fields" JSON,
  "tags" TEXT,
  "metadata" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "urgency", "impact"),
  KEY ("tenant_id", "due_date"),
  KEY ("tenant_id", "customer_company_id"),
  KEY ("tenant_id", "status", "priority"),
  KEY ("tenant_id", "assigned_to_id", "status"),
  KEY ("tenant_id", "status"),
  CONSTRAINT "tickets_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "tickets_customer_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "tickets_parent_ticket_id_fkey" FOREIGN KEY ("parent_ticket_id") REFERENCES "tickets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "chk_tickets_tenant_id" CHECK ((((tenant_id)::text = '3f99462f-3621-4b1b-bea8-782acc50d62e'::text)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_actions
CREATE TABLE IF NOT EXISTS "ticket_actions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "subcategory_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "color" VARCHAR(7) NULL DEFAULT '#3b82f6',
  "icon" VARCHAR(50) NULL DEFAULT NULL,
  "active" BOOLEAN NULL DEFAULT true,
  "sort_order" INTEGER NULL DEFAULT 1,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "performed_by" UUID NULL DEFAULT NULL,
  "action_type" VARCHAR(50) NULL DEFAULT 'manual',
  "customer_id" UUID NULL DEFAULT NULL,
  "estimated_time_minutes" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "company_id"),
  KEY ("subcategory_id"),
  KEY ("tenant_id", "active"),
  UNIQUE ("subcategory_id", "code"),
  CONSTRAINT "fk_actions_subcategory" FOREIGN KEY ("subcategory_id") REFERENCES "ticket_subcategories" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "ticket_actions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "companies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "ticket_actions_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_attachments
CREATE TABLE IF NOT EXISTS "ticket_attachments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_size" BIGINT NULL DEFAULT NULL,
  "file_type" VARCHAR(100) NULL DEFAULT NULL,
  "file_path" VARCHAR(500) NULL DEFAULT NULL,
  "content_type" VARCHAR(100) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_by" UUID NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  "description" TEXT NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_categories
CREATE TABLE IF NOT EXISTS "ticket_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "color" VARCHAR(7) NULL DEFAULT '#3b82f6',
  "icon" VARCHAR(50) NULL DEFAULT NULL,
  "active" BOOLEAN NULL DEFAULT true,
  "sort_order" INTEGER NULL DEFAULT 1,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "customer_id" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "company_id"),
  KEY ("tenant_id", "active"),
  CONSTRAINT "ticket_categories_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "companies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_communications
CREATE TABLE IF NOT EXISTS "ticket_communications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "communication_type" VARCHAR(50) NULL DEFAULT 'email',
  "direction" VARCHAR(20) NULL DEFAULT 'inbound',
  "from_address" VARCHAR(255) NULL DEFAULT NULL,
  "to_address" VARCHAR(255) NULL DEFAULT NULL,
  "cc_address" TEXT NULL DEFAULT NULL,
  "bcc_address" TEXT NULL DEFAULT NULL,
  "subject" VARCHAR(500) NULL DEFAULT NULL,
  "content" TEXT NULL DEFAULT NULL,
  "message_id" VARCHAR(255) NULL DEFAULT NULL,
  "thread_id" VARCHAR(255) NULL DEFAULT NULL,
  "is_public" BOOLEAN NULL DEFAULT true,
  "created_by" UUID NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_consumed_items
CREATE TABLE IF NOT EXISTS "ticket_consumed_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "planned_item_id" UUID NULL DEFAULT NULL,
  "item_id" UUID NOT NULL,
  "planned_quantity" VARCHAR(50) NULL DEFAULT '0',
  "actual_quantity" NUMERIC(15,4) NOT NULL,
  "lpu_id" UUID NOT NULL,
  "unit_price_at_consumption" NUMERIC(15,4) NOT NULL,
  "total_cost" NUMERIC(15,2) NOT NULL,
  "technician_id" UUID NOT NULL,
  "stock_location_id" UUID NULL DEFAULT NULL,
  "consumed_at" TIMESTAMP NULL DEFAULT now(),
  "consumption_type" VARCHAR(50) NULL DEFAULT 'used',
  "notes" TEXT NULL DEFAULT NULL,
  "batch_number" VARCHAR(100) NULL DEFAULT NULL,
  "serial_number" VARCHAR(100) NULL DEFAULT NULL,
  "warranty_period" INTEGER NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "status" VARCHAR(50) NULL DEFAULT 'consumed',
  "unit_cost" TEXT NULL DEFAULT NULL,
  "consumed_by" TEXT NULL DEFAULT NULL,
  "quantity_consumed" TEXT,
  KEY ("tenant_id", "ticket_id"),
  KEY ("tenant_id", "item_id"),
  KEY ("tenant_id", "technician_id"),
  KEY ("tenant_id", "consumed_at"),
  KEY ("tenant_id", "lpu_id"),
  KEY ("tenant_id", "stock_location_id"),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "ticket_id", "is_active"),
  KEY ("planned_item_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_costs_summary
CREATE TABLE IF NOT EXISTS "ticket_costs_summary" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "total_planned_cost" VARCHAR(50) NULL DEFAULT '0',
  "total_actual_cost" VARCHAR(50) NULL DEFAULT '0',
  "variance" VARCHAR(50) NULL DEFAULT '0',
  "status" VARCHAR(50) NULL DEFAULT 'draft',
  "last_calculated_at" TIMESTAMP NULL DEFAULT now(),
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id", "ticket_id"),
  KEY ("tenant_id", "status"),
  KEY ("tenant_id", "last_calculated_at"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_default_configurations
CREATE TABLE IF NOT EXISTS "ticket_default_configurations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "field_name" VARCHAR(100) NOT NULL,
  "default_value" VARCHAR(200) NOT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "customer_id" UUID NULL DEFAULT NULL,
  UNIQUE ("tenant_id", "customer_id", "field_name"),
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "customer_id", "field_name")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_configurations
CREATE TABLE IF NOT EXISTS "ticket_field_configurations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "field_name" VARCHAR(100) NOT NULL,
  "display_name" VARCHAR(200) NOT NULL,
  "field_type" VARCHAR(50) NOT NULL DEFAULT 'text',
  "is_required" BOOLEAN NULL DEFAULT false,
  "is_system_field" BOOLEAN NULL DEFAULT false,
  "sort_order" INTEGER NULL DEFAULT 0,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "customer_id" UUID NULL DEFAULT NULL,
  "display_order" TEXT NULL DEFAULT NULL,
  "active" BOOLEAN DEFAULT true,
  "options" TEXT,
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "customer_id", "field_name"),
  KEY ("tenant_id", "customer_id"),
  KEY ("tenant_id", "field_name"),
  UNIQUE ("tenant_id", "customer_id", "field_name")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_field_options
CREATE TABLE IF NOT EXISTS "ticket_field_options" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "field_name" VARCHAR(50) NOT NULL,
  "value" VARCHAR(100) NOT NULL,
  "label" VARCHAR(100) NOT NULL,
  "color" VARCHAR(7) NULL DEFAULT NULL,
  "sort_order" INTEGER NULL DEFAULT 0,
  "is_active" BOOLEAN NULL DEFAULT true,
  "is_default" BOOLEAN NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  "customer_id" UUID NULL DEFAULT NULL,
  "status_type" VARCHAR(20) NULL DEFAULT NULL,
  UNIQUE ("tenant_id", "customer_id", "field_config_id", "option_value"),
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id", "customer_id", "field_name", "value"),
  CONSTRAINT "ticket_field_options_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "companies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_history
CREATE TABLE IF NOT EXISTS "ticket_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL,
  "action_type" VARCHAR(50) NOT NULL,
  "field_name" VARCHAR(100) NULL DEFAULT NULL,
  "old_value" TEXT NULL DEFAULT NULL,
  "new_value" TEXT NULL DEFAULT NULL,
  "performed_by" UUID NULL DEFAULT NULL,
  "performed_by_name" VARCHAR(255) NULL DEFAULT NULL,
  "ip_address" INET NULL DEFAULT NULL,
  "user_agent" TEXT NULL DEFAULT NULL,
  "session_id" VARCHAR(255) NULL DEFAULT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "metadata" JSONB NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "tenant_id" UUID NOT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  PRIMARY KEY ("id"),
  KEY ("ticket_id"),
  KEY ("created_at"),
  KEY ("action_type"),
  CONSTRAINT "ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_internal_actions
CREATE TABLE IF NOT EXISTS "ticket_internal_actions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "action_type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NULL DEFAULT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "agent_id" UUID NOT NULL,
  "start_time" TIMESTAMPTZ NULL DEFAULT NULL,
  "end_time" TIMESTAMPTZ NULL DEFAULT NULL,
  "estimated_hours" NUMERIC(5,2) NULL DEFAULT 0,
  "status" VARCHAR(20) NULL DEFAULT 'pending',
  "priority" VARCHAR(20) NULL DEFAULT 'medium',
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  "action_number" VARCHAR(50) NULL DEFAULT NULL,
  "planned_start_time" TIMESTAMPTZ NULL DEFAULT NULL,
  "planned_end_time" TIMESTAMPTZ NULL DEFAULT NULL,
  "tempo_realizado" INTEGER NULL DEFAULT NULL,
  "actual_minutes" INTEGER NULL DEFAULT 0,
  PRIMARY KEY ("id"),
  UNIQUE ("action_number"),
  CONSTRAINT "ticket_internal_actions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "ticket_internal_actions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_list_views
CREATE TABLE IF NOT EXISTS "ticket_list_views" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "created_by_id" UUID NOT NULL,
  "is_public" BOOLEAN NULL DEFAULT false,
  "is_default" BOOLEAN NULL DEFAULT false,
  "columns" JSONB NOT NULL,
  "filters" JSONB NULL DEFAULT '[]',
  "sorting" JSONB NULL DEFAULT '[]',
  "page_size" INTEGER NULL DEFAULT 25,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  KEY ("tenant_id"),
  KEY ("tenant_id", "created_by_id"),
  KEY ("tenant_id", "is_public"),
  UNIQUE ("tenant_id", "name", "created_by_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_lpu_settings
CREATE TABLE IF NOT EXISTS "ticket_lpu_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "price_list_id" UUID NOT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "applied_by" UUID NOT NULL,
  "applied_at" TIMESTAMP NULL DEFAULT now(),
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id", "ticket_id"),
  KEY ("tenant_id", "lpu_id"),
  KEY ("tenant_id", "is_active"),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "ticket_id", "is_active")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_messages
CREATE TABLE IF NOT EXISTS "ticket_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" VARCHAR(36) NOT NULL,
  "ticket_id" UUID NOT NULL,
  "user_id" UUID NULL DEFAULT NULL,
  "content" TEXT NOT NULL,
  "is_internal" BOOLEAN NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "is_active" BOOLEAN NULL DEFAULT true,
  "sender_id" UUID NULL DEFAULT NULL,
  "message" TEXT,
  "message_type" TEXT,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "ticket_id"),
  CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "chk_ticket_messages_tenant_id" CHECK ((((tenant_id)::text = '3f99462f-3621-4b1b-bea8-782acc50d62e'::text)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_notes
CREATE TABLE IF NOT EXISTS "ticket_notes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "note_type" VARCHAR(50) NULL DEFAULT 'general',
  "is_internal" BOOLEAN NULL DEFAULT false,
  "is_public" BOOLEAN NULL DEFAULT true,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_by" UUID NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_numbering_config
CREATE TABLE IF NOT EXISTS "ticket_numbering_config" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "prefix" VARCHAR(10) NOT NULL,
  "year_format" VARCHAR(1) NULL DEFAULT '4',
  "sequential_digits" INTEGER NULL DEFAULT 6,
  "separator" VARCHAR(5) NULL DEFAULT '-',
  "reset_yearly" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "first_separator" VARCHAR(10) NULL DEFAULT '-',
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "company_id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_planned_items
CREATE TABLE IF NOT EXISTS "ticket_planned_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "planned_quantity" NUMERIC(15,4) NOT NULL,
  "estimated_cost" NUMERIC(15,2) NULL DEFAULT NULL,
  "unit_price_at_planning" NUMERIC(15,4) NULL DEFAULT NULL,
  "lpu_id" UUID NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "status" VARCHAR(50) NULL DEFAULT 'planned',
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "created_by" UUID NULL DEFAULT NULL,
  "planned_by_id" UUID NULL DEFAULT NULL,
  "approved_by_id" UUID NULL DEFAULT NULL,
  "approved_at" TIMESTAMP NULL DEFAULT NULL,
  "priority" VARCHAR(20) NULL DEFAULT 'medium',
  "unit_cost" TEXT NULL DEFAULT NULL,
  "total_cost" TEXT NULL DEFAULT NULL,
  "quantity_planned" TEXT,
  KEY ("tenant_id", "ticket_id"),
  KEY ("tenant_id", "item_id"),
  KEY ("tenant_id", "status"),
  KEY ("tenant_id", "lpu_id"),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "ticket_id", "is_active")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_relationships
CREATE TABLE IF NOT EXISTS "ticket_relationships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "source_ticket_id" UUID NOT NULL,
  "target_ticket_id" UUID NOT NULL,
  "relationship_type" VARCHAR(50) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "created_by" VARCHAR NOT NULL,
  UNIQUE ("tenant_id", "source_ticket_id", "target_ticket_id", "relationship_type"),
  PRIMARY KEY ("id"),
  KEY ("source_ticket_id", "tenant_id"),
  KEY ("target_ticket_id", "tenant_id"),
  KEY ("relationship_type", "tenant_id"),
  CONSTRAINT "ticket_relationships_source_ticket_id_fkey" FOREIGN KEY ("source_ticket_id") REFERENCES "tickets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "ticket_relationships_target_ticket_id_fkey" FOREIGN KEY ("target_ticket_id") REFERENCES "tickets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_subcategories
CREATE TABLE IF NOT EXISTS "ticket_subcategories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "color" VARCHAR(7) NULL DEFAULT '#3b82f6',
  "icon" VARCHAR(50) NULL DEFAULT NULL,
  "active" BOOLEAN NULL DEFAULT true,
  "sort_order" INTEGER NULL DEFAULT 1,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "customer_id" UUID NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "company_id"),
  KEY ("category_id"),
  KEY ("tenant_id", "active"),
  UNIQUE ("category_id", "code"),
  CONSTRAINT "fk_subcategories_category" FOREIGN KEY ("category_id") REFERENCES "ticket_categories" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "ticket_subcategories_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "companies" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_templates
CREATE TABLE IF NOT EXISTS "ticket_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "category" VARCHAR(100) NOT NULL,
  "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "urgency" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "impact" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "default_title" VARCHAR(500) NULL DEFAULT NULL,
  "default_description" TEXT NULL DEFAULT NULL,
  "default_tags" TEXT NULL DEFAULT NULL,
  "estimated_hours" INTEGER NULL DEFAULT 0,
  "requires_approval" BOOLEAN NULL DEFAULT false,
  "auto_assign" BOOLEAN NULL DEFAULT false,
  "default_assignee_role" VARCHAR(50) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "customer_company_id" UUID NULL DEFAULT NULL,
  "subcategory" VARCHAR(100) NULL DEFAULT NULL,
  "default_urgency" VARCHAR(50) NULL DEFAULT NULL,
  "default_impact" VARCHAR(50) NULL DEFAULT NULL,
  "default_assignee_id" UUID NULL DEFAULT NULL,
  "default_assignment_group" VARCHAR(100) NULL DEFAULT NULL,
  "default_department" VARCHAR(100) NULL DEFAULT NULL,
  "optional_fields" UNKNOWN NULL DEFAULT '{}',
  "hidden_fields" UNKNOWN NULL DEFAULT '{}',
  "auto_assignment_rules" JSONB NULL DEFAULT '{}',
  "sla_override" JSONB NULL DEFAULT '{}',
  "sort_order" INTEGER NULL DEFAULT 0,
  "usage_count" INTEGER NULL DEFAULT 0,
  "last_used_at" TIMESTAMP NULL DEFAULT NULL,
  "default_type" VARCHAR(50) NOT NULL DEFAULT 'support',
  "default_priority" VARCHAR(50) NOT NULL DEFAULT 'medium',
  "default_status" VARCHAR(50) NOT NULL DEFAULT 'open',
  "default_category" VARCHAR(100) NOT NULL DEFAULT 'Geral',
  "template_type" VARCHAR(50) NULL DEFAULT 'standard',
  "company_id" UUID NULL DEFAULT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "automation" JSONB NULL DEFAULT '{"enabled": false}',
  "workflow" JSONB NULL DEFAULT '{"enabled": false}',
  "tags" UNKNOWN NULL DEFAULT NULL,
  "permissions" JSONB NULL DEFAULT '[]',
  "is_default" BOOLEAN NULL DEFAULT false,
  "is_system" BOOLEAN NULL DEFAULT false,
  "last_used" TIMESTAMP NULL DEFAULT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  "required_fields" JSONB NULL DEFAULT '[]',
  "custom_fields" JSONB NULL DEFAULT '[]',
  "department_id" UUID NULL DEFAULT NULL,
  "fields" JSONB NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "ticket_templates_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_validation_rules
CREATE TABLE IF NOT EXISTS "ticket_validation_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "field_name" VARCHAR(100) NOT NULL,
  "is_required" BOOLEAN NULL DEFAULT false,
  "validation_pattern" TEXT NULL DEFAULT NULL,
  "error_message" TEXT NULL DEFAULT NULL,
  "default_value" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "company_id"),
  KEY ("tenant_id", "field_name")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.ticket_view_shares
CREATE TABLE IF NOT EXISTS "ticket_view_shares" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "view_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "can_edit" BOOLEAN NULL DEFAULT false,
  "can_share" BOOLEAN NULL DEFAULT false,
  "shared_at" TIMESTAMP NULL DEFAULT now(),
  "shared_by_id" UUID NOT NULL,
  UNIQUE ("view_id", "user_id"),
  PRIMARY KEY ("id"),
  CONSTRAINT "ticket_view_shares_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "ticket_list_views" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.timecard_alerts
CREATE TABLE IF NOT EXISTS "timecard_alerts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "alert_type" VARCHAR(30) NOT NULL,
  "severity" VARCHAR(10) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "reference_date" DATE NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "tenant_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "resolved_at" TIMESTAMPTZ NULL DEFAULT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "timecard_alerts_alert_type_check" CHECK ((((alert_type)::text = ANY ((ARRAY['excessive_hours'::character varying, 'missing_record'::character varying, 'duplicate_record'::character varying, 'schedule_violation'::character varying, 'overtime_limit'::character varying, 'break_violation'::character varying])::text[])))),
  CONSTRAINT "timecard_alerts_severity_check" CHECK ((((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])))),
  CONSTRAINT "timecard_alerts_status_check" CHECK ((((status)::text = ANY ((ARRAY['active'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.timecard_audit_log
CREATE TABLE IF NOT EXISTS "timecard_audit_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "entity_type" VARCHAR(30) NOT NULL,
  "entity_id" UUID NOT NULL,
  "old_values" JSONB NULL DEFAULT NULL,
  "new_values" JSONB NULL DEFAULT NULL,
  "ip_address" INET NULL DEFAULT NULL,
  "user_agent" TEXT NULL DEFAULT NULL,
  "tenant_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.timecard_entries
CREATE TABLE IF NOT EXISTS "timecard_entries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "nsr" INTEGER NOT NULL DEFAULT 0,
  "check_in" TIMESTAMPTZ NOT NULL,
  "check_out" TIMESTAMPTZ NULL DEFAULT NULL,
  "break_start" TIMESTAMPTZ NULL DEFAULT NULL,
  "break_end" TIMESTAMPTZ NULL DEFAULT NULL,
  "total_hours" NUMERIC(5,2) NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "location" TEXT NULL DEFAULT NULL,
  "is_manual_entry" BOOLEAN NULL DEFAULT false,
  "approved_by" UUID NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'pending',
  "record_hash" VARCHAR(255) NULL DEFAULT '',
  "previous_record_hash" VARCHAR(255) NULL DEFAULT NULL,
  "digital_signature" TEXT NULL DEFAULT NULL,
  "signature_timestamp" TIMESTAMPTZ NULL DEFAULT NULL,
  "signed_by" UUID NULL DEFAULT NULL,
  "device_info" JSONB NULL DEFAULT NULL,
  "ip_address" VARCHAR(45) NULL DEFAULT NULL,
  "geo_location" JSONB NULL DEFAULT NULL,
  "modification_history" JSONB NULL DEFAULT '[]',
  "original_record_hash" VARCHAR(255) NULL DEFAULT NULL,
  "modified_by" UUID NULL DEFAULT NULL,
  "modification_reason" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  "is_deleted" BOOLEAN NULL DEFAULT false,
  "deleted_at" TIMESTAMPTZ NULL DEFAULT NULL,
  "deleted_by" UUID NULL DEFAULT NULL,
  "deletion_reason" TEXT NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.timecard_settings
CREATE TABLE IF NOT EXISTS "timecard_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "overtime_calculation_type" VARCHAR(20) NULL DEFAULT 'daily',
  "overtime_multiplier" NUMERIC(3,2) NULL DEFAULT 1.5,
  "night_shift_start" TIME NULL DEFAULT '22:00:00',
  "night_shift_end" TIME NULL DEFAULT '05:00:00',
  "night_shift_multiplier" NUMERIC(3,2) NULL DEFAULT 1.2,
  "max_daily_hours" INTEGER NULL DEFAULT 10,
  "max_weekly_hours" INTEGER NULL DEFAULT 44,
  "time_bank_expiration_months" INTEGER NULL DEFAULT 12,
  "require_geolocation" BOOLEAN NULL DEFAULT true,
  "allow_mobile_registration" BOOLEAN NULL DEFAULT true,
  "digital_signature_required" BOOLEAN NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("tenant_id"),
  CONSTRAINT "timecard_settings_overtime_calculation_type_check" CHECK ((((overtime_calculation_type)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.time_alerts
CREATE TABLE IF NOT EXISTS "time_alerts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" VARCHAR(36) NULL DEFAULT NULL,
  "alert_type" VARCHAR(30) NOT NULL,
  "severity" VARCHAR(10) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "related_date" TIMESTAMP NULL DEFAULT NULL,
  "related_record_id" VARCHAR(36) NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "resolved_by" VARCHAR(36) NULL DEFAULT NULL,
  "resolved_at" TIMESTAMP NULL DEFAULT NULL,
  "resolution_notes" TEXT NULL DEFAULT NULL,
  "notified_managers" JSONB NULL DEFAULT NULL,
  "notified_hr" BOOLEAN NULL DEFAULT false,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.time_bank
CREATE TABLE IF NOT EXISTS "time_bank" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "reference_month" DATE NOT NULL,
  "balance_hours" NUMERIC(6,2) NULL DEFAULT 0,
  "earned_hours" NUMERIC(6,2) NULL DEFAULT 0,
  "used_hours" NUMERIC(6,2) NULL DEFAULT 0,
  "expired_hours" NUMERIC(6,2) NULL DEFAULT 0,
  "expiration_date" DATE NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "tenant_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("user_id", "reference_month", "tenant_id"),
  CONSTRAINT "time_bank_status_check" CHECK ((((status)::text = ANY ((ARRAY['active'::character varying, 'expired'::character varying, 'used'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.time_bank_movements
CREATE TABLE IF NOT EXISTS "time_bank_movements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "time_bank_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "movement_date" DATE NOT NULL,
  "movement_type" VARCHAR(20) NOT NULL,
  "hours" NUMERIC(5,2) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "reference_timesheet_id" UUID NULL DEFAULT NULL,
  "tenant_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "time_bank_movements_time_bank_id_fkey" FOREIGN KEY ("time_bank_id") REFERENCES "time_bank" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "time_bank_movements_movement_type_check" CHECK ((((movement_type)::text = ANY ((ARRAY['credit'::character varying, 'debit'::character varying, 'expiration'::character varying, 'adjustment'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.time_records
CREATE TABLE IF NOT EXISTS "time_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "record_date_time" TIMESTAMPTZ NOT NULL,
  "record_type" VARCHAR(20) NOT NULL,
  "device_type" VARCHAR(20) NOT NULL DEFAULT 'web',
  "device_id" VARCHAR(100) NULL DEFAULT NULL,
  "location" JSONB NULL DEFAULT NULL,
  "ip_address" INET NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "tenant_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "time_records_record_type_check" CHECK ((((record_type)::text = ANY ((ARRAY['clock_in'::character varying, 'clock_out'::character varying, 'break_start'::character varying, 'break_end'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.transfers
CREATE TABLE IF NOT EXISTS "transfers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "transfer_number" VARCHAR(50) NOT NULL,
  "from_location_id" UUID NOT NULL,
  "to_location_id" UUID NOT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'PENDING',
  "transfer_type" VARCHAR(20) NOT NULL,
  "reason" VARCHAR(200) NULL DEFAULT NULL,
  "scheduled_date" DATE NULL DEFAULT NULL,
  "shipped_date" DATE NULL DEFAULT NULL,
  "delivered_date" DATE NULL DEFAULT NULL,
  "tracking_number" VARCHAR(100) NULL DEFAULT NULL,
  "carrier" VARCHAR(100) NULL DEFAULT NULL,
  "total_weight_kg" NUMERIC(10,3) NULL DEFAULT NULL,
  "shipping_cost" NUMERIC(10,2) NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "is_active" BOOLEAN NULL DEFAULT true,
  PRIMARY KEY ("id"),
  UNIQUE ("transfer_number"),
  CONSTRAINT "transfers_status_check" CHECK ((((status)::text = ANY ((ARRAY['PENDING'::character varying, 'IN_TRANSIT'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))),
  CONSTRAINT "transfers_transfer_type_check" CHECK ((((transfer_type)::text = ANY ((ARRAY['INTERNAL'::character varying, 'CUSTOMER'::character varying, 'TECHNICIAN'::character varying, 'SUPPLIER'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.trechos
CREATE TABLE IF NOT EXISTS "trechos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "nome" VARCHAR(200) NOT NULL,
  "descricao" TEXT NULL DEFAULT NULL,
  "codigo_integracao" VARCHAR(100) NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.trechos_rota
CREATE TABLE IF NOT EXISTS "trechos_rota" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "rota_trecho_id" UUID NOT NULL,
  "ordem" INTEGER NOT NULL,
  "local_origem_id" UUID NOT NULL,
  "nome_trecho" VARCHAR(200) NULL DEFAULT NULL,
  "local_destino_id" UUID NOT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id"),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_trechos_rota_rota_trecho_id" FOREIGN KEY ("rota_trecho_id") REFERENCES "rotas_trecho" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.users
CREATE TABLE IF NOT EXISTS "users" (
  "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::character varying,
  "tenant_id" VARCHAR(36) NOT NULL,
  "first_name" VARCHAR(255) NOT NULL,
  "last_name" VARCHAR(255) NULL DEFAULT NULL,
  "email" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50) NULL DEFAULT NULL,
  "role" VARCHAR(50) NULL DEFAULT 'employee',
  "cargo" VARCHAR(255) NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "password_hash" VARCHAR NULL DEFAULT NULL,
  "profile_image_url" VARCHAR NULL DEFAULT NULL,
  "integration_code" VARCHAR(100) NULL DEFAULT NULL,
  "alternative_email" VARCHAR NULL DEFAULT NULL,
  "cell_phone" VARCHAR(20) NULL DEFAULT NULL,
  "ramal" VARCHAR(20) NULL DEFAULT NULL,
  "time_zone" VARCHAR(50) NULL DEFAULT 'America/Sao_Paulo',
  "vehicle_type" VARCHAR(50) NULL DEFAULT NULL,
  "cpf_cnpj" VARCHAR(20) NULL DEFAULT NULL,
  "supervisor_ids" UNKNOWN NULL DEFAULT NULL,
  "cep" VARCHAR(10) NULL DEFAULT NULL,
  "country" VARCHAR(100) NULL DEFAULT 'Brasil',
  "state" VARCHAR(100) NULL DEFAULT NULL,
  "city" VARCHAR(100) NULL DEFAULT NULL,
  "street_address" VARCHAR NULL DEFAULT NULL,
  "house_type" VARCHAR(50) NULL DEFAULT NULL,
  "house_number" VARCHAR(20) NULL DEFAULT NULL,
  "complement" VARCHAR NULL DEFAULT NULL,
  "neighborhood" VARCHAR(100) NULL DEFAULT NULL,
  "employee_code" VARCHAR(50) NULL DEFAULT NULL,
  "pis" VARCHAR(20) NULL DEFAULT NULL,
  "ctps" VARCHAR(50) NULL DEFAULT NULL,
  "serie_number" VARCHAR(20) NULL DEFAULT NULL,
  "admission_date" TIMESTAMP NULL DEFAULT NULL,
  "cost_center" VARCHAR(100) NULL DEFAULT NULL,
  "position" VARCHAR(100) NULL DEFAULT NULL,
  "department_id" UUID NULL DEFAULT NULL,
  "performance" INTEGER NULL DEFAULT 75,
  "last_active_at" TIMESTAMP NULL DEFAULT NULL,
  "status" VARCHAR(20) NULL DEFAULT 'active',
  "goals" INTEGER NULL DEFAULT 0,
  "completed_goals" INTEGER NULL DEFAULT 0,
  "employment_type" VARCHAR(20) NULL DEFAULT 'clt',
  "last_login_at" TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.user_activity_tracking
CREATE TABLE IF NOT EXISTS "user_activity_tracking" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "session_id" VARCHAR(255) NULL DEFAULT NULL,
  "activity_type" VARCHAR(100) NOT NULL,
  "resource_type" VARCHAR(100) NULL DEFAULT NULL,
  "resource_id" UUID NULL DEFAULT NULL,
  "action" VARCHAR(50) NOT NULL,
  "metadata" JSONB NULL DEFAULT '{}',
  "start_time" TIMESTAMP NULL DEFAULT NULL,
  "end_time" TIMESTAMP NULL DEFAULT NULL,
  "duration_seconds" INTEGER NULL DEFAULT NULL,
  "page_url" TEXT NULL DEFAULT NULL,
  "user_agent" TEXT NULL DEFAULT NULL,
  "ip_address" INET NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  KEY ("tenant_id"),
  KEY ("user_id"),
  KEY ("activity_type"),
  KEY ("created_at"),
  KEY ("resource_type", "resource_id"),
  CONSTRAINT "fk_user_activity_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "fk_user_activity_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.user_groups
CREATE TABLE IF NOT EXISTS "user_groups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID NULL DEFAULT NULL,
  "created_by_id" UUID NULL DEFAULT NULL,
  "updated_by_id" UUID NULL DEFAULT NULL,
  "tenant_id" UUID NULL DEFAULT NULL,
  "permissions" TEXT,
  PRIMARY KEY ("id"),
  UNIQUE ("name")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.user_group_memberships
CREATE TABLE IF NOT EXISTS "user_group_memberships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "group_id" TEXT NOT NULL,
  "role" VARCHAR(50) NULL DEFAULT 'member',
  "is_active" BOOLEAN NULL DEFAULT true,
  "added_at" TIMESTAMP NULL DEFAULT now(),
  "added_by_id" UUID NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT NULL,
  "updated_at" TIMESTAMP NULL DEFAULT NULL,
  "created_by" UUID NULL DEFAULT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  "created_by_id" UUID,
  "updated_by_id" UUID,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "user_id"),
  UNIQUE ("tenant_id", "user_id", "group_id"),
  KEY ("tenant_id", "group_id"),
  CONSTRAINT "user_group_memberships_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "user_group_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.user_notification_preferences
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "email_enabled" BOOLEAN NULL DEFAULT true,
  "sms_enabled" BOOLEAN NULL DEFAULT false,
  "push_enabled" BOOLEAN NULL DEFAULT true,
  "in_app_enabled" BOOLEAN NULL DEFAULT true,
  "frequency" VARCHAR(20) NULL DEFAULT 'immediate',
  "quiet_hours_start" TIME NULL DEFAULT NULL,
  "quiet_hours_end" TIME NULL DEFAULT NULL,
  "categories" JSONB NULL DEFAULT '[]',
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  UNIQUE ("tenant_id", "user_id"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.user_roles
CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_at" TIMESTAMPS DEFAULT now(),
  "tenant_id" UUID,
  PRIMARY KEY ("id"),
  UNIQUE ("user_id", "role_id"),
  CONSTRAINT "fk_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.user_sessions
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "session_token" VARCHAR(255) NOT NULL,
  "device_type" VARCHAR(50) NULL DEFAULT NULL,
  "browser" VARCHAR(100) NULL DEFAULT NULL,
  "operating_system" VARCHAR(100) NULL DEFAULT NULL,
  "ip_address" VARCHAR(45) NULL DEFAULT NULL,
  "location" JSONB NULL DEFAULT NULL,
  "user_agent" TEXT NULL DEFAULT NULL,
  "is_active" BOOLEAN NULL DEFAULT true,
  "last_activity" TIMESTAMP NULL DEFAULT now(),
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  KEY ("tenant_id", "user_id"),
  KEY ("is_active", "last_activity"),
  KEY ("session_token"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.user_skills
CREATE TABLE IF NOT EXISTS "user_skills" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "level" INTEGER NOT NULL,
  "assessed_at" TIMESTAMP NULL DEFAULT now(),
  "assessed_by" VARCHAR(36) NULL DEFAULT NULL,
  "expires_at" TIMESTAMP NULL DEFAULT NULL,
  "notes" TEXT NULL DEFAULT NULL,
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  "is_active" BOOLEAN NULL DEFAULT true,
  PRIMARY KEY ("id"),
  KEY ("tenant_id", "skill_id"),
  KEY ("tenant_id", "skill_id", "level"),
  UNIQUE ("tenant_id", "user_id", "skill_id"),
  KEY ("tenant_id", "user_id"),
  KEY ("tenant_id", "user_id"),
  CONSTRAINT "fk_user_skills_skill_id" FOREIGN KEY ("skill_id") REFERENCES "skills" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "user_skills_tenant_id_format" CHECK (((length((tenant_id)::text) = 36)))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.user_view_preferences
CREATE TABLE IF NOT EXISTS "user_view_preferences" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "active_view_id" UUID NULL DEFAULT NULL,
  "personal_settings" JSONB NULL DEFAULT '{}',
  "last_used_at" TIMESTAMP NULL DEFAULT now(),
  "created_at" TIMESTAMP NULL DEFAULT now(),
  "updated_at" TIMESTAMP NULL DEFAULT now(),
  UNIQUE ("tenant_id", "user_id"),
  PRIMARY KEY ("id"),
  CONSTRAINT "user_view_preferences_active_view_id_fkey" FOREIGN KEY ("active_view_id") REFERENCES "ticket_list_views" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.work_orders
CREATE TABLE IF NOT EXISTS "work_orders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "asset_id" UUID NOT NULL,
  "ticket_id" UUID NULL DEFAULT NULL,
  "maintenance_plan_id" UUID NULL DEFAULT NULL,
  "origin" VARCHAR(20) NOT NULL,
  "priority" VARCHAR(20) NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NULL DEFAULT NULL,
  "estimated_duration" INTEGER NOT NULL,
  "scheduled_start" TIMESTAMP NULL DEFAULT NULL,
  "scheduled_end" TIMESTAMP NULL DEFAULT NULL,
  "actual_start" TIMESTAMP NULL DEFAULT NULL,
  "actual_end" TIMESTAMP NULL DEFAULT NULL,
  "sla_target_at" TIMESTAMP NULL DEFAULT NULL,
  "idle_policy_json" JSONB NULL DEFAULT NULL,
  "assigned_technician_id" UUID NULL DEFAULT NULL,
  "assigned_team_id" UUID NULL DEFAULT NULL,
  "location_id" UUID NOT NULL,
  "contact_person_id" UUID NULL DEFAULT NULL,
  "requires_approval" BOOLEAN NOT NULL DEFAULT false,
  "approval_workflow_id" UUID NULL DEFAULT NULL,
  "approval_status" VARCHAR(20) NULL DEFAULT NULL,
  "total_cost" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "labor_cost" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "parts_cost" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "external_cost" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "completion_percentage" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT NULL DEFAULT NULL,
  "risk_assessment_json" JSONB NULL DEFAULT NULL,
  "permits_required_json" JSONB NULL DEFAULT NULL,
  "safety_requirements_json" JSONB NULL DEFAULT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "work_orders_approval_status_check" CHECK ((((approval_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))),
  CONSTRAINT "work_orders_origin_check" CHECK ((((origin)::text = ANY ((ARRAY['pm'::character varying, 'incident'::character varying, 'manual'::character varying, 'condition'::character varying])::text[])))),
  CONSTRAINT "work_orders_priority_check" CHECK ((((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying, 'emergency'::character varying])::text[])))),
  CONSTRAINT "work_orders_status_check" CHECK ((((status)::text = ANY ((ARRAY['drafted'::character varying, 'scheduled'::character varying, 'in_progress'::character varying, 'waiting_parts'::character varying, 'waiting_window'::character varying, 'waiting_client'::character varying, 'completed'::character varying, 'approved'::character varying, 'closed'::character varying, 'rejected'::character varying, 'canceled'::character varying])::text[]))))
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.work_order_integrations
CREATE TABLE IF NOT EXISTS "work_order_integrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "work_order_id" UUID NOT NULL,
  "integration_id" UUID NULL DEFAULT NULL,
  "equipment_model" VARCHAR(100) NULL DEFAULT NULL,
  "equipment_brand" VARCHAR(100) NULL DEFAULT NULL,
  "suggested_parts" JSONB NULL DEFAULT NULL,
  "used_parts" JSONB NULL DEFAULT NULL,
  "sync_status" VARCHAR(50) NULL DEFAULT NULL,
  "sync_timestamp" TIMESTAMP NULL DEFAULT now(),
  "created_at" TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.work_schedules
CREATE TABLE IF NOT EXISTS "work_schedules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "schedule_type" VARCHAR(100) NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NULL DEFAULT NULL,
  "work_days" UNKNOWN NOT NULL,
  "start_time" TIME NOT NULL,
  "end_time" TIME NOT NULL,
  "break_duration_minutes" INTEGER NULL DEFAULT 60,
  "is_active" BOOLEAN NULL DEFAULT true,
  "tenant_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NULL DEFAULT now(),
  "created_by" UUID NULL DEFAULT NULL,
  "updated_by" UUID NULL DEFAULT NULL,
  KEY ("tenant_id", "user_id"),
  KEY ("tenant_id", "is_active"),
  PRIMARY KEY ("id")
);

-- Exportação de dados foi desmarcado.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
