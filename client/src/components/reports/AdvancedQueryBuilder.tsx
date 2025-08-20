import React, { useState, useEffect } from 'react';
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Plus, X, Settings, Database, Filter, ChevronDown, ChevronRight,
  Calendar, Hash, Type, BarChart3, Users, Ticket, Building,
  Clock, Target, Zap, ArrowRight, Copy, Trash2, Move,
  AlertCircle, CheckCircle, Info, Play, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Zendesk-style Data Structure
const ZENDESK_DATA_SCHEMA = {
  // Localization temporarily disabled

  tickets: {
    name: '[TRANSLATION_NEEDED]',
    icon: Ticket,
    color: 'text-blue-600',
    description: 'Support ticket data',
    fields: [
      { id: 'id', name: 'Ticket ID', type: 'number', icon: Hash },
      { id: 'subject', name: 'Subject', type: 'text', icon: Type },
      { id: 'status', name: 'Status', type: 'list', icon: Target, options: ['New', 'Open', 'Pending', 'Solved', 'Closed'] },
      { id: 'priority', name: 'Priority', type: 'list', icon: Zap, options: ['Low', 'Normal', 'High', 'Urgent'] },
      { id: 'created_at', name: '[TRANSLATION_NEEDED]', type: 'datetime', icon: Calendar },
      { id: 'updated_at', name: 'Updated', type: 'datetime', icon: Calendar },
      { id: 'solved_at', name: 'Solved', type: 'datetime', icon: Calendar },
      { id: 'assignee_id', name: 'Assignee', type: 'lookup', icon: Users, lookup: 'users' },
      { id: 'requester_id', name: 'Requester', type: 'lookup', icon: Users, lookup: 'users' },
      { id: 'organization_id', name: 'Organization', type: 'lookup', icon: Building, lookup: 'organizations' }
    ]
  },
  users: {
    name: '[TRANSLATION_NEEDED]',
    icon: Users,
    color: 'text-green-600',
    description: 'User and agent data',
    fields: [
      { id: 'id', name: 'User ID', type: 'number', icon: Hash },
      { id: 'name', name: 'Name', type: 'text', icon: Type },
      { id: 'email', name: 'Email', type: 'text', icon: Type },
      { id: 'role', name: 'Role', type: 'list', icon: Target, options: ['End-user', 'Agent', 'Admin'] },
      { id: 'created_at', name: '[TRANSLATION_NEEDED]', type: 'datetime', icon: Calendar },
      { id: 'last_login_at', name: 'Last Login', type: 'datetime', icon: Calendar }
    ]
  },
  organizations: {
    name: 'Organizations',
    icon: Building,
    color: 'text-purple-600',
    description: 'Company and group data',
    fields: [
      { id: 'id', name: 'Organization ID', type: 'number', icon: Hash },
      { id: 'name', name: 'Name', type: 'text', icon: Type },
      { id: 'created_at', name: '[TRANSLATION_NEEDED]', type: 'datetime', icon: Calendar }
    ]
  }
};

// Zendesk-style aggregation functions
const AGGREGATION_FUNCTIONS = [
  { id: 'COUNT', name: 'Count', description: 'Count of records' },
  { id: 'SUM', name: 'Sum', description: 'Sum of values' },
  { id: 'AVG', name: 'Average', description: 'Average value' },
  { id: 'MIN', name: 'Minimum', description: 'Minimum value' },
  { id: 'MAX', name: 'Maximum', description: 'Maximum value' },
  { id: 'MEDIAN', name: 'Median', description: 'Median value' }
];

// Zendesk-style filter operators
const FILTER_OPERATORS = {
  text: [
    { id: 'equals', name: 'Is', symbol: '=' },
    { id: 'not_equals', name: 'Is not', symbol: '≠' },
    { id: 'contains', name: 'Contains', symbol: '∋' },
    { id: 'not_contains', name: 'Does not contain', symbol: '∌' },
    { id: 'starts_with', name: 'Starts with', symbol: '^' },
    { id: 'ends_with', name: 'Ends with', symbol: '$' }
  ],
  number: [
    { id: 'equals', name: 'Equals', symbol: '=' },
    { id: 'not_equals', name: 'Not equals', symbol: '≠' },
    { id: 'greater_than', name: 'Greater than', symbol: '>' },
    { id: 'less_than', name: 'Less than', symbol: '<' },
    { id: 'greater_equal', name: 'Greater or equal', symbol: '≥' },
    { id: 'less_equal', name: 'Less or equal', symbol: '≤' }
  ],
  datetime: [
    { id: 'equals', name: 'Is', symbol: '=' },
    { id: 'before', name: 'Before', symbol: '<' },
    { id: 'after', name: 'After', symbol: '>' },
    { id: 'between', name: 'Between', symbol: '↔' },
    { id: 'last_days', name: 'Last X days', symbol: '📅' },
    { id: 'this_week', name: 'This week', symbol: '📅' },
    { id: 'this_month', name: 'This month', symbol: '📅' }
  ]
};

