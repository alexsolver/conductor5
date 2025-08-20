import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Play, Save } from 'lucide-react';
// import { useLocalization } from '@/hooks/useLocalization';

interface QueryCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

interface QueryGroup {
  id: string;
  conditions: QueryCondition[];
  logic: 'AND' | 'OR';
}

export function QueryBuilder() {
  // Localization temporarily disabled

  const [currentModule, setCurrentModule] = useState('tickets');
  const [queryGroups, setQueryGroups] = useState<QueryGroup[]>([
    {
      id: '1',
      conditions: [
        {
          id: '1-1',
          field: 'priority',
          operator: 'EQ',
          value: 'high'
        }
      ],
      logic: 'AND'
    }
  ]);
  const [queryPreview, setQueryPreview] = useState('');

  const moduleFields = {
    tickets: [
      { value: 'priority', label: 'Prioridade' },
      { value: 'category', label: 'Categoria' },
      { value: 'estimatedCost', label: 'Custo Estimado' },
      { value: 'location', label: 'Localização' },
      { value: 'customerId', label: 'ID do Cliente' },
      { value: 'assignedTo', label: 'Atribuído Para' },
      { value: 'createdBy', label: 'Criado Por' }
    ],
    materials: [
      { value: 'itemValue', label: 'Valor do Item' },
      { value: 'supplierId', label: 'ID do Fornecedor' },
      { value: 'category', label: 'Categoria' },
      { value: 'stockImpact', label: 'Impacto no Estoque' },
      { value: 'urgencyLevel', label: 'Nível de Urgência' },
      { value: 'requestedBy', label: 'Solicitado Por' }
    ],
    knowledge_base: [
      { value: 'articleType', label: 'Tipo do Artigo' },
      { value: 'visibilityLevel', label: 'Nível de Visibilidade' },
      { value: 'contentSensitivity', label: 'Sensibilidade do Conteúdo' },
      { value: 'authorId', label: 'ID do Autor' },
      { value: 'categoryId', label: 'ID da Categoria' }
    ]
  };

  const operators = [
    { value: 'EQ', label: '=' },
    { value: 'NEQ', label: '≠' },
    { value: 'GT', label: '>' },
    { value: 'GTE', label: '≥' },
    { value: 'LT', label: '<' },
    { value: 'LTE', label: '≤' },
    { value: 'IN', label: 'IN' },
    { value: 'NOT_IN', label: 'NOT IN' },
    { value: 'CONTAINS', label: 'Contém' },
    { value: 'STARTS_WITH', label: 'Inicia com' },
    { value: 'EXISTS', label: 'Existe' },
    { value: 'BETWEEN', label: 'Entre' }
  ];

  const addCondition = (groupId: string) => {
    setQueryGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            conditions: [
              ...group.conditions,
              {
                id: `${groupId}-${Date.now()",
                field: '',
                operator: 'EQ',
                value: '',
                logic: 'AND'
              }
            ]
          }
        : group
    ));
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setQueryGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            conditions: group.conditions.filter(c => c.id !== conditionId)
          }
        : group
    ));
  };

  const updateCondition = (groupId: string, conditionId: string, field: keyof QueryCondition, value: string) => {
    setQueryGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            conditions: group.conditions.map(condition =>
              condition.id === conditionId
                ? { ...condition, [field]: value }
                : condition
            )
          }
        : group
    ));
  };

  const addGroup = () => {
    const newGroup: QueryGroup = {
      id: Date.now().toString(),
      conditions: [
        {
          id: `${Date.now()}-1`,
          field: '',
          operator: 'EQ',
          value: ''
        }
      ],
      logic: 'AND'
    };
    setQueryGroups(prev => [...prev, newGroup]);
  };

  const removeGroup = (groupId: string) => {
    setQueryGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const generateQuery = () => {
    let query = '';
    queryGroups.forEach((group, groupIndex) => {
      if (groupIndex > 0) {
        query += ` ${group.logic} `;
      }
      
      query += '(';
      group.conditions.forEach((condition, condIndex) => {
        if (condIndex > 0) {
          query += ` ${condition.logic || 'AND'} `;
        }
        query += `${condition.field} ${condition.operator} "${condition.value}"`;
      });
      query += ')';
    });
    
    setQueryPreview(query);
  };

  const testQuery = () => {
    // Simular teste da query
    console.log('Testing query:', queryPreview);
    alert('Query testada! Verifique o console para detalhes.');
  };

  const saveQuery = () => {
    // Salvar a query como regra
    console.log('Saving query as rule:', { module: currentModule, query: queryPreview });
    alert('Query salva como regra de aprovação!');
  };

  return (
    <div className="space-y-6" data-testid="query-builder">
      <Card data-testid="query-builder-header">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Query Builder Visual
            <Badge variant="secondary" data-testid="module-badge">
              Módulo: {currentModule}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={currentModule} onValueChange={setCurrentModule} data-testid="module-selector">
              <SelectTrigger className="w-48">
                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tickets">Tickets</SelectItem>
                <SelectItem value="materials">Materiais/Serviços</SelectItem>
                <SelectItem value="knowledge_base">Knowledge Base</SelectItem>
                <SelectItem value="timecard">Timecard</SelectItem>
                <SelectItem value="contracts">Contratos</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={addGroup} 
              variant="outline" 
              className="flex items-center gap-2"
              data-testid="button-add-group"
            >
              <Plus className="h-4 w-4" />
              Novo Grupo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Query Groups */}
      <div className="space-y-4" data-testid="query-groups">
        {queryGroups.map((group, groupIndex) => (
          <Card key={group.id} data-testid={`query-group-${group.id"}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Grupo {groupIndex + 1}</span>
                  {groupIndex > 0 && (
                    <Select 
                      value={group.logic} 
                      onValueChange={(value) => {
                        setQueryGroups(prev => prev.map(g => 
                          g.id === group.id ? { ...g, logic: value as 'AND' | 'OR' } : g
                        ));
                      }}
                      data-testid={`group-logic-${group.id"}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {queryGroups.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGroup(group.id)}
                    data-testid={`button-remove-group-${group.id"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" data-testid={`conditions-${group.id"}>
                {group.conditions.map((condition, condIndex) => (
                  <div key={condition.id} className="flex items-center gap-3" data-testid={`condition-${condition.id"}>
                    {condIndex > 0 && (
                      <Select 
                        value={condition.logic || 'AND'} 
                        onValueChange={(value) => updateCondition(group.id, condition.id, 'logic', value)}
                        data-testid={`condition-logic-${condition.id"}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Select 
                      value={condition.field} 
                      onValueChange={(value) => updateCondition(group.id, condition.id, 'field', value)}
                      data-testid={`condition-field-${condition.id"}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                      </SelectTrigger>
                      <SelectContent>
                        {moduleFields[currentModule as keyof typeof moduleFields]?.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={condition.operator} 
                      onValueChange={(value) => updateCondition(group.id, condition.id, 'operator', value)}
                      data-testid={`condition-operator-${condition.id"}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Valor"
                      value={condition.value}
                      onChange={(e) => updateCondition(group.id, condition.id, 'value', e.target.value)}
                      className="flex-1"
                      data-testid={`condition-value-${condition.id"}
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(group.id, condition.id)}
                      disabled={group.conditions.length === 1}
                      data-testid={`button-remove-condition-${condition.id"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCondition(group.id)}
                  className="flex items-center gap-2"
                  data-testid={`button-add-condition-${group.id"}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Condição
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Query Preview */}
      <Card data-testid="query-preview-card">
        <CardHeader>
          <CardTitle>Preview da Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm" data-testid="query-preview">
              {queryPreview || 'Clique em "Gerar Query" para ver o preview'}
            </div>
            
            <div className="flex gap-3" data-testid="query-actions">
              <Button 
                onClick={generateQuery} 
                className="flex items-center gap-2"
                data-testid="button-generate-query"
              >
                <Play className="h-4 w-4" />
                Gerar Query
              </Button>
              
              {queryPreview && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={testQuery}
                    className="flex items-center gap-2"
                    data-testid="button-test-query"
                  >
                    <Play className="h-4 w-4" />
                    Testar Query
                  </Button>
                  
                  <Button 
                    variant="default" 
                    onClick={saveQuery}
                    className="flex items-center gap-2"
                    data-testid="button-save-query"
                  >
                    <Save className="h-4 w-4" />
                    Salvar como Regra
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}