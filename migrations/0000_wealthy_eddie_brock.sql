CREATE TABLE "absence_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"absence_type" varchar(30) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"medical_certificate" text,
	"cover_user_id" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"user_id" varchar(255),
	"metadata" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) NOT NULL,
	"duration" integer NOT NULL,
	"category" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"break_start_time" varchar(5),
	"break_end_time" varchar(5),
	"is_available" boolean DEFAULT true,
	"max_appointments" integer DEFAULT 8,
	"preferred_zones" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"approver_id" uuid,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'pending',
	"priority" varchar(20) DEFAULT 'medium',
	"data" jsonb DEFAULT '{}'::jsonb,
	"requested_amount" numeric(10, 2),
	"approved_amount" numeric(10, 2),
	"requested_date" date,
	"approved_date" date,
	"comments" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"issuer" varchar(255),
	"description" text,
	"validity_months" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_billing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"billing_period_start" timestamp NOT NULL,
	"billing_period_end" timestamp NOT NULL,
	"billing_type" varchar(50) NOT NULL,
	"base_amount" numeric(15, 2) NOT NULL,
	"additional_charges" numeric(15, 2) DEFAULT '0',
	"discount_amount" numeric(15, 2) DEFAULT '0',
	"penalty_amount" numeric(15, 2) DEFAULT '0',
	"bonus_amount" numeric(15, 2) DEFAULT '0',
	"total_amount" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2),
	"tax_amount" numeric(15, 2),
	"invoice_number" varchar(100),
	"due_date" timestamp,
	"payment_status" varchar(50) DEFAULT 'pending',
	"payment_date" timestamp,
	"payment_method" varchar(50),
	"additional_services" jsonb DEFAULT '[]'::jsonb,
	"usage_metrics" jsonb DEFAULT '{}'::jsonb,
	"billing_notes" text,
	"payment_notes" text,
	"is_active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" bigint,
	"mime_type" varchar(100),
	"version" varchar(20) DEFAULT '1.0',
	"is_current_version" boolean DEFAULT true,
	"previous_version_id" uuid,
	"requires_signature" boolean DEFAULT false,
	"signature_status" varchar(50) DEFAULT 'pending',
	"signed_date" timestamp,
	"signed_by_id" uuid,
	"digital_signature_id" varchar(255),
	"access_level" varchar(50) DEFAULT 'internal',
	"allowed_user_ids" uuid[] DEFAULT '{}',
	"allowed_roles" text[] DEFAULT '{}',
	"description" text,
	"tags" text[] DEFAULT '{}',
	"expiration_date" timestamp,
	"is_active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"equipment_name" varchar(255) NOT NULL,
	"equipment_type" varchar(100),
	"manufacturer" varchar(100),
	"model" varchar(100),
	"serial_number" varchar(100),
	"asset_tag" varchar(100),
	"installation_location_id" uuid,
	"installation_date" timestamp,
	"installation_notes" text,
	"coverage_type" varchar(50) DEFAULT 'full',
	"warranty_end_date" timestamp,
	"maintenance_schedule" varchar(50),
	"status" varchar(50) DEFAULT 'active',
	"replacement_date" timestamp,
	"replacement_reason" text,
	"specifications" jsonb DEFAULT '{}'::jsonb,
	"maintenance_history" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_renewals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"renewal_type" varchar(50) NOT NULL,
	"previous_end_date" timestamp NOT NULL,
	"new_end_date" timestamp NOT NULL,
	"renewal_date" timestamp DEFAULT now(),
	"term_months" integer NOT NULL,
	"previous_value" numeric(15, 2),
	"new_value" numeric(15, 2),
	"adjustment_percent" numeric(5, 2),
	"adjustment_reason" varchar(255),
	"status" varchar(50) DEFAULT 'pending',
	"requested_by_id" uuid,
	"approved_by_id" uuid,
	"request_date" timestamp DEFAULT now(),
	"approval_date" timestamp,
	"changes_from_previous" text,
	"renewal_notes" text,
	"approval_notes" text,
	"is_active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"service_type" varchar(50) NOT NULL,
	"service_category" varchar(100),
	"included_quantity" integer,
	"unit_price" numeric(10, 2),
	"billing_type" varchar(50) DEFAULT 'included',
	"description" text,
	"requirements" text,
	"deliverables" text,
	"estimated_hours" numeric(8, 2),
	"skills_required" text[] DEFAULT '{}',
	"sla_id" uuid,
	"priority" varchar(20) DEFAULT 'medium',
	"is_active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_slas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"sla_name" varchar(255) NOT NULL,
	"sla_type" varchar(50) NOT NULL,
	"response_time" integer,
	"resolution_time" integer,
	"availability_percent" numeric(5, 2),
	"uptime_hours" numeric(8, 2),
	"business_hours_start" time DEFAULT '08:00',
	"business_hours_end" time DEFAULT '18:00',
	"business_days" text[] DEFAULT '{"monday","tuesday","wednesday","thursday","friday"}',
	"include_weekends" boolean DEFAULT false,
	"include_holidays" boolean DEFAULT false,
	"escalation_level1" integer,
	"escalation_level2" integer,
	"escalation_level3" integer,
	"escalation_manager_id" uuid,
	"penalty_percent" numeric(5, 2),
	"bonus_percent" numeric(5, 2),
	"penalty_cap_percent" numeric(5, 2),
	"is_active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "contract_slas_contract_name_unique" UNIQUE("contract_id","sla_name")
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_number" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"customer_id" uuid,
	"customer_company_id" uuid,
	"contract_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"priority" varchar(20) DEFAULT 'medium',
	"total_value" numeric(15, 2),
	"monthly_value" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'BRL',
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"renewal_date" timestamp,
	"lastRenewalDate" timestamp,
	"signature_date" timestamp,
	"manager_id" uuid,
	"technical_manager_id" uuid,
	"location_id" uuid,
	"parent_contract_id" uuid,
	"is_main_contract" boolean DEFAULT true,
	"auto_renewal" boolean DEFAULT false,
	"renewal_notice_days" integer DEFAULT 30,
	"renewal_term_months" integer DEFAULT 12,
	"risk_level" varchar(20) DEFAULT 'low',
	"compliance_status" varchar(50) DEFAULT 'compliant',
	"terms" text,
	"notes" text,
	"tags" text[] DEFAULT '{}',
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"created_by_id" uuid,
	CONSTRAINT "contracts_tenant_number_unique" UNIQUE("tenant_id","contract_number")
);
--> statement-breakpoint
CREATE TABLE "customer_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"description" text,
	"size" varchar(50),
	"subscription_tier" varchar(50),
	"status" varchar(50) DEFAULT 'active',
	"created_by" varchar(255),
	"updated_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_tenant_email_unique" UNIQUE("tenant_id","email")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"manager_id" uuid,
	"parent_department_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dynamic_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"field_key" varchar(100) NOT NULL,
	"field_type" varchar(50) NOT NULL,
	"field_label" varchar(255) NOT NULL,
	"field_description" text,
	"is_required" boolean DEFAULT false,
	"is_visible" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"validation_rules" jsonb DEFAULT '{}'::jsonb,
	"field_options" jsonb DEFAULT '[]'::jsonb,
	"conditional_logic" jsonb DEFAULT '{}'::jsonb,
	"styling" jsonb DEFAULT '{}'::jsonb,
	"grid_position" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dynamic_fields_unique_key" UNIQUE("template_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "favorecidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"cell_phone" varchar(20),
	"cpf" varchar(14),
	"cnpj" varchar(18),
	"rg" varchar(20),
	"integration_code" varchar(100),
	"address" text,
	"city" varchar(100),
	"state" varchar(2),
	"zip_code" varchar(10),
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "favorecidos_tenant_email_unique" UNIQUE("tenant_id","email"),
	CONSTRAINT "favorecidos_tenant_cpf_unique" UNIQUE("tenant_id","cpf"),
	CONSTRAINT "favorecidos_tenant_cnpj_unique" UNIQUE("tenant_id","cnpj"),
	CONSTRAINT "favorecidos_tenant_rg_unique" UNIQUE("tenant_id","rg")
);
--> statement-breakpoint
CREATE TABLE "field_alias_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_table" varchar(100) NOT NULL,
	"source_field" varchar(100) NOT NULL,
	"alias_field" varchar(100) NOT NULL,
	"alias_display_name" varchar(200) NOT NULL,
	"market_code" varchar(10) NOT NULL,
	"validation_rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"transformation_rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "field_validation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rule_name" varchar(100) NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"rule_config" jsonb NOT NULL,
	"error_message" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "validation_rules_tenant_name_unique" UNIQUE("tenant_id","rule_name")
);
--> statement-breakpoint
CREATE TABLE "flexible_work_arrangements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"arrangement_type" varchar(30) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"working_hours" text,
	"work_location" varchar(100),
	"justification" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"type" varchar(20) NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"region_code" varchar(10),
	"is_recurring" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hour_bank_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"regular_hours" numeric(4, 2) DEFAULT '0',
	"overtime_hours" numeric(4, 2) DEFAULT '0',
	"compensated_hours" numeric(4, 2) DEFAULT '0',
	"balance" numeric(5, 2) DEFAULT '0',
	"type" varchar(20) NOT NULL,
	"description" text,
	"timecard_entry_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"category" varchar(100),
	"subcategory" varchar(100),
	"internal_code" varchar(100) NOT NULL,
	"manufacturer_code" varchar(100),
	"supplier_code" varchar(100),
	"barcode" varchar(255),
	"sku" varchar(100),
	"manufacturer" varchar(255),
	"model" varchar(255),
	"specifications" jsonb,
	"technical_details" text,
	"cost_price" numeric(10, 2),
	"sale_price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'BRL',
	"unit" varchar(50) DEFAULT 'UN',
	"abc_classification" varchar(1),
	"criticality" varchar(20),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"tags" text[],
	"custom_fields" jsonb,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "localization_context" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"context_key" varchar(100) NOT NULL,
	"context_type" varchar(50) NOT NULL,
	"market_code" varchar(10) NOT NULL,
	"labels" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"placeholders" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"help_texts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"address" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_localization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"market_code" varchar(10) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"language_code" varchar(10) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"legal_field_mappings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"validation_rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"display_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "market_localization_tenant_market_unique" UNIQUE("tenant_id","market_code")
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"notification_id" varchar(36) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"response" jsonb,
	"error" text,
	"attempted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"notification_type" varchar(50) NOT NULL,
	"channels" jsonb DEFAULT '["in_app"]'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"schedule_settings" jsonb DEFAULT '{}'::jsonb,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"subject" varchar(255),
	"body_template" text NOT NULL,
	"variables" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"channels" jsonb DEFAULT '["in_app"]'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"failed_at" timestamp,
	"read_at" timestamp,
	"related_entity_type" varchar(50),
	"related_entity_id" varchar(36),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"score" numeric(5, 2),
	"goals" jsonb DEFAULT '[]'::jsonb,
	"completed_goals" integer DEFAULT 0,
	"feedback" text,
	"evaluator_id" uuid,
	"status" varchar(20) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "performance_evaluations_unique_period" UNIQUE("tenant_id","user_id","period_start","period_end")
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"target" numeric(10, 2),
	"unit" varchar(20),
	"period" varchar(20) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"assessed_by" uuid,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"priority" varchar(20) DEFAULT 'medium',
	"estimated_hours" integer,
	"actual_hours" integer,
	"scheduled_date" date,
	"assigned_to_id" uuid,
	"responsible_ids" uuid[] DEFAULT '{}',
	"depends_on_action_ids" uuid[] DEFAULT '{}',
	"blocked_by_action_ids" uuid[] DEFAULT '{}',
	"related_ticket_id" uuid,
	"can_convert_to_ticket" boolean DEFAULT false,
	"ticket_conversion_rules" jsonb,
	"completed_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'planning',
	"priority" varchar(20) DEFAULT 'medium',
	"budget" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"estimated_hours" integer,
	"actual_hours" integer,
	"start_date" date,
	"end_date" date,
	"manager_id" uuid,
	"client_id" uuid,
	"team_member_ids" uuid[] DEFAULT '{}',
	"tags" text[],
	"custom_fields" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quality_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"item_type" varchar(50) NOT NULL,
	"item_id" uuid NOT NULL,
	"certification_name" varchar(255) NOT NULL,
	"certification_number" varchar(100),
	"issuer" varchar(255),
	"issue_date" date,
	"expiry_date" date,
	"document_url" text,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"conflict_with_schedule_id" uuid,
	"conflict_type" varchar(50) NOT NULL,
	"conflict_details" jsonb,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"is_resolved" boolean DEFAULT false,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "schedule_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agent_id" uuid,
	"setting_type" varchar(50) NOT NULL,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"schedule_type" varchar(20) NOT NULL,
	"work_days" jsonb NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_start" time,
	"break_end" time,
	"flexibility_window" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"customer_id" uuid,
	"activity_type_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_datetime" timestamp NOT NULL,
	"end_datetime" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"location_address" text,
	"coordinates" jsonb,
	"internal_notes" text,
	"client_notes" text,
	"estimated_travel_time" integer,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"is_recurring" boolean DEFAULT false,
	"recurring_pattern" jsonb,
	"parent_schedule_id" uuid,
	"type" varchar(20) DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_swap_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"requester_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"original_shift_date" date NOT NULL,
	"proposed_shift_date" date NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"description" text,
	"level_min" integer DEFAULT 1,
	"level_max" integer DEFAULT 5,
	"certification_suggested" varchar(255),
	"validity_months" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sla_escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sla_rule_id" uuid NOT NULL,
	"escalation_level" varchar(10) NOT NULL,
	"escalated_at" timestamp DEFAULT now() NOT NULL,
	"escalated_from_group_id" uuid,
	"escalated_to_group_id" uuid,
	"escalated_from_user_id" uuid,
	"escalated_to_user_id" uuid,
	"escalation_status" varchar(50) DEFAULT 'pending',
	"acknowledged_at" timestamp,
	"acknowledged_by" uuid,
	"resolved_at" timestamp,
	"escalation_reason" text,
	"escalation_notes" text,
	"is_automatic" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sla_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sla_rule_id" uuid NOT NULL,
	"first_response_time" integer,
	"first_response_due" timestamp,
	"first_response_met" boolean,
	"resolution_time" integer,
	"resolution_due" timestamp,
	"resolution_met" boolean,
	"status_timeouts" jsonb DEFAULT '{}'::jsonb,
	"total_idle_time" integer DEFAULT 0,
	"overall_compliance" boolean,
	"breach_reason" text,
	"business_hours_only" boolean DEFAULT true,
	"paused_time" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sla_metrics_ticket_rule_unique" UNIQUE("ticket_id","sla_rule_id")
);
--> statement-breakpoint
CREATE TABLE "sla_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sla_id" uuid NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"field_value" varchar(100) NOT NULL,
	"first_response_time" integer NOT NULL,
	"resolution_time" integer NOT NULL,
	"escalation_l1_time" integer,
	"escalation_l2_time" integer,
	"escalation_l3_time" integer,
	"escalation_l1_group_id" uuid,
	"escalation_l2_group_id" uuid,
	"escalation_l3_group_id" uuid,
	"priority" integer DEFAULT 100,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sla_rules_unique_condition" UNIQUE("sla_id","field_name","field_value")
);
--> statement-breakpoint
CREATE TABLE "sla_status_timeouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sla_id" uuid NOT NULL,
	"status_value" varchar(100) NOT NULL,
	"max_idle_time" integer NOT NULL,
	"timeout_action" varchar(50) DEFAULT 'escalate',
	"escalate_to_group_id" uuid,
	"escalate_to_user_id" uuid,
	"notification_template" text,
	"apply_during_business_hours" boolean DEFAULT true,
	"reset_on_update" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sla_status_timeouts_unique" UNIQUE("sla_id","status_value")
);
--> statement-breakpoint
CREATE TABLE "stock_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"current_stock" numeric(15, 4) DEFAULT '0' NOT NULL,
	"available_stock" numeric(15, 4) DEFAULT '0' NOT NULL,
	"reserved_stock" numeric(15, 4) DEFAULT '0' NOT NULL,
	"minimum_stock" numeric(15, 4) DEFAULT '0',
	"maximum_stock" numeric(15, 4),
	"reorder_point" numeric(15, 4),
	"average_cost" numeric(15, 4),
	"last_cost" numeric(15, 4),
	"last_inventory_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"parent_location_id" uuid,
	"location_path" text,
	"level" integer DEFAULT 0,
	"address" text,
	"coordinates" jsonb,
	"capacity" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"allow_negative_stock" boolean DEFAULT false,
	"requires_approval" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" varchar(50) DEFAULT 'supplier' NOT NULL,
	"document_number" varchar(50),
	"email" varchar(255),
	"phone" varchar(50),
	"website" text,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"postal_code" varchar(20),
	"contact_person" varchar(255),
	"contact_phone" varchar(50),
	"contact_email" varchar(255),
	"payment_terms" varchar(100),
	"credit_limit" numeric(15, 2),
	"rating" varchar(10),
	"notes" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "template_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"version_id" uuid,
	"status" varchar(50) DEFAULT 'pending',
	"requested_by_id" uuid NOT NULL,
	"approver_ids" uuid[] DEFAULT '{}',
	"request_comments" text,
	"approval_comments" text,
	"rejection_reason" text,
	"requested_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "template_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"version_number" varchar(20) NOT NULL,
	"changes" text NOT NULL,
	"template_data" jsonb NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "template_versions_unique" UNIQUE("template_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(100) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "ticket_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"subcategory_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"code" varchar(50) NOT NULL,
	"action_type" varchar(50) DEFAULT 'standard',
	"estimated_hours" integer,
	"required_skills" text[],
	"templates" jsonb,
	"automation_rules" jsonb,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ticket_actions_subcategory_code_unique" UNIQUE("subcategory_id","code")
);
--> statement-breakpoint
CREATE TABLE "ticket_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"description" text,
	"uploaded_by" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"code" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#3b82f6',
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ticket_categories_tenant_customer_code_unique" UNIQUE("tenant_id","customer_id","code")
);
--> statement-breakpoint
CREATE TABLE "ticket_communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"channel" varchar(50) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"from_contact" varchar(255) NOT NULL,
	"to_contact" varchar(255),
	"subject" varchar(500),
	"content" text NOT NULL,
	"message_id" varchar(255),
	"thread_id" varchar(255),
	"attachments" jsonb,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_default_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"field_name" varchar(50) NOT NULL,
	"default_value" varchar(100) NOT NULL,
	"apply_to_new_tickets" boolean DEFAULT true,
	"apply_to_imported_tickets" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ticket_default_configs_tenant_customer_field_unique" UNIQUE("tenant_id","customer_id","field_name")
);
--> statement-breakpoint
CREATE TABLE "ticket_field_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"field_name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"field_type" varchar(30) NOT NULL,
	"is_required" boolean DEFAULT false,
	"is_system_field" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ticket_field_configs_tenant_customer_field_unique" UNIQUE("tenant_id","customer_id","field_name")
);
--> statement-breakpoint
CREATE TABLE "ticket_field_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"field_config_id" uuid,
	"option_value" varchar(50) NOT NULL,
	"display_label" varchar(100) NOT NULL,
	"description" text,
	"color_hex" varchar(7),
	"icon_name" varchar(50),
	"css_classes" text,
	"sort_order" integer DEFAULT 0,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"sla_hours" integer,
	"escalation_rules" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ticket_field_options_tenant_customer_config_value_unique" UNIQUE("tenant_id","customer_id","field_config_id","option_value")
);
--> statement-breakpoint
CREATE TABLE "ticket_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"actor_id" uuid,
	"actor_type" varchar(50) DEFAULT 'user',
	"actor_name" varchar(255),
	"description" text NOT NULL,
	"field_changes" jsonb,
	"system_logs" jsonb,
	"related_entity_id" uuid,
	"related_entity_type" varchar(50),
	"is_visible" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_internal_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"action_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"agent_id" uuid NOT NULL,
	"group_id" varchar(100),
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"estimated_hours" numeric(5, 2),
	"actual_hours" numeric(5, 2),
	"status" varchar(50) DEFAULT 'pending',
	"priority" varchar(20) DEFAULT 'medium',
	"linked_item_ids" jsonb DEFAULT '[]'::jsonb,
	"linked_item_types" jsonb DEFAULT '[]'::jsonb,
	"attachment_ids" jsonb DEFAULT '[]'::jsonb,
	"form_data" jsonb DEFAULT '{}'::jsonb,
	"completion_notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_list_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_by_id" uuid NOT NULL,
	"is_public" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"columns" jsonb NOT NULL,
	"filters" jsonb DEFAULT '[]'::jsonb,
	"sorting" jsonb DEFAULT '[]'::jsonb,
	"page_size" integer DEFAULT 25,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ticket_views_tenant_name_creator" UNIQUE("tenant_id","name","created_by_id")
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid,
	"content" text NOT NULL,
	"sender" varchar(255) NOT NULL,
	"sender_type" varchar(50) DEFAULT 'agent',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"content" text NOT NULL,
	"note_type" varchar(50) DEFAULT 'general',
	"author_id" uuid NOT NULL,
	"is_private" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_ticket_id" uuid NOT NULL,
	"target_ticket_id" uuid NOT NULL,
	"relationship_type" varchar(50) NOT NULL,
	"description" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "ticket_relationships_unique" UNIQUE("tenant_id","source_ticket_id","target_ticket_id","relationship_type")
);
--> statement-breakpoint
CREATE TABLE "ticket_slas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sla_level" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"priority_field" varchar(100) DEFAULT 'priority',
	"status_field" varchar(100) DEFAULT 'status',
	"category_field" varchar(100) DEFAULT 'category',
	"business_hours_start" time DEFAULT '08:00',
	"business_hours_end" time DEFAULT '18:00',
	"business_days" text[] DEFAULT '{"monday","tuesday","wednesday","thursday","friday"}',
	"timezone" varchar(50) DEFAULT 'America/Sao_Paulo',
	"include_weekends" boolean DEFAULT false,
	"include_holidays" boolean DEFAULT false,
	"notify_breach_minutes" integer DEFAULT 15,
	"escalation_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "ticket_slas_tenant_name_unique" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE "ticket_style_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"style_name" varchar(50) NOT NULL,
	"field_name" varchar(50) NOT NULL,
	"style_mapping" jsonb NOT NULL,
	"dark_mode_mapping" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ticket_style_configs_tenant_customer_style_field_unique" UNIQUE("tenant_id","customer_id","style_name","field_name")
);
--> statement-breakpoint
CREATE TABLE "ticket_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"category_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"code" varchar(50) NOT NULL,
	"color" varchar(7),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"sla_hours" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ticket_subcategories_category_code_unique" UNIQUE("category_id","code")
);
--> statement-breakpoint
CREATE TABLE "ticket_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_company_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"default_title" varchar(500),
	"default_description" text,
	"default_type" varchar(50) DEFAULT 'support' NOT NULL,
	"default_priority" varchar(50) DEFAULT 'medium' NOT NULL,
	"default_status" varchar(50) DEFAULT 'open' NOT NULL,
	"default_category" varchar(100) NOT NULL,
	"default_urgency" varchar(50),
	"default_impact" varchar(50),
	"default_assignee_id" uuid,
	"default_assignment_group" varchar(100),
	"default_department" varchar(100),
	"required_fields" text[] DEFAULT '{}',
	"optional_fields" text[] DEFAULT '{}',
	"hidden_fields" text[] DEFAULT '{}',
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"auto_assignment_rules" jsonb DEFAULT '{}'::jsonb,
	"sla_override" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"usage_count" integer DEFAULT 0,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by_id" uuid NOT NULL,
	CONSTRAINT "templates_unique_name" UNIQUE("tenant_id","customer_company_id","name")
);
--> statement-breakpoint
CREATE TABLE "ticket_view_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"view_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"can_edit" boolean DEFAULT false,
	"can_share" boolean DEFAULT false,
	"shared_at" timestamp DEFAULT now(),
	"shared_by_id" uuid NOT NULL,
	CONSTRAINT "view_shares_unique" UNIQUE("view_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subject" varchar(500) NOT NULL,
	"description" text,
	"priority" varchar(20) DEFAULT 'medium',
	"status" varchar(50) DEFAULT 'open',
	"impact" varchar(20) DEFAULT 'medium',
	"urgency" varchar(20) DEFAULT 'medium',
	"category" varchar(100),
	"subcategory" varchar(100),
	"symptoms" text,
	"workaround" text,
	"business_impact" text,
	"caller_id" uuid,
	"caller_type" varchar(50) DEFAULT 'customer',
	"beneficiary_id" uuid,
	"beneficiary_type" varchar(50) DEFAULT 'customer',
	"assigned_to_id" uuid,
	"assignment_group_id" uuid,
	"location_id" uuid,
	"follower_id" uuid,
	"followers" text[],
	"tags" text[],
	"contact_type" varchar(50),
	"environment" varchar(100),
	"template_name" varchar(255),
	"template_alternative" varchar(255),
	"caller_name_responsible" varchar(255),
	"call_type" varchar(50),
	"call_url" varchar(500),
	"environment_error" text,
	"call_number" varchar(50),
	"group_field" varchar(100),
	"service_version" varchar(100),
	"summary" text,
	"publication_priority" varchar(50),
	"responsible_team" varchar(100),
	"infrastructure" varchar(100),
	"environment_publication" varchar(100),
	"close_to_publish" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timecard_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"user_id" uuid NOT NULL,
	"check_in" timestamp NOT NULL,
	"check_out" timestamp,
	"break_start" timestamp,
	"break_end" timestamp,
	"total_hours" numeric(4, 2),
	"notes" text,
	"location" text,
	"is_manual_entry" boolean DEFAULT false,
	"approved_by" uuid,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" uuid,
	"description" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"device_info" jsonb,
	"location" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_group_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member',
	"is_active" boolean DEFAULT true,
	"added_at" timestamp DEFAULT now(),
	"added_by_id" uuid,
	CONSTRAINT "user_group_memberships_unique" UNIQUE("tenant_id","user_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "user_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_groups_tenant_name_unique" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"device_type" varchar(50),
	"browser" varchar(100),
	"operating_system" varchar(100),
	"ip_address" varchar(45),
	"location" jsonb,
	"user_agent" text,
	"is_active" boolean DEFAULT true,
	"last_activity" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"assessed_at" timestamp DEFAULT now(),
	"assessed_by" varchar(255),
	"expires_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_view_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"active_view_id" uuid,
	"personal_settings" jsonb DEFAULT '{}'::jsonb,
	"last_used_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_prefs_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"role" varchar(50) DEFAULT 'agent' NOT NULL,
	"tenant_id" uuid NOT NULL,
	"profile_image_url" varchar,
	"integration_code" varchar(100),
	"alternative_email" varchar,
	"cell_phone" varchar(20),
	"phone" varchar(20),
	"ramal" varchar(20),
	"time_zone" varchar(50) DEFAULT 'America/Sao_Paulo',
	"vehicle_type" varchar(50),
	"cpf_cnpj" varchar(20),
	"supervisor_ids" text[],
	"cep" varchar(10),
	"country" varchar(100) DEFAULT 'Brasil',
	"state" varchar(100),
	"city" varchar(100),
	"street_address" varchar,
	"house_type" varchar(50),
	"house_number" varchar(20),
	"complement" varchar,
	"neighborhood" varchar(100),
	"employee_code" varchar(50),
	"pis" varchar(20),
	"cargo" varchar(100),
	"ctps" varchar(50),
	"serie_number" varchar(20),
	"admission_date" date,
	"cost_center" varchar(100),
	"position" varchar(100),
	"department_id" uuid,
	"performance" integer DEFAULT 75,
	"last_active_at" timestamp,
	"status" varchar(20) DEFAULT 'active',
	"goals" integer DEFAULT 0,
	"completed_goals" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"schedule_name" varchar(100) NOT NULL,
	"work_days" jsonb NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_start" time,
	"break_end" time,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "absence_requests" ADD CONSTRAINT "absence_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absence_requests" ADD CONSTRAINT "absence_requests_cover_user_id_users_id_fk" FOREIGN KEY ("cover_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absence_requests" ADD CONSTRAINT "absence_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_billing" ADD CONSTRAINT "contract_billing_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_signed_by_id_users_id_fk" FOREIGN KEY ("signed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_equipment" ADD CONSTRAINT "contract_equipment_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_equipment" ADD CONSTRAINT "contract_equipment_installation_location_id_locations_id_fk" FOREIGN KEY ("installation_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_renewals" ADD CONSTRAINT "contract_renewals_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_renewals" ADD CONSTRAINT "contract_renewals_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_renewals" ADD CONSTRAINT "contract_renewals_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_services" ADD CONSTRAINT "contract_services_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_services" ADD CONSTRAINT "contract_services_sla_id_contract_slas_id_fk" FOREIGN KEY ("sla_id") REFERENCES "public"."contract_slas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_slas" ADD CONSTRAINT "contract_slas_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_slas" ADD CONSTRAINT "contract_slas_escalation_manager_id_users_id_fk" FOREIGN KEY ("escalation_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_company_id_customer_companies_id_fk" FOREIGN KEY ("customer_company_id") REFERENCES "public"."customer_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_technical_manager_id_users_id_fk" FOREIGN KEY ("technical_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_field_definitions" ADD CONSTRAINT "dynamic_field_definitions_template_id_ticket_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."ticket_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flexible_work_arrangements" ADD CONSTRAINT "flexible_work_arrangements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flexible_work_arrangements" ADD CONSTRAINT "flexible_work_arrangements_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hour_bank_entries" ADD CONSTRAINT "hour_bank_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hour_bank_entries" ADD CONSTRAINT "hour_bank_entries_timecard_entry_id_timecard_entries_id_fk" FOREIGN KEY ("timecard_entry_id") REFERENCES "public"."timecard_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_evaluations" ADD CONSTRAINT "performance_evaluations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_evaluations" ADD CONSTRAINT "performance_evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_actions" ADD CONSTRAINT "project_actions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_actions" ADD CONSTRAINT "project_actions_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_actions" ADD CONSTRAINT "project_actions_related_ticket_id_tickets_id_fk" FOREIGN KEY ("related_ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_customers_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_conflicts" ADD CONSTRAINT "schedule_conflicts_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_conflicts" ADD CONSTRAINT "schedule_conflicts_conflict_with_schedule_id_schedules_id_fk" FOREIGN KEY ("conflict_with_schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_activity_type_id_activity_types_id_fk" FOREIGN KEY ("activity_type_id") REFERENCES "public"."activity_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_escalations" ADD CONSTRAINT "sla_escalations_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_escalations" ADD CONSTRAINT "sla_escalations_sla_rule_id_sla_rules_id_fk" FOREIGN KEY ("sla_rule_id") REFERENCES "public"."sla_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_metrics" ADD CONSTRAINT "sla_metrics_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_metrics" ADD CONSTRAINT "sla_metrics_sla_rule_id_sla_rules_id_fk" FOREIGN KEY ("sla_rule_id") REFERENCES "public"."sla_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_rules" ADD CONSTRAINT "sla_rules_sla_id_ticket_slas_id_fk" FOREIGN KEY ("sla_id") REFERENCES "public"."ticket_slas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_status_timeouts" ADD CONSTRAINT "sla_status_timeouts_sla_id_ticket_slas_id_fk" FOREIGN KEY ("sla_id") REFERENCES "public"."ticket_slas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_location_id_stock_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_approvals" ADD CONSTRAINT "template_approvals_template_id_ticket_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."ticket_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_approvals" ADD CONSTRAINT "template_approvals_version_id_template_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."template_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_template_id_ticket_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."ticket_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_actions" ADD CONSTRAINT "ticket_actions_subcategory_id_ticket_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."ticket_subcategories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_communications" ADD CONSTRAINT "ticket_communications_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_default_configurations" ADD CONSTRAINT "ticket_default_configurations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_field_configurations" ADD CONSTRAINT "ticket_field_configurations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_field_options" ADD CONSTRAINT "ticket_field_options_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_field_options" ADD CONSTRAINT "ticket_field_options_field_config_id_ticket_field_configurations_id_fk" FOREIGN KEY ("field_config_id") REFERENCES "public"."ticket_field_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_history" ADD CONSTRAINT "ticket_history_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_history" ADD CONSTRAINT "ticket_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_internal_actions" ADD CONSTRAINT "ticket_internal_actions_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_internal_actions" ADD CONSTRAINT "ticket_internal_actions_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_relationships" ADD CONSTRAINT "ticket_relationships_source_ticket_id_tickets_id_fk" FOREIGN KEY ("source_ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_relationships" ADD CONSTRAINT "ticket_relationships_target_ticket_id_tickets_id_fk" FOREIGN KEY ("target_ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_relationships" ADD CONSTRAINT "ticket_relationships_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_slas" ADD CONSTRAINT "ticket_slas_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_style_configurations" ADD CONSTRAINT "ticket_style_configurations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_subcategories" ADD CONSTRAINT "ticket_subcategories_category_id_ticket_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."ticket_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_templates" ADD CONSTRAINT "ticket_templates_customer_company_id_customers_id_fk" FOREIGN KEY ("customer_company_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_view_shares" ADD CONSTRAINT "ticket_view_shares_view_id_ticket_list_views_id_fk" FOREIGN KEY ("view_id") REFERENCES "public"."ticket_list_views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_caller_id_customers_id_fk" FOREIGN KEY ("caller_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_beneficiary_id_favorecidos_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."favorecidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignment_group_id_user_groups_id_fk" FOREIGN KEY ("assignment_group_id") REFERENCES "public"."user_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timecard_entries" ADD CONSTRAINT "timecard_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timecard_entries" ADD CONSTRAINT "timecard_entries_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group_memberships" ADD CONSTRAINT "user_group_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group_memberships" ADD CONSTRAINT "user_group_memberships_group_id_user_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."user_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group_memberships" ADD CONSTRAINT "user_group_memberships_added_by_id_users_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_view_preferences" ADD CONSTRAINT "user_view_preferences_active_view_id_ticket_list_views_id_fk" FOREIGN KEY ("active_view_id") REFERENCES "public"."ticket_list_views"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_tenant_entity_idx" ON "activity_logs" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "activity_logs_tenant_time_idx" ON "activity_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "approval_requests_tenant_requester_idx" ON "approval_requests" USING btree ("tenant_id","requester_id");--> statement-breakpoint
CREATE INDEX "approval_requests_tenant_approver_idx" ON "approval_requests" USING btree ("tenant_id","approver_id");--> statement-breakpoint
CREATE INDEX "approval_requests_status_idx" ON "approval_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approval_requests_type_idx" ON "approval_requests" USING btree ("type");--> statement-breakpoint
CREATE INDEX "certifications_tenant_name_idx" ON "certifications" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "certifications_tenant_issuer_idx" ON "certifications" USING btree ("tenant_id","issuer");--> statement-breakpoint
CREATE INDEX "certifications_tenant_active_idx" ON "certifications" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "certifications_validity_idx" ON "certifications" USING btree ("tenant_id","validity_months");--> statement-breakpoint
CREATE INDEX "contract_billing_tenant_contract_idx" ON "contract_billing" USING btree ("tenant_id","contract_id");--> statement-breakpoint
CREATE INDEX "contract_billing_tenant_period_idx" ON "contract_billing" USING btree ("tenant_id","billing_period_start","billing_period_end");--> statement-breakpoint
CREATE INDEX "contract_billing_tenant_status_idx" ON "contract_billing" USING btree ("tenant_id","payment_status");--> statement-breakpoint
CREATE INDEX "contract_billing_due_date_idx" ON "contract_billing" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "contract_documents_tenant_contract_idx" ON "contract_documents" USING btree ("tenant_id","contract_id");--> statement-breakpoint
CREATE INDEX "contract_documents_tenant_type_idx" ON "contract_documents" USING btree ("tenant_id","document_type");--> statement-breakpoint
CREATE INDEX "contract_documents_signature_status_idx" ON "contract_documents" USING btree ("signature_status");--> statement-breakpoint
CREATE INDEX "contract_documents_current_version_idx" ON "contract_documents" USING btree ("is_current_version");--> statement-breakpoint
CREATE INDEX "contract_equipment_tenant_contract_idx" ON "contract_equipment" USING btree ("tenant_id","contract_id");--> statement-breakpoint
CREATE INDEX "contract_equipment_tenant_type_idx" ON "contract_equipment" USING btree ("tenant_id","equipment_type");--> statement-breakpoint
CREATE INDEX "contract_equipment_serial_idx" ON "contract_equipment" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "contract_equipment_location_idx" ON "contract_equipment" USING btree ("installation_location_id");--> statement-breakpoint
CREATE INDEX "contract_renewals_tenant_contract_idx" ON "contract_renewals" USING btree ("tenant_id","contract_id");--> statement-breakpoint
CREATE INDEX "contract_renewals_tenant_status_idx" ON "contract_renewals" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "contract_renewals_tenant_date_idx" ON "contract_renewals" USING btree ("tenant_id","renewal_date");--> statement-breakpoint
CREATE INDEX "contract_services_tenant_contract_idx" ON "contract_services" USING btree ("tenant_id","contract_id");--> statement-breakpoint
CREATE INDEX "contract_services_tenant_type_idx" ON "contract_services" USING btree ("tenant_id","service_type");--> statement-breakpoint
CREATE INDEX "contract_services_tenant_category_idx" ON "contract_services" USING btree ("tenant_id","service_category");--> statement-breakpoint
CREATE INDEX "contract_slas_tenant_contract_idx" ON "contract_slas" USING btree ("tenant_id","contract_id");--> statement-breakpoint
CREATE INDEX "contract_slas_tenant_type_idx" ON "contract_slas" USING btree ("tenant_id","sla_type");--> statement-breakpoint
CREATE INDEX "contracts_tenant_customer_idx" ON "contracts" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "contracts_tenant_status_idx" ON "contracts" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "contracts_tenant_type_idx" ON "contracts" USING btree ("tenant_id","contract_type");--> statement-breakpoint
CREATE INDEX "contracts_tenant_dates_idx" ON "contracts" USING btree ("tenant_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "contracts_tenant_renewal_idx" ON "contracts" USING btree ("tenant_id","renewal_date");--> statement-breakpoint
CREATE INDEX "contracts_tenant_manager_idx" ON "contracts" USING btree ("tenant_id","manager_id");--> statement-breakpoint
CREATE INDEX "customer_companies_tenant_name_idx" ON "customer_companies" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "customer_companies_tenant_status_idx" ON "customer_companies" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "customer_companies_tenant_tier_idx" ON "customer_companies" USING btree ("tenant_id","subscription_tier");--> statement-breakpoint
CREATE INDEX "customer_companies_tenant_size_idx" ON "customer_companies" USING btree ("tenant_id","size");--> statement-breakpoint
CREATE INDEX "customers_tenant_email_idx" ON "customers" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "customers_tenant_active_idx" ON "customers" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "departments_tenant_code_idx" ON "departments" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "departments_tenant_active_idx" ON "departments" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "dynamic_fields_template_idx" ON "dynamic_field_definitions" USING btree ("tenant_id","template_id");--> statement-breakpoint
CREATE INDEX "dynamic_fields_order_idx" ON "dynamic_field_definitions" USING btree ("tenant_id","template_id","sort_order");--> statement-breakpoint
CREATE INDEX "favorecidos_tenant_cpf_idx" ON "favorecidos" USING btree ("tenant_id","cpf");--> statement-breakpoint
CREATE INDEX "favorecidos_tenant_active_idx" ON "favorecidos" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "field_alias_tenant_table_idx" ON "field_alias_mapping" USING btree ("tenant_id","source_table");--> statement-breakpoint
CREATE INDEX "field_alias_market_code_idx" ON "field_alias_mapping" USING btree ("market_code");--> statement-breakpoint
CREATE INDEX "validation_rules_tenant_type_idx" ON "field_validation_rules" USING btree ("tenant_id","rule_type");--> statement-breakpoint
CREATE INDEX "holidays_tenant_date_idx" ON "holidays" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "holidays_tenant_country_idx" ON "holidays" USING btree ("tenant_id","country_code");--> statement-breakpoint
CREATE INDEX "holidays_tenant_type_idx" ON "holidays" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE INDEX "holidays_tenant_active_idx" ON "holidays" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "localization_context_tenant_key_idx" ON "localization_context" USING btree ("tenant_id","context_key");--> statement-breakpoint
CREATE INDEX "localization_context_market_idx" ON "localization_context" USING btree ("market_code");--> statement-breakpoint
CREATE INDEX "locations_tenant_name_idx" ON "locations" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "locations_tenant_active_idx" ON "locations" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "locations_tenant_geo_idx" ON "locations" USING btree ("tenant_id","latitude","longitude");--> statement-breakpoint
CREATE INDEX "locations_geo_proximity_idx" ON "locations" USING btree ("tenant_id","latitude","longitude");--> statement-breakpoint
CREATE INDEX "market_localization_tenant_active_idx" ON "market_localization" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "performance_evaluations_tenant_user_idx" ON "performance_evaluations" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "performance_evaluations_period_idx" ON "performance_evaluations" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "performance_metrics_tenant_user_idx" ON "performance_metrics" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "performance_metrics_tenant_period_idx" ON "performance_metrics" USING btree ("tenant_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "performance_metrics_tenant_type_idx" ON "performance_metrics" USING btree ("tenant_id","metric_type");--> statement-breakpoint
CREATE INDEX "project_actions_tenant_project_idx" ON "project_actions" USING btree ("tenant_id","project_id");--> statement-breakpoint
CREATE INDEX "project_actions_tenant_status_idx" ON "project_actions" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "project_actions_tenant_assigned_idx" ON "project_actions" USING btree ("tenant_id","assigned_to_id");--> statement-breakpoint
CREATE INDEX "project_actions_project_status_idx" ON "project_actions" USING btree ("tenant_id","project_id","status");--> statement-breakpoint
CREATE INDEX "project_actions_type_priority_idx" ON "project_actions" USING btree ("tenant_id","type","priority");--> statement-breakpoint
CREATE INDEX "project_actions_scheduled_idx" ON "project_actions" USING btree ("tenant_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "projects_tenant_status_idx" ON "projects" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "projects_tenant_manager_idx" ON "projects" USING btree ("tenant_id","manager_id");--> statement-breakpoint
CREATE INDEX "projects_tenant_deadline_idx" ON "projects" USING btree ("tenant_id","end_date");--> statement-breakpoint
CREATE INDEX "quality_certifications_tenant_item_idx" ON "quality_certifications" USING btree ("tenant_id","item_type","item_id");--> statement-breakpoint
CREATE INDEX "quality_certifications_tenant_status_idx" ON "quality_certifications" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "quality_certifications_expiry_idx" ON "quality_certifications" USING btree ("tenant_id","expiry_date");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "skills_tenant_name_idx" ON "skills" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "skills_tenant_category_idx" ON "skills" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "skills_tenant_active_idx" ON "skills" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "skills_category_active_idx" ON "skills" USING btree ("tenant_id","category","is_active");--> statement-breakpoint
CREATE INDEX "sla_escalations_tenant_ticket_idx" ON "sla_escalations" USING btree ("tenant_id","ticket_id");--> statement-breakpoint
CREATE INDEX "sla_escalations_rule_idx" ON "sla_escalations" USING btree ("sla_rule_id");--> statement-breakpoint
CREATE INDEX "sla_escalations_level_idx" ON "sla_escalations" USING btree ("escalation_level");--> statement-breakpoint
CREATE INDEX "sla_escalations_status_idx" ON "sla_escalations" USING btree ("escalation_status");--> statement-breakpoint
CREATE INDEX "sla_metrics_tenant_ticket_idx" ON "sla_metrics" USING btree ("tenant_id","ticket_id");--> statement-breakpoint
CREATE INDEX "sla_metrics_rule_idx" ON "sla_metrics" USING btree ("sla_rule_id");--> statement-breakpoint
CREATE INDEX "sla_metrics_compliance_idx" ON "sla_metrics" USING btree ("overall_compliance");--> statement-breakpoint
CREATE INDEX "sla_metrics_response_met_idx" ON "sla_metrics" USING btree ("first_response_met");--> statement-breakpoint
CREATE INDEX "sla_metrics_resolution_met_idx" ON "sla_metrics" USING btree ("resolution_met");--> statement-breakpoint
CREATE INDEX "sla_rules_tenant_sla_idx" ON "sla_rules" USING btree ("tenant_id","sla_id");--> statement-breakpoint
CREATE INDEX "sla_rules_field_value_idx" ON "sla_rules" USING btree ("field_name","field_value");--> statement-breakpoint
CREATE INDEX "sla_rules_priority_idx" ON "sla_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "sla_status_timeouts_tenant_sla_idx" ON "sla_status_timeouts" USING btree ("tenant_id","sla_id");--> statement-breakpoint
CREATE INDEX "sla_status_timeouts_status_idx" ON "sla_status_timeouts" USING btree ("status_value");--> statement-breakpoint
CREATE INDEX "template_approvals_template_idx" ON "template_approvals" USING btree ("tenant_id","template_id");--> statement-breakpoint
CREATE INDEX "template_approvals_status_idx" ON "template_approvals" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "template_versions_template_idx" ON "template_versions" USING btree ("tenant_id","template_id");--> statement-breakpoint
CREATE INDEX "template_versions_version_idx" ON "template_versions" USING btree ("tenant_id","version_number");--> statement-breakpoint
CREATE INDEX "ticket_actions_tenant_idx" ON "ticket_actions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ticket_actions_subcategory_idx" ON "ticket_actions" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "ticket_actions_tenant_customer_idx" ON "ticket_actions" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "ticket_actions_type_idx" ON "ticket_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "ticket_actions_active_idx" ON "ticket_actions" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "ticket_attachments_tenant_ticket_idx" ON "ticket_attachments" USING btree ("tenant_id","ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_attachments_tenant_created_idx" ON "ticket_attachments" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_categories_tenant_idx" ON "ticket_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ticket_categories_tenant_customer_idx" ON "ticket_categories" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "ticket_categories_active_idx" ON "ticket_categories" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "ticket_communications_tenant_ticket_idx" ON "ticket_communications" USING btree ("tenant_id","ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_communications_tenant_channel_idx" ON "ticket_communications" USING btree ("tenant_id","channel");--> statement-breakpoint
CREATE INDEX "ticket_communications_tenant_created_idx" ON "ticket_communications" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_communications_thread_idx" ON "ticket_communications" USING btree ("tenant_id","thread_id");--> statement-breakpoint
CREATE INDEX "ticket_default_configs_tenant_idx" ON "ticket_default_configurations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ticket_default_configs_hierarchical_idx" ON "ticket_default_configurations" USING btree ("tenant_id","customer_id","field_name");--> statement-breakpoint
CREATE INDEX "ticket_default_configs_customer_idx" ON "ticket_default_configurations" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "ticket_field_configs_tenant_active_idx" ON "ticket_field_configurations" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "ticket_field_configs_tenant_type_idx" ON "ticket_field_configurations" USING btree ("tenant_id","field_type");--> statement-breakpoint
CREATE INDEX "ticket_field_configs_hierarchical_idx" ON "ticket_field_configurations" USING btree ("tenant_id","customer_id","field_name");--> statement-breakpoint
CREATE INDEX "ticket_field_configs_customer_idx" ON "ticket_field_configurations" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "ticket_field_options_tenant_config_idx" ON "ticket_field_options" USING btree ("tenant_id","field_config_id");--> statement-breakpoint
CREATE INDEX "ticket_field_options_tenant_active_idx" ON "ticket_field_options" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "ticket_field_options_hierarchical_idx" ON "ticket_field_options" USING btree ("tenant_id","customer_id","field_config_id");--> statement-breakpoint
CREATE INDEX "ticket_field_options_customer_idx" ON "ticket_field_options" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "ticket_history_tenant_ticket_idx" ON "ticket_history" USING btree ("tenant_id","ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_history_tenant_created_idx" ON "ticket_history" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_history_tenant_action_idx" ON "ticket_history" USING btree ("tenant_id","action_type");--> statement-breakpoint
CREATE INDEX "ticket_internal_actions_tenant_ticket_idx" ON "ticket_internal_actions" USING btree ("tenant_id","ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_internal_actions_tenant_agent_idx" ON "ticket_internal_actions" USING btree ("tenant_id","agent_id");--> statement-breakpoint
CREATE INDEX "ticket_internal_actions_tenant_status_idx" ON "ticket_internal_actions" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "ticket_internal_actions_tenant_created_idx" ON "ticket_internal_actions" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_views_tenant_idx" ON "ticket_list_views" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ticket_views_creator_idx" ON "ticket_list_views" USING btree ("tenant_id","created_by_id");--> statement-breakpoint
CREATE INDEX "ticket_views_public_idx" ON "ticket_list_views" USING btree ("tenant_id","is_public");--> statement-breakpoint
CREATE INDEX "ticket_messages_tenant_ticket_idx" ON "ticket_messages" USING btree ("tenant_id","ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_messages_tenant_sender_idx" ON "ticket_messages" USING btree ("tenant_id","sender_type");--> statement-breakpoint
CREATE INDEX "ticket_messages_tenant_time_idx" ON "ticket_messages" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_messages_ticket_time_idx" ON "ticket_messages" USING btree ("tenant_id","ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_notes_tenant_ticket_idx" ON "ticket_notes" USING btree ("tenant_id","ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_notes_tenant_created_idx" ON "ticket_notes" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_relationships_source_idx" ON "ticket_relationships" USING btree ("tenant_id","source_ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_relationships_target_idx" ON "ticket_relationships" USING btree ("tenant_id","target_ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_relationships_type_idx" ON "ticket_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "ticket_relationships_active_idx" ON "ticket_relationships" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "ticket_slas_tenant_level_idx" ON "ticket_slas" USING btree ("tenant_id","sla_level");--> statement-breakpoint
CREATE INDEX "ticket_slas_tenant_active_idx" ON "ticket_slas" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "ticket_style_configs_tenant_field_idx" ON "ticket_style_configurations" USING btree ("tenant_id","field_name");--> statement-breakpoint
CREATE INDEX "ticket_style_configs_hierarchical_idx" ON "ticket_style_configurations" USING btree ("tenant_id","customer_id","field_name");--> statement-breakpoint
CREATE INDEX "ticket_style_configs_customer_idx" ON "ticket_style_configurations" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "ticket_subcategories_tenant_idx" ON "ticket_subcategories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ticket_subcategories_category_idx" ON "ticket_subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "ticket_subcategories_tenant_customer_idx" ON "ticket_subcategories" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "ticket_subcategories_active_idx" ON "ticket_subcategories" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "templates_company_active_idx" ON "ticket_templates" USING btree ("tenant_id","customer_company_id","is_active","category");--> statement-breakpoint
CREATE INDEX "templates_usage_idx" ON "ticket_templates" USING btree ("tenant_id","customer_company_id","usage_count" DESC NULLS LAST,"last_used_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "view_shares_view_idx" ON "ticket_view_shares" USING btree ("view_id");--> statement-breakpoint
CREATE INDEX "view_shares_user_idx" ON "ticket_view_shares" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "tickets_tenant_status_priority_idx" ON "tickets" USING btree ("tenant_id","status","priority");--> statement-breakpoint
CREATE INDEX "tickets_tenant_assigned_idx" ON "tickets" USING btree ("tenant_id","assigned_to_id");--> statement-breakpoint
CREATE INDEX "tickets_tenant_customer_idx" ON "tickets" USING btree ("tenant_id","caller_id");--> statement-breakpoint
CREATE INDEX "tickets_tenant_environment_idx" ON "tickets" USING btree ("tenant_id","environment");--> statement-breakpoint
CREATE INDEX "tickets_tenant_template_idx" ON "tickets" USING btree ("tenant_id","template_name");--> statement-breakpoint
CREATE INDEX "user_activity_logs_tenant_user_idx" ON "user_activity_logs" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "user_activity_logs_action_idx" ON "user_activity_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "user_activity_logs_resource_idx" ON "user_activity_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "user_activity_logs_created_idx" ON "user_activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_group_memberships_tenant_user_idx" ON "user_group_memberships" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "user_group_memberships_tenant_group_idx" ON "user_group_memberships" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "user_groups_tenant_active_idx" ON "user_groups" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "user_sessions_tenant_user_idx" ON "user_sessions" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_active_idx" ON "user_sessions" USING btree ("is_active","last_activity");--> statement-breakpoint
CREATE INDEX "user_sessions_token_idx" ON "user_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "user_skills_tenant_user_idx" ON "user_skills" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "user_skills_tenant_skill_idx" ON "user_skills" USING btree ("tenant_id","skill_id");--> statement-breakpoint
CREATE INDEX "user_skills_skill_level_idx" ON "user_skills" USING btree ("tenant_id","skill_id","level");--> statement-breakpoint
CREATE INDEX "user_skills_user_skill_unique" ON "user_skills" USING btree ("tenant_id","user_id","skill_id");--> statement-breakpoint
CREATE INDEX "user_skills_assessed_idx" ON "user_skills" USING btree ("tenant_id","assessed_at");--> statement-breakpoint
CREATE INDEX "user_prefs_user_idx" ON "user_view_preferences" USING btree ("tenant_id","user_id");