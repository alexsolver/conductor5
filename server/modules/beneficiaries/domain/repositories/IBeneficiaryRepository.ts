/**
 * Beneficiary Repository Interface - Domain Layer
 * 
 * Defines the contract for beneficiary data persistence operations.
 * This interface belongs to the domain layer and should be implemented by infrastructure.
 * 
 * @module IBeneficiaryRepository
 * @version 1.0.0
 * @created 2025-01-12 - Phase 7 Clean Architecture Implementation
 */

import { Beneficiary, BeneficiaryFilterCriteria, BeneficiaryStats } from '../entities/Beneficiary';

export interface IBeneficiaryRepository {
  
  // ===== CORE CRUD OPERATIONS =====
  
  /**
   * Create a new beneficiary
   */
  create(beneficiaryData: Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'>): Promise<Beneficiary>;
  
  /**
   * Find beneficiary by ID with tenant isolation
   */
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  
  /**
   * Update beneficiary by ID
   */
  update(id: string, updates: Partial<Beneficiary>, tenantId: string): Promise<Beneficiary>;
  
  /**
   * Soft delete beneficiary by ID
   */
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // ===== SEARCH AND FILTERING =====
  
  /**
   * Find all beneficiaries with pagination
   */
  findAll(tenantId: string, limit?: number, offset?: number): Promise<Beneficiary[]>;
  
  /**
   * Find beneficiaries by criteria with pagination
   */
  findByFilters(criteria: BeneficiaryFilterCriteria): Promise<{
    beneficiaries: Beneficiary[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  
  /**
   * Search beneficiaries by text across multiple fields
   */
  searchBeneficiaries(tenantId: string, searchTerm: string, limit?: number, offset?: number): Promise<Beneficiary[]>;
  
  // ===== SPECIALIZED QUERIES =====
  
  /**
   * Find all beneficiaries for a tenant
   */
  findByTenant(tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Find beneficiaries by email
   */
  findByEmail(email: string, tenantId: string): Promise<Beneficiary | null>;
  
  /**
   * Find beneficiaries by CPF
   */
  findByCpf(cpf: string, tenantId: string): Promise<Beneficiary | null>;
  
  /**
   * Find beneficiaries by CNPJ
   */
  findByCnpj(cnpj: string, tenantId: string): Promise<Beneficiary | null>;
  
  /**
   * Find beneficiaries by RG
   */
  findByRg(rg: string, tenantId: string): Promise<Beneficiary | null>;
  
  /**
   * Find beneficiaries by customer ID
   */
  findByCustomerId(customerId: string, tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Find beneficiaries by customer code
   */
  findByCustomerCode(customerCode: string, tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Find beneficiaries by city
   */
  findByCity(city: string, tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Find beneficiaries by state
   */
  findByState(state: string, tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Find active beneficiaries
   */
  findActiveBeneficiaries(tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Find inactive beneficiaries
   */
  findInactiveBeneficiaries(tenantId: string): Promise<Beneficiary[]>;
  
  // ===== BULK OPERATIONS =====
  
  /**
   * Create multiple beneficiaries at once
   */
  bulkCreate(beneficiariesData: Omit<Beneficiary, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Beneficiary[]>;
  
  /**
   * Update multiple beneficiaries at once
   */
  bulkUpdate(updates: Array<{ id: string; data: Partial<Beneficiary> }>, tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Soft delete multiple beneficiaries
   */
  bulkDelete(beneficiaryIds: string[], tenantId: string): Promise<boolean>;
  
  /**
   * Change status of multiple beneficiaries
   */
  bulkChangeStatus(beneficiaryIds: string[], isActive: boolean, tenantId: string): Promise<boolean>;
  
  // ===== VALIDATION OPERATIONS =====
  
  /**
   * Check if email already exists for tenant
   */
  emailExists(email: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Check if CPF already exists for tenant
   */
  cpfExists(cpf: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Check if CNPJ already exists for tenant
   */
  cnpjExists(cnpj: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Check if RG already exists for tenant
   */
  rgExists(rg: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  // ===== STATISTICS AND ANALYTICS =====
  
  /**
   * Get beneficiary statistics for tenant
   */
  getBeneficiaryStats(tenantId: string): Promise<BeneficiaryStats>;
  
  /**
   * Get recently created beneficiaries
   */
  getRecentBeneficiaries(tenantId: string, days?: number, limit?: number): Promise<Beneficiary[]>;
  
  /**
   * Count beneficiaries with filters
   */
  count(tenantId: string, filters?: Partial<BeneficiaryFilterCriteria>): Promise<number>;
  
  // ===== RELATIONSHIP OPERATIONS =====
  
  /**
   * Find beneficiaries related to specific customers
   */
  findByCustomerIds(customerIds: string[], tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Associate beneficiary with customer
   */
  associateWithCustomer(beneficiaryId: string, customerId: string, tenantId: string): Promise<boolean>;
  
  /**
   * Remove association between beneficiary and customer
   */
  removeCustomerAssociation(beneficiaryId: string, customerId: string, tenantId: string): Promise<boolean>;
  
  // ===== DATE RANGE QUERIES =====
  
  /**
   * Find beneficiaries created in date range
   */
  findCreatedInRange(startDate: Date, endDate: Date, tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Find beneficiaries updated in date range
   */
  findUpdatedInRange(startDate: Date, endDate: Date, tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Find beneficiaries by birth date range
   */
  findByBirthDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<Beneficiary[]>;
  
  // ===== INTEGRATION OPERATIONS =====
  
  /**
   * Find beneficiaries by integration code
   */
  findByIntegrationCode(integrationCode: string, tenantId: string): Promise<Beneficiary[]>;
  
  /**
   * Update integration code for beneficiary
   */
  updateIntegrationCode(beneficiaryId: string, integrationCode: string, tenantId: string): Promise<boolean>;
  
  // ===== ADMIN OPERATIONS =====
  
  /**
   * Find beneficiaries across all tenants (admin only)
   */
  findAcrossAllTenants(filters: Omit<BeneficiaryFilterCriteria, 'tenantId'>): Promise<{ 
    beneficiaries: (Beneficiary & { tenantName: string })[];
    total: number;
  }>;
}