
/**
 * Internal Form Entity - Phase 10 Implementation
 * 
 * Entidade de domínio para formulários internos
 * Define a estrutura e regras de negócio dos formulários
 * 
 * @module InternalForm
 * @version 1.0.0
 * @created 2025-09-24 - Phase 10 Clean Architecture Implementation
 */

export interface InternalForm {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  fields: FormField[];
  actions: FormAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox' | 'date';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: FieldValidation;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

export interface FormAction {
  id: string;
  type: 'email' | 'webhook' | 'ticket' | 'approval';
  config: ActionConfig;
  order: number;
}

export interface ActionConfig {
  [key: string]: any;
}

export interface FormSubmission {
  id: string;
  formId: string;
  tenantId: string;
  submittedBy: string;
  submittedByName?: string; // ✅ Nome do usuário que enviou
  submittedAt: Date;
  data: Record<string, any>;
  status: 'submitted' | 'in_approval' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface FormCategory {
  id: string;
  tenantId: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
}
