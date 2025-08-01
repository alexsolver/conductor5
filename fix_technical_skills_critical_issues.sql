-- TECHNICAL SKILLS MODULE: CORREÇÃO CRÍTICA DOS PROBLEMAS IDENTIFICADOS
-- ===========================================================================

-- 1. CORREÇÃO DE TIPOS DE DADOS INCONSISTENTES
-- Alinhamento de tenant_id para UUID em todas as tabelas

-- Skills table: VARCHAR → UUID
ALTER TABLE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".skills 
ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID;

-- Certifications table: VARCHAR → UUID  
ALTER TABLE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".certifications
ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID;

-- User_skills table: user_id VARCHAR → UUID (para FK adequado)
ALTER TABLE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".user_skills
ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- 2. ADIÇÃO DE FOREIGN KEY CONSTRAINTS CRÍTICOS
-- Relacionamento user_skills → skills
ALTER TABLE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".user_skills 
ADD CONSTRAINT fk_user_skills_skill_id 
FOREIGN KEY (skill_id) REFERENCES "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".skills(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Relacionamento user_skills → users (assumindo users table existe)
-- ALTER TABLE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".user_skills 
-- ADD CONSTRAINT fk_user_skills_user_id 
-- FOREIGN KEY (user_id) REFERENCES "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".users(id) 
-- ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. CORREÇÃO DE CAMPOS AUSENTES NO SCHEMA-MASTER
-- Adicionar campos que existem no banco mas não no schema
ALTER TABLE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".skills 
ADD COLUMN IF NOT EXISTS level_min INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS level_max INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS certification_suggested VARCHAR(255),
ADD COLUMN IF NOT EXISTS validity_months INTEGER;

-- 4. ÍNDICES DE PERFORMANCE CRÍTICOS
-- Índices composite para queries tenant-first
CREATE INDEX IF NOT EXISTS skills_tenant_name_performance_idx 
ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".skills (tenant_id, name);

CREATE INDEX IF NOT EXISTS skills_tenant_category_performance_idx 
ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".skills (tenant_id, category);

CREATE INDEX IF NOT EXISTS user_skills_tenant_user_performance_idx 
ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".user_skills (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS user_skills_tenant_skill_performance_idx 
ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".user_skills (tenant_id, skill_id);

CREATE INDEX IF NOT EXISTS user_skills_level_performance_idx 
ON "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".user_skills (tenant_id, skill_id, level);

-- 5. QUALITY CERTIFICATIONS FK ORPHAN FIX
-- Definir relacionamento para quality_certifications.item_id baseado em item_type
-- Como item_type pode ser 'user', 'equipment', etc., não podemos ter FK rígido
-- Mas podemos adicionar constraint de validação

ALTER TABLE "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".quality_certifications
ADD CONSTRAINT chk_quality_cert_item_type 
CHECK (item_type IN ('user', 'equipment', 'facility', 'process'));

-- VALIDAÇÃO FINAL: Contar registros e verificar integridade
SELECT 
    'skills' as table_name, 
    COUNT(*) as record_count,
    COUNT(DISTINCT tenant_id) as tenant_count
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".skills
UNION ALL
SELECT 
    'user_skills' as table_name, 
    COUNT(*) as record_count,
    COUNT(DISTINCT tenant_id) as tenant_count  
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".user_skills
UNION ALL
SELECT 
    'certifications' as table_name, 
    COUNT(*) as record_count,
    COUNT(DISTINCT tenant_id) as tenant_count
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".certifications
UNION ALL
SELECT 
    'quality_certifications' as table_name, 
    COUNT(*) as record_count,
    COUNT(DISTINCT tenant_id) as tenant_count
FROM "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e".quality_certifications;

-- RESULTADO ESPERADO: 4 tabelas com registros e tenant_id consistente UUID
-- =====================================================
-- TECHNICAL SKILLS MODULE - CRITICAL FIXES
-- =====================================================

-- 1. Fix data types for consistency
BEGIN;

-- Fix tenant_id types to UUID where needed
DO $$
BEGIN
    -- Check and fix skills table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'skills' 
        AND column_name = 'tenant_id' 
        AND data_type != 'uuid'
    ) THEN
        ALTER TABLE skills ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID;
    END IF;

    -- Check and fix user_skills table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_skills' 
        AND column_name = 'tenant_id' 
        AND data_type != 'uuid'
    ) THEN
        ALTER TABLE user_skills ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID;
    END IF;

    -- Check and fix user_id type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_skills' 
        AND column_name = 'user_id' 
        AND data_type != 'uuid'
    ) THEN
        ALTER TABLE user_skills ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
    END IF;
END $$;

-- 2. Add missing columns if they don't exist
DO $$
BEGIN
    -- Add level column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_skills' AND column_name = 'level'
    ) THEN
        ALTER TABLE user_skills ADD COLUMN level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 5);
    END IF;

    -- Add assessed_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_skills' AND column_name = 'assessed_at'
    ) THEN
        ALTER TABLE user_skills ADD COLUMN assessed_at TIMESTAMP;
    END IF;

    -- Add assessed_by column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_skills' AND column_name = 'assessed_by'
    ) THEN
        ALTER TABLE user_skills ADD COLUMN assessed_by UUID;
    END IF;

    -- Add expires_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_skills' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE user_skills ADD COLUMN expires_at TIMESTAMP;
    END IF;

    -- Add certification_name column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_skills' AND column_name = 'certification_name'
    ) THEN
        ALTER TABLE user_skills ADD COLUMN certification_name VARCHAR(255);
    END IF;

    -- Add is_active column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_skills' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE user_skills ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. Add Foreign Key constraints (remove existing first if they exist)
DO $$
BEGIN
    -- Drop existing foreign keys if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_skills_skill_id_fkey' 
        AND table_name = 'user_skills'
    ) THEN
        ALTER TABLE user_skills DROP CONSTRAINT user_skills_skill_id_fkey;
    END IF;

    -- Add foreign key constraint for skill_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'skills') THEN
        ALTER TABLE user_skills 
        ADD CONSTRAINT user_skills_skill_id_fkey 
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key constraint for assessed_by (if users table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'user_skills_assessed_by_fkey' 
            AND table_name = 'user_skills'
        ) THEN
            ALTER TABLE user_skills DROP CONSTRAINT user_skills_assessed_by_fkey;
        END IF;
        
        ALTER TABLE user_skills 
        ADD CONSTRAINT user_skills_assessed_by_fkey 
        FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Create quality_certifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS quality_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL,
    certification_type VARCHAR(100) NOT NULL,
    certification_number VARCHAR(255),
    issued_by VARCHAR(255),
    issued_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_tenant_user ON user_skills(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_expires_at ON user_skills(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_skills_active ON user_skills(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_skills_tenant_category ON skills(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active) WHERE is_active = true;

-- 6. Update existing data to have proper defaults
UPDATE user_skills SET level = 1 WHERE level IS NULL;
UPDATE user_skills SET is_active = true WHERE is_active IS NULL;
UPDATE skills SET is_active = true WHERE is_active IS NULL;

COMMIT;

-- 7. Verify the fixes
DO $$
BEGIN
    RAISE NOTICE 'Technical Skills module database fixes completed successfully';
    RAISE NOTICE 'Foreign key constraints: %', (
        SELECT COUNT(*) 
        FROM information_schema.table_constraints 
        WHERE table_name IN ('user_skills', 'skills') 
        AND constraint_type = 'FOREIGN KEY'
    );
    RAISE NOTICE 'Indexes created: %', (
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE tablename IN ('user_skills', 'skills', 'quality_certifications')
    );
END $$;
