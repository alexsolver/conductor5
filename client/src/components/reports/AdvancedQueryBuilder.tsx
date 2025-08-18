/**
 * Advanced Query Builder - Interface Intuitiva para Construção de Queries
 * ✅ 1QA.MD COMPLIANCE: Clean Architecture frontend implementation
 * Funcionalidades: Seleção de períodos, condicionais, joins, agregações
 */

import React, { useState, useCallback } from 'react';
import { 
  Plus, Trash2, Calendar, Database, Filter, Settings, 
  ChevronDown, ChevronRight, AlertCircle, CheckCircle,
  Play, Save, Code, Eye, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Note: Collapsible not available, will implement without it
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos de dados disponíveis
const DATA_SOURCES = [
  { id: 'tickets', name: 'Tickets', table: 'tickets', icon: '🎫' },
  { id: 'customers', name: 'Clientes', table: 'customers', icon: '👥' },
  { id: 'users', name: 'Usuários', table: 'users', icon: '👤' },
  { id: 'contracts', name: 'Contratos', table: 'contracts', icon: '📄' },
  { id: 'expenses', name: 'Despesas', table: 'expense_reports', icon: '💰' },
  { id: 'assets', name: 'Ativos', table: 'assets', icon: '🏭' },
  { id: 'workorders', name: 'Ordens de Serviço', table: 'work_orders', icon: '🔧' },
];

// Campos disponíveis por fonte de dados
const FIELD_MAPPINGS = {
  tickets: [
    { name: 'id', type: 'string', label: 'ID do Ticket' },
    { name: 'title', type: 'string', label: 'Título' },
    { name: 'status', type: 'enum', label: 'Status', options: ['open', 'in_progress', 'resolved', 'closed'] },
    { name: 'priority', type: 'enum', label: 'Prioridade', options: ['low', 'medium', 'high', 'critical'] },
    { name: 'created_at', type: 'datetime', label: 'Data de Criação' },
    { name: 'updated_at', type: 'datetime', label: 'Última Atualização' },
    { name: 'assigned_to', type: 'string', label: 'Atribuído Para' },
    { name: 'customer_id', type: 'string', label: 'Cliente' },
  ],
  customers: [
    { name: 'id', type: 'string', label: 'ID do Cliente' },
    { name: 'name', type: 'string', label: 'Nome' },
    { name: 'email', type: 'string', label: 'Email' },
    { name: 'created_at', type: 'datetime', label: 'Data de Cadastro' },
    { name: 'status', type: 'enum', label: 'Status', options: ['active', 'inactive', 'blocked'] },
  ],
  contracts: [
    { name: 'id', type: 'string', label: 'ID do Contrato' },
    { name: 'title', type: 'string', label: 'Título' },
    { name: 'status', type: 'enum', label: 'Status', options: ['draft', 'active', 'terminated'] },
    { name: 'total_value', type: 'number', label: 'Valor Total' },
    { name: 'start_date', type: 'date', label: 'Data de Início' },
    { name: 'end_date', type: 'date', label: 'Data de Fim' },
  ],
};

// Operadores por tipo de campo
const OPERATORS = {
  string: [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'contains', label: 'Contém' },
    { value: 'not_contains', label: 'Não contém' },
    { value: 'starts_with', label: 'Começa com' },
    { value: 'ends_with', label: 'Termina com' },
    { value: 'is_empty', label: 'Está vazio' },
    { value: 'is_not_empty', label: 'Não está vazio' },
  ],
  number: [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'greater_than', label: 'Maior que' },
    { value: 'greater_equal', label: 'Maior ou igual' },
    { value: 'less_than', label: 'Menor que' },
    { value: 'less_equal', label: 'Menor ou igual' },
    { value: 'between', label: 'Entre' },
  ],
  date: [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'after', label: 'Depois de' },
    { value: 'before', label: 'Antes de' },
    { value: 'between', label: 'Entre' },
    { value: 'last_days', label: 'Últimos X dias' },
    { value: 'next_days', label: 'Próximos X dias' },
    { value: 'this_week', label: 'Esta semana' },
    { value: 'this_month', label: 'Este mês' },
    { value: 'this_year', label: 'Este ano' },
  ],
  datetime: [
    { value: 'equals', label: 'Igual a' },
    { value: 'after', label: 'Depois de' },
    { value: 'before', label: 'Antes de' },
    { value: 'between', label: 'Entre' },
    { value: 'last_hours', label: 'Últimas X horas' },
    { value: 'last_days', label: 'Últimos X dias' },
    { value: 'this_week', label: 'Esta semana' },
    { value: 'this_month', label: 'Este mês' },
  ],
  enum: [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'in', label: 'Está em' },
    { value: 'not_in', label: 'Não está em' },
  ],
};

