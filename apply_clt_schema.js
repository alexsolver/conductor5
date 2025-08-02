import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function applyCLTSchema() {
  console.log('🔴 Aplicando schema CLT obrigatório...');
  
  try {
    // 1. NSR Sequences Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "tenant_3f99462f-3621-4b1b-bea8-782acc50d62e"."nsr_sequences" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "current_nsr" bigint NOT NULL DEFAULT 0,
        "last_updated" timestamp DEFAULT NOW(),
        "created_at" timestamp DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela nsr_sequences criada');

    // 2. Timecard Audit Log Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "tenant_3f99462f-3621-4b1b-bea8-782acc50d62e"."timecard_audit_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "timecard_entry_id" uuid NOT NULL,
        "nsr" bigint NOT NULL,
        "action" text NOT NULL,
        "performed_by" uuid NOT NULL,
        "performed_at" timestamp NOT NULL,
        "old_values" jsonb,
        "new_values" jsonb,
        "reason" text,
        "ip_address" text,
        "user_agent" text,
        "device_info" jsonb,
        "audit_hash" text NOT NULL,
        "is_system_generated" boolean DEFAULT false,
        "created_at" timestamp DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela timecard_audit_log criada');

    // 3. Digital Signature Keys Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "tenant_3f99462f-3621-4b1b-bea8-782acc50d62e"."digital_signature_keys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "key_name" text NOT NULL,
        "key_algorithm" text NOT NULL DEFAULT 'RSA-2048',
        "public_key" text NOT NULL,
        "private_key_hash" text NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT NOW(),
        "expires_at" timestamp,
        "revoked_at" timestamp,
        "revocation_reason" text
      );
    `);
    console.log('✅ Tabela digital_signature_keys criada');

    // 4. Timecard Backups Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "tenant_3f99462f-3621-4b1b-bea8-782acc50d62e"."timecard_backups" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "backup_date" date NOT NULL,
        "record_count" integer NOT NULL,
        "backup_hash" text NOT NULL,
        "backup_size" bigint NOT NULL,
        "backup_location" text NOT NULL,
        "compression_type" text DEFAULT 'gzip',
        "encryption_type" text DEFAULT 'none',
        "is_verified" boolean DEFAULT false,
        "verification_date" timestamp,
        "created_at" timestamp DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela timecard_backups criada');

    // 5. Compliance Reports Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "tenant_3f99462f-3621-4b1b-bea8-782acc50d62e"."compliance_reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "report_type" text NOT NULL,
        "period_start" date NOT NULL,
        "period_end" date NOT NULL,
        "total_records" integer NOT NULL,
        "total_employees" integer NOT NULL,
        "total_hours" text NOT NULL,
        "overtime_hours" text DEFAULT '0',
        "report_hash" text NOT NULL,
        "report_content" jsonb NOT NULL,
        "digital_signature" text,
        "generated_by" uuid NOT NULL,
        "is_submitted_to_authorities" boolean DEFAULT false,
        "submission_date" timestamp,
        "submission_protocol" text,
        "created_at" timestamp DEFAULT NOW(),
        "updated_at" timestamp DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela compliance_reports criada');

    // 6. Adicionar campos CLT à tabela timecard_entries
    await pool.query(`
      ALTER TABLE "tenant_3f99462f-3621-4b1b-bea8-782acc50d62e"."timecard_entries" 
      ADD COLUMN IF NOT EXISTS "nsr" bigint,
      ADD COLUMN IF NOT EXISTS "record_hash" text,
      ADD COLUMN IF NOT EXISTS "previous_record_hash" text,
      ADD COLUMN IF NOT EXISTS "original_record_hash" text,
      ADD COLUMN IF NOT EXISTS "digital_signature" text,
      ADD COLUMN IF NOT EXISTS "signature_timestamp" timestamp,
      ADD COLUMN IF NOT EXISTS "signed_by" uuid,
      ADD COLUMN IF NOT EXISTS "device_info" jsonb,
      ADD COLUMN IF NOT EXISTS "ip_address" text,
      ADD COLUMN IF NOT EXISTS "geo_location" jsonb,
      ADD COLUMN IF NOT EXISTS "modification_history" jsonb DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
    `);
    console.log('✅ Campos CLT adicionados à tabela timecard_entries');

    // 7. Inserir chave de assinatura padrão
    await pool.query(`
      INSERT INTO "tenant_3f99462f-3621-4b1b-bea8-782acc50d62e"."digital_signature_keys" 
      (tenant_id, key_name, key_algorithm, public_key, private_key_hash, is_active, expires_at)
      VALUES (
        '3f99462f-3621-4b1b-bea8-782acc50d62e',
        'CLT-Primary-Key-2025',
        'RSA-2048',
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...', -- Chave pública simulada
        'sha256:a8b5c6d7e8f9...',  -- Hash da chave privada
        true,
        '2026-08-02 00:00:00'
      )
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Chave de assinatura padrão inserida');

    console.log('🟢 Schema CLT aplicado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao aplicar schema CLT:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

applyCLTSchema();