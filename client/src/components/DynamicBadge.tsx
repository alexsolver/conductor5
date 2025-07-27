import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DynamicBadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
  colorHex?: string;
  bgColor?: string;
  textColor?: string;
  className?: string;
}

// Função para converter hex em classe CSS com bom contraste
const getContrastClassFromHex = (hexColor: string): string => {
  if (!hexColor) return 'bg-slate-600 text-white';

  // Mapear cores hex específicas para classes CSS com bom contraste
  const colorMap: Record<string, string> = {
    '#059669': 'bg-emerald-600 text-white border-emerald-600', // Verde
    '#d97706': 'bg-amber-600 text-white border-amber-600',     // Amarelo
    '#ea580c': 'bg-orange-600 text-white border-orange-600',   // Laranja
    '#dc2626': 'bg-red-600 text-white border-red-600',         // Vermelho
    '#DC2626': 'bg-red-600 text-white border-red-600',         // Vermelho (maiúsculo)
    '#3B82F6': 'bg-blue-600 text-white border-blue-600',       // Azul
    '#f59e0b': 'bg-amber-600 text-white border-amber-600',     // Amarelo claro
    '#F59E0B': 'bg-amber-600 text-white border-amber-600',     // Amarelo claro (maiúsculo)
    '#10B981': 'bg-emerald-600 text-white border-emerald-600', // Verde claro
    '#6B7280': 'bg-slate-600 text-white border-slate-600',     // Cinza
    '#22c55e': 'bg-green-600 text-white border-green-600',     // Verde padrão
    '#ef4444': 'bg-red-600 text-white border-red-600',         // Vermelho padrão
    '#3b82f6': 'bg-blue-600 text-white border-blue-600',       // Azul padrão
  };

  // Retornar classe mapeada ou padrão
  return colorMap[hexColor] || colorMap[hexColor.toLowerCase()] || 'bg-slate-600 text-white border-slate-600';
};

// Função para mapear cores antigas para novas com melhor contraste
const getLegacyColorMapping = (bgColor: string): string => {
  const legacyMap: Record<string, string> = {
    'bg-green-100': 'bg-emerald-600 text-white border-emerald-600',
    'bg-yellow-100': 'bg-amber-600 text-white border-amber-600',
    'bg-orange-100': 'bg-orange-600 text-white border-orange-600',
    'bg-red-100': 'bg-red-600 text-white border-red-600',
    'bg-blue-100': 'bg-blue-600 text-white border-blue-600',
    'bg-gray-100': 'bg-slate-600 text-white border-slate-600',
    'bg-slate-100': 'bg-slate-600 text-white border-slate-600',
    'badge-success': 'bg-emerald-600 text-white border-emerald-600',
    'badge-warning': 'bg-amber-600 text-white border-amber-600',
    'badge-danger': 'bg-red-600 text-white border-red-600',
    'badge-info': 'bg-blue-600 text-white border-blue-600',
    'badge-neutral': 'bg-slate-600 text-white border-slate-600',
  };

  return legacyMap[bgColor] || bgColor;
};

export function DynamicBadge({ 
  variant = 'default', 
  children, 
  colorHex, 
  bgColor, 
  textColor, 
  className, 
  ...props 
}: DynamicBadgeProps) {
  // Remove props que não devem ser passadas para o DOM
  const { fieldName, ...badgeProps } = props as any;
  let dynamicClasses = '';

  // Prioridade: colorHex > bgColor > variant padrão
  if (colorHex) {
    dynamicClasses = getContrastClassFromHex(colorHex);
  } else if (bgColor) {
    dynamicClasses = getLegacyColorMapping(bgColor);
  }

  // Se temos classes dinâmicas, usar variant outline para não conflitar
  const finalVariant = dynamicClasses ? 'outline' : variant;

  return (
    <Badge 
      variant={finalVariant as any}
      className={cn(
        dynamicClasses,
        'font-medium text-xs px-2 py-1 rounded-md',
        className
      )}
      {...badgeProps}
    >
      {children}
    </Badge>
  );
}

export default DynamicBadge;