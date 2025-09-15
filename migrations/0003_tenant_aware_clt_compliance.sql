-- Tenant-aware CLT Compliance Migration
-- Based on architect recommendation for multi-schema tenant isolation
-- Safely adds CLT compliance fields to all tenant schemas

DO $$
DECLARE 
    tenant_schema text;
    schema_count integer := 0;
    success_count integer := 0;
    error_count integer := 0;
    current_tenant_id uuid;
BEGIN
    RAISE NOTICE 'Starting CLT Compliance migration for tenant-isolated schemas...';
    
    -- Loop through all tenant schemas
    FOR tenant_schema IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname LIKE 'tenant_%' 
        ORDER BY nspname
    LOOP
        schema_count := schema_count + 1;
        BEGIN
            RAISE NOTICE 'Processing schema: %', tenant_schema;
            
            -- Extract tenant_id from schema name for reference
            current_tenant_id := REPLACE(tenant_schema, 'tenant_', '')::uuid;
            
            -- 1. ADD CLT COMPLIANCE FIELDS TO TIMECARD_ENTRIES (nullable initially)
            EXECUTE format('
                ALTER TABLE %I.timecard_entries 
                ADD COLUMN IF NOT EXISTS user_id uuid,
                ADD COLUMN IF NOT EXISTS nsr varchar(10),
                ADD COLUMN IF NOT EXISTS check_in timestamp,
                ADD COLUMN IF NOT EXISTS check_out timestamp,
                ADD COLUMN IF NOT EXISTS total_hours numeric(8,2),
                ADD COLUMN IF NOT EXISTS is_manual_entry boolean DEFAULT false,
                ADD COLUMN IF NOT EXISTS approved_by uuid,
                ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT ''pending'',
                ADD COLUMN IF NOT EXISTS record_hash varchar(64),
                ADD COLUMN IF NOT EXISTS previous_record_hash varchar(64),
                ADD COLUMN IF NOT EXISTS original_record_hash varchar(64),
                ADD COLUMN IF NOT EXISTS digital_signature text,
                ADD COLUMN IF NOT EXISTS signed_by uuid,
                ADD COLUMN IF NOT EXISTS device_info jsonb,
                ADD COLUMN IF NOT EXISTS ip_address varchar(45),
                ADD COLUMN IF NOT EXISTS geo_location jsonb,
                ADD COLUMN IF NOT EXISTS modification_history jsonb DEFAULT ''[]''::jsonb,
                ADD COLUMN IF NOT EXISTS modified_by uuid,
                ADD COLUMN IF NOT EXISTS modification_reason text,
                ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
                ADD COLUMN IF NOT EXISTS deleted_by uuid,
                ADD COLUMN IF NOT EXISTS deletion_reason text,
                ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()
            ', tenant_schema);
            
            -- 2. SAFE BACKFILL: Update check_in from existing entry_time if applicable
            EXECUTE format('
                UPDATE %I.timecard_entries 
                SET check_in = entry_time 
                WHERE entry_type IN (''clock_in'', ''in'') 
                  AND check_in IS NULL 
                  AND entry_time IS NOT NULL
            ', tenant_schema);
            
            -- 3. BACKFILL user_id from timecards if timecard_id exists and user_id is NULL
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                  AND table_name = 'timecard_entries' 
                  AND column_name = 'timecard_id'
            ) AND EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = tenant_schema 
                  AND table_name = 'timecards'
            ) THEN
                EXECUTE format('
                    UPDATE %I.timecard_entries te
                    SET user_id = tc.user_id
                    FROM %I.timecards tc
                    WHERE te.timecard_id = tc.id 
                      AND te.user_id IS NULL
                ', tenant_schema, tenant_schema);
            END IF;
            
            -- 4. NORMALIZE tenant_id type to UUID if it''s varchar (safely)
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                  AND table_name = 'timecard_entries' 
                  AND column_name = 'tenant_id' 
                  AND data_type = 'character varying'
            ) THEN
                -- Check if all values are valid UUIDs before converting
                EXECUTE format('
                    SELECT COUNT(*) 
                    FROM %I.timecard_entries 
                    WHERE tenant_id !~ ''^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$''
                ', tenant_schema);
                
                -- If all values are valid UUIDs, convert the type
                EXECUTE format('
                    ALTER TABLE %I.timecard_entries 
                    ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid
                ', tenant_schema);
            END IF;
            
            -- 5. CREATE CLT SUPPORT TABLES (per-tenant isolation)
            
            -- NSR Sequences table
            EXECUTE format('
                CREATE TABLE IF NOT EXISTS %I.nsr_sequences (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id uuid NOT NULL DEFAULT %L,
                    current_nsr integer NOT NULL DEFAULT 0,
                    last_reset timestamp,
                    reset_period varchar(20) DEFAULT ''yearly'',
                    created_at timestamp DEFAULT now(),
                    updated_at timestamp DEFAULT now()
                )
            ', tenant_schema, current_tenant_id);
            
            -- Timecard Audit Log
            EXECUTE format('
                CREATE TABLE IF NOT EXISTS %I.timecard_audit_log (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id uuid NOT NULL DEFAULT %L,
                    timecard_entry_id uuid NOT NULL,
                    action varchar(50) NOT NULL,
                    old_values jsonb,
                    new_values jsonb,
                    performed_by uuid NOT NULL,
                    reason text,
                    ip_address varchar(45),
                    device_info jsonb,
                    created_at timestamp DEFAULT now()
                )
            ', tenant_schema, current_tenant_id);
            
            -- Timecard Approval History
            EXECUTE format('
                CREATE TABLE IF NOT EXISTS %I.timecard_approval_history (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id uuid NOT NULL DEFAULT %L,
                    timecard_entry_id uuid NOT NULL,
                    approved_by uuid NOT NULL,
                    previous_status varchar(20) NOT NULL,
                    new_status varchar(20) NOT NULL,
                    approval_reason text,
                    rejection_reason text,
                    approval_level integer DEFAULT 1,
                    ip_address varchar(45),
                    device_info jsonb,
                    created_at timestamp DEFAULT now()
                )
            ', tenant_schema, current_tenant_id);
            
            -- Digital Signature Keys
            EXECUTE format('
                CREATE TABLE IF NOT EXISTS %I.digital_signature_keys (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id uuid NOT NULL DEFAULT %L,
                    user_id uuid NOT NULL,
                    key_type varchar(20) NOT NULL DEFAULT ''RSA'',
                    public_key text NOT NULL,
                    key_fingerprint varchar(64) NOT NULL,
                    is_active boolean DEFAULT true,
                    expires_at timestamp,
                    created_at timestamp DEFAULT now(),
                    revoked_at timestamp,
                    revoked_by uuid
                )
            ', tenant_schema, current_tenant_id);
            
            -- 6. CREATE INDEXES (schema-qualified)
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS %I_timecard_entries_tenant_user_idx 
                ON %I.timecard_entries (tenant_id, user_id)
            ', REPLACE(tenant_schema, '-', '_'), tenant_schema);
            
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS %I_timecard_entries_nsr_idx 
                ON %I.timecard_entries (tenant_id, nsr)
            ', REPLACE(tenant_schema, '-', '_'), tenant_schema);
            
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS %I_timecard_entries_status_idx 
                ON %I.timecard_entries (tenant_id, status)
            ', REPLACE(tenant_schema, '-', '_'), tenant_schema);
            
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS %I_timecard_entries_hash_chain_idx 
                ON %I.timecard_entries (record_hash, previous_record_hash)
            ', REPLACE(tenant_schema, '-', '_'), tenant_schema);
            
            -- Support table indexes
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS %I_timecard_audit_log_tenant_entry_idx 
                ON %I.timecard_audit_log (tenant_id, timecard_entry_id)
            ', REPLACE(tenant_schema, '-', '_'), tenant_schema);
            
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS %I_timecard_approval_history_tenant_entry_idx 
                ON %I.timecard_approval_history (tenant_id, timecard_entry_id)
            ', REPLACE(tenant_schema, '-', '_'), tenant_schema);
            
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS %I_digital_signature_keys_tenant_user_idx 
                ON %I.digital_signature_keys (tenant_id, user_id)
            ', REPLACE(tenant_schema, '-', '_'), tenant_schema);
            
            -- 7. ADD FOREIGN KEY CONSTRAINTS (NOT VALID first, then VALIDATE)
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = tenant_schema AND table_name = 'users'
            ) THEN
                EXECUTE format('
                    ALTER TABLE %I.timecard_entries 
                    ADD CONSTRAINT IF NOT EXISTS %I_timecard_entries_user_id_fk 
                    FOREIGN KEY (user_id) REFERENCES %I.users(id) NOT VALID
                ', tenant_schema, REPLACE(tenant_schema, '-', '_'), tenant_schema);
                
                EXECUTE format('
                    ALTER TABLE %I.timecard_entries 
                    ADD CONSTRAINT IF NOT EXISTS %I_timecard_entries_approved_by_fk 
                    FOREIGN KEY (approved_by) REFERENCES %I.users(id) NOT VALID
                ', tenant_schema, REPLACE(tenant_schema, '-', '_'), tenant_schema);
                
                -- Validate constraints after backfill
                EXECUTE format('ALTER TABLE %I.timecard_entries VALIDATE CONSTRAINT %I_timecard_entries_user_id_fk', 
                    tenant_schema, REPLACE(tenant_schema, '-', '_'));
                EXECUTE format('ALTER TABLE %I.timecard_entries VALIDATE CONSTRAINT %I_timecard_entries_approved_by_fk', 
                    tenant_schema, REPLACE(tenant_schema, '-', '_'));
            END IF;
            
            -- 8. ADD CHECK CONSTRAINTS
            EXECUTE format('
                ALTER TABLE %I.timecard_entries 
                ADD CONSTRAINT IF NOT EXISTS %I_timecard_entries_status_check 
                CHECK (status IN (''pending'', ''approved'', ''rejected''))
            ', tenant_schema, REPLACE(tenant_schema, '-', '_'));
            
            -- 9. INITIALIZE NSR SEQUENCE for specific tenant (if it''s the reference tenant)
            IF current_tenant_id = ''3f99462f-3621-4b1b-bea8-782acc50d62e''::uuid THEN
                EXECUTE format('
                    INSERT INTO %I.nsr_sequences (tenant_id, current_nsr, reset_period) 
                    VALUES (%L, 127, ''yearly'')
                    ON CONFLICT DO NOTHING
                ', tenant_schema, current_tenant_id);
            ELSE
                EXECUTE format('
                    INSERT INTO %I.nsr_sequences (tenant_id, current_nsr, reset_period) 
                    VALUES (%L, 0, ''yearly'')
                    ON CONFLICT DO NOTHING
                ', tenant_schema, current_tenant_id);
            END IF;
            
            success_count := success_count + 1;
            RAISE NOTICE 'Successfully processed schema: % (tenant: %)', tenant_schema, current_tenant_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE WARNING 'Error processing schema %: % - %', tenant_schema, SQLSTATE, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'CLT Compliance migration completed:';
    RAISE NOTICE '  Total schemas processed: %', schema_count;
    RAISE NOTICE '  Successful: %', success_count;
    RAISE NOTICE '  Errors: %', error_count;
    
    IF error_count > 0 THEN
        RAISE WARNING 'Some schemas had errors. Check logs above for details.';
    END IF;
    
END $$;