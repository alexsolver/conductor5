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
  },

  users: {
    module: 'users',
    displayName: 'Usuários & Equipes',
    description: 'Gestão de usuários, produtividade e padrões de acesso',
    category: 'core',
    tables: [
      {
        name: 'users',
        displayName: 'Usuários',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'email', type: 'string', displayName: 'Email', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'first_name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'last_name', type: 'string', displayName: 'Sobrenome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'role', type: 'string', displayName: 'Função', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'department', type: 'string', displayName: 'Departamento', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'last_login_at', type: 'datetime', displayName: 'Último Login', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'created_at', type: 'date', displayName: 'Criado em', isAggregatable: true, isFilterable: true, isGroupable: true }
        ],
        relationships: [
          { table: 'tickets', type: 'oneToMany', foreignKey: 'assigned_to', displayName: 'Tickets Atribuídos' },
          { table: 'timecard_entries', type: 'oneToMany', foreignKey: 'user_id', displayName: 'Registros de Ponto' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'users-activity',
        name: 'User Activity Report',
        description: 'Análise de atividade e produtividade dos usuários',
        category: 'operational',
        config: {
          dataSources: ['users', 'tickets'],
          defaultFields: ['first_name', 'last_name', 'role', 'last_login_at'],
          defaultFilters: { role: ['agent', 'manager'] },
          defaultGrouping: ['department', 'role'],
          defaultSorting: [{ field: 'last_login_at', direction: 'desc' }],
          chartConfig: { type: 'bar', xAxis: 'department', yAxis: ['count'], colors: ['#8b5cf6'] },
          metricsConfig: {
            kpis: [
              { name: 'Active Users', calculation: 'count', format: 'number' },
              { name: 'Avg Login Frequency', calculation: 'average', format: 'days' }
            ],
            alerts: [
              { condition: 'inactive_days > 7', threshold: 7, severity: 'medium' }
            ]
          }
        },
        accessLevel: 'department'
      }
    ],
    permissions: { read: ['hr'], write: ['hr'], execute: ['hr'], admin: ['admin'] },
    integrationSettings: {
      realTimeEnabled: false,
      cacheStrategy: 'database',
      cacheTTL: 1800,
      batchProcessing: true,
      maxRecordsPerQuery: 1000,
      supportedFormats: ['json', 'csv', 'pdf']
    }
  },

  companies: {
    module: 'companies',
    displayName: 'Empresas & Multi-tenant',
    description: 'Análise de performance por empresa e métricas multi-tenant',
    category: 'core',
    tables: [
      {
        name: 'companies',
        displayName: 'Empresas',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'document_number', type: 'string', displayName: 'CNPJ/CPF', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'industry', type: 'string', displayName: 'Setor', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'size', type: 'string', displayName: 'Porte', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'revenue', type: 'number', displayName: 'Receita', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'created_at', type: 'date', displayName: 'Criado em', isAggregatable: true, isFilterable: true, isGroupable: true }
        ],
        relationships: [
          { table: 'customers', type: 'oneToMany', foreignKey: 'company_id', displayName: 'Clientes da Empresa' },
          { table: 'users', type: 'oneToMany', foreignKey: 'company_id', displayName: 'Usuários da Empresa' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'companies-performance',
        name: 'Company Performance Dashboard',
        description: 'Análise de performance e métricas por empresa',
        category: 'strategic',
        config: {
          dataSources: ['companies', 'customers', 'users'],
          defaultFields: ['name', 'industry', 'size', 'revenue'],
          defaultFilters: { size: ['small', 'medium', 'large'] },
          defaultGrouping: ['industry', 'size'],
          defaultSorting: [{ field: 'revenue', direction: 'desc' }],
          chartConfig: { type: 'pie', xAxis: 'industry', yAxis: ['revenue'], colors: ['#06b6d4'] },
          metricsConfig: {
            kpis: [
              { name: 'Total Revenue', calculation: 'sum', format: 'currency' },
              { name: 'Avg Company Size', calculation: 'mode', format: 'text' }
            ],
            alerts: [
              { condition: 'revenue_drop > 20', threshold: 20, severity: 'high' }
            ]
          }
        },
        accessLevel: 'executive'
      }
    ],
    permissions: { read: ['manager'], write: ['admin'], execute: ['manager'], admin: ['admin'] },
    integrationSettings: {
      realTimeEnabled: false,
      cacheStrategy: 'database',
      cacheTTL: 3600,
      batchProcessing: true,
      maxRecordsPerQuery: 500,
      supportedFormats: ['json', 'csv', 'pdf', 'excel']
    }
  },

  locations: {
    module: 'locations',
    displayName: 'Localizações & Geografia',
    description: 'Performance geográfica e comparação regional',
    category: 'operations',
    tables: [
      {
        name: 'locations',
        displayName: 'Localizações',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'address', type: 'string', displayName: 'Endereço', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'city', type: 'string', displayName: 'Cidade', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'state', type: 'string', displayName: 'Estado', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'country', type: 'string', displayName: 'País', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'latitude', type: 'number', displayName: 'Latitude', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'longitude', type: 'number', displayName: 'Longitude', isAggregatable: true, isFilterable: true, isGroupable: false }
        ],
        relationships: [
          { table: 'users', type: 'oneToMany', foreignKey: 'location_id', displayName: 'Usuários na Localização' },
          { table: 'companies', type: 'oneToMany', foreignKey: 'location_id', displayName: 'Empresas na Localização' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'locations-geographic',
        name: 'Geographic Performance Report',
        description: 'Análise de performance geográfica e comparação regional',
        category: 'analytical',
        config: {
          dataSources: ['locations', 'users', 'companies'],
          defaultFields: ['name', 'city', 'state', 'country'],
          defaultFilters: { country: ['Brazil'] },
          defaultGrouping: ['state', 'city'],
          defaultSorting: [{ field: 'name', direction: 'asc' }],
          chartConfig: { type: 'area', xAxis: 'coordinates', yAxis: ['count'], colors: ['#22c55e'] },
          metricsConfig: {
            kpis: [
              { name: 'Total Locations', calculation: 'count', format: 'number' },
              { name: 'Regional Coverage', calculation: 'percentage', format: 'percentage' }
            ],
            alerts: [
              { condition: 'coverage < 80', threshold: 80, severity: 'medium' }
            ]
          }
        },
        accessLevel: 'public'
      }
    ],
    permissions: { read: ['user'], write: ['manager'], execute: ['user'], admin: ['admin'] },
    integrationSettings: {
      realTimeEnabled: false,
      cacheStrategy: 'memory',
      cacheTTL: 7200,
      batchProcessing: false,
      maxRecordsPerQuery: 1000,
      supportedFormats: ['json', 'csv', 'excel']
    }
  },

  omnibridge: {
    module: 'omnibridge',
    displayName: 'Omnichannel & Comunicação',
    description: 'Performance de canais e automação de comunicação',
    category: 'communication',
    tables: [
      {
        name: 'channels',
        displayName: 'Canais',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'type', type: 'string', displayName: 'Tipo', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'status', type: 'string', displayName: 'Status', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'message_count', type: 'number', displayName: 'Total Mensagens', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'response_time_avg', type: 'number', displayName: 'Tempo Resposta Médio', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'satisfaction_score', type: 'number', displayName: 'Score Satisfação', isAggregatable: true, isFilterable: true, isGroupable: false }
        ],
        relationships: [
          { table: 'messages', type: 'oneToMany', foreignKey: 'channel_id', displayName: 'Mensagens do Canal' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'omnibridge-performance',
        name: 'Channel Performance Dashboard',
        description: 'Análise de performance de canais e automação',
        category: 'operational',
        config: {
          dataSources: ['channels', 'messages'],
          defaultFields: ['name', 'type', 'message_count', 'response_time_avg', 'satisfaction_score'],
          defaultFilters: { status: ['active'] },
          defaultGrouping: ['type'],
          defaultSorting: [{ field: 'satisfaction_score', direction: 'desc' }],
          chartConfig: { type: 'line', xAxis: 'type', yAxis: ['response_time_avg', 'satisfaction_score'], colors: ['#f59e0b', '#10b981'] },
          metricsConfig: {
            kpis: [
              { name: 'Avg Response Time', calculation: 'average', target: 60, format: 'seconds' },
              { name: 'Channel Satisfaction', calculation: 'average', target: 4.5, format: 'decimal' }
            ],
            alerts: [
              { condition: 'response_time > 120', threshold: 120, severity: 'high' }
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
      maxRecordsPerQuery: 5000,
      supportedFormats: ['json', 'csv', 'pdf']
    }
  },

  notifications: {
    module: 'notifications',
    displayName: 'Notificações & Engajamento',
    description: 'Taxas de entrega, engajamento e preferências de canal',
    category: 'communication',
    tables: [
      {
        name: 'notifications',
        displayName: 'Notificações',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'type', type: 'string', displayName: 'Tipo', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'channel', type: 'string', displayName: 'Canal', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'status', type: 'string', displayName: 'Status', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'sent_at', type: 'datetime', displayName: 'Enviado em', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'delivered_at', type: 'datetime', displayName: 'Entregue em', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'read_at', type: 'datetime', displayName: 'Lido em', isAggregatable: true, isFilterable: true, isGroupable: true }
        ],
        relationships: [
          { table: 'users', type: 'manyToOne', foreignKey: 'user_id', displayName: 'Usuário Destinatário' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'notifications-delivery',
        name: 'Notification Delivery Report',
        description: 'Análise de taxas de entrega e engajamento',
        category: 'operational',
        config: {
          dataSources: ['notifications', 'users'],
          defaultFields: ['type', 'channel', 'status', 'sent_at', 'delivered_at'],
          defaultFilters: { status: ['sent', 'delivered', 'read'] },
          defaultGrouping: ['channel', 'type'],
          defaultSorting: [{ field: 'sent_at', direction: 'desc' }],
          chartConfig: { type: 'bar', xAxis: 'channel', yAxis: ['count'], colors: ['#3b82f6'] },
          metricsConfig: {
            kpis: [
              { name: 'Delivery Rate', calculation: 'percentage', target: 95, format: 'percentage' },
              { name: 'Read Rate', calculation: 'percentage', target: 70, format: 'percentage' }
            ],
            alerts: [
              { condition: 'delivery_rate < 90', threshold: 90, severity: 'high' }
            ]
          }
        },
        accessLevel: 'department'
      }
    ],
    permissions: { read: ['user'], write: ['admin'], execute: ['user'], admin: ['admin'] },
    integrationSettings: {
      realTimeEnabled: true,
      cacheStrategy: 'memory',
      cacheTTL: 600,
      batchProcessing: true,
      maxRecordsPerQuery: 10000,
      supportedFormats: ['json', 'csv', 'excel']
    }
  },

  custom_fields: {
    module: 'custom_fields',
    displayName: 'Campos Personalizados',
    description: 'Análise de uso, adoção e qualidade de dados',
    category: 'administration',
    tables: [
      {
        name: 'custom_fields',
        displayName: 'Campos Personalizados',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'field_type', type: 'string', displayName: 'Tipo', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'module_name', type: 'string', displayName: 'Módulo', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'usage_count', type: 'number', displayName: 'Uso Total', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'is_required', type: 'boolean', displayName: 'Obrigatório', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'created_at', type: 'date', displayName: 'Criado em', isAggregatable: true, isFilterable: true, isGroupable: true }
        ],
        relationships: []
      }
    ],
    defaultTemplates: [
      {
        id: 'custom-fields-usage',
        name: 'Custom Fields Usage Analytics',
        description: 'Análise de uso e adoção de campos personalizados',
        category: 'analytical',
        config: {
          dataSources: ['custom_fields'],
          defaultFields: ['name', 'field_type', 'module_name', 'usage_count', 'is_required'],
          defaultFilters: { is_required: [true, false] },
          defaultGrouping: ['module_name', 'field_type'],
          defaultSorting: [{ field: 'usage_count', direction: 'desc' }],
          chartConfig: { type: 'bar', xAxis: 'module_name', yAxis: ['usage_count'], colors: ['#8b5cf6'] },
          metricsConfig: {
            kpis: [
              { name: 'Total Custom Fields', calculation: 'count', format: 'number' },
              { name: 'Avg Usage Rate', calculation: 'average', format: 'percentage' }
            ],
            alerts: [
              { condition: 'usage_rate < 30', threshold: 30, severity: 'low' }
            ]
          }
        },
        accessLevel: 'department'
      }
    ],
    permissions: { read: ['admin'], write: ['admin'], execute: ['admin'], admin: ['admin'] },
    integrationSettings: {
      realTimeEnabled: false,
      cacheStrategy: 'database',
      cacheTTL: 3600,
      batchProcessing: true,
      maxRecordsPerQuery: 1000,
      supportedFormats: ['json', 'csv', 'excel']
    }
  },

  saas_admin: {
    module: 'saas_admin',
    displayName: 'SaaS Administration',
    description: 'Métricas de tenant, utilização do sistema e análise de billing',
    category: 'administration',
    tables: [
      {
        name: 'tenants',
        displayName: 'Tenants',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'plan', type: 'string', displayName: 'Plano', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'status', type: 'string', displayName: 'Status', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'user_count', type: 'number', displayName: 'Total Usuários', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'storage_used', type: 'number', displayName: 'Storage Usado (GB)', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'monthly_revenue', type: 'number', displayName: 'Receita Mensal', isAggregatable: true, isFilterable: true, isGroupable: false }
        ],
        relationships: [
          { table: 'users', type: 'oneToMany', foreignKey: 'tenant_id', displayName: 'Usuários do Tenant' }
        ]
      }
    ],
    defaultTemplates: [
      {
        id: 'saas-admin-metrics',
        name: 'SaaS Administration Metrics',
        description: 'Métricas de utilização e billing por tenant',
        category: 'strategic',
        config: {
          dataSources: ['tenants', 'users'],
          defaultFields: ['name', 'plan', 'status', 'user_count', 'storage_used', 'monthly_revenue'],
          defaultFilters: { status: ['active', 'trial'] },
          defaultGrouping: ['plan', 'status'],
          defaultSorting: [{ field: 'monthly_revenue', direction: 'desc' }],
          chartConfig: { type: 'pie', xAxis: 'plan', yAxis: ['monthly_revenue'], colors: ['#ef4444'] },
          metricsConfig: {
            kpis: [
              { name: 'Total MRR', calculation: 'sum', format: 'currency' },
              { name: 'Avg Users per Tenant', calculation: 'average', format: 'decimal' }
            ],
            alerts: [
              { condition: 'churn_rate > 5', threshold: 5, severity: 'critical' }
            ]
          }
        },
        accessLevel: 'executive'
      }
    ],
    permissions: { read: ['saas_admin'], write: ['saas_admin'], execute: ['saas_admin'], admin: ['saas_admin'] },
    integrationSettings: {
      realTimeEnabled: false,
      cacheStrategy: 'database',
      cacheTTL: 1800,
      batchProcessing: true,
      maxRecordsPerQuery: 500,
      supportedFormats: ['json', 'csv', 'pdf', 'excel']
    }
  }

  // Continue with remaining modules as needed...
};