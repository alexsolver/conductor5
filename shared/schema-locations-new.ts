// LOCATIONS MODULE - COMPLETE RESTRUCTURE FOR 7 RECORD TYPES
import { pgTable, uuid, varchar, text, timestamp, jsonb, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Status values for all types
export type LocationStatus = 'active' | 'inactive' | 'maintenance';
export type AreaType = 'faixa_cep' | 'shape' | 'coordenadas' | 'raio' | 'linha' | 'importar_area';
export type LogradouroType = 'Rua' | 'Avenida' | 'Travessa' | 'Alameda' | 'Rodovia' | 'Estrada';

// 1. LOCAL - Complete address and geolocation system per user requirements
export const locais = pgTable('locais', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Identificação
  ativo: boolean('ativo').notNull().default(true),
  nome: varchar('nome', { length: 200 }).notNull(),
  descricao: text('descricao'),
  codigoIntegracao: varchar('codigo_integracao', { length: 100 }),
  tipoClienteFavorecido: varchar('tipo_cliente_favorecido', { length: 20 }), // 'cliente' ou 'favorecido'
  tecnicoPrincipalId: uuid('tecnico_principal_id'), // FK to users (workspace admin team member)

  // Contato
  email: varchar('email', { length: 255 }),
  ddd: varchar('ddd', { length: 3 }),
  telefone: varchar('telefone', { length: 15 }),

  // Endereço
  cep: varchar('cep', { length: 9 }),
  pais: varchar('pais', { length: 100 }).default('Brasil'),
  estado: varchar('estado', { length: 100 }),
  municipio: varchar('municipio', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }),
  tipoLogradouro: varchar('tipo_logradouro', { length: 50 }),
  logradouro: varchar('logradouro', { length: 255 }),
  numero: varchar('numero', { length: 20 }),
  complemento: varchar('complemento', { length: 100 }),

  // Georreferenciamento
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  geoCoordenadas: jsonb('geo_coordenadas'), // Complete geo data with validation info

  // Tempo e Disponibilidade
  fusoHorario: varchar('fuso_horario', { length: 50 }).default('America/Sao_Paulo'),
  feriadosIncluidos: jsonb('feriados_incluidos'), // Selected holidays (municipal, estadual, federal)
  indisponibilidades: jsonb('indisponibilidades'), // Unavailable periods (data início/fim + observação)

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// 2. REGIÃO - Regional management with relationships
export const regioes = pgTable('regioes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Identificação
  ativo: boolean('ativo').notNull().default(true),
  nome: varchar('nome', { length: 200 }).notNull(),
  descricao: text('descricao'),
  codigoIntegracao: varchar('codigo_integracao', { length: 100 }),

  // Relacionamentos
  clientesVinculados: jsonb('clientes_vinculados'), // Array of customer IDs
  tecnicoPrincipalId: uuid('tecnico_principal_id'), // FK to users (team members)
  gruposVinculados: jsonb('grupos_vinculados'), // Array of user group IDs from team management
  locaisAtendimento: jsonb('locais_atendimento'), // Array of location IDs (multi-selection)

  // Geolocalização
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  cepsAbrangidos: jsonb('ceps_abrangidos'), // CEPs covered or nearby

  // Endereço Base
  cep: varchar('cep', { length: 9 }),
  pais: varchar('pais', { length: 100 }).default('Brasil'),
  estado: varchar('estado', { length: 100 }),
  municipio: varchar('municipio', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }),
  tipoLogradouro: varchar('tipo_logradouro', { length: 50 }), // rua, avenida, etc.
  logradouro: varchar('logradouro', { length: 255 }),
  numero: varchar('numero', { length: 20 }),
  complemento: varchar('complemento', { length: 100 }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// 3. ROTA DINÂMICA - Dynamic route planning
export const rotasDinamicas = pgTable('rotas_dinamicas', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Identificação
  ativo: boolean('ativo').notNull().default(true),
  nomeRota: varchar('nome_rota', { length: 100 }).notNull(),
  idRota: varchar('id_rota', { length: 100 }).notNull(),

  // Relacionamentos
  clientesVinculados: jsonb('clientes_vinculados'), // Array of customer IDs from integration
  regioesAtendidas: jsonb('regioes_atendidas'), // Array of region IDs (multi-selection)

  // Planejamento da Rota
  diasSemana: jsonb('dias_semana'), // Array of weekdays ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
  previsaoDias: integer('previsao_dias').notNull(), // 1-30 days (valor inteiro)

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// 4. TRECHO - Route segments
export const trechos = pgTable('trechos', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Identificação
  ativo: boolean('ativo').notNull().default(true),
  codigoIntegracao: varchar('codigo_integracao', { length: 100 }),
  localAId: uuid('local_a_id').notNull(), // FK to locais
  localBId: uuid('local_b_id').notNull(), // FK to locais

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// 5. ROTA DE TRECHO - Multi-segment routes
export const rotasTrecho = pgTable('rotas_trecho', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Identificação
  ativo: boolean('ativo').notNull().default(true),
  idRota: varchar('id_rota', { length: 100 }).notNull(),

  // Definição do Trecho - Pontos de origem e destino da rota completa
  localAId: uuid('local_a_id').notNull(), // Local de origem da rota completa
  localBId: uuid('local_b_id').notNull(), // Local de destino da rota completa

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Multiple route segments for rota de trecho
export const trechosRota = pgTable('trechos_rota', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  rotaTrechoId: uuid('rota_trecho_id').notNull().references(() => rotasTrecho.id, { onDelete: 'cascade' }),

  ordem: integer('ordem').notNull(), // Sequence order
  localOrigemId: uuid('local_origem_id').notNull(), // FK to locais - DE
  nomeTrecho: varchar('nome_trecho', { length: 200 }), // TRECHO
  localDestinoId: uuid('local_destino_id').notNull(), // FK to locais - PARA

  createdAt: timestamp('created_at').defaultNow()
});

// 6. ÁREA - Geographic areas with map integration
export const areas = pgTable('areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Identificação
  ativo: boolean('ativo').notNull().default(true),
  nome: varchar('nome', { length: 200 }).notNull(),
  descricao: text('descricao'),
  codigoIntegracao: varchar('codigo_integracao', { length: 100 }),

  // Classificação
  tipoArea: varchar('tipo_area', { length: 50 }).notNull(), // 'faixa_cep', 'shape', 'coordenadas', 'raio', 'linha', 'importar_area'
  corMapa: varchar('cor_mapa', { length: 7 }).default('#3B82F6'), // Hex color
  
  // Dados Geográficos específicos por tipo
  dadosGeograficos: jsonb('dados_geograficos'), // Estrutura flexível para diferentes tipos de área
  
  // Campos específicos para cada tipo
  faixasCep: jsonb('faixas_cep'), // Array de objetos {cepInicio, cepFim, grupo}
  coordenadas: jsonb('coordenadas'), // Array de {lat, lng, ordem} para polígonos
  coordenadaCentral: jsonb('coordenada_central'), // {lat, lng} para raio
  raioMetros: integer('raio_metros'), // Raio em metros
  linhaTrajetoria: jsonb('linha_trajetoria'), // Array de coordenadas para linha
  
  // Metadados de importação
  arquivoOriginal: varchar('arquivo_original', { length: 255 }), // Nome do arquivo importado
  tipoArquivo: varchar('tipo_arquivo', { length: 10 }), // 'kml', 'shape', 'geojson'
  
  // Validação e processamento
  validacaoGeo: jsonb('validacao_geo'), // Status de validação geográfica
  statusProcessamento: varchar('status_processamento', { length: 20 }).default('ativo'), // 'processando', 'ativo', 'erro'

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// 7. AGRUPAMENTO - Area groupings
export const agrupamentos = pgTable('agrupamentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Identificação
  ativo: boolean('ativo').notNull().default(true),
  nome: varchar('nome', { length: 200 }).notNull(),
  descricao: text('descricao'),
  codigoIntegracao: varchar('codigo_integracao', { length: 100 }),
  areasVinculadas: jsonb('areas_vinculadas'), // Array of area IDs

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Zod validation schemas
export const localSchema = createInsertSchema(locais, {
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional(),
  ddd: z.string().optional(),
  telefone: z.string().optional(), // Removido min/max para não ser obrigatório
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Latitude inválida").optional(),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Longitude inválida").optional(),
  tipoLogradouro: z.enum(['Rua', 'Avenida', 'Travessa', 'Alameda', 'Rodovia', 'Estrada', 'Praça', 'Largo']).optional(),
  tipoClienteFavorecido: z.enum(['cliente', 'favorecido']).optional(),
  tenantId: z.string().uuid().optional(), // Add tenantId as optional since it's filled automatically
}).omit({ id: true, createdAt: true, updatedAt: true });

// Schema for holidays selection
export const feriadosSelectionSchema = z.object({
  municipais: z.array(z.object({
    data: z.string(),
    nome: z.string(),
    incluir: z.boolean()
  })).optional(),
  estaduais: z.array(z.object({
    data: z.string(),
    nome: z.string(),
    incluir: z.boolean()
  })).optional(),
  federais: z.array(z.object({
    data: z.string(),
    nome: z.string(),
    incluir: z.boolean()
  })).optional()
}).optional();

// Schema for unavailability periods
export const indisponibilidadesSchema = z.array(z.object({
  dataInicio: z.string(),
  dataFim: z.string(),
  observacao: z.string()
})).optional();

export const regiaoSchema = createInsertSchema(regioes, {
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().optional(),
  codigoIntegracao: z.string().optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional(),
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Latitude inválida").optional(),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Longitude inválida").optional(),
  tipoLogradouro: z.enum(['Rua', 'Avenida', 'Travessa', 'Alameda', 'Rodovia', 'Estrada', 'Praça', 'Largo']).optional(),
  clientesVinculados: z.array(z.string().uuid()).optional(),
  gruposVinculados: z.array(z.string().uuid()).optional(),
  locaisAtendimento: z.array(z.string().uuid()).optional(),
  cepsAbrangidos: z.array(z.string()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, tenantId: true });

export const rotaDinamicaSchema = createInsertSchema(rotasDinamicas, {
  nomeRota: z.string().min(1, "Nome da rota é obrigatório").max(100),
  idRota: z.string().min(1, "ID da rota é obrigatório").max(100),
  previsaoDias: z.union([
    z.number().min(1, "Previsão deve ser entre 1 e 30 dias").max(30, "Previsão deve ser entre 1 e 30 dias"),
    z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1, "Previsão deve ser entre 1 e 30 dias").max(30, "Previsão deve ser entre 1 e 30 dias"))
  ]),
  clientesVinculados: z.array(z.string().uuid()).optional(),
  regioesAtendidas: z.array(z.string().uuid()).optional(),
  diasSemana: z.array(z.enum(['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'])).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, tenantId: true }).extend({
  // Aceitar campos do frontend seguindo padrão 1qa.md
  nome: z.string().min(1, "Nome é obrigatório").max(200).optional(), // Alias para nomeRota
  descricao: z.string().optional(),
  codigoIntegracao: z.string().optional(),
  clientesFavorecidos: z.array(z.string().uuid()).optional(), // Alias para clientesVinculados
  tecnicosPrincipais: z.array(z.string().uuid()).optional(),
});

export const trechoSchema = createInsertSchema(trechos, {
  codigoIntegracao: z.string().optional(),
  localAId: z.string().uuid("Local A deve ser selecionado"),
  localBId: z.string().uuid("Local B deve ser selecionado"),
}).omit({ 
  id: true, createdAt: true, updatedAt: true, tenantId: true 
});

export const rotaTrechoSchema = createInsertSchema(rotasTrecho, {
  idRota: z.string().min(1, "ID da rota é obrigatório").max(100),
  localAId: z.string().uuid("Local A deve ser selecionado"),
  localBId: z.string().uuid("Local B deve ser selecionado"),
}).omit({ id: true, createdAt: true, updatedAt: true, tenantId: true });

// Schema for individual route segments
export const trechoRotaSchema = createInsertSchema(trechosRota, {
  ordem: z.number().min(1, "Ordem deve ser maior que 0"),
  localOrigemId: z.string().uuid("Local de origem deve ser selecionado"),
  localDestinoId: z.string().uuid("Local de destino deve ser selecionado"),
  nomeTrecho: z.string().optional(),
}).omit({ id: true, createdAt: true, tenantId: true, rotaTrechoId: true });

// Combined schema for creating a complete route with segments
export const rotaTrechoComSegmentosSchema = z.object({
  ativo: z.boolean().default(true),
  idRota: z.string().min(1, "ID da rota é obrigatório").max(100),
  localAId: z.string().uuid("Local A deve ser selecionado"),
  localBId: z.string().uuid("Local B deve ser selecionado"),
  trechos: z.array(trechoRotaSchema).min(1, "Pelo menos um trecho deve ser adicionado"),
}).refine((data) => {
  // Validate that first segment starts from Local A
  if (data.trechos[0] && data.trechos[0].localOrigemId !== data.localAId) {
    return false;
  }
  // Validate that last segment ends at Local B
  const lastTrecho = data.trechos[data.trechos.length - 1];
  if (lastTrecho && lastTrecho.localDestinoId !== data.localBId) {
    return false;
  }
  // Validate that segments are connected (destination of one = origin of next)
  for (let i = 0; i < data.trechos.length - 1; i++) {
    if (data.trechos[i].localDestinoId !== data.trechos[i + 1].localOrigemId) {
      return false;
    }
  }
  return true;
}, {
  message: "Os trechos devem formar uma sequência válida do Local A ao Local B"
});

export const areaSchema = createInsertSchema(areas, {
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().optional(),
  codigoIntegracao: z.string().optional(),
  tipoArea: z.enum(['faixa_cep', 'shape', 'coordenadas', 'raio', 'linha', 'importar_area'], {
    required_error: "Tipo de área é obrigatório"
  }),
  corMapa: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um hex válido"),
  faixasCep: z.array(z.object({
    cepInicio: z.string().regex(/^\d{5}-?\d{3}$/, "CEP início inválido"),
    cepFim: z.string().regex(/^\d{5}-?\d{3}$/, "CEP fim inválido"),
    grupo: z.string().optional()
  })).optional(),
  coordenadas: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    ordem: z.number().min(1)
  })).min(3, "Polígono deve ter pelo menos 3 coordenadas").optional(),
  coordenadaCentral: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  raioMetros: z.number().min(1).max(100000, "Raio deve ser entre 1m e 100km").optional(),
  linhaTrajetoria: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    ordem: z.number().min(1)
  })).min(2, "Linha deve ter pelo menos 2 pontos").optional(),
  arquivoOriginal: z.string().optional(),
  tipoArquivo: z.enum(['kml', 'shape', 'geojson']).optional()
}).omit({ id: true, createdAt: true, updatedAt: true, tenantId: true });

