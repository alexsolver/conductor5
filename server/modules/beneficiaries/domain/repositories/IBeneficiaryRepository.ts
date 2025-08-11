
/**
 * DOMAIN REPOSITORY INTERFACE - BENEFICIARY
 * Clean Architecture: Domain layer interface for repository
 */

import { Beneficiary } from '../entities/Beneficiary';

export interface IBeneficiaryRepository {
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  findByEmail(email: string, tenantId: string): Promise<Beneficiary | null>;
  findByTenant(tenantId: string, filters?: {
    search?: string;
    customerId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    beneficiaries: Beneficiary[];
    total: number;
    totalPages: number;
  }>;
  save(beneficiary: Beneficiary): Promise<void>;
  update(beneficiary: Beneficiary): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
  existsByEmail(email: string, tenantId: string, excludeId?: string): Promise<boolean>;
  findByCustomer(customerId: string, tenantId: string): Promise<Beneficiary[]>;
}
