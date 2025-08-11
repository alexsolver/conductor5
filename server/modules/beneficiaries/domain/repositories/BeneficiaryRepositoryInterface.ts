/**
 * BeneficiaryRepositoryInterface - Clean Architecture Domain Layer
 * Resolves violations: Missing repository interfaces in Domain layer
 */

import { Beneficiary } from '../entities/Beneficiary';

export interface BeneficiaryFilters {
  search?: string;
  customerId?: string;
  active?: boolean;
}

export interface BeneficiaryRepositoryInterface {
  save(beneficiary: Beneficiary): Promise<void>;
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  findByTenant(tenantId: string, filters?: BeneficiaryFilters): Promise<Beneficiary[]>;
  update(beneficiary: Beneficiary): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}