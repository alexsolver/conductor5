
```sql
-- Fix knowledge_base_articles category column
-- This ensures the category column exists with the correct type

DO $$ 
BEGIN
    -- Check if category column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'knowledge_base_articles' 
        AND column_name = 'category'
        AND table_schema = current_schema()
    ) THEN
        -- Create the enum type if it doesn't exist
        DO $enum$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_base_category') THEN
                CREATE TYPE knowledge_base_category AS ENUM (
                    'technical_support',
                    'troubleshooting', 
                    'user_guide',
                    'faq',
                    'policy',
                    'process',
                    'training',
                    'announcement',
                    'best_practice',
                    'configuration',
                    'other'
                );
            END IF;
        END $enum$;
        
        ALTER TABLE knowledge_base_articles 
        ADD COLUMN category knowledge_base_category DEFAULT 'other';
    END IF;
    
    -- Drop category_id column if it exists (cleanup from old schema)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'knowledge_base_articles' 
        AND column_name = 'category_id'
        AND table_schema = current_schema()
    ) THEN
        ALTER TABLE knowledge_base_articles 
        DROP COLUMN category_id;
    END IF;
END $$;
```
