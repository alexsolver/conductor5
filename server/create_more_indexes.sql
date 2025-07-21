-- Create favorecidos indexes for all schemas
CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_email_idx ON tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.favorecidos (tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_active_idx ON tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.favorecidos (tenant_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_cpf_idx ON tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.favorecidos (tenant_id, cpf_cnpj);

CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_email_idx ON tenant_715c510a_3db5_4510_880a_9a1a5c320100.favorecidos (tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_active_idx ON tenant_715c510a_3db5_4510_880a_9a1a5c320100.favorecidos (tenant_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_cpf_idx ON tenant_715c510a_3db5_4510_880a_9a1a5c320100.favorecidos (tenant_id, cpf_cnpj);

CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_email_idx ON tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.favorecidos (tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_active_idx ON tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.favorecidos (tenant_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_cpf_idx ON tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.favorecidos (tenant_id, cpf_cnpj);

CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_email_idx ON tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.favorecidos (tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_active_idx ON tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.favorecidos (tenant_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_cpf_idx ON tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.favorecidos (tenant_id, cpf_cnpj);

-- Create customers indexes for all schemas  
CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_email_idx ON tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.customers (tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_active_idx ON tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.customers (tenant_id, active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_email_idx ON tenant_715c510a_3db5_4510_880a_9a1a5c320100.customers (tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_active_idx ON tenant_715c510a_3db5_4510_880a_9a1a5c320100.customers (tenant_id, active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_email_idx ON tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.customers (tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_active_idx ON tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.customers (tenant_id, active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_email_idx ON tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.customers (tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_active_idx ON tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.customers (tenant_id, active);
