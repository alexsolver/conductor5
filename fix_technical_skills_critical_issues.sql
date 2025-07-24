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