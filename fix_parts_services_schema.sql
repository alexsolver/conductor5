
-- Fix Parts & Services Schema - Complete Resolution
DO $$ 
DECLARE
    tenant_schema TEXT;
    tenant_record RECORD;
BEGIN
    -- Get all tenant schemas
    FOR tenant_record IN 
        SELECT DISTINCT table_schema 
        FROM information_schema.tables 
        WHERE table_schema LIKE 'tenant_%' 
        AND table_name = 'parts'
    LOOP
        tenant_schema := tenant_record.table_schema;
        
        RAISE NOTICE 'Fixing schema: %', tenant_schema;
        
        -- Fix PARTS table
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'parts' AND column_name = 'internal_code') THEN
            EXECUTE format('ALTER TABLE %I.parts ADD COLUMN internal_code VARCHAR(100)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'parts' AND column_name = 'manufacturer_code') THEN
            EXECUTE format('ALTER TABLE %I.parts ADD COLUMN manufacturer_code VARCHAR(100)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'parts' AND column_name = 'margin_percentage') THEN
            EXECUTE format('ALTER TABLE %I.parts ADD COLUMN margin_percentage DECIMAL(5,2)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'parts' AND column_name = 'abc_classification') THEN
            EXECUTE format('ALTER TABLE %I.parts ADD COLUMN abc_classification VARCHAR(1)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'parts' AND column_name = 'weight_kg') THEN
            EXECUTE format('ALTER TABLE %I.parts ADD COLUMN weight_kg DECIMAL(10,3)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'parts' AND column_name = 'material') THEN
            EXECUTE format('ALTER TABLE %I.parts ADD COLUMN material VARCHAR(100)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'parts' AND column_name = 'voltage') THEN
            EXECUTE format('ALTER TABLE %I.parts ADD COLUMN voltage VARCHAR(50)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'parts' AND column_name = 'power_watts') THEN
            EXECUTE format('ALTER TABLE %I.parts ADD COLUMN power_watts DECIMAL(10,2)', tenant_schema);
        END IF;

        -- Fix SUPPLIERS table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'supplier_code') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN supplier_code VARCHAR(100)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'trade_name') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN trade_name VARCHAR(255)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'document_number') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN document_number VARCHAR(18)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'contact_name') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN contact_name VARCHAR(255)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'city') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN city VARCHAR(100)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'state') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN state VARCHAR(2)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'country') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN country VARCHAR(100) DEFAULT ''Brasil''', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'payment_terms') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN payment_terms VARCHAR(255)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'lead_time_days') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN lead_time_days INTEGER DEFAULT 7', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'supplier_type') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN supplier_type VARCHAR(20) DEFAULT ''regular''', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'quality_rating') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN quality_rating DECIMAL(3,2) DEFAULT 4.0', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'delivery_rating') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN delivery_rating DECIMAL(3,2) DEFAULT 4.0', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'price_rating') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN price_rating DECIMAL(3,2) DEFAULT 4.0', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'suppliers' AND column_name = 'overall_rating') THEN
            EXECUTE format('ALTER TABLE %I.suppliers ADD COLUMN overall_rating DECIMAL(3,2) DEFAULT 4.0', tenant_schema);
        END IF;

        -- Fix INVENTORY table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'inventory' AND column_name = 'location') THEN
            EXECUTE format('ALTER TABLE %I.inventory ADD COLUMN location VARCHAR(100)', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'inventory' AND column_name = 'current_stock') THEN
            EXECUTE format('ALTER TABLE %I.inventory ADD COLUMN current_stock INTEGER DEFAULT 0', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'inventory' AND column_name = 'minimum_stock') THEN
            EXECUTE format('ALTER TABLE %I.inventory ADD COLUMN minimum_stock INTEGER DEFAULT 0', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'inventory' AND column_name = 'maximum_stock') THEN
            EXECUTE format('ALTER TABLE %I.inventory ADD COLUMN maximum_stock INTEGER DEFAULT 0', tenant_schema);
        END IF;

        -- Add compatibility aliases
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'inventory' AND column_name = 'min_stock') THEN
            EXECUTE format('ALTER TABLE %I.inventory ADD COLUMN min_stock INTEGER GENERATED ALWAYS AS (minimum_stock) STORED', tenant_schema);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = tenant_schema AND table_name = 'inventory' AND column_name = 'max_stock') THEN
            EXECUTE format('ALTER TABLE %I.inventory ADD COLUMN max_stock INTEGER GENERATED ALWAYS AS (maximum_stock) STORED', tenant_schema);
        END IF;

        -- Update existing data with safe defaults
        EXECUTE format('UPDATE %I.parts SET internal_code = part_number WHERE internal_code IS NULL AND part_number IS NOT NULL', tenant_schema);
        EXECUTE format('UPDATE %I.parts SET manufacturer_code = part_number WHERE manufacturer_code IS NULL AND part_number IS NOT NULL', tenant_schema);
        EXECUTE format('UPDATE %I.parts SET abc_classification = ''B'' WHERE abc_classification IS NULL', tenant_schema);
        
        EXECUTE format('UPDATE %I.suppliers SET supplier_code = CONCAT(''FORN'', LPAD(id::text, 3, ''0'')) WHERE supplier_code IS NULL', tenant_schema);
        EXECUTE format('UPDATE %I.suppliers SET trade_name = name WHERE trade_name IS NULL AND name IS NOT NULL', tenant_schema);
        
        EXECUTE format('UPDATE %I.inventory SET current_stock = COALESCE(quantity, 0) WHERE current_stock IS NULL', tenant_schema);
        EXECUTE format('UPDATE %I.inventory SET minimum_stock = 5 WHERE minimum_stock IS NULL', tenant_schema);
        EXECUTE format('UPDATE %I.inventory SET maximum_stock = 100 WHERE maximum_stock IS NULL', tenant_schema);
        EXECUTE format('UPDATE %I.inventory SET location = ''Estoque Principal'' WHERE location IS NULL', tenant_schema);

        RAISE NOTICE 'Schema % fixed successfully', tenant_schema;
    END LOOP;
    
    RAISE NOTICE 'All tenant schemas updated successfully';
END $$;
