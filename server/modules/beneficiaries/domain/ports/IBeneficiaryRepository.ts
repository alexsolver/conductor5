
<line_number>1</line_number>
import { Beneficiary } from '../entities/Beneficiary';

export interface IBeneficiaryRepository {
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  findAll(tenantId: string): Promise<Beneficiary[]>;
  create(beneficiary: Beneficiary): Promise<Beneficiary>;
  update(id: string, beneficiary: Partial<Beneficiary>, tenantId: string): Promise<Beneficiary | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCustomerId(customerId: string, tenantId: string): Promise<Beneficiary[]>;
}
import { Beneficiary } from '../entities/Beneficiary';

export interface IBeneficiaryRepository {
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  findAll(tenantId: string): Promise<Beneficiary[]>;
  findByEmail(email: string, tenantId: string): Promise<Beneficiary | null>;
  create(beneficiary: Beneficiary): Promise<Beneficiary>;
  update(id: string, beneficiary: Partial<Beneficiary>, tenantId: string): Promise<Beneficiary | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { Beneficiary } from '../entities/Beneficiary';

export interface IBeneficiaryRepository {
  findAll(tenantId: string): Promise<Beneficiary[]>;
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  create(beneficiary: Beneficiary): Promise<Beneficiary>;
  update(id: string, beneficiary: Partial<Beneficiary>, tenantId: string): Promise<Beneficiary | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByDocument(document: string, tenantId: string): Promise<Beneficiary | null>;
  findByStatus(status: string, tenantId: string): Promise<Beneficiary[]>;
}
