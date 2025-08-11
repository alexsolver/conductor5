/**
 * Create Beneficiary DTO
 * Clean Architecture - Application Layer
 * Data Transfer Object for creating beneficiaries
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