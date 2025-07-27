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

export const useTicketMetadata = () => {
  const { data: fieldConfigurations, isLoading: configLoading } = useQuery({
    queryKey: ['/api/ticket-metadata/field-configurations'],
    staleTime: 15 * 60 * 1000, // 15 minutes - increased cache time
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Prevent unnecessary refetching
    refetchOnMount: false,
  });

  const { data: fieldOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ['/api/ticket-metadata/field-options'],
    staleTime: 15 * 60 * 1000, // 15 minutes - increased cache time
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Prevent unnecessary refetching
    refetchOnMount: false,
  });

  const isLoading = configLoading || optionsLoading;

  const getFieldOptions = (fieldName: string): FieldOption[] => {
    if (!fieldOptions?.success) return [];
    return fieldOptions.data.filter((option: FieldOption) => option.fieldName === fieldName);
  };

  const getFieldOption = (fieldName: string, optionValue: string): FieldOption | undefined => {
    const options = getFieldOptions(fieldName);
    return options.find(option => option.optionValue === optionValue);
  };

  const getFieldConfiguration = (fieldName: string): FieldConfiguration | undefined => {
    if (!fieldConfigurations?.success) return undefined;
    return fieldConfigurations.data.find((config: FieldConfiguration) => config.fieldName === fieldName);
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
    fieldConfigurations: fieldConfigurations?.data || [],
    fieldOptions: fieldOptions?.data || []
  };
}