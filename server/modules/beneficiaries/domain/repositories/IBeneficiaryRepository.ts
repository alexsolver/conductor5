/**
 * Beneficiary Repository Interface
 * Clean Architecture - Domain Layer
 * Defines contract for beneficiary data persistence
 */

import { Beneficiary } from '../entities/Beneficiary';

export interface IBeneficiaryRepository {
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  findByEmail(email: string, tenantId: string): Promise<Beneficiary | null>;
  findAll(tenantId: string, filters?: {
    search?: string;
    status?: string;
  }): Promise<Beneficiary[]>;
  create(beneficiary: Beneficiary): Promise<Beneficiary>;
  update(id: string, tenantId: string, data: Partial<Beneficiary>): Promise<Beneficiary>;
  delete(id: string, tenantId: string): Promise<void>;
  findByTenant(tenantId: string): Promise<Beneficiary[]>;
}