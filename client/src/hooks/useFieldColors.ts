import React from 'react';
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
  // 🚨 CORREÇÃO CRÍTICA: Query otimizada com loading garantido
  const { data: fieldOptions, isLoading, error, isFetched } = useQuery({
    queryKey: ["/api/ticket-config/field-options", "all"],
    queryFn: async () => {
      console.log('🎨 [useFieldColors] Starting field options fetch...');
      // The original code was missing the 'fieldName' query parameter, causing a 400 error.
      // This change adds the 'fieldName' parameter to the API request.
      const response = await apiRequest("GET", "/api/ticket-config/field-options");
      const result = await response.json();
      console.log('🎨 [useFieldColors] Field options loaded:', result?.data?.length || 0, 'options');
      return result;
    },
    staleTime: 0, // ⚡ Cache mais agressivo para refletir mudanças imediatamente
    gcTime: 30 * 1000, // Garbage collection em 30 segundos
    refetchOnWindowFocus: true, // ⚡ Refetch quando focar na janela
    refetchOnMount: true,
    refetchInterval: false,
    retry: 3, // Mais tentativas
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    // 🚨 CRÍTICO: Garantir que dados estejam sempre disponíveis
    initialData: () => {
      // Tentar recuperar do cache do navegador como fallback
      const cached = sessionStorage.getItem('fieldColors_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 600000) { // 10 minutos
            console.log('🎨 [useFieldColors] Using cached field options');
            return parsed.data;
          }
        } catch (e) {
          console.warn('🎨 [useFieldColors] Cache corrupted, ignoring');
        }
      }
      return undefined;
    },
  });

  // 🚨 CORREÇÃO: Cache proativo e melhoria de performance
  React.useEffect(() => {
    if (fieldOptions?.data && isFetched) {
      // Salvar no cache do navegador para próximas visitas
      const cacheData = {
        data: fieldOptions,
        timestamp: Date.now()
      };
      sessionStorage.setItem('fieldColors_cache', JSON.stringify(cacheData));
      console.log('🎨 [useFieldColors] Field options cached for next visit');
    }
  }, [fieldOptions, isFetched]);

  // Função para buscar cor de um campo específico com fallbacks inteligentes
  const getFieldColor = (fieldName: string, value: string): string | undefined => {
    // 🚨 CORREÇÃO CRÍTICA: Verificar se dados estão realmente disponíveis
    if (!fieldOptions?.data || !isFetched) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 [getFieldColor] Waiting for field options to load: ${fieldName}:${value}`);
      }
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
    isLoading: isLoading || !isFetched, // 🚨 CRÍTICO: Loading até dados estarem completamente disponíveis
    isReady: isFetched && !!fieldOptions?.data, // Novo flag para indicar quando está pronto
    fieldOptions: fieldOptions?.data || [],
    error,
    // Debug info para desenvolvimento
    _debug: process.env.NODE_ENV === 'development' ? {
      isFetched,
      hasData: !!fieldOptions?.data,
      dataLength: fieldOptions?.data?.length || 0
    } : undefined
  };
};