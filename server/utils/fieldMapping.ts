/**
 * UNIFIED FIELD MAPPING - Resolves PROBLEMA 3: MAPEAMENTO DE CAMPOS
 * Centralized Frontend-Backend field mapping with automatic transformation
 * Updated to work with ticket-schema-master.ts
 */

import { DynamicFieldType } from '@shared/dynamic-field-types';

export interface TicketFieldMapping {
  // Frontend (camelCase) -> Backend (snake_case)
  callerId: 'caller_id';
  beneficiaryId: 'beneficiary_id';
  assignedToId: 'assigned_to_id';
  customerCompanyId: 'customer_company_id'; // Company reference - maps to customer_company_id
  responsibleId: 'responsible_id';
  locationId: 'location_id';
  // Additional dynamic fields
  assignmentGroup: 'assignment_group';
  contactType: 'contact_type';
  callerType: 'caller_type';
  beneficiaryType: 'beneficiary_type';
}

export const FRONTEND_TO_BACKEND_MAPPING: Record<string, string> = {
  // ===== CORE ID MAPPINGS =====
  callerId: 'caller_id',
  beneficiaryId: 'beneficiary_id',
  assignedToId: 'assigned_to_id',
  customerCompanyId: 'customer_company_id', // Company reference - maps to customer_company_id
  responsibleId: 'responsible_id',
  
  // ===== LOCATION MAPPING (CRITICAL FIX) =====
  location: 'location', // Text field, not FK
  locationId: 'location_id', // For compatibility if needed
  
  // ===== METADATA FIELDS =====
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  tenantId: 'tenant_id',
  
  // ===== BUSINESS FIELDS =====
  businessImpact: 'business_impact',
  contactType: 'contact_type',
  callerType: 'caller_type',
  beneficiaryType: 'beneficiary_type',
  assignmentGroup: 'assignment_group',
  
  // ===== TEMPLATE & ENVIRONMENT FIELDS =====
  templateAlternative: 'template_alternative',
  templateName: 'template_name',
  callerNameResponsible: 'caller_name_responsible',
  callType: 'call_type',
  callUrl: 'call_url',
  callNumber: 'call_number',
  environmentError: 'environment_error',
  groupField: 'group_field',
  serviceVersion: 'service_version',
  costCenter: 'cost_center',
  
  // ===== TIME TRACKING FIELDS =====
  estimatedHours: 'estimated_hours',
  actualHours: 'actual_hours',
  dueDate: 'due_date',
  
  // ===== LINKING FIELDS =====
  linkTicketNumber: 'link_ticket_number',
  linkType: 'link_type',
  linkComment: 'link_comment'
};

export const BACKEND_TO_FRONTEND_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(FRONTEND_TO_BACKEND_MAPPING).map(([key, value]) => [value, key])
);

/**
 * Converte objeto do frontend (camelCase) para backend (snake_case)
 * Enhanced with validation and dynamic field support
 */
export function mapFrontendToBackend(frontendData: any): any {
  const backendData: any = {};

  for (const [frontendKey, value] of Object.entries(frontendData)) {
    // Skip undefined/null values
    if (value === undefined || value === null) {
      continue;
    }
    
    const backendKey = FRONTEND_TO_BACKEND_MAPPING[frontendKey] || frontendKey;
    
    // Special handling for array fields
    if (Array.isArray(value)) {
      backendData[backendKey] = value;
    }
    // Special handling for date fields
    else if (frontendKey.includes('Date') || frontendKey.includes('At')) {
      backendData[backendKey] = value;
    }
    // Special handling for dynamic field values
    else if (isDynamicField(frontendKey) && typeof value === 'string') {
      backendData[backendKey] = value;
    }
    // Default mapping
    else {
      backendData[backendKey] = value;
    }
  }

  return backendData;
}

/**
 * Converte objeto do backend (snake_case) para frontend (camelCase)
 * Enhanced with validation and dynamic field support
 */
export function mapBackendToFrontend(backendData: any): any {
  const frontendData: any = {};

  for (const [backendKey, value] of Object.entries(backendData)) {
    // Skip undefined/null values
    if (value === undefined || value === null) {
      continue;
    }
    
    const frontendKey = BACKEND_TO_FRONTEND_MAPPING[backendKey] || toCamelCase(backendKey);
    
    // Special handling for JSON fields that come as strings
    if (typeof value === 'string' && (backendKey === 'followers' || backendKey === 'tags')) {
      try {
        frontendData[frontendKey] = JSON.parse(value);
      } catch {
        frontendData[frontendKey] = [];
      }
    }
    // Default mapping
    else {
      frontendData[frontendKey] = value;
    }
  }

  return frontendData;
}

/**
 * Normaliza nomes de campos para snake_case (padrão do banco)
 */
export function normalizeFieldName(fieldName: string): string {
  return fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Converte snake_case para camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Helper function to check if a field is a dynamic field
 */
export function isDynamicField(fieldName: string): boolean {
  const dynamicFields: DynamicFieldType[] = [
    'status', 'priority', 'category', 'subcategory', 'action', 
    'impact', 'urgency', 'assignmentGroup', 'callerType', 
    'contactType', 'beneficiaryType'
  ];
  return dynamicFields.includes(fieldName as DynamicFieldType);
}

/**
 * Validates field mapping consistency
 */
export function validateFieldMapping(frontendData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for critical field mappings
  if (frontendData.customerCompanyId && !frontendData.customerCompanyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    errors.push('customerCompanyId must be a valid UUID');
  }
  
  if (frontendData.callerId && !frontendData.callerId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    errors.push('callerId must be a valid UUID');
  }
  
  if (frontendData.beneficiaryId && !frontendData.beneficiaryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    errors.push('beneficiaryId must be a valid UUID');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Enhanced field metadata mapping
export const TICKET_FIELD_MAPPING = {
  // Dynamic Fields Configuration
  status: {
    label: 'Status',
    type: 'dynamic',
    fieldType: 'status' as DynamicFieldType,
    api_endpoint: '/api/ticket-config/field-options',
    hasColors: true,
    hasLabels: true,
    isRequired: true,
    description: 'Status atual do ticket'
  },
  priority: {
    label: 'Prioridade',
    type: 'dynamic',
    fieldType: 'priority' as DynamicFieldType,
    api_endpoint: '/api/ticket-config/field-options',
    hasColors: true,
    hasLabels: true,
    isRequired: true,
    description: 'Prioridade do ticket'
  },
  category: {
    label: 'Categoria',
    type: 'dynamic',
    fieldType: 'category' as DynamicFieldType,
    api_endpoint: '/api/ticket-config/field-options',
    hasColors: true,
    hasLabels: true,
    isHierarchical: true,
    description: 'Categoria principal do ticket'
  },
  subcategory: {
    label: 'Subcategoria',
    type: 'dynamic',
    fieldType: 'subcategory' as DynamicFieldType,
    api_endpoint: '/api/ticket-config/field-options',
    hasColors: true,
    hasLabels: true,
    dependsOn: 'category',
    isHierarchical: true,
    description: 'Subcategoria do ticket'
  },
  action: {
    label: 'Ação',
    type: 'dynamic',
    fieldType: 'action' as DynamicFieldType,
    api_endpoint: '/api/ticket-config/field-options',
    hasColors: true,
    hasLabels: true,
    dependsOn: 'subcategory',
    isHierarchical: true,
    description: 'Ação específica do ticket'
  },
  assignmentGroup: {
    label: 'Grupo de Atribuição',
    type: 'dynamic',
    fieldType: 'assignmentGroup' as DynamicFieldType,
    api_endpoint: '/api/ticket-config/field-options',
    hasColors: false,
    hasLabels: true,
    description: 'Grupo responsável pela atribuição do ticket'
  },
  impact: {
    label: 'Impacto',
    type: 'dynamic',
    fieldType: 'impact' as DynamicFieldType,
    api_endpoint: '/api/ticket-config/field-options',
    hasColors: true,
    hasLabels: true,
    description: 'Impacto do ticket nos negócios'
  },
  urgency: {
    label: 'Urgência',
    type: 'dynamic',
    fieldType: 'urgency' as DynamicFieldType,
    api_endpoint: '/api/ticket-config/field-options',
    hasColors: true,
    hasLabels: true,
    description: 'Urgência de resolução do ticket'
  }
};