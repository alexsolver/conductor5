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

  const cleanProps = filterDOMProps(restProps, ['fieldName', 'onChange', 'showAllOption', 'onOptionSelect', 'customerId', 'dependsOn']);
  const [fieldOptions, setFieldOptions] = useState<any[]>([]);
  const { user } = useAuth();

  // Query principal para buscar opções do campo
  const { data: fieldOptionsData, isLoading, error } = useQuery({
    queryKey: ["/api/ticket-config/field-options", fieldName, customerId, dependsOn],
    queryFn: async () => {
      const params: any = { fieldName };
      if (customerId) params.companyId = customerId; // API expects companyId, not customerId
      if (dependsOn) params.dependsOn = dependsOn;

      const response = await apiRequest("GET", "/api/ticket-config/field-options", {
        params
      });
      return response.json();
    },
    enabled: !dependsOn || !!dependsOn, // Se tem dependência, só executa se dependsOn tem valor
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (fieldOptionsData && Array.isArray(fieldOptionsData.data)) {
      setFieldOptions(fieldOptionsData.data);
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
  }, [fieldOptionsData, error]);


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
        {fieldOptions.map((option, index) => (
          <SelectItem key={`${fieldName}-${option.value}-${option.id || index}`} value={option.value}>
            <div className="flex items-center gap-2">
              {option.color && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: option.color }}
                />
              )}
              <span className="truncate">{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}