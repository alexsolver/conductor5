-- Create CLT Compliance support tables
-- Based on the functional schema requirements for tenant 3f99462f-3621-4b1b-bea8-782acc50d62e

-- NSR Sequences table for CLT compliance number generation
CREATE TABLE IF NOT EXISTS "nsr_sequences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "current_nsr" integer NOT NULL DEFAULT 0,
  "last_reset" timestamp,
  "reset_period" varchar(20) DEFAULT 'yearly',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Unique constraint to ensure one sequence per tenant
CREATE UNIQUE INDEX IF NOT EXISTS "nsr_sequences_tenant_unique" 
  ON "nsr_sequences" ("tenant_id");

-- Timecard Audit Log for compliance tracking
CREATE TABLE IF NOT EXISTS "timecard_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "timecard_entry_id" uuid NOT NULL,
  "action" varchar(50) NOT NULL,
  "old_values" jsonb,
  "new_values" jsonb,
  "performed_by" uuid NOT NULL,
  "reason" text,
  "ip_address" varchar(45),
  "device_info" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- Indexes for timecard audit log
CREATE INDEX IF NOT EXISTS "timecard_audit_log_tenant_entry_idx" 
  ON "timecard_audit_log" ("tenant_id", "timecard_entry_id");

CREATE INDEX IF NOT EXISTS "timecard_audit_log_performed_by_idx" 
  ON "timecard_audit_log" ("performed_by");

-- Timecard Approval History for approval workflow tracking
CREATE TABLE IF NOT EXISTS "timecard_approval_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "timecard_entry_id" uuid NOT NULL,
  "approved_by" uuid NOT NULL,
  "previous_status" varchar(20) NOT NULL,
  "new_status" varchar(20) NOT NULL,
  "approval_reason" text,
  "rejection_reason" text,
  "approval_level" integer DEFAULT 1,
  "ip_address" varchar(45),
  "device_info" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- Indexes for timecard approval history
CREATE INDEX IF NOT EXISTS "timecard_approval_history_tenant_entry_idx" 
  ON "timecard_approval_history" ("tenant_id", "timecard_entry_id");

CREATE INDEX IF NOT EXISTS "timecard_approval_history_approved_by_idx" 
  ON "timecard_approval_history" ("approved_by");

-- Digital Signature Keys for legal compliance
CREATE TABLE IF NOT EXISTS "digital_signature_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "key_type" varchar(20) NOT NULL DEFAULT 'RSA',
  "public_key" text NOT NULL,
  "key_fingerprint" varchar(64) NOT NULL,
  "is_active" boolean DEFAULT true,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "revoked_at" timestamp,
  "revoked_by" uuid
);

-- Indexes for digital signature keys
CREATE INDEX IF NOT EXISTS "digital_signature_keys_tenant_user_idx" 
  ON "digital_signature_keys" ("tenant_id", "user_id");

CREATE INDEX IF NOT EXISTS "digital_signature_keys_fingerprint_idx" 
  ON "digital_signature_keys" ("key_fingerprint");

-- Unique constraint to ensure one active key per user per tenant
CREATE UNIQUE INDEX IF NOT EXISTS "digital_signature_keys_active_user" 
  ON "digital_signature_keys" ("tenant_id", "user_id", "is_active") 
  WHERE "is_active" = true;

-- Add foreign key constraints
ALTER TABLE "nsr_sequences" 
  ADD CONSTRAINT IF NOT EXISTS "nsr_sequences_tenant_id_fk" 
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id");

ALTER TABLE "timecard_audit_log" 
  ADD CONSTRAINT IF NOT EXISTS "timecard_audit_log_tenant_id_fk" 
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id");

ALTER TABLE "timecard_audit_log" 
  ADD CONSTRAINT IF NOT EXISTS "timecard_audit_log_timecard_entry_id_fk" 
  FOREIGN KEY ("timecard_entry_id") REFERENCES "timecard_entries"("id");

