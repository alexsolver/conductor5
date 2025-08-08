
-- Fix customers table schema for production
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
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = tenant_schema 
            AND table_name = 'customers' 
            AND column_name = 'mobile_phone'
        ) THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN mobile_phone varchar(20)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = tenant_schema 
            AND table_name = 'customers' 
            AND column_name = 'customer_type'
        ) THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN customer_type varchar(10) DEFAULT ''PF''', tenant_schema);
        END IF;
        
        -- Add all other missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'cpf') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN cpf varchar(14)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'cnpj') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN cnpj varchar(18)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'company_name') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN company_name varchar(255)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'contact_person') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN contact_person varchar(255)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'state') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN state varchar(2)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'address') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN address text', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'address_number') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN address_number varchar(20)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'complement') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN complement varchar(100)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'neighborhood') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN neighborhood varchar(100)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'city') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN city varchar(100)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = tenant_schema AND table_name = 'customers' AND column_name = 'zip_code') THEN
            EXECUTE format('ALTER TABLE %I.customers ADD COLUMN zip_code varchar(10)', tenant_schema);
        END IF;
        
        -- Add constraint for customer_type
        BEGIN
            EXECUTE format('ALTER TABLE %I.customers ADD CONSTRAINT customer_type_check CHECK (customer_type IN (''PF'', ''PJ''))', tenant_schema);
        EXCEPTION
            WHEN duplicate_object THEN NULL; -- Constraint already exists
        END;
        
        -- Update existing records
        EXECUTE format('UPDATE %I.customers SET customer_type = ''PF'' WHERE customer_type IS NULL', tenant_schema);
        
        RAISE NOTICE 'Fixed customers table for schema %', tenant_schema;
    END LOOP;
END $$;
