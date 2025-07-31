import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

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
  const [isColorsReady, setIsColorsReady] = useState(false);
  
  const { data: fieldOptionsData, isLoading, error, isFetched } = useQuery<FieldColorsResponse>({
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
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Marcar cores como prontas quando os dados chegarem
  useEffect(() => {
    if (fieldOptionsData?.data && !isLoading && isFetched) {
      setIsColorsReady(true);
      console.log('🎨 Field colors loaded and ready:', fieldOptionsData.data.length, 'options');
    }
  }, [fieldOptionsData, isLoading, isFetched]);

  // Função para buscar cor de um campo específico
  const getFieldColor = (fieldName: string, value: string): string | undefined => {
    if (!fieldOptionsData?.data || !value) return getDefaultColor(fieldName, value);

    // Primeiro tenta encontrar exato
    let option = fieldOptionsData.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    // Se não encontrar, tenta mapeamento reverso para status
    if (!option && fieldName === 'status') {
      const statusReverseMap: Record<string, string> = {
        'new': 'novo',
        'open': 'aberto',
        'in_progress': 'em_andamento',
        'resolved': 'resolvido',
        'closed': 'fechado',
        'cancelled': 'cancelado'
      };
      
      const mappedValue = statusReverseMap[value] || value;
      option = fieldOptionsData.data.find(
        (opt: FieldOption) => opt.field_name === fieldName && opt.value === mappedValue
      );
    }

    // Se não encontrar, tenta mapeamento reverso para priority
    if (!option && fieldName === 'priority') {
      const priorityReverseMap: Record<string, string> = {
        'critical': 'critical',
        'high': 'high', 
        'medium': 'medium',
        'low': 'low'
      };
      
      const mappedValue = priorityReverseMap[value] || value;
      option = fieldOptionsData.data.find(
        (opt: FieldOption) => opt.field_name === fieldName && opt.value === mappedValue
      );
    }

    return option?.color || getDefaultColor(fieldName, value);
  };

  // Função para cores padrão quando não encontra no banco
  const getDefaultColor = (fieldName: string, value: string): string => {
    const defaultColors: Record<string, Record<string, string>> = {
      status: {
        'new': '#3B82F6',      // azul
        'novo': '#3B82F6',     // azul
        'open': '#10B981',     // verde
        'aberto': '#10B981',   // verde
        'in_progress': '#F59E0B', // amarelo
        'em_andamento': '#F59E0B', // amarelo
        'resolved': '#059669', // verde escuro
        'resolvido': '#059669', // verde escuro
        'closed': '#6B7280',   // cinza
        'fechado': '#6B7280',  // cinza
        'cancelled': '#EF4444', // vermelho
        'cancelado': '#EF4444'  // vermelho
      },
      priority: {
        'low': '#10B981',      // verde
        'medium': '#F59E0B',   // amarelo
        'high': '#EF4444',     // vermelho
        'critical': '#DC2626'  // vermelho escuro
      },
      impact: {
        'low': '#10B981',      // verde
        'medium': '#F59E0B',   // amarelo
        'high': '#EF4444'      // vermelho
      },
      urgency: {
        'low': '#10B981',      // verde
        'medium': '#F59E0B',   // amarelo
        'high': '#EF4444'      // vermelho
      }
    };

    return defaultColors[fieldName]?.[value] || '#6B7280';
  };

  // Função para buscar label de um campo específico
  const getFieldLabel = (fieldName: string, value: string): string => {
    if (!fieldOptionsData?.data || !value) return value;

    // Primeiro tenta encontrar exato
    let option = fieldOptionsData.data.find(
      (opt: FieldOption) => opt.field_name === fieldName && opt.value === value
    );

    // Se não encontrar, tenta mapeamento reverso para status
    if (!option && fieldName === 'status') {
      const statusReverseMap: Record<string, string> = {
        'new': 'novo',
        'open': 'aberto', 
        'in_progress': 'em_andamento',
        'resolved': 'resolvido',
        'closed': 'fechado',
        'cancelled': 'cancelado'
      };
      
      const mappedValue = statusReverseMap[value] || value;
      option = fieldOptionsData.data.find(
        (opt: FieldOption) => opt.field_name === fieldName && opt.value === mappedValue
      );
    }

    // Se não encontrar, tenta mapeamento reverso para priority  
    if (!option && fieldName === 'priority') {
      const priorityReverseMap: Record<string, string> = {
        'critical': 'critical',
        'high': 'high',
        'medium': 'medium', 
        'low': 'low'
      };
      
      const mappedValue = priorityReverseMap[value] || value;
      option = fieldOptionsData.data.find(
        (opt: FieldOption) => opt.field_name === fieldName && opt.value === mappedValue
      );
    }

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
    isLoading: isLoading || !isColorsReady,
    isColorsReady,
    fieldOptions: fieldOptionsData?.data || [],
    error
  };
};