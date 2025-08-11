/**
 * Create Beneficiary DTO
 * Clean Architecture - Application Layer
 * Data Transfer Object for creating beneficiaries
 */

/**
 * CreateBeneficiaryDTO - Clean Architecture Application Layer
 * Data Transfer Object for beneficiary creation
 */
export interface CreateBeneficiaryDTO {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
}