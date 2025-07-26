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

export function useTicketMetadata() {
  // Field configurations query
  const { data: fieldConfigs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['/api/ticket-metadata/field-configurations'],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Field options query
  const { data: fieldOptions, isLoading: isLoadingOptions } = useQuery({
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

  return {
    getFieldOptions,
    getFieldOption,
    getFieldConfiguration,
    isLoading,
    fieldConfigurations: fieldConfigs?.data || [],
    fieldOptions: fieldOptions?.data || []
  };
}