/**
 * Customer Repository Interface (Port)
 * Clean Architecture - Domain Layer
 */

import { Customer } from '../entities/Customer';

export interface CustomerFilter {
  tenantId: string;
  search?: string;
  active?: boolean;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export interface ICustomerRepository {
  findById(id: string, tenantId: string): Promise<Customer | null>;
  findByEmail(email: string, tenantId: string): Promise<Customer | null>;
  findMany(filter: CustomerFilter): Promise<Customer[]>;
  save(customer: Customer): Promise<Customer>;
  delete(id: string, tenantId: string): Promise<boolean>;
  count(filter: Omit<CustomerFilter, 'limit' | 'offset'>): Promise<number>;
}