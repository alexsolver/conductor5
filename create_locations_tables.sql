-- CREATE TABLES FOR 7 LOCATION RECORD TYPES
-- Execute this SQL in each tenant schema

-- 1. LOCAIS (Local) - 5 sections
CREATE TABLE IF NOT EXISTS locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  ativo BOOLEAN NOT NULL DEFAULT true,
  descricao TEXT NOT NULL,
  codigo_integracao VARCHAR(100),
  cliente_favorecido_id UUID,
  tecnico_principal_id UUID,
  
  -- Contato
  email VARCHAR(255),
  ddd VARCHAR(3),
  telefone VARCHAR(15),
  
  -- Endereço
  cep VARCHAR(9),
  pais VARCHAR(100) DEFAULT 'Brasil',
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
  
  -- Tempo e Disponibilidade
  fuso_horario VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  horario_funcionamento JSONB,
  intervalos_funcionamento JSONB,
  feriados_incluidos JSONB,
  indisponibilidades JSONB,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. REGIÕES (Região) - 4 sections  
CREATE TABLE IF NOT EXISTS regioes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  
  -- Relacionamentos
  clientes_vinculados JSONB, -- Array of client IDs
  tecnico_principal_id UUID,
  grupos_vinculados JSONB, -- Array of group IDs
  locais_atendimento JSONB, -- Array of location IDs
  
  -- Geolocalização  
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  ceps_abrangidos JSONB, -- Array of CEP ranges
  
  -- Endereço Base
  cep VARCHAR(9),
  pais VARCHAR(100) DEFAULT 'Brasil',
  estado VARCHAR(100),
  municipio VARCHAR(100),
  bairro VARCHAR(100),
  tipo_logradouro VARCHAR(50),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. ROTAS DINÂMICAS (Rota Dinâmica) - 3 sections
CREATE TABLE IF NOT EXISTS rotas_dinamicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome_rota VARCHAR(255) NOT NULL,
  id_rota VARCHAR(100) NOT NULL,
  
  -- Relacionamentos
  clientes_vinculados JSONB, -- Array of client IDs
  regioes_atendidas JSONB, -- Array of region IDs
  
  -- Planejamento da Rota
  dias_semana JSONB, -- Array of weekdays
  previsao_dias INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. TRECHOS (Trecho) - 1 section
CREATE TABLE IF NOT EXISTS trechos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  ativo BOOLEAN NOT NULL DEFAULT true,
  codigo_integracao VARCHAR(100),
  local_a_id UUID NOT NULL,
  local_b_id UUID NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. ROTAS DE TRECHO (Rota de Trecho) - 2 sections
CREATE TABLE IF NOT EXISTS rotas_trecho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  ativo BOOLEAN NOT NULL DEFAULT true,
  id_rota VARCHAR(100) NOT NULL,
  
  -- Definição do Trecho
  trechos_ids JSONB, -- Array of trecho IDs
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. ÁREAS (Área) - 2 sections
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  
  -- Classificação
  tipo_area VARCHAR(50) NOT NULL,
  cor_mapa VARCHAR(7) DEFAULT '#3B82F6',
  dados_geograficos JSONB, -- GeoJSON or coordinates
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. AGRUPAMENTOS (Agrupamento) - 1 section
CREATE TABLE IF NOT EXISTS agrupamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identificação
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  areas_vinculadas JSONB, -- Array of area IDs
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locais_tenant_id ON locais(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locais_status ON locais(status);
CREATE INDEX IF NOT EXISTS idx_locais_ativo ON locais(ativo);

CREATE INDEX IF NOT EXISTS idx_regioes_tenant_id ON regioes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_regioes_ativo ON regioes(ativo);

CREATE INDEX IF NOT EXISTS idx_rotas_dinamicas_tenant_id ON rotas_dinamicas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rotas_dinamicas_ativo ON rotas_dinamicas(ativo);

CREATE INDEX IF NOT EXISTS idx_trechos_tenant_id ON trechos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trechos_ativo ON trechos(ativo);

CREATE INDEX IF NOT EXISTS idx_rotas_trecho_tenant_id ON rotas_trecho(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rotas_trecho_ativo ON rotas_trecho(ativo);

CREATE INDEX IF NOT EXISTS idx_areas_tenant_id ON areas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_areas_ativo ON areas(ativo);

CREATE INDEX IF NOT EXISTS idx_agrupamentos_tenant_id ON agrupamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agrupamentos_ativo ON agrupamentos(ativo);