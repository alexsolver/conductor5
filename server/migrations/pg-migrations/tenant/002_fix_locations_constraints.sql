
-- Fix missing parent_location_id foreign key constraint for existing tenants

DO $$
BEGIN
    -- Check if parent_location_id column exists without foreign key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' 
        AND column_name = 'parent_location_id'
        AND table_schema = current_schema()
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'locations' 
        AND kcu.column_name = 'parent_location_id'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = current_schema()
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE locations 
        ADD CONSTRAINT fk_locations_parent 
        FOREIGN KEY (parent_location_id) REFERENCES locations(id);
    END IF;
END $$;
