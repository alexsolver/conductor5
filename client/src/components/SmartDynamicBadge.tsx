/**
 * SmartDynamicBadge - Badge inteligente que integra com useFieldColors para resolver race conditions
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFieldColors } from '@/hooks/useFieldColors';
import { Loader2, AlertCircle } from 'lucide-react';

interface SmartDynamicBadgeProps {
  fieldName: string;
  value: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  showIcon?: boolean;
  size?: 'default' | 'sm' | 'lg';
  loading?: boolean;
  [key: string]: any;
}

export function SmartDynamicBadge({ 
  fieldName, 
  value, 
  className = "", 
  variant = "secondary", 
  showIcon = false, 
  size = "default",
  loading = false,
  ...props 
}: SmartDynamicBadgeProps) {
  const { getFieldColor, getFieldLabel, isLoading, isReady } = useFieldColors();

  if (!value || value === '') {
    return null;
  }

  // Size-specific classes
  const sizeClasses = {
    sm: "text-xs px-2 py-1 h-5",
    default: "text-sm px-2.5 py-1.5 h-6", 
    lg: "text-base px-3 py-2 h-8"
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    default: "h-3 w-3",
    lg: "h-4 w-4"
  };

  // 🚨 CORREÇÃO CRÍTICA: Aguardar dados estarem prontos antes de renderizar
  if (isLoading || !isReady || loading) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "inline-flex items-center gap-1 bg-gray-50 text-gray-500 border-gray-200",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <Loader2 className={cn("animate-spin", iconSizes[size])} />
        <span>Carregando...</span>
      </Badge>
    );
  }

  const colorHex = getFieldColor(fieldName, value);
  const label = getFieldLabel(fieldName, value);

  console.log(`🎨 SmartDynamicBadge: fieldName=${fieldName}, value=${value}, colorHex=${colorHex}, ready=${isReady}`);

  // Se não encontrar cor específica, usar badge padrão do sistema
  if (!colorHex) {
    return (
      <Badge 
        variant={variant} 
        className={cn("inline-flex items-center gap-1", className)}
        {...props}
      >
        {showIcon && <AlertCircle className="h-3 w-3" />}
        {label}
      </Badge>
    );
  }

  // Aplicar cor customizada com estilo inline para garantir visibilidade
  const inlineStyles: React.CSSProperties = {
    backgroundColor: colorHex,
    borderColor: colorHex,
    color: getContrastColor(colorHex),
  };

  return (
    <Badge 
      variant="default"
      className={cn("inline-flex items-center gap-1 border", sizeClasses[size], className)}
      style={inlineStyles}
      {...props}
    >
      {showIcon && <div className={cn("rounded-full bg-current opacity-75", iconSizes[size])} />}
      {label}
    </Badge>
  );
}

// Função auxiliar para calcular cor de contraste
function getContrastColor(hexColor: string): string {
  // Converter hex para RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcular luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retornar branco ou preto baseado na luminância
  return luminance > 0.5 ? '#000000' : '#ffffff';
}