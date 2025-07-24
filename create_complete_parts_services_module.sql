-- Create Complete Parts & Services Module with ALL functionalities
-- This script creates all 13 tables for the complete module across all tenant schemas

DO $$
DECLARE
    tenant_record RECORD;
    schema_name TEXT;
BEGIN
    -- Loop through all tenant schemas
    FOR tenant_record IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name ~ '^tenant_[a-f0-9]{8}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{12}$'
    LOOP
        schema_name := tenant_record.schema_name;
        
        RAISE NOTICE 'Creating Complete Parts & Services tables in schema: %', schema_name;
        
        -- ========================================
        -- 1. ITEMS CORE TABLES (Already exist, but ensuring they exist)
        -- ========================================
        
        -- Create items table (main items table)
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true,
                type VARCHAR(20) NOT NULL CHECK (type IN (''material'', ''service'')),
                name VARCHAR(255) NOT NULL,
                integration_code VARCHAR(100),
                description TEXT,
                unit_of_measure VARCHAR(50),
                default_maintenance_plan VARCHAR(255),
                "group" VARCHAR(100),
                default_checklist TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id),
                updated_by_id UUID REFERENCES users(id)
            );
        ', schema_name);

        -- Create item_attachments table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_attachments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                item_id UUID NOT NULL REFERENCES %I.items(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                original_file_name VARCHAR(255) NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                file_path TEXT NOT NULL,
                description TEXT,
                category VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id)
            );
        ', schema_name, schema_name);

        -- Create item_links table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_links (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                parent_item_id UUID NOT NULL REFERENCES %I.items(id) ON DELETE CASCADE,
                child_item_id UUID NOT NULL REFERENCES %I.items(id) ON DELETE CASCADE,
                link_type VARCHAR(50) DEFAULT ''related'' CHECK (link_type IN (''related'', ''component'', ''alternative'', ''upgrade'')),
                quantity DECIMAL(15,4) DEFAULT 1,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id),
                UNIQUE(parent_item_id, child_item_id)
            );
        ', schema_name, schema_name, schema_name);

        -- Create item_customer_links table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_customer_links (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                item_id UUID NOT NULL REFERENCES %I.items(id) ON DELETE CASCADE,
                customer_company_id UUID NOT NULL,
                nickname VARCHAR(255),
                sku VARCHAR(100),
                barcode VARCHAR(255),
                qr_code VARCHAR(255),
                is_asset BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id),
                updated_by_id UUID REFERENCES users(id),
                UNIQUE(item_id, customer_company_id)
            );
        ', schema_name, schema_name);

        -- Create item_supplier_links table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.item_supplier_links (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                item_id UUID NOT NULL REFERENCES %I.items(id) ON DELETE CASCADE,
                supplier_name VARCHAR(255) NOT NULL,
                supplier_code VARCHAR(100),
                part_number VARCHAR(255),
                supplier_description TEXT,
                qr_code VARCHAR(255),
                barcode VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id),
                updated_by_id UUID REFERENCES users(id)
            );
        ', schema_name, schema_name);

        -- ========================================
        -- 2. STOCK CONTROL TABLES
        -- ========================================
        
        -- Create stock_locations table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.stock_locations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50),
                type VARCHAR(20) NOT NULL CHECK (type IN (''fixed'', ''mobile'')),
                description TEXT,
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(50),
                zip_code VARCHAR(20),
                manager_id UUID REFERENCES users(id),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id),
                UNIQUE(tenant_id, code)
            );
        ', schema_name);

        -- Create stock_levels table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.stock_levels (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                item_id UUID NOT NULL REFERENCES %I.items(id) ON DELETE CASCADE,
                location_id UUID NOT NULL REFERENCES %I.stock_locations(id) ON DELETE CASCADE,
                current_quantity DECIMAL(15,4) DEFAULT 0,
                minimum_quantity DECIMAL(15,4) DEFAULT 0,
                maximum_quantity DECIMAL(15,4),
                reorder_point DECIMAL(15,4),
                economic_order_quantity DECIMAL(15,4),
                reserved_quantity DECIMAL(15,4) DEFAULT 0,
                available_quantity DECIMAL(15,4) DEFAULT 0,
                is_consignment BOOLEAN DEFAULT false,
                consignment_supplier_id UUID,
                last_inventory_date TIMESTAMP,
                last_inventory_by_id UUID REFERENCES users(id),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(item_id, location_id)
            );
        ', schema_name, schema_name, schema_name);

        -- Create stock_movements table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.stock_movements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                item_id UUID NOT NULL REFERENCES %I.items(id) ON DELETE CASCADE,
                location_id UUID NOT NULL REFERENCES %I.stock_locations(id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL CHECK (type IN (''inbound'', ''outbound'', ''transfer'', ''adjustment'', ''return'')),
                quantity DECIMAL(15,4) NOT NULL,
                unit_cost DECIMAL(15,2),
                total_cost DECIMAL(15,2),
                reference_type VARCHAR(50),
                reference_id UUID,
                reference_number VARCHAR(100),
                from_location_id UUID REFERENCES %I.stock_locations(id),
                to_location_id UUID REFERENCES %I.stock_locations(id),
                batch_number VARCHAR(100),
                serial_number VARCHAR(100),
                expiration_date DATE,
                notes TEXT,
                status VARCHAR(20) DEFAULT ''completed'' CHECK (status IN (''pending'', ''completed'', ''cancelled'')),
                movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id)
            );
        ', schema_name, schema_name, schema_name, schema_name, schema_name);

        -- ========================================
        -- 3. SUPPLIERS TABLES
        -- ========================================
        
        -- Create suppliers table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.suppliers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50),
                trade_name VARCHAR(255),
                tax_id VARCHAR(50),
                email VARCHAR(255),
                phone VARCHAR(20),
                website VARCHAR(255),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(50),
                zip_code VARCHAR(20),
                country VARCHAR(100) DEFAULT ''Brasil'',
                category VARCHAR(100),
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                is_approved BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                payment_terms VARCHAR(100),
                delivery_terms VARCHAR(100),
                contact_person_name VARCHAR(255),
                contact_person_email VARCHAR(255),
                contact_person_phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id),
                updated_by_id UUID REFERENCES users(id),
                UNIQUE(tenant_id, code)
            );
        ', schema_name);

        -- ========================================
        -- 5. SERVICE INTEGRATION TABLES
        -- ========================================
        
        -- Create service_kits table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.service_kits (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50),
                description TEXT,
                type VARCHAR(50) CHECK (type IN (''preventive'', ''corrective'', ''predictive'')),
                equipment_brand VARCHAR(100),
                equipment_model VARCHAR(100),
                equipment_type VARCHAR(100),
                estimated_duration INTEGER,
                skill_requirements TEXT[],
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id),
                updated_by_id UUID REFERENCES users(id),
                UNIQUE(tenant_id, code)
            );
        ', schema_name);

        -- Create service_kit_items table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.service_kit_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                service_kit_id UUID NOT NULL REFERENCES %I.service_kits(id) ON DELETE CASCADE,
                item_id UUID NOT NULL REFERENCES %I.items(id) ON DELETE CASCADE,
                quantity DECIMAL(15,4) NOT NULL,
                is_optional BOOLEAN DEFAULT false,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id),
                UNIQUE(service_kit_id, item_id)
            );
        ', schema_name, schema_name, schema_name);

        -- ========================================
        -- 8. PRICE LISTS TABLES (LPU)
        -- ========================================
        
        -- Create price_lists table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.price_lists (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50),
                description TEXT,
                version VARCHAR(20) DEFAULT ''1.0'',
                valid_from DATE NOT NULL,
                valid_to DATE,
                customer_company_id UUID,
                contract_id UUID,
                region VARCHAR(100),
                channel VARCHAR(100),
                currency VARCHAR(10) DEFAULT ''BRL'',
                includes_vat BOOLEAN DEFAULT true,
                vat_rate DECIMAL(5,2) DEFAULT 0,
                status VARCHAR(20) DEFAULT ''draft'' CHECK (status IN (''draft'', ''active'', ''expired'', ''superseded'')),
                is_active BOOLEAN DEFAULT true,
                approved_at TIMESTAMP,
                approved_by_id UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id),
                updated_by_id UUID REFERENCES users(id),
                UNIQUE(tenant_id, code)
            );
        ', schema_name);

        -- Create price_list_items table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.price_list_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                price_list_id UUID NOT NULL REFERENCES %I.price_lists(id) ON DELETE CASCADE,
                item_id UUID NOT NULL REFERENCES %I.items(id) ON DELETE CASCADE,
                unit_price DECIMAL(15,4) NOT NULL,
                cost DECIMAL(15,4),
                margin DECIMAL(5,2),
                minimum_quantity DECIMAL(15,4) DEFAULT 1,
                maximum_quantity DECIMAL(15,4),
                discount_percentage DECIMAL(5,2) DEFAULT 0,
                is_special_price BOOLEAN DEFAULT false,
                special_price_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(price_list_id, item_id)
            );
        ', schema_name, schema_name, schema_name);

        -- ========================================
        -- 10. COMPLIANCE TABLES
        -- ========================================
        
        -- Create audit_logs table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                table_name VARCHAR(100) NOT NULL,
                record_id UUID NOT NULL,
                operation VARCHAR(20) NOT NULL CHECK (operation IN (''create'', ''update'', ''delete'', ''view'')),
                old_values JSONB,
                new_values JSONB,
                changed_fields TEXT[],
                user_id UUID REFERENCES users(id),
                ip_address VARCHAR(45),
                user_agent TEXT,
                session_id VARCHAR(100),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ', schema_name);

        -- Create quality_certifications table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.quality_certifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50),
                type VARCHAR(50) CHECK (type IN (''ISO'', ''ABNT'', ''custom'')),
                description TEXT,
                issued_date DATE,
                expiration_date DATE,
                renewal_date DATE,
                issuer_name VARCHAR(255),
                issuer_contact VARCHAR(255),
                scope TEXT,
                applicable_items TEXT[],
                certificate_file_path TEXT,
                audit_report_path TEXT,
                status VARCHAR(20) DEFAULT ''active'' CHECK (status IN (''active'', ''expired'', ''suspended'', ''revoked'')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID REFERENCES users(id)
            );
        ', schema_name);

        -- ========================================
        -- CREATE INDEXES FOR PERFORMANCE
        -- ========================================
        
        -- Items table indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_items_tenant_idx ON %I.items(tenant_id);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_items_type_idx ON %I.items(type);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_items_active_idx ON %I.items(is_active);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_items_group_idx ON %I.items("group");', schema_name, schema_name);
        
        -- Item attachments indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_item_attachments_tenant_item_idx ON %I.item_attachments(tenant_id, item_id);', schema_name, schema_name);
        
        -- Item links indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_item_links_tenant_parent_idx ON %I.item_links(tenant_id, parent_item_id);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_item_links_tenant_child_idx ON %I.item_links(tenant_id, child_item_id);', schema_name, schema_name);
        
        -- Stock locations indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_stock_locations_tenant_idx ON %I.stock_locations(tenant_id);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_stock_locations_type_idx ON %I.stock_locations(type);', schema_name, schema_name);
        
        -- Stock levels indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_stock_levels_tenant_item_idx ON %I.stock_levels(tenant_id, item_id);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_stock_levels_tenant_location_idx ON %I.stock_levels(tenant_id, location_id);', schema_name, schema_name);
        
        -- Stock movements indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_stock_movements_tenant_item_idx ON %I.stock_movements(tenant_id, item_id);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_stock_movements_date_idx ON %I.stock_movements(movement_date);', schema_name, schema_name);
        
        -- Suppliers indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_suppliers_tenant_idx ON %I.suppliers(tenant_id);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_suppliers_active_idx ON %I.suppliers(is_active);', schema_name, schema_name);
        
        -- Service kits indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_service_kits_tenant_idx ON %I.service_kits(tenant_id);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_service_kits_type_idx ON %I.service_kits(type);', schema_name, schema_name);
        
        -- Price lists indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_price_lists_tenant_idx ON %I.price_lists(tenant_id);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_price_lists_status_idx ON %I.price_lists(status);', schema_name, schema_name);
        
        -- Audit logs indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_audit_logs_tenant_idx ON %I.audit_logs(tenant_id);', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_audit_logs_timestamp_idx ON %I.audit_logs(timestamp);', schema_name, schema_name);
        
        RAISE NOTICE 'Completed creating tables and indexes in schema: %', schema_name;
    END LOOP;
    
    RAISE NOTICE 'Successfully created complete Parts & Services module with 13 tables across all tenant schemas!';
END $$;