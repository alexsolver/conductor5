
-- Fix knowledge_base_articles category column
-- This ensures the category column exists with the correct type

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    -- Check if category column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'knowledge_base_articles' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE knowledge_base_articles 
        ADD COLUMN category knowledge_base_category;
    END IF;
    
    -- Drop category_id column if it exists (cleanup from old schema)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'knowledge_base_articles' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE knowledge_base_articles 
        DROP COLUMN category_id;
    END IF;
END $$;
