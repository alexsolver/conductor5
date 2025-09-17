-- Add missing excerpt column to knowledge_base_articles
-- This resolves the discrepancy between migration, schema, and actual DB

ALTER TABLE knowledge_base_articles 
ADD COLUMN IF NOT EXISTS excerpt TEXT;