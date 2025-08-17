export interface ReportTemplate {
  id: string;
  tenantId: string;
  moduleId: string;
  name: string;
  description: string;
  category: string;
  ownerId?: string;
  templateConfig: {
    dataSources: Array<{
      module: string;
      tables: string[];
      relationships: Record<string, string>;
    }>;
    defaultFields: string[];
    defaultFilters: Record<string, any>;
    defaultGrouping: string[];
    defaultSorting: Array<{ field: string; direction: 'asc' | 'desc' }>;
    chartConfig: {
      type: string;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleDataSource {
  module: string;
  displayName: string;
  description: string;
  tables: Array<{
    name: string;
    displayName: string;
    fields: Array<{
      name: string;
      type: string;
      displayName: string;
      isAggregatable: boolean;
      isFilterable: boolean;
    }>;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one';
    foreignKey: string;
  }>;
  businessRules: Array<{
    name: string;
    description: string;
    calculation: string;
  }>;
}

// Templates pré-configurados por módulo seguindo especificação
export const MODULE_TEMPLATES: Record<string, ReportTemplate[]> = {
  tickets: [
    {
      id: 'sla-performance-template',
      tenantId: '',
      moduleId: 'tickets',
      name: 'SLA Performance Report',
      description: 'Análise de violações de SLA e métricas de tempo de resposta',
      category: 'performance',
      templateConfig: {
        dataSources: [{
          module: 'tickets',
          tables: ['tickets', 'ticket_comments', 'users'],
          relationships: { 'tickets.assignedTo': 'users.id', 'tickets.id': 'ticket_comments.ticketId' }
        }],
        defaultFields: ['title', 'status', 'priority', 'createdAt', 'resolvedAt', 'slaTarget', 'slaBreached'],
        defaultFilters: { createdAt: { gte: '30_days_ago' } },
        defaultGrouping: ['status', 'priority'],
        defaultSorting: [{ field: 'createdAt', direction: 'desc' }],
        chartConfig: {
          type: 'bar',
          xAxis: 'status',
          yAxis: ['count', 'avgResolutionTime'],
          colors: ['#8b5cf6', '#06b6d4']
        },
        metricsConfig: {
          kpis: [
            { name: 'SLA Compliance', calculation: '(total_tickets - sla_breached) / total_tickets * 100', target: 95, format: 'percentage' },
            { name: 'Avg Resolution Time', calculation: 'avg(resolution_time)', format: 'hours' },
            { name: 'First Response Time', calculation: 'avg(first_response_time)', format: 'hours' }
          ],
          alerts: [
            { condition: 'sla_compliance < 90', threshold: 90, severity: 'critical' },
            { condition: 'avg_resolution_time > 24', threshold: 24, severity: 'high' }
          ]
        }
      },
      accessLevel: 'department',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  materials_services: [
    {
      id: 'inventory-management-template',
      tenantId: '',
      moduleId: 'materials_services',
      name: 'Inventory Management Report',
      description: 'Níveis de estoque, rotatividade e pontos de reposição',
      category: 'inventory',
      templateConfig: {
        dataSources: [{
          module: 'materials_services',
          tables: ['items', 'item_catalog', 'suppliers'],
          relationships: { 'items.catalogId': 'item_catalog.id', 'items.supplierId': 'suppliers.id' }
        }],
        defaultFields: ['name', 'currentStock', 'minimumStock', 'maximumStock', 'unitCost', 'turnoverRate'],
        defaultFilters: { isActive: true },
        defaultGrouping: ['category', 'supplier'],
        defaultSorting: [{ field: 'turnoverRate', direction: 'desc' }],
        chartConfig: {
          type: 'column',
          xAxis: 'category',
          yAxis: ['currentStock', 'minimumStock'],
          colors: ['#10b981', '#f59e0b']
        },
        metricsConfig: {
          kpis: [
            { name: 'Inventory Turnover', calculation: 'sum(cost_of_goods_sold) / avg(inventory_value)', format: 'number' },
            { name: 'Stock Out Rate', calculation: 'count(items_out_of_stock) / count(total_items) * 100', format: 'percentage' },
            { name: 'Carrying Cost', calculation: 'inventory_value * carrying_cost_rate', format: 'currency' }
          ],
          alerts: [
            { condition: 'stock_level < minimum_stock', threshold: 1, severity: 'high' },
            { condition: 'inventory_turnover < 4', threshold: 4, severity: 'medium' }
          ]
        }
      },
      accessLevel: 'department',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  timecard: [
    {
      id: 'clt-compliance-template',
      tenantId: '',
      moduleId: 'timecard',
      name: 'CLT Compliance Dashboard',
      description: 'Violações de horas extras, compliance de pausas e alertas legais',
      category: 'compliance',
      templateConfig: {
        dataSources: [{
          module: 'timecard',
          tables: ['timecards', 'time_entries', 'users'],
          relationships: { 'timecards.userId': 'users.id', 'timecards.id': 'time_entries.timecardId' }
        }],
        defaultFields: ['userId', 'date', 'hoursWorked', 'overtimeHours', 'breakDuration', 'cltViolations'],
        defaultFilters: { date: { gte: '30_days_ago' } },
        defaultGrouping: ['userId', 'week'],
        defaultSorting: [{ field: 'date', direction: 'desc' }],
        chartConfig: {
          type: 'line',
          xAxis: 'date',
          yAxis: ['hoursWorked', 'overtimeHours'],
          colors: ['#3b82f6', '#ef4444']
        },
        metricsConfig: {
          kpis: [
            { name: 'CLT Compliance Rate', calculation: '(total_employees - employees_with_violations) / total_employees * 100', target: 100, format: 'percentage' },
            { name: 'Avg Weekly Hours', calculation: 'avg(weekly_hours)', target: 44, format: 'hours' },
            { name: 'Overtime Rate', calculation: 'sum(overtime_hours) / sum(regular_hours) * 100', format: 'percentage' }
          ],
          alerts: [
            { condition: 'weekly_hours > 44', threshold: 44, severity: 'critical' },
            { condition: 'consecutive_days > 6', threshold: 6, severity: 'high' },
            { condition: 'break_duration < 15', threshold: 15, severity: 'medium' }
          ]
        }
      },
      accessLevel: 'department',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  omnibridge: [
    {
      id: 'channel-performance-template',
      tenantId: '',
      moduleId: 'omnibridge',
      name: 'Channel Performance Dashboard',
      description: 'Tempos de resposta, taxas de conversão e métricas de engajamento',
      category: 'communication',
      templateConfig: {
        dataSources: [{
          module: 'omnibridge',
          tables: ['channels', 'messages', 'conversations'],
          relationships: { 'messages.channelId': 'channels.id', 'messages.conversationId': 'conversations.id' }
        }],
        defaultFields: ['channelId', 'messageCount', 'responseTime', 'resolutionRate', 'customerSatisfaction'],
        defaultFilters: { createdAt: { gte: '7_days_ago' } },
        defaultGrouping: ['channelId', 'day'],
        defaultSorting: [{ field: 'responseTime', direction: 'asc' }],
        chartConfig: {
          type: 'mixed',
          xAxis: 'day',
          yAxis: ['messageCount', 'responseTime'],
          colors: ['#8b5cf6', '#06b6d4']
        },
        metricsConfig: {
          kpis: [
            { name: 'Avg Response Time', calculation: 'avg(response_time)', target: 300, format: 'seconds' },
            { name: 'Resolution Rate', calculation: 'count(resolved_conversations) / count(total_conversations) * 100', target: 90, format: 'percentage' },
            { name: 'Customer Satisfaction', calculation: 'avg(satisfaction_score)', target: 4.5, format: 'rating' }
          ],
          alerts: [
            { condition: 'avg_response_time > 600', threshold: 600, severity: 'high' },
            { condition: 'resolution_rate < 80', threshold: 80, severity: 'medium' }
          ]
        }
      },
      accessLevel: 'department',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

// Definição de fontes de dados dos 25 módulos do sistema
export const SYSTEM_DATA_SOURCES: Record<string, ModuleDataSource> = {
  tickets: {
    module: 'tickets',
    displayName: 'Tickets & SLA',
    description: 'Sistema de gestão de tickets com métricas de SLA e atendimento',
    tables: [
      {
        name: 'tickets',
        displayName: 'Tickets',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true },
          { name: 'title', type: 'string', displayName: 'Título', isAggregatable: false, isFilterable: true },
          { name: 'status', type: 'string', displayName: 'Status', isAggregatable: true, isFilterable: true },
          { name: 'priority', type: 'string', displayName: 'Prioridade', isAggregatable: true, isFilterable: true },
          { name: 'createdAt', type: 'datetime', displayName: 'Criado em', isAggregatable: false, isFilterable: true },
          { name: 'resolvedAt', type: 'datetime', displayName: 'Resolvido em', isAggregatable: false, isFilterable: true }
        ]
      }
    ],
    relationships: [
      { from: 'tickets.assignedTo', to: 'users.id', type: 'many-to-one', foreignKey: 'assignedTo' }
    ],
    businessRules: [
      { name: 'SLA Breach', description: 'Ticket violou SLA quando tempo de resolução > SLA target', calculation: 'resolution_time > sla_target' },
      { name: 'Response Time', description: 'Tempo até primeira resposta', calculation: 'first_comment_time - created_time' }
    ]
  },
  materials_services: {
    module: 'materials_services',
    displayName: 'Materiais & Serviços',
    description: 'Gestão de inventário, fornecedores e precificação LPU',
    tables: [
      {
        name: 'items',
        displayName: 'Itens',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true },
          { name: 'currentStock', type: 'number', displayName: 'Estoque Atual', isAggregatable: true, isFilterable: true },
          { name: 'minimumStock', type: 'number', displayName: 'Estoque Mínimo', isAggregatable: true, isFilterable: true },
          { name: 'unitCost', type: 'decimal', displayName: 'Custo Unitário', isAggregatable: true, isFilterable: true }
        ]
      }
    ],
    relationships: [
      { from: 'items.supplierId', to: 'suppliers.id', type: 'many-to-one', foreignKey: 'supplierId' }
    ],
    businessRules: [
      { name: 'Stock Level', description: 'Nível de estoque crítico', calculation: 'current_stock <= minimum_stock' },
      { name: 'Turnover Rate', description: 'Taxa de rotatividade do estoque', calculation: 'cost_of_goods_sold / average_inventory' }
    ]
  },
  timecard: {
    module: 'timecard',
    displayName: 'Controle de Ponto',
    description: 'Sistema de ponto eletrônico com compliance CLT',
    tables: [
      {
        name: 'timecards',
        displayName: 'Cartões de Ponto',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true },
          { name: 'userId', type: 'uuid', displayName: 'Usuário', isAggregatable: true, isFilterable: true },
          { name: 'date', type: 'date', displayName: 'Data', isAggregatable: false, isFilterable: true },
          { name: 'hoursWorked', type: 'decimal', displayName: 'Horas Trabalhadas', isAggregatable: true, isFilterable: true },
          { name: 'overtimeHours', type: 'decimal', displayName: 'Horas Extras', isAggregatable: true, isFilterable: true }
        ]
      }
    ],
    relationships: [
      { from: 'timecards.userId', to: 'users.id', type: 'many-to-one', foreignKey: 'userId' }
    ],
    businessRules: [
      { name: 'CLT Overtime', description: 'Horas extras acima do limite CLT', calculation: 'weekly_hours > 44' },
      { name: 'Break Compliance', description: 'Compliance de pausas obrigatórias', calculation: 'break_duration >= required_break_time' }
    ]
  },
  omnibridge: {
    module: 'omnibridge',
    displayName: 'OmniBridge',
    description: 'Centro de comunicação unificada multi-canal',
    tables: [
      {
        name: 'channels',
        displayName: 'Canais',
        fields: [
          { name: 'id', type: 'string', displayName: 'ID', isAggregatable: false, isFilterable: true },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true },
          { name: 'type', type: 'string', displayName: 'Tipo', isAggregatable: true, isFilterable: true },
          { name: 'isEnabled', type: 'boolean', displayName: 'Ativo', isAggregatable: true, isFilterable: true }
        ]
      }
    ],
    relationships: [
      { from: 'messages.channelId', to: 'channels.id', type: 'many-to-one', foreignKey: 'channelId' }
    ],
    businessRules: [
      { name: 'Response Time SLA', description: 'Tempo de resposta dentro do SLA', calculation: 'response_time <= channel_sla_target' },
      { name: 'Resolution Rate', description: 'Taxa de resolução por canal', calculation: 'resolved_messages / total_messages' }
    ]
  }
};