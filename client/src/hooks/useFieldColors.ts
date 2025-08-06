/**
 * DYNAMIC FIELD COLORS HOOK - Resolves PROBLEMA 2: VALORES HARD-CODED
 * React hook for fetching dynamic field colors with caching and performance optimization
 */

import { useQuery } from '@tanstack/react-query';
import { 
  DynamicFieldType, 
  UseFieldColorsReturn,
  DEFAULT_FIELD_COLORS,
  FIELD_CACHE_DURATION
} from '@shared/dynamic-field-types';
import { useFieldOptions } from './useFieldOptions';

interface UseFieldColorsConfig {
  fieldName?: DynamicFieldType;
  companyId?: string;
  enabled?: boolean;
}

/**
 * Hook to get field colors for badge components
 * Integrates with existing field options API to extract colors
 */
export function useFieldColors(config: UseFieldColorsConfig = {}): UseFieldColorsReturn {
  const {
    fieldName,
    companyId,
    enabled = true
  } = config;

  // Get field options which include color information
  const { options, isLoading, error, refetch } = useFieldOptions({
    fieldName,
    companyId,
    enabled
  });

  // Create color map from field options
  const colors = new Map<string, string>();
  const getFieldColor = (value: string): string | undefined => {
    // First check if we have it in the loaded options
    const option = options.find(opt => opt.value === value);
    if (option?.color) {
      return option.color;
    }

    // Fall back to default colors
    return DEFAULT_FIELD_COLORS[value] || DEFAULT_FIELD_COLORS.default;
  };

  // Populate colors map for performance
  options.forEach(option => {
    if (option.color) {
      colors.set(option.value, option.color);
    }
  });

  return {
    colors,
    getFieldColor,
    isLoading,
    error,
    refetch
  };
}

/**
 * Specialized hooks for common field types
 */
export function useStatusColors(companyId?: string) {
  return useFieldColors({ fieldName: 'status', companyId });
}

export function usePriorityColors(companyId?: string) {
  return useFieldColors({ fieldName: 'priority', companyId });
}

export function useCategoryColors(companyId?: string) {
  return useFieldColors({ fieldName: 'category', companyId });
}

export function useImpactColors(companyId?: string) {
  return useFieldColors({ fieldName: 'impact', companyId });
}

export function useUrgencyColors(companyId?: string) {
  return useFieldColors({ fieldName: 'urgency', companyId });
}

/**
 * Utility hook to get all field colors for badge systems
 */
export function useAllFieldColors(companyId?: string) {
  return useFieldColors({ companyId }); // No fieldName = get all field colors
}

/**
 * Hook to get color with fallback and validation
 */
export function useValidatedFieldColor(fieldName: DynamicFieldType, value: string, companyId?: string) {
  const { getFieldColor, isLoading } = useFieldColors({ fieldName, companyId });
  
  const color = getFieldColor(value);
  const hasValidColor = !!color && color !== DEFAULT_FIELD_COLORS.default;
  
  return {
    color: color || DEFAULT_FIELD_COLORS.default,
    hasValidColor,
    isLoading
  };
}

/**
 * Hook to get all colors for a specific field type as an object
 */
export function useFieldColorMap(fieldName: DynamicFieldType, companyId?: string) {
  const { options, isLoading, error } = useFieldOptions({ fieldName, companyId });
  
  const colorMap: Record<string, string> = {};
  options.forEach(option => {
    if (option.color) {
      colorMap[option.value] = option.color;
    } else {
      // Fall back to default colors
      colorMap[option.value] = DEFAULT_FIELD_COLORS[option.value] || DEFAULT_FIELD_COLORS.default;
    }
  });
  
  return {
    colorMap,
    isLoading,
    error
  };
}