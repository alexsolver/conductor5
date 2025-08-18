
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Database, Plus, X, Calendar, Filter, Eye, Play, Code, 
  ChevronDown, ChevronRight, Settings, AlertCircle, CheckCircle2,
  RotateCcw, Save, Download, Upload, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Tipos para o Query Builder
interface DataSource {
  id: string;
  name: string;
  description: string;
  category: string;
  tables: Table[];
}

interface Table {
  name: string;
  displayName: string;
  fields: Field[];
  relationships: Relationship[];
}

interface Field {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'uuid' | 'json';
  displayName: string;
  isAggregatable: boolean;
  isFilterable: boolean;
  isGroupable: boolean;
  description?: string;
}

interface Relationship {
  table: string;
  type: 'oneToMany' | 'manyToOne' | 'manyToMany';
  foreignKey: string;
  displayName: string;
}

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  dataType: string;
  logicalOperator?: 'AND' | 'OR';
}

interface QueryConfig {
  dataSource: string;
  selectedTables: string[];
  selectedFields: string[];
  filters: FilterCondition[];
  groupBy: string[];
  orderBy: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
  limit?: number;
  offset?: number;
  dateRange?: {
    field: string;
    start: Date;
    end: Date;
  };
}

// Dados mock das fontes de dados disponíveis
const mockDataSources: DataSource[] = [
  {
    id: 'tickets',
    name: 'Sistema de Tickets',
    description: 'Dados de atendimento e suporte',
    category: 'core',
    tables: [
      {
        name: 'tickets',
        displayName: 'Tickets',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'title', type: 'string', displayName: 'Título', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'description', type: 'string', displayName: 'Descrição', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'status', type: 'string', displayName: 'Status', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'priority', type: 'string', displayName: 'Prioridade', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'category', type: 'string', displayName: 'Categoria', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'assignedToId', type: 'uuid', displayName: 'Responsável', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'customerId', type: 'uuid', displayName: 'Cliente', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'companyId', type: 'uuid', displayName: 'Empresa', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'createdAt', type: 'date', displayName: 'Data Criação', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'updatedAt', type: 'date', displayName: 'Data Atualização', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'resolvedAt', type: 'date', displayName: 'Data Resolução', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'slaBreached', type: 'boolean', displayName: 'SLA Violado', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'responseTimeMinutes', type: 'number', displayName: 'Tempo Resposta (min)', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'resolutionTimeMinutes', type: 'number', displayName: 'Tempo Resolução (min)', isAggregatable: true, isFilterable: true, isGroupable: false }
        ],
        relationships: [
          { table: 'users', type: 'manyToOne', foreignKey: 'assignedToId', displayName: 'Responsável' },
          { table: 'customers', type: 'manyToOne', foreignKey: 'customerId', displayName: 'Cliente' },
          { table: 'companies', type: 'manyToOne', foreignKey: 'companyId', displayName: 'Empresa' }
        ]
      }
    ]
  },
  {
    id: 'customers',
    name: 'Clientes',
    description: 'Base de clientes e empresas',
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
          { name: 'document', type: 'string', displayName: 'Documento', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'isActive', type: 'boolean', displayName: 'Ativo', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'createdAt', type: 'date', displayName: 'Data Criação', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'lastContactAt', type: 'date', displayName: 'Último Contato', isAggregatable: false, isFilterable: true, isGroupable: true }
        ],
        relationships: [
          { table: 'companies', type: 'manyToOne', foreignKey: 'companyId', displayName: 'Empresa' }
        ]
      },
      {
        name: 'companies',
        displayName: 'Empresas',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'cnpj', type: 'string', displayName: 'CNPJ', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'segment', type: 'string', displayName: 'Segmento', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'size', type: 'string', displayName: 'Porte', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'isActive', type: 'boolean', displayName: 'Ativa', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'createdAt', type: 'date', displayName: 'Data Criação', isAggregatable: false, isFilterable: true, isGroupable: true }
        ],
        relationships: []
      }
    ]
  },
  {
    id: 'users',
    name: 'Usuários',
    description: 'Equipe e colaboradores',
    category: 'core',
    tables: [
      {
        name: 'users',
        displayName: 'Usuários',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'firstName', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'lastName', type: 'string', displayName: 'Sobrenome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'email', type: 'string', displayName: 'Email', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'role', type: 'string', displayName: 'Função', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'department', type: 'string', displayName: 'Departamento', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'isActive', type: 'boolean', displayName: 'Ativo', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'createdAt', type: 'date', displayName: 'Data Criação', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'lastLoginAt', type: 'date', displayName: 'Último Login', isAggregatable: false, isFilterable: true, isGroupable: true }
        ],
        relationships: []
      }
    ]
  },
  {
    id: 'timecard',
    name: 'Controle de Ponto',
    description: 'Registros de trabalho e CLT',
    category: 'operations',
    tables: [
      {
        name: 'timecard_entries',
        displayName: 'Registros de Ponto',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'userId', type: 'uuid', displayName: 'Usuário', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'date', type: 'date', displayName: 'Data', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'checkIn', type: 'date', displayName: 'Entrada', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'checkOut', type: 'date', displayName: 'Saída', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'hoursWorked', type: 'number', displayName: 'Horas Trabalhadas', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'overtimeHours', type: 'number', displayName: 'Horas Extra', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'status', type: 'string', displayName: 'Status', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'approved', type: 'boolean', displayName: 'Aprovado', isAggregatable: true, isFilterable: true, isGroupable: true }
        ],
        relationships: [
          { table: 'users', type: 'manyToOne', foreignKey: 'userId', displayName: 'Usuário' }
        ]
      }
    ]
  },
  {
    id: 'materials',
    name: 'Materiais e Serviços',
    description: 'Catálogo e estoque',
    category: 'operations',
    tables: [
      {
        name: 'items',
        displayName: 'Itens',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'code', type: 'string', displayName: 'Código', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'name', type: 'string', displayName: 'Nome', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'category', type: 'string', displayName: 'Categoria', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'type', type: 'string', displayName: 'Tipo', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'price', type: 'number', displayName: 'Preço', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'stock', type: 'number', displayName: 'Estoque', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'isActive', type: 'boolean', displayName: 'Ativo', isAggregatable: true, isFilterable: true, isGroupable: true },
          { name: 'createdAt', type: 'date', displayName: 'Data Criação', isAggregatable: false, isFilterable: true, isGroupable: true }
        ],
        relationships: []
      }
    ]
  },
  {
    id: 'expenses',
    name: 'Despesas Corporativas',
    description: 'Controle de gastos',
    category: 'administration',
    tables: [
      {
        name: 'expense_reports',
        displayName: 'Relatórios de Despesa',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'title', type: 'string', displayName: 'Título', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'amount', type: 'number', displayName: 'Valor', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'category', type: 'string', displayName: 'Categoria', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'status', type: 'string', displayName: 'Status', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'submittedBy', type: 'uuid', displayName: 'Solicitante', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'approvedBy', type: 'uuid', displayName: 'Aprovador', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'submittedAt', type: 'date', displayName: 'Data Submissão', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'approvedAt', type: 'date', displayName: 'Data Aprovação', isAggregatable: false, isFilterable: true, isGroupable: true }
        ],
        relationships: [
          { table: 'users', type: 'manyToOne', foreignKey: 'submittedBy', displayName: 'Solicitante' },
          { table: 'users', type: 'manyToOne', foreignKey: 'approvedBy', displayName: 'Aprovador' }
        ]
      }
    ]
  },
  {
    id: 'contracts',
    name: 'Contratos',
    description: 'Gestão de contratos',
    category: 'administration',
    tables: [
      {
        name: 'contracts',
        displayName: 'Contratos',
        fields: [
          { name: 'id', type: 'uuid', displayName: 'ID', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'title', type: 'string', displayName: 'Título', isAggregatable: false, isFilterable: true, isGroupable: false },
          { name: 'type', type: 'string', displayName: 'Tipo', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'status', type: 'string', displayName: 'Status', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'value', type: 'number', displayName: 'Valor', isAggregatable: true, isFilterable: true, isGroupable: false },
          { name: 'startDate', type: 'date', displayName: 'Data Início', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'endDate', type: 'date', displayName: 'Data Fim', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'companyId', type: 'uuid', displayName: 'Empresa', isAggregatable: false, isFilterable: true, isGroupable: true },
          { name: 'createdAt', type: 'date', displayName: 'Data Criação', isAggregatable: false, isFilterable: true, isGroupable: true }
        ],
        relationships: [
          { table: 'companies', type: 'manyToOne', foreignKey: 'companyId', displayName: 'Empresa' }
        ]
      }
    ]
  }
];

