-- MIGRAÇÃO: Remoção da coluna short_description redundante
-- Data: 2025-07-31
-- Justificativa: Análise confirma que todos os tickets usam apenas 'subject' e 'short_description' está sempre NULL

-- Schema: tenant_3f99462f_3621_4b1b_bea8_782acc50d62e
ALTER TABLE tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.tickets 
DROP COLUMN IF EXISTS short_description;

-- Schema: tenant_715c510a_3db5_4510_880a_9a1a5c320100
ALTER TABLE tenant_715c510a_3db5_4510_880a_9a1a5c320100.tickets 
DROP COLUMN IF EXISTS short_description;

-- Schema: tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a
ALTER TABLE tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.tickets 
DROP COLUMN IF EXISTS short_description;

-- Schema: tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056
ALTER TABLE tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.tickets 
DROP COLUMN IF EXISTS short_description;

-- Verificação após migração
SELECT 'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e' as tenant, 
       COUNT(*) as total_tickets,
       COUNT(subject) as tickets_com_subject
FROM tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.tickets;