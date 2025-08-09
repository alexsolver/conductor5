
import { Beneficiary } from '../entities/Beneficiary';

export interface FindOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface IBeneficiaryRepository {
  create(beneficiary: Beneficiary): Promise<Beneficiary>;
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  findByTenant(tenantId: string, options?: FindOptions): Promise<Beneficiary[]>;
  countByTenant(tenantId: string, search?: string): Promise<number>;
  update(beneficiary: Beneficiary): Promise<Beneficiary>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
