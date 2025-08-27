-- This migration is no longer needed as the constraint is properly handled in 001_create_tenant_tables.sql
-- Keeping this file to maintain migration history but making it a no-op

DO $$
BEGIN
    -- No operation needed - constraint is properly handled in main migration
    NULL;
END $$;