import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { filterDOMProps } from '@/utils/propFiltering';

interface DynamicBadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
  colorHex?: string;
  bgColor?: string;
  textColor?: string;
  className?: string;
  fieldName?: string; // Aceita mas não passa para o DOM
  value?: string; // Aceita mas não passa para o DOM
  [key: string]: any; // Para permitir outras props que serão filtradas
}

// Função para converter hex em classe CSS com bom contraste e suporte a cores dinâmicas
const getContrastClassFromHex = (hexColor: string): string => {
  if (!hexColor) return 'bg-slate-600 text-white border-slate-600';

  // Normalizar cor hex
  const normalizedHex = hexColor.toLowerCase().trim();

  // Mapear cores hex específicas para classes CSS com bom contraste
  const colorMap: Record<string, string> = {
    // Cores de prioridade
    '#10b981': 'bg-emerald-600 text-white border-emerald-600', // Baixa/Resolvido - Verde
    '#f59e0b': 'bg-amber-600 text-white border-amber-600',     // Média/Em andamento - Amarelo
    '#ef4444': 'bg-red-600 text-white border-red-600',         // Alta - Vermelho
    '#dc2626': 'bg-red-700 text-white border-red-700',         // Crítica - Vermelho escuro

    // Cores de status específicas
    '#6b7280': 'bg-slate-600 text-white border-slate-600',     // Novo - Cinza
    '#3b82f6': 'bg-blue-600 text-white border-blue-600',       // Aberto - Azul
    '#374151': 'bg-gray-700 text-white border-gray-700',       // Fechado - Cinza escuro

    // Cores de categoria
    '#8b5cf6': 'bg-purple-600 text-white border-purple-600',   // Infraestrutura - Roxo
    '#06b6d4': 'bg-cyan-600 text-white border-cyan-600',       // Suporte técnico - Ciano
    '#84cc16': 'bg-lime-600 text-white border-lime-600',       // Atendimento - Lima
    '#f97316': 'bg-orange-600 text-white border-orange-600',   // Financeiro - Laranja

    // Variações de cores (maiúsculas e alternativas)
    '#059669': 'bg-emerald-700 text-white border-emerald-700', // Verde alternativo
    '#d97706': 'bg-amber-700 text-white border-amber-700',     // Amarelo alternativo
    '#ea580c': 'bg-orange-600 text-white border-orange-600',   // Laranja alternativo
    '#DC2626': 'bg-red-600 text-white border-red-600',         // Vermelho maiúsculo
    '#3B82F6': 'bg-blue-600 text-white border-blue-600',       // Azul maiúsculo
    '#F59E0B': 'bg-amber-600 text-white border-amber-600',     // Amarelo maiúsculo
    '#10B981': 'bg-emerald-600 text-white border-emerald-600', // Verde maiúsculo
    '#6B7280': 'bg-slate-600 text-white border-slate-600',     // Cinza maiúsculo
    '#22c55e': 'bg-green-600 text-white border-green-600',     // Verde claro
  };

  // Buscar cor no mapa ou retornar estilo customizado
  const mappedColor = colorMap[normalizedHex];
  if (mappedColor) {
    return mappedColor;
  }

  // Se não encontrar no mapa, usar a cor hex diretamente com estilo inline
  return `custom-hex-color`;
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

export function DynamicBadge(props: DynamicBadgeProps) {
  const { 
    variant = 'default', 
    children, 
    colorHex, 
    bgColor, 
    textColor, 
    className,
    fieldName,
    value,
    ...restProps 
  } = props;

  // 🚨 CORREÇÃO: Filtragem consistente de props usando utilitário
  const cleanProps = filterDOMProps(restProps, ['fieldName', 'value']);
  let dynamicClasses = '';
  let inlineStyles: React.CSSProperties = {};

  // Implementar fallback robusto para cores
  const getFieldColorWithDefault = (fieldName: string, value: string): string => {
    // Fallback para cores padrão da empresa Default
    const defaultColors: Record<string, Record<string, string>> = {
      category: {
        'suporte_tecnico': '#3b82f6',
        'atendimento_cliente': '#10b981', 
        'financeiro': '#f59e0b',
        'vendas': '#8b5cf6',
        'support': '#3b82f6', // Mapear para azul como suporte_tecnico
        'hardware': '#ef4444',
        'software': '#22c55e',
        'network': '#f97316',
        'access': '#84cc16',
        'other': '#64748b',
        'technical_support': '#3b82f6',
        'customer_service': '#10b981',
        'infrastructure': '#8b5cf6'
      },
      priority: {
        'low': '#10b981',
        'medium': '#22c55e', 
        'high': '#9333ea',
        'critical': '#dc2626'
      },
      status: {
        'new': '#9333ea',
        'open': '#3b82f6',
        'in_progress': '#f59e0b',
        'resolved': '#10b981',
        'closed': '#6b7280'
      },
      urgency: {
        'low': '#10b981',
        'medium': '#f59e0b',
        'high': '#f97316',
        'critical': '#dc2626'
      },
      impact: {
        'low': '#10b981',
        'medium': '#f59e0b', 
        'high': '#f97316',
        'critical': '#dc2626'
      }
    };

    const color = defaultColors[fieldName]?.[value];
    if (color) return color;
    
    // Fallback final por campo
    if (fieldName === 'category') return '#3b82f6'; // Azul padrão
    if (fieldName === 'priority') return '#22c55e'; // Verde padrão
    if (fieldName === 'status') return '#3b82f6'; // Azul padrão
    
    return '#6b7280'; // Cinza como último recurso
  };

  const finalColor = colorHex || getFieldColorWithDefault(fieldName || '', value || '');

  // Converter cor hex para classes Tailwind ou usar inline styles
  const getBadgeStyles = (color: string) => {
    // Se for uma cor hex, usar inline styles
    if (color.startsWith('#')) {
      return {
        backgroundColor: color,
        // @ts-ignore
        color: getContrastColor(color)
      };
    }

    // Fallback para classes padrão se não conseguir processar
    return {
      backgroundColor: '#6b7280',
      color: '#ffffff'
    };
  };

  // Prioridade: colorHex > bgColor > variant padrão
  if (colorHex && colorHex.trim() !== '') {
    const mappedClass = getContrastClassFromHex(colorHex);

    if (mappedClass === 'custom-hex-color') {
      // Usar estilos inline para cores hex personalizadas
      inlineStyles = {
        backgroundColor: colorHex,
        color: getContrastTextColor(colorHex),
        borderColor: colorHex,
      };
      dynamicClasses = 'border';
    } else {
      dynamicClasses = mappedClass;
    }
  } else if (bgColor) {
    dynamicClasses = getLegacyColorMapping(bgColor);
  }

  // Se temos classes dinâmicas ou estilos inline, usar variant outline para não conflitar
  const finalVariant = (dynamicClasses || Object.keys(inlineStyles).length > 0) ? 'outline' : variant;

  return (
    <Badge 
      variant={finalVariant as any}
      className={cn(
        dynamicClasses,
        'font-medium text-xs px-2 py-1 rounded-md transition-colors',
        className
      )}
      style={Object.keys(inlineStyles).length > 0 ? inlineStyles : undefined}
      {...cleanProps} // Props limpos - sem fieldName/value
    >
      {children}
    </Badge>
  );
}

// Função para determinar cor do texto baseada no contraste
function getContrastTextColor(hexColor: string): string {
  // Converter hex para RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calcular luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Retornar preto para cores claras, branco para cores escuras
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export default DynamicBadge;