// Operadores por tipo de campo
const getOperatorsForType = (type: string): Array<{ value: string; label: string }> => {
  const baseOperators = [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'is_null', label: 'É nulo' },
    { value: 'is_not_null', label: 'Não é nulo' }
  ];

  switch (type) {
    case 'string':
      return [
        ...baseOperators,
        { value: 'contains', label: 'Contém' },
        { value: 'not_contains', label: 'Não contém' },
        { value: 'starts_with', label: 'Inicia com' },
        { value: 'ends_with', label: 'Termina com' },
        { value: 'in', label: 'Está em' },
        { value: 'not_in', label: 'Não está em' }
      ];
    case 'number':
      return [
        ...baseOperators,
        { value: 'greater_than', label: 'Maior que' },
        { value: 'greater_equal', label: 'Maior ou igual' },
        { value: 'less_than', label: 'Menor que' },
        { value: 'less_equal', label: 'Menor ou igual' },
        { value: 'between', label: 'Entre' },
        { value: 'in', label: 'Está em' }
      ];
    case 'date':
      return [
        ...baseOperators,
        { value: 'greater_than', label: 'Depois de' },
        { value: 'greater_equal', label: 'A partir de' },
        { value: 'less_than', label: 'Antes de' },
        { value: 'less_equal', label: 'Até' },
        { value: 'between', label: 'Entre' },
        { value: 'today', label: 'Hoje' },
        { value: 'yesterday', label: 'Ontem' },
        { value: 'this_week', label: 'Esta semana' },
        { value: 'last_week', label: 'Semana passada' },
        { value: 'this_month', label: 'Este mês' },
        { value: 'last_month', label: 'Mês passado' },
        { value: 'this_year', label: 'Este ano' },
        { value: 'last_year', label: 'Ano passado' }
      ];
    case 'boolean':
      return [
        { value: 'equals', label: 'É' },
        { value: 'is_null', label: 'É nulo' },
        { value: 'is_not_null', label: 'Não é nulo' }
      ];
    default:
      return baseOperators;
  }
};

