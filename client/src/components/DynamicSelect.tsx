/**
 * DynamicSelect - Dynamic select component for ticket fields
 * Uses configuration from backend to populate options
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTicketMetadata } from "@/hooks/useTicketMetadata";
import { AlertCircle, Loader2 } from "lucide-react";

interface DynamicSelectProps {
  fieldName: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAllOption?: boolean;
}

export function DynamicSelect({ 
  fieldName, 
  value, 
  onValueChange, 
  placeholder, 
  className,
  disabled = false,
  showAllOption = false
}: DynamicSelectProps) {
  const { getFieldOptions, isLoading } = useTicketMetadata();
  
  const options = getFieldOptions(fieldName);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 p-2 border rounded-md bg-gray-50 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Carregando opções...</span>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={`flex items-center gap-2 p-2 border rounded-md bg-red-50 border-red-200 ${className}`}>
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600">
          Campo "{fieldName}" não configurado
        </span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || "Selecionar..."} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>All</span>
            </div>
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem key={option.id} value={option.optionValue}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${option.bgColor}`} />
              <span>{option.optionLabel}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}