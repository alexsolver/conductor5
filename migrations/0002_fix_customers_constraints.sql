
-- Enhanced customers table constraints and indexes
DO $$
DECLARE
    tenant_schema TEXT;
    tenant_cursor CURSOR FOR 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%';
BEGIN
    FOR tenant_record IN tenant_cursor LOOP
        tenant_schema := tenant_record.schema_name;
        
        -- Add NOT NULL constraints for required fields
        BEGIN
            EXECUTE format('ALTER TABLE %I.customers ALTER COLUMN first_name SET NOT NULL', tenant_schema);
            EXECUTE format('ALTER TABLE %I.customers ALTER COLUMN last_name SET NOT NULL', tenant_schema);
            EXECUTE format('ALTER TABLE %I.customers ALTER COLUMN email SET NOT NULL', tenant_schema);
            EXECUTE format('ALTER TABLE %I.customers ALTER COLUMN tenant_id SET NOT NULL', tenant_schema);
        EXCEPTION
            WHEN OTHERS THEN 
                RAISE NOTICE 'Could not add NOT NULL constraints to %: %', tenant_schema, SQLERRM;
        END;
        
        -- Add email format validation
        BEGIN
            EXECUTE format('ALTER TABLE %I.customers DROP CONSTRAINT IF EXISTS email_format_check', tenant_schema);
            EXECUTE format('ALTER TABLE %I.customers ADD CONSTRAINT email_format_check CHECK (email ~* ''^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'')', tenant_schema);
        EXCEPTION
            WHEN OTHERS THEN 
                RAISE NOTICE 'Could not add email validation to %: %', tenant_schema, SQLERRM;
        END;
        
        -- Fix customer_type constraint with proper data cleanup
        BEGIN
            -- First update invalid data
            EXECUTE format('UPDATE %I.customers SET customer_type = ''PF'' WHERE customer_type IS NULL OR customer_type NOT IN (''PF'', ''PJ'')', tenant_schema);
            
            -- Drop and recreate constraint
            EXECUTE format('ALTER TABLE %I.customers DROP CONSTRAINT IF EXISTS customer_type_check', tenant_schema);
            EXECUTE format('ALTER TABLE %I.customers ADD CONSTRAINT customer_type_check CHECK (customer_type IN (''PF'', ''PJ''))', tenant_schema);
        EXCEPTION
            WHEN OTHERS THEN 
                RAISE NOTICE 'Could not fix customer_type constraint in %: %', tenant_schema, SQLERRM;
        END;
        
        -- Add CPF/CNPJ validation constraints
        BEGIN
            EXECUTE format('ALTER TABLE %I.customers DROP CONSTRAINT IF EXISTS cpf_format_check', tenant_schema);
            EXECUTE format('ALTER TABLE %I.customers ADD CONSTRAINT cpf_format_check CHECK (cpf IS NULL OR length(regexp_replace(cpf, ''[^0-9]'', '''', ''g'')) = 11)', tenant_schema);
            
            EXECUTE format('ALTER TABLE %I.customers DROP CONSTRAINT IF EXISTS cnpj_format_check', tenant_schema);
            EXECUTE format('ALTER TABLE %I.customers ADD CONSTRAINT cnpj_format_check CHECK (cnpj IS NULL OR length(regexp_replace(cnpj, ''[^0-9]'', '''', ''g'')) = 14)', tenant_schema);
        EXCEPTION
            WHEN OTHERS THEN 
                RAISE NOTICE 'Could not add document validation to %: %', tenant_schema, SQLERRM;
        END;
        
        -- Business rule: PJ must have company_name
        BEGIN
            EXECUTE format('ALTER TABLE %I.customers DROP CONSTRAINT IF EXISTS pj_company_name_check', tenant_schema);
            EXECUTE format('ALTER TABLE %I.customers ADD CONSTRAINT pj_company_name_check CHECK (customer_type != ''PJ'' OR (customer_type = ''PJ'' AND company_name IS NOT NULL AND length(trim(company_name)) > 0))', tenant_schema);
        EXCEPTION
            WHEN OTHERS THEN 
                RAISE NOTICE 'Could not add PJ business rule to %: %', tenant_schema, SQLERRM;
        END;
        
        -- Create performance indexes
        BEGIN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_customers_email_%s ON %I.customers (email)', replace(tenant_schema, 'tenant_', ''), tenant_schema);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_customers_type_%s ON %I.customers (customer_type)', replace(tenant_schema, 'tenant_', ''), tenant_schema);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_customers_active_%s ON %I.customers (is_active) WHERE is_active = true', replace(tenant_schema, 'tenant_', ''), tenant_schema);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_customers_name_%s ON %I.customers (first_name, last_name)', replace(tenant_schema, 'tenant_', ''), tenant_schema);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_customers_tenant_%s ON %I.customers (tenant_id)', replace(tenant_schema, 'tenant_', ''), tenant_schema);
        EXCEPTION
            WHEN OTHERS THEN 
                RAISE NOTICE 'Could not create indexes for %: %', tenant_schema, SQLERRM;
        END;
        
        RAISE NOTICE 'Enhanced customers table constraints and indexes for schema %', tenant_schema;
    END LOOP;
END $$;