export const agrupamentoSchema = createInsertSchema(agrupamentos, {
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().optional(),
  codigoIntegracao: z.string().optional(),
  areasVinculadas: z.array(z.string().uuid()).min(1, "Pelo menos uma área deve ser selecionada").optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, tenantId: true });

// TypeScript types
export type Local = typeof locais.$inferSelect;
export type NewLocal = z.infer<typeof localSchema>;
export type Regiao = typeof regioes.$inferSelect;
export type NewRegiao = z.infer<typeof regiaoSchema>;
export type RotaDinamica = typeof rotasDinamicas.$inferSelect;
export type NewRotaDinamica = z.infer<typeof rotaDinamicaSchema>;
export type Trecho = typeof trechos.$inferSelect;
export type NewTrecho = z.infer<typeof trechoSchema>;
export type RotaTrecho = typeof rotasTrecho.$inferSelect;
export type NewRotaTrecho = z.infer<typeof rotaTrechoSchema>;
export type Area = typeof areas.$inferSelect;
export type NewArea = z.infer<typeof areaSchema>;
export type Agrupamento = typeof agrupamentos.$inferSelect;
export type NewAgrupamento = z.infer<typeof agrupamentoSchema>;
export type TrechoRota = typeof trechosRota.$inferSelect;

// Business hours validation schema
export const horarioFuncionamentoSchema = z.object({
  segunda: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }).optional(),
  terca: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }).optional(),
  quarta: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }).optional(),
  quinta: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }).optional(),
  sexta: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }).optional(),
  sabado: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }).optional(),
  domingo: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }).optional()
}).optional();

// Feriados schema
export const feriadosSchema = z.object({
  municipais: z.array(z.object({
    data: z.string(),
    nome: z.string(),
    incluir: z.boolean()
  })).optional(),
  estaduais: z.array(z.object({
    data: z.string(),
    nome: z.string(),
    incluir: z.boolean()
  })).optional(),
  federais: z.array(z.object({
    data: z.string(),
    nome: z.string(),
    incluir: z.boolean()
  })).optional()
}).optional();

// Indisponibilidades schema (already defined above, removing duplicate)