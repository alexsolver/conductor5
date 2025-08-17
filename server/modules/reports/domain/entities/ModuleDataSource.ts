// ✅ 1QA.MD COMPLIANCE: DOMAIN ENTITY - MODULE DATA SOURCES
// Domain Layer - Integration with 25 system modules

export interface ModuleDataSource {
  module: string;
  displayName: string;
  description: string;
  category: 'core' | 'operations' | 'communication' | 'administration';
  tables: Array<{
    name: string;
    displayName: string;
    fields: Array<{
      name: string;
      type: string;
      displayName: string;
      isAggregatable: boolean;
      isFilterable: boolean;
      isGroupable: boolean;
    }>;
    relationships: Array<{
      table: string;
      type: 'oneToMany' | 'manyToOne' | 'manyToMany';
      foreignKey: string;
      displayName: string;
    }>;
  }>;
  defaultTemplates: ReportTemplate[];
  permissions: ModulePermissions;
  integrationSettings: ModuleIntegrationSettings;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: {
    dataSources: string[];
    defaultFields: string[];
    defaultFilters: Record<string, any>;
    defaultGrouping: string[];
    defaultSorting: Array<{ field: string; direction: 'asc' | 'desc' }>;
    chartConfig: {
      type: 'bar' | 'line' | 'pie' | 'table' | 'gauge' | 'area';
      xAxis: string;
      yAxis: string[];
      colors: string[];
    };
    metricsConfig: {
      kpis: Array<{
        name: string;
        calculation: string;
        target?: number;
        format: string;
      }>;
      alerts: Array<{
        condition: string;
        threshold: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
      }>;
    };
  };
  accessLevel: 'public' | 'private' | 'department' | 'executive';
}

export interface ModulePermissions {
  read: string[];
  write: string[];
  execute: string[];
  admin: string[];
}

export interface ModuleIntegrationSettings {
  realTimeEnabled: boolean;
  cacheStrategy: 'none' | 'memory' | 'redis' | 'database';
  cacheTTL: number; // seconds
  batchProcessing: boolean;
  maxRecordsPerQuery: number;
  supportedFormats: string[];
}

