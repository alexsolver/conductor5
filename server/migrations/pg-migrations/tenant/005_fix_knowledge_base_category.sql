-- Fix knowledge_base_articles category column
-- This ensures the category column exists with the correct type

DO $$
BEGIN
    -- Criar o enum se ainda não existir
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

    -- Adicionar a coluna category se não existir
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'knowledge_base_articles'
          AND column_name = 'category'
          AND table_schema = current_schema()
    ) THEN
        ALTER TABLE knowledge_base_articles
        ADD COLUMN category knowledge_base_category DEFAULT 'other';
    END IF;

    -- Remover coluna antiga category_id se existir
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