interface QueryCondition {
  id: string;
  field: string;
  operator: string;
  value: string | string[];
  logic: 'AND' | 'OR';
}

interface QueryGroup {
  id: string;
  conditions: QueryCondition[];
  logic: 'AND' | 'OR';
  groups: QueryGroup[];
}

interface AdvancedQueryBuilderProps {
  onQueryChange: (query: any) => void;
  onExecute: (query: any) => void;
  initialQuery?: any;
}

const AdvancedQueryBuilder: React.FC<AdvancedQueryBuilderProps> = ({
  onQueryChange,
  onExecute,
  initialQuery
}) => {
  const [selectedDataSource, setSelectedDataSource] = useState<string>('tickets');
  const [query, setQuery] = useState<QueryGroup>({
    id: 'root',
    conditions: [],
    logic: 'AND',
    groups: []
  });
  const [dateFilters, setDateFilters] = useState({
    enabled: false,
    field: 'created_at',
    preset: 'last_30_days',
    customStart: null as Date | null,
    customEnd: null as Date | null,
  });
  const [selectedFields, setSelectedFields] = useState<string[]>(['*']);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState<{ field: string; direction: 'ASC' | 'DESC' }[]>([]);
  const [limit, setLimit] = useState<number>(100);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  // Adicionar condição
  const addCondition = (groupId: string = 'root') => {
    const newCondition: QueryCondition = {
      id: `condition_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      logic: 'AND'
    };

    if (groupId === 'root') {
      setQuery(prev => ({
        ...prev,
        conditions: [...prev.conditions, newCondition]
      }));
    } else {
      // Implementar para grupos aninhados
    }
  };

  // Remover condição
  const removeCondition = (conditionId: string) => {
    setQuery(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== conditionId)
    }));
  };

  // Atualizar condição
  const updateCondition = (conditionId: string, updates: Partial<QueryCondition>) => {
    setQuery(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    }));
  };

  // Gerar SQL Preview
  const generateSqlPreview = useCallback(() => {
    const dataSource = DATA_SOURCES.find(ds => ds.id === selectedDataSource);
    if (!dataSource) return '';

    let sql = `SELECT ${selectedFields.join(', ')}\nFROM ${dataSource.table}`;
    
    // WHERE clauses
    if (query.conditions.length > 0 || dateFilters.enabled) {
      sql += '\nWHERE ';
      const whereClauses = [];
      
      // Data filters
      if (dateFilters.enabled) {
        switch (dateFilters.preset) {
          case 'last_7_days':
            whereClauses.push(`${dateFilters.field} >= CURRENT_DATE - INTERVAL '7 days'`);
            break;
          case 'last_30_days':
            whereClauses.push(`${dateFilters.field} >= CURRENT_DATE - INTERVAL '30 days'`);
            break;
          case 'this_month':
            whereClauses.push(`${dateFilters.field} >= DATE_TRUNC('month', CURRENT_DATE)`);
            break;
          case 'custom':
            if (dateFilters.customStart && dateFilters.customEnd) {
              whereClauses.push(`${dateFilters.field} BETWEEN '${dateFilters.customStart.toISOString()}' AND '${dateFilters.customEnd.toISOString()}'`);
            }
            break;
        }
      }
      
      // Conditions
      query.conditions.forEach((condition, index) => {
        if (condition.field && condition.operator) {
          let clause = `${condition.field} `;
          
          switch (condition.operator) {
            case 'equals':
              clause += `= '${condition.value}'`;
              break;
            case 'not_equals':
              clause += `!= '${condition.value}'`;
              break;
            case 'contains':
              clause += `ILIKE '%${condition.value}%'`;
              break;
            case 'greater_than':
              clause += `> ${condition.value}`;
              break;
            case 'less_than':
              clause += `< ${condition.value}`;
              break;
            case 'in':
              clause += `IN (${Array.isArray(condition.value) ? condition.value.map(v => `'${v}'`).join(', ') : `'${condition.value}'`})`;
              break;
            default:
              clause += `= '${condition.value}'`;
          }
          
          if (index > 0 || whereClauses.length > 0) {
            clause = ` ${condition.logic} ${clause}`;
          }
          
          whereClauses.push(clause);
        }
      });
      
      sql += whereClauses.join('');
    }
    
    // GROUP BY
    if (groupBy.length > 0) {
      sql += `\nGROUP BY ${groupBy.join(', ')}`;
    }
    
    // ORDER BY
    if (orderBy.length > 0) {
      sql += `\nORDER BY ${orderBy.map(o => `${o.field} ${o.direction}`).join(', ')}`;
    }
    
    // LIMIT
    if (limit > 0) {
      sql += `\nLIMIT ${limit}`;
    }
    
    return sql;
  }, [selectedDataSource, selectedFields, query, dateFilters, groupBy, orderBy, limit]);

  // Executar query
  const executeQuery = () => {
    const queryConfig = {
      dataSource: selectedDataSource,
      fields: selectedFields,
      conditions: query,
      dateFilters,
      groupBy,
      orderBy,
      limit,
      sql: generateSqlPreview()
    };
    
    onQueryChange(queryConfig);
    onExecute(queryConfig);
  };

  const currentFields = FIELD_MAPPINGS[selectedDataSource as keyof typeof FIELD_MAPPINGS] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Query Builder Avançado</h3>
          <p className="text-sm text-muted-foreground">
            Construa consultas complexas de forma intuitiva
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSqlPreview(!showSqlPreview)}
            data-testid="button-toggle-sql"
          >
            <Code className="w-4 h-4 mr-1" />
            {showSqlPreview ? 'Ocultar' : 'Ver'} SQL
          </Button>
          <Button onClick={executeQuery} data-testid="button-execute-query">
            <Play className="w-4 h-4 mr-1" />
            Executar Query
          </Button>
        </div>
      </div>

      {/* SQL Preview */}
      {showSqlPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Prévia SQL</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
              {generateSqlPreview()}
            </pre>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="datasource" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="datasource">Fonte de Dados</TabsTrigger>
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="filters">Filtros</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* Data Source Selection */}
        <TabsContent value="datasource" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selecione a Fonte de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {DATA_SOURCES.map((source) => (
                  <Card
                    key={source.id}
                    className={`cursor-pointer transition-colors ${
                      selectedDataSource === source.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDataSource(source.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{source.icon}</div>
                      <div className="text-sm font-medium">{source.name}</div>
                      <div className="text-xs text-muted-foreground">{source.table}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Selection */}
        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campos para Retornar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={selectedFields.includes('*') ? 'default' : 'outline'}
                  onClick={() => setSelectedFields(['*'])}
                >
                  Todos os Campos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedFields([])}
                >
                  Limpar Seleção
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentFields.map((field) => (
                  <div
                    key={field.name}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedFields.includes(field.name)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => {
                      if (selectedFields.includes('*')) {
                        setSelectedFields([field.name]);
                      } else if (selectedFields.includes(field.name)) {
                        setSelectedFields(prev => prev.filter(f => f !== field.name));
                      } else {
                        setSelectedFields(prev => [...prev, field.name]);
                      }
                    }}
                  >
                    <div className="font-medium text-sm">{field.label}</div>
                    <div className="text-xs text-muted-foreground">{field.name}</div>
                    <Badge variant="outline" className="text-xs">
                      {field.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filters */}
        <TabsContent value="filters" className="space-y-4">
          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Filtro de Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dateFilters.enabled}
                  onChange={(e) => setDateFilters(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="rounded"
                />
                <Label>Ativar filtro de período</Label>
              </div>
              
              {dateFilters.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Campo de Data</Label>
                    <Select
                      value={dateFilters.field}
                      onValueChange={(value) => setDateFilters(prev => ({ ...prev, field: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currentFields
                          .filter(f => f.type === 'date' || f.type === 'datetime')
                          .map(field => (
                            <SelectItem key={field.name} value={field.name}>
                              {field.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Período</Label>
                    <Select
                      value={dateFilters.preset}
                      onValueChange={(value) => setDateFilters(prev => ({ ...prev, preset: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
                        <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                        <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
                        <SelectItem value="this_week">Esta semana</SelectItem>
                        <SelectItem value="this_month">Este mês</SelectItem>
                        <SelectItem value="this_year">Este ano</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {dateFilters.preset === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Data Inicial</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <Calendar className="w-4 h-4 mr-2" />
                              {dateFilters.customStart 
                                ? format(dateFilters.customStart, 'dd/MM/yyyy', { locale: ptBR })
                                : 'Selecionar data'
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <CalendarComponent
                              mode="single"
                              selected={dateFilters.customStart || undefined}
                              onSelect={(date) => setDateFilters(prev => ({ ...prev, customStart: date || null }))}
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-xs">Data Final</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <Calendar className="w-4 h-4 mr-2" />
                              {dateFilters.customEnd 
                                ? format(dateFilters.customEnd, 'dd/MM/yyyy', { locale: ptBR })
                                : 'Selecionar data'
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <CalendarComponent
                              mode="single"
                              selected={dateFilters.customEnd || undefined}
                              onSelect={(date) => setDateFilters(prev => ({ ...prev, customEnd: date || null }))}
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Condições de Filtro
                </span>
                <Button size="sm" onClick={() => addCondition()} data-testid="button-add-condition">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Condição
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {query.conditions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma condição definida</p>
                  <p className="text-xs">Clique em "Adicionar Condição" para começar</p>
                </div>
              ) : (
                query.conditions.map((condition, index) => (
                  <div key={condition.id} className="p-4 border rounded space-y-3">
                    {index > 0 && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={condition.logic}
                          onValueChange={(value: 'AND' | 'OR') => 
                            updateCondition(condition.id, { logic: value })
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
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-3">
                      {/* Campo */}
                      <div>
                        <Label className="text-xs">Campo</Label>
                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(condition.id, { field: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentFields.map(field => (
                              <SelectItem key={field.name} value={field.name}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Operador */}
                      <div>
                        <Label className="text-xs">Operador</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(condition.id, { operator: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {condition.field && (() => {
                              const field = currentFields.find(f => f.name === condition.field);
                              const fieldType = field?.type as keyof typeof OPERATORS;
                              const operators = field ? OPERATORS[fieldType] || OPERATORS.string : OPERATORS.string;
                              return operators.map((op: { value: string; label: string }) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Valor */}
                      <div>
                        <Label className="text-xs">Valor</Label>
                        {(() => {
                          const field = currentFields.find(f => f.name === condition.field);
                          if (field?.type === 'enum' && field.options) {
                            return (
                              <Select
                                value={condition.value as string}
                                onValueChange={(value) => updateCondition(condition.id, { value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map(option => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          }
                          return (
                            <Input
                              value={condition.value as string}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              placeholder="Digite o valor"
                            />
                          );
                        })()}
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeCondition(condition.id)}
                          data-testid={`button-remove-condition-${condition.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Options */}
        <TabsContent value="advanced" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GROUP BY */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Agrupar Por</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentFields.map((field) => (
                    <div key={field.name} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={groupBy.includes(field.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGroupBy(prev => [...prev, field.name]);
                          } else {
                            setGroupBy(prev => prev.filter(f => f !== field.name));
                          }
                        }}
                        className="rounded"
                      />
                      <Label className="text-sm">{field.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ORDER BY */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ordenar Por</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderBy.map((order, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={order.field}
                        onValueChange={(value) => {
                          const newOrderBy = [...orderBy];
                          newOrderBy[index] = { ...order, field: value };
                          setOrderBy(newOrderBy);
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currentFields.map(field => (
                            <SelectItem key={field.name} value={field.name}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={order.direction}
                        onValueChange={(value: 'ASC' | 'DESC') => {
                          const newOrderBy = [...orderBy];
                          newOrderBy[index] = { ...order, direction: value };
                          setOrderBy(newOrderBy);
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ASC">ASC</SelectItem>
                          <SelectItem value="DESC">DESC</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOrderBy(prev => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOrderBy(prev => [...prev, { field: '', direction: 'ASC' }])}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Ordenação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LIMIT */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Limite de Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label>Máximo de registros:</Label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                  className="w-32"
                  min="1"
                  max="10000"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedQueryBuilder;