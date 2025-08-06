/**
 * DYNAMIC FIELD TYPES - Resolves PROBLEMA 2: VALORES HARD-CODED
 * Provides type definitions and interfaces for the dynamic field system
 */

// ====================
// CORE TYPES
// ====================
export type DynamicFieldType = 
  | 'status' 
  | 'priority' 
  | 'category' 
  | 'subcategory' 
  | 'action' 
  | 'impact' 
  | 'urgency' 
  | 'assignmentGroup'
  | 'callerType'
  | 'contactType'
  | 'beneficiaryType';

export type FieldOptionValue = string;
export type FieldOptionLabel = string;
export type FieldOptionColor = string;

// ====================
// API RESPONSE INTERFACES
// ====================
export interface DynamicFieldOption {
  id: string;
  value: FieldOptionValue;
  label: FieldOptionLabel;
  color?: FieldOptionColor;
  order?: number;
  isActive: boolean;
  tenantId: string;
  companyId?: string;
  fieldName: DynamicFieldType;
  dependsOn?: string;
  parentValue?: string; // For hierarchical fields
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DynamicFieldColor {
  id: string;
  fieldName: DynamicFieldType;
  fieldValue: FieldOptionValue;
  colorHex: FieldOptionColor;
  tenantId: string;
  companyId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DynamicFieldLabel {
  id: string;
  fieldName: DynamicFieldType;
  fieldValue: FieldOptionValue;
  label: FieldOptionLabel;
  locale: string; // 'pt-BR', 'en-US', etc.
  tenantId: string;
  companyId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ====================
// API REQUEST/RESPONSE TYPES
// ====================
export interface GetFieldOptionsRequest {
  fieldName?: DynamicFieldType;
  tenantId?: string;
  companyId?: string;
  dependsOn?: string;
  parentValue?: string;
  includeInactive?: boolean;
}

export interface GetFieldOptionsResponse {
  success: boolean;
  data: DynamicFieldOption[];
  message?: string;
}

export interface GetFieldColorsRequest {
  fieldName: DynamicFieldType;
  tenantId?: string;
  companyId?: string;
}

export interface GetFieldColorsResponse {
  success: boolean;
  data: DynamicFieldColor[];
  message?: string;
}

export interface GetFieldLabelsRequest {
  fieldName: DynamicFieldType;
  locale?: string;
  tenantId?: string;
  companyId?: string;
}

export interface GetFieldLabelsResponse {
  success: boolean;
  data: DynamicFieldLabel[];
  message?: string;
}

// ====================
// HOOK RETURN TYPES
// ====================
export interface UseFieldOptionsReturn {
  options: DynamicFieldOption[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseFieldColorsReturn {
  colors: Map<FieldOptionValue, FieldOptionColor>;
  getFieldColor: (value: FieldOptionValue) => FieldOptionColor | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseFieldLabelsReturn {
  labels: Map<FieldOptionValue, FieldOptionLabel>;
  getFieldLabel: (value: FieldOptionValue) => FieldOptionLabel | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ====================
// COMPONENT PROPS TYPES
// ====================
export interface DynamicBadgeProps {
  fieldName: DynamicFieldType;
  value: FieldOptionValue;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  className?: string;
  showLabel?: boolean;
  locale?: string;
}

export interface DynamicSelectProps {
  fieldName: DynamicFieldType;
  value?: FieldOptionValue;
  onValueChange: (value: FieldOptionValue) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  dependsOn?: string;
  parentValue?: string;
  companyId?: string;
  includeInactive?: boolean;
}

// ====================
// FIELD CONFIGURATION TYPES
// ====================
export interface FieldConfiguration {
  fieldName: DynamicFieldType;
  isHierarchical: boolean;
  dependsOn?: DynamicFieldType;
  isRequired?: boolean;
  allowCustomValues?: boolean;
  defaultValue?: FieldOptionValue;
  validationRules?: string[];
  displaySettings?: {
    showColors: boolean;
    showLabels: boolean;
    sortOrder: 'alphabetical' | 'custom' | 'creation';
  };
}

// ====================
// CACHE TYPES
// ====================
export interface FieldOptionsCache {
  [key: string]: {
    data: DynamicFieldOption[];
    timestamp: number;
    expiry: number;
  };
}

export interface FieldColorsCache {
  [fieldName: string]: {
    data: Map<FieldOptionValue, FieldOptionColor>;
    timestamp: number;
    expiry: number;
  };
}

export interface FieldLabelsCache {
  [key: string]: {
    data: Map<FieldOptionValue, FieldOptionLabel>;
    timestamp: number;
    expiry: number;
  };
}

// ====================
// VALIDATION TYPES
// ====================
export interface DynamicFieldValidation {
  fieldName: DynamicFieldType;
  value: FieldOptionValue;
  isValid: boolean;
  availableOptions: FieldOptionValue[];
  errorMessage?: string;
}

// ====================
// CONSTANTS
// ====================
export const FIELD_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const DEFAULT_FIELD_COLORS: Record<string, string> = {
  // Status colors
  'new': '#6b7280',
  'open': '#3b82f6',
  'in_progress': '#f59e0b',
  'resolved': '#10b981',
  'closed': '#6b7280',
  
  // Priority colors
  'low': '#10b981',
  'medium': '#f59e0b',
  'high': '#ef4444',
  'critical': '#dc2626',
  
  // Impact colors
  'impact_low': '#10b981',
  'impact_medium': '#f59e0b',
  'impact_high': '#ef4444',
  'impact_critical': '#dc2626',
  
  // Default fallback
  'default': '#6b7280'
};

export const HIERARCHICAL_FIELDS: DynamicFieldType[] = ['category', 'subcategory', 'action'];
export const REQUIRED_FIELDS: DynamicFieldType[] = ['status', 'priority'];
export const MULTI_TENANT_FIELDS: DynamicFieldType[] = ['category', 'subcategory', 'action', 'assignmentGroup'];