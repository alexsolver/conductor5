
-- Fix chatbot schema foreign key issues
-- Drop and recreate foreign key constraints properly

-- First drop existing foreign keys that might be causing issues
ALTER TABLE chatbot_flows DROP CONSTRAINT IF EXISTS chatbot_flows_bot_id_fkey;
ALTER TABLE chatbot_nodes DROP CONSTRAINT IF EXISTS chatbot_nodes_flow_id_fkey;
ALTER TABLE chatbot_edges DROP CONSTRAINT IF EXISTS chatbot_edges_flow_id_fkey;
ALTER TABLE chatbot_variables DROP CONSTRAINT IF EXISTS chatbot_variables_flow_id_fkey;

-- Ensure all tenant schemas have the correct structure
DO $$
DECLARE
    tenant_schema text;
    tenant_schemas text[] := ARRAY[
        'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e'
        -- Add other tenant schemas as needed
    ];
    schema_name text;
BEGIN
    FOREACH schema_name IN ARRAY tenant_schemas
    LOOP
        -- Check if schema exists
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = schema_name) THEN
            -- Drop existing foreign keys in tenant schema
            EXECUTE format('ALTER TABLE %I.chatbot_flows DROP CONSTRAINT IF EXISTS chatbot_flows_bot_id_fkey', schema_name);
            EXECUTE format('ALTER TABLE %I.chatbot_nodes DROP CONSTRAINT IF EXISTS chatbot_nodes_flow_id_fkey', schema_name);
            EXECUTE format('ALTER TABLE %I.chatbot_edges DROP CONSTRAINT IF EXISTS chatbot_edges_flow_id_fkey', schema_name);
            EXECUTE format('ALTER TABLE %I.chatbot_variables DROP CONSTRAINT IF EXISTS chatbot_variables_flow_id_fkey', schema_name);
            
            -- Ensure tables exist and have proper structure
            EXECUTE format('
                CREATE TABLE IF NOT EXISTS %I.chatbot_bots (
                    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id varchar(36) NOT NULL,
                    name varchar(255) NOT NULL,
                    description text,
                    is_enabled boolean DEFAULT true NOT NULL,
                    default_language varchar(10) DEFAULT ''pt-BR'' NOT NULL,
                    fallback_to_human boolean DEFAULT true NOT NULL,
                    timeout integer DEFAULT 300 NOT NULL,
                    max_retries integer DEFAULT 3 NOT NULL,
                    created_at timestamp DEFAULT now() NOT NULL,
                    updated_at timestamp DEFAULT now() NOT NULL
                )
            ', schema_name);
            
            EXECUTE format('
                CREATE TABLE IF NOT EXISTS %I.chatbot_flows (
                    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
                    bot_id varchar(36) NOT NULL,
                    name varchar(255) NOT NULL,
                    description text,
                    nodes jsonb DEFAULT ''[]''::jsonb NOT NULL,
                    edges jsonb DEFAULT ''[]''::jsonb NOT NULL,
                    variables jsonb DEFAULT ''[]''::jsonb NOT NULL,
                    is_active boolean DEFAULT false NOT NULL,
                    tenant_id varchar(36) NOT NULL,
                    created_at timestamp DEFAULT now() NOT NULL,
                    updated_at timestamp DEFAULT now() NOT NULL
                )
            ', schema_name);
            
            -- Create proper indexes
            EXECUTE format('CREATE INDEX IF NOT EXISTS chatbot_flows_bot_idx ON %I.chatbot_flows(bot_id)', schema_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS chatbot_flows_tenant_idx ON %I.chatbot_flows(tenant_id)', schema_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS chatbot_bots_tenant_idx ON %I.chatbot_bots(tenant_id)', schema_name);
            
        END IF;
    END LOOP;
END $$;
