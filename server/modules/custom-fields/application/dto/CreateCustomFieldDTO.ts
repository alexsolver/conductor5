
export interface CreateCustomFieldDTO {
  tenantId: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