interface QueryBuilderProps {
  onQueryChange?: (query: any) => void;
  initialQuery?: any;
  mode?: 'simple' | 'advanced';
}

export default function AdvancedQueryBuilder({ onQueryChange, initialQuery, mode = 'simple' }: QueryBuilderProps) {
  const [selectedDataSource, setSelectedDataSource] = useState('tickets');
  const [query, setQuery] = useState({
    dataSource: 'tickets',
    metrics: [],
    attributes: [],
    filters: [],
    timeframe: {
      type: 'relative',
      value: '30_days'
    }
  });

  const [expandedSections, setExpandedSections] = useState({
    dataSource: true,
    metrics: true,
    attributes: true,
    filters: true,
    timeframe: true
  });

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setSelectedDataSource(initialQuery.dataSource || 'tickets');
    }
  }, [initialQuery]);

  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addMetric = (field: any, aggregation: string = 'COUNT') => {
    const newMetric = {
      id: "
      field: field.id,
      fieldName: field.name,
      aggregation,
      label: ")`
    };

    setQuery(prev => ({
      ...prev,
      metrics: [...(prev.metrics || []), newMetric]
    }));
  };

  const addAttribute = (field: any) => {
    if (query?.attributes?.find(attr => attr.field === field.id)) return;

    const newAttribute = {
      id: "
      field: field.id,
      fieldName: field.name,
      type: field.type
    };

    setQuery(prev => ({
      ...prev,
      attributes: [...(prev.attributes || []), newAttribute]
    }));
  };

  const addFilter = (field: any) => {
    const newFilter = {
      id: "
      field: field.id,
      fieldName: field.name,
      fieldType: field.type,
      operator: 'equals',
      value: '',
      active: true
    };

    setQuery(prev => ({
      ...prev,
      filters: [...(prev.filters || []), newFilter]
    }));
  };

  const removeMetric = (metricId: string) => {
    setQuery(prev => ({
      ...prev,
      metrics: (prev.metrics || []).filter(m => m.id !== metricId)
    }));
  };

  const removeAttribute = (attributeId: string) => {
    setQuery(prev => ({
      ...prev,
      attributes: (prev.attributes || []).filter(a => a.id !== attributeId)
    }));
  };

  const removeFilter = (filterId: string) => {
    setQuery(prev => ({
      ...prev,
      filters: (prev.filters || []).filter(f => f.id !== filterId)
    }));
  };

  const updateFilter = (filterId: string, updates: any) => {
    setQuery(prev => ({
      ...prev,
      filters: (prev.filters || []).map(f => 
        f.id === filterId ? { ...f, ...updates } : f
      )
    }));
  };

  const currentDataSource = ZENDESK_DATA_SCHEMA[selectedDataSource];

  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Query Preview</h3>
          <Button variant="outline" onClick={() => setPreviewMode(false)}>
            <Eye className="h-4 w-4 mr-2" />
            Edit Query
          </Button>
        </div>
        <QueryPreview query={query} dataSchema={ZENDESK_DATA_SCHEMA} />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Query Builder</h3>
            <p className="text-sm text-gray-600">Build your report by selecting data, metrics, and filters</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setPreviewMode(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Run Query
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Data Source Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Collapsible 
                  open={expandedSections.dataSource} 
                  onOpenChange={() => toggleSection('dataSource')}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <CardTitle className="text-base flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Data Source
                      </CardTitle>
                      {expandedSections.dataSource ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4 space-y-3">
                      {Object.entries(ZENDESK_DATA_SCHEMA).map(([key, source]) => {
                        const SourceIcon = source.icon;
                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedDataSource === key 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            "
                            onClick={() => {
                              setSelectedDataSource(key);
                              setQuery(prev => ({ ...prev, dataSource: key }));
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <SourceIcon className="h-5 w-5 "" />
                              <div>
                                <div className="font-medium text-gray-900">{source.name}</div>
                                <div className="text-sm text-gray-500">{source.description}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
            </Card>

            {/* Available Fields */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Available Fields</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentDataSource?.fields.map((field) => {
                    const FieldIcon = field.icon;
                    return (
                      <div 
                        key={field.id} 
                        className="group flex items-center justify-between p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <FieldIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {field.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{field.name} ({field.type})</p>
                            </TooltipContent>
                          </Tooltip>
                          <Badge variant="outline" className="text-xs">
                            {field.type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => addMetric(field)}
                              >
                                <BarChart3 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add as Metric</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => addAttribute(field)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add as Attribute</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => addFilter(field)}
                              >
                                <Filter className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add as Filter</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Query Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metrics Section */}
            <Card>
              <CardHeader>
                <Collapsible 
                  open={expandedSections.metrics} 
                  onOpenChange={() => toggleSection('metrics')}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <CardTitle className="text-base flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Metrics ({query?.metrics?.length || 0})
                      </CardTitle>
                      {expandedSections.metrics ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4">
                      {(!query?.metrics || query.metrics.length === 0) ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">No metrics selected</p>
                          <p className="text-xs text-gray-500">Drag fields here or click the chart icon</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {query?.metrics?.map((metric) => (
                            <MetricCard 
                              key={metric.id} 
                              metric={metric} 
                              onRemove={() => removeMetric(metric.id)}
                              onUpdate={(updates) => {
                                setQuery(prev => ({
                                  ...prev,
                                  metrics: prev.metrics.map(m => 
                                    m.id === metric.id ? { ...m, ...updates } : m
                                  )
                                }));
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
            </Card>

            {/* Attributes Section */}
            <Card>
              <CardHeader>
                <Collapsible 
                  open={expandedSections.attributes} 
                  onOpenChange={() => toggleSection('attributes')}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <CardTitle className="text-base flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Attributes ({query?.attributes?.length || 0})
                      </CardTitle>
                      {expandedSections.attributes ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4">
                      {(!query?.attributes || query.attributes.length === 0) ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">No attributes selected</p>
                          <p className="text-xs text-gray-500">Add fields to group and break down your data</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {query?.attributes?.map((attribute) => (
                            <AttributeCard 
                              key={attribute.id} 
                              attribute={attribute} 
                              onRemove={() => removeAttribute(attribute.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
            </Card>

            {/* Filters Section */}
            <Card>
              <CardHeader>
                <Collapsible 
                  open={expandedSections.filters} 
                  onOpenChange={() => toggleSection('filters')}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <CardTitle className="text-base flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters ({query?.filters?.length || 0})
                      </CardTitle>
                      {expandedSections.filters ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4">
                      {(!query?.filters || query.filters.length === 0) ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">No filters applied</p>
                          <p className="text-xs text-gray-500">Add filters to narrow down your data</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {query?.filters?.map((filter) => (
                            <FilterCard 
                              key={filter.id} 
                              filter={filter} 
                              onRemove={() => removeFilter(filter.id)}
                              onUpdate={(updates) => updateFilter(filter.id, updates)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Metric Card Component
function MetricCard({ metric, onRemove, onUpdate }) {
  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <div>
          <div className="font-medium text-gray-900">{metric.label}</div>
          <div className="text-sm text-gray-500">{metric.fieldName}</div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Select 
          value={metric.aggregation} 
          onValueChange={(value) => onUpdate({ 
            aggregation: value, 
            label: ")` 
          })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGGREGATION_FUNCTIONS.map((func) => (
              <SelectItem key={func.id} value={func.id}>
                {func.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Attribute Card Component
function AttributeCard({ attribute, onRemove }) {
  return (
    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <Database className="h-4 w-4 text-green-600" />
        <div>
          <div className="font-medium text-gray-900">{attribute.fieldName}</div>
          <Badge variant="outline" className="text-xs">{attribute.type}</Badge>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Filter Card Component
function FilterCard({ filter, onRemove, onUpdate }) {
  const operators = FILTER_OPERATORS[filter.fieldType] || FILTER_OPERATORS.text;

  return (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Filter className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-gray-900">{filter.fieldName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select 
          value={filter.operator} 
          onValueChange={(value) => onUpdate({ operator: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op.id} value={op.id}>
                {op.symbol} {op.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder='[TRANSLATION_NEEDED]'
          value={filter.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
        />
      </div>
    </div>
  );
}

// Query Preview Component
function QueryPreview({ query, dataSchema }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          Query Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Data Source</Label>
            <p className="text-sm text-gray-600">{dataSchema[query.dataSource]?.name}</p>
          </div>

          {query?.metrics?.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Metrics ({query?.metrics?.length || 0})</Label>
              <div className="mt-1 space-y-1">
                {query?.metrics?.map((metric) => (
                  <Badge key={metric.id} variant="secondary">{metric.label}</Badge>
                ))}
              </div>
            </div>
          )}

          {query?.attributes?.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Attributes ({query?.attributes?.length || 0})</Label>
              <div className="mt-1 space-y-1">
                {query?.attributes?.map((attr) => (
                  <Badge key={attr.id} variant="outline">{attr.fieldName}</Badge>
                ))}
              </div>
            </div>
          )}

          {query?.filters?.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Filters ({query?.filters?.length || 0})</Label>
              <div className="mt-1 space-y-1">
                {query?.filters?.map((filter) => (
                  <div key={filter.id} className="text-sm text-gray-600">
                    {filter.fieldName} {filter.operator} {filter.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}