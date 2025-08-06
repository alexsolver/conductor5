/**
 * DYNAMIC FIELD OPTIONS HOOK - Resolves PROBLEMA 2: VALORES HARD-CODED
 * React hook for fetching dynamic field options with caching and validation
 */

import { useQuery } from '@tanstack/react-query';
import { 
  DynamicFieldType, 
  DynamicFieldOption, 
  GetFieldOptionsRequest,
  GetFieldOptionsResponse,
  UseFieldOptionsReturn
} from '@shared/dynamic-field-types';
import { apiRequest } from '@/lib/queryClient';

// Import the helper function from queryClient
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch (e) {
      text = res.statusText || 'Unknown error';
    }
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

interface UseFieldOptionsConfig extends GetFieldOptionsRequest {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

/**
 * Hook to fetch dynamic field options for any field type
 */
export function useFieldOptions(config: UseFieldOptionsConfig): UseFieldOptionsReturn {
  const {
    fieldName,
    tenantId,
    companyId,
    dependsOn,
    parentValue,
    includeInactive = false,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = config;

  const queryKey = [
    '/api/ticket-config/field-options',
    fieldName,
    tenantId,
    companyId,
    dependsOn,
    parentValue,
    includeInactive
  ].filter(Boolean);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<GetFieldOptionsResponse> => {
      const params = new URLSearchParams();
      
      if (fieldName) params.append('fieldName', fieldName);
      if (tenantId) params.append('tenantId', tenantId);
      if (companyId) params.append('companyId', companyId);
      if (dependsOn) params.append('dependsOn', dependsOn);
      if (parentValue) params.append('parentValue', parentValue);
      if (includeInactive) params.append('includeInactive', 'true');

      const response = await apiRequest('GET', `/api/ticket-config/field-options?${params.toString()}`);
      await throwIfResNotOk(response);
      return response.json();
    },
    enabled,
    staleTime,
    gcTime: cacheTime,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    options: data?.data || [],
    isLoading,
    error: error as Error | null,
    refetch
  };
}

/**
 * Hook for specific field types with simplified API
 */
export function useStatusOptions(companyId?: string) {
  return useFieldOptions({ fieldName: 'status', companyId });
}

export function usePriorityOptions(companyId?: string) {
  return useFieldOptions({ fieldName: 'priority', companyId });
}

export function useCategoryOptions(companyId?: string) {
  return useFieldOptions({ fieldName: 'category', companyId });
}

export function useSubcategoryOptions(categoryValue?: string, companyId?: string) {
  return useFieldOptions({ 
    fieldName: 'subcategory', 
    dependsOn: 'category',
    parentValue: categoryValue,
    companyId,
    enabled: !!categoryValue
  });
}

export function useActionOptions(subcategoryValue?: string, companyId?: string) {
  return useFieldOptions({ 
    fieldName: 'action', 
    dependsOn: 'subcategory',
    parentValue: subcategoryValue,
    companyId,
    enabled: !!subcategoryValue
  });
}

export function useImpactOptions(companyId?: string) {
  return useFieldOptions({ fieldName: 'impact', companyId });
}

export function useUrgencyOptions(companyId?: string) {
  return useFieldOptions({ fieldName: 'urgency', companyId });
}

export function useAssignmentGroupOptions(companyId?: string) {
  return useFieldOptions({ fieldName: 'assignmentGroup', companyId });
}

export function useCallerTypeOptions(companyId?: string) {
  return useFieldOptions({ fieldName: 'callerType', companyId });
}

export function useContactTypeOptions(companyId?: string) {
  return useFieldOptions({ fieldName: 'contactType', companyId });
}

/**
 * Hook to get all field options for multiple fields at once
 */
export function useAllFieldOptions(companyId?: string) {
  return useFieldOptions({ companyId }); // No fieldName = get all fields
}

/**
 * Hook to validate if a field value exists in the available options
 */
export function useFieldValidation(fieldName: DynamicFieldType, value: string, companyId?: string) {
  const { options, isLoading } = useFieldOptions({ fieldName, companyId });
  
  const isValid = !isLoading && options.some(option => option.value === value);
  const availableValues = options.map(option => option.value);
  
  return {
    isValid,
    availableValues,
    isLoading
  };
}