
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';

interface CustomFieldMetadata {
  id: string;
  moduleType: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'textarea' | 'file' | 'email' | 'phone';
  fieldLabel: string;
  isRequired: boolean;
  validationRules: Record<string, any>;
  fieldOptions: Record<string, any>;
  displayOrder: number;
  isActive: boolean;
}

interface DynamicCustomFieldsProps {
  moduleType: 'customers' | 'tickets' | 'beneficiaries' | 'materials' | 'services' | 'locations';
  entityId?: string;
  values?: Record<string, any>;
  onChange?: (fieldKey: string, value: any) => void;
  readOnly?: boolean;
  className?: string;
}

const DynamicCustomFields: React.FC<DynamicCustomFieldsProps> = ({
  moduleType,
  entityId,
  values = {},
  onChange,
  readOnly = false,
  className = ''
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(values);

  // Fetch custom fields for the module
  const { data: fields = [], isLoading, error } = useQuery({
    queryKey: ['custom-fields', moduleType],
    queryFn: async () => {
      const response = await fetch(`/api/custom-fields/fields/${moduleType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch custom fields');
      }
      const data = await response.json();
      return data.data || [];
    }
  });

  // Fetch entity values if entityId is provided
  const { data: entityValues } = useQuery({
    queryKey: ['custom-field-values', moduleType, entityId],
    queryFn: async () => {
      if (!entityId) return {};
      const response = await fetch(`/api/custom-fields/values/${moduleType}/${entityId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch entity values');
      }
      const data = await response.json();
      const valuesMap: Record<string, any> = {};
      data.data?.forEach((item: any) => {
        valuesMap[item.field_id] = JSON.parse(item.field_value || 'null');
      });
      return valuesMap;
    },
    enabled: !!entityId
  });

  useEffect(() => {
    // Merge values from props and entityValues
    const mergedValues = { ...values, ...entityValues };
    setFieldValues(mergedValues);
  }, [entityValues, values]);

  const handleFieldChange = (fieldId: string, value: any) => {
    const newValues = { ...fieldValues, [fieldId]: value };
    setFieldValues(newValues);
    
    if (onChange) {
      onChange(fieldId, value);
    }
  };

  const renderField = (field: CustomFieldMetadata) => {
    // Try to get value by field.id first, then by field.fieldName
    const value = fieldValues[field.id] || fieldValues[field.fieldName] || '';
    const fieldProps = {
      disabled: readOnly,
      required: field.isRequired
    };

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            {...fieldProps}
            type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.fieldOptions?.placeholder || ''}
          />
        );

      case 'number':
        return (
          <Input
            {...fieldProps}
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
            min={field.validationRules?.min}
            max={field.validationRules?.max}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...fieldProps}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={field.fieldOptions?.rows || 3}
            placeholder={field.fieldOptions?.placeholder || ''}
          />
        );

      case 'select':
        return (
          <Select
            disabled={readOnly}
            value={value || ''}
            onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.fieldOptions?.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              disabled={readOnly}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label>{field.fieldOptions?.checkboxLabel || 'Sim'}</Label>
          </div>
        );

      case 'date':
        return (
          <Input
            {...fieldProps}
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.fieldOptions?.options?.map((option: any) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  disabled={readOnly}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v: any) => v !== option.value);
                    handleFieldChange(field.id, newValues);
                  }}
                />
                <Label>{option.label}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Tipo de campo não suportado: {field.fieldType}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando campos customizados...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">
              Erro ao carregar campos customizados. Tente novamente.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fields.length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600 text-center">
            Nenhum campo customizado configurado para este módulo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {fields.map((field: CustomFieldMetadata) => (
        <div key={field.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.fieldLabel}
            </Label>
            {field.isRequired && (
              <Badge variant="destructive" className="text-xs">
                Obrigatório
              </Badge>
            )}
          </div>
          {renderField(field)}
          {field.fieldOptions?.helpText && (
            <p className="text-xs text-gray-500">
              {field.fieldOptions.helpText}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicCustomFields;
