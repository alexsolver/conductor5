
import { Beneficiary } from '../entities/Beneficiary';

export interface IBeneficiaryRepository {
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  findAll(tenantId: string): Promise<Beneficiary[]>;
  findByCustomerId(customerId: string, tenantId: string): Promise<Beneficiary[]>;
  save(beneficiary: Beneficiary): Promise<void>;
  update(beneficiary: Beneficiary): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}
