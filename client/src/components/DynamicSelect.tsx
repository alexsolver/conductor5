/**
 * DynamicSelect - Dynamic select component for ticket fields with Default company fallback
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { filterDOMProps } from "@/utils/propFiltering";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DynamicSelectProps {
  fieldName: string;
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAllOption?: boolean;
  onOptionSelect?: (option: any) => void;
  customerId?: string;
  allowCustomInput?: boolean;
  dependsOn?: string; // Para dependências hierárquicas (categoria → subcategoria → ação)
  [key: string]: any;
}

export function DynamicSelect(props: DynamicSelectProps) {
  const {
    fieldName,
    value,
    onChange,
    onValueChange,
    placeholder,
    className,
    disabled = false,
    showAllOption = false,
    onOptionSelect,
    customerId,
    dependsOn,
    ...restProps
  } = props;

  const cleanProps = filterDOMProps(restProps, ['fieldName', 'onChange', 'showAllOption', 'onOptionSelect', 'customerId', 'dependsOn', 'allowCustomInput']);
  const [fieldOptions, setFieldOptions] = useState<any[]>([]);
  const { user } = useAuth();

  // Query principal para buscar opções do campo
  const { data: fieldOptionsData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/ticket-config/field-options", fieldName, customerId, dependsOn],
    queryFn: async () => {
      // CRÍTICO: Garantir que fieldName sempre é enviado
      if (!fieldName) {
        console.error('❌ DynamicSelect: fieldName é obrigatório!', { fieldName, customerId, dependsOn });
        throw new Error('fieldName é obrigatório para buscar opções');
      }

      const params: any = { fieldName };
      if (customerId) params.companyId = customerId; // API expects companyId, not customerId
      if (dependsOn) params.dependsOn = dependsOn;

      console.log(`🔍 DynamicSelect API call for ${fieldName}:`, {
        fieldName,
        companyId: customerId,
        dependsOn,
        params
      });

      const response = await apiRequest("GET", `/api/ticket-config/field-options?${new URLSearchParams(params).toString()}`);
      return response.json();
    },
    enabled: !!fieldName, // Só executa se fieldName existe
    staleTime: 0, // ⚡ Cache mais agressivo para refletir mudanças imediatamente
    cacheTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: true, // ⚡ Refetch quando focar na janela
  });

  useEffect(() => {
    if (fieldOptionsData && Array.isArray(fieldOptionsData.data)) {
      // Filtrar pelos dados específicos do campo se não for hierárquico
      let filteredOptions = fieldOptionsData.data;

      // Para campos não-hierárquicos (status, priority, impact, urgency), filtrar pelo field_name
      if (!['category', 'subcategory', 'action'].includes(fieldName) && fieldName) {
        filteredOptions = fieldOptionsData.data.filter((option: any) => 
          option.field_name === fieldName
        );
      }

      console.log(`🔍 DynamicSelect ${fieldName}:`, {
        fieldName,
        dependsOn,
        totalReceived: fieldOptionsData.data.length,
        filtered: filteredOptions.length,
        isHierarchical: ['category', 'subcategory', 'action'].includes(fieldName),
        sampleData: filteredOptions.slice(0, 3).map((opt: any) => ({
          id: opt.id,
          value: opt.value,
          label: opt.label,
          field_name: opt.field_name,
          color: opt.color
        }))
      });

      setFieldOptions(filteredOptions);
    } else if (fieldOptionsData && !fieldOptionsData.success) {
      console.error('API returned an error:', fieldOptionsData.message);
      setFieldOptions([]);
    } else if (error) {
      console.error('Error fetching field options:', error);
      setFieldOptions([]);
    } else {
      // If data is not yet loaded or is empty, ensure fieldOptions is an empty array
      setFieldOptions([]);
    }
  }, [fieldOptionsData, error, fieldName, dependsOn]);


  const handleSelectChange = (value: string) => {
    const callback = onChange || onValueChange;
    if (callback) {
      callback(value);
    }

    // Find the selected option and call onOptionSelect if provided
    if (onOptionSelect) {
      const selectedOption = fieldOptions.find(option => option.value === value);
      if (selectedOption) {
        onOptionSelect(selectedOption);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2 border rounded" {...cleanProps}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Carregando opções...</span>
      </div>
    );
  }

  if (error || (fieldOptionsData && !fieldOptionsData.success) || fieldOptions.length === 0) {
    return (
      <div className="flex items-center justify-center p-2 border rounded border-destructive/20" {...cleanProps}>
        <AlertCircle className="w-4 h-4 text-destructive mr-2" />
        <span className="text-sm text-destructive">{error ? "Erro ao carregar opções" : (fieldOptionsData?.message || "Nenhuma opção disponível")}</span>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={handleSelectChange}
      disabled={disabled}
      {...cleanProps}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || `Selecionar ${fieldName}...`} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">Todos</SelectItem>
        )}
        {fieldOptions.map((option, index) => {
          // Generate truly unique key using field name, index, and option identifiers
          const uniqueKey = `${fieldName}-${index}-${option.id || option.value || option.label || 'unknown'}-${index}`;
          // Ensure option.value is not empty string and handle duplicates
          const optionValue = option.value || option.option_value || option.display_label || `option_${index}`;
          const optionLabel = option.label || option.display_label || option.name || optionValue;

          return (
            <SelectItem key={uniqueKey} value={optionValue}>
              <div className="flex items-center gap-2">
                {(option.color || option.color_hex) && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color || option.color_hex }}
                  />
                )}
                <span className="truncate">{optionLabel}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}