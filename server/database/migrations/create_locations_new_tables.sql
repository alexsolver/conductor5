
-- LOCATIONS NEW MODULE - Complete table creation for all 7 record types
-- This creates tables in tenant-specific schemas

-- Function to create tables in a specific tenant schema
CREATE OR REPLACE FUNCTION create_locations_new_tables_for_tenant(tenant_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Create the schema if it doesn't exist
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', tenant_schema_name);
    
    -- 1. LOCAIS table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.locais (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            
            -- Identificação
            ativo BOOLEAN NOT NULL DEFAULT true,
            nome VARCHAR(200) NOT NULL,
            descricao TEXT,
            codigo_integracao VARCHAR(100),
            tipo_cliente_favorecido VARCHAR(20),
            tecnico_principal_id UUID,
            
            -- Contato
            email VARCHAR(255),
            ddd VARCHAR(3),
            telefone VARCHAR(15),
            
            -- Endereço
            cep VARCHAR(9),
            pais VARCHAR(100) DEFAULT ''Brasil'',
            estado VARCHAR(100),
            municipio VARCHAR(100),
            bairro VARCHAR(100),
            tipo_logradouro VARCHAR(50),
            logradouro VARCHAR(255),
            numero VARCHAR(20),
            complemento VARCHAR(100),
            
            -- Georreferenciamento
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            geo_coordenadas JSONB,
            
            -- Tempo e Disponibilidade
            fuso_horario VARCHAR(50) DEFAULT ''America/Sao_Paulo'',
            feriados_incluidos JSONB,
            indisponibilidades JSONB,
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ', tenant_schema_name);
    
    -- 2. REGIOES table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.regioes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            
            -- Identificação
            ativo BOOLEAN NOT NULL DEFAULT true,
            nome VARCHAR(200) NOT NULL,
            descricao TEXT,
            codigo_integracao VARCHAR(100),
            
            -- Relacionamentos
            clientes_vinculados JSONB,
            tecnico_principal_id UUID,
            grupos_vinculados JSONB,
            locais_atendimento JSONB,
            
            -- Geolocalização
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            ceps_abrangidos JSONB,
            
            -- Endereço Base
            cep VARCHAR(9),
            pais VARCHAR(100) DEFAULT ''Brasil'',
            estado VARCHAR(100),
            municipio VARCHAR(100),
            bairro VARCHAR(100),
            tipo_logradouro VARCHAR(50),
            logradouro VARCHAR(255),
            numero VARCHAR(20),
            complemento VARCHAR(100),
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ', tenant_schema_name);
    
    -- 3. ROTAS_DINAMICAS table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.rotas_dinamicas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            
            -- Identificação
            ativo BOOLEAN NOT NULL DEFAULT true,
            nome_rota VARCHAR(100) NOT NULL,
            id_rota VARCHAR(100) NOT NULL,
            
            -- Relacionamentos
            clientes_vinculados JSONB,
            regioes_atendidas JSONB,
            
            -- Planejamento da Rota
            dias_semana JSONB,
            previsao_dias INTEGER NOT NULL,
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ', tenant_schema_name);
    
    -- 4. TRECHOS table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.trechos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            
            -- Identificação
            ativo BOOLEAN NOT NULL DEFAULT true,
            codigo_integracao VARCHAR(100),
            local_a_id UUID NOT NULL,
            local_b_id UUID NOT NULL,
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ', tenant_schema_name);
    
    -- 5. ROTAS_TRECHO table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.rotas_trecho (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            
            -- Identificação
            ativo BOOLEAN NOT NULL DEFAULT true,
            id_rota VARCHAR(100) NOT NULL,
            
            -- Definição do Trecho
            local_a_id UUID NOT NULL,
            local_b_id UUID NOT NULL,
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ', tenant_schema_name);
    
    -- 6. TRECHOS_ROTA table (segments for rota de trecho)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.trechos_rota (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            rota_trecho_id UUID NOT NULL,
            
            ordem INTEGER NOT NULL,
            local_origem_id UUID NOT NULL,
            nome_trecho VARCHAR(200),
            local_destino_id UUID NOT NULL,
            
            created_at TIMESTAMP DEFAULT NOW()
        )
    ', tenant_schema_name);
    
    -- 7. AREAS table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.areas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            
            -- Identificação
            ativo BOOLEAN NOT NULL DEFAULT true,
            nome VARCHAR(200) NOT NULL,
            descricao TEXT,
            codigo_integracao VARCHAR(100),
            
            -- Classificação
            tipo_area VARCHAR(50) NOT NULL,
            cor_mapa VARCHAR(7) DEFAULT ''#3B82F6'',
            
            -- Dados Geográficos
            dados_geograficos JSONB,
            faixas_cep JSONB,
            coordenadas JSONB,
            coordenada_central JSONB,
            raio_metros INTEGER,
            linha_trajetoria JSONB,
            
            -- Metadados de importação
            arquivo_original VARCHAR(255),
            tipo_arquivo VARCHAR(10),
            
            -- Validação e processamento
            validacao_geo JSONB,
            status_processamento VARCHAR(20) DEFAULT ''ativo'',
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ', tenant_schema_name);
    
    -- 8. AGRUPAMENTOS table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.agrupamentos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            
            -- Identificação
            ativo BOOLEAN NOT NULL DEFAULT true,
            nome VARCHAR(200) NOT NULL,
            descricao TEXT,
            codigo_integracao VARCHAR(100),
            areas_vinculadas JSONB,
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ', tenant_schema_name);
    
    -- Create indexes for performance
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_locais_tenant_id ON %I.locais(tenant_id)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_locais_ativo ON %I.locais(ativo)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_locais_nome ON %I.locais(nome)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_regioes_tenant_id ON %I.regioes(tenant_id)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_regioes_ativo ON %I.regioes(ativo)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_rotas_dinamicas_tenant_id ON %I.rotas_dinamicas(tenant_id)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_trechos_tenant_id ON %I.trechos(tenant_id)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_rotas_trecho_tenant_id ON %I.rotas_trecho(tenant_id)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_areas_tenant_id ON %I.areas(tenant_id)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_agrupamentos_tenant_id ON %I.agrupamentos(tenant_id)', replace(tenant_schema_name, '-', '_'), tenant_schema_name);
    
    -- Add foreign key constraints for trechos_rota
    EXECUTE format('ALTER TABLE %I.trechos_rota ADD CONSTRAINT IF NOT EXISTS fk_trechos_rota_rota_trecho_id 
                   FOREIGN KEY (rota_trecho_id) REFERENCES %I.rotas_trecho(id) ON DELETE CASCADE', 
                   tenant_schema_name, tenant_schema_name);
    
    RAISE NOTICE 'Locations New tables created successfully for tenant schema: %', tenant_schema_name;
END;
$$ LANGUAGE plpgsql;

-- Create tables for existing tenants
SELECT create_locations_new_tables_for_tenant('tenant_3f99462f_3621_4b1b_bea8_782acc50d62e');
SELECT create_locations_new_tables_for_tenant('tenant_715c510a_3db5_4510_880a_9a1a5c320100');
SELECT create_locations_new_tables_for_tenant('tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a');
SELECT create_locations_new_tables_for_tenant('tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056');
