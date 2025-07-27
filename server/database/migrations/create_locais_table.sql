
-- Create locais table if it doesn't exist
CREATE TABLE IF NOT EXISTS locais (
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
  pais VARCHAR(100) DEFAULT 'Brasil',
  estado VARCHAR(100),
  municipio VARCHAR(100),
  bairro VARCHAR(100),
  tipo_logradouro VARCHAR(50),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  
  -- Georreferenciamento
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  geo_coordenadas JSONB,
  
  -- Tempo e Disponibilidade
  fuso_horario VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  feriados_incluidos JSONB,
  indisponibilidades JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locais_tenant_id ON locais(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locais_ativo ON locais(ativo);
CREATE INDEX IF NOT EXISTS idx_locais_nome ON locais(nome);
