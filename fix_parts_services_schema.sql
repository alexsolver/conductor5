
-- Fix Parts & Services Schema
DO $$ 
BEGIN
    -- Add missing columns to parts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'internal_code') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts ADD COLUMN internal_code VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'manufacturer_code') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts ADD COLUMN manufacturer_code VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'margin_percentage') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts ADD COLUMN margin_percentage DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'abc_classification') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts ADD COLUMN abc_classification VARCHAR(1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'weight_kg') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts ADD COLUMN weight_kg DECIMAL(10,3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'material') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts ADD COLUMN material VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'voltage') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts ADD COLUMN voltage VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'power_watts') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts ADD COLUMN power_watts DECIMAL(10,2);
    END IF;

    -- Update existing parts with default values
    UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts 
    SET internal_code = CONCAT('INT', LPAD(id::text, 6, '0'))
    WHERE internal_code IS NULL;
    
    UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.parts 
    SET manufacturer_code = CONCAT('MFG', LPAD(id::text, 6, '0'))
    WHERE manufacturer_code IS NULL;

    -- Add missing columns to suppliers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'supplier_code') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN supplier_code VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'trade_name') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN trade_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'document_number') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN document_number VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'contact_name') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN contact_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'city') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'state') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN state VARCHAR(2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'country') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN country VARCHAR(100) DEFAULT 'Brasil';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'payment_terms') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN payment_terms VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'lead_time_days') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN lead_time_days INTEGER DEFAULT 7;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'supplier_type') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN supplier_type VARCHAR(50) DEFAULT 'regular';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'quality_rating') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN quality_rating DECIMAL(3,2) DEFAULT 4.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'delivery_rating') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN delivery_rating DECIMAL(3,2) DEFAULT 4.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'price_rating') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN price_rating DECIMAL(3,2) DEFAULT 4.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'overall_rating') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers ADD COLUMN overall_rating DECIMAL(3,2) DEFAULT 4.0;
    END IF;

    -- Update existing suppliers with default values
    UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers 
    SET supplier_code = CONCAT('FORN', LPAD(id::text, 3, '0'))
    WHERE supplier_code IS NULL;
    
    UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.suppliers 
    SET trade_name = name
    WHERE trade_name IS NULL;

    -- Add missing columns to inventory table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'current_stock') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.inventory ADD COLUMN current_stock INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'location') THEN
        ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.inventory ADD COLUMN location VARCHAR(255);
    END IF;

    -- Update existing inventory with default values
    UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.inventory 
    SET current_stock = COALESCE(quantity, 0)
    WHERE current_stock IS NULL;
    
    UPDATE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.inventory 
    SET location = 'Estoque Principal'
    WHERE location IS NULL;

END $$;
