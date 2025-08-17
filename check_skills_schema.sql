
-- Verificar se a tabela skills existe e sua estrutura
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'skills' 
ORDER BY ordinal_position;

-- Verificar se há dados na tabela skills
SELECT COUNT(*) as total_skills FROM skills;

-- Verificar skills por tenant
SELECT tenant_id, COUNT(*) as skills_count 
FROM skills 
GROUP BY tenant_id;

-- Verificar estrutura da tabela user_skills
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_skills' 
ORDER BY ordinal_position;
