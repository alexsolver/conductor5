-- Migration: Add metadata column to ticket_messages table
-- Purpose: Store sentiment analysis, channel info, and other metadata
-- Date: 2025-10-05

-- This migration needs to be applied to each tenant schema

DO $$
DECLARE
    tenant_schema text;
BEGIN
    -- Loop through all tenant schemas
    FOR tenant_schema IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname LIKE 'tenant_%'
    LOOP
        -- Check if metadata column doesn't exist before adding
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = tenant_schema 
            AND table_name = 'ticket_messages' 
            AND column_name = 'metadata'
        ) THEN
            EXECUTE format('
                ALTER TABLE %I.ticket_messages 
                ADD COLUMN metadata jsonb DEFAULT ''{}''::jsonb;
            ', tenant_schema);
            
            RAISE NOTICE 'Added metadata column to %.ticket_messages', tenant_schema;
        ELSE
            RAISE NOTICE 'metadata column already exists in %.ticket_messages', tenant_schema;
        END IF;
    END LOOP;
END $$;

-- Create index for better performance on sentiment queries
DO $$
DECLARE
    tenant_schema text;
BEGIN
    FOR tenant_schema IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname LIKE 'tenant_%'
    LOOP
        -- Add GIN index for metadata JSONB column (if doesn't exist)
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE schemaname = tenant_schema 
            AND tablename = 'ticket_messages' 
            AND indexname = 'ticket_messages_metadata_idx'
        ) THEN
            EXECUTE format('
                CREATE INDEX ticket_messages_metadata_idx 
                ON %I.ticket_messages USING gin(metadata);
            ', tenant_schema);
            
            RAISE NOTICE 'Created GIN index on %.ticket_messages.metadata', tenant_schema;
        ELSE
            RAISE NOTICE 'Index already exists on %.ticket_messages.metadata', tenant_schema;
        END IF;
    END LOOP;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully';
    RAISE NOTICE 'Added metadata column and GIN index to all tenant ticket_messages tables';
END $$;
