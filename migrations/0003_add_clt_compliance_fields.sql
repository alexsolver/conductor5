-- Add CLT Compliance fields to timecard_entries table
-- Based on the functional schema from tenant 3f99462f-3621-4b1b-bea8-782acc50d62e

-- First, add the user_id column since the current schema has it linked via timecard_id
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add NSR (Número Sequencial de Registros) for CLT compliance
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS nsr varchar(10);

-- Replace entry_time/entry_type with check_in/check_out pattern
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS check_in timestamp,
  ADD COLUMN IF NOT EXISTS check_out timestamp;

-- Add timecard data fields
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS total_hours numeric(8, 2),
  ADD COLUMN IF NOT EXISTS is_manual_entry boolean DEFAULT false;

-- Add approval workflow fields
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'pending';

-- Add CLT Compliance - Blockchain-like hash chain
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS record_hash varchar(64),
  ADD COLUMN IF NOT EXISTS previous_record_hash varchar(64),
  ADD COLUMN IF NOT EXISTS original_record_hash varchar(64);

-- Add digital signature for legal compliance
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS digital_signature text,
  ADD COLUMN IF NOT EXISTS signed_by uuid;

-- Add audit trail for device and location
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS device_info jsonb,
  ADD COLUMN IF NOT EXISTS ip_address varchar(45),
  ADD COLUMN IF NOT EXISTS geo_location jsonb;

-- Add modification tracking
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS modification_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS modified_by uuid,
  ADD COLUMN IF NOT EXISTS modification_reason text;

-- Add soft delete with audit
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Add updated_at timestamp
ALTER TABLE timecard_entries 
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- Update check_in from existing entry_time for in/clock_in entries
UPDATE timecard_entries 
SET check_in = entry_time 
WHERE entry_type IN ('clock_in', 'in') AND check_in IS NULL;

-- Create indexes for performance and compliance
CREATE INDEX IF NOT EXISTS timecard_entries_tenant_user_idx 
  ON timecard_entries (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS timecard_entries_nsr_idx 
  ON timecard_entries (tenant_id, nsr);

CREATE INDEX IF NOT EXISTS timecard_entries_status_idx 
  ON timecard_entries (tenant_id, status);

CREATE INDEX IF NOT EXISTS timecard_entries_hash_chain_idx 
  ON timecard_entries (record_hash, previous_record_hash);

-- Add foreign key constraints
ALTER TABLE timecard_entries 
  ADD CONSTRAINT IF NOT EXISTS timecard_entries_user_id_fk 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE timecard_entries 
  ADD CONSTRAINT IF NOT EXISTS timecard_entries_approved_by_fk 
  FOREIGN KEY (approved_by) REFERENCES users(id);

ALTER TABLE timecard_entries 
  ADD CONSTRAINT IF NOT EXISTS timecard_entries_signed_by_fk 
  FOREIGN KEY (signed_by) REFERENCES users(id);

ALTER TABLE timecard_entries 
  ADD CONSTRAINT IF NOT EXISTS timecard_entries_modified_by_fk 
  FOREIGN KEY (modified_by) REFERENCES users(id);

ALTER TABLE timecard_entries 
  ADD CONSTRAINT IF NOT EXISTS timecard_entries_deleted_by_fk 
  FOREIGN KEY (deleted_by) REFERENCES users(id);

-- Add check constraints for status
ALTER TABLE timecard_entries 
  ADD CONSTRAINT IF NOT EXISTS timecard_entries_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update tenant_id to UUID format if it's still varchar(36)
-- This handles the discrepancy between the current migration (varchar) and the backup (uuid)
ALTER TABLE timecard_entries 
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;

-- Add comments for documentation
COMMENT ON COLUMN timecard_entries.nsr IS 'Número Sequencial de Registros para compliance CLT';
COMMENT ON COLUMN timecard_entries.record_hash IS 'SHA-256 hash do registro para integridade';
COMMENT ON COLUMN timecard_entries.previous_record_hash IS 'Hash do registro anterior para criar cadeia de auditoria';
COMMENT ON COLUMN timecard_entries.digital_signature IS 'Assinatura digital para validade legal';
COMMENT ON COLUMN timecard_entries.modification_history IS 'Histórico de modificações em formato JSON';