
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  tenantId: string;
  entityType: string; // 'ticket', 'customer', 'beneficiary', etc.
  createdAt: Date;
  updatedAt: Date;
}
