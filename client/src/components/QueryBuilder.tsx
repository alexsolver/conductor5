// ✅ 1QA.MD COMPLIANCE: QUERY BUILDER COMPONENT
// Dynamic query builder for SLA rules following Clean Architecture

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// SLA Schema imports - following 1qa.md
import type {
  QueryRule,
  QueryBuilder,
  QueryOperator,
  LogicalOperator,
  TicketField
} from '@shared/schema-sla';

// ======================================
// QUERY BUILDER OPTIONS
// ======================================

const operatorOptions = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'greater_than_or_equal', label: 'Maior ou igual a' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'less_than_or_equal', label: 'Menor ou igual a' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'starts_with', label: 'Inicia com' },
  { value: 'ends_with', label: 'Termina com' },
  { value: 'is_empty', label: 'Está vazio' },
  { value: 'is_not_empty', label: 'Não está vazio' },
  { value: 'in', label: 'Está em' },
  { value: 'not_in', label: 'Não está em' }
];

const fieldOptions = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Prioridade' },
  { value: 'impact', label: 'Impacto' },
  { value: 'urgency', label: 'Urgência' },
  { value: 'category', label: 'Categoria' },
  { value: 'subcategory', label: 'Subcategoria' },
  { value: 'companyId', label: 'Empresa' },
  { value: 'callerId', label: 'Solicitante' },
  { value: 'responsibleId', label: 'Responsável' },
  { value: 'assignmentGroupId', label: 'Grupo de Atendimento' },
  { value: 'environment', label: 'Ambiente' },
  { value: 'tags', label: 'Tags' },
  { value: 'callerType', label: 'Tipo de Solicitante' },
  { value: 'contactType', label: 'Tipo de Contato' },
  { value: 'symptoms', label: 'Sintomas' },
  { value: 'businessImpact', label: 'Impacto no Negócio' },
  { value: 'templateName', label: 'Nome do Template' },
  { value: 'serviceVersion', label: 'Versão do Serviço' },
  { value: 'createdAt', label: 'Data de Criação' },
  { value: 'updatedAt', label: 'Data de Atualização' }
];

// Opções predefinidas para campos específicos
const fieldValueOptions: Record<string, Array<{ value: string; label: string }>> = {
  status: [
    { value: 'new', label: 'Novo' },
    { value: 'open', label: 'Aberto' },
    { value: 'pending', label: 'Pendente' },
    { value: 'in_progress', label: 'Em Progresso' },
    { value: 'on_hold', label: 'Em Espera' },
    { value: 'resolved', label: 'Resolvido' },
    { value: 'closed', label: 'Fechado' },
    { value: 'cancelled', label: 'Cancelado' }
  ],
  priority: [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
    { value: 'critical', label: 'Crítica' }
  ],
  impact: [
    { value: 'low', label: 'Baixo' },
    { value: 'medium', label: 'Médio' },
    { value: 'high', label: 'Alto' },
    { value: 'critical', label: 'Crítico' }
  ],
  urgency: [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
    { value: 'critical', label: 'Crítica' }
  ],
  environment: [
    { value: 'production', label: 'Produção' },
    { value: 'staging', label: 'Homologação' },
    { value: 'development', label: 'Desenvolvimento' },
    { value: 'testing', label: 'Testes' }
  ],
  callerType: [
    { value: 'employee', label: 'Funcionário' },
    { value: 'customer', label: 'Cliente' },
    { value: 'partner', label: 'Parceiro' },
    { value: 'vendor', label: 'Fornecedor' }
  ],
  contactType: [
    { value: 'phone', label: 'Telefone' },
    { value: 'email', label: 'E-mail' },
    { value: 'chat', label: 'Chat' },
    { value: 'portal', label: 'Portal' },
    { value: 'whatsapp', label: 'WhatsApp' }
  ]
};

// ======================================
// COMPONENT INTERFACE
// ======================================

interface QueryBuilderProps {
  value: QueryBuilder;
  onChange: (value: QueryBuilder) => void;
  className?: string;
  fieldOptions?: Array<{ value: string; label: string }>;
  operatorOptions?: Array<{ value: string; label: string }>;
}

// ======================================
// MAIN COMPONENT
// ======================================

export function QueryBuilderComponent({ 
  value, 
  onChange, 
  className = '',
  fieldOptions: customFieldOptions,
  operatorOptions: customOperatorOptions
}: QueryBuilderProps) {
  // Use os campos customizados se fornecidos, senão use os padrões
  const fields = customFieldOptions || fieldOptions;
  const operators = customOperatorOptions || operatorOptions;

  // Buscar empresas para o campo companyId
  const { data: companiesData } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: () => apiRequest('GET', '/api/companies').then(res => res.json()),
  });

  // Buscar categorias para o campo category
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/ticket-configuration/categories'],
    queryFn: () => apiRequest('GET', '/api/ticket-configuration/categories').then(res => res.json()),
  });

  // Buscar usuários para campos de solicitante/responsável
  const { data: usersData } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users').then(res => res.json()),
  });

  // Função para obter opções de valor baseado no campo
  const getValueOptions = (fieldName: string): Array<{ value: string; label: string }> | null => {
    // Opções estáticas predefinidas
    if (fieldValueOptions[fieldName]) {
      return fieldValueOptions[fieldName];
    }

    // Opções dinâmicas
    if (fieldName === 'companyId' && companiesData?.data) {
      return companiesData.data.map((company: any) => ({
        value: company.id,
        label: company.name
      }));
    }

    if (fieldName === 'category' && categoriesData?.data) {
      return categoriesData.data.map((category: any) => ({
        value: category.id,
        label: category.name
      }));
    }

    if ((fieldName === 'callerId' || fieldName === 'responsibleId') && usersData?.data) {
      return usersData.data.map((user: any) => ({
        value: user.id,
        label: user.name || user.email
      }));
    }

    return null;
  };

  const addRule = () => {
    const newRule: QueryRule = {
      field: 'status' as TicketField,
      operator: 'equals' as QueryOperator,
      value: '',
      logicalOperator: 'AND' as LogicalOperator
    };
    
    onChange({
      ...value,
      rules: [...(value.rules || []), newRule]
    });
  };

  const removeRule = (index: number) => {
    const newRules = (value.rules || []).filter((_, i) => i !== index);
    onChange({
      ...value,
      rules: newRules
    });
  };

  const updateRule = (index: number, rule: QueryRule) => {
    const newRules = [...(value.rules || [])];
    newRules[index] = rule;
    onChange({
      ...value,
      rules: newRules
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Regras de Aplicação</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRule}
          data-testid="button-add-rule"
        >
          <Plus className="w-3 h-3 mr-1" />
          Adicionar Regra
        </Button>
      </div>

      {(!value.rules || value.rules.length === 0) ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Nenhuma regra configurada</p>
          <p className="text-sm text-gray-400">Clique em "Adicionar Regra" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(value.rules || []).map((rule, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Operador lógico (exceto primeira regra) */}
                {index > 0 && (
                  <div className="col-span-1">
                    <Select
                      value={rule.logicalOperator || 'AND'}
                      onValueChange={(val) => updateRule(index, { ...rule, logicalOperator: val as LogicalOperator })}
                    >
                      <SelectTrigger className="w-full" data-testid={`select-logical-operator-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">E</SelectItem>
                        <SelectItem value="OR">OU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Campo */}
                <div className={index > 0 ? "col-span-3" : "col-span-4"}>
                  <Select
                    value={rule.field}
                    onValueChange={(val) => updateRule(index, { ...rule, field: val as TicketField })}
                  >
                    <SelectTrigger data-testid={`select-field-${index}`}>
                      <SelectValue placeholder="Selecione o campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operador */}
                <div className="col-span-3">
                  <Select
                    value={rule.operator}
                    onValueChange={(val) => updateRule(index, { ...rule, operator: val as QueryOperator })}
                  >
                    <SelectTrigger data-testid={`select-operator-${index}`}>
                      <SelectValue placeholder="Operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor */}
                <div className="col-span-4">
                  {(() => {
                    const valueOptions = getValueOptions(rule.field);
                    
                    if (valueOptions) {
                      // Renderizar Select com opções predefinidas
                      return (
                        <Select
                          value={typeof rule.value === 'string' ? rule.value : ''}
                          onValueChange={(val) => updateRule(index, { ...rule, value: val })}
                        >
                          <SelectTrigger data-testid={`select-value-${index}`}>
                            <SelectValue placeholder="Selecione o valor" />
                          </SelectTrigger>
                          <SelectContent>
                            {valueOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    } else {
                      // Renderizar Input para campos de texto livre
                      return (
                        <Input
                          value={typeof rule.value === 'string' ? rule.value : ''}
                          onChange={(e) => updateRule(index, { ...rule, value: e.target.value })}
                          placeholder="Digite o valor"
                          data-testid={`input-value-${index}`}
                        />
                      );
                    }
                  })()}
                </div>

                {/* Botão remover */}
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRule(index)}
                    data-testid={`button-remove-rule-${index}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(value.rules && value.rules.length > 1) && (
        <div className="border-t pt-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Operador lógico global:</span>
            <Select
              value={value.logicalOperator}
              onValueChange={(val) => onChange({ ...value, logicalOperator: val as LogicalOperator })}
            >
              <SelectTrigger className="w-20" data-testid="select-global-logical-operator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">E</SelectItem>
                <SelectItem value="OR">OU</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

export default QueryBuilderComponent;