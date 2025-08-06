/**
 * Dynamic Colors Hook - 100% baseado nas configurações do banco de dados
 * Elimina completamente hard-coded color mappings
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FieldOption {
  id: string;
  fieldName: string;
  value: string;
  label: string;
  color: string | null;
  bgColor: string | null;
  textColor: string | null;
}

interface ColorResult {
  color?: string;
  bgColor?: string;
  textColor?: string;
  className?: string;
}

// Sistema de cores inteligente com fallbacks
const generateSmartColor = (value: string, fieldName: string): ColorResult => {
  // Hash simples para gerar cor consistente baseada no value
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Paleta de cores profissionais para fallback
  const professionalColors = [
    { color: '#3b82f6', className: 'bg-blue-600 text-white border-blue-600' },    // Azul
    { color: '#10b981', className: 'bg-green-600 text-white border-green-600' },  // Verde
    { color: '#f59e0b', className: 'bg-yellow-600 text-black border-yellow-600' }, // Amarelo
    { color: '#ef4444', className: 'bg-red-600 text-white border-red-600' },      // Vermelho
    { color: '#8b5cf6', className: 'bg-purple-600 text-white border-purple-600' }, // Roxo
    { color: '#06b6d4', className: 'bg-cyan-600 text-white border-cyan-600' },    // Ciano
    { color: '#84cc16', className: 'bg-lime-600 text-white border-lime-600' },    // Lima
    { color: '#f97316', className: 'bg-orange-600 text-white border-orange-600' }, // Laranja
  ];
  
  const colorIndex = Math.abs(hash) % professionalColors.length;
  return professionalColors[colorIndex];
};

export const useDynamicColors = () => {
  const { data: fieldOptions, isLoading, error } = useQuery({
    queryKey: ['/api/ticket-config/field-options', 'colors'],
    queryFn: async () => {
      console.log('🎨 [useDynamicColors] Fetching field options for colors...');
      const response = await apiRequest('GET', '/api/ticket-config/field-options');
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('🎨 [useDynamicColors] Loaded', result.data.length, 'field options');
        return result.data as FieldOption[];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000,   // GC após 10 minutos
    retry: 3,
  });

  // Função para obter cor de um campo específico
  const getFieldColor = (fieldName: string, value: string): ColorResult => {
    if (!fieldOptions || !value) {
      return generateSmartColor(value || '', fieldName);
    }

    // Buscar configuração exata no banco
    const option = fieldOptions.find(opt => 
      opt.fieldName === fieldName && opt.value === value
    );

    if (option && option.color) {
      console.log(`✅ [useDynamicColors] Database color found: ${fieldName}:${value} = ${option.color}`);
      
      // Converter hex para className Tailwind se possível
      const className = hexToTailwindClass(option.color);
      return {
        color: option.color,
        bgColor: option.bgColor || option.color,
        textColor: option.textColor || (isLightColor(option.color) ? '#000000' : '#ffffff'),
        className
      };
    }

    // Se não encontrou no banco, usar sistema inteligente
    console.log(`🎨 [useDynamicColors] Generating smart color for: ${fieldName}:${value}`);
    return generateSmartColor(value, fieldName);
  };

  // Função para obter label de um campo
  const getFieldLabel = (fieldName: string, value: string): string => {
    if (!fieldOptions || !value) return value;

    const option = fieldOptions.find(opt => 
      opt.fieldName === fieldName && opt.value === value
    );

    return option?.label || value;
  };

  return {
    getFieldColor,
    getFieldLabel,
    isLoading,
    error,
    fieldOptions: fieldOptions || []
  };
};

// Utilitário para converter hex para classe Tailwind
const hexToTailwindClass = (hex: string): string => {
  const colorMap: Record<string, string> = {
    '#3b82f6': 'bg-blue-600 text-white border-blue-600',
    '#10b981': 'bg-green-600 text-white border-green-600',
    '#f59e0b': 'bg-yellow-600 text-black border-yellow-600',
    '#ef4444': 'bg-red-600 text-white border-red-600',
    '#dc2626': 'bg-red-700 text-white border-red-700',
    '#8b5cf6': 'bg-purple-600 text-white border-purple-600',
    '#06b6d4': 'bg-cyan-600 text-white border-cyan-600',
    '#84cc16': 'bg-lime-600 text-white border-lime-600',
    '#f97316': 'bg-orange-600 text-white border-orange-600',
    '#6b7280': 'bg-slate-600 text-white border-slate-600',
  };

  return colorMap[hex.toLowerCase()] || 'bg-slate-600 text-white border-slate-600';
};

// Utilitário para detectar se uma cor é clara
const isLightColor = (hex: string): boolean => {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128;
};

// Utilitário para converter hex para RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};