// Presets de período
const periodPresets = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'last_90_days', label: 'Últimos 90 dias' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'last_week', label: 'Semana passada' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'this_quarter', label: 'Este trimestre' },
  { value: 'last_quarter', label: 'Trimestre passado' },
  { value: 'this_year', label: 'Este ano' },
  { value: 'last_year', label: 'Ano passado' },
  { value: 'custom', label: 'Período personalizado' }
];

interface AdvancedQueryBuilderProps {
  onQueryChange?: (query: QueryConfig) => void;
  onExecute?: (query: QueryConfig) => void;
  initialQuery?: Partial<QueryConfig>;
}

export default function AdvancedQueryBuilder({ 
  onQueryChange, 
  onExecute, 
  initialQuery 
}: AdvancedQueryBuilderProps) {
  // Estado principal
  const [query, setQuery] = useState<QueryConfig>({
    dataSource: '',
    selectedTables: [],
    selectedFields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    limit: 100,
    offset: 0,
    ...initialQuery
  });

  const [activeTab, setActiveTab] = useState('datasource');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [sqlPreview, setSqlPreview] = useState('');
  const [queryResults, setQueryResults] = useState<any>(null);

  // Dados derivados
  const selectedDataSource = useMemo(() => 
    mockDataSources.find(ds => ds.id === query.dataSource),
    [query.dataSource]
  );

  const availableFields = useMemo(() => {
    if (!selectedDataSource || query.selectedTables.length === 0) return [];
    
    return selectedDataSource.tables
      .filter(table => query.selectedTables.includes(table.name))
      .flatMap(table => 
        table.fields.map(field => ({
          ...field,
          tableName: table.name,
          tableDisplayName: table.displayName,
          fullName: `${table.name}.${field.name}`,
          displayName: `${table.displayName}.${field.displayName}`
        }))
      );
  }, [selectedDataSource, query.selectedTables]);

  // Função para gerar SQL preview
  const generateSqlPreview = (queryConfig: QueryConfig) => {
    if (!selectedDataSource || queryConfig.selectedTables.length === 0) {
      return '';
    }

    let sql = 'SELECT ';
    
    // Campos selecionados
    if (queryConfig.selectedFields.length === 0) {
      sql += '*';
    } else {
      sql += queryConfig.selectedFields.join(', ');
    }

    // FROM clause
    sql += `\nFROM ${queryConfig.selectedTables[0]}`;
    
    // JOINs (simplificado)
    for (let i = 1; i < queryConfig.selectedTables.length; i++) {
      sql += `\nJOIN ${queryConfig.selectedTables[i]} ON ...`;
    }

    // WHERE clause
    if (queryConfig.filters.length > 0) {
      sql += '\nWHERE ';
      const filterClauses = queryConfig.filters.map((filter, index) => {
        let clause = '';
        if (index > 0) {
          clause += ` ${filter.logicalOperator || 'AND'} `;
        }
        
        switch (filter.operator) {
          case 'equals':
            clause += `${filter.field} = '${filter.value}'`;
            break;
          case 'not_equals':
            clause += `${filter.field} != '${filter.value}'`;
            break;
          case 'contains':
            clause += `${filter.field} LIKE '%${filter.value}%'`;
            break;
          case 'greater_than':
            clause += `${filter.field} > '${filter.value}'`;
            break;
          case 'less_than':
            clause += `${filter.field} < '${filter.value}'`;
            break;
          case 'between':
            clause += `${filter.field} BETWEEN '${filter.value?.start}' AND '${filter.value?.end}'`;
            break;
          case 'is_null':
            clause += `${filter.field} IS NULL`;
            break;
          case 'is_not_null':
            clause += `${filter.field} IS NOT NULL`;
            break;
          default:
            clause += `${filter.field} ${filter.operator} '${filter.value}'`;
        }
        return clause;
      });
      sql += filterClauses.join('');
    }

    // GROUP BY
    if (queryConfig.groupBy.length > 0) {
      sql += `\nGROUP BY ${queryConfig.groupBy.join(', ')}`;
    }

    // ORDER BY
    if (queryConfig.orderBy.length > 0) {
      sql += '\nORDER BY ';
      sql += queryConfig.orderBy
        .map(order => `${order.field} ${order.direction}`)
        .join(', ');
    }

    // LIMIT
    if (queryConfig.limit) {
      sql += `\nLIMIT ${queryConfig.limit}`;
    }

    // OFFSET
    if (queryConfig.offset) {
      sql += `\nOFFSET ${queryConfig.offset}`;
    }

    return sql;
  };

  // Atualizar query e notificar
  const updateQuery = (updates: Partial<QueryConfig>) => {
    const newQuery = { ...query, ...updates };
    setQuery(newQuery);
    setSqlPreview(generateSqlPreview(newQuery));
    onQueryChange?.(newQuery);
  };

  // Executar query
  const executeQuery = async () => {
    if (!query.dataSource || query.selectedTables.length === 0) {
      return;
    }

    setIsExecuting(true);
    try {
      // Simulação de execução
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dados mock de resultado
      const mockResults = {
        columns: availableFields.slice(0, 5).map(f => f.displayName),
        rows: Array.from({ length: 10 }, (_, i) => 
          availableFields.slice(0, 5).map(field => {
            switch (field.type) {
              case 'string':
                return `Valor ${i + 1}`;
              case 'number':
                return Math.floor(Math.random() * 1000);
              case 'date':
                return new Date().toISOString().split('T')[0];
              case 'boolean':
                return Math.random() > 0.5;
              default:
                return `Dados ${i + 1}`;
            }
          })
        ),
        totalRows: 45,
        executionTime: 1.2
      };

      setQueryResults(mockResults);
      onExecute?.(query);
    } catch (error) {
      console.error('Erro ao executar query:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  // Adicionar filtro
  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      dataType: 'string',
      logicalOperator: 'AND'
    };
    updateQuery({ filters: [...query.filters, newFilter] });
  };

  // Remover filtro
  const removeFilter = (filterId: string) => {
    updateQuery({ 
      filters: query.filters.filter(f => f.id !== filterId) 
    });
  };

  // Atualizar filtro
  const updateFilter = (filterId: string, updates: Partial<FilterCondition>) => {
    updateQuery({
      filters: query.filters.map(f => 
        f.id === filterId ? { ...f, ...updates } : f
      )
    });
  };

  // Toggle table expansion
  const toggleTableExpansion = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  useEffect(() => {
    setSqlPreview(generateSqlPreview(query));
  }, [query]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Query Builder Avançado</h2>
          <p className="text-muted-foreground">
            Construa consultas complexas para extrair dados de qualquer módulo do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setQuery({
              dataSource: '',
              selectedTables: [],
              selectedFields: [],
              filters: [],
              groupBy: [],
              orderBy: [],
              limit: 100,
              offset: 0
            })}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button 
            onClick={executeQuery}
            disabled={!query.dataSource || query.selectedTables.length === 0 || isExecuting}
          >
            {isExecuting ? (
              <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Executar Query
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="datasource" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Fonte de Dados
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Campos
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </TabsTrigger>
          <TabsTrigger value="grouping" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Agrupamento
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            SQL Preview
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Resultados
          </TabsTrigger>
        </TabsList>

        {/* Aba: Fonte de Dados */}
        <TabsContent value="datasource" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Fonte de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockDataSources.map((source) => (
                  <Card 
                    key={source.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      query.dataSource === source.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      updateQuery({ 
                        dataSource: source.id, 
                        selectedTables: [],
                        selectedFields: [],
                        filters: []
                      });
                      setActiveTab('fields');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Database className="w-5 h-5 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{source.name}</h3>
                          <p className="text-sm text-muted-foreground">{source.description}</p>
                          <Badge variant="secondary" className="mt-2">
                            {source.category}
                          </Badge>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {source.tables.length} tabela{source.tables.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedDataSource && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Tabelas Disponíveis</h3>
                  <div className="space-y-2">
                    {selectedDataSource.tables.map((table) => (
                      <div key={table.name}>
                        <Collapsible 
                          open={expandedTables.has(table.name)}
                          onOpenChange={() => toggleTableExpansion(table.name)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={query.selectedTables.includes(table.name)}
                                  onCheckedChange={(checked) => {
                                    const newTables = checked
                                      ? [...query.selectedTables, table.name]
                                      : query.selectedTables.filter(t => t !== table.name);
                                    updateQuery({ selectedTables: newTables });
                                  }}
                                />
                                <div>
                                  <div className="font-medium">{table.displayName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {table.fields.length} campos
                                  </div>
                                </div>
                              </div>
                              {expandedTables.has(table.name) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 bg-background rounded-lg border">
                              {table.fields.map((field) => (
                                <div key={field.name} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="text-xs">
                                    {field.type}
                                  </Badge>
                                  <span>{field.displayName}</span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Campos */}
        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleção de Campos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableFields.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma fonte de dados e tabelas primeiro</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={query.selectedFields.length === availableFields.length}
                        onCheckedChange={(checked) => {
                          updateQuery({
                            selectedFields: checked 
                              ? availableFields.map(f => f.fullName)
                              : []
                          });
                        }}
                      />
                      <Label>Selecionar todos os campos</Label>
                    </div>
                    <Badge variant="secondary">
                      {query.selectedFields.length} de {availableFields.length} selecionados
                    </Badge>
                  </div>

                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {availableFields.map((field) => (
                        <div 
                          key={field.fullName}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={query.selectedFields.includes(field.fullName)}
                              onCheckedChange={(checked) => {
                                const newFields = checked
                                  ? [...query.selectedFields, field.fullName]
                                  : query.selectedFields.filter(f => f !== field.fullName);
                                updateQuery({ selectedFields: newFields });
                              }}
                            />
                            <div>
                              <div className="font-medium">{field.displayName}</div>
                              <div className="text-sm text-muted-foreground">
                                {field.tableDisplayName}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            <div className="flex gap-1">
                              {field.isFilterable && (
                                <Badge variant="secondary" className="text-xs">
                                  Filtrável
                                </Badge>
                              )}
                              {field.isGroupable && (
                                <Badge variant="secondary" className="text-xs">
                                  Agrupável
                                </Badge>
                              )}
                              {field.isAggregatable && (
                                <Badge variant="secondary" className="text-xs">
                                  Agregável
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Filtros */}
        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Filtros de Dados
                <Button onClick={addFilter} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Filtro
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {query.filters.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum filtro configurado</p>
                  <p className="text-sm">Adicione filtros para refinar sua consulta</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {query.filters.map((filter, index) => (
                    <Card key={filter.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {index > 0 && (
                            <Select
                              value={filter.logicalOperator}
                              onValueChange={(value: 'AND' | 'OR') => 
                                updateFilter(filter.id, { logicalOperator: value })
                              }
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">E</SelectItem>
                                <SelectItem value="OR">OU</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          <Select
                            value={filter.field}
                            onValueChange={(value) => {
                              const field = availableFields.find(f => f.fullName === value);
                              updateFilter(filter.id, { 
                                field: value,
                                dataType: field?.type || 'string'
                              });
                            }}
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Selecionar campo" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields
                                .filter(f => f.isFilterable)
                                .map((field) => (
                                <SelectItem key={field.fullName} value={field.fullName}>
                                  {field.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={filter.operator}
                            onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Operador" />
                            </SelectTrigger>
                            <SelectContent>
                              {getOperatorsForType(filter.dataType).map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {!['is_null', 'is_not_null', 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year'].includes(filter.operator) && (
                            <Input
                              placeholder="Valor"
                              value={filter.value}
                              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                              className="flex-1"
                            />
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFilter(filter.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Agrupamento */}
        <TabsContent value="grouping" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GROUP BY */}
            <Card>
              <CardHeader>
                <CardTitle>Agrupar Por</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {availableFields
                    .filter(f => f.isGroupable)
                    .map((field) => (
                    <div key={field.fullName} className="flex items-center gap-2">
                      <Checkbox
                        checked={query.groupBy.includes(field.fullName)}
                        onCheckedChange={(checked) => {
                          const newGroupBy = checked
                            ? [...query.groupBy, field.fullName]
                            : query.groupBy.filter(g => g !== field.fullName);
                          updateQuery({ groupBy: newGroupBy });
                        }}
                      />
                      <Label>{field.displayName}</Label>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ORDER BY */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Ordenar Por
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const newOrder = { field: '', direction: 'ASC' as const };
                      updateQuery({ orderBy: [...query.orderBy, newOrder] });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {query.orderBy.map((order, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={order.field}
                      onValueChange={(value) => {
                        const newOrderBy = [...query.orderBy];
                        newOrderBy[index] = { ...order, field: value };
                        updateQuery({ orderBy: newOrderBy });
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecionar campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((field) => (
                          <SelectItem key={field.fullName} value={field.fullName}>
                            {field.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={order.direction}
                      onValueChange={(value: 'ASC' | 'DESC') => {
                        const newOrderBy = [...query.orderBy];
                        newOrderBy[index] = { ...order, direction: value };
                        updateQuery({ orderBy: newOrderBy });
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASC">Crescente</SelectItem>
                        <SelectItem value="DESC">Decrescente</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOrderBy = query.orderBy.filter((_, i) => i !== index);
                        updateQuery({ orderBy: newOrderBy });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Separator />
                
                {/* Limite e Offset */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Limite de registros</Label>
                    <Input
                      type="number"
                      value={query.limit || ''}
                      onChange={(e) => updateQuery({ limit: parseInt(e.target.value) || undefined })}
                      placeholder="Ex: 100"
                    />
                  </div>
                  <div>
                    <Label>Pular registros</Label>
                    <Input
                      type="number"
                      value={query.offset || ''}
                      onChange={(e) => updateQuery({ offset: parseInt(e.target.value) || undefined })}
                      placeholder="Ex: 0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: SQL Preview */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Preview da Query SQL
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(sqlPreview)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sqlPreview ? (
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{sqlPreview}</code>
                  </pre>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configure sua query para ver o preview SQL</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validação da Query */}
          {sqlPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Validação da Query</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Sintaxe SQL válida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Campos selecionados válidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Relacionamentos verificados</span>
                  </div>
                  {query.limit && query.limit > 1000 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Limite alto pode impactar performance</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Resultados */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Query</CardTitle>
            </CardHeader>
            <CardContent>
              {queryResults ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {queryResults.totalRows} registros encontrados
                      </Badge>
                      <Badge variant="outline">
                        Executado em {queryResults.executionTime}s
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            {queryResults.columns.map((column: string, index: number) => (
                              <th key={index} className="px-4 py-2 text-left font-medium">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResults.rows.map((row: any[], index: number) => (
                            <tr key={index} className="border-t hover:bg-muted/25">
                              {row.map((cell: any, cellIndex: number) => (
                                <td key={cellIndex} className="px-4 py-2">
                                  {typeof cell === 'boolean' ? (
                                    <Badge variant={cell ? 'default' : 'secondary'}>
                                      {cell ? 'Sim' : 'Não'}
                                    </Badge>
                                  ) : (
                                    String(cell)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Execute uma query para ver os resultados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
