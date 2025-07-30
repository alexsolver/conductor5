/**
 * DynamicSelect - Dynamic select component for ticket fields with Default company fallback
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { filterDOMProps } from "@/utils/propFiltering";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

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
    ...restProps
  } = props;

  const cleanProps = filterDOMProps(restProps, ['fieldName', 'onChange', 'showAllOption', 'onOptionSelect']);
  const [fieldOptions, setFieldOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFieldOptions = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for DynamicSelect');
          return;
        }

        setIsLoading(true);
        
        // Use the new ticket-config API with automatic fallback to Default company
        const response = await fetch(`/api/ticket-config/field-options`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          // Filter options for this specific field
          const filteredOptions = result.data.filter((option: any) => 
            option.field_name === fieldName
          );
          
          console.log(`DynamicSelect ${fieldName}: Found ${filteredOptions.length} options from API`);
          setFieldOptions(filteredOptions);
        } else {
          console.error('Invalid API response structure:', result);
          setFieldOptions([]);
        }
      } catch (error) {
        console.error('Error fetching field options:', error);
        setFieldOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFieldOptions();
  }, [fieldName]);

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

  if (fieldOptions.length === 0) {
    return (
      <div className="flex items-center justify-center p-2 border rounded border-destructive/20" {...cleanProps}>
        <AlertCircle className="w-4 h-4 text-destructive mr-2" />
        <span className="text-sm text-destructive">Nenhuma opção disponível</span>
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
        {fieldOptions.map((option) => (
          <SelectItem key={option.id || option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.color && (
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: option.color }}
                />
              )}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}