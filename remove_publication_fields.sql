-- Remove campos de publicação/infraestrutura da tabela tickets
ALTER TABLE tickets DROP COLUMN IF EXISTS publication_priority;
ALTER TABLE tickets DROP COLUMN IF EXISTS responsible_team;
ALTER TABLE tickets DROP COLUMN IF EXISTS infrastructure;
ALTER TABLE tickets DROP COLUMN IF EXISTS environment_publication;
ALTER TABLE tickets DROP COLUMN IF EXISTS close_to_publish;
