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
  const { data: fieldOptionsData } = useQuery<FieldColorsResponse>({
    queryKey: ['fieldColors'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/ticket-config/field-options', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Função para buscar cor de um campo específico
  const getFieldColor = (fieldName: string, value: string): string | undefined => {
    if (!fieldOptionsData?.data) return undefined;

    const option = fieldOptionsData.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    return option?.color;
  };

  // Função para buscar label de um campo específico
  const getFieldLabel = (fieldName: string, value: string): string => {
    if (!fieldOptionsData?.data) return value;

    const option = fieldOptionsData.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    return option?.label || value;
  };

  // Criar mapa de cores por campo para performance
  const getFieldColorMap = (fieldName: string): Record<string, string> => {
    if (!fieldOptionsData?.data) return {};

    const cacheKey = fieldName;
    if (colorsCache.has(cacheKey)) {
      return colorsCache.get(cacheKey)!;
    }

    const colorMap: Record<string, string> = {};
    fieldOptionsData.data
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
    isLoading: !fieldOptionsData,
    fieldOptions: fieldOptionsData?.data || []
  };
};