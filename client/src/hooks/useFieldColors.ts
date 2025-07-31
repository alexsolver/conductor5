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
      const result = await response.json();
      console.log('🎨 Field colors response:', result);
      return result;
    },
    retry: 3,
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos (reduzido para debug)
    cacheTime: 5 * 60 * 1000, // Manter em cache por 5 minutos
    refetchOnWindowFocus: false, // Não refetch ao focar janela
  });

  // Função para buscar cor de um campo específico
  const getFieldColor = (fieldName: string, value: string): string | undefined => {
    if (!fieldOptions?.data) {
      // Não fazer log excessivo quando dados não estão carregados
      return undefined;
    }

    if (!value || value === '') {
      return undefined;
    }

    const option = fieldOptions.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    if (option?.color) {
      // Log apenas em modo debug mais específico
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
        console.log(`🎨 Color found: ${fieldName}:${value} = ${option.color}`);
      }
      return option.color;
    } else {
      // Log apenas quando não encontrar cor esperada
      if (process.env.NODE_ENV === 'development' && ['priority', 'status'].includes(fieldName)) {
        console.log(`🎨 No color for ${fieldName}:${value}. Available:`, 
          fieldOptions.data.filter(opt => opt.field_name === fieldName).map(opt => `${opt.value}:${opt.color}`).slice(0, 3)
        );
      }
      return undefined;
    }
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