ALTER TABLE "timecard_audit_log" 
  ADD CONSTRAINT IF NOT EXISTS "timecard_audit_log_performed_by_fk" 
  FOREIGN KEY ("performed_by") REFERENCES "users"("id");

ALTER TABLE "timecard_approval_history" 
  ADD CONSTRAINT IF NOT EXISTS "timecard_approval_history_tenant_id_fk" 
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id");

ALTER TABLE "timecard_approval_history" 
  ADD CONSTRAINT IF NOT EXISTS "timecard_approval_history_timecard_entry_id_fk" 
  FOREIGN KEY ("timecard_entry_id") REFERENCES "timecard_entries"("id");

ALTER TABLE "timecard_approval_history" 
  ADD CONSTRAINT IF NOT EXISTS "timecard_approval_history_approved_by_fk" 
  FOREIGN KEY ("approved_by") REFERENCES "users"("id");

ALTER TABLE "digital_signature_keys" 
  ADD CONSTRAINT IF NOT EXISTS "digital_signature_keys_tenant_id_fk" 
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id");

ALTER TABLE "digital_signature_keys" 
  ADD CONSTRAINT IF NOT EXISTS "digital_signature_keys_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id");

ALTER TABLE "digital_signature_keys" 
  ADD CONSTRAINT IF NOT EXISTS "digital_signature_keys_revoked_by_fk" 
  FOREIGN KEY ("revoked_by") REFERENCES "users"("id");

-- Add check constraints for key type
ALTER TABLE "digital_signature_keys" 
  ADD CONSTRAINT IF NOT EXISTS "digital_signature_keys_key_type_check" 
  CHECK ("key_type" IN ('RSA', 'ECDSA'));

-- Add check constraints for actions in audit log
ALTER TABLE "timecard_audit_log" 
  ADD CONSTRAINT IF NOT EXISTS "timecard_audit_log_action_check" 
  CHECK ("action" IN ('create', 'update', 'delete', 'approve', 'reject', 'sign'));

-- Add check constraints for statuses in approval history
ALTER TABLE "timecard_approval_history" 
  ADD CONSTRAINT IF NOT EXISTS "timecard_approval_history_status_check" 
  CHECK ("previous_status" IN ('pending', 'approved', 'rejected') AND 
         "new_status" IN ('pending', 'approved', 'rejected'));

-- Add check constraint for reset period
ALTER TABLE "nsr_sequences" 
  ADD CONSTRAINT IF NOT EXISTS "nsr_sequences_reset_period_check" 
  CHECK ("reset_period" IN ('yearly', 'monthly', 'daily'));

-- Initialize NSR sequence for tenant 3f99462f-3621-4b1b-bea8-782acc50d62e if it doesn't exist
INSERT INTO "nsr_sequences" ("tenant_id", "current_nsr", "reset_period") 
SELECT '3f99462f-3621-4b1b-bea8-782acc50d62e'::uuid, 127, 'yearly'
WHERE NOT EXISTS (
  SELECT 1 FROM "nsr_sequences" 
  WHERE "tenant_id" = '3f99462f-3621-4b1b-bea8-782acc50d62e'::uuid
);

-- Add comments for documentation
COMMENT ON TABLE "nsr_sequences" IS 'Sequências NSR para compliance CLT por tenant';
COMMENT ON TABLE "timecard_audit_log" IS 'Log de auditoria para todas as alterações em timecard entries';
COMMENT ON TABLE "timecard_approval_history" IS 'Histórico de aprovações e rejeições de timecard entries';
COMMENT ON TABLE "digital_signature_keys" IS 'Chaves de assinatura digital para validação legal dos registros';

COMMENT ON COLUMN "nsr_sequences"."current_nsr" IS 'Número sequencial atual para este tenant';
COMMENT ON COLUMN "timecard_audit_log"."action" IS 'Ação realizada: create, update, delete, approve, reject, sign';
COMMENT ON COLUMN "digital_signature_keys"."key_fingerprint" IS 'Fingerprint único da chave pública para verificação';
COMMENT ON COLUMN "digital_signature_keys"."is_active" IS 'Indica se a chave está ativa para uso';