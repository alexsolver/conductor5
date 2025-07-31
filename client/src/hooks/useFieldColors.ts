import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

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

// Cache global de cores para evitar re-renderizações desnecessárias
let globalColorsCache: FieldOption[] | null = null;
let globalColorsReady = false;

export const useFieldColors = () => {
  const [isColorsReady, setIsColorsReady] = useState(globalColorsReady);
  
  const { data: fieldOptionsData, isLoading, error, isFetched } = useQuery<FieldColorsResponse>({
    queryKey: ['fieldColors'],
    queryFn: async () => {
      // Se já temos cache global, use-o
      if (globalColorsCache && globalColorsReady) {
        return { success: true, data: globalColorsCache };
      }

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

      const result = await response.json();
      
      // Atualizar cache global
      if (result.success && result.data) {
        globalColorsCache = result.data;
        globalColorsReady = true;
      }

      return result;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - cache mais longo
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Usar cache global se disponível
    initialData: globalColorsCache ? { success: true, data: globalColorsCache } : undefined,
  });

  // Marcar cores como prontas quando os dados chegarem
  useEffect(() => {
    if (fieldOptionsData?.data && fieldOptionsData.data.length > 0) {
      if (!globalColorsReady) {
        globalColorsCache = fieldOptionsData.data;
        globalColorsReady = true;
        console.log('🎨 Field colors loaded and cached globally:', fieldOptionsData.data.length, 'options');
      }
      
      if (!isColorsReady) {
        setIsColorsReady(true);
        console.log('🎨 Field colors ready state updated');
      }
    }
  }, [fieldOptionsData, isColorsReady]);

  // Memoizar cores para melhor performance
  const colorsMap = useMemo(() => {
    const map = new Map<string, string>();
    const data = fieldOptionsData?.data || globalColorsCache || [];
    
    data.forEach((opt: FieldOption) => {
      const key = `${opt.field_name}:${opt.value}`;
      map.set(key, opt.color);
    });
    
    return map;
  }, [fieldOptionsData]);

  // Função para buscar cor de um campo específico
  const getFieldColor = (fieldName: string, value: string): string | undefined => {
    if (!value) return getDefaultColor(fieldName, value);
    
    // Debug para categoria
    if (fieldName === 'category') {
      console.log(`🎨 Getting color for category:`, {
        fieldName,
        value,
        availableColors: Array.from(colorsMap.keys()).filter(k => k.startsWith('category:')),
        totalColors: colorsMap.size
      });
    }
    
    // Usar cache memoizado primeiro
    const directKey = `${fieldName}:${value}`;
    if (colorsMap.has(directKey)) {
      const color = colorsMap.get(directKey);
      if (fieldName === 'category') {
        console.log(`✅ Found color for category ${value}:`, color);
      }
      return color;
    }

    // Se não encontrar, tenta mapeamento reverso para status
    if (fieldName === 'status') {
      const statusReverseMap: Record<string, string> = {
        'new': 'novo',
        'open': 'aberto',
        'in_progress': 'em_andamento',
        'resolved': 'resolvido',
        'closed': 'fechado',
        'cancelled': 'cancelado'
      };
      
      const mappedValue = statusReverseMap[value] || value;
      const mappedKey = `${fieldName}:${mappedValue}`;
      if (colorsMap.has(mappedKey)) {
        return colorsMap.get(mappedKey);
      }
    }

    // Se não encontrar, tenta mapeamento reverso para priority
    if (fieldName === 'priority') {
      const priorityReverseMap: Record<string, string> = {
        'critical': 'critical',
        'high': 'high', 
        'medium': 'medium',
        'low': 'low'
      };
      
      const mappedValue = priorityReverseMap[value] || value;
      const mappedKey = `${fieldName}:${mappedValue}`;
      if (colorsMap.has(mappedKey)) {
        return colorsMap.get(mappedKey);
      }
    }

    return getDefaultColor(fieldName, value);
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
      },
      category: {
        'infraestrutura': '#8B5CF6',     // roxo
        'infrastructure': '#8B5CF6',     // roxo
        'suporte_tecnico': '#3B82F6',    // azul
        'technical_support': '#3B82F6',  // azul
        'atendimento_cliente': '#10B981', // verde
        'customer_service': '#10B981',    // verde
        'financeiro': '#F59E0B',         // amarelo
        'financial': '#F59E0B',          // amarelo
        'hardware': '#8B5CF6',           // roxo (maps to infraestrutura)
        'software': '#3B82F6',           // azul (maps to suporte_tecnico)
        'network': '#8B5CF6',            // roxo (maps to infraestrutura)
        'access': '#3B82F6',             // azul (maps to suporte_tecnico)
        'other': '#3B82F6'               // azul (maps to suporte_tecnico)
      }
    };

    const color = defaultColors[fieldName]?.[value] || '#6B7280';
    
    if (fieldName === 'category') {
      console.log(`🎨 Using default color for category ${value}:`, color);
    }
    
    return color;
  };

  // Memoizar labels para melhor performance
  const labelsMap = useMemo(() => {
    const map = new Map<string, string>();
    const data = fieldOptionsData?.data || globalColorsCache || [];
    
    data.forEach((opt: FieldOption) => {
      const key = `${opt.field_name}:${opt.value}`;
      map.set(key, opt.label);
    });
    
    return map;
  }, [fieldOptionsData]);

  // Função para buscar label de um campo específico
  const getFieldLabel = (fieldName: string, value: string): string => {
    if (!value) return value;
    
    // Usar cache memoizado primeiro
    const directKey = `${fieldName}:${value}`;
    if (labelsMap.has(directKey)) {
      return labelsMap.get(directKey) || value;
    }

    // Se não encontrar, tenta mapeamento reverso para status
    if (fieldName === 'status') {
      const statusReverseMap: Record<string, string> = {
        'new': 'novo',
        'open': 'aberto', 
        'in_progress': 'em_andamento',
        'resolved': 'resolvido',
        'closed': 'fechado',
        'cancelled': 'cancelado'
      };
      
      const mappedValue = statusReverseMap[value] || value;
      const mappedKey = `${fieldName}:${mappedValue}`;
      if (labelsMap.has(mappedKey)) {
        return labelsMap.get(mappedKey) || value;
      }
    }

    // Se não encontrar, tenta mapeamento reverso para priority  
    if (fieldName === 'priority') {
      const priorityReverseMap: Record<string, string> = {
        'critical': 'critical',
        'high': 'high',
        'medium': 'medium', 
        'low': 'low'
      };
      
      const mappedValue = priorityReverseMap[value] || value;
      const mappedKey = `${fieldName}:${mappedValue}`;
      if (labelsMap.has(mappedKey)) {
        return labelsMap.get(mappedKey) || value;
      }
    }

    return value;
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
    isLoading: isLoading && !globalColorsReady,
    isColorsReady: isColorsReady || globalColorsReady,
    fieldOptions: fieldOptionsData?.data || globalColorsCache || [],
    error
  };
};