// 25 SYSTEM MODULES DATA SOURCES
export const SYSTEM_MODULE_SOURCES: Record<string, ModuleDataSource> = {
  // CORE MODULES
  tickets: {
    module: 'tickets',
    displayName: 'Tickets & Atendimento',
    description: 'Sistema principal de atendimento ao cliente com SLA e workflow',
    category: 'core',
    tables: [
      {
        name: 'tickets',
        displayName: 'Tickets',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'title', type: 'string', displayName: 'Título', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'status', type: 'string', displayName: 'Status', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'priority', type: 'string', displayName: 'Prioridade', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'created_at', type: 'date', displayName: 'Criado em', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'resolved_at', type: 'date', displayName: 'Resolvido em', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'sla_target', type: 'number', displayName: 'SLA Alvo (horas)', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'customer_id', type: 'uuid', displayName: 'Cliente', isAggregatable: false, isFilterable: true, isGroupable: true }
        ],
        relationships: [
          { table: 'customers', type: 'manyToOne', foreignKey: 'customer_id', displayName: 'Cliente do Ticket' },
          { table: 'users', type: 'manyToOne', foreignKey: 'assigned_to', displayName: 'Responsável' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'tickets-sla-performance',
        name: 'SLA Performance Report',
        description: 'Análise de performance de SLA e tempo de resolução',
        category: 'operational',
        config: {
          dataSources: ['tickets'],
          defaultFields: ['title', 'status', 'priority', 'created_at', 'resolved_at', 'sla_target'],
          defaultFilters: { status: ['open', 'in_progress', 'resolved'] },
          defaultGrouping: ['status', 'priority'],
          defaultSorting: [{ field: 'created_at', direction: 'desc' }],
          chartConfig: { type: 'bar', xAxis: 'status', yAxis: ['count'], colors: ['#3b82f6'] },
          metricsConfig: {
            kpis: [
              { name: 'SLA Compliance', calculation: 'percentage', target: 95, format: 'percentage' },
              { name: 'Avg Resolution Time', calculation: 'average', format: 'hours' }
            ],
            alerts: [
              { condition: 'sla_compliance < 90', threshold: 90, severity: 'high' }
            ]
          }
        },
        accessLevel: 'public'
      }
    ],
    permissions: { read: ['user'], write: ['agent'], execute: ['user'], admin: ['admin'] },
    integrationSettings: {
      realTimeEnabled: true,
      cacheStrategy: 'memory',
      cacheTTL: 300,
      batchProcessing: true,
      maxRecordsPerQuery: 10000,
      supportedFormats: ['json', 'csv', 'pdf', 'excel']
    }
  },

  customers: {
    module: 'customers',
    displayName: 'Clientes & Beneficiários',
    description: 'Gestão completa de clientes com histórico e relacionamentos',
    category: 'core',
    tables: [
      {
        name: 'customers',
        displayName: 'Clientes',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'email', type: 'string', displayName: 'Email', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'phone', type: 'string', displayName: 'Telefone', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'customer_type', type: 'string', displayName: 'Tipo', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'created_at', type: 'date', displayName: 'Cadastrado em', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'satisfaction_score', type: 'number', displayName: 'Score Satisfação', isAggregatable: true, isFilterable: true, isGroupable: false }
        ],
        relationships: [
          { table: 'tickets', type: 'oneToMany', foreignKey: 'customer_id', displayName: 'Tickets do Cliente' },
          { table: 'companies', type: 'manyToOne', foreignKey: 'company_id', displayName: 'Empresa' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'customers-satisfaction',
        name: 'Customer Satisfaction Dashboard',
        description: 'Análise de satisfação e comportamento dos clientes',
        category: 'analytical',
        config: {
          dataSources: ['customers', 'tickets'],
          defaultFields: ['name', 'satisfaction_score', 'customer_type', 'created_at'],
          defaultFilters: { customer_type: ['active'] },
          defaultGrouping: ['customer_type'],
          defaultSorting: [{ field: 'satisfaction_score', direction: 'desc' }],
          chartConfig: { type: 'line', xAxis: 'created_at', yAxis: ['satisfaction_score'], colors: ['#10b981'] },
          metricsConfig: {
            kpis: [
              { name: 'Avg Satisfaction', calculation: 'average', target: 4.5, format: 'decimal' },
              { name: 'Customer Retention', calculation: 'percentage', target: 85, format: 'percentage' }
            ],
            alerts: [
              { condition: 'avg_satisfaction < 4.0', threshold: 4.0, severity: 'medium' }
            ]
          }
        },
        accessLevel: 'public'
      }
    ],
    permissions: { read: ['user'], write: ['agent'], execute: ['user'], admin: ['admin'] },
    integrationSettings: {
      realTimeEnabled: false,
      cacheStrategy: 'database',
      cacheTTL: 3600,
      batchProcessing: true,
      maxRecordsPerQuery: 5000,
      supportedFormats: ['json', 'csv', 'pdf']
    }
  },

  materials_services: {
    module: 'materials_services',
    displayName: 'Materiais & Serviços',
    description: 'Gestão de estoque, fornecedores e precificação LPU',
    category: 'operations',
    tables: [
      {
        name: 'items',
        displayName: 'Itens',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'category', type: 'string', displayName: 'Categoria', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'price', type: 'number', displayName: 'Preço', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'stock_quantity', type: 'number', displayName: 'Estoque', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'supplier_id', type: 'uuid', displayName: 'Fornecedor', isAggregatable: false, isFilterable: true, isGroupable: true }
        ],
        relationships: [
          { table: 'suppliers', type: 'manyToOne', foreignKey: 'supplier_id', displayName: 'Fornecedor' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'inventory-management',
        name: 'Inventory Management Report',
        description: 'Controle de estoque e análise de giro',
        category: 'operational',
        config: {
          dataSources: ['items', 'suppliers'],
          defaultFields: ['name', 'category', 'price', 'stock_quantity'],
          defaultFilters: { category: ['material', 'service'] },
          defaultGrouping: ['category'],
          defaultSorting: [{ field: 'stock_quantity', direction: 'asc' }],
          chartConfig: { type: 'bar', xAxis: 'category', yAxis: ['stock_quantity'], colors: ['#f59e0b'] },
          metricsConfig: {
            kpis: [
              { name: 'Stock Turnover', calculation: 'ratio', target: 12, format: 'decimal' },
              { name: 'Low Stock Items', calculation: 'count', format: 'number' }
            ],
            alerts: [
              { condition: 'stock_quantity < 10', threshold: 10, severity: 'high' }
            ]
          }
        },
        accessLevel: 'department'
      }
    ],
    permissions: { read: ['user'], write: ['manager'], execute: ['user'], admin: ['admin'] },
    integrationSettings: {
      realTimeEnabled: true,
      cacheStrategy: 'memory',
      cacheTTL: 600,
      batchProcessing: false,
      maxRecordsPerQuery: 2000,
      supportedFormats: ['json', 'csv', 'excel']
    }
  },

  timecard: {
    module: 'timecard',
    displayName: 'Controle de Ponto',
    description: 'Sistema CLT-compliant de controle de jornada e ponto eletrônico',
    category: 'operations',
    tables: [
      {
        name: 'timecard_entries',
        displayName: 'Registros de Ponto',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'user_id', type: 'uuid', displayName: 'Usuário', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'entry_type', type: 'string', displayName: 'Tipo', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'timestamp', type: 'datetime', displayName: 'Data/Hora', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'worked_hours', type: 'number', displayName: 'Horas Trabalhadas', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'overtime_hours', type: 'number', displayName: 'Horas Extras', isAggregatable: true, isFilterable: true, isGroupable: false }
        ],
        relationships: [
          { table: 'users', type: 'manyToOne', foreignKey: 'user_id', displayName: 'Funcionário' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'clt-compliance',
        name: 'CLT Compliance Dashboard',
        description: 'Monitoramento de compliance trabalhista e horas extras',
        category: 'compliance',
        config: {
          dataSources: ['timecard_entries', 'users'],
          defaultFields: ['user_id', 'worked_hours', 'overtime_hours', 'timestamp'],
          defaultFilters: { entry_type: ['work'] },
          defaultGrouping: ['user_id'],
          defaultSorting: [{ field: 'timestamp', direction: 'desc' }],
          chartConfig: { type: 'line', xAxis: 'timestamp', yAxis: ['worked_hours', 'overtime_hours'], colors: ['#3b82f6', '#ef4444'] },
          metricsConfig: {
            kpis: [
              { name: 'Overtime Compliance', calculation: 'percentage', target: 100, format: 'percentage' },
              { name: 'Avg Weekly Hours', calculation: 'average', target: 44, format: 'decimal' }
            ],
            alerts: [
              { condition: 'overtime_hours > 2', threshold: 2, severity: 'critical' }
            ]
          }
        },
        accessLevel: 'department'
      }
    ],
    permissions: { read: ['hr'], write: ['hr'], execute: ['hr'], admin: ['admin'] },
    integrationSettings: {
      realTimeEnabled: true,
      cacheStrategy: 'database',
      cacheTTL: 1800,
      batchProcessing: true,
      maxRecordsPerQuery: 15000,
      supportedFormats: ['json', 'csv', 'pdf']
    }
  }

  // More modules will be added in subsequent implementations...
};