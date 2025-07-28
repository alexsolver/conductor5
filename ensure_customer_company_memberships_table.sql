
-- Ensure customer_company_memberships table exists for all tenant schemas
DO $$
DECLARE
    tenant_schema TEXT;
    tenant_schemas TEXT[] := ARRAY[
        'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e',
        'tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a',
        'tenant_715c510a_3db5_4510_880a_9a1a5c320100',
        'tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056'
    ];
BEGIN
    FOREACH tenant_schema IN ARRAY tenant_schemas
    LOOP
        -- Check if schema exists
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = tenant_schema) THEN
            -- Create customer_company_memberships table if it doesn't exist
            EXECUTE format('
                CREATE TABLE IF NOT EXISTS "%s"."customer_company_memberships" (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    customer_id UUID NOT NULL,
                    company_id UUID NOT NULL,
                    role VARCHAR(50) DEFAULT ''member'',
                    is_primary BOOLEAN DEFAULT false,
                    title VARCHAR(255),
                    department VARCHAR(255),
                    tenant_id UUID NOT NULL,
                    created_by UUID,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    
                    -- Foreign key constraints
                    CONSTRAINT fk_ccm_customer 
                        FOREIGN KEY (customer_id, tenant_id) 
                        REFERENCES "%s".customers(id, tenant_id) 
                        ON DELETE CASCADE,
                    
                    CONSTRAINT fk_ccm_company 
                        FOREIGN KEY (company_id, tenant_id) 
                        REFERENCES "%s"."customer_companies"(id, tenant_id) 
                        ON DELETE CASCADE,
                    
                    -- Unique constraint to prevent duplicate memberships
                    CONSTRAINT uk_customer_company_tenant 
                        UNIQUE (customer_id, company_id, tenant_id)
                );
            ', tenant_schema, tenant_schema, tenant_schema);
            
            -- Create indexes for performance
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS idx_ccm_customer_tenant 
                ON "%s"."customer_company_memberships" (customer_id, tenant_id);
            ', tenant_schema);
            
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS idx_ccm_company_tenant 
                ON "%s"."customer_company_memberships" (company_id, tenant_id);
            ', tenant_schema);
            
            EXECUTE format('
                CREATE INDEX IF NOT EXISTS idx_ccm_tenant_primary 
                ON "%s"."customer_company_memberships" (tenant_id, is_primary);
            ', tenant_schema);
            
            RAISE NOTICE 'Customer company memberships table ensured for schema: %', tenant_schema;
        ELSE
            RAISE NOTICE 'Schema % does not exist, skipping', tenant_schema;
        END IF;
    END LOOP;
END $$;
