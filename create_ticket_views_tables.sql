-- Script para criar tabelas de visualizações customizáveis de tickets
-- Este script criará as tabelas no schema tenant

-- Função para criar tabelas em todos os tenant schemas
DO $$
DECLARE
    schema_name text;
    tenant_schemas cursor for
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name LIKE 'tenant_%';
BEGIN
    FOR tenant_schema IN tenant_schemas LOOP
        schema_name := tenant_schema.schema_name;
        
        -- Criar tabela ticket_list_views
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.ticket_list_views (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_by_id UUID NOT NULL,
                is_public BOOLEAN DEFAULT false,
                is_default BOOLEAN DEFAULT false,
                columns JSONB NOT NULL,
                filters JSONB DEFAULT ''[]''::jsonb,
                sorting JSONB DEFAULT ''[]''::jsonb,
                page_size INTEGER DEFAULT 25,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )', schema_name);
            
        -- Criar índices para ticket_list_views
        EXECUTE format('CREATE INDEX IF NOT EXISTS ticket_views_tenant_idx ON %I.ticket_list_views (tenant_id)', schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS ticket_views_creator_idx ON %I.ticket_list_views (tenant_id, created_by_id)', schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS ticket_views_public_idx ON %I.ticket_list_views (tenant_id, is_public)', schema_name);
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS ticket_views_tenant_name_creator ON %I.ticket_list_views (tenant_id, name, created_by_id)', schema_name);
        
        -- Criar tabela ticket_view_shares
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.ticket_view_shares (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                view_id UUID NOT NULL REFERENCES %I.ticket_list_views(id) ON DELETE CASCADE,
                user_id UUID NOT NULL,
                can_edit BOOLEAN DEFAULT false,
                can_share BOOLEAN DEFAULT false,
                shared_at TIMESTAMP DEFAULT NOW(),
                shared_by_id UUID NOT NULL
            )', schema_name, schema_name);
            
        -- Criar índices para ticket_view_shares
        EXECUTE format('CREATE INDEX IF NOT EXISTS view_shares_view_idx ON %I.ticket_view_shares (view_id)', schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS view_shares_user_idx ON %I.ticket_view_shares (tenant_id, user_id)', schema_name);
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS view_shares_unique ON %I.ticket_view_shares (view_id, user_id)', schema_name);
        
        -- Criar tabela user_view_preferences
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.user_view_preferences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                user_id UUID NOT NULL,
                active_view_id UUID REFERENCES %I.ticket_list_views(id),
                personal_settings JSONB DEFAULT ''{}''::jsonb,
                last_used_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )', schema_name, schema_name);
            
        -- Criar índices para user_view_preferences
        EXECUTE format('CREATE INDEX IF NOT EXISTS user_prefs_user_idx ON %I.user_view_preferences (tenant_id, user_id)', schema_name);
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS user_prefs_unique ON %I.user_view_preferences (tenant_id, user_id)', schema_name);
        
        RAISE NOTICE 'Tabelas de visualizações de tickets criadas no schema: %', schema_name;
    END LOOP;
END $$;