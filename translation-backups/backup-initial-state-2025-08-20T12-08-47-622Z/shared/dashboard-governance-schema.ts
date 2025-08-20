// Dashboard Governance Schema - Following 1qa.md Clean Architecture
// 4 Camadas: Fonte → KPI → Apresentação → Regras
import { z } from "zod";

// 1) FONTES & MODELAGEM
export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['database', 'api', 'webhook', 'external']),
  endpoint: z.string().optional(),
  schema: z.string().optional(), // tenant schema
  description: z.string(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'date', 'boolean']),
    description: z.string(),
    unit: z.string().optional(),
  })),
  refresh_interval: z.number().default(300), // segundos
  is_active: z.boolean().default(true),
});

export const ViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  data_source: z.string(),
  query: z.string(),
  description: z.string(),
  fields: z.array(z.string()),
});

export const ComputedFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  formula: z.string(),
  return_type: z.enum(['number', 'percentage', 'duration', 'count']),
  description: z.string(),
  unit: z.string().optional(),
});

export const DateDimensionSchema = z.object({
  field: z.string(),
  type: z.enum(['created_at', 'updated_at', 'closed_at', 'due_at']),
  timezone: z.string().default('America/Sao_Paulo'),
});

// 2) KPIs & MÉTRICAS
export const KPISchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  data_source: z.string(),
  formula: z.string(),
  aggregation: z.enum(['sum', 'count', 'avg', 'min', 'max', 'distinct_count']),
  period: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']).default('day'),
  direction: z.enum(['up', 'down', 'neutral']), // ↑ bom, ↓ bom, neutro
  unit: z.string(),
  format: z.object({
    decimals: z.number().default(0),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  }),
});

export const TargetSchema = z.object({
  kpi_id: z.string(),
  target: z.number(),
  warning: z.number(),
  critical: z.number(),
  colors: z.object({
    good: z.string().default('#10b981'), // green
    warning: z.string().default('#f59e0b'), // amber
    critical: z.string().default('#ef4444'), // red
  }),
});

export const SegmentationSchema = z.object({
  id: z.string(),
  name: z.string(),
  field: z.string(),
  values: z.array(z.string()),
  default_value: z.string().optional(),
});

export const BreakdownSchema = z.object({
  type: z.enum(['time', 'category', 'location', 'user', 'contract']),
  field: z.string(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
});

// 3) APRESENTAÇÃO (CARDS)
export const CardTypeSchema = z.enum([
  'kpi_simple', 'metric_comparative', 'table', 'bar_chart', 
  'line_chart', 'pie_chart', 'gauge', 'heatmap', 
  'critical_items', 'funnel', 'trend_indicator'
]);

export const CardLayoutSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'extra_large']).default('medium'),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
});

export const DrilldownSchema = z.object({
  type: z.enum(['report', 'table', 'dashboard', 'external_link']),
  target: z.string(),
  filters: z.record(z.any()).optional(),
  new_window: z.boolean().default(false),
});

export const ConditionalFormatSchema = z.object({
  field: z.string(),
  conditions: z.array(z.object({
    operator: z.enum(['>', '<', '>=', '<=', '==', '!=', 'between']),
    value: z.union([z.number(), z.string(), z.array(z.number())]),
    color: z.string(),
    icon: z.string().optional(),
    background_color: z.string().optional(),
  })),
});

export const DynamicCardSchema = z.object({
  template: z.string(), // "Top N {entity} com {metric} {direction}"
  entity: z.string(), // locais, contratos, agentes
  metric: z.string(), // pior SLA, mais tickets
  direction: z.enum(['highest', 'lowest']),
  limit: z.number().default(5),
  auto_refresh: z.boolean().default(true),
});

// 4) REGRAS (FILTROS, ESCOPO, PERMISSÕES)
export const FilterRuleSchema = z.object({
  field: z.string(),
  operator: z.enum(['=', '!=', '>', '<', '>=', '<=', 'in', 'not_in', 'like', 'between']),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
  required: z.boolean().default(false),
});

export const ScopeRuleSchema = z.object({
  type: z.enum(['tenant', 'user', 'role', 'location', 'contract']),
  field: z.string(),
  restriction: z.enum(['own_data', 'department_data', 'all_data']),
});

export const PermissionRuleSchema = z.object({
  role: z.string(),
  actions: z.array(z.enum(['view', 'edit', 'delete', 'share', 'export'])),
  restrictions: z.array(z.string()).optional(),
});

export const RefreshRuleSchema = z.object({
  mode: z.enum(['manual', 'scheduled', 'real_time']),
  interval: z.number().optional(), // segundos
  schedule: z.string().optional(), // cron expression
  cache_duration: z.number().default(300),
});

// SCHEMA PRINCIPAL DO CARD GOVERNADO
export const GovernedCardSchema = z.object({
  // Identificação
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  // Camada 1: Fonte de Dados
  data_source: DataSourceSchema,
  view: ViewSchema.optional(),
  computed_fields: z.array(ComputedFieldSchema).default([]),
  date_dimensions: z.array(DateDimensionSchema).default([]),
  
  // Camada 2: KPI & Métricas
  kpi: KPISchema,
  targets: TargetSchema.optional(),
  segmentations: z.array(SegmentationSchema).default([]),
  breakdown: BreakdownSchema.optional(),
  
  // Camada 3: Apresentação
  card_type: CardTypeSchema,
  layout: CardLayoutSchema,
  drilldown: DrilldownSchema.optional(),
  conditional_format: ConditionalFormatSchema.optional(),
  dynamic_config: DynamicCardSchema.optional(),
  
  // Camada 4: Regras
  filters: z.array(FilterRuleSchema).default([]),
  scope_rules: z.array(ScopeRuleSchema).default([]),
  permission_rules: z.array(PermissionRuleSchema).default([]),
  refresh_rules: RefreshRuleSchema,
  
  // Metadados
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  version: z.number().default(1),
  is_active: z.boolean().default(true),
});

// TIPOS DERIVADOS
export type DataSource = z.infer<typeof DataSourceSchema>;
export type KPI = z.infer<typeof KPISchema>;
export type GovernedCard = z.infer<typeof GovernedCardSchema>;
export type CardType = z.infer<typeof CardTypeSchema>;
export type FilterRule = z.infer<typeof FilterRuleSchema>;
export type ScopeRule = z.infer<typeof ScopeRuleSchema>;
export type RefreshRule = z.infer<typeof RefreshRuleSchema>;

// CATÁLOGO DE FONTES PADRÃO - CONDUCTOR
export const CONDUCTOR_DATA_SOURCES: Record<string, Partial<DataSource>> = {
  tickets: {
    id: 'tickets',
    name: 'Sistema de Tickets',
    type: 'database',
    description: 'Tickets de suporte, incidentes e solicitações',
    fields: [
      { name: 'id', type: 'string', description: 'ID único do ticket' },
      { name: 'status', type: 'string', description: 'Status atual' },
      { name: 'priority', type: 'string', description: 'Prioridade' },
      { name: 'created_at', type: 'date', description: 'Data criação' },
      { name: 'resolved_at', type: 'date', description: 'Data resolução' },
      { name: 'sla_due', type: 'date', description: 'Vencimento SLA' },
    ]
  },
  contracts: {
    id: 'contracts',
    name: 'Contratos',
    type: 'database',
    description: 'Contratos de serviço e SLAs',
    fields: [
      { name: 'id', type: 'string', description: 'ID contrato' },
      { name: 'status', type: 'string', description: 'Status contrato' },
      { name: 'value', type: 'number', description: 'Valor', unit: 'BRL' },
      { name: 'start_date', type: 'date', description: 'Início vigência' },
      { name: 'end_date', type: 'date', description: 'Fim vigência' },
    ]
  },
  timecard: {
    id: 'timecard',
    name: 'Timecard CLT',
    type: 'database', 
    description: 'Controle de ponto eletrônico',
    fields: [
      { name: 'user_id', type: 'string', description: 'ID usuário' },
      { name: 'date', type: 'date', description: 'Data' },
      { name: 'hours_worked', type: 'number', description: 'Horas trabalhadas', unit: 'horas' },
      { name: 'status', type: 'string', description: 'Status do ponto' },
    ]
  }
};

// KPIS PRÉ-CONFIGURADOS
export const CONDUCTOR_KPIS: Record<string, Partial<KPI>> = {
  total_tickets: {
    id: 'total_tickets',
    name: 'Total de Tickets',
    data_source: 'tickets',
    formula: 'COUNT(*)',
    aggregation: 'count',
    direction: 'neutral',
    unit: 'tickets',
  },
  sla_compliance: {
    id: 'sla_compliance',
    name: 'Cumprimento SLA',
    data_source: 'tickets',
    formula: 'COUNT(CASE WHEN resolved_at <= sla_due THEN 1 END) / COUNT(*) * 100',
    aggregation: 'avg',
    direction: 'up',
    unit: '%',
  },
  avg_resolution_time: {
    id: 'avg_resolution_time',
    name: 'Tempo Médio Resolução',
    data_source: 'tickets',
    formula: 'AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)',
    aggregation: 'avg',
    direction: 'down',
    unit: 'horas',
  }
};