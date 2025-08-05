import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FieldOption {
  field_name: string;
  value: string;
  label: string;
  color: string;
  is_default: boolean;
}

interface FieldColorsResponse {
  success: boolean;
  data: FieldOption[];
}

// Cache de cores para evitar múltiplas chamadas
const colorsCache = new Map<string, Record<string, string>>();

export const useFieldColors = () => {
  const { data: fieldOptions, isLoading, error } = useQuery({
    queryKey: ["/api/ticket-config/field-options"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ticket-config/field-options");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos - mais agressivo
    gcTime: 60 * 60 * 1000, // Garbage collection em 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Evitar refetch desnecessário
    refetchInterval: false, // Disable auto-refetch
    retry: 1, // Reduzir tentativas para carregamento mais rápido
    retryDelay: 1000, // Delay menor entre tentativas
  });

  // Função para buscar cor de um campo específico com fallback para empresa Default
  const getFieldColor = (fieldName: string, value: string): string | undefined => {
    if (!fieldOptions?.data) {
      return undefined;
    }

    if (!value || value === '') {
      return undefined;
    }

    // Primeiro, tentar encontrar configuração específica
    const option = fieldOptions.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    if (option?.color) {
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
        console.log(`🎨 Color found: ${fieldName}:${value} = ${option.color}`);
      }
      return option.color;
    }

    // Se não encontrou, fazer fallback para mapeamento de cores padrão da empresa Default
    const defaultColorMap: Record<string, Record<string, string>> = {
      category: {
        'suporte_tecnico': '#3b82f6',
        'atendimento_cliente': '#10b981', 
        'financeiro': '#f59e0b',
        'vendas': '#8b5cf6',
        'support': '#3b82f6', // Mapear para suporte_tecnico
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

    const fallbackColor = defaultColorMap[fieldName]?.[value];
    
    if (fallbackColor) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 Using fallback color for ${fieldName}:${value} = ${fallbackColor}`);
      }
      return fallbackColor;
    }

    // Fallback final: se for categoria e não encontrou nada, usar cor padrão
    if (fieldName === 'category') {
      const defaultCategoryColor = '#3b82f6'; // Azul do suporte_tecnico
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 Using final fallback for category:${value} = ${defaultCategoryColor}`);
      }
      return defaultCategoryColor;
    }

    if (process.env.NODE_ENV === 'development' && ['priority', 'status', 'category'].includes(fieldName)) {
      console.log(`🎨 No color found for ${fieldName}:${value}. Available:`, 
        fieldOptions.data.filter(opt => opt.field_name === fieldName).map(opt => `${opt.value}:${opt.color}`).slice(0, 3)
      );
    }
    
    return undefined;
  };

  // Função para buscar label de um campo específico
  const getFieldLabel = (fieldName: string, value: string): string => {
    if (!fieldOptions?.data) return value;

    if (!value || value === '') {
      return value;
    }

    const option = fieldOptions.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    const label = option?.label || value;
    console.log(`🏷️ Label for ${fieldName}:${value} = ${label}`);
    return label;
  };

  // Criar mapa de cores por campo para performance
  const getFieldColorMap = (fieldName: string): Record<string, string> => {
    if (!fieldOptions?.data) return {};

    const cacheKey = fieldName;
    if (colorsCache.has(cacheKey)) {
      return colorsCache.get(cacheKey)!;
    }

    const colorMap: Record<string, string> = {};
    fieldOptions.data
      .filter((opt: FieldOption) => opt.field_name === fieldName)
      .forEach((opt: FieldOption) => {
        colorMap[opt.value] = opt.color;
      });

    colorsCache.set(cacheKey, colorMap);
    return colorMap;
  };

  return {
    getFieldColor,
    getFieldLabel,
    getFieldColorMap,
    isLoading,
    fieldOptions: fieldOptions?.data || [],
    error
  };
};