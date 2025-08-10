
import { Beneficiary } from '../../domain/entities/Beneficiary';

export interface IBeneficiaryApplicationRepository {
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  findAll(tenantId: string): Promise<Beneficiary[]>;
  findByDocument(type: string, number: string, tenantId: string): Promise<Beneficiary | null>;
  findByStatus(status: string, tenantId: string): Promise<Beneficiary[]>;
  create(beneficiary: Beneficiary): Promise<Beneficiary>;
  update(id: string, beneficiary: Partial<Beneficiary>, tenantId: string): Promise<Beneficiary | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCustomer(customerId: string, tenantId: string): Promise<Beneficiary[]>;
}
