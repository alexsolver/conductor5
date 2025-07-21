-- Create standardized tenant-first performance indexes for tickets across all schemas
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_status_priority_idx ON tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.tickets (tenant_id, status, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_assigned_idx ON tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.tickets (tenant_id, assigned_to_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_customer_idx ON tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.tickets (tenant_id, customer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_urgency_impact_idx ON tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.tickets (tenant_id, urgency, impact);

CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_status_priority_idx ON tenant_715c510a_3db5_4510_880a_9a1a5c320100.tickets (tenant_id, status, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_assigned_idx ON tenant_715c510a_3db5_4510_880a_9a1a5c320100.tickets (tenant_id, assigned_to_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_customer_idx ON tenant_715c510a_3db5_4510_880a_9a1a5c320100.tickets (tenant_id, customer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_urgency_impact_idx ON tenant_715c510a_3db5_4510_880a_9a1a5c320100.tickets (tenant_id, urgency, impact);

CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_status_priority_idx ON tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.tickets (tenant_id, status, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_assigned_idx ON tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.tickets (tenant_id, assigned_to_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_customer_idx ON tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.tickets (tenant_id, customer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_urgency_impact_idx ON tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a.tickets (tenant_id, urgency, impact);

CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_status_priority_idx ON tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.tickets (tenant_id, status, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_assigned_idx ON tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.tickets (tenant_id, assigned_to_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_customer_idx ON tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.tickets (tenant_id, customer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_urgency_impact_idx ON tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056.tickets (tenant_id, urgency, impact);
