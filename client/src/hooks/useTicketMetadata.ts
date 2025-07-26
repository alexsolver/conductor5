/**
 * Real ticket metadata hook that fetches from backend API
 */

import { useQuery } from "@tanstack/react-query";

export interface FieldOption {
  id: string;
  fieldName: string;
  optionValue: string;
  optionLabel: string;
  bgColor: string;
  textColor: string;
  sortOrder: number;
  isActive: boolean;
}

export interface FieldConfiguration {
  id: string;
  fieldName: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  isSystem: boolean;
  displayOrder: number;
  isActive: boolean;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
}

export function useTicketMetadata() {
  // Field configurations query
  const { data: fieldConfigs, isLoading: isLoadingConfigs } = useQuery<APIResponse<FieldConfiguration[]>>({
    queryKey: ['/api/ticket-metadata/field-configurations'],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Field options query
  const { data: fieldOptions, isLoading: isLoadingOptions } = useQuery<APIResponse<FieldOption[]>>({
    queryKey: ['/api/ticket-metadata/field-options'],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = isLoadingConfigs || isLoadingOptions;

  const getFieldOptions = (fieldName: string): FieldOption[] => {
    if (!fieldOptions?.success) return [];
    return fieldOptions.data.filter((option: FieldOption) => option.fieldName === fieldName);
  };

  const getFieldOption = (fieldName: string, optionValue: string): FieldOption | undefined => {
    const options = getFieldOptions(fieldName);
    return options.find(option => option.optionValue === optionValue);
  };

  const getFieldConfiguration = (fieldName: string): FieldConfiguration | undefined => {
    if (!fieldConfigs?.success) return undefined;
    return fieldConfigs.data.find((config: FieldConfiguration) => config.fieldName === fieldName);
  };

  const generateDynamicSchema = () => {
    // TODO: Implement dynamic Zod schema generation based on field configurations
    // This will replace hard-coded schemas in forms
    return null;
  };

  return {
    getFieldOptions,
    getFieldOption,
    getFieldConfiguration,
    generateDynamicSchema,
    isLoading,
    fieldConfigurations: fieldConfigs?.data || [],
    fieldOptions: fieldOptions?.data || []
  };
}