/**
 * DYNAMIC FIELD LABELS HOOK - Resolves PROBLEMA 2: VALORES HARD-CODED
 * React hook for fetching dynamic field labels with i18n support
 */

import { useQuery } from '@tanstack/react-query';
import { 
  DynamicFieldType, 
  UseFieldLabelsReturn,
  FIELD_CACHE_DURATION
} from '@shared/dynamic-field-types';
import { useFieldOptions } from './useFieldOptions';

interface UseFieldLabelsConfig {
  fieldName?: DynamicFieldType;
  locale?: string;
  companyId?: string;
  enabled?: boolean;
}

/**
 * Hook to get field labels for UI display with i18n support
 */
export function useFieldLabels(config: UseFieldLabelsConfig = {}): UseFieldLabelsReturn {
  const {
    fieldName,
    locale = 'pt-BR',
    companyId,
    enabled = true
  } = config;

  // Get field options which include label information
  const { options, isLoading, error, refetch } = useFieldOptions({
    fieldName,
    companyId,
    enabled
  });

  // Create label map from field options
  const labels = new Map<string, string>();
  const getFieldLabel = (value: string): string | undefined => {
    // First check if we have it in the loaded options
    const option = options.find(opt => opt.value === value);
    if (option?.label) {
      return option.label;
    }

    // Fall back to the value itself if no label is found
    return value;
  };

  // Populate labels map for performance
  options.forEach(option => {
    if (option.label) {
      labels.set(option.value, option.label);
    } else {
      // Fallback to value
      labels.set(option.value, option.value);
    }
  });

  return {
    labels,
    getFieldLabel,
    isLoading,
    error,
    refetch
  };
}

/**
 * Specialized hooks for common field types with Portuguese labels
 */
export function useStatusLabels(companyId?: string) {
  return useFieldLabels({ fieldName: 'status', locale: 'pt-BR', companyId });
}

export function usePriorityLabels(companyId?: string) {
  return useFieldLabels({ fieldName: 'priority', locale: 'pt-BR', companyId });
}

export function useCategoryLabels(companyId?: string) {
  return useFieldLabels({ fieldName: 'category', locale: 'pt-BR', companyId });
}

export function useSubcategoryLabels(companyId?: string) {
  return useFieldLabels({ fieldName: 'subcategory', locale: 'pt-BR', companyId });
}

export function useActionLabels(companyId?: string) {
  return useFieldLabels({ fieldName: 'action', locale: 'pt-BR', companyId });
}

export function useImpactLabels(companyId?: string) {
  return useFieldLabels({ fieldName: 'impact', locale: 'pt-BR', companyId });
}

export function useUrgencyLabels(companyId?: string) {
  return useFieldLabels({ fieldName: 'urgency', locale: 'pt-BR', companyId });
}

export function useAssignmentGroupLabels(companyId?: string) {
  return useFieldLabels({ fieldName: 'assignmentGroup', locale: 'pt-BR', companyId });
}

/**
 * Hook to get all field labels for complete UI systems
 */
export function useAllFieldLabels(locale: string = 'pt-BR', companyId?: string) {
  return useFieldLabels({ locale, companyId }); // No fieldName = get all field labels
}

/**
 * Hook to get label with validation and fallback
 */
export function useValidatedFieldLabel(fieldName: DynamicFieldType, value: string, companyId?: string) {
  const { getFieldLabel, isLoading } = useFieldLabels({ fieldName, companyId });
  
  const label = getFieldLabel(value);
  const hasCustomLabel = label !== value; // Check if we have a custom label or just the value
  
  return {
    label: label || value,
    hasCustomLabel,
    isLoading
  };
}

/**
 * Hook to get all labels for a specific field type as an object
 */
export function useFieldLabelMap(fieldName: DynamicFieldType, locale: string = 'pt-BR', companyId?: string) {
  const { options, isLoading, error } = useFieldOptions({ fieldName, companyId });
  
  const labelMap: Record<string, string> = {};
  options.forEach(option => {
    labelMap[option.value] = option.label || option.value;
  });
  
  return {
    labelMap,
    isLoading,
    error
  };
}

/**
 * Hook for form field labels and placeholders
 */
export function useFormFieldLabels(locale: string = 'pt-BR') {
  // Static labels for form fields that don't change dynamically
  const formLabels = {
    'pt-BR': {
      subject: 'Assunto',
      description: 'Descrição',
      status: 'Status',
      priority: 'Prioridade',
      category: 'Categoria',
      subcategory: 'Subcategoria',
      action: 'Ação',
      caller: 'Solicitante',
      beneficiary: 'Beneficiário',
      responsible: 'Responsável',
      company: 'Empresa',
      location: 'Local',
      impact: 'Impacto',
      urgency: 'Urgência',
      assignmentGroup: 'Grupo de Atribuição',
      contactType: 'Tipo de Contato',
      environment: 'Ambiente',
      symptoms: 'Sintomas',
      workaround: 'Solução Temporária',
      businessImpact: 'Impacto no Negócio'
    },
    'en-US': {
      subject: 'Subject',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      category: 'Category',
      subcategory: 'Subcategory',
      action: 'Action',
      caller: 'Caller',
      beneficiary: 'Beneficiary',
      responsible: 'Responsible',
      company: 'Company',
      location: 'Location',
      impact: 'Impact',
      urgency: 'Urgency',
      assignmentGroup: 'Assignment Group',
      contactType: 'Contact Type',
      environment: 'Environment',
      symptoms: 'Symptoms',
      workaround: 'Workaround',
      businessImpact: 'Business Impact'
    }
  };

  return formLabels[locale as keyof typeof formLabels] || formLabels['pt-BR'];
}