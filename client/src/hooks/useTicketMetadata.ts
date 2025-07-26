/**
 * useTicketMetadata - Hook for managing dynamic ticket metadata
 * Provides functions for field configurations, options, styles, and defaults
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCallback } from "react";
import { z } from "zod";

// TypeScript interfaces for metadata
interface FieldConfiguration {
  id: string;
  fieldName: string;
  displayName: string;
  description?: string;
  fieldType: 'select' | 'multiselect' | 'text';
  isRequired: boolean;
  isSystemField: boolean;
  sortOrder: number;
  isActive: boolean;
  options?: FieldOption[];
}

interface FieldOption {
  id: string;
  optionValue: string;
  displayLabel: string;
  description?: string;
  colorHex?: string;
  iconName?: string;
  cssClasses?: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  slaHours?: number;
  escalationRules?: any;
}

interface StyleConfiguration {
  id: string;
  styleName: string;
  fieldName: string;
  styleMapping: Record<string, {
    bg: string;
    text: string;
    darkBg?: string;
    darkText?: string;
  }>;
  darkModeMapping?: Record<string, any>;
  isActive: boolean;
}

interface DefaultConfiguration {
  id: string;
  fieldName: string;
  defaultValue: string;
  applyToNewTickets: boolean;
  applyToImportedTickets: boolean;
}

export function useTicketMetadata() {
  const queryClient = useQueryClient();

  // ===========================
  // FIELD CONFIGURATIONS
  // ===========================

  const { data: fieldConfigurations = [], isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['/api/tickets/metadata/field-configurations'],
    queryFn: () => apiRequest('GET', '/api/tickets/metadata/field-configurations'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (response) => response.configurations || []
  });

  const { data: styleConfigurations = [], isLoading: isLoadingStyles } = useQuery({
    queryKey: ['/api/tickets/metadata/style-configurations'],
    queryFn: () => apiRequest('GET', '/api/tickets/metadata/style-configurations'),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.styles || []
  });

  const { data: defaultConfigurations = [], isLoading: isLoadingDefaults } = useQuery({
    queryKey: ['/api/tickets/metadata/default-configurations'],
    queryFn: () => apiRequest('GET', '/api/tickets/metadata/default-configurations'),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.defaults || []
  });

  // ===========================
  // MUTATIONS
  // ===========================

  const initializeDefaultsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/tickets/metadata/initialize-defaults'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/metadata'] });
    }
  });

  // ===========================
  // UTILITY FUNCTIONS
  // ===========================

  const getFieldOptions = useCallback((fieldName: string) => {
    const config = fieldConfigurations.find(c => c.fieldName === fieldName);
    return config?.options || [];
  }, [fieldConfigurations]);

  const getFieldConfiguration = useCallback((fieldName: string) => {
    return fieldConfigurations.find(c => c.fieldName === fieldName);
  }, [fieldConfigurations]);

  const generateDynamicSchema = useCallback(() => {
    const schemaFields: any = {};
    
    fieldConfigurations.forEach((config: FieldConfiguration) => {
      if (config.fieldType === 'select' && config.options && config.options.length > 0) {
        const values = config.options.map(opt => opt.optionValue);
        const defaultValue = config.options.find(opt => opt.isDefault)?.optionValue;
        
        if (config.isRequired) {
          schemaFields[config.fieldName] = z.enum(values as [string, ...string[]]).default(defaultValue || values[0]);
        } else {
          schemaFields[config.fieldName] = z.enum(values as [string, ...string[]]).optional().default(defaultValue);
        }
      } else if (config.fieldType === 'text') {
        if (config.isRequired) {
          schemaFields[config.fieldName] = z.string().min(1, `${config.displayName} é obrigatório`);
        } else {
          schemaFields[config.fieldName] = z.string().optional();
        }
      }
    });
    
    return z.object(schemaFields);
  }, [fieldConfigurations]);

  const getBadgeStyle = useCallback((fieldName: string, value: string) => {
    const styleConfig = styleConfigurations.find(s => s.fieldName === fieldName);
    const colorMapping = styleConfig?.styleMapping[value];
    
    if (colorMapping) {
      return `${colorMapping.bg} ${colorMapping.text} ${colorMapping.darkBg || ''} ${colorMapping.darkText || ''}`.trim();
    }
    
    // Fallback colors based on common patterns
    switch (fieldName) {
      case 'priority':
        switch (value) {
          case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
          case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
          case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
          case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
          default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
      case 'status':
        switch (value) {
          case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
          case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
          case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
          case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
          default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, [styleConfigurations]);

  const getDefaultValue = useCallback((fieldName: string) => {
    const config = defaultConfigurations.find(d => d.fieldName === fieldName);
    return config?.defaultValue || '';
  }, [defaultConfigurations]);

  // ===========================
  // INITIALIZATION
  // ===========================

  const initializeDefaults = useCallback(() => {
    return initializeDefaultsMutation.mutateAsync();
  }, [initializeDefaultsMutation]);

  return {
    // Data
    fieldConfigurations,
    styleConfigurations,
    defaultConfigurations,
    
    // Loading states
    isLoading: isLoadingConfigs || isLoadingStyles || isLoadingDefaults,
    isLoadingConfigs,
    isLoadingStyles,
    isLoadingDefaults,
    
    // Utility functions
    getFieldOptions,
    getFieldConfiguration,
    generateDynamicSchema,
    getBadgeStyle,
    getDefaultValue,
    
    // Actions
    initializeDefaults,
    isInitializing: initializeDefaultsMutation.isPending
  };
}