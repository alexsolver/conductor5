// Repository Interface - Dependency Inversion
import { Customer } from "../entities/Customer"';

export interface ICustomerRepository {
  findById(id: string, tenantId: string): Promise<Customer | null>';
  findByEmail(email: string, tenantId: string): Promise<Customer | null>';
  findByTenant(tenantId: string, limit?: number, offset?: number): Promise<Customer[]>';
  save(customer: Customer): Promise<Customer>';
  update(customer: Customer): Promise<Customer>';
  delete(id: string, tenantId: string): Promise<boolean>';
  countByTenant(tenantId: string): Promise<number>';
}