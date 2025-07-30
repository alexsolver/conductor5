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
import { useTenant } from "@/hooks/useTenant";

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
  const { token } = useAuth();
  const { tenantId } = useTenant();

  useEffect(() => {
    const fetchFieldOptions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/ticket-field-options/${fieldName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenantId,
          },
        });

        if (response.ok) {
          const data = await response.json();

          console.log('🔍 DynamicSelect for', fieldName + ':', {
            success: data.success,
            totalOptions: data.options?.length || 0,
            fieldOptions: data.options || []
          });

          setFieldOptions(data.options || []);
        } else {
          console.error('Failed to fetch field options:', response.status);
        }
      } catch (error) {
        console.error('Error fetching field options:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && tenantId && fieldName) {
      fetchFieldOptions();
    }
  }, [token, tenantId, fieldName]);

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
          <SelectItem value="" disabled>Carregando...</SelectItem>
        ) : fieldOptions.length === 0 ? (
          <SelectItem value="" disabled>Nenhuma opção disponível</SelectItem>
        ) : (
          fieldOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center space-x-2">
                {option.color && (
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span>{option.label || option.value}</span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}