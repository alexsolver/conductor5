/**
 * Customer Repository Interface
 * Clean Architecture - Domain Layer
 * Defines contract for customer data persistence
 */

import { Customer } from '../entities/Customer';

export interface ICustomerRepository {
  findById(id: string, tenantId: string): Promise<Customer | null>;
  findByEmail(email: string, tenantId: string): Promise<Customer | null>;
  findAll(tenantId: string, filters?: {
    search?: string;
    status?: string;
    customerType?: string;
  }): Promise<Customer[]>;
  create(customer: Customer): Promise<Customer>;
  update(id: string, tenantId: string, data: Partial<Customer>): Promise<Customer>;
  delete(id: string, tenantId: string): Promise<void>;
  findByTenant(tenantId: string): Promise<Customer[]>;
}