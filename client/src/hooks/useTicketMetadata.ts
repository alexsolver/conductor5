import { useQuery } from '@tanstack/react-query';
import { useTenantId } from './useTenantId';
import React from 'react';

interface FieldOption {
  value: string;
  label: string;
  color?: string;
  isDefault?: boolean;
}

interface FieldOptionsResponse {
  success: boolean;
  data: FieldOption[];
  total?: number;
}

// Cache inteligente para reduzir chamadas à API
const fieldOptionsCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useTicketMetadata = () => {
  const tenantId = useTenantId();

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

          const response = await fetch(`/api/ticket-config/field-options?${params}`);
          const data = await response.json();
          allOptions = data.data || [];

          // Atualizar cache
          fieldOptionsCache.set(cacheKey, {
            data: allOptions,
            timestamp: now
          });

          console.log(`🔄 Fetched fresh field options for ${fieldName}`);
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
      enabled: !!tenantId && !!fieldName,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useFieldOptions('category');

  const {
    data: subcategoriesData,
    isLoading: subcategoriesLoading,
    error: subcategoriesError,
    refetch: refetchSubcategories
  } = useFieldOptions('subcategory');

  const {
    data: actionsData,
    isLoading: actionsLoading,
    error: actionsError,
    refetch: refetchActions
  } = useFieldOptions('action');

  const {
    data: fieldOptions,
    isLoading: fieldOptionsLoading,
    error: fieldOptionsError,
    refetch: refetchFieldOptions
  } = useFieldOptions('company_id'); // Assuming 'company_id' is the field name for companies


  const companiesQuery = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      // Assuming apiRequest is defined elsewhere and handles the API call
      const apiRequest = async (method: string, url: string) => {
          const response = await fetch(url);
          return await response.json();
      };

      const response = await apiRequest('GET', '/api/companies');
      console.log('🏢 Raw companies response:', response);

      if (Array.isArray(response)) {
        // Filter out inactive companies - NO EXCEPTIONS
        const activeCompanies = response.filter(company =>
          company.status === 'active'
        );

        // Sort to put Default company first (only if it's active)
        const sortedCompanies = activeCompanies.sort((a, b) => {
          const aIsDefault = a.name?.toLowerCase().includes('default') || a.displayName?.toLowerCase().includes('default');
          const bIsDefault = b.name?.toLowerCase().includes('default') || b.displayName?.toLowerCase().includes('default');

          if (aIsDefault && !bIsDefault) return -1;
          if (!aIsDefault && bIsDefault) return 1;
          return a.name.localeCompare(b.name);
        });

        console.log('🏢 Filtered and sorted companies:', sortedCompanies);

        // Clear field options cache when companies change
        fieldOptionsCache.clear();

        return sortedCompanies;
      }

      return [];
    },
    staleTime: 30 * 1000, // Reduced to 30 seconds for faster updates
  });

  // Transform categories data
  const transformedCategories = React.useMemo(() => {
    if (!categoriesData?.data) return [];

    return categoriesData.data.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      color: cat.color || '#3b82f6',
      icon: cat.icon,
      active: cat.active !== false,
      sortOrder: cat.sortOrder || cat.sort_order || 1
    }));
  }, [categoriesData]);

  // Transform subcategories data
  const transformedSubcategories = React.useMemo(() => {
    if (!subcategoriesData?.data) return [];

    return subcategoriesData.data.map((sub: any) => ({
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

  // Transform actions data
  const transformedActions = React.useMemo(() => {
    if (!actionsData?.data) return [];

    return actionsData.data.map((action: any) => ({
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

  return {
    categories: transformedCategories,
    subcategories: transformedSubcategories,
    actions: transformedActions,
    fieldOptions,
    isLoading: categoriesLoading || subcategoriesLoading || actionsLoading || fieldOptionsLoading,
    error: categoriesError || subcategoriesError || actionsError || fieldOptionsError,
    refetch: () => {
      refetchCategories();
      refetchSubcategories();
      refetchActions();
      refetchFieldOptions();
    },
    // Debug info
    rawData: {
      categories: categoriesData,
      subcategories: subcategoriesData,
      actions: actionsData
    }
  };
};