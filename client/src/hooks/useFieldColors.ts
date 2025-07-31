import { useQuery } from '@tanstack/react-query';

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
    retry: 3,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    cacheTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
    refetchOnWindowFocus: false, // Não refetch ao focar janela
  });

  // Função para buscar cor de um campo específico
  const getFieldColor = (fieldName: string, value: string): string | undefined => {
    if (!fieldOptions?.data) return undefined;

    const option = fieldOptions.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    return option?.color;
  };

  // Função para buscar label de um campo específico
  const getFieldLabel = (fieldName: string, value: string): string => {
    if (!fieldOptions?.data) return value;

    const option = fieldOptions.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    return option?.label || value;
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