/**
 * Create Custom Field DTO
 * Clean Architecture - Application Layer
 */

export interface CreateCustomFieldDTO {
  tenantId: string;
  name: string;
  fieldType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
  isRequired?: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}