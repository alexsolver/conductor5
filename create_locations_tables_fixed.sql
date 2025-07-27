-- CRIAÇÃO DAS TABELAS DE LOCAIS PARA O SCHEMA DO TENANT
-- Schema: tenant_3f99462f_3621_4b1b_bea8_782acc50d62e

CREATE TABLE IF NOT EXISTS "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e"."locais" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  tipo_cliente_favorecido VARCHAR(20),
  tecnico_principal_id UUID,
  email VARCHAR(255),
  ddd VARCHAR(3),
  telefone VARCHAR(15),
  cep VARCHAR(9),
  pais VARCHAR(100) DEFAULT 'Brasil',
  estado VARCHAR(100),
  municipio VARCHAR(100),
  bairro VARCHAR(100),
  tipo_logradouro VARCHAR(50),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  geo_coordenadas JSONB,
  fuso_horario VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  feriados_incluidos JSONB,
  indisponibilidades JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e"."regioes" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  clientes_vinculados JSONB,
  tecnico_principal_id UUID,
  grupos_vinculados JSONB,
  locais_atendimento JSONB,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  ceps_abrangidos JSONB,
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

CREATE TABLE IF NOT EXISTS "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e"."rotas_dinamicas" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome_rota VARCHAR(100) NOT NULL,
  id_rota VARCHAR(100) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  locais_vinculados JSONB,
  tecnico_principal_id UUID,
  grupos_vinculados JSONB,
  previsao_dias INTEGER,
  planejamento_rotas JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e"."trechos" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e"."rotas_trecho" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome VARCHAR(200) NOT NULL,
  id_rota VARCHAR(100) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  definicao_trecho JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e"."areas" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  tipo_area VARCHAR(50),
  cor_mapa VARCHAR(7),
  classificacao_area JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tenant_3f99462f_3621_4b1b_bea8_782acc50d62e"."agrupamentos" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  codigo_integracao VARCHAR(100),
  areas_vinculadas JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);