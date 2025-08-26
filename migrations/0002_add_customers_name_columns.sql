
-- Migration: Complete customers table with all required fields
-- Adds all missing columns to customers table in all tenant schemas

DO $$
DECLARE
    tenant_schema TEXT;
    tenant_cursor CURSOR FOR 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%';
BEGIN
    RAISE NOTICE 'Starting complete customers table migration...';

    -- Fix all tenant schemas
    FOR tenant_record IN tenant_cursor LOOP
        tenant_schema := tenant_record.schema_name;
        
        RAISE NOTICE 'Processing schema: %', tenant_schema;
        
        -- Verify if customers table exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = tenant_schema 
            AND table_name = 'customers'
        ) THEN
            
            -- Add first_name column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'first_name'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN first_name varchar(255) NOT NULL DEFAULT ''''', tenant_schema);
                RAISE NOTICE 'Added first_name column to %.customers', tenant_schema;
            END IF;
            
            -- Add last_name column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'last_name'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN last_name varchar(255) NOT NULL DEFAULT ''''', tenant_schema);
                RAISE NOTICE 'Added last_name column to %.customers', tenant_schema;
            END IF;

            -- Add phone column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'phone'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN phone varchar(20)', tenant_schema);
                RAISE NOTICE 'Added phone column to %.customers', tenant_schema;
            END IF;
            
            -- Add mobile_phone column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'mobile_phone'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN mobile_phone varchar(20)', tenant_schema);
                RAISE NOTICE 'Added mobile_phone column to %.customers', tenant_schema;
            END IF;
        
            -- Add customer_type column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'customer_type'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN customer_type varchar(10) DEFAULT ''PF'' NOT NULL', tenant_schema);
                RAISE NOTICE 'Added customer_type column to %.customers', tenant_schema;
            END IF;

            -- Add cpf column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'cpf'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN cpf varchar(14)', tenant_schema);
                RAISE NOTICE 'Added cpf column to %.customers', tenant_schema;
            END IF;

            -- Add cnpj column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'cnpj'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN cnpj varchar(18)', tenant_schema);
                RAISE NOTICE 'Added cnpj column to %.customers', tenant_schema;
            END IF;

            -- Add company_name column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'company_name'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN company_name varchar(255)', tenant_schema);
                RAISE NOTICE 'Added company_name column to %.customers', tenant_schema;
            END IF;

            -- Add contact_person column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'contact_person'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN contact_person varchar(255)', tenant_schema);
                RAISE NOTICE 'Added contact_person column to %.customers', tenant_schema;
            END IF;

            -- Add state column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'state'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN state varchar(2)', tenant_schema);
                RAISE NOTICE 'Added state column to %.customers', tenant_schema;
            END IF;

            -- Add address column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'address'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN address text', tenant_schema);
                RAISE NOTICE 'Added address column to %.customers', tenant_schema;
            END IF;
        
            -- Add address_number column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'address_number'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN address_number varchar(20)', tenant_schema);
                RAISE NOTICE 'Added address_number column to %.customers', tenant_schema;
            END IF;
        
            -- Add complement column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'complement'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN complement varchar(100)', tenant_schema);
                RAISE NOTICE 'Added complement column to %.customers', tenant_schema;
            END IF;
        
            -- Add neighborhood column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'neighborhood'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN neighborhood varchar(100)', tenant_schema);
                RAISE NOTICE 'Added neighborhood column to %.customers', tenant_schema;
            END IF;
        
            -- Add city column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'city'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN city varchar(100)', tenant_schema);
                RAISE NOTICE 'Added city column to %.customers', tenant_schema;
            END IF;

            -- Add zip_code column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'zip_code'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN zip_code varchar(10)', tenant_schema);
                RAISE NOTICE 'Added zip_code column to %.customers', tenant_schema;
            END IF;

            -- Add tenant_id column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'tenant_id'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN tenant_id uuid NOT NULL DEFAULT ''%''::uuid', tenant_schema, REPLACE(tenant_schema, 'tenant_', ''));
                RAISE NOTICE 'Added tenant_id column to %.customers', tenant_schema;
            END IF;

            -- Add is_active column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'is_active'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN is_active boolean DEFAULT true NOT NULL', tenant_schema);
                RAISE NOTICE 'Added is_active column to %.customers', tenant_schema;
            END IF;

            -- Add created_at column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'created_at'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL', tenant_schema);
                RAISE NOTICE 'Added created_at column to %.customers', tenant_schema;
            END IF;

            -- Add updated_at column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = tenant_schema 
                AND table_name = 'customers' 
                AND column_name = 'updated_at'
            ) THEN
                EXECUTE format('ALTER TABLE %I.customers ADD COLUMN updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL', tenant_schema);
                RAISE NOTICE 'Added updated_at column to %.customers', tenant_schema;
            END IF;

            -- Clean up invalid data before applying constraints
            EXECUTE format('UPDATE %I.customers SET customer_type = ''PF'' WHERE customer_type IS NULL OR customer_type NOT IN (''PF'', ''PJ'')', tenant_schema);
            
            -- Drop existing constraint if it exists
            BEGIN
                EXECUTE format('ALTER TABLE %I.customers DROP CONSTRAINT IF EXISTS customer_type_check', tenant_schema);
            EXCEPTION
                WHEN OTHERS THEN NULL;
            END;
            
            -- Add constraint for customer_type
            EXECUTE format('ALTER TABLE %I.customers ADD CONSTRAINT customer_type_check CHECK (customer_type IN (''PF'', ''PJ''))', tenant_schema);
            
            -- Create unique constraint for tenant_id + email
            BEGIN
                EXECUTE format('ALTER TABLE %I.customers DROP CONSTRAINT IF EXISTS customers_tenant_email_unique', tenant_schema);
                EXECUTE format('ALTER TABLE %I.customers ADD CONSTRAINT customers_tenant_email_unique UNIQUE (tenant_id, email)', tenant_schema);
            EXCEPTION
                WHEN OTHERS THEN 
                    RAISE NOTICE 'Could not create unique constraint for %.customers - may have duplicate data', tenant_schema;
            END;

            -- Create performance indexes
            BEGIN
                EXECUTE format('CREATE INDEX IF NOT EXISTS idx_customers_tenant_email_%s ON %I.customers (tenant_id, email)', REPLACE(tenant_schema, 'tenant_', ''), tenant_schema);
                EXECUTE format('CREATE INDEX IF NOT EXISTS idx_customers_tenant_active_%s ON %I.customers (tenant_id, is_active) WHERE is_active = true', REPLACE(tenant_schema, 'tenant_', ''), tenant_schema);
                EXECUTE format('CREATE INDEX IF NOT EXISTS idx_customers_tenant_type_%s ON %I.customers (tenant_id, customer_type)', REPLACE(tenant_schema, 'tenant_', ''), tenant_schema);
                EXECUTE format('CREATE INDEX IF NOT EXISTS idx_customers_tenant_name_%s ON %I.customers (tenant_id, first_name, last_name)', REPLACE(tenant_schema, 'tenant_', ''), tenant_schema);
            EXCEPTION
                WHEN OTHERS THEN 
                    RAISE NOTICE 'Some indexes could not be created for %.customers', tenant_schema;
            END;
            
            RAISE NOTICE '✅ Successfully updated customers table for schema: %', tenant_schema;
            
        ELSE
            RAISE NOTICE '⚠️ Customers table not found in schema: %', tenant_schema;
        END IF;
    END LOOP;

    RAISE NOTICE '🎉 Complete customers table migration finished successfully!';
END $$;
