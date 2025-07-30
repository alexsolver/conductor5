/**
 * DynamicSelect - Dynamic select component for ticket fields
 * Uses configuration from backend to populate options
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTicketMetadata } from "@/hooks/useTicketMetadata";
import { AlertCircle, Loader2 } from "lucide-react";
import { filterDOMProps } from "@/utils/propFiltering";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
// import { useTenant } from "@/hooks/useTenant"; // Removed import

interface DynamicSelectProps {
  fieldName: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAllOption?: boolean;
  onOptionSelect?: (option: any) => void;
  [key: string]: any; // Para props adicionais que serão filtradas
}

export function DynamicSelect(props: DynamicSelectProps) {
  const {
    fieldName,
    value,
    onChange,
    placeholder,
    className,
    disabled = false,
    showAllOption = false,
    onOptionSelect,
    ...restProps
  } = props;

  // 🚨 CORREÇÃO: Filtragem consistente de props usando utilitário
  const cleanProps = filterDOMProps(restProps, ['fieldName', 'onChange', 'showAllOption', 'onOptionSelect']);
  const [fieldOptions, setFieldOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Obter tenant_id do user context
  const tenantId = user?.tenantId;

  useEffect(() => {
    const fetchFieldOptions = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!fieldName || !accessToken || !tenantId) {
        console.log('🔍 DynamicSelect missing requirements:', { fieldName, hasToken: !!accessToken, tenantId });
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/ticket-field-options/${fieldName}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-tenant-id': tenantId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Ensure data is array and has proper structure
          const options = Array.isArray(data) ? data : (data?.options || []);
          setFieldOptions(options);
          console.log(`🔍 DynamicSelect for ${fieldName}:`, {
            totalOptions: options.length,
            filteredOptions: options.length,
            fieldOptions: options,
            rawResponse: data
          });
        } else {
          const errorText = await response.text();
          console.error(`Failed to fetch options for ${fieldName}:`, response.status, errorText);
        }
      } catch (error) {
        console.error('Error fetching field options:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && tenantId && fieldName) {
      fetchFieldOptions();
    }
  }, [tenantId, fieldName]);

  const handleSelectChange = (value: string) => {
    onChange(value);

    // Se há uma opção selecionada, pegar seus dados completos
    const selectedOption = fieldOptions.find(opt => opt.value === value);
    if (selectedOption && onOptionSelect) {
      onOptionSelect(selectedOption);
    }
  };

  return (
    <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || `Selecione ${fieldName}...`} />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>Carregando...</SelectItem>
        ) : fieldOptions.length === 0 ? (
          <SelectItem value="no-options" disabled>Nenhuma opção disponível</SelectItem>
        ) : (
          fieldOptions.map((option, index) => {
            // Ensure option has proper structure and non-empty value
            const value = option.value || option.id || `option-${index}`;
            const label = option.label || option.name || option.display_name || value;

            // Skip items with empty values to avoid Radix error
            if (!value || value === '') return null;

            return (
              <SelectItem key={value} value={value}>
                <div className="flex items-center space-x-2">
                  {option.color && (
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span>{label}</span>
                </div>
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
}