
/**
 * Internal Form Repository Interface - Phase 10 Implementation
 * 
 * Interface do repositório para operações de persistência de Internal Forms
 * Define contratos para operações de dados sem dependências externas
 * 
 * @module IInternalFormRepository
 * @version 1.0.0
 * @created 2025-09-24 - Phase 10 Clean Architecture Implementation
 */

import { InternalForm, FormSubmission, FormCategory } from '../entities/InternalForm';

export interface InternalFormFilters {
  tenantId: string;
  category?: string;
  isActive?: boolean;
  search?: string;
  createdBy?: string;
}

export interface IInternalFormRepository {
  // ===== CRUD OPERATIONS =====
  
  /**
   * Create a new internal form
   */
  create(form: InternalForm): Promise<InternalForm>;
  
  /**
   * Find form by ID
   */
  findById(id: string, tenantId: string): Promise<InternalForm | null>;
  
  /**
   * Find all forms with optional filtering
   */
  findAll(filters: InternalFormFilters): Promise<InternalForm[]>;

  /**
   * Find forms by action type
   */
  findByActionType(actionType: string, tenantId: string): Promise<InternalForm[]>;
  
  /**
   * Update form by ID
   */
  update(id: string, tenantId: string, updateData: Partial<InternalForm>): Promise<InternalForm | null>;
  
  /**
   * Delete form (soft delete)
   */
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // ===== SUBMISSION OPERATIONS =====
  
  /**
   * Create form submission
   */
  createSubmission(submission: FormSubmission): Promise<FormSubmission>;
  
  /**
   * Find submissions by form ID
   */
  findSubmissions(formId: string, tenantId: string): Promise<FormSubmission[]>;
  
  /**
   * Find all submissions for tenant
   */
  findAllSubmissions(tenantId: string): Promise<FormSubmission[]>;
  
  // ===== CATEGORY OPERATIONS =====
  
  /**
   * Get all categories for tenant
   */
  getCategories(tenantId: string): Promise<FormCategory[]>;
  
  /**
   * Create category
   */
  createCategory(category: FormCategory): Promise<FormCategory>;
}
