
-- Migration: Rename customer_companies to companies
-- This standardizes nomenclature across the entire system

-- For all tenant schemas, rename the table
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
        
        -- Rename customer_companies table to companies
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = tenant_schema 
            AND table_name = 'customer_companies'
        ) THEN
            EXECUTE format('ALTER TABLE %I.customer_companies RENAME TO companies', tenant_schema);
            RAISE NOTICE 'Renamed customer_companies to companies in %', tenant_schema;
        END IF;
        
        -- Rename customer_company_id columns to company_id
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = tenant_schema 
            AND table_name = 'tickets' 
            AND column_name = 'customer_company_id'
        ) THEN
            EXECUTE format('ALTER TABLE %I.tickets RENAME COLUMN customer_company_id TO company_id', tenant_schema);
            RAISE NOTICE 'Renamed customer_company_id to company_id in %.tickets', tenant_schema;
        END IF;
        
    END LOOP;
END $$;
