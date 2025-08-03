
-- Migration: Add new fields to ticket_internal_actions table
-- Date: 2025-01-08
-- Description: Add planned/actual dates and improved group assignment

DO $$
DECLARE
    tenant_schema TEXT;
    tenant_schemas TEXT[] := ARRAY[
        'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e',
        'tenant_715c510a_3db5_4510_880a_9a1a5c320100',
        'tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a',
        'tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056'
    ];
BEGIN
    -- Loop through each tenant schema
    FOREACH tenant_schema IN ARRAY tenant_schemas
    LOOP
        -- Check if schema exists
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = tenant_schema) THEN
            RAISE NOTICE 'Updating schema: %', tenant_schema;
            
            -- Add new date fields
            EXECUTE format('ALTER TABLE %I.ticket_internal_actions 
                ADD COLUMN IF NOT EXISTS planned_start_date TIMESTAMP,
                ADD COLUMN IF NOT EXISTS planned_end_date TIMESTAMP,
                ADD COLUMN IF NOT EXISTS actual_start_date TIMESTAMP,
                ADD COLUMN IF NOT EXISTS actual_end_date TIMESTAMP,
                ADD COLUMN IF NOT EXISTS assignment_group_id UUID', tenant_schema);
            
            -- Add foreign key constraint for assignment_group_id
            EXECUTE format('ALTER TABLE %I.ticket_internal_actions 
                ADD CONSTRAINT fk_assignment_group_id 
                FOREIGN KEY (assignment_group_id) 
                REFERENCES %I.user_groups(id)', tenant_schema, tenant_schema);
            
            -- Create new indexes
            EXECUTE format('CREATE INDEX IF NOT EXISTS ticket_internal_actions_tenant_group_idx 
                ON %I.ticket_internal_actions(tenant_id, assignment_group_id)', tenant_schema);
            
            EXECUTE format('CREATE INDEX IF NOT EXISTS ticket_internal_actions_planned_dates_idx 
                ON %I.ticket_internal_actions(tenant_id, planned_start_date, planned_end_date)', tenant_schema);
            
            EXECUTE format('CREATE INDEX IF NOT EXISTS ticket_internal_actions_actual_dates_idx 
                ON %I.ticket_internal_actions(tenant_id, actual_start_date, actual_end_date)', tenant_schema);
            
            EXECUTE format('CREATE INDEX IF NOT EXISTS ticket_internal_actions_group_agent_idx 
                ON %I.ticket_internal_actions(tenant_id, assignment_group_id, agent_id)', tenant_schema);
            
            RAISE NOTICE 'Successfully updated schema: %', tenant_schema;
        ELSE
            RAISE NOTICE 'Schema does not exist: %', tenant_schema;
        END IF;
    END LOOP;
END $$;
