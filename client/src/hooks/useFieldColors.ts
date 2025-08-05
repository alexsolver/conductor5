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

export const useFieldColors = (companyId?: string) => {
  // 🚨 CORREÇÃO: Buscar ALL field options sem filtro de company
  // para garantir que todas as cores sejam carregadas na inicialização
  const { data: fieldOptions, isLoading, error } = useQuery({
    queryKey: ["/api/ticket-config/field-options", "all"], 
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ticket-config/field-options");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos - mais agressivo
    gcTime: 60 * 60 * 1000, // Garbage collection em 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: true, // 🚨 CRÍTICO: permitir mount para garantir carregamento inicial
    refetchInterval: false, // Disable auto-refetch
    retry: 2, // Aumentar tentativas para garantir carregamento
    retryDelay: 500, // Delay menor entre tentativas
  });

  // Função para buscar cor de um campo específico priorizando configurações
  const getFieldColor = (fieldName: string, value: string): string | undefined => {
    if (!fieldOptions?.data) {
      return undefined;
    }

    if (!value || value === '') {
      return undefined;
    }

    // Primeiro, tentar encontrar configuração específica (busca exata por value)
    const option = fieldOptions.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    if (option?.color) {
      console.log(`✅ Color found by value: ${fieldName}:${value} = ${option.color}`);
      return option.color;
    }

    // Se não encontrou, tentar busca por label (para valores hierárquicos)
    const optionByLabel = fieldOptions.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.label === value
    );

    if (optionByLabel?.color) {
      console.log(`✅ Color found by label: ${fieldName}:${value} = ${optionByLabel.color}`);
      return optionByLabel.color;
    }

    // Log para debug quando não encontrar cor configurada
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️ No configured color found for ${fieldName}:${value}. Available options:`, 
        fieldOptions.data.filter(opt => opt.field_name === fieldName).map(opt => `${opt.value}(${opt.label}):${opt.color}`).slice(0, 5)
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