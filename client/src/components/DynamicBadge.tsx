import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { filterDOMProps } from '@/utils/propFiltering';
import { useDynamicColors } from '@/hooks/useDynamicColors';

interface DynamicBadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
  colorHex?: string;
  bgColor?: string;
  textColor?: string;
  className?: string;
  fieldName?: string;
  value?: string;
  isLoading?: boolean;
  [key: string]: any;
}

// Sistema inteligente de conversão hex → Tailwind (fallback)
const convertHexToTailwindClass = (hex: string): string => {
  if (!hex) return 'bg-slate-600 text-white border-slate-600';

  // Hash simples para gerar cor consistente
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = ((hash << 5) - hash) + hex.charCodeAt(i);
    hash = hash & hash;
  }

  // Paleta profissional
  const tailwindClasses = [
    'bg-blue-600 text-white border-blue-600',
    'bg-green-600 text-white border-green-600',
    'bg-yellow-600 text-black border-yellow-600',
    'bg-red-600 text-white border-red-600',
    'bg-purple-600 text-white border-purple-600',
    'bg-cyan-600 text-white border-cyan-600',
    'bg-lime-600 text-white border-lime-600',
    'bg-orange-600 text-white border-orange-600'
  ];

  return tailwindClasses[Math.abs(hash) % tailwindClasses.length];
};

// ✅ COMPONENTE 100% DINÂMICO - sem hard-coded mappings
const DynamicBadge: React.FC<DynamicBadgeProps> = ({
  children,
  colorHex,
  className,
  fieldName,
  value,
  isLoading,
  ...props
}) => {
  const { getFieldColor, getFieldLabel, isLoading: colorsLoading } = useDynamicColors();

  // Se está carregando, mostrar estado de loading
  if (isLoading || colorsLoading) {
    return (
      <Badge
        className={cn('animate-pulse bg-gray-200 text-gray-400', className)}
        {...filterDOMProps(props)}
      >
        {children}
      </Badge>
    );
  }

  // 🎨 SISTEMA 100% DINÂMICO - usar cores e labels direto do banco
  let colorResult = { color: '#64748b', textColor: '#ffffff', className: 'bg-slate-600 text-white border-slate-600' };
  let displayText = children;

  if (fieldName && value) {
    colorResult = getFieldColor(fieldName, value);
    // 🏷️ PRIORIDADE: children fornecido > label do banco > valor
    displayText = children || getFieldLabel(fieldName, value) || value;
    console.log(`🎨 DynamicBadge: fieldName=${fieldName}, value=${value}, label=${displayText}, color=${colorResult.color}`);
  } else if (colorHex) {
    colorResult = { color: colorHex, textColor: '#ffffff', className: convertHexToTailwindClass(colorHex) };
    console.log(`🎨 DynamicBadge: colorHex=${colorHex}, color=${colorResult.color}`);
  }

  // Filtrar props antes de passar para o componente
  const filteredProps = filterDOMProps(props);

  return (
    <Badge
      className={cn('border', className)}
      style={{
        backgroundColor: colorResult.color,
        color: colorResult.textColor,
        borderColor: colorResult.color
      }}
      {...filteredProps}
    >
      {displayText || children}
    </Badge>
  );
};

export default DynamicBadge;
export { DynamicBadge };