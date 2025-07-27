-- Migration para refatorar tabela favorecidos
-- Criar nova tabela favorecidos refatorada

DO $$
DECLARE
    schema_name text;
    tenant_schemas text[] := ARRAY[
        'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e',
        'tenant_715c510a_3db5_4510_880a_9a1a5c320100', 
        'tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a',
        'tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056'
    ];
BEGIN
    FOREACH schema_name IN ARRAY tenant_schemas
    LOOP
        RAISE NOTICE 'Refactoring favorecidos table in schema: %', schema_name;
        
        -- Drop existing favorecidos table if exists
        EXECUTE format('DROP TABLE IF EXISTS %I.favorecidos CASCADE', schema_name);
        
        -- Create new favorecidos table with simplified fields
        EXECUTE format('
            CREATE TABLE %I.favorecidos (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                birth_date DATE,
                rg VARCHAR(20),
                cpf_cnpj VARCHAR(20),
                is_active BOOLEAN DEFAULT true,
                customer_code VARCHAR(50),
                phone VARCHAR(20),
                cell_phone VARCHAR(20),
                contact_person VARCHAR(255),
                contact_phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )', schema_name);
            
        -- Create favorecidos_locations association table
        EXECUTE format('
            CREATE TABLE %I.favorecidos_locations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                favorecido_id UUID NOT NULL,
                location_id UUID NOT NULL,
                is_primary BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW()
            )', schema_name);
            
        -- Create indexes
        EXECUTE format('CREATE INDEX favorecidos_tenant_id_idx ON %I.favorecidos (tenant_id)', schema_name);
        EXECUTE format('CREATE INDEX favorecidos_tenant_email_idx ON %I.favorecidos (tenant_id, email)', schema_name);
        EXECUTE format('CREATE INDEX favorecidos_tenant_active_idx ON %I.favorecidos (tenant_id, is_active)', schema_name);
        EXECUTE format('CREATE INDEX favorecidos_customer_code_idx ON %I.favorecidos (tenant_id, customer_code)', schema_name);
        EXECUTE format('CREATE UNIQUE INDEX favorecidos_tenant_email_unique ON %I.favorecidos (tenant_id, email)', schema_name);
        
        EXECUTE format('CREATE INDEX favorecidos_locations_tenant_idx ON %I.favorecidos_locations (tenant_id)', schema_name);
        EXECUTE format('CREATE INDEX favorecidos_locations_favorecido_idx ON %I.favorecidos_locations (favorecido_id)', schema_name);
        EXECUTE format('CREATE INDEX favorecidos_locations_location_idx ON %I.favorecidos_locations (location_id)', schema_name);
        EXECUTE format('CREATE UNIQUE INDEX favorecidos_locations_unique ON %I.favorecidos_locations (favorecido_id, location_id)', schema_name);
        
        -- Add foreign key constraints if locations table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'locations') THEN
            EXECUTE format('ALTER TABLE %I.favorecidos_locations ADD CONSTRAINT fk_favorecidos_locations_favorecido FOREIGN KEY (favorecido_id) REFERENCES %I.favorecidos(id) ON DELETE CASCADE', schema_name, schema_name);
            EXECUTE format('ALTER TABLE %I.favorecidos_locations ADD CONSTRAINT fk_favorecidos_locations_location FOREIGN KEY (location_id) REFERENCES %I.locations(id) ON DELETE CASCADE', schema_name, schema_name);
        END IF;
        
        RAISE NOTICE 'Successfully refactored favorecidos table in schema: %', schema_name;
    END LOOP;
END $$;
