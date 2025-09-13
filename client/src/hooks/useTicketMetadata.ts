import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantId } from './useTenantId';
import React from 'react';

// Interface para representar um campo em uma configuração de ticket
interface FieldOption {
  value: string;
  label: string;
  color?: string;
  isDefault?: boolean;
  status?: string; // Adicionado para o filtro de empresas inativas
}

// Interface de resposta da API para opções de campo
interface FieldOptionsResponse {
  success: boolean;
  data: FieldOption[];
  total?: number;
}

// Interface para a estrutura de dados de tickets
interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  companyId?: string; // Para associar categoria a uma empresa específica
}

interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  color?: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  categoryName?: string;
}

interface Action {
  id: string;
  name: string;
  description?: string;
  subcategoryId: string;
  color?: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  subcategoryName?: string;
  categoryName?: string;
}

// Helper para fazer chamadas de API
const apiRequest = async (method: string, url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    return response;
};

// Cache inteligente para reduzir chamadas à API de campo
const fieldOptionsCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useTicketMetadata = () => {
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  // Hook genérico para buscar opções de campo com cache
  const useFieldOptions = (fieldName: string, companyId?: string) => {
    return useQuery<FieldOptionsResponse>({
      queryKey: ['fieldOptions', tenantId, fieldName, companyId || 'default'],
      queryFn: async () => {
        const cacheKey = `${tenantId}-${companyId || 'default'}`;
        const now = Date.now();

        // Verificar cache primeiro
        const cached = fieldOptionsCache.get(cacheKey);
        let allOptions: any[] = [];

        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          console.log(`📦 Using cached field options for ${fieldName}`);
          allOptions = cached.data;
        } else {
          // Buscar da API apenas se necessário
          const params = new URLSearchParams({
            tenantId: tenantId || '',
            ...(companyId && { companyId })
          });

          try {
            const response = await apiRequest('GET', `/api/ticket-config/field-options?${params}`);
            const data = await response.json();
            allOptions = data.data || [];

            // Atualizar cache
            fieldOptionsCache.set(cacheKey, {
              data: allOptions,
              timestamp: now
            });

            console.log(`🔄 Fetched fresh field options for ${fieldName}`);
          } catch (error) {
            console.error(`Error fetching field options for ${fieldName}:`, error);
            // Retornar um array vazio em caso de erro para não quebrar a UI
            return { success: false, data: [] };
          }
        }

        // Filter options for specific field and exclude inactive companies
        const filteredOptions = allOptions.filter((option: any) => {
          // Basic field filter
          if (option.field_name !== fieldName) return false;

          // For company_id field, filter out inactive companies
          if (fieldName === 'company_id' && option.status === 'inactive') {
            return false;
          }

          return true;
        }).map((option: any) => ({
          value: option.value,
          label: option.label,
          color: option.color,
          isDefault: option.is_default,
          status: option.status
        }));

        // Sort options to put Default company first
        const sortedOptions = filteredOptions.sort((a, b) => {
          // If one is "Default" (case insensitive), put it first
          const aIsDefault = a.label?.toLowerCase().includes('default') || a.value?.toLowerCase().includes('default');
          const bIsDefault = b.label?.toLowerCase().includes('default') || b.value?.toLowerCase().includes('default');

          if (aIsDefault && !bIsDefault) return -1;
          if (!aIsDefault && bIsDefault) return 1;

          // Secondary sort by isDefault flag
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;

          // Tertiary sort alphabetically
          return (a.label || '').localeCompare(b.label || '');
        });

        console.log(`🔍 Field options for ${fieldName}:`, {
          total: allOptions.length,
          filtered: sortedOptions.length,
          options: sortedOptions.map(opt => ({ value: opt.value, label: opt.label, isDefault: opt.isDefault }))
        });

        return {
          success: true,
          data: sortedOptions,
          total: sortedOptions.length
        };
      },
      enabled: !!tenantId && !!fieldName, // Habilita a query se tenantId e fieldName existirem
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    });
  };

  // Busca de categorias
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useFieldOptions('category');

  // Busca de subcategorias
  const {
    data: subcategoriesData,
    isLoading: subcategoriesLoading,
    error: subcategoriesError,
    refetch: refetchSubcategories
  } = useFieldOptions('subcategory');

  // Busca de ações
  const {
    data: actionsData,
    isLoading: actionsLoading,
    error: actionsError,
    refetch: refetchActions
  } = useFieldOptions('action');

  // Busca de opções de campo (ex: empresas)
  const {
    data: fieldOptionsData, // Renomeado para evitar conflito com o hook genérico
    isLoading: fieldOptionsLoading,
    error: fieldOptionsError,
    refetch: refetchFieldOptions
  } = useFieldOptions('company_id'); // Assumindo 'company_id' como o campo para empresas


  // Query para buscar todas as empresas (não relacionado a opções de campo)
  const companiesQuery = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/companies');
      const companies = await response.json();
      console.log('🏢 Raw companies response:', companies);

      if (Array.isArray(companies)) {
        // Filtra empresas ativas e ordena para colocar a empresa "Default" primeiro
        const activeCompanies = companies.filter(company => company.status === 'active');
        const sortedCompanies = activeCompanies.sort((a, b) => {
          const aIsDefault = a.name?.toLowerCase().includes('default') || a.displayName?.toLowerCase().includes('default');
          const bIsDefault = b.name?.toLowerCase().includes('default') || b.displayName?.toLowerCase().includes('default');

          if (aIsDefault && !bIsDefault) return -1;
          if (!aIsDefault && bIsDefault) return 1;
          return a.name.localeCompare(b.name);
        });

        console.log('🏢 Filtered and sorted companies:', sortedCompanies);

        // Limpa o cache de opções de campo quando as empresas são atualizadas
        fieldOptionsCache.clear();

        return sortedCompanies;
      }

      return [];
    },
    staleTime: 30 * 1000, // 30 segundos
  });

  // Transforma os dados das categorias para a estrutura esperada
  const transformedCategories = React.useMemo(() => {
    if (!categoriesData) return [];
    return categoriesData.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      color: cat.color || '#3b82f6',
      icon: cat.icon,
      active: cat.active !== false,
      sortOrder: cat.sortOrder || cat.sort_order || 1
    }));
  }, [categoriesData]);

  // Transforma os dados das subcategorias
  const transformedSubcategories = React.useMemo(() => {
    if (!subcategoriesData) return [];
    return subcategoriesData.map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
      categoryId: sub.categoryId || sub.category_id,
      color: sub.color || '#3b82f6',
      icon: sub.icon,
      active: sub.active !== false,
      sortOrder: sub.sortOrder || sub.sort_order || 1,
      categoryName: sub.category_name
    }));
  }, [subcategoriesData]);

  // Transforma os dados das ações
  const transformedActions = React.useMemo(() => {
    if (!actionsData) return [];
    return actionsData.map((action: any) => ({
      id: action.id,
      name: action.name,
      description: action.description,
      subcategoryId: action.subcategoryId || action.subcategory_id,
      color: action.color || '#3b82f6',
      icon: action.icon,
      active: action.active !== false,
      sortOrder: action.sortOrder || action.sort_order || 1,
      subcategoryName: action.subcategory_name,
      categoryName: action.category_name
    }));
  }, [actionsData]);

  // Função de refetch consolidada
  const refetchAll = () => {
    refetchCategories();
    refetchSubcategories();
    refetchActions();
    refetchFieldOptions();
    companiesQuery.refetch();
  };

  return {
    categories: transformedCategories,
    subcategories: transformedSubcategories,
    actions: transformedActions,
    // Usando fieldOptionsData que vem da query genérica para 'company_id'
    fieldOptions: fieldOptionsData?.data || [],
    isLoading: categoriesLoading || subcategoriesLoading || actionsLoading || fieldOptionsLoading || companiesQuery.isLoading,
    error: categoriesError || subcategoriesError || actionsError || fieldOptionsError || companiesQuery.error,
    refetch: refetchAll,
    // Dados brutos para depuração ou uso direto se necessário
    rawData: {
      categories: categoriesData,
      subcategories: subcategoriesData,
      actions: actionsData,
      companies: companiesQuery.data // Adiciona dados de empresas ao rawData
    }
  };
};