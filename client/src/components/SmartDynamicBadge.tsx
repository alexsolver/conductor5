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
  [key: string]: any;
}

export function SmartDynamicBadge({ 
  fieldName, 
  value, 
  className = "", 
  variant = "secondary", 
  showIcon = false, 
  size = "default",
  ...props 
}: SmartDynamicBadgeProps) {
  const { getFieldColor, getFieldLabel, isLoading, isReady } = useFieldColors();

  if (!value || value === '') {
    return null;
  }

  // 🚨 CORREÇÃO CRÍTICA: Aguardar dados estarem prontos antes de renderizar
  if (isLoading || !isReady) {
    return (
      <Badge 
        variant="outline" 
        className={cn("inline-flex items-center gap-1 bg-gray-50 text-gray-500 border-gray-200", className)}
        {...props}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Carregando...</span>
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
      className={cn("inline-flex items-center gap-1 border", className)}
      style={inlineStyles}
      {...props}
    >
      {showIcon && <div className="w-2 h-2 rounded-full bg-current opacity-75" />}
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