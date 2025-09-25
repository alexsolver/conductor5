// ✅ 1QA.MD COMPLIANCE: QUERY BUILDER COMPONENT
// Dynamic query builder for SLA rules following Clean Architecture

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Filter } from 'lucide-react';

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
                  <Input
                    value={typeof rule.value === 'string' ? rule.value : ''}
                    onChange={(e) => updateRule(index, { ...rule, value: e.target.value })}
                    placeholder="Valor"
                    data-testid={`input-value-${index}`}
                